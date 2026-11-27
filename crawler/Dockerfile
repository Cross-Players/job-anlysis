# Crawler chạy thẳng file .ts bằng Node 24 (type stripping), không cần bước build.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production NODE_OPTIONS=--disable-warning=ExperimentalWarning
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src
USER node
CMD ["node", "src/run.ts"]
