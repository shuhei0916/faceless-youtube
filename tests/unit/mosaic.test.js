const { applyMosaic } = require('../../src/content/features/mosaic');

describe('Mosaic Logic', () => {
  test('should replace image with a canvas when faces are detected', async () => {
    // DOMのセットアップ
    document.body.innerHTML = `<img id="test-image">`;
    const imageElement = document.getElementById('test-image');

    // face-api.jsの detectAllFaces をモック化し、顔が一つ検出されたことにする
    const mockDetections = [{ box: { x: 10, y: 10, width: 50, height: 50 } }];
    global.faceapi = {
      detectAllFaces: jest.fn().mockResolvedValue(mockDetections),
    };

    // Green: 実装したasync関数をawaitで呼び出す
    await applyMosaic(imageElement);

    // img要素がcanvas要素に置き換えられたことを確認する
    const canvasElement = document.querySelector('canvas');
    expect(canvasElement).not.toBeNull();
    expect(document.getElementById('test-image')).toBeNull();
  });
});
