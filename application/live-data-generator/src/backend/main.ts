import { BackendEventPublisher } from "./event-publisher.js";
import { GeneratorHttpServer } from "./http-server.js";
import { GeneratorObservability } from "./observability.js";
import { PlaybackService } from "./playback-service.js";

const backendBaseUrl = process.env.CICADA_BACKEND_URL ?? "http://backend:3000";
const observability = new GeneratorObservability();
const port = Number.parseInt(process.env.PORT ?? "3100", 10);
const server = new GeneratorHttpServer(
  new PlaybackService(new BackendEventPublisher(backendBaseUrl, observability)),
  observability,
);
await server.listen(port);
