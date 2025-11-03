import * as THREE from "three";
import PortScene from "./port";


export function createScene(){
    const window = document.getElementById('render-target')
    const scene = new PortScene()
    scene.background = new THREE.Color(0x777777)

    const camera = new THREE.PerspectiveCamera(71, window!.offsetWidth / window!.offsetHeight, 0.1, 1000)
    
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window!.offsetWidth, window!.offsetHeight)
    window?.appendChild(renderer.domElement)

    scene.initialize()

    function draw(){
        
        try {
            (scene as any).update?.()
        } catch {}
        renderer.render(scene, camera)
    }


    function start(){
        renderer.setAnimationLoop(draw)
    }

    function stop(){
        renderer.setAnimationLoop(null)
    }

    return {
        start,
        stop
    }
}

