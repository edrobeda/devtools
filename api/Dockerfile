FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV DATA_DIR=/app/data
EXPOSE 3001

CMD ["node", "src/server.js"]
