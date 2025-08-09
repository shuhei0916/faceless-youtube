const { applyGrayscale } = require('../../src/content/grayscale');

describe('Grayscale Logic', () => {
  test('should add grayscale class to thumbnail images', () => {
    // DOMのセットアップ
    document.body.innerHTML = `
      <ytd-thumbnail>
        <img>
      </ytd-thumbnail>
    `;

    // Red: applyGrayscaleはまだ実装されていないため、このテストは失敗するはず
    applyGrayscale();

    const image = document.querySelector('ytd-thumbnail img');
    expect(image.classList.contains('grayscale')).toBe(true);
  });
});
