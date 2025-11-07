# Usar la imagen oficial de nginx
FROM nginx:alpine

# Copiar los archivos estáticos al directorio de nginx
COPY . /usr/share/nginx/html

# Copiar configuración personalizada de nginx (opcional, para SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

