const FILE_URL  = "./assets/sample_01.png";
const MODEL_URL = "./weights";

let img, canvas, context;

window.onload = (event)=>{
	console.log("onload!");
	loadModels();
}

async function loadModels(){
	console.log("loadModels");
	Promise.all([
		faceapi.loadSsdMobilenetv1Model(MODEL_URL),
		faceapi.loadFaceLandmarkModel(MODEL_URL),
		faceapi.loadFaceRecognitionModel(MODEL_URL)
	]).then(detectAllFaces);
}

async function detectAllFaces(){
	console.log("detectAllFaces");
	// ここで画像解析を行います。
}