FROM node:16-alpine AS BUILD_IMAGE

RUN apk update && apk add curl bash && rm -rf /var/cache/apk/* && apk add wget gcc-8 unzip libssl1.0.0 software-properties-common && apk add ppa:ubuntu-toolchain-r/test && apk update && apk add --only-upgrade libstdc++6

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:16-alpine

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/www ./dist/www
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

EXPOSE 7657

CMD [ "node", "./dist/main.js" ]