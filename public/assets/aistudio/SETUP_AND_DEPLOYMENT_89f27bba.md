# Setup, Configuration & Production Deployment Guide

This guide details the complete procedure for installing, configuring, running, and deploying Kafbat UI across both local development environments and production-grade Kubernetes infrastructure.

---

## 1. Prerequisites & System Requirements

Before beginning installation, verify that your host system satisfies the following software dependencies:

| Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Docker & Compose** | `24.0.0` | `26.0+` with Compose v2 | `docker compose version` |
| **Kubernetes (Local)**| `v1.28.0` | Docker Desktop / Minikube / k3d | `kubectl version --client` |
| **Go Compiler** | `1.21.0` | `1.21.6+` | `go version` |
| **Node.js & npm** | Node `18.17+` | Node `20 LTS` | `node -v && npm -v` |
| **Python** | `3.10.0` | `3.11.8` | `python3 --version` |
| **PostgreSQL CLI** | `14.0` | `16.0+` | `psql --version` |

---

## 2. One-Touch Quickstart (Docker Compose)

The easiest method to launch the entire multi-tier stack locally is via Docker Compose:

```bash
# 1. Clone the repository and navigate to root
cd kafkaUI-main

# 2. Execute automated setup script (grants execution permissions and checks dependencies)
chmod +x setup.sh scripts/*.sh
./setup.sh

# 3. Alternatively, launch the stack directly via Docker Compose
docker compose up -d --build
```

### Stack Services Breakdown

```
CONTAINER ID   IMAGE                   PORTS                                         STATUS
c891e4f2a1b0   confluentinc/cp-kafka   0.0.0.0:9092->9092/tcp, 9093/tcp              Up (healthy)
e9821d3f44c1   postgres:16-alpine      0.0.0.0:5432->5432/tcp                        Up (healthy)
a384110bc892   kafbat-backend:latest   0.0.0.0:8080->8080/tcp                        Up
b1092efc7128   kafbat-frontend:latest  0.0.0.0:3000->3000/tcp                        Up
```

- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:8080](http://localhost:8080)
- **PostgreSQL Management DB**: `localhost:5432` (`user: postgres`, `password: postgres`, `db: kafbat_mgmt`)
- **Kafka Broker**: `localhost:9092` (external listeners) / `kafka:9093` (internal docker network)

---

## 3. Database Initialization & Migration Execution

The backend requires the PostgreSQL schema migrations to be applied sequentially:

```bash
# Set database connection string
export MGMT_DB_DSN="postgres://postgres:postgres@localhost:5432/kafbat_mgmt?sslmode=disable"

# Execute all migrations using the provided script
./scripts/run_migrations.sh
```

Or run each migration manually using `psql`:

```bash
psql "$MGMT_DB_DSN" -f db/migrations/001_init.sql
psql "$MGMT_DB_DSN" -f db/migrations/002_field_source.sql
psql "$MGMT_DB_DSN" -f db/migrations/003_last_error.sql
psql "$MGMT_DB_DSN" -f db/migrations/004_job_errors.sql
psql "$MGMT_DB_DSN" -f db/migrations/005_team_alert.sql
psql "$MGMT_DB_DSN" -f db/migrations/006_users.sql
psql "$MGMT_DB_DSN" -f db/migrations/007_schema_validation.sql
```

### Seeding Initial Administrator Account
Insert the initial admin credentials (`admin` / `admin123`):

```sql
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2a$12$e8w.K2hR1cM9F2o7uXjWbe.y2wEa/iW2r9j3Fz2V3/3zR9yQ8j9W2', 'admin')
ON CONFLICT (username) DO NOTHING;
```

---

## 4. Kafka Topic Creation & Test Data Generation

To verify real-time streaming, execute the helper scripts to provision demo topics and stream sample JSON/Avro records:

```bash
# 1. Create standard demo topics (orders.v1, payments.v1, telemetry.v1)
./scripts/01_create_topics.sh

# 2. Stream seed records to verify consumer pipelines
./scripts/02_seed_data.sh
```

---

## 5. Local Native Development Workflow

For developers actively modifying code, run each subsystem natively:

### 5.1 Running the Go Backend
```bash
cd backend

# Install Go dependencies
go mod download

# Set development environment variables
export PORT="8080"
export CLUSTERS_CONFIG="../clusters.json"
export MGMT_DB_DSN="postgres://postgres:postgres@localhost:5432/kafbat_mgmt?sslmode=disable"
export JWT_SECRET="dev-jwt-secret-do-not-use-in-prod"
export K8S_NAMESPACE="kafbat"
export WORKER_IMAGE="kafbat-worker:latest"
export KUBECONFIG="$HOME/.kube/config"

# Start the Gin server
go run cmd/server/main.go
```

### 5.2 Building the Worker Image Locally
Kubernetes worker deployments require the worker image to exist locally in your Docker daemon:

```bash
cd worker
docker build -t kafbat-worker:latest .
```

### 5.3 Running the Next.js Frontend
```bash
cd frontend

# Install Node dependencies
npm install

# Configure API base URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Start Next.js development server
npm run dev
```

---

## 6. Production Kubernetes Deployment

In a production Kubernetes cluster, deploy the components using the following declarative steps:

### 6.1 Create Kubernetes Namespace & RBAC ServiceAccount

```yaml
# kafbat-rbac.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kafbat
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kafbat-backend-sa
  namespace: kafbat
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: kafbat-worker-manager
  namespace: kafbat
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: kafbat-worker-manager-binding
  namespace: kafbat
subjects:
  - kind: ServiceAccount
    name: kafbat-backend-sa
    namespace: kafbat
roleRef:
  kind: Role
  name: kafbat-worker-manager
  apiGroup: rbac.authorization.k8s.io
```

Apply the RBAC configuration:
```bash
kubectl apply -f kafbat-rbac.yaml
```

### 6.2 Deploy the Backend Control Plane

```yaml
# kafbat-backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafbat-backend
  namespace: kafbat
spec:
  replicas: 2
  selector:
    matchLabels:
      app: kafbat-backend
  template:
    metadata:
      labels:
        app: kafbat-backend
    spec:
      serviceAccountName: kafbat-backend-sa
      containers:
        - name: backend
          image: ghcr.io/your-org/kafbat-backend:v1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: PORT
              value: "8080"
            - name: CLUSTERS_CONFIG
              value: "/etc/kafbat/clusters.json"
            - name: MGMT_DB_DSN
              valueFrom:
                secretKeyRef:
                  name: kafbat-secrets
                  key: mgmt-db-dsn
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: kafbat-secrets
                  key: jwt-secret
            - name: K8S_NAMESPACE
              value: "kafbat"
            - name: WORKER_IMAGE
              value: "ghcr.io/your-org/kafbat-worker:v1.0.0"
          volumeMounts:
            - name: cluster-config
              mountPath: /etc/kafbat
      volumes:
        - name: cluster-config
          configMap:
            name: kafbat-clusters-config
```

---

## 7. Troubleshooting Guide & Common Failure Modes

### 7.1 "k8s deployment not found" or "connection refused to 127.0.0.1:6443"
- **Cause**: When running the backend inside a Docker container, `127.0.0.1` refers to the container itself rather than the host machine's Docker Desktop Kubernetes API.
- **Solution**: Set the `K8S_SERVER_URL` environment variable to `https://host.docker.internal:6443` or `https://kubernetes.default.svc`.

### 7.2 Worker Pod stuck in `ErrImageNeverPull` or `ImagePullBackOff`
- **Cause**: Kubernetes worker manifests use `ImagePullPolicy: PullNever` for local development. If the `kafbat-worker:latest` image has not been built in the local Docker daemon, Kubernetes cannot find it.
- **Solution**: Run `cd worker && docker build -t kafbat-worker:latest .` directly on the Docker daemon hosting your Kubernetes runtime.

### 7.3 Kafka Connection Timeout (`dial tcp: i/o timeout`)
- **Cause**: In Docker Compose, Kafka listeners must distinguish between internal container traffic (`kafka:9093`) and host machine traffic (`localhost:9092`).
- **Solution**: Check `clusters.json`. For backend running inside Docker, use `kafka:9093`. For backend running on host terminal, use `localhost:9092`.

### 7.4 Target Database Connection Failure in Worker
- **Cause**: If replicating to a local database outside Docker, worker pods running in Kubernetes cannot reach `localhost`.
- **Solution**: Use `host.docker.internal` as the target database hostname in your replication job destination configuration.
