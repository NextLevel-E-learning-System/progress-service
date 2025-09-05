import { config } from 'dotenv';
config();
import { createServer } from './server.js';
import { initEventBus } from './events/publisher.js';
const port = Number(process.env.PORT || 3333);
createServer().listen(port, async () => {
  await initEventBus();
  // eslint-disable-next-line no-console
  console.log(`[progress-service] listening on ${port}`);
});