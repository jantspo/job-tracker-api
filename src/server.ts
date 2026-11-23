import { createApp } from "./app.js";
import { sequelize } from "./db/sequelize.js";
import { env } from "./env.js";

const PORT = env.PORT;

async function main() {
  await sequelize.authenticate();
  console.log("Database connection OK");

  const server = createApp().listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => void sequelize.close());
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
