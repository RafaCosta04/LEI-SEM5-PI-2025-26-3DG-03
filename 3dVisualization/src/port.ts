import * as THREE from "three";

export default class PortScene extends THREE.Scene 
{
    private cube?: THREE.Mesh;

    initialize()
    {
        const geometry = new THREE.BoxGeometry()
        const material = new THREE.MeshPhongMaterial({ color: 0xFFAD00 })

        this.cube = new THREE.Mesh(geometry, material)
        this.cube.position.z = -5
        this.cube.position.y = -1

        this.add(this.cube)


        const light = new THREE.DirectionalLight(0xffffff, 1)
        light.position.set(0, 4, 2)

        this.add(light)
    }

    update()
    {
        if (!this.cube) return
        this.cube.rotation.x += 0.01
        this.cube.rotation.y += 0.01
    }

}