import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = "/usr/src/app/dist/frontend";
const port = Number.parseInt(process.env.PORT ?? "5174", 10);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

const resolvePath = async (url) => {
  const pathname = new URL(url ?? "/", "http://localhost").pathname;
  const normalizedPath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(root, normalizedPath === "/" ? "index.html" : normalizedPath);

  try {
    const fileStat = await stat(filePath);
    return fileStat.isFile() ? filePath : join(root, "index.html");
  } catch {
    return join(root, "index.html");
  }
};

createServer(async (request, response) => {
  const filePath = await resolvePath(request.url);
  response.writeHead(200, {
    "Content-Type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port);
