let isModelLoaded = false;

function getVideoTitle(imgElement) {
  try {
    const container = imgElement.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer');
    if (container) {
      const titleElement = container.querySelector('#video-title');
      if (titleElement && titleElement.textContent) {
        return titleElement.textContent.trim();
      }
    }
    return imgElement.alt || 'タイトル不明';
  } catch (e) {
    return 'タイトル取得エラー';
  }
}

async function applyBlackout(img) {
  if (!img || !(img instanceof HTMLImageElement)) {
    return;
  }
  // 既に処理済みの場合はスキップ
  if (img.dataset.blackoutApplied) {
    return;
  }
  // モデルがロードされていない場合はスキップ
  if (!isModelLoaded) {
    console.log('Model not loaded yet, skipping image:', img.src);
    return;
  }

  img.dataset.blackoutApplied = 'true';
  img.crossOrigin = 'anonymous';
  
  if (!img.complete) {
    await new Promise(resolve => {
      img.onload = resolve;
      img.onerror = (err) => {
        console.error('Image failed to load:', img.src, err);
        resolve();
      };
    });
  }
  
  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    console.log('Image has no size, skipping:', img.src);
    return;
  }

  try {
    const minConfidence = 0.5;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    const detections = await faceapi.detectAllFaces(img, options);

    const title = getVideoTitle(img);
    console.log(`[Faceless Log] Title: "${title}", Faces: ${detections.length}`);

    if (detections.length > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get 2D context for:', img.src);
        return;
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.error('drawImage failed (CORS issue?):', img.src, e);
        return;
      }

      ctx.fillStyle = 'black';
      detections.forEach(detection => {
        const { x, y, width, height } = detection.box;
        ctx.fillRect(x, y, width, height);
      });
      
      if (img.parentNode) {
        img.parentNode.replaceChild(canvas, img);
      }
    }
  } catch (error) {
    console.error('Error during face detection or processing for', img.src, ':', error);
  }
}

function processImage(img) {
    applyBlackout(img);
}

async function main() {
  try {
    const modelUrl = chrome.runtime.getURL('assets/weights');
    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
    isModelLoaded = true;
    console.log('[Faceless] Model loaded.');

    const images = document.querySelectorAll('ytd-thumbnail img, yt-img-shadow img');
    images.forEach(processImage);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const newImages = node.querySelectorAll('ytd-thumbnail img, yt-img-shadow img');
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
    console.error('[Faceless] Critical error on main init:', e);
  }
}

const checkFaceApi = setInterval(() => {
  if (typeof faceapi !== 'undefined') {
    clearInterval(checkFaceApi);
    main();
  }
}, 100);
