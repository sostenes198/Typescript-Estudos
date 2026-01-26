import {
  GenericContainer,
  Network,
  StartedNetwork,
  StartedTestContainer,
} from 'testcontainers';

let _network: StartedNetwork;
let _containerValKey: StartedTestContainer;
let _containerGui: StartedTestContainer;

const _createNetwork = async () => {
  return new Network().start();
};

const _createContainerValKey = async (): Promise<StartedTestContainer> => {
  return new GenericContainer('valkey/valkey:latest')
    .withNetwork(_network)
    .withNetworkAliases('valkey')
    .withExposedPorts({ container: 6379, host: 6379 })
    .start();
};

const _createGuiContainer = async (): Promise<StartedTestContainer> => {
  return new GenericContainer('rediscommander/redis-commander:latest')
    .withNetwork(_network)
    .withEnvironment({
      // Conecta o Commander ao container do Valkey usando o alias na rede
      REDIS_HOSTS: 'valkey:valkey:6379',
    })
    .withExposedPorts({ container: 8081, host: 8081 })
    .start();
};

const createInfrastructure = async (): Promise<void> => {
  _network = await _createNetwork();

  _containerValKey = await _createContainerValKey();
  _containerGui = await _createGuiContainer();

  return;
};

const disposeInfrastructure = async (): Promise<void> => {
  if (_containerGui) await _containerGui.stop();
  if (_containerValKey) await _containerValKey.stop();
  if (_network) await _network.stop();
};

export { createInfrastructure, disposeInfrastructure };
