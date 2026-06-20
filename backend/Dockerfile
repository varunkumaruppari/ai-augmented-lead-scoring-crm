FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY src/ ./src/

# Expose port and configure environment
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
