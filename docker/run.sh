#!/bin/bash

aws configure set default.region us-east-1
aws configure set default.output json

echo 'Listing working directories:'
ls -a
aws --version

echo 'Launching application:'
NODE_ENV=production npm run start
