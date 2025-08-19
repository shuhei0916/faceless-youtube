// DOM操作モジュール
class DOMHandler {
  constructor() {
    this.observer = null;
  }

  findThumbnailImages(containerSelector = null) {
    const searchRoot = containerSelector 
      ? document.querySelectorAll(containerSelector)
      : [document.body];
    
    const thumbnails = [];
    const processedImages = new Set();
    
    searchRoot.forEach(container => {
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        if (this.isYouTubeThumbnail(img) && !processedImages.has(img)) {
          thumbnails.push({
            element: img,
            parentElement: img.parentElement,
            src: img.src
          });
          processedImages.add(img);
        }
      });
    });

    return thumbnails;
  }

  replaceThumbnailImage(originalImage, processedImage) {
    if (!originalImage || !originalImage.tagName || originalImage.tagName !== 'IMG') {
      throw new Error('Invalid original image element');
    }

    if (!processedImage || !processedImage.tagName || processedImage.tagName !== 'IMG') {
      throw new Error('Invalid processed image element');
    }

    // 既に処理済みかチェック
    if (this.isAlreadyProcessed(originalImage)) {
      return false;
    }

    // 元の属性を保持しつつ、src を置換
    const originalAlt = originalImage.alt;
    const originalClassName = originalImage.className;
    const originalDataset = { ...originalImage.dataset };

    originalImage.src = processedImage.src;
    originalImage.alt = originalAlt;
    originalImage.className = originalClassName;

    // データセットを復元
    Object.keys(originalDataset).forEach(key => {
      originalImage.dataset[key] = originalDataset[key];
    });

    // 処理済みマーカーを追加
    originalImage.dataset.facelessProcessed = 'true';
    originalImage.classList.add('faceless-youtube-processed');
    originalImage.style.opacity = '1';

    return true;
  }

  setupMutationObserver(callback) {
    if (this.observer) {
      this.disconnectObserver();
    }

    this.observer = new MutationObserver((mutations) => {
      let hasNewThumbnails = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const images = node.querySelectorAll ? node.querySelectorAll('img') : [];
              images.forEach((img) => {
                if (this.isYouTubeThumbnail(img) && !this.isAlreadyProcessed(img)) {
                  hasNewThumbnails = true;
                }
              });

              // 追加されたノード自体が画像の場合もチェック
              if (node.tagName === 'IMG' && this.isYouTubeThumbnail(node) && !this.isAlreadyProcessed(node)) {
                hasNewThumbnails = true;
              }
            }
          });
        }
      });

      if (hasNewThumbnails && callback) {
        callback();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  disconnectObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  isYouTubeThumbnail(imageElement) {
    if (!imageElement || !imageElement.src) {
      return false;
    }

    const src = imageElement.src;
    return src.includes('i.ytimg.com') || src.includes('yt3.ggpht.com');
  }

  isAlreadyProcessed(imageElement) {
    return imageElement.dataset.facelessProcessed === 'true';
  }
}

module.exports = { DOMHandler };