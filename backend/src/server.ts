import { createApp } from './app';
import { connectToDatabase, disconnectFromDatabase } from './config/db';
import { env } from './config/env';
import { ensureIndexes } from './config/indexes';

async function main(): Promise<void> {
  const db = await connectToDatabase();
  await ensureIndexes(db);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(
      `AI Ride Matcher API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`,
    );
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    console.log(`Received ${signal}, shutting down`);

    server.close(() => {
      disconnectFromDatabase()
        .catch((error: unknown) => {
          console.error('Error while closing the database connection:', error);
        })
        .finally(() => {
          process.exit(0);
        });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});