/* eslint-disable */
import { GenericContainer, Network, StartedNetwork, StartedTestContainer } from "testcontainers";

// const _currentPath = __dirname;

let _network: StartedNetwork;
let _containerMongo: StartedTestContainer;

const _createNetwork = async () => {
  return new Network().start();
};

const createMongoContainer = async (): Promise<StartedTestContainer> => {
  return new GenericContainer("mongo")
    .withName("mongo")
    .withNetwork(_network)
    .withNetworkAliases("mongo")
    .withExposedPorts({ container: 27017, host: 27017 })
    .withCommand(["--replSet", "rs0", "--bind_ip_all", "--port", "27017"])
    .withHealthCheck({
      retries: 3,
      interval: 5,
      timeout: 60,
      startPeriod: 10,
      test: [
        "CMD-SHELL",
        `echo "try { rs.status() } catch (err) { rs.initiate({_id:'rs0',members:[{_id:0,host:'host.docker.internal:27017'}]}) }" | mongosh --port 27017 --quiet`
      ]
    })
    .start();
};

const createInfrastructure = async (): Promise<void> => {
  try {
    _network = await _createNetwork();
    _containerMongo = await createMongoContainer();
  } catch (error) {
    await disposeInfrastructure();
    throw error;
  }
};

const disposeInfrastructure = async (): Promise<void> => {
  await _containerMongo?.stop();
  await _network?.stop();
};

export { createInfrastructure, disposeInfrastructure };
