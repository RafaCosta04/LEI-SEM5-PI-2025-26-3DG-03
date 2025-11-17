import { Water } from 'three/examples/jsm/objects/Water.js';
import * as THREE from 'three';

export function createSea(width: number ,lenght: number, centerX: number ): THREE.Mesh {
    const waterGeometry = new THREE.PlaneGeometry(width, lenght);

    const waterNormals = new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg',(texture) => {texture.wrapS = texture.wrapT = THREE.RepeatWrapping;});

    
    const water = new Water(waterGeometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: waterNormals,
        sunDirection: new THREE.Vector3(0, 0, 1).normalize(),
        sunColor: 0xffffff,
        waterColor: 0x1ca3ec,
        distortionScale: 1.8,
        fog: false,
        clipBias: 0.02
    });




    water.material.uniforms['alpha'].value = 0.5;
    
     
    water.material.transparent = true;


    water.renderOrder = -1;



    water.rotation.x = -Math.PI / 2;

    water.position.y = 21;
    water.position.z = 75;
    water.position.x = centerX;


    water.castShadow = true;
    water.receiveShadow = true;
    return water;
}

