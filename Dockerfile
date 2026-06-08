FROM node:20-alpine

# Install Python and pip-audit for vulnerability scanning
RUN apk add --no-cache python3 py3-pip git && \
    pip3 install pip-audit --break-system-packages

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application
COPY . .

# Create output directory
RUN mkdir -p output data

EXPOSE 3000

CMD ["node", "src/index.js"]
