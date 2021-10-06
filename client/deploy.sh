#!/bin/bash

echo Enter image version:
read VERSION

docker build -t chorton2227/herdit:$VERSION .
docker push chorton2227/herdit:$VERSION
ssh root@chorton.dev "docker pull chorton2227/herdit:$VERSION && docker tag chorton2227/herdit:$VERSION dokku/herdit:$VERSION && dokku deploy herdit $VERSION"
