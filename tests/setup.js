// Jest setup file
// Chrome拡張機能のAPIをモック化

// Chrome拡張機能APIのモック
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue()
    },
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(),
      remove: jest.fn().mockResolvedValue()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn().mockResolvedValue()
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue()
  }
};

// DOM環境のセットアップ
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://www.youtube.com/',
    hostname: 'www.youtube.com'
  },
  writable: true
});

// Canvas API のモック（顔検出で使用）
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  drawImage: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  }),
  putImageData: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn()
});

// Image オブジェクトのモック
global.Image = class {
  constructor() {
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
  }
  
  set src(value) {
    this._src = value;
    // 非同期でonloadを呼び出す
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
  
  get src() {
    return this._src;
  }
};