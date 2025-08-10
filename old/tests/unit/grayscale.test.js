const { applyGrayscale } = require('../../src/content/features/grayscale');

describe('Grayscale Logic', () => {
  test('should add grayscale class to all thumbnail types', () => {
    // DOMのセットアップ（通常、ホームページ、スポンサー、ショート動画）
    document.body.innerHTML = `
      <ytd-thumbnail>
        <img class="normal-thumb">
      </ytd-thumbnail>
      <yt-thumbnail-view-model>
        <img class="home-page-thumb">
      </yt-thumbnail-view-model>
      <top-landscape-image-layout-view-model>
        <img class="sponsor-thumb">
      </top-landscape-image-layout-view-model>
      <ytm-shorts-lockup-view-model>
        <img class="shorts-thumb">
      </ytm-shorts-lockup-view-model>
    `;

    applyGrayscale();

    const normalThumb = document.querySelector('.normal-thumb');
    const homePageThumb = document.querySelector('.home-page-thumb');
    const sponsorThumb = document.querySelector('.sponsor-thumb');
    const shortsThumb = document.querySelector('.shorts-thumb');
    
    expect(normalThumb.classList.contains('grayscale')).toBe(true);
    expect(homePageThumb.classList.contains('grayscale')).toBe(true);
    // Red: 以下の2つのアサーションが失敗するはず
    expect(sponsorThumb.classList.contains('grayscale')).toBe(true);
    expect(shortsThumb.classList.contains('grayscale')).toBe(true);
  });
});
