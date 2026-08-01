FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4173

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 4173

CMD ["npm", "start"]
