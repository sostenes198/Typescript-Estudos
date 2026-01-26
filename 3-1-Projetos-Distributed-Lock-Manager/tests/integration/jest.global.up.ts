/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInfrastructure } from './setup.local.infrastructure';
import { exec } from 'child_process';

export default async function (_: any, __: any) {
  try {
    exec('docker kill $(docker ps -q)');
  } catch (error) {
    // ignore
  }

  await createInfrastructure();
}
