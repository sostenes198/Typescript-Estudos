#!/bin/bash

unset CURRENT_PATH
unset NETWORK_NAME
unset CONTAINER_MONGO_NAME
unset CONTAINER_EXPRESS_MONGO_NAME
unset MONGO_USERNAME
unset MONGO_PASSWORD

CURRENT_PATH=$(dirname "$(readlink -f "$0")")
NETWORK_NAME="Integration-Test-CleanArchitecture-Modular-Express"
CONTAINER_MONGO_NAME="mongo"
CONTAINER_EXPRESS_MONGO_NAME="mongo-express"
MONGO_USERNAME="root"
MONGO_PASSWORD="Password"

echo $CURRENT_PATH

docker network create -d bridge $NETWORK_NAME


docker run -d --net "${NETWORK_NAME}" --name "${CONTAINER_MONGO_NAME}" --restart always -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME="${MONGO_USERNAME}" -e MONGO_INITDB_ROOT_PASSWORD="${MONGO_PASSWORD}" -v "${CURRENT_PATH}/scripts/CREATE_DATABASE_MONGO.js:/docker-entrypoint-initdb.d/mongo-init.js:ro" mongo
sleep 5
docker run -d --net "${NETWORK_NAME}" --name "${CONTAINER_EXPRESS_MONGO_NAME}" --restart always -p 8081:8081 -e ME_CONFIG_MONGODB_ADMINUSERNAME="${MONGO_USERNAME}" -e ME_CONFIG_MONGODB_ADMINPASSWORD="${MONGO_PASSWORD}" -e ME_CONFIG_MONGODB_URL="mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${CONTAINER_MONGO_NAME}:27017/" mongo-express
sleep 5