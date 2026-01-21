#!/bin/bash
set -eux
rm ~/.npmrc | true
curl -u "${ARTIFACTORY_READER_USER}:${ARTIFACTORY_READER_PASSWORD}" 'https://davicienda.jfrog.io/artifactory/api/npm/auth' >>~/.npmrc

npm install
