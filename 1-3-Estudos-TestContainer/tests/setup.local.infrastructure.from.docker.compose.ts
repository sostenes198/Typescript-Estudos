/* eslint-disable */
import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from "testcontainers";

const _currentPath = __dirname;

let _compose: StartedDockerComposeEnvironment;

const createDockerCompose = async (): Promise<StartedDockerComposeEnvironment> => {
  return new DockerComposeEnvironment(_currentPath, 'docker-compose.yaml')
    .withBuild()
    .up()
};

const createInfrastructure = async (): Promise<void> => {
  try {
    _compose = await createDockerCompose();
  } catch (error) {
    await disposeInfrastructure();
    throw error;
  }
};

const disposeInfrastructure = async (): Promise<void> => {
  await _compose?.down()
  await _compose?.stop()
};

export { createInfrastructure, disposeInfrastructure };
