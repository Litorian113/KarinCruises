FROM node:22.9-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 4173
RUN node -v && npm -v
CMD ["npm", "run", "preview", "--", "--host"]