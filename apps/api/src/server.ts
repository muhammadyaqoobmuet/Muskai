import 'dotenv/config';
import { createApp } from './app';
import { config } from './config';
import { ensureStorageDir } from './db/client';
import { ensureUsageRows } from './services/model-router';
import { startWorker } from './services/worker';

async function main(): Promise<void> {
  ensureStorageDir();
  await ensureUsageRows();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[api] Muskai API listening on http://localhost:${config.port}`);
    console.log(
      `[api] DashScope key: ${config.hasDashscopeKey ? 'configured' : 'NOT configured (generations will fail gracefully)'}`,
    );
  });
  startWorker();
}

main().catch((err: unknown) => {
  console.error('[api] failed to start:', err);
  process.exit(1);
});
