FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY shared/package.json shared/package.json
RUN npm ci

FROM deps AS frontend-build
COPY shared ./shared
COPY frontend ./frontend
RUN npm run build -w frontend

FROM node:22-alpine
RUN apk add --no-cache libc6-compat postgresql-client
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY shared ./shared
COPY backend ./backend
COPY --from=deps /app/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate:prod -w backend && npm run start -w backend"]
