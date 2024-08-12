import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function generate3DModel(
  pixelGroupedByColors,
  { imgSize, pixelSize, colorLayerHeight },
  canvasRef
) {
  const canvas = canvasRef.current;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    imgSize.width / imgSize.height,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(imgSize.width, imgSize.height);

  // Add orbit controls for zooming and rotating
  const controls = new OrbitControls(camera, renderer.domElement);

  const colorKeys = Object.keys(pixelGroupedByColors);

  colorKeys.forEach((color, index) => {
    if (index === 0) {
      const material = new THREE.MeshBasicMaterial({ color: `#${color}` });
      const layer = new THREE.Group();

      const geometry = new THREE.BoxGeometry(
        imgSize.width * pixelSize,
        imgSize.height * pixelSize,
        colorLayerHeight
      );
      const pixelMesh = new THREE.Mesh(geometry, material);
      // TODO 这里存在问题，导致画布只能设置和图片一样大
      pixelMesh.position.set(0, 0, 0);
      layer.add(pixelMesh);
      scene.add(layer);
      return;
    }

    const material = new THREE.MeshBasicMaterial({ color: `#${color}` });
    const layer = new THREE.Group();

    let layerPoints = [];
    for (let i = 0; i <= colorKeys.length - 1 - index; i++) {
      layerPoints = layerPoints.concat(
        pixelGroupedByColors[colorKeys[colorKeys.length - 1 - i]]
      );
    }

    layerPoints.sort((a, b) => {
      if (a.y === b.y) return a.x - b.x; // y 相同，按 x 排序
      return a.y - b.y; // 按 y 排序
    });
    let countX = 0;
    let startX = layerPoints[0].x;
    let startY = layerPoints[0].y;
    layerPoints.forEach(({ x, y }, pointIndex) => {
      const prevLayerPoint = layerPoints[pointIndex - 1];
      const prevX = prevLayerPoint?.x;
      const prevY = prevLayerPoint?.y;
      if (!prevLayerPoint) {
        countX++;
      } else if (prevY === y && prevX + 1 === x) {
        countX++;
      } else {
        const geometry = new THREE.BoxGeometry(
          pixelSize * countX,
          pixelSize,
          colorLayerHeight
        );

        const pixelMesh = new THREE.Mesh(geometry, material);

        pixelMesh.position.set(
          startX * pixelSize +
            (countX * pixelSize) / 2 -
            (canvas.width * pixelSize) / 2,
          (canvas.height * pixelSize) / 2 - startY * pixelSize,
          index * colorLayerHeight
        );
        layer.add(pixelMesh);

        countX = 1;
        startX = x;
        startY = y;
      }
    });

    if (countX > 0) {
      const geometry = new THREE.BoxGeometry(
        pixelSize * countX,
        pixelSize,
        colorLayerHeight
      );

      const pixelMesh = new THREE.Mesh(geometry, material);

      pixelMesh.position.set(
        startX * pixelSize +
          (countX * pixelSize) / 2 -
          (canvas.width * pixelSize) / 2,
        (canvas.height * pixelSize) / 2 - startY * pixelSize,
        index * colorLayerHeight
      );
      layer.add(pixelMesh);
    }

    scene.add(layer);
  });

  // Step 4: Adjust the camera
  camera.position.z = 2;
  camera.position.y = (canvas.height * pixelSize) / 2;
  camera.position.x = -(canvas.width * pixelSize) / 2;

  // Render the scene
  function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    renderer.render(scene, camera);
  }
  animate();

  return { renderer, scene };
}
