// コンテンツスクリプト統合テスト
const { FaceDetector } = require('../../src/modules/faceDetection/FaceDetector.js');
const { ImageProcessor } = require('../../src/modules/imageProcessor/ImageProcessor.js');
const { DOMHandler } = require('../../src/modules/domHandler/DOMHandler.js');
const { ConfigManager } = require('../../src/modules/configManager/ConfigManager.js');

// コンテンツスクリプトのメイン機能をテスト用に分離
class FacelessYouTube {
  constructor() {
    this.faceDetector = new FaceDetector();
    this.imageProcessor = new ImageProcessor();
    this.domHandler = new DOMHandler();
    this.configManager = new ConfigManager();
    this.isInitialized = false;
    this.processingQueue = new Set();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.configManager.loadConfig();
      
      if (await this.configManager.isEnabled()) {
        await this.faceDetector.initialize();
        this.setupDOMObserver();
        await this.processExistingThumbnails();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize FacelessYouTube:', error);
    }
  }

  setupDOMObserver() {
    this.domHandler.setupMutationObserver(async () => {
      if (await this.configManager.isEnabled()) {
        await this.processNewThumbnails();
      }
    });
  }

  async processExistingThumbnails() {
    const thumbnails = this.domHandler.findThumbnailImages();
    await this.processThumbnails(thumbnails);
  }

  async processNewThumbnails() {
    const allThumbnails = this.domHandler.findThumbnailImages();
    const unprocessed = allThumbnails.filter(thumb => 
      !this.domHandler.isAlreadyProcessed(thumb.element)
    );
    await this.processThumbnails(unprocessed);
  }

  async processThumbnails(thumbnails) {
    for (const thumbnail of thumbnails) {
      if (this.processingQueue.has(thumbnail.element)) continue;
      
      this.processingQueue.add(thumbnail.element);
      try {
        await this.processSingleThumbnail(thumbnail);
      } catch (error) {
        console.error('Error processing thumbnail:', error);
      } finally {
        this.processingQueue.delete(thumbnail.element);
      }
    }
  }

  async processSingleThumbnail(thumbnail) {
    const { element } = thumbnail;
    
    // 顔検出
    const faces = await this.faceDetector.detectFaces(element);
    
    if (faces.length > 0) {
      // 画像処理
      const processingMode = await this.configManager.getProcessingMode();
      const processedImage = processingMode === 'mosaic' 
        ? await this.imageProcessor.applyMosaic(element, faces)
        : await this.imageProcessor.applyBlackout(element, faces);
      
      // DOM置換
      this.domHandler.replaceThumbnailImage(element, processedImage);
    } else {
      // 顔が検出されなくても処理済みマークをつける
      element.dataset.facelessProcessed = 'true';
    }
  }

  async toggleEnabled() {
    const currentState = await this.configManager.isEnabled();
    await this.configManager.setEnabled(!currentState);
    
    if (!currentState) {
      // 有効化された場合は初期化
      await this.initialize();
    } else {
      // 無効化された場合はオブザーバーを停止
      this.domHandler.disconnectObserver();
      this.isInitialized = false;
    }
  }

  dispose() {
    this.domHandler.disconnectObserver();
    this.faceDetector.dispose();
    this.processingQueue.clear();
    this.isInitialized = false;
  }
}

describe('FacelessYouTube 統合テスト', () => {
  let facelessYT;
  let mockThumbnails;

  beforeEach(() => {
    facelessYT = new FacelessYouTube();
    document.body.innerHTML = '';
    
    // Chrome storage API のモック設定
    chrome.storage.sync.get.mockResolvedValue({
      facelessYoutube: {
        enabled: true,
        processingMode: 'blackout',
        autoStart: true
      }
    });
    chrome.storage.sync.set.mockResolvedValue();

    // サムネイル要素のモック作成
    mockThumbnails = createMockYouTubePage();
  });

  afterEach(() => {
    facelessYT.dispose();
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('初期化', () => {
    test('正常に初期化できる', async () => {
      await facelessYT.initialize();
      
      expect(facelessYT.isInitialized).toBe(true);
      expect(facelessYT.faceDetector.isInitialized()).toBe(true);
    });

    test('設定が無効の場合は初期化されない', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        facelessYoutube: { enabled: false }
      });

      await facelessYT.initialize();
      
      expect(facelessYT.isInitialized).toBe(false);
    });

    test('初期化エラー時の適切な処理', async () => {
      jest.spyOn(facelessYT.faceDetector, 'initialize')
        .mockRejectedValue(new Error('Initialization failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await facelessYT.initialize();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(facelessYT.isInitialized).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('サムネイル処理', () => {
    beforeEach(async () => {
      // 統合テスト用にImageProcessorをモック化
      jest.spyOn(facelessYT.imageProcessor, 'applyBlackout')
        .mockResolvedValue(document.createElement('img'));
      jest.spyOn(facelessYT.imageProcessor, 'applyMosaic')
        .mockResolvedValue(document.createElement('img'));
      
      await facelessYT.initialize();
    });

    test('既存のサムネイルを処理できる', async () => {
      jest.spyOn(facelessYT.faceDetector, 'detectFaces')
        .mockResolvedValue([{ x: 10, y: 10, width: 50, height: 50 }]);
      
      await facelessYT.processExistingThumbnails();
      
      const processedThumbnails = document.querySelectorAll('[data-faceless-processed="true"]');
      expect(processedThumbnails.length).toBeGreaterThan(0);
    });

    test('顔が検出されない場合でも処理済みマークがつく', async () => {
      jest.spyOn(facelessYT.faceDetector, 'detectFaces')
        .mockResolvedValue([]);
      
      await facelessYT.processExistingThumbnails();
      
      const processedThumbnails = document.querySelectorAll('[data-faceless-processed="true"]');
      expect(processedThumbnails.length).toBeGreaterThan(0);
    });

    test('処理モードに応じて適切な処理が適用される', async () => {
      jest.spyOn(facelessYT.faceDetector, 'detectFaces')
        .mockResolvedValue([{ x: 10, y: 10, width: 50, height: 50 }]);
      
      const blackoutSpy = jest.spyOn(facelessYT.imageProcessor, 'applyBlackout');
      const mosaicSpy = jest.spyOn(facelessYT.imageProcessor, 'applyMosaic');
      
      // 黒塗りモード
      await facelessYT.configManager.setProcessingMode('blackout');
      await facelessYT.processExistingThumbnails();
      expect(blackoutSpy).toHaveBeenCalled();
      
      // モザイクモード - 新しいサムネイルを追加してテスト
      blackoutSpy.mockClear();
      mosaicSpy.mockClear();
      
      // 既存のサムネイルをクリア
      document.body.innerHTML = '';
      createMockYouTubePage();
      
      await facelessYT.configManager.setProcessingMode('mosaic');
      await facelessYT.processExistingThumbnails();
      expect(mosaicSpy).toHaveBeenCalled();
    });

    test('重複処理を防ぐ', async () => {
      jest.spyOn(facelessYT.faceDetector, 'detectFaces')
        .mockResolvedValue([{ x: 10, y: 10, width: 50, height: 50 }]);
      
      // 最初の処理
      await facelessYT.processExistingThumbnails();
      const firstCallCount = facelessYT.faceDetector.detectFaces.mock.calls.length;
      
      // 二回目の処理（既に処理済みなので新たに処理されない）
      await facelessYT.processNewThumbnails();
      const secondCallCount = facelessYT.faceDetector.detectFaces.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('DOM変更の監視', () => {
    test('新しいサムネイルが追加されたときに処理される', async () => {
      await facelessYT.initialize();
      
      jest.spyOn(facelessYT.faceDetector, 'detectFaces')
        .mockResolvedValue([]);
      
      // 新しいサムネイルを追加
      const newThumbnail = createMockThumbnailImage('https://i.ytimg.com/vi/new/default.jpg');
      
      return new Promise(resolve => {
        setTimeout(() => {
          document.body.appendChild(newThumbnail);
          setTimeout(() => {
            expect(newThumbnail.dataset.facelessProcessed).toBe('true');
            resolve();
          }, 100);
        }, 10);
      });
    });
  });

  describe('有効/無効の切り替え', () => {
    test('無効化するとオブザーバーが停止される', async () => {
      await facelessYT.initialize();
      const disconnectSpy = jest.spyOn(facelessYT.domHandler, 'disconnectObserver');
      
      await facelessYT.toggleEnabled();
      
      expect(disconnectSpy).toHaveBeenCalled();
      expect(facelessYT.isInitialized).toBe(false);
    });

    test('有効化すると初期化される', async () => {
      // 最初は無効状態
      chrome.storage.sync.get.mockResolvedValue({
        facelessYoutube: { enabled: false }
      });
      
      await facelessYT.initialize();
      expect(facelessYT.isInitialized).toBe(false);
      
      // 有効化
      chrome.storage.sync.get.mockResolvedValue({
        facelessYoutube: { enabled: true }
      });
      
      await facelessYT.toggleEnabled();
      expect(facelessYT.isInitialized).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('個別サムネイル処理でエラーが発生しても他に影響しない', async () => {
      await facelessYT.initialize();
      
      jest.spyOn(facelessYT.faceDetector, 'detectFaces')
        .mockResolvedValueOnce(new Promise(() => { throw new Error('Detection failed'); }))
        .mockResolvedValue([]);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await facelessYT.processExistingThumbnails();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ヘルパー関数
  function createMockYouTubePage() {
    const container = document.createElement('div');
    container.className = 'ytd-rich-grid-renderer';
    
    // 複数のサムネイル要素を作成
    for (let i = 1; i <= 3; i++) {
      const thumbnail = createMockThumbnailImage(`https://i.ytimg.com/vi/test${i}/default.jpg`);
      container.appendChild(thumbnail);
    }
    
    document.body.appendChild(container);
    return container;
  }

  function createMockThumbnailImage(src) {
    const img = document.createElement('img');
    img.src = src;
    img.width = 320;
    img.height = 180;
    img.loading = 'lazy';
    return img;
  }
});

// メインクラスをエクスポート（実際のコンテンツスクリプトで使用）
module.exports = { FacelessYouTube };