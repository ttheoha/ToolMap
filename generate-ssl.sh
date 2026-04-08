#!/bin/bash
# Generate self-signed SSL certificates for ToolMap
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
  -subj "/C=FR/ST=France/L=Paris/O=ToolMap/CN=localhost"
echo "✅ SSL certificates generated in ./ssl/"
