import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`SEIKA backend ouvindo na porta ${env.PORT}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
