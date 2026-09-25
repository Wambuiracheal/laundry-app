FROM node:20-alpine AS builder
WORKDIR /app

# python3/make/g++ compile bcrypt's native addon; openssl lets Prisma
# detect the right query engine target (must match the runner's openssl)
RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# openssl is required by the Prisma query engine on Alpine
RUN apk add --no-cache openssl

COPY --from=builder /app ./

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
