FROM node:21-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3010
CMD ["sh", "-c", "npx prisma db push && node prisma/seed && node src/lib/addAllUsersToElasticSearch && npm run start:prod"]