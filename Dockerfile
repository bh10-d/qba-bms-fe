FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build (reads environment variables from machine / .env during build)
COPY . .
RUN npm run build

# Install lightweight static server
RUN npm install -g serve

EXPOSE 3000

# Serve compiled SPA dist folder on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
