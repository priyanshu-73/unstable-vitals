# Use Node.js 22 (latest stable alpine variant)
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (ignore postinstall/preinstall scripts)
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Run in development mode with hot reload
CMD ["npm", "run", "start:dev"]
