import { waitForStack } from './support/env';

async function globalSetup() {
  await waitForStack();
}

export default globalSetup;
