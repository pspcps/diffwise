# Setup, Installation, and Deployment Guide: PSDevTool

This guide provides instructions for installing, configuring, running, testing, building, and deploying PSDevTool.

---

## 1. Prerequisites

Before running PSDevTool, ensure your development environment satisfies:
- **Node.js**: `v20.x` or higher (tested on Node 20, 22 LTS).
- **Package Manager**: `npm` (v10+), `pnpm` (v9+), or `yarn` (v1.22+).
- **Modern Web Browser**: Chrome 110+, Edge 110+, Firefox 110+, or Safari 16+.

---

## 2. Local Installation & Development

### Step 1: Clone the Repository
```bash
git clone https://github.com/pspcps/diffwise.git psdevtool
cd psdevtool
```

### Step 2: Install Dependencies
```bash
npm install
```
*Note: This installs React 19, Monaco Editor, Tailwind CSS, Mermaid, pdf-lib, and developer dependencies.*

### Step 3: Launch Local Development Server
```bash
npm run dev
```
- By default, Vite starts the dev server at: `http://localhost:3000/`
- Bound to host `0.0.0.0` to permit testing across local network devices and mobile phones.

---

## 3. Build & Quality Verification

### Run Type Checking & Production Build
```bash
npm run build
```
Execution pipeline:
1. `tsc -b`: Runs the TypeScript project compiler in strict mode (`verbatimModuleSyntax`, zero unused variables).
2. `vite build`: Bundles the application with Rollup, compiles Tailwind CSS, generates chunked assets, and outputs the production artifacts to the `/dist` directory.

### Preview Production Build Locally
```bash
npm run preview
```
Serves the generated `/dist` directory locally on port 4173 to test production behavior and asset loading.

### Run Code Linting
```bash
npm run lint
```
Executes ESLint flat configuration across all `.ts`, `.tsx`, and `.js` files using `@eslint/js` and `typescript-eslint`.

---

## 4. Production Deployment Architectures

Because PSDevTool is a 100% client-side Single Page Application with hash routing (`#/diff-checker`), it requires **zero backend server runtime** and can be deployed to any static host or container.

### Option A: Static Hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages)
1. Point your platform to the Git repository.
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Deploy. Hash-based routing ensures all deep links (`https://psdevtool.online/#/har`, `https://psdevtool.online/#/portfolio`) load immediately without requiring server rewrite configuration.

### Option B: Docker Containerization (Nginx Alpine)
For enterprise on-premises or containerized environments (Kubernetes, AWS ECS, GCP Cloud Run):

Create a `Dockerfile`:
```dockerfile
# Stage 1: Build production assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression for high-performance asset delivery
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache immutable static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

Build and run:
```bash
docker build -t psdevtool:latest .
docker run -d -p 8080:80 psdevtool:latest
```

---

## 5. Troubleshooting & FAQ

### Issue: Monaco Editor Worker MIME Type Errors
- **Symptom**: Console warning `Could not create web worker(s)`.
- **Solution**: PSDevTool uses `@monaco-editor/react` which loads verified worker shims from jsDelivr CDN (`https://cdn.jsdelivr.net/npm/monaco-editor@...`). Ensure your network firewall does not block jsDelivr CDN scripts.

### Issue: Port 3000 Already in Use
- **Symptom**: Error `Port 3000 is in use`.
- **Solution**: Run Vite with a custom port: `npx vite --port 3001` or terminate the conflicting process with `kill -9 $(lsof -t -i:3000)`.

### Issue: Dev Server Flash or Pop-Up on Load
- **Symptom**: Visible text pop-up before React loads.
- **Solution**: Verified resolved in latest release: `#root` utilizes a dark `#11111b` styled placeholder and SEO content is isolated in `<noscript>` and screen-reader accessible DOM containers (`clip: rect(0,0,0,0)`).
