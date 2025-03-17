// YouTubeのサムネイルに対して顔認識＆モザイク処理を行う
console.log("content_script.js loaded");

const MODEL_URL = chrome.runtime.getURL("weights");

async function loadModels() {
    await Promise.all([
        faceapi.loadSsdMobilenetv1Model(MODEL_URL),
        faceapi.loadFaceLandmarkModel(MODEL_URL),
        faceapi.loadFaceRecognitionModel(MODEL_URL)
    ]);
    console.log("Face-api.js models loaded");
    processThumbnails();
}

async function processThumbnails() {
    const thumbnails = document.querySelectorAll("ytd-thumbnail img");
    for (const img of thumbnails) {
        if (!img.complete) {
            img.onload = () => applyFaceDetection(img);
        } else {
            applyFaceDetection(img);
        }
    }
}

async function applyFaceDetection(img) {
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0, img.width, img.height);

    detections.forEach(detection => {
        applyMosaic(context, detection.detection.box);
    });

    img.src = canvas.toDataURL();
}

function applyMosaic(context, box) {
    const { x, y, width, height } = box;
    const imageData = context.getImageData(x, y, width, height);
    const mosaicImageData = mosaicFilter(imageData);
    context.putImageData(mosaicImageData, x, y);
}

function mosaicFilter(imageData) {
    const pixels = imageData.data;
    const blockSize = 5;
    for (let y = 0; y < imageData.height; y += blockSize) {
        for (let x = 0; x < imageData.width; x += blockSize) {
            const offset = (y * imageData.width + x) * 4;
            const r = pixels[offset], g = pixels[offset + 1], b = pixels[offset + 2];
            for (let by = 0; by < blockSize && y + by < imageData.height; by++) {
                for (let bx = 0; bx < blockSize && x + bx < imageData.width; bx++) {
                    const idx = ((y + by) * imageData.width + (x + bx)) * 4;
                    pixels[idx] = r;
                    pixels[idx + 1] = g;
                    pixels[idx + 2] = b;
                }
            }
        }
    }
    return imageData;
}

loadModels();
