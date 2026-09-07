# syntax=docker/dockerfile:1
# Nota (2026-09-07): achado real rodando docker compose build local depois da extração do
# @williamsilva/nimbus-web-commons - "npm error 401 Unauthorized ... authentication token not
# provided" no `npm ci`. O .npmrc do projeto (@williamsilva:registry=npm.pkg.github.com +
# _authToken=${NODE_AUTH_TOKEN}) precisa estar copiado ANTES do npm ci rodar, e NODE_AUTH_TOKEN
# precisa virar variável de ambiente de verdade (ARG sozinho não basta - não é lido por processos
# filhos, só pelas instruções do próprio Dockerfile) - mesmo achado/mesmo padrão ARG do backend
# (Gradle/Maven) pro GITHUB_ACTOR/GITHUB_TOKEN, ver Dockerfile do NimbusFlowServer/CardsyncServer.
FROM node:22-alpine AS build
WORKDIR /workspace
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# "development" (não o default "production" do angular.json) - esta imagem é usada pelo
# docker-compose LOCAL, que sobe o backend/db do NimbusFlow juntos; precisa do environment.ts
# (bffBaseUrl/apiBaseUrl = localhost:9092) em vez do environment.prod.ts (fileReplacement só
# existe na config "production"), senão a SPA fala com o backend de PRODUÇÃO e o CORS bloqueia
# a origem localhost:4201.
RUN npm run build -- --configuration development

FROM nginx:1.27-alpine
COPY --from=build /workspace/dist/nimbusflow/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
