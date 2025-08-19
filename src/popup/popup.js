// Faceless YouTube ポップアップ JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎭 Popup loaded');
    
    // DOM要素の取得
    const elements = {
        statusIndicator: document.getElementById('statusIndicator'),
        statusIcon: document.getElementById('statusIcon'),
        statusText: document.getElementById('statusText'),
        toggleBtn: document.getElementById('toggleBtn'),
        toggleText: document.getElementById('toggleText'),
        processingMode: document.getElementById('processingMode'),
        autoStart: document.getElementById('autoStart'),
        statsSection: document.getElementById('statsSection'),
        processedCount: document.getElementById('processedCount'),
        skippedCount: document.getElementById('skippedCount'),
        helpLink: document.getElementById('helpLink'),
        feedbackLink: document.getElementById('feedbackLink')
    };

    let currentConfig = null;
    let currentStatus = null;

    // 初期化
    await initialize();

    // イベントリスナーの設定
    setupEventListeners();

    // 初期化関数
    async function initialize() {
        try {
            // ステータスを取得
            await updateStatus();
            
            // 設定を読み込み
            await loadConfig();
            
            console.log('🎭 Popup initialization complete');
        } catch (error) {
            console.error('🎭 Popup initialization failed:', error);
            showError('初期化に失敗しました');
        }
    }

    // ステータス更新
    async function updateStatus() {
        try {
            const response = await sendMessage({ action: 'getTabStatus' });
            currentStatus = response;

            if (!response.isYoutube) {
                showNotYouTube();
                return;
            }

            if (response.success) {
                showActive(response);
            } else {
                showError(response.error || 'コンテンツスクリプトが準備できていません');
            }
        } catch (error) {
            console.error('🎭 Failed to get status:', error);
            showError('ステータスの取得に失敗しました');
        }
    }

    // 設定読み込み
    async function loadConfig() {
        try {
            const result = await chrome.storage.sync.get('facelessYoutube');
            currentConfig = result.facelessYoutube || {
                enabled: true,
                processingMode: 'blackout',
                autoStart: true
            };

            // UI に反映
            elements.processingMode.value = currentConfig.processingMode;
            elements.autoStart.checked = currentConfig.autoStart;
            
            console.log('🎭 Config loaded:', currentConfig);
        } catch (error) {
            console.error('🎭 Failed to load config:', error);
        }
    }

    // 設定保存
    async function saveConfig() {
        try {
            await sendMessage({
                action: 'updateConfig',
                config: currentConfig
            });
            console.log('🎭 Config saved:', currentConfig);
        } catch (error) {
            console.error('🎭 Failed to save config:', error);
            showError('設定の保存に失敗しました');
        }
    }

    // イベントリスナー設定
    function setupEventListeners() {
        // Toggle button
        elements.toggleBtn.addEventListener('click', async () => {
            elements.toggleBtn.disabled = true;
            try {
                const response = await sendMessage({ action: 'toggleExtension' });
                if (response.success) {
                    await updateStatus();
                } else {
                    showError(response.error || '切り替えに失敗しました');
                }
            } catch (error) {
                console.error('🎭 Toggle failed:', error);
                showError('切り替えに失敗しました');
            } finally {
                elements.toggleBtn.disabled = false;
            }
        });

        // Processing mode
        elements.processingMode.addEventListener('change', async () => {
            currentConfig.processingMode = elements.processingMode.value;
            await saveConfig();
        });

        // Auto start
        elements.autoStart.addEventListener('change', async () => {
            currentConfig.autoStart = elements.autoStart.checked;
            await saveConfig();
        });

        // Help link
        elements.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ 
                url: 'https://github.com/anthropics/claude-code/blob/main/README.md' 
            });
        });

        // Feedback link
        elements.feedbackLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ 
                url: 'https://github.com/anthropics/claude-code/issues' 
            });
        });
    }

    // UI状態更新関数
    function showActive(status) {
        elements.statusIndicator.className = 'status-indicator ' + (status.enabled ? 'active' : 'inactive');
        elements.statusIcon.textContent = status.enabled ? '✅' : '⏸️';
        elements.statusText.textContent = status.enabled ? '有効' : '無効';
        
        elements.toggleBtn.disabled = false;
        elements.toggleText.textContent = status.enabled ? '無効にする' : '有効にする';

        if (status.enabled && status.initialized) {
            elements.statsSection.style.display = 'block';
            elements.processedCount.textContent = status.processed || 0;
            elements.skippedCount.textContent = status.skipped || 0;
        } else {
            elements.statsSection.style.display = 'none';
        }
    }

    function showNotYouTube() {
        elements.statusIndicator.className = 'status-indicator';
        elements.statusIcon.textContent = '🌐';
        elements.statusText.textContent = 'YouTubeページではありません';
        elements.toggleBtn.disabled = true;
        elements.toggleText.textContent = 'YouTubeで使用可能';
        elements.statsSection.style.display = 'none';
    }

    function showError(message) {
        elements.statusIndicator.className = 'status-indicator error';
        elements.statusIcon.textContent = '❌';
        elements.statusText.textContent = message;
        elements.toggleBtn.disabled = true;
        elements.toggleText.textContent = 'エラー';
        elements.statsSection.style.display = 'none';
    }

    // メッセージ送信ヘルパー
    function sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // 定期的にステータスを更新
    setInterval(async () => {
        if (currentStatus && currentStatus.isYoutube) {
            await updateStatus();
        }
    }, 5000);

    console.log('🎭 Popup script loaded');
});