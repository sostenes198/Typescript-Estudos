/* eslint-disable */
// import { createInfrastructure } from './setup.local.infrastructure.from.container.as.code';
import { createInfrastructure } from "./setup.local.infrastructure.from.docker.compose";

export default async function(_: any, __: any) {
  await createInfrastructure();
}
