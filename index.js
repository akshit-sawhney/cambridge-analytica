import * as tf from '@tensorflow/tfjs';
import * as loader from './loader';
import * as ui from './ui';
import {OOV_INDEX, padSequences} from './sequence_utils';

const HOSTED_URLS = {
  model:
      'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json',
  metadata:
      'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json'
};

class SentimentPredictor {
  async init(urls) {
    this.urls = urls;
    this.model = await loader.loadHostedPretrainedModel(urls.model);
    await this.loadMetadata();
    return this;
  }

  async loadMetadata() {
    const sentimentMetadata =
        await loader.loadHostedMetadata(this.urls.metadata);
    ui.showMetadata(sentimentMetadata);
    this.indexFrom = sentimentMetadata['index_from'];
    this.maxLen = sentimentMetadata['max_len'];
    console.log('indexFrom = ' + this.indexFrom);
    console.log('maxLen = ' + this.maxLen);

    this.wordIndex = sentimentMetadata['word_index'];
    this.vocabularySize = sentimentMetadata['vocabulary_size'];
  }

  predict(text) {
    const inputText =
        text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
    const sequence = inputText.map(word => {
      let wordIndex = this.wordIndex[word] + this.indexFrom;
      if (wordIndex > this.vocabularySize) {
        wordIndex = OOV_INDEX;
      }
      return wordIndex;
    });
    const paddedSequence = padSequences([sequence], this.maxLen);
    const input = tf.tensor2d(paddedSequence, [1, this.maxLen]);

    const predictOut = this.model.predict(input);
    const score = predictOut.dataSync()[0];
    predictOut.dispose();

    return {score: score};
  }
};

async function setupSentiment() {
  if (await loader.urlExists(HOSTED_URLS.model)) {
    ui.status('Model available: ' + HOSTED_URLS.model);
    const predictor = await new SentimentPredictor().init(HOSTED_URLS);
    ui.prepUI(x => predictor.predict(x));
    button.style.display = 'inline-block';
  }

  ui.status('Standing by.');
}

setupSentiment();
