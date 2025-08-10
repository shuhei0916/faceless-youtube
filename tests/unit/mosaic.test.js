const { applyMosaic } = require('../../src/content/features/mosaic');

describe('Mosaic Logic', () => {
  let imageElement;

  // テストごとにDOMとモックをリセット
  beforeEach(() => {
    document.body.innerHTML = `<img id="test-image">`;
    imageElement = document.getElementById('test-image');

    // テスト用の画像プロパティをモック
    Object.defineProperty(imageElement, 'complete', { value: true });
    Object.defineProperty(imageElement, 'naturalWidth', { value: 120 });
    Object.defineProperty(imageElement, 'naturalHeight', { value: 90 });
    
    global.faceapi = {
      detectAllFaces: jest.fn(),
      SsdMobilenetv1Options: jest.fn(),
    };

    // JSDOMのCanvas APIをモック
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Uint8ClampedArray([0, 0, 0, 255]) })),
      fillRect: jest.fn(),
    }));
  });

  test('should replace image with a canvas when faces are detected', async () => {
    // face-api.jsのモック: 顔が一つ検出される
    const mockDetections = [{ box: { x: 10, y: 10, width: 50, height: 50 } }];
    global.faceapi.detectAllFaces.mockResolvedValue(mockDetections);

    // isModelLoadedがtrueの状態で関数を呼び出す
    await applyMosaic(imageElement, true);

    // img要素がcanvas要素に置き換えられたことを確認
    const canvasElement = document.querySelector('canvas');
    expect(canvasElement).not.toBeNull();
    expect(document.getElementById('test-image')).toBeNull();
    // getContextが呼ばれたことを確認
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  test('should not replace image when no faces are detected', async () => {
    // face-api.jsのモック: 顔が検出されない
    global.faceapi.detectAllFaces.mockResolvedValue([]);

    // isModelLoadedがtrueの状態で関数を呼び出す
    await applyMosaic(imageElement, true);

    // img要素がcanvas要素に置き換えられていないことを確認
    const canvasElement = document.querySelector('canvas');
    expect(canvasElement).toBeNull();
    expect(document.getElementById('test-image')).not.toBeNull();
  });

  test('should do nothing if model is not loaded', async () => {
    // isModelLoadedがfalseの状態で関数を呼び出す
    await applyMosaic(imageElement, false);

    // face-api.jsが呼び出されず、img要素も置き換えられないことを確認
    expect(global.faceapi.detectAllFaces).not.toHaveBeenCalled();
    const canvasElement = document.querySelector('canvas');
    expect(canvasElement).toBeNull();
    expect(document.getElementById('test-image')).not.toBeNull();
  });
});
