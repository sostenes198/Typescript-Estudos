#!/bin/bash

unset NETWORK_NAME
unset CONTAINER_MONGO_NAME
unset CONTAINER_EXPRESS_MONGO_NAME

NETWORK_NAME='Integration-Test-CleanArchitecture-Modular-Express'
CONTAINER_MONGO_NAME="mongo"
CONTAINER_EXPRESS_MONGO_NAME="mongo-express"

docker container stop $CONTAINER_MONGO_NAME
docker container stop $CONTAINER_EXPRESS_MONGO_NAME

docker container rm $CONTAINER_MONGO_NAME
docker container rm $CONTAINER_EXPRESS_MONGO_NAME

docker network rm $NETWORK_NAME

docker volume prune -f