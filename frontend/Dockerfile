# NGINX Runtime Environment
FROM nginx:alpine

# Copy the custom Nginx config inside the container configuration root
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Migrate pre-built static output directly to Nginx mount
COPY dist /usr/share/nginx/html

# Expose HTTP
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
