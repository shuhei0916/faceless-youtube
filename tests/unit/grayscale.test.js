const { applyGrayscale } = require('../../src/content/grayscale');

describe('Grayscale Logic', () => {
  test('should add grayscale class to thumbnail images', () => {
    // DOMのセットアップ（チャンネルページとホームページの両方の構造を模倣）
    document.body.innerHTML = `
      <ytd-thumbnail>
        <img class="channel-page-thumb">
      </ytd-thumbnail>
      <yt-thumbnail-view-model>
        <img class="home-page-thumb">
      </yt-thumbnail-view-model>
    `;

    // Red: applyGrayscaleはまだ実装されていないため、このテストは失敗するはず
    applyGrayscale();

    const channelPageImage = document.querySelector('.channel-page-thumb');
    const homePageImage = document.querySelector('.home-page-thumb');
    
    expect(channelPageImage.classList.contains('grayscale')).toBe(true);
    // Red: このアサーションが失敗するはず
    expect(homePageImage.classList.contains('grayscale')).toBe(true);
  });
});
