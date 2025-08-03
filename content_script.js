const MODEL_URL = chrome.runtime.getURL("weights/");

console.log("content_script.js loaded");
injectStyles();
loadModels();
setupObserver();

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
    ytd-thumbnail img:not([data-processed="true"]) {
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
        document.querySelectorAll("ytd-thumbnail img").forEach((img) => {
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
    // CORSの問題を回避するために、画像を描画する前にcrossOriginプロパティを設定
    if (!img.crossOrigin) {
        img.crossOrigin = 'Anonymous';
    }

    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 元の画像を描画
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 検出された顔にモザイクをかける
    detections.forEach(detection => {
        const { x, y, width, height } = detection.box;
        const mosaicSize = 15; // モザイクの粗さ
        ctx.drawImage(canvas, x, y, width, height, x, y, mosaicSize, mosaicSize);
        ctx.imageSmoothingEnabled = false; // ぼかしを無効にしてモザイク感を出す
        ctx.drawImage(canvas, x, y, mosaicSize, mosaicSize, x, y, width, height);
        ctx.imageSmoothingEnabled = true;
    });

    // 処理済みの画像をセット
    img.src = canvas.toDataURL();
    img.dataset.processed = "true";
}
