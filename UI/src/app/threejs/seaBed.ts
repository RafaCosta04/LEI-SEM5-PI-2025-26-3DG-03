import * as THREE from 'three';

export function createSeaBed(width: number ,lenght: number, centerX: number ): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, lenght, 10);
  
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x1a242d, 
    roughness: 0.9,
    metalness: 0.0,
  });

  const seabed = new THREE.Mesh(geometry, material);
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.y = 5;
  seabed.position.z = 75;
  seabed.position.x = centerX; 

  seabed.castShadow = false;
  seabed.receiveShadow = true;

  return seabed;
}
