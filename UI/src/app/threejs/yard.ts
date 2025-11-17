import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function createYard(): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      'assets/models/yard.glb',
      (gltf) => {
        const yard = gltf.scene;

        // MESMA escala e estilo que o warehouse
        yard.scale.set(1, 1, 1);
        yard.position.set(0, 0, 0);
        yard.rotation.y = 0;

        yard.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              child.material.metalness = 0.1;
              child.material.roughness = 0.8;
            }

            child.geometry?.computeVertexNormals?.();
          }
        });

        resolve(yard);
      },
      undefined,
      (err) => reject(err)
    );
  });
}
