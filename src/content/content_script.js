let isModelLoaded = false;

function applyGrayscale(img) {
  if (!img.classList.contains('grayscale')) {
    img.classList.add('grayscale');
  }
}

async function applyMosaic(img) {
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
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
    if (detections.length > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
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

function processImage(img) {
    applyGrayscale(img);
    applyMosaic(img);
}

async function main() {
  try {
    // face-api.jsのモデルをロードする
    const modelUrl = chrome.runtime.getURL('assets/weights');
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    isModelLoaded = true;
    console.log('Face detection model loaded.');

    // 初期読み込み時に表示されている画像を処理
    const images = document.querySelectorAll('ytd-thumbnail img, yt-thumbnail-view-model img, top-landscape-image-layout-view-model img, ytm-shorts-lockup-view-model img');
    images.forEach(processImage);

    // DOMの変更を監視
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // ELEMENT_NODE
            const newImages = node.querySelectorAll('ytd-thumbnail img, yt-thumbnail-view-model img, top-landscape-image-layout-view-model img, ytm-shorts-lockup-view-model img');
            newImages.forEach(processImage);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

  } catch (e) {
    console.error("Faceless YouTube Error:", e);
  }
}

// face-api.jsの読み込みを待ってからmainを実行
const checkFaceApi = setInterval(() => {
  if (typeof faceapi !== 'undefined') {
    clearInterval(checkFaceApi);
    main();
  }
}, 100);
