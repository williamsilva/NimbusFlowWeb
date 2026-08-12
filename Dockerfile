# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
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
