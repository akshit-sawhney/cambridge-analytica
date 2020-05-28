export function status(statusText) {
  document.getElementById('status').textContent = statusText;
}

export function showMetadata(sentimentMetadataJSON) {
  document.getElementById('modelType').textContent =
      sentimentMetadataJSON['model_type'];
}

export function prepUI(predict) {
  setPredictFunction(predict);
}

export function getReviewText() {
  const reviewText = document.getElementById('review-text');
  return reviewText.value;
}

function doPredict(predict) {
  const reviewText = document.getElementById('review-text');
  const result = predict(reviewText.value);
  status(
      'Inference result (0 - negative; 1 - positive): ' +
      result.score.toFixed(6));
}

function setPredictFunction(predict) {
  const reviewText = document.getElementById('review-text');
  reviewText.addEventListener('input', () => doPredict(predict));
}
