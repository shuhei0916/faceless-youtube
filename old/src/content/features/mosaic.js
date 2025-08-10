async function applyMosaic(img, isModelLoaded) {
  if (!img || !(img instanceof HTMLImageElement) || img.dataset.mosaicApplied || !isModelLoaded) {
    return;
  }

  img.crossOrigin = 'anonymous';
  
  if (!img.complete) {
    await new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }
  
  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    return;
  }

  img.dataset.mosaicApplied = 'true';

  try {
    // 顔検出のオプションをより精度の高いものに変更
    const detections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options());
    if (detections.length > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // JSDOM (test) environment doesn't support canvas drawing well, so we skip it.
      // The main purpose of the unit test is to check if the image is replaced by a canvas.
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        detections.forEach(detection => {
          const { x, y, width, height } = detection.box;
          const mosaicSize = Math.min(width, height) / 10;
          for (let i = 0; i < width; i += mosaicSize) {
            for (let j = 0; j < height; j += mosaicSize) {
              const pixelData = ctx.getImageData(x + i, y + j, 1, 1).data;
              ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
              ctx.fillRect(x + i, y + j, mosaicSize, mosaicSize);
            }
          }
        });
      }
      
      canvas.className = img.className;
      canvas.style.cssText = img.style.cssText;
      if (img.parentNode) {
        img.parentNode.replaceChild(canvas, img);
      }
    }
  } catch (error) {
    console.error('Error applying mosaic:', error);
  }
}

module.exports = { applyMosaic };
