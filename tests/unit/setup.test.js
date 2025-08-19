// テスト環境の動作確認
describe('テスト環境のセットアップ', () => {
  test('Jestが正常に動作する', () => {
    expect(1 + 1).toBe(2);
  });

  test('Chrome APIのモックが利用可能', () => {
    expect(chrome).toBeDefined();
    expect(chrome.storage).toBeDefined();
    expect(chrome.storage.local).toBeDefined();
  });

  test('DOM環境が利用可能', () => {
    const div = document.createElement('div');
    div.textContent = 'テスト';
    expect(div.textContent).toBe('テスト');
  });

  test('Canvas APIモックが利用可能', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeDefined();
    expect(typeof ctx.drawImage).toBe('function');
  });

  test('Image オブジェクトモックが利用可能', () => {
    const img = new Image();
    expect(img).toBeDefined();
    expect(typeof img.addEventListener).toBe('function');
  });
});