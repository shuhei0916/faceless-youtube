function applyGrayscale() {
  const images = document.querySelectorAll('ytd-thumbnail img, yt-thumbnail-view-model img');
  images.forEach(img => {
    img.classList.add('grayscale');
  });
}

// Node.jsのテスト環境でrequireできるようにエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyGrayscale };
}
