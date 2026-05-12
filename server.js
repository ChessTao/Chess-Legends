const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png"
};

function getHeaders(type, filePath) {
  const extension = path.extname(filePath);
  const isHtml = extension === ".html";

  return {
    "Content-Type": type,
    "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };
}

function send(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type });
  response.end(body);
}

http.createServer((request, response) => {
  let url;

  try {
    url = new URL(request.url, `http://${request.headers.host || host}`);
  } catch {
    send(response, 400, "Bad request");
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.resolve(root, `.${pathname}`);
  const relativePath = path.relative(root, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    send(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(response, 404, "Not found");
      return;
    }

    response.writeHead(200, getHeaders(types[path.extname(filePath)] || "application/octet-stream", filePath));
    response.end(content);
  });
}).listen(port, host, () => {
  console.log(`Chess Legends is running at http://${host}:${port}/`);
});
