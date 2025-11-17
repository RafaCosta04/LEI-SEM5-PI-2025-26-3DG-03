import * as THREE from "three";


export function createPortStructure()
{
    const portStructure = new THREE.Group();
    
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.6,
        metalness: 0.1
    });
    
    const dockGeometry = new THREE.BoxGeometry(400, 30, 200);
    const dockMesh = new THREE.Mesh(dockGeometry, material);
    dockMesh.position.y = 20;
    dockMesh.position.z = -75;
    dockMesh.position.x = -200;
    dockMesh.castShadow = true;
    dockMesh.receiveShadow = true;
    portStructure.add(dockMesh);


    return portStructure;
}