// 設定管理モジュール
class ConfigManager {
  constructor() {
    this.storageArea = chrome.storage.sync;
    this.configKey = 'facelessYoutube';
    this.currentConfig = null;
    this.changeListeners = [];
    
    this.defaults = {
      enabled: true,
      processingMode: 'blackout', // 'blackout' | 'mosaic'
      autoStart: true
    };
  }

  getDefaults() {
    return { ...this.defaults };
  }

  async loadConfig() {
    try {
      const stored = await this.storageArea.get(this.configKey);
      const savedConfig = stored[this.configKey] || {};
      
      // デフォルト値とマージ
      this.currentConfig = { ...this.defaults, ...savedConfig };
      return this.currentConfig;
    } catch (error) {
      // エラー時はデフォルト値を返す
      this.currentConfig = { ...this.defaults };
      return this.currentConfig;
    }
  }

  async saveConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration object');
    }

    try {
      this.currentConfig = { ...config };
      await this.storageArea.set({
        [this.configKey]: config
      });
    } catch (error) {
      throw new Error('Failed to save configuration');
    }
  }

  async isEnabled() {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    return this.currentConfig.enabled;
  }

  async setEnabled(enabled) {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    
    const oldValue = this.currentConfig.enabled;
    this.currentConfig.enabled = enabled;
    
    await this.saveConfig(this.currentConfig);
    this._notifyConfigChanged('enabled', oldValue, enabled);
  }

  async getProcessingMode() {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    return this.currentConfig.processingMode;
  }

  async setProcessingMode(mode) {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    
    const oldValue = this.currentConfig.processingMode;
    this.currentConfig.processingMode = mode;
    
    await this.saveConfig(this.currentConfig);
    this._notifyConfigChanged('processingMode', oldValue, mode);
  }

  async isAutoStartEnabled() {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    return this.currentConfig.autoStart;
  }

  async setAutoStartEnabled(enabled) {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    
    const oldValue = this.currentConfig.autoStart;
    this.currentConfig.autoStart = enabled;
    
    await this.saveConfig(this.currentConfig);
    this._notifyConfigChanged('autoStart', oldValue, enabled);
  }

  async resetConfig() {
    const defaults = this.getDefaults();
    await this.saveConfig(defaults);
  }

  onConfigChanged(callback) {
    if (typeof callback === 'function') {
      this.changeListeners.push(callback);
    }
  }

  removeConfigChangedListener(callback) {
    const index = this.changeListeners.indexOf(callback);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  _notifyConfigChanged(key, oldValue, newValue) {
    const eventData = {
      enabled: this.currentConfig.enabled,
      key,
      oldValue,
      newValue
    };

    this.changeListeners.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });
  }

  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // enabled の検証
    if (config.hasOwnProperty('enabled') && typeof config.enabled !== 'boolean') {
      return false;
    }

    // processingMode の検証
    if (config.hasOwnProperty('processingMode')) {
      const validModes = ['blackout', 'mosaic'];
      if (!validModes.includes(config.processingMode)) {
        return false;
      }
    }

    // autoStart の検証
    if (config.hasOwnProperty('autoStart') && typeof config.autoStart !== 'boolean') {
      return false;
    }

    return true;
  }

  useLocalStorage() {
    this.storageArea = chrome.storage.local;
  }

  useSyncStorage() {
    this.storageArea = chrome.storage.sync;
  }
}

module.exports = { ConfigManager };