FROM node:20-alpine

WORKDIR /app

# Instala dependências
# --legacy-peer-deps: o projeto usa eslint@9 mas eslint-config-next@14 pede eslint@8
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Código da aplicação
COPY . .

EXPOSE 3000

# Modo dev: compila on-the-fly e baixa a fonte (Sora) na primeira execução.
# -H 0.0.0.0 para ser acessível fora do container.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
