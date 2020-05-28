#!/usr/bin/env bash

NODE_ENV=development
RESOURCE_PORT=1235

# Ensure that http-server is available
yarn

echo Starting the pretrained model server...
node_modules/http-server/bin/http-server dist --cors -p "${RESOURCE_PORT}" > /dev/null & HTTP_SERVER_PID=$!

echo Starting the example html/js server...
# This uses port 1234 by default.
node_modules/parcel-bundler/bin/cli.js serve index.html -d dist --open --no-hmr --public-url /

# When the Parcel server exits, kill the http-server too.
kill $HTTP_SERVER_PID
