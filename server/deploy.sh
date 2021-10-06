#!/bin/bash

echo Enter image version:
read VERSION

docker build -t chorton2227/api.herdit:$VERSION .
docker push chorton2227/api.herdit:$VERSION
ssh root@chorton.dev "docker pull chorton2227/api.herdit:$VERSION && docker tag chorton2227/api.herdit:$VERSION dokku/api.herdit:$VERSION && dokku deploy api.herdit $VERSION"
