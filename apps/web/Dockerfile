# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* tsconfig.base.json ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src

# Copy web package
COPY apps/web/package.json apps/web/
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/postcss.config.js apps/web/
COPY apps/web/tailwind.config.js apps/web/
COPY apps/web/index.html apps/web/

# Install dependencies (workspace-aware)
RUN npm ci --ignore-scripts

# Copy web source
COPY apps/web/src apps/web/src

# Build shared first, then web
RUN npm run build -w packages/shared
RUN npm run build -w apps/web

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
