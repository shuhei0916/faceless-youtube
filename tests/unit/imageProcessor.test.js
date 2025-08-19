// 画像処理モジュールのテスト
const { ImageProcessor } = require('../../src/modules/imageProcessor/ImageProcessor.js');

describe('ImageProcessor', () => {
  let imageProcessor;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    imageProcessor = new ImageProcessor();
    
    // Canvas要素のモック作成
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn(),
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test')
    };
    
    mockContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
        width: 3,
        height: 1
      }),
      putImageData: jest.fn(),
      fillStyle: '',
      fillRect: jest.fn(),
      clearRect: jest.fn()
    };
    
    mockCanvas.getContext.mockReturnValue(mockContext);
    
    // 元のcreateElementを保存
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return mockCanvas;
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基本機能', () => {
    test('ImageProcessorクラスがインスタンス化できる', () => {
      expect(imageProcessor).toBeInstanceOf(ImageProcessor);
    });

    test('applyBlackoutメソッドが存在する', () => {
      expect(typeof imageProcessor.applyBlackout).toBe('function');
    });
  });

  describe('黒塗り処理', () => {
    let mockImage;
    let faceRegions;

    beforeEach(() => {
      mockImage = document.createElement('img');
      mockImage.width = 300;
      mockImage.height = 200;
      mockImage.src = 'data:image/png;base64,test';
      
      faceRegions = [
        { x: 50, y: 60, width: 80, height: 100 },
        { x: 150, y: 70, width: 70, height: 90 }
      ];
    });

    test('顔領域に黒塗りを適用できる', async () => {
      const processedImage = await imageProcessor.applyBlackout(mockImage, faceRegions);
      
      expect(processedImage).toBeDefined();
      expect(processedImage.tagName).toBe('IMG');
      expect(mockContext.fillRect).toHaveBeenCalledTimes(2);
      expect(mockContext.fillRect).toHaveBeenCalledWith(50, 60, 80, 100);
      expect(mockContext.fillRect).toHaveBeenCalledWith(150, 70, 70, 90);
    });

    test('黒色で塗りつぶされる', async () => {
      await imageProcessor.applyBlackout(mockImage, faceRegions);
      
      expect(mockContext.fillStyle).toBe('#000000');
    });

    test('顔領域が空配列の場合は元画像を返す', async () => {
      const processedImage = await imageProcessor.applyBlackout(mockImage, []);
      
      expect(processedImage).toBe(mockImage);
      expect(mockContext.fillRect).not.toHaveBeenCalled();
    });

    test('無効な画像要素でエラーが発生する', async () => {
      await expect(imageProcessor.applyBlackout(null, faceRegions))
        .rejects.toThrow('Invalid image element');
      
      await expect(imageProcessor.applyBlackout(undefined, faceRegions))
        .rejects.toThrow('Invalid image element');
    });

    test('無効な顔領域配列でエラーが発生する', async () => {
      await expect(imageProcessor.applyBlackout(mockImage, null))
        .rejects.toThrow('Invalid face regions');
      
      await expect(imageProcessor.applyBlackout(mockImage, 'not-array'))
        .rejects.toThrow('Invalid face regions');
    });

    test('処理済み画像のサイズが元画像と同じ', async () => {
      const processedImage = await imageProcessor.applyBlackout(mockImage, faceRegions);
      
      expect(mockCanvas.width).toBe(300);
      expect(mockCanvas.height).toBe(200);
      expect(processedImage.width).toBe(300);
      expect(processedImage.height).toBe(200);
    });
  });

  describe('モザイク処理（将来拡張用）', () => {
    test('applyMosaicメソッドが存在する', () => {
      expect(typeof imageProcessor.applyMosaic).toBe('function');
    });

    test('モザイク処理は現在は黒塗りと同じ動作をする', async () => {
      const mockImage = document.createElement('img');
      const faceRegions = [{ x: 10, y: 20, width: 30, height: 40 }];
      
      const processedImage = await imageProcessor.applyMosaic(mockImage, faceRegions);
      
      expect(processedImage).toBeDefined();
      expect(mockContext.fillRect).toHaveBeenCalledWith(10, 20, 30, 40);
    });
  });

  describe('エラーハンドリング', () => {
    test('Canvas処理中にエラーが発生した場合のエラーハンドリング', async () => {
      // toDataURLでエラーが発生するケース
      mockCanvas.toDataURL.mockImplementation(() => {
        throw new Error('Canvas processing failed');
      });

      const mockImage = document.createElement('img');
      mockImage.width = 100;
      mockImage.height = 100;
      const faceRegions = [{ x: 0, y: 0, width: 10, height: 10 }];

      await expect(imageProcessor.applyBlackout(mockImage, faceRegions))
        .rejects.toThrow('Failed to process image');
    });
  });
});