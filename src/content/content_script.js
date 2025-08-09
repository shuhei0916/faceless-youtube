// =============================================
// features/grayscale.js からのコピー
// =============================================
function applyGrayscale() {
  const images = document.querySelectorAll('ytd-thumbnail img, yt-thumbnail-view-model img, top-landscape-image-layout-view-model img, ytm-shorts-lockup-view-model img');
  images.forEach(img => {
    if (!img.classList.contains('grayscale')) {
      img.classList.add('grayscale');
    }
  });
}

// =============================================
// features/mosaic.js からのコピー
// =============================================
async function applyMosaic(imageElement) {
  if (!imageElement || !(imageElement instanceof HTMLImageElement) || imageElement.dataset.mosaicApplied) {
    return;
  }
  
  if (!imageElement.complete) {
    await new Promise(resolve => {
      imageElement.onload = resolve;
      imageElement.onerror = resolve;
    });
  }
  
  if (imageElement.naturalWidth === 0 || imageElement.naturalHeight === 0) {
    return;
  }

  imageElement.dataset.mosaicApplied = 'true';

  try {
    // face-api.jsの読み込みを待つ
    if (typeof faceapi === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (typeof faceapi === 'undefined') {
            console.error("face-api.js is not loaded.");
            return;
        }
    }
      
    const detections = await faceapi.detectAllFaces(imageElement);
    if (detections.length > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

      detections.forEach(detection => {
        const { x, y, width, height } = detection.box;
        const mosaicSize = 10;
        for (let i = 0; i < width; i += mosaicSize) {
          for (let j = 0; j < height; j += mosaicSize) {
            const pixelData = ctx.getImageData(x + i, y + j, 1, 1).data;
            ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
            ctx.fillRect(x + i, y + j, mosaicSize, mosaicSize);
          }
        }
      });
      
      canvas.className = imageElement.className;
      imageElement.parentNode.replaceChild(canvas, imageElement);
    }
  } catch (error) {
    console.error('Error applying mosaic:', error);
  }
}

function processAllImages() {
    const images = document.querySelectorAll('ytd-thumbnail img, yt-thumbnail-view-model img, top-landscape-image-layout-view-model img, ytm-shorts-lockup-view-model img');
    images.forEach(img => {
        applyGrayscaleToImage(img);
        applyMosaicToImage(img);
    });
}

function applyGrayscaleToImage(img) {
    if (!img.classList.contains('grayscale')) {
        img.classList.add('grayscale');
    }
}

async function applyMosaicToImage(img) {
    // モザイク処理は非同期なので、個別に呼び出す
    await applyMosaic(img);
}


// =============================================
// メイン処理
// =============================================
try {
  processAllImages();
  
  const observer = new MutationObserver((mutations) => {
    processAllImages();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

} catch (e) {
  console.error("Faceless YouTube Error:", e);
}
