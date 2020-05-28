export function status(statusText) {
  console.log(statusText);
  document.getElementById('status').textContent = statusText;
}

export function showMetadata(sentimentMetadataJSON) {
  document.getElementById('modelType').textContent =
      sentimentMetadataJSON['model_type'];
  document.getElementById('vocabularySize').textContent =
      sentimentMetadataJSON['vocabulary_size'];
  document.getElementById('maxLen').textContent =
      sentimentMetadataJSON['max_len'];
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

export function disableLoadModelButtons() {
  document.getElementById('load-pretrained-remote').style.display = 'none';
  document.getElementById('load-pretrained-local').style.display = 'none';
}
