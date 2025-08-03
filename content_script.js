const MODEL_URL = chrome.runtime.getURL("weights/");

console.log("content_script.js loaded");
// injectStyles(); // 問題切り分けのため一時的にCSSを無効化
loadModels();
setupObserver();

// function injectStyles() {
//     const style = document.createElement('style');
//     style.textContent = `
//     ytd-thumbnail img:not([data-processed="true"]),
//     ytm-shorts-lockup-view-model-v2 img:not([data-processed="true"]) {
//       visibility: hidden;
//     }
//     ytd-thumbnail img[data-processed="true"],
//     ytm-shorts-lockup-view-model-v2 img[data-processed="true"] {
//       visibility: visible !important;
//     }
//   `;
//     document.head.appendChild(style);
// }

async function loadModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
    ]);
    console.log("Face-api.js models loaded");
}

function setupObserver() {
    console.log("Setting up observer...");
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                // 新しく追加されたノード内に画像があるかチェック
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // ELEMENT_NODE
                        const images = node.querySelectorAll("ytd-thumbnail img, ytm-shorts-lockup-view-model-v2 img");
                        images.forEach(img => {
                            if (!img.dataset.processed) {
                                console.log("Found new image:", img.src);
                                if (img.complete && img.naturalWidth > 0) {
                                    applyFaceDetection(img);
                                } else {
                                    img.onload = () => {
                                        console.log("Image loaded, applying detection:", img.src);
                                        applyFaceDetection(img);
                                    };
                                }
                            }
                        });
                    }
                });
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log("Observer is now watching.");
}

async function applyFaceDetection(img) {
    if (img.dataset.processed) return; // 多重処理を厳密に防ぐ
    console.log("Applying face detection to:", img.src);
    img.dataset.processed = "true";

    if (!img.crossOrigin) {
        img.crossOrigin = 'Anonymous';
    }

    try {
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
        console.log(`Found ${detections.length} faces in`, img.src);

        if (detections.length > 0) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            detections.forEach(detection => {
                const { x, y, width, height } = detection.box;
                console.log("Applying grey box to face at:", {x, y, width, height});
                ctx.fillStyle = 'grey';
                ctx.fillRect(x, y, width, height);
            });

            img.src = canvas.toDataURL();
            console.log("Image source updated for:", img.src);
        }
    } catch (error) {
        console.error("Face detection error:", error, img.src);
    }
}
