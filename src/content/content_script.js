function applyGrayscale() {
  const images = document.querySelectorAll('ytd-thumbnail img');
  images.forEach(img => {
    // すでにクラスが付与されている場合は何もしない
    if (!img.classList.contains('grayscale')) {
      img.classList.add('grayscale');
    }
  });
}

// スクリプトのメイン処理
try {
  // 初期読み込み時に実行
  applyGrayscale();
  
  // 動的コンテンツに対応するため、MutationObserverを設定
  const observer = new MutationObserver((mutations) => {
    // DOMに変更があるたびに実行
    applyGrayscale();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

} catch (e) {
  console.error("Faceless YouTube Error:", e);
}
