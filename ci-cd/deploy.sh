#!/bin/bash
tagRelease() {
  git push origin HEAD
  versionTag=v$(cat package.json | grep version | echo $(tr -dc '0-9.'))
  git tag $versionTag
  git push origin $versionTag
  echo "version $versionTag tagged successful"
  git tag -d $version
}

pushRelease() {
  npm version patch -m "master-release"
  tagRelease
}

pushRelease
