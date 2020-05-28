set -e

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage:"
  echo "  build-imdb-demo.sh <MODEL_TYPE>"
  echo
  echo "MODEL_TYPE options: lstm | cnn"
  exit 1
fi
MODEL_TYPE=$1
shift
echo "Using model type: ${MODEL_TYPE}"

TRAIN_EPOCHS=5
while true; do
  if [[ "$1" == "--epochs" ]]; then
    TRAIN_EPOCHS=$2
    shift 2
  elif [[ -z "$1" ]]; then
    break
  else
    echo "ERROR: Unrecognized argument: $1"
    exit 1
  fi
done

RESOURCES_ROOT="${DEMO_DIR}/dist/resources"
rm -rf "${RESOURCES_ROOT}"
mkdir -p "${RESOURCES_ROOT}"

python "${DEMO_DIR}/python/imdb.py" \
    "${MODEL_TYPE}" \
    --epochs "${TRAIN_EPOCHS}" \
    --artifacts_dir "${RESOURCES_ROOT}"

cd ${DEMO_DIR}
yarn
yarn build

echo
echo "-----------------------------------------------------------"
echo "Resources written to ${RESOURCES_ROOT}."
echo "You can now run the demo with 'yarn watch'."
echo "-----------------------------------------------------------"
echo
