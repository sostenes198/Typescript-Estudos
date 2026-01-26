/* eslint-disable @typescript-eslint/no-explicit-any */
import { disposeInfrastructure } from './setup.local.infrastructure';

export default async function (_: any, __: any) {
  await disposeInfrastructure();
}
