import KMeans from 'kmeans-js';
import ColorThief from 'colorthief';

const colorThief = new ColorThief();
// 1 毫米 = 3.78 像素
const MM_TO_PX = 3.78;
// 最大宽高为 160mm
const MAX_SIZE_MM = 160;
const MAX_SIZE_PX = MAX_SIZE_MM * MM_TO_PX;
// 每个像素块的宽度为 0.2mm，转换为像素
const PIXEL_BLOCK_SIZE_MM = 0.2;
const PIXEL_BLOCK_SIZE_PX = Math.round(PIXEL_BLOCK_SIZE_MM * MM_TO_PX);

export default function scaleImage(imageURL, colorCount) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.src = imageURL; // 图片的路径
    img.onload = function () {
      // 获取图片的原始尺寸
      const originalWidth = img.width;
      const originalHeight = img.height;

      // 计算缩放比例
      const scale = Math.min(
        MAX_SIZE_PX / originalWidth,
        MAX_SIZE_PX / originalHeight,
        1
      );

      // 缩放后的尺寸
      const newWidth = originalWidth * scale;
      const newHeight = originalHeight * scale;

      // 设置 canvas 尺寸
      canvas.width = newWidth;
      canvas.height = newHeight;

      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // 获取图片中所有颜色
      const pixels = getImageColors(canvas, ctx);
      // 像素化 canvas 中的图片
      pixelateImage(canvas, ctx);
      // 聚类并替换图中颜色颜色
      const colors = getAndApplyColors(pixels, canvas, ctx, colorCount);

      resolve({
        canvas,
        ctx,
        colors,
        size: { width: newWidth, height: newHeight },
      });

      //  调试时使用，用于将图片放入页面，查看分色后的图片样式
      // document.body.appendChild(canvas);
    };
  });
}

function getImageColors(canvas, ctx) {
  const width = canvas.width;
  const height = canvas.height;

  // 获取整个 canvas 的像素数据
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 用于存储所有像素的颜色值
  const pixels = [];

  // 遍历每个像素的 RGBA 值
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]; // 红色值
    const g = data[i + 1]; // 绿色值
    const b = data[i + 2]; // 蓝色值
    // 忽略 alpha (data[i + 3])

    // 将 RGB 值存入数组
    pixels.push([r, g, b]);
  }

  return pixels;
}

// 存储像素块的颜色
function pixelateImage(canvas, ctx) {
  const width = canvas.width;
  const height = canvas.height;

  for (let y = 0; y < height; y += PIXEL_BLOCK_SIZE_PX) {
    for (let x = 0; x < width; x += PIXEL_BLOCK_SIZE_PX) {
      // 获取当前块的像素数据
      const imageData = ctx.getImageData(
        x,
        y,
        PIXEL_BLOCK_SIZE_PX,
        PIXEL_BLOCK_SIZE_PX
      );
      const data = imageData.data;
      // 计算块内像素的平均颜色
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; // 红色
        g += data[i + 1]; // 绿色
        b += data[i + 2]; // 蓝色
        count++;
      }
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      // 将该块填充为平均颜色
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, PIXEL_BLOCK_SIZE_PX, PIXEL_BLOCK_SIZE_PX);
    }
  }
}

function getColorsByKmeans(pixels, colorCount) {
  var km = new KMeans({
    K: colorCount,
  });
  km.cluster(pixels);
  while (km.step()) {
    km.findClosestCentroids();
    km.moveCentroids();
    if (km.hasConverged()) break;
  }
  return km.centroids;
}

function getColorsByColorThief(canvas, colorCount) {
  return new Promise((resolve) => {
    const dataURL = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.width = canvas.width;
    img.height = canvas.height;
    img.src = dataURL;
    img.onload = () => {
      resolve(colorThief.getPalette(img, colorCount));
    };
  });
}

// 聚类并替换图中颜色颜色
async function getAndApplyColors(pixels, canvas, ctx, colorCount = 4) {
  const centroids = getColorsByKmeans(pixels, colorCount);
  // const centroids = getColorsByColorThief(canvas, colorCount);

  // 替换 canvas 上的像素为聚类后的颜色
  const width = canvas.width;
  const height = canvas.height;
  let pixelIndex = 0;

  for (let y = 0; y < height; y += PIXEL_BLOCK_SIZE_PX) {
    for (let x = 0; x < width; x += PIXEL_BLOCK_SIZE_PX) {
      // 获取当前像素块的颜色
      const pixelColor = pixels[pixelIndex];
      pixelIndex++;

      // 找到最接近的聚类中心点颜色
      let nearestColor = centroids[0];
      let minDistance = getEuclideanDistance(pixelColor, centroids[0]);

      for (let i = 1; i < centroids.length; i++) {
        const distance = getEuclideanDistance(pixelColor, centroids[i]);
        if (distance < minDistance) {
          nearestColor = centroids[i];
          minDistance = distance;
        }
      }

      // 用最接近的颜色替换当前像素块
      const [r, g, b] = nearestColor;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, PIXEL_BLOCK_SIZE_PX, PIXEL_BLOCK_SIZE_PX);
    }
  }

  return centroids;
}

// 计算两个颜色之间的欧氏距离
function getEuclideanDistance(color1, color2) {
  const [r1, g1, b1] = color1;
  const [r2, g2, b2] = color2;
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
