import * as THREE from 'three';

export function createStorageAreaLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;

    const ctx = canvas.getContext('2d')!;
    ctx.font = '28px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = text.split('\n');
    const lineHeight = 25;
    lines.forEach((line, i) => {
        ctx.fillText(
            line,
            canvas.width / 2,
            canvas.height / 2 - (lines.length - 1) * lineHeight / 2 + i * lineHeight
        );
    });


    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const label = new THREE.Sprite(labelMat);

    label.scale.set(2.5, 0.8, 1);
    label.position.set(0, 1.2, 0);

    return label;
}
