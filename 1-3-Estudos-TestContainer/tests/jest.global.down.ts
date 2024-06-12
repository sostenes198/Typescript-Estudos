/* eslint-disable */
// import { disposeInfrastructure } from './setup.local.infrastructure.from.container.as.code';
import { disposeInfrastructure } from "./setup.local.infrastructure.from.docker.compose";

export default async function(_: any, __: any) {
  await disposeInfrastructure();
}
