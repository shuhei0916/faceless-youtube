// 顔検出モジュールのテスト
const { FaceDetector } = require('../../src/modules/faceDetection/FaceDetector.js');

describe('FaceDetector', () => {
  let faceDetector;

  beforeEach(() => {
    faceDetector = new FaceDetector();
  });

  describe('初期化', () => {
    test('FaceDetectorクラスがインスタンス化できる', () => {
      expect(faceDetector).toBeInstanceOf(FaceDetector);
    });

    test('初期状態では未初期化状態である', () => {
      expect(faceDetector.isInitialized()).toBe(false);
    });
  });

  describe('モデルの初期化', () => {
    test('initializeメソッドが存在する', () => {
      expect(typeof faceDetector.initialize).toBe('function');
    });

    test('initialize後にisInitializedがtrueを返す', async () => {
      await faceDetector.initialize();
      expect(faceDetector.isInitialized()).toBe(true);
    });

    test('initialize呼び出し時にTensorFlow.jsモデルが読み込まれる', async () => {
      const initializeSpy = jest.spyOn(faceDetector, '_loadModel');
      await faceDetector.initialize();
      expect(initializeSpy).toHaveBeenCalled();
    });
  });

  describe('顔検出', () => {
    beforeEach(async () => {
      await faceDetector.initialize();
    });

    test('detectFacesメソッドが存在する', () => {
      expect(typeof faceDetector.detectFaces).toBe('function');
    });

    test('画像要素から顔の座標を検出できる', async () => {
      const mockImage = document.createElement('img');
      mockImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const faces = await faceDetector.detectFaces(mockImage);
      
      expect(Array.isArray(faces)).toBe(true);
      expect(faces.length).toBeGreaterThanOrEqual(0);
    });

    test('検出された顔の座標が正しい形式である', async () => {
      const mockImage = document.createElement('img');
      
      // モックで顔が1つ検出される場合をシミュレート
      const mockFaces = [{ x: 10, y: 20, width: 50, height: 60 }];
      jest.spyOn(faceDetector, '_runDetection').mockResolvedValue(mockFaces);
      
      const faces = await faceDetector.detectFaces(mockImage);
      
      expect(faces).toHaveLength(1);
      expect(faces[0]).toHaveProperty('x');
      expect(faces[0]).toHaveProperty('y');
      expect(faces[0]).toHaveProperty('width');
      expect(faces[0]).toHaveProperty('height');
      expect(typeof faces[0].x).toBe('number');
      expect(typeof faces[0].y).toBe('number');
      expect(typeof faces[0].width).toBe('number');
      expect(typeof faces[0].height).toBe('number');
    });

    test('未初期化状態で検出を実行するとエラーが発生する', async () => {
      const uninitializedDetector = new FaceDetector();
      const mockImage = document.createElement('img');
      
      await expect(uninitializedDetector.detectFaces(mockImage))
        .rejects.toThrow('FaceDetector is not initialized');
    });

    test('無効な画像要素でエラーが発生する', async () => {
      await expect(faceDetector.detectFaces(null))
        .rejects.toThrow('Invalid image element');
    });
  });

  describe('リソース管理', () => {
    test('disposeメソッドが存在する', () => {
      expect(typeof faceDetector.dispose).toBe('function');
    });

    test('dispose後はisInitializedがfalseを返す', async () => {
      await faceDetector.initialize();
      faceDetector.dispose();
      expect(faceDetector.isInitialized()).toBe(false);
    });
  });
});