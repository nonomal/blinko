FROM node:18-alpine AS builder

WORKDIR /app

ENV NEXT_PRIVATE_STANDALONE true

COPY package.json pnpm-lock.yaml ./
COPY prisma ./

RUN npm install -g pnpm && \
    if [ "$USE_MIRROR" = "true" ]; then \
        echo "Using mirror registry..." && \
        npm install -g nrm && \
        nrm use taobao; \
    fi && \
    pnpm install

COPY . .
RUN pnpm build
RUN pnpm build-seed



FROM node:18-alpine AS runner

# RUN apk add --no-cache postgresql14-client
RUN npm install -g prisma
RUN apk add --no-cache curl tzdata
WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/seed.js ./seed.js

ENV NODE_ENV=production
ENV PORT=1111

EXPOSE 1111

CMD ["sh", "-c", "prisma migrate deploy && node seed.js && node server.js"]
