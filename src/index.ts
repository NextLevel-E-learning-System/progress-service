import { config } from 'dotenv';
config();
import { createServer } from './server';
const port = Number(process.env.PORT || 3333);
createServer().listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[progress-service] listening on ${port}`);
});