const MODEL_URL = chrome.runtime.getURL("weights/");

console.log("content_script.js loaded");
injectStyles();
loadModels();
setupObserver();

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
    ytd-thumbnail img:not([data-processed="true"]),
    ytm-shorts-lockup-view-model-v2 img:not([data-processed="true"]) {
      visibility: hidden;
    }
  `;
    document.head.appendChild(style);
}

async function loadModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    ]);
    console.log("Face-api.js models loaded");
}

function setupObserver() {
    const observer = new MutationObserver(() => {
        // 通常のサムネイルとショート動画のサムネイルを両方対象にする
        document.querySelectorAll("ytd-thumbnail img, ytm-shorts-lockup-view-model-v2 img").forEach((img) => {
            if (!img.dataset.processed) {
                // 画像の読み込み完了を待つ
                if (img.complete && img.naturalWidth > 0) {
                    applyFaceDetection(img);
                } else {
                    img.onload = () => applyFaceDetection(img);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

async function applyFaceDetection(img) {
    // 処理済みフラグを先につけて、多重処理を防ぐ
    img.dataset.processed = "true";

    // CORSの問題を回避するために、画像を描画する前にcrossOriginプロパティを設定
    if (!img.crossOrigin) {
        img.crossOrigin = 'Anonymous';
    }

    try {
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());

        // 顔が検出された場合のみ処理を行う
        if (detections.length > 0) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // 元の画像を描画
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 検出された顔を灰色で塗りつぶす（デバッグ用）
            detections.forEach(detection => {
                const { x, y, width, height } = detection.box;
                ctx.fillStyle = 'grey';
                ctx.fillRect(x, y, width, height);
            });

            // 処理済みの画像をセット
            img.src = canvas.toDataURL();
        }
        // 顔が検出されなかった場合は何もしない（元の画像が表示される）

    } catch (error) {
        console.error("Face detection error:", error);
    }
}
