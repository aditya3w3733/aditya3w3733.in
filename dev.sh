#!/bin/bash

# Clean existing build
rm -rf public/

# Start Hugo development server with more verbose output
hugo server \
  --bind=0.0.0.0 \
  --baseURL=http://localhost:1313 \
  --port=1313 \
  --appendPort=true \
  --verbose \
  --debug \
  --disableFastRender
