// Faceless YouTube - メインコンテンツスクリプト

// モジュール読み込み（実際の環境では相対パス使用）
const { FaceDetector } = require('../modules/faceDetection/FaceDetector.js');
const { ImageProcessor } = require('../modules/imageProcessor/ImageProcessor.js');
const { DOMHandler } = require('../modules/domHandler/DOMHandler.js');
const { ConfigManager } = require('../modules/configManager/ConfigManager.js');

class FacelessYouTube {
  constructor() {
    this.faceDetector = new FaceDetector();
    this.imageProcessor = new ImageProcessor();
    this.domHandler = new DOMHandler();
    this.configManager = new ConfigManager();
    this.isInitialized = false;
    this.processingQueue = new Set();
    
    // デバッグ情報
    this.processedCount = 0;
    this.skipCount = 0;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('🎭 Faceless YouTube - Initializing...');

    try {
      // 設定を読み込み
      await this.configManager.loadConfig();
      
      // 自動開始設定をチェック
      if (!(await this.configManager.isAutoStartEnabled())) {
        console.log('🎭 Auto-start disabled, waiting for manual activation');
        return;
      }

      // 機能が有効化されている場合のみ初期化
      if (await this.configManager.isEnabled()) {
        await this.initializeCore();
      } else {
        console.log('🎭 Extension disabled in settings');
      }
    } catch (error) {
      console.error('🎭 Failed to initialize Faceless YouTube:', error);
    }
  }

  async initializeCore() {
    try {
      // 顔検出モデルを初期化
      console.log('🎭 Loading face detection model...');
      await this.faceDetector.initialize();
      
      // DOM監視を開始
      this.setupDOMObserver();
      
      // 既存のサムネイルを処理
      console.log('🎭 Processing existing thumbnails...');
      await this.processExistingThumbnails();
      
      this.isInitialized = true;
      console.log('🎭 Initialization complete!');
      
      // 統計情報を表示
      this.logStatistics();
    } catch (error) {
      console.error('🎭 Core initialization failed:', error);
      throw error;
    }
  }

  setupDOMObserver() {
    this.domHandler.setupMutationObserver(async () => {
      if (await this.configManager.isEnabled()) {
        await this.processNewThumbnails();
      }
    });
    console.log('🎭 DOM observer setup complete');
  }

  async processExistingThumbnails() {
    const thumbnails = this.domHandler.findThumbnailImages();
    console.log(`🎭 Found ${thumbnails.length} existing thumbnails`);
    
    await this.processThumbnails(thumbnails);
  }

  async processNewThumbnails() {
    const allThumbnails = this.domHandler.findThumbnailImages();
    const unprocessed = allThumbnails.filter(thumb => 
      !this.domHandler.isAlreadyProcessed(thumb.element)
    );
    
    if (unprocessed.length > 0) {
      console.log(`🎭 Found ${unprocessed.length} new thumbnails`);
      await this.processThumbnails(unprocessed);
    }
  }

  async processThumbnails(thumbnails) {
    for (const thumbnail of thumbnails) {
      if (this.processingQueue.has(thumbnail.element)) {
        this.skipCount++;
        continue;
      }
      
      this.processingQueue.add(thumbnail.element);
      try {
        await this.processSingleThumbnail(thumbnail);
        this.processedCount++;
      } catch (error) {
        console.error('🎭 Error processing thumbnail:', error);
      } finally {
        this.processingQueue.delete(thumbnail.element);
      }
    }
  }

  async processSingleThumbnail(thumbnail) {
    const { element } = thumbnail;
    
    try {
      // 顔検出
      const faces = await this.faceDetector.detectFaces(element);
      
      if (faces.length > 0) {
        console.log(`🎭 Detected ${faces.length} face(s) in thumbnail`);
        
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
        element.classList.add('faceless-youtube-processed');
      }
    } catch (error) {
      console.error('🎭 Error in single thumbnail processing:', error);
      // エラーでも処理済みマークをつけて無限ループを防ぐ
      element.dataset.facelessProcessed = 'true';
    }
  }

  async toggleEnabled() {
    const currentState = await this.configManager.isEnabled();
    await this.configManager.setEnabled(!currentState);
    
    console.log(`🎭 Extension ${!currentState ? 'enabled' : 'disabled'}`);
    
    if (!currentState) {
      // 有効化された場合は初期化
      await this.initializeCore();
    } else {
      // 無効化された場合はオブザーバーを停止
      this.cleanup();
    }
  }

  cleanup() {
    this.domHandler.disconnectObserver();
    this.processingQueue.clear();
    this.isInitialized = false;
    console.log('🎭 Cleanup complete');
  }

  dispose() {
    this.cleanup();
    this.faceDetector.dispose();
    console.log('🎭 Full disposal complete');
  }

  logStatistics() {
    console.log(`🎭 Statistics: ${this.processedCount} processed, ${this.skipCount} skipped`);
  }

  // メッセージ通信用のリスナー
  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'toggle':
        this.toggleEnabled().then(() => {
          sendResponse({ success: true });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // 非同期レスポンス

      case 'getStatus':
        this.configManager.isEnabled().then(enabled => {
          sendResponse({ 
            enabled,
            initialized: this.isInitialized,
            processed: this.processedCount,
            skipped: this.skipCount
          });
        });
        return true;

      case 'getConfig':
        this.configManager.loadConfig().then(config => {
          sendResponse({ config });
        });
        return true;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }
}

// インスタンスを作成してグローバルに保存
window.facelessYouTube = new FacelessYouTube();

// ページ読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.facelessYouTube.initialize();
  });
} else {
  // 既に読み込み完了している場合は即座に初期化
  window.facelessYouTube.initialize();
}

// バックグラウンドスクリプトからのメッセージを受信
if (chrome && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    return window.facelessYouTube.handleMessage(request, sender, sendResponse);
  });
}

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
  if (window.facelessYouTube) {
    window.facelessYouTube.dispose();
  }
});

// デバッグ用：コンソールから操作可能
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FacelessYouTube };
}