import { STLExporter } from 'three/addons/exporters/STLExporter.js';

export default function exportSTL(scene) {
  const exporter = new STLExporter();
  const stlData = exporter.parse(scene, { binary: true });

  const blob = new Blob([stlData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'model.stl';
  link.click();
  URL.revokeObjectURL(url);
}
