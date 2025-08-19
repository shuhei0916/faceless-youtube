// 設定管理モジュールのテスト
const { ConfigManager } = require('../../src/modules/configManager/ConfigManager.js');

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    // Chrome storage APIのモック初期化
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
  });

  describe('基本機能', () => {
    test('ConfigManagerクラスがインスタンス化できる', () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
    });

    test('デフォルト設定が正しく設定される', () => {
      const defaults = configManager.getDefaults();
      
      expect(defaults).toHaveProperty('enabled');
      expect(defaults).toHaveProperty('processingMode');
      expect(defaults).toHaveProperty('autoStart');
      expect(defaults.enabled).toBe(true);
      expect(defaults.processingMode).toBe('blackout');
      expect(defaults.autoStart).toBe(true);
    });
  });

  describe('設定の読み込み', () => {
    test('loadConfigメソッドが存在する', () => {
      expect(typeof configManager.loadConfig).toBe('function');
    });

    test('設定が存在しない場合はデフォルト値を返す', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      
      const config = await configManager.loadConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.processingMode).toBe('blackout');
      expect(config.autoStart).toBe(true);
    });

    test('保存された設定を正しく読み込む', async () => {
      const savedConfig = {
        facelessYoutube: {
          enabled: false,
          processingMode: 'mosaic',
          autoStart: false,
          customSetting: 'test'
        }
      };
      chrome.storage.sync.get.mockResolvedValue(savedConfig);
      
      const config = await configManager.loadConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.processingMode).toBe('mosaic');
      expect(config.autoStart).toBe(false);
      expect(config.customSetting).toBe('test');
    });

    test('部分的な設定でもデフォルト値で補完される', async () => {
      const partialConfig = {
        facelessYoutube: {
          enabled: false
        }
      };
      chrome.storage.sync.get.mockResolvedValue(partialConfig);
      
      const config = await configManager.loadConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.processingMode).toBe('blackout'); // デフォルト値
      expect(config.autoStart).toBe(true); // デフォルト値
    });
  });

  describe('設定の保存', () => {
    test('saveConfigメソッドが存在する', () => {
      expect(typeof configManager.saveConfig).toBe('function');
    });

    test('設定を正しく保存できる', async () => {
      const newConfig = {
        enabled: false,
        processingMode: 'mosaic',
        autoStart: false
      };
      
      await configManager.saveConfig(newConfig);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        facelessYoutube: newConfig
      });
    });

    test('無効な設定でエラーが発生する', async () => {
      await expect(configManager.saveConfig(null))
        .rejects.toThrow('Invalid configuration object');
      
      await expect(configManager.saveConfig('not-object'))
        .rejects.toThrow('Invalid configuration object');
    });

    test('保存エラー時の適切なエラーハンドリング', async () => {
      chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));
      
      const config = { enabled: true };
      await expect(configManager.saveConfig(config))
        .rejects.toThrow('Failed to save configuration');
    });
  });

  describe('個別設定の取得・設定', () => {
    beforeEach(async () => {
      chrome.storage.sync.get.mockResolvedValue({
        facelessYoutube: {
          enabled: true,
          processingMode: 'blackout',
          autoStart: false
        }
      });
      chrome.storage.sync.set.mockResolvedValue();
      await configManager.loadConfig();
    });

    test('isEnabledメソッドが正しく動作する', async () => {
      expect(await configManager.isEnabled()).toBe(true);
    });

    test('setEnabledメソッドが正しく動作する', async () => {
      await configManager.setEnabled(false);
      expect(await configManager.isEnabled()).toBe(false);
      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });

    test('getProcessingModeメソッドが正しく動作する', async () => {
      expect(await configManager.getProcessingMode()).toBe('blackout');
    });

    test('setProcessingModeメソッドが正しく動作する', async () => {
      await configManager.setProcessingMode('mosaic');
      expect(await configManager.getProcessingMode()).toBe('mosaic');
      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });

    test('isAutoStartEnabledメソッドが正しく動作する', async () => {
      expect(await configManager.isAutoStartEnabled()).toBe(false);
    });

    test('setAutoStartEnabledメソッドが正しく動作する', async () => {
      await configManager.setAutoStartEnabled(true);
      expect(await configManager.isAutoStartEnabled()).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });
  });

  describe('設定のリセット', () => {
    test('resetConfigメソッドが存在する', () => {
      expect(typeof configManager.resetConfig).toBe('function');
    });

    test('設定をデフォルト値にリセットできる', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      await configManager.resetConfig();
      
      const defaults = configManager.getDefaults();
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        facelessYoutube: defaults
      });
    });
  });

  describe('設定変更イベント', () => {
    test('onConfigChangedメソッドが存在する', () => {
      expect(typeof configManager.onConfigChanged).toBe('function');
    });

    test('設定変更時にコールバックが呼ばれる', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      chrome.storage.sync.get.mockResolvedValue({
        facelessYoutube: { enabled: true, processingMode: 'blackout', autoStart: true }
      });
      await configManager.loadConfig();
      
      const callback = jest.fn();
      configManager.onConfigChanged(callback);
      
      await configManager.setEnabled(false);
      
      expect(callback).toHaveBeenCalledWith({
        enabled: false,
        key: 'enabled',
        oldValue: expect.any(Boolean),
        newValue: false
      });
    });

    test('removeConfigChangedListenerメソッドが存在する', () => {
      expect(typeof configManager.removeConfigChangedListener).toBe('function');
    });
  });

  describe('バリデーション', () => {
    test('validateConfigメソッドが正しく検証する', () => {
      const validConfig = {
        enabled: true,
        processingMode: 'blackout',
        autoStart: false
      };
      
      expect(configManager.validateConfig(validConfig)).toBe(true);
    });

    test('無効な設定を正しく検証する', () => {
      const invalidConfigs = [
        { enabled: 'not-boolean' },
        { processingMode: 'invalid-mode' },
        { autoStart: 'not-boolean' }
      ];
      
      invalidConfigs.forEach(config => {
        expect(configManager.validateConfig(config)).toBe(false);
      });
    });
  });

  describe('ストレージタイプの切り替え', () => {
    test('useLocalStorageメソッドが存在する', () => {
      expect(typeof configManager.useLocalStorage).toBe('function');
    });

    test('useSyncStorageメソッドが存在する', () => {
      expect(typeof configManager.useSyncStorage).toBe('function');
    });

    test('ローカルストレージに切り替えて動作する', async () => {
      configManager.useLocalStorage();
      
      const config = { enabled: false };
      await configManager.saveConfig(config);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        facelessYoutube: config
      });
    });
  });
});