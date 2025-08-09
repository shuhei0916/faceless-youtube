// preview_disabler.js からロジックをコピー
function hideAllThumbnails() {
  const images = document.querySelectorAll('ytd-thumbnail img, ytm-shorts-lockup-view-model-v2 img');
  images.forEach(img => {
    img.classList.add('faceless-hidden');
  });
}

// スクリプトのメイン処理
try {
  hideAllThumbnails();
  
  // 将来的な動的コンテンツに対応するため、MutationObserverも設定する
  const observer = new MutationObserver((mutations) => {
    // DOMに変更があるたびにサムネイルを非表示にする
    hideAllThumbnails();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

} catch (e) {
  console.error("Faceless YouTube Error:", e);
}
