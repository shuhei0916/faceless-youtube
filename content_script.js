const MODEL_URL = chrome.runtime.getURL("weights/");

async function loadModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    ]);
}

function setupObserver() {
    const observer = new MutationObserver(() => {
        document.querySelectorAll("ytd-thumbnail img, ytm-shorts-lockup-view-model-v2 img").forEach((img) => {
            if (!img.dataset.processed) {
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
    if (img.dataset.processed) return;
    img.dataset.processed = "true";

    if (!img.crossOrigin) {
        img.crossOrigin = 'Anonymous';
    }

    try {
        const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.1 });
        const detections = await faceapi.detectAllFaces(img, options);

        if (detections.length > 0) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            detections.forEach(detection => {
                const { x, y, width, height } = detection.box;
                ctx.fillStyle = 'grey';
                ctx.fillRect(x, y, width, height);
            });

            img.src = canvas.toDataURL();
        }
    } catch (error) {
        console.error("Faceless YouTube Error:", error);
    }
}

async function init() {
    await loadModels();
    // 最初に表示されている画像を処理
    document.querySelectorAll("ytd-thumbnail img, ytm-shorts-lockup-view-model-v2 img").forEach(applyFaceDetection);
    setupObserver();
}

init();
