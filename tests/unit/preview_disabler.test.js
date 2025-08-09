const { hideAllThumbnails } = require('../../src/content/preview_disabler');

describe('Preview Disabler Logic', () => {
  beforeEach(() => {
    // 各テストの前にDOMをクリーンアップ
    document.body.innerHTML = '';
  });

  test('should hide thumbnail images', () => {
    // DOMのセットアップ
    document.body.innerHTML = `
      <ytd-thumbnail>
        <img src="some-image.jpg" style="display: block;">
      </ytd-thumbnail>
      <ytm-shorts-lockup-view-model-v2>
        <img style="display: inline;">
      </ytm-shorts-lockup-view-model-v2>
      <div>
        <img src="not-a-thumbnail.jpg">
      </div>
    `;

    // Green: 実装済みの関数を呼び出す
    hideAllThumbnails();

    const images = document.querySelectorAll('ytd-thumbnail img, ytm-shorts-lockup-view-model-v2 img');
    const otherImage = document.querySelector('div > img');

    // 対象の画像にクラスが付与されていることを確認
    images.forEach(img => {
      expect(img.classList.contains('faceless-hidden')).toBe(true);
    });

    // 対象外の画像にはクラスが付与されていないことを確認
    expect(otherImage.classList.contains('faceless-hidden')).toBe(false);
  });
});
