FROM node:20-alpine

# Prisma precisa de openssl no Alpine
RUN apk add --no-cache openssl bash

WORKDIR /app

# Instala dependências (postinstall roda `prisma generate`)
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

# Código da aplicação
COPY . .

# Entrypoint: espera o banco, aplica migrations, roda seed e sobe a API
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
