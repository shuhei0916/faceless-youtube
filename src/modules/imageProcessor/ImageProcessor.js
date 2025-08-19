// 画像処理モジュール
class ImageProcessor {
  constructor() {
    // 初期化処理
  }

  async applyBlackout(imageElement, faceRegions) {
    // バリデーション
    if (!imageElement || !imageElement.tagName || imageElement.tagName !== 'IMG') {
      throw new Error('Invalid image element');
    }

    if (!Array.isArray(faceRegions)) {
      throw new Error('Invalid face regions');
    }

    // 顔領域が空の場合は元画像をそのまま返す
    if (faceRegions.length === 0) {
      return imageElement;
    }

    try {
      // Canvas要素を作成
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Canvasサイズを画像サイズに設定
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;

      // 元画像をCanvasに描画
      ctx.drawImage(imageElement, 0, 0);

      // 顔領域を黒塗り
      ctx.fillStyle = '#000000';
      faceRegions.forEach(region => {
        ctx.fillRect(region.x, region.y, region.width, region.height);
      });

      // 処理済み画像を新しいImg要素として返す
      const processedImage = document.createElement('img');
      processedImage.src = canvas.toDataURL();
      processedImage.width = imageElement.width;
      processedImage.height = imageElement.height;

      return processedImage;
    } catch (error) {
      throw new Error('Failed to process image');
    }
  }

  async applyMosaic(imageElement, faceRegions) {
    // 現在はモザイクも黒塗りと同じ処理
    // 将来的にはピクセル化処理を実装
    return await this.applyBlackout(imageElement, faceRegions);
  }
}

module.exports = { ImageProcessor };