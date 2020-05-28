import argparse
import struct

from keras.datasets import imdb

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument('out_prefix', type=str, help='Output path prefix')
  args = parser.parse_args()

  print('Loading imdb data via keras...')
  (x_train, y_train), (x_test, y_test) = imdb.load_data()

  for split in ('train', 'test'):
    data_path = '%s_%s_data.bin' % (args.out_prefix, split)
    xs = x_train if split == 'train' else x_test
    print('Writing data to file: %s' % data_path)
    with open(data_path, 'wb') as f:
      for sentence in xs:
        f.write(struct.pack('%di' % len(sentence), *sentence))

    targets_path = '%s_%s_targets.bin' % (args.out_prefix, split)
    ys = y_train if split == 'train' else y_test
    print('Writing targets to file: %s' % targets_path)
    with open(targets_path, 'wb') as f:
      f.write(struct.pack('%db' % len(ys), *ys))
