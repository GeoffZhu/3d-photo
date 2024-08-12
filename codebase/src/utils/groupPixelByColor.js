import * as THREE from 'three';

export default function groupPixelByColor(canvas, ctx) {
  const pixelData = [];
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelGroupedByColors = {};
  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      const index = (y * imageData.width + x) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      const a = imageData.data[index + 3];
      if (a > 0) {
        // only consider non-transparent pixels
        const color = new THREE.Color(r / 255, g / 255, b / 255).getHexString();
        pixelData.push({ x, y, color });

        if (!pixelGroupedByColors[color]) {
          pixelGroupedByColors[color] = [];
        }
        pixelGroupedByColors[color].push({ x, y });
      }
    }
  }

  return pixelGroupedByColors;
}