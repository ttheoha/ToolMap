const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const sslDir = path.join(__dirname, "ssl");
const keyPath = path.join(sslDir, "key.pem");
const certPath = path.join(sslDir, "cert.pem");

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error("SSL certificates not found in ./ssl/");
  process.exit(1);
}

const sslOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// Start the Next.js standalone server on port 3000
process.env.PORT = "3000";
process.env.HOSTNAME = "0.0.0.0";
require("./server.standalone.js");

// HTTPS reverse proxy on port 443 -> localhost:3000
setTimeout(() => {
  const proxy = https.createServer(sslOptions, (clientReq, clientRes) => {
    const options = {
      hostname: "127.0.0.1",
      port: 3000,
      path: clientReq.url,
      method: clientReq.method,
      headers: clientReq.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on("error", (err) => {
      clientRes.writeHead(502);
      clientRes.end("Bad Gateway");
    });

    clientReq.pipe(proxyReq, { end: true });
  });

  proxy.listen(443, "0.0.0.0", () => {
    console.log("HTTPS proxy running on https://0.0.0.0:443");
  });
}, 2000);
