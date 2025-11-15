# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Set memory limits and use swap
ENV NODE_OPTIONS="--max-old-space-size=512"

COPY package*.json ./
# Use npm install instead of npm ci for better memory efficiency
RUN npm install --no-optional --prefer-offline --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:1.25-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
