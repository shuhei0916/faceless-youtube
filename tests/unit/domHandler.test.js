// DOM操作モジュールのテスト
const { DOMHandler } = require('../../src/modules/domHandler/DOMHandler.js');

describe('DOMHandler', () => {
  let domHandler;
  let mockContainer;

  beforeEach(() => {
    domHandler = new DOMHandler();
    
    // DOM環境をセットアップ
    document.body.innerHTML = '';
    
    // YouTubeサムネイルコンテナのモック作成
    mockContainer = document.createElement('div');
    mockContainer.className = 'ytd-rich-grid-renderer';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('基本機能', () => {
    test('DOMHandlerクラスがインスタンス化できる', () => {
      expect(domHandler).toBeInstanceOf(DOMHandler);
    });

    test('findThumbnailImagesメソッドが存在する', () => {
      expect(typeof domHandler.findThumbnailImages).toBe('function');
    });

    test('replaceThumbnailImageメソッドが存在する', () => {
      expect(typeof domHandler.replaceThumbnailImage).toBe('function');
    });
  });

  describe('サムネイル画像の検出', () => {
    beforeEach(() => {
      // YouTube風のサムネイル構造を作成
      const thumbnail1 = createMockThumbnail('https://i.ytimg.com/vi/test1/maxresdefault.jpg', 'Test Video 1');
      const thumbnail2 = createMockThumbnail('https://i.ytimg.com/vi/test2/hqdefault.jpg', 'Test Video 2');
      const thumbnail3 = createMockThumbnail('https://yt3.ggpht.com/channel-avatar.jpg', 'Channel Avatar');
      
      mockContainer.appendChild(thumbnail1);
      mockContainer.appendChild(thumbnail2);
      mockContainer.appendChild(thumbnail3);
      
      // 非サムネイル画像も追加（検出されないことを確認）
      const nonThumbnail = document.createElement('img');
      nonThumbnail.src = 'https://example.com/other-image.jpg';
      mockContainer.appendChild(nonThumbnail);
    });

    test('YouTubeサムネイル画像を検出できる', () => {
      const thumbnails = domHandler.findThumbnailImages();
      
      expect(thumbnails).toHaveLength(3);
      expect(thumbnails[0].src).toContain('i.ytimg.com');
      expect(thumbnails[1].src).toContain('i.ytimg.com');
      expect(thumbnails[2].src).toContain('yt3.ggpht.com');
    });

    test('サムネイル画像が存在しない場合は空配列を返す', () => {
      document.body.innerHTML = '<div>No thumbnails here</div>';
      
      const thumbnails = domHandler.findThumbnailImages();
      expect(thumbnails).toEqual([]);
    });

    test('特定のセレクタでサムネイル画像を検出できる', () => {
      const customContainer = document.createElement('div');
      customContainer.className = 'custom-container';
      const thumbnail = createMockThumbnail('https://i.ytimg.com/vi/custom/default.jpg', 'Custom Video');
      customContainer.appendChild(thumbnail);
      document.body.appendChild(customContainer);

      const thumbnails = domHandler.findThumbnailImages('.custom-container');
      expect(thumbnails).toHaveLength(1);
    });

    test('画像の親要素情報も含まれる', () => {
      const thumbnails = domHandler.findThumbnailImages();
      
      expect(thumbnails[0]).toHaveProperty('element');
      expect(thumbnails[0]).toHaveProperty('parentElement');
      expect(thumbnails[0]).toHaveProperty('src');
      expect(thumbnails[0].element.tagName).toBe('IMG');
    });
  });

  describe('サムネイル画像の置換', () => {
    let originalImage;
    let processedImage;

    beforeEach(() => {
      originalImage = createMockThumbnailImage('https://i.ytimg.com/vi/test/default.jpg');
      mockContainer.appendChild(originalImage);

      processedImage = document.createElement('img');
      processedImage.src = 'data:image/png;base64,processed-image-data';
      processedImage.width = originalImage.width;
      processedImage.height = originalImage.height;
    });

    test('画像を正常に置換できる', () => {
      const result = domHandler.replaceThumbnailImage(originalImage, processedImage);
      
      expect(result).toBe(true);
      expect(originalImage.src).toBe(processedImage.src);
      expect(originalImage.style.opacity).toBe('1');
    });

    test('置換後に元の属性が保持される', () => {
      originalImage.alt = 'Original Alt Text';
      originalImage.className = 'original-class';
      originalImage.dataset.testId = 'original-test-id';

      domHandler.replaceThumbnailImage(originalImage, processedImage);

      expect(originalImage.alt).toBe('Original Alt Text');
      expect(originalImage.className).toContain('original-class');
      expect(originalImage.dataset.testId).toBe('original-test-id');
    });

    test('処理済みマーカーが追加される', () => {
      domHandler.replaceThumbnailImage(originalImage, processedImage);
      
      expect(originalImage.dataset.facelessProcessed).toBe('true');
      expect(originalImage.className).toContain('faceless-youtube-processed');
    });

    test('無効な引数でエラーが発生する', () => {
      expect(() => domHandler.replaceThumbnailImage(null, processedImage))
        .toThrow('Invalid original image element');
      
      expect(() => domHandler.replaceThumbnailImage(originalImage, null))
        .toThrow('Invalid processed image element');
      
      expect(() => domHandler.replaceThumbnailImage('not-element', processedImage))
        .toThrow('Invalid original image element');
    });

    test('既に処理済みの画像は再処理されない', () => {
      // 最初の処理
      originalImage.dataset.facelessProcessed = 'true';
      
      const result = domHandler.replaceThumbnailImage(originalImage, processedImage);
      expect(result).toBe(false);
    });
  });

  describe('DOM変更の監視', () => {
    test('setupMutationObserverメソッドが存在する', () => {
      expect(typeof domHandler.setupMutationObserver).toBe('function');
    });

    test('disconnectObserverメソッドが存在する', () => {
      expect(typeof domHandler.disconnectObserver).toBe('function');
    });

    test('MutationObserverをセットアップできる', () => {
      const callback = jest.fn();
      
      domHandler.setupMutationObserver(callback);
      
      // 新しい要素を追加してコールバックが呼ばれることを確認
      const newElement = createMockThumbnail('https://i.ytimg.com/vi/new/default.jpg', 'New Video');
      
      // MutationObserverは非同期なので、少し待つ
      return new Promise(resolve => {
        setTimeout(() => {
          mockContainer.appendChild(newElement);
          setTimeout(() => {
            expect(callback).toHaveBeenCalled();
            resolve();
          }, 50);
        }, 10);
      });
    });
  });

  describe('ヘルパーメソッド', () => {
    test('isYouTubeThumbnailメソッドが正しく判定する', () => {
      const ytThumbnail = createMockThumbnailImage('https://i.ytimg.com/vi/test/default.jpg');
      const ytAvatar = createMockThumbnailImage('https://yt3.ggpht.com/avatar.jpg');
      const otherImage = createMockThumbnailImage('https://example.com/image.jpg');

      expect(domHandler.isYouTubeThumbnail(ytThumbnail)).toBe(true);
      expect(domHandler.isYouTubeThumbnail(ytAvatar)).toBe(true);
      expect(domHandler.isYouTubeThumbnail(otherImage)).toBe(false);
    });

    test('isAlreadyProcessedメソッドが正しく判定する', () => {
      const processedImage = createMockThumbnailImage('https://i.ytimg.com/vi/test/default.jpg');
      const unprocessedImage = createMockThumbnailImage('https://i.ytimg.com/vi/test2/default.jpg');
      
      processedImage.dataset.facelessProcessed = 'true';

      expect(domHandler.isAlreadyProcessed(processedImage)).toBe(true);
      expect(domHandler.isAlreadyProcessed(unprocessedImage)).toBe(false);
    });
  });

  // ヘルパー関数
  function createMockThumbnail(src, title) {
    const container = document.createElement('div');
    container.className = 'ytd-rich-item-renderer';
    
    const thumbnail = createMockThumbnailImage(src);
    thumbnail.alt = title;
    
    container.appendChild(thumbnail);
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