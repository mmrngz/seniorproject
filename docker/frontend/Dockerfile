FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

# CORS ve API proxy için nginx yapılandırması
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=0 /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 