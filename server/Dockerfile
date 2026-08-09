FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/data
ENV PORT=3000
ENV DEV_MODE=false
EXPOSE 3000
CMD ["node", "server.js"]
