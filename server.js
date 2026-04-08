const https = require("https");
const fs = require("fs");
const path = require("path");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: "0.0.0.0", port: 443 });
const handle = app.getRequestHandler();

const sslDir = path.join(__dirname, "ssl");

// Generate self-signed cert if not present
function ensureSSL() {
  const keyPath = path.join(sslDir, "key.pem");
  const certPath = path.join(sslDir, "cert.pem");

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  }

  // Fallback: try to use existing certs or error out
  console.error("SSL certificates not found in /app/ssl/");
  console.error("Please generate them with: npm run ssl:generate");
  process.exit(1);
}

app.prepare().then(() => {
  const sslOptions = ensureSSL();

  https
    .createServer(sslOptions, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    .listen(443, "0.0.0.0", () => {
      console.log("✅ ToolMap HTTPS server running on https://0.0.0.0:443");
    });
});
