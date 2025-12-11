FROM node:25-alpine3.22 AS build

WORKDIR /

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:25-alpine3.22 AS runtime

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /dist ./dist

CMD ["node", "dist/server.js"]
