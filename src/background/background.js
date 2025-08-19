// Faceless YouTube - バックグラウンドスクリプト

// 拡張機能のインストール時やアップデート時の処理
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🎭 Faceless YouTube installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // 初回インストール時の処理
    console.log('🎭 First time installation, setting up defaults...');
    
    // デフォルト設定を保存
    const defaultConfig = {
      enabled: true,
      processingMode: 'blackout',
      autoStart: true
    };
    
    try {
      await chrome.storage.sync.set({
        facelessYoutube: defaultConfig
      });
      console.log('🎭 Default configuration saved');
    } catch (error) {
      console.error('🎭 Failed to save default configuration:', error);
    }
  }
});

// ポップアップや他のスクリプトからのメッセージを処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🎭 Background received message:', request);

  switch (request.action) {
    case 'getTabStatus':
      // アクティブタブの状態を取得
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0] && tabs[0].url.includes('youtube.com')) {
          try {
            // コンテンツスクリプトにメッセージを送信
            const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' });
            sendResponse({ 
              success: true, 
              isYoutube: true,
              ...response 
            });
          } catch (error) {
            sendResponse({ 
              success: false, 
              isYoutube: true, 
              error: 'Content script not ready' 
            });
          }
        } else {
          sendResponse({ 
            success: true, 
            isYoutube: false, 
            message: 'Not on YouTube' 
          });
        }
      });
      return true; // 非同期レスポンス

    case 'toggleExtension':
      // 拡張機能のON/OFF切り替え
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0] && tabs[0].url.includes('youtube.com')) {
          try {
            const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' });
            sendResponse(response);
          } catch (error) {
            sendResponse({ success: false, error: error.message });
          }
        } else {
          sendResponse({ success: false, error: 'Not on YouTube page' });
        }
      });
      return true;

    case 'updateConfig':
      // 設定を更新
      chrome.storage.sync.set({
        facelessYoutube: request.config
      }).then(() => {
        sendResponse({ success: true });
        
        // アクティブなYouTubeタブに設定変更を通知
        chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'configUpdated',
              config: request.config 
            }).catch(() => {
              // コンテンツスクリプトが準備できていない場合は無視
            });
          });
        });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// タブの更新時の処理
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // YouTube ページが完全に読み込まれた時
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    console.log('🎭 YouTube page loaded:', tab.url);
    
    // 少し待ってからコンテンツスクリプトに再初期化を指示
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: 'reinitialize' }).catch(() => {
        // コンテンツスクリプトがまだ準備できていない場合は無視
        console.log('🎭 Content script not ready for reinitialize message');
      });
    }, 1000);
  }
});

// アクションボタンがクリックされた時の処理
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes('youtube.com')) {
    try {
      // 拡張機能の状態を切り替え
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
      
      if (response.success) {
        console.log('🎭 Extension toggled successfully');
      } else {
        console.error('🎭 Failed to toggle extension:', response.error);
      }
    } catch (error) {
      console.error('🎭 Error communicating with content script:', error);
    }
  } else {
    console.log('🎭 Not on YouTube page, extension inactive');
  }
});

// 設定の変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.facelessYoutube) {
    console.log('🎭 Configuration changed:', changes.facelessYoutube);
  }
});

console.log('🎭 Faceless YouTube background script loaded');