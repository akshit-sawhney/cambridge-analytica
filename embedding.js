import {writeFileSync} from 'fs';
import * as tf from '@tensorflow/tfjs';

function extractEmbeddingMatrix(model) {
  for (const layer of model.layers) {
    if (layer.getClassName() === 'Embedding') {
      const embed = layer.getWeights()[0];
      tf.util.assert(
        embed.rank === 2,
        `Expected the rank of an embedding matrix to be 2, ` + 
        `but got ${embed.rank}`);
      return embed;
    }
  }
  throw new Error('Cannot find any Embedding layer in model.');
}

export async function writeEmbeddingMatrixAndLabels(
    model, prefix, wordIndex, indexFrom) {
  tf.util.assert(
      prefix != null && prefix.length > 0,
      `Null, undefined or empty path prefix`);

  const embed = extractEmbeddingMatrix(model);

  const numWords = embed.shape[0];
  const embedDims = embed.shape[1];
  const embedData = await embed.data();
  
  // Write the ebmedding matrix to file.
  let vectorsStr = '';
  let index = 0;
  for (let i = 0; i < numWords; ++i) {
    for (let j = 0; j < embedDims; ++j) {
      vectorsStr += embedData[index++].toFixed(5);
      if (j < embedDims - 1) {
        vectorsStr += '\t';
      } else {
        vectorsStr += '\n';
      }
    }
  }

  const vectorsFilePath = `${prefix}_vectors.tsv`;
  writeFileSync(vectorsFilePath, vectorsStr, {encoding: 'utf-8'});
  console.log(
      `Written embedding vectors (${numWords} * ${embedDims}) to: ` +
      `${vectorsFilePath}`);

  // Collect and write the word labels.
  const indexToWord = {};
  for (const word in wordIndex) {
    indexToWord[wordIndex[word]] = word;
  }

  let labelsStr = '';
  for(let i = 0; i < numWords; ++i) {
    if (i >= indexFrom) {
      labelsStr += indexToWord[i - indexFrom];
    } else {
      labelsStr += 'not-a-word';
    }
    labelsStr += '\n';
  }

  const labelsFilePath = `${prefix}_labels.tsv`;
  writeFileSync(labelsFilePath, labelsStr, {encoding: 'utf-8'});
  console.log(
      `Written embedding labels (${numWords}) to: ` +
      `${labelsFilePath}`);
}
