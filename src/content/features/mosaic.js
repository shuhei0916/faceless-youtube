async function applyMosaic(imageElement) {
  // 処理済み、またはimgでない場合は何もしない
  if (!imageElement || !(imageElement instanceof HTMLImageElement) || imageElement.dataset.mosaicApplied) {
    return;
  }
  
  // 画像が読み込まれていない場合は、読み込みを待つ
  if (!imageElement.complete) {
    await new Promise(resolve => {
      imageElement.onload = resolve;
      imageElement.onerror = resolve; // エラーでも処理を止めない
    });
  }
  
  // 読み込み後でも、画像の幅や高さが0の場合は処理しない
  if (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0) {
    return;
  }

  imageElement.dataset.mosaicApplied = 'true';

  try {
    const detections = await faceapi.detectAllFaces(imageElement);
    if (detections.length > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      // 元の画像を描画
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

      // 検出された各顔にモザイクをかける
      detections.forEach(detection => {
        const { x, y, width, height } = detection.box;
        // 10x10のモザイク
        const mosaicSize = 10;
        for (let i = 0; i < width; i += mosaicSize) {
          for (let j = 0; j < height; j += mosaicSize) {
            const pixelData = ctx.getImageData(x + i, y + j, 1, 1).data;
            ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
            ctx.fillRect(x + i, y + j, mosaicSize, mosaicSize);
          }
        }
      });
      
      // 元のimg要素と同じクラスをcanvasに適用
      canvas.className = imageElement.className;
      imageElement.parentNode.replaceChild(canvas, imageElement);
    }
  } catch (error) {
    console.error('Error applying mosaic:', error);
  }
}

// Node.jsのテスト環境でrequireできるようにエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyMosaic };
}
