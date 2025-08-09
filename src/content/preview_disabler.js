function hideAllThumbnails() {
  const images = document.querySelectorAll('ytd-thumbnail img, ytm-shorts-lockup-view-model-v2 img');
  images.forEach(img => {
    img.classList.add('faceless-hidden');
  });
}

// Node.jsのテスト環境でrequireできるようにエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { hideAllThumbnails };
}
