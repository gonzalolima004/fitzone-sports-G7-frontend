# ==========================================
# Etapa 1: Builder (Compilación de la SPA)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias e instalación reproducible
COPY package*.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Argumentos de construcción (Build Args) para variables de Vite
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Asignación de variables de entorno para que Vite las incruste en build time
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Compilación de la aplicación para producción
RUN npm run build

# ==========================================
# Etapa 2: Production (Servidor Nginx)
# ==========================================
FROM nginx:alpine

# Copiar los artefactos estáticos generados por el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Reemplazar la configuración predeterminada de Nginx con el template para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto HTTP estándar
EXPOSE 80

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
