import './App.css';
import { useMemo, useRef, useState } from 'react';

import getColorsFromImage from './utils/groupPixelByColor';
import { getFileDataURL } from './utils/getFileBuffer';

import exportSTL from './utils/exportSTL';
import scaleImage from './utils/scaleImage';
import { generate3DModel } from './utils/generate3dModel';

function App() {
  const canvasRef = useRef(null);
  const threeJSInstanceRef = useRef(null);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [pixelSize, setPixelSize] = useState(0.2); // Nozzle Size
  const [colorCount, setColorCount] = useState(4);
  const [colorLayer, setColorLayer] = useState(2);

  const colorLayerHeight = useMemo(() => {
    return layerHeight * colorLayer;
  }, [layerHeight, colorLayer]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (threeJSInstanceRef.current) {
      threeJSInstanceRef.current.renderer.dispose();
    }

    const fileDataUrl = await getFileDataURL(file);
    const {
      canvas: canvas2D,
      ctx: ctx2D,
      size: imgSize,
    } = await scaleImage(fileDataUrl, colorCount);

    const pixelGroupedByColors = getColorsFromImage(canvas2D, ctx2D);
    
    // 创建模型
    const { renderer, scene } = generate3DModel(
      pixelGroupedByColors,
      { imgSize, pixelSize, colorLayerHeight },
      canvasRef
    );
    threeJSInstanceRef.current = { renderer, scene };
  };

  const handleExportSTL = () => {
    if (threeJSInstanceRef.current) {
      exportSTL(threeJSInstanceRef.current.scene);
    } else {
      alert('请先上传图片');
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center p-8 box-border">
      <div className="flex flex-row justify-between w-3/6">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">切片层高 Layer Height</span>
            <span className="label-text-alt">毫米 mm</span>
          </div>
          <input
            type="number"
            value={layerHeight}
            onChange={(e) => setLayerHeight(Number(e.target.value))}
            placeholder="切片层高 Layer Height"
            className="input input-bordered w-full max-w-xs"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">喷嘴宽度 Nozzle Size</span>
            <span className="label-text-alt">毫米 mm</span>
          </div>
          <input
            type="number"
            value={pixelSize}
            onChange={(e) => setPixelSize(Number(e.target.value))}
            placeholder="喷嘴宽度 Nozzle Size"
            className="input input-bordered w-full max-w-xs"
          />
        </label>
      </div>
      <div className="flex flex-row justify-between w-3/6 mt-4">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">颜色个数 Color Count</span>
            <span className="label-text-alt">个</span>
          </div>
          <input
            type="number"
            value={colorCount}
            onChange={(e) => setColorCount(Number(e.target.value))}
            placeholder="单颜色层数 Color Layer"
            className="input input-bordered w-full max-w-xs "
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">每种颜色层数 Color Layer</span>
            <span className="label-text-alt">层</span>
          </div>
          <input
            type="number"
            value={colorLayer}
            onChange={(e) => setColorLayer(Number(e.target.value))}
            placeholder="单颜色层数 Color Layer"
            className="input input-bordered w-full max-w-xs "
          />
        </label>
      </div>
      <div className="flex flex-row justify-center mt-8">
        <input
          type="file"
          className="file-input file-input-bordered w-full max-w-xs"
          onChange={handleFileChange}
        />
        <button className="btn btn-accent ml-24" onClick={handleExportSTL}>
          导出 STL
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="mt-8 bg-gray-100 rounded-sm"
        width={800}
        height={600}
      ></canvas>
    </div>
  );
}

export default App;
