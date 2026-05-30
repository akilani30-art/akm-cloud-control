# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port (Railway will set PORT env var)
EXPOSE 7345

# Start the server
CMD ["node", "server.js"]
