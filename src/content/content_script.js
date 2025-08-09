function applyGrayscale() {
  // ホームページとチャンネルページの両方のセレクタに対応
  const images = document.querySelectorAll('ytd-thumbnail img, yt-thumbnail-view-model img');
  images.forEach(img => {
    if (!img.classList.contains('grayscale')) {
      img.classList.add('grayscale');
    }
  });
}

// スクリプトのメイン処理
try {
  applyGrayscale();
  
  const observer = new MutationObserver((mutations) => {
    applyGrayscale();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

} catch (e) {
  console.error("Faceless YouTube Error:", e);
}
