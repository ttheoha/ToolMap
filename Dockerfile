FROM node:20-alpine AS base

# Install openssl for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy schema first for prisma generate in postinstall
COPY package.json ./
COPY prisma ./prisma

# Install dependencies (postinstall runs prisma generate)
RUN npm install

# Copy rest of source
COPY . .

# Build Next.js
RUN npm run build

# Production
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY --from=base /app/.next/standalone ./
# Rename Next.js standalone server so our wrapper can require it
RUN mv server.js server.standalone.js
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/ssl ./ssl
# Copy our HTTPS wrapper
COPY --from=base /app/server.js ./server.js

EXPOSE 443

RUN mkdir -p /app/public/uploads

CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
