FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build && ls -la /app/dist  # Добавим проверку содержимого dist

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
RUN ls -la /app/dist  # Проверим что файлы скопировались
EXPOSE 3000
CMD ["node", "./dist/index.js"]