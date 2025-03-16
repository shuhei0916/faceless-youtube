const FILE_URL  = "./assets/sample_01.png";
const MODEL_URL = "./weights";

let img, canvas, context;

window.onload = (event) => {
    console.log("onload!");
    loadModels();
}

async function loadModels() {
    console.log("loadModels");
    Promise.all([
        faceapi.loadSsdMobilenetv1Model(MODEL_URL),
        faceapi.loadFaceLandmarkModel(MODEL_URL),
        faceapi.loadFaceRecognitionModel(MODEL_URL)
    ]).then(detectAllFaces);
}

async function detectAllFaces() {
    console.log("detectAllFaces");
    
    // 1, 画像の読み込み
    img = await faceapi.fetchImage(FILE_URL);

    // 2, HTMLからキャンバスを取得し画像を描画
    canvas = document.getElementById("myCanvas");
    canvas.width = img.width;
    canvas.height = img.height;
    context = canvas.getContext("2d");
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0); // 画像の描画

    // 3, 顔認識の実行と認識結果の取得
    const iSize = {width: img.width, height: img.height};
    const fData = await faceapi.detectAllFaces(img).withFaceLandmarks();
    
    // 4, 認識結果のリサイズ
    const rData = await faceapi.resizeResults(fData, iSize);
    rData.forEach(data => {
        drawResult(data);
        applyMosaic(data.detection.box);  // 顔にモザイク処理を適用
    });
}

function drawResult(data) {
    console.log("drawResult!!");

    const box = data.detection.box; // 長方形のデータ

    context.fillStyle = "red";
    context.strokeStyle = "red";
    context.lineWidth = 4;
    context.strokeRect(box.x, box.y, box.width, box.height); // 長方形の描画
}

function applyMosaic(box) {
    const x = box.x;
    const y = box.y;
    const width = box.width;
    const height = box.height;

    // 顔部分の画像を切り取る
    const imageData = context.getImageData(x, y, width, height);
    
    // モザイク処理を実行
    const mosaicImageData = mosaicFilter(imageData);
    
    // 加工したデータを再度描画
    context.putImageData(mosaicImageData, x, y);
}

// モザイク処理（サンプル）
function mosaicFilter(imageData) {
    const pixels = imageData.data;
    const blockSize = 10; // モザイクのサイズ

    for (let y = 0; y < imageData.height; y += blockSize) {
        for (let x = 0; x < imageData.width; x += blockSize) {
            const offset = (y * imageData.width + x) * 4;

            const r = pixels[offset];
            const g = pixels[offset + 1];
            const b = pixels[offset + 2];
            
            // ブロック内のすべてのピクセルを同じ色にする
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
