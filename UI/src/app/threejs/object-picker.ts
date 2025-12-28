import * as THREE from "three";
import { PermissionService } from '../../app/services/permission.service';
import { ElementInfoService } from '../../app/services/element-info.service';
import { Injectable, EventEmitter } from '@angular/core';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';


export interface PickableObject {
  mesh: THREE.Object3D;
  type: 'dock' | 'storage-area' | 'vessel' | 'crane';
  name: string;
  centerPoint: THREE.Vector3;
  userData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ObjectPickerService {
  public selectionChanged: EventEmitter<PickableObject | null> = new EventEmitter<PickableObject | null>();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private pickableObjects: PickableObject[] = [];
  private selectedObject: PickableObject | null = null;
  private originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();

  constructor(
    private permissionService: PermissionService,
    private elementInfoService: ElementInfoService
  ) {}

  registerPickableObject(obj: PickableObject) {
    obj.mesh.updateMatrixWorld(true);
    this.pickableObjects.push(obj);
    obj.mesh.userData['pickable'] = true;
    obj.mesh.userData['type'] = obj.type;
    obj.mesh.userData['name'] = obj.name;
    obj.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  clearPickableObjects() {
    this.pickableObjects = [];
  }

  pick(
    event: MouseEvent,
    camera: THREE.Camera,
    container: HTMLElement
  ): PickableObject | null {
    const rect = container.getBoundingClientRect();

    // Converter coordenadas do rato para NDC (Normalized Device Coordinates)
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);

    // Coletar todos os meshes válidos dos objetos pickable
    const validMeshes: THREE.Mesh[] = [];
    this.pickableObjects.forEach(obj => {
      obj.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry && child.material) {
          validMeshes.push(child);
        }
      });
    });

    // Fazer raycast individualmente em cada mesh para evitar erros
    const intersects: THREE.Intersection[] = [];
    for (const mesh of validMeshes) {
      try {
        const meshIntersects = this.raycaster.intersectObject(mesh, false);
        intersects.push(...meshIntersects);
      } catch {
        // Ignorar meshes problemáticos silenciosamente
      }
    }

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const pickedObj = this.findPickableObject(hitObject);

      if (pickedObj && this.canUserPick(pickedObj)) {
        return pickedObj;
      }
    }

    return null;
  }

  private findPickableObject(mesh: THREE.Object3D): PickableObject | null {
    // Percorrer hierarquia até encontrar objeto com userData.pickable
    let current: THREE.Object3D | null = mesh;
    while (current) {
      const found = this.pickableObjects.find(obj => obj.mesh === current);
      if (found) return found;
      current = current.parent;
    }
    return null;
  }

  private canUserPick(obj: PickableObject): boolean {
    const userRole = this.permissionService.getRole();

    // Facilities (dock, storage-area) - qualquer user autenticado
    if (obj.type === 'dock' || obj.type === 'storage-area') {
      return userRole !== null;
    }

    // Vessels e Cranes - apenas LogisticOperator e PortAuthorityOfficer
    if (obj.type === 'vessel' || obj.type === 'crane') {
      return userRole === 'LogisticOperator' ||
             userRole === 'PortAuthorityOfficer' //||
 //            userRole === 'Admin';
    }

    return false;
  }

  highlightObject(obj: PickableObject | null) {
    // Remover highlight anterior
    if (this.selectedObject) {
      this.removeHighlight(this.selectedObject.mesh);
    }

    if (obj) {
      this.applyHighlight(obj.mesh);
      this.selectedObject = obj;
      // Update element info service
      this.elementInfoService.setCurrentElement(obj);
      this.selectionChanged.emit(obj);
    } else {
      this.selectedObject = null;
      this.elementInfoService.setCurrentElement(null);
      this.selectionChanged.emit(null);
    }
  }

  private applyHighlight(mesh: THREE.Object3D) {
    const selectedType = mesh.userData['type'];

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Verificar se o mesh pertence ao objeto selecionado
        // Não aplicar se for um objeto filho de tipo diferente (ex: crane dentro de dock)
        let parent = child.parent;
        let isDifferentType = false;

        while (parent && parent !== mesh) {
          if (parent.userData['type'] && parent.userData['type'] !== selectedType) {
            isDifferentType = true;
            break;
          }
          parent = parent.parent;
        }

        if (isDifferentType) return;

        // Guardar material original
        if (!this.originalMaterials.has(child)) {
          this.originalMaterials.set(child, child.material);
        }

        // Aplicar highlight minimalista
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        const highlightedMaterials = materials.map(mat =>
          mat.clone ? mat.clone() : mat
        );

        highlightedMaterials.forEach(mat => {
          if ('emissive' in mat) {
            // Efeito sutil: apenas um leve brilho branco
            (mat as any).emissive = new THREE.Color(0xffffff);
            (mat as any).emissiveIntensity = 0.15;
          }
          // Aumentar ligeiramente o brilho
          if ('color' in mat) {
            (mat as any).color.lerp(new THREE.Color(0xffffff), 0.2);
          }
        });

        child.material = highlightedMaterials.length === 1
          ? highlightedMaterials[0]
          : highlightedMaterials;
      }
    });
  }

  private removeHighlight(mesh: THREE.Object3D) {
    mesh.traverse((child) => {
      const original = this.originalMaterials.get(child);
      if (original && child instanceof THREE.Mesh) {
        child.material = original;
        this.originalMaterials.delete(child);
      }
    });
  }

  getSelectedObject(): PickableObject | null {
    return this.selectedObject;
  }
}
