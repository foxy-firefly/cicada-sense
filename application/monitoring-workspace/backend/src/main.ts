import { BackendApplicationFactory } from "./app/create-backend-application.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const server = await BackendApplicationFactory.create();
await server.listen(port);
