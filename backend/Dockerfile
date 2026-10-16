FROM node:20-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:4000/api/health || exit 1
# db push creates the tables from schema.prisma on first start (use `prisma migrate deploy` once you commit migrations)
CMD ["sh", "-c", "npx prisma db push --skip-generate && ([ \"$SEED_ON_START\" = \"true\" ] && node prisma/seed.js || true) && node src/server.js"]
