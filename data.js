import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';

import {OOV_INDEX, padSequences} from './sequence_utils';

const extract = require('extract-zip');

const DATA_ZIP_URL =
    'https://storage.googleapis.com/learnjs-data/imdb/imdb_tfjs_data.zip';
const METADATA_TEMPLATE_URL =
    'https://storage.googleapis.com/learnjs-data/imdb/metadata.json.zip';


function loadFeatures(filePath, numWords, maxLen, multihot = false) {
  const buffer = fs.readFileSync(filePath);
  const numBytes = buffer.byteLength;

  let sequences = [];
  let seq = [];
  let index = 0;

  while (index < numBytes) {
    const value = buffer.readInt32LE(index);
    if (value === 1) {
      if (index > 0) {
        sequences.push(seq);
      }
      seq = [];
    } else {
      seq.push(value >= numWords ? OOV_INDEX : value);
    }
    index += 4;
  }
  if (seq.length > 0) {
    sequences.push(seq);
  }

  let minLength = Infinity;
  let maxLength = -Infinity;
  sequences.forEach(seq => {
    const length = seq.length;
    if (length < minLength) {
      minLength = length;
    }
    if (length > maxLength) {
      maxLength = length;
    }
  });
  console.log(`Sequence length: min = ${minLength}; max = ${maxLength}`);

  if (multihot) {
    const buffer = tf.buffer([sequences.length, numWords]);
    sequences.forEach((seq, i) => {
      seq.forEach(wordIndex => {
        if (wordIndex !== OOV_INDEX) {
          buffer.set(1, i, wordIndex);
        }
      });
    });
    return buffer.toTensor();
  } else {
    const paddedSequences =
        padSequences(sequences, maxLen, 'pre', 'pre');
    return tf.tensor2d(
        paddedSequences, [paddedSequences.length, maxLen], 'int32');
  }
}

function loadTargets(filePath) {
  const buffer = fs.readFileSync(filePath);
  const numBytes = buffer.byteLength;

  let numPositive = 0;
  let numNegative = 0;

  let ys = [];
  for (let i = 0; i < numBytes; ++i) {
    const y = buffer.readUInt8(i);
    if (y === 1) {
      numPositive++;
    } else {
      numNegative++;
    }
    ys.push(y);
  }

  console.log(
      `Loaded ${numPositive} positive examples and ` +
      `${numNegative} negative examples.`);
  return tf.tensor2d(ys, [ys.length, 1], 'float32');
}

async function maybeDownload(sourceURL, destPath) {
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(destPath) || fs.lstatSync(destPath).size === 0) {
      const localZipFile = fs.createWriteStream(destPath);
      console.log(`Downloading file from ${sourceURL} ...`);
      https.get(sourceURL, response => {
        response.pipe(localZipFile);
        localZipFile.on('finish', () => {
          localZipFile.close(() => resolve());
        });
        localZipFile.on('error', err => reject(err));
      });
    } else {
      return resolve();
    }
  });
}

async function maybeExtract(sourcePath, destDir) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destDir)) {
      return resolve();
    }
    console.log(`Extracting: ${sourcePath} --> ${destDir}`);
    extract(sourcePath, {dir: destDir}, err => {
      if (err == null) {
        return resolve();
      } else {
        return reject(err);
      }
    });
  });
}

const ZIP_SUFFIX = '.zip';

async function maybeDownloadAndExtract() {
  const zipDownloadDest = path.join(os.tmpdir(), path.basename(DATA_ZIP_URL));
  await maybeDownload(DATA_ZIP_URL, zipDownloadDest);

  const zipExtractDir =
      zipDownloadDest.slice(0, zipDownloadDest.length - ZIP_SUFFIX.length);
  await maybeExtract(zipDownloadDest, zipExtractDir);
  return zipExtractDir;
}

export async function loadData(numWords, len, multihot = false) {
  const dataDir = await maybeDownloadAndExtract();

  const trainFeaturePath = path.join(dataDir, 'imdb_train_data.bin');
  const xTrain = loadFeatures(trainFeaturePath, numWords, len, multihot);
  const testFeaturePath = path.join(dataDir, 'imdb_test_data.bin');
  const xTest = loadFeatures(testFeaturePath, numWords, len, multihot);
  const trainTargetsPath = path.join(dataDir, 'imdb_train_targets.bin');
  const yTrain = loadTargets(trainTargetsPath);
  const testTargetsPath = path.join(dataDir, 'imdb_test_targets.bin');
  const yTest = loadTargets(testTargetsPath);

  tf.util.assert(
      xTrain.shape[0] === yTrain.shape[0],
      `Mismatch in number of examples between xTrain and yTrain`);
  tf.util.assert(
      xTest.shape[0] === yTest.shape[0],
      `Mismatch in number of examples between xTest and yTest`);
  return {xTrain, yTrain, xTest, yTest};
}

export async function loadMetadataTemplate() {
  const baseName = path.basename(METADATA_TEMPLATE_URL);
  const zipDownloadDest = path.join(os.tmpdir(), baseName);
  await maybeDownload(METADATA_TEMPLATE_URL, zipDownloadDest);

  const zipExtractDir =
      zipDownloadDest.slice(0, zipDownloadDest.length - ZIP_SUFFIX.length);
  await maybeExtract(zipDownloadDest, zipExtractDir);

  return JSON.parse(fs.readFileSync(
      path.join(zipExtractDir,
                baseName.slice(0, baseName.length - ZIP_SUFFIX.length))));
}
