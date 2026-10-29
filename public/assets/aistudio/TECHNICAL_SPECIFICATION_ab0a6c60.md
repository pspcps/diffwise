# Technical Specifications & System Catalog

This document establishes the comprehensive technical specification for Kafbat UI, covering the exact technology stack, protocol specifications, complete REST API definitions, relational database schemas, Kubernetes manifest specifications, and runtime configuration matrices.

---

## 1. Technology Stack & Component Version Matrix

| Tier | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Control Plane Core** | Go (`golang`) | `1.21` | High-throughput, low-latency concurrent control plane; compiled static binary with zero runtime garbage-collection pauses compared to JVM alternatives. |
| **HTTP Framework** | Gin Web Framework (`gin-gonic/gin`) | `v1.9.1` | Ultra-fast HTTP router with radix-tree route matching, lightweight middleware chains, and structured JSON parsing. |
| **Kafka Client (Go)** | Sarama (`IBM/sarama`) | `v1.42.1` | Pure-Go, low-overhead Apache Kafka library supporting SASL (SCRAM-SHA-256, SCRAM-SHA-512, GSSAPI), TLS v1.2/v1.3, and AWS IAM MSK auth without native C dependencies. |
| **Kubernetes Client** | client-go (`k8s.io/client-go`) | `v0.28.4` | Native Kubernetes client for dynamic reconciliation, pod log streaming, and deployment lifecycle orchestration. |
| **Schema Validation** | Hamba Avro (`hamba/avro/v2`) | `v2.21.1` | High-performance compiled Avro codec with schema fingerprinting and binary/JSON encoding validation. |
| **JSON Schema** | Santhosh Tekuri (`santhosh-tekuri/jsonschema/v5`) | `v5.3.1` | Complete Draft 2020-12 / Draft 7 compliant schema validation engine with pre-compilation cache. |
| **Database Driver** | lib/pq (`github.com/lib/pq`) | `v1.10.9` | Pure Go driver for PostgreSQL 16 connection pooling and transactional DDL execution. |
| **Worker Engine** | Python | `3.11` | Dynamic data transformation and multi-driver database connectivity engine. |
| **Kafka Driver (Worker)** | confluent-kafka-python | `v2.5.3` | High-performance C-wrapper around `librdkafka` providing sub-millisecond polling and direct consumer group rebalancing. |
| **Data Adapters** | psycopg2, pymysql, pyodbc, pymongo | `2.9.9`, `1.1.1`, `5.2.0`, `4.8.0` | Production drivers for PostgreSQL, MySQL, Microsoft SQL Server, and MongoDB. |
| **Frontend Framework** | Next.js (App Router) | `14.1.3` | Hybrid Server/Client React 18 architecture with automatic code splitting and server-side route handlers. |
| **State & Data Fetching** | TanStack React Query | `v5.28.0` | Cache-invalidating query orchestrator with background polling, exponential retry, and optimistic updates. |
| **UI Components** | Lucide React & Tailwind CSS | `v0.358.0`, `v3.3.0` | Responsive layout utilities and accessible SVG iconography. |
| **Management Database** | PostgreSQL | `16-alpine` | ACID-compliant relational metadata store utilizing generated columns and JSONB structures. |
| **Message Broker** | Apache Kafka (KRaft mode) | `3.8.0` | Distributed commit log running without Apache ZooKeeper using internal KRaft metadata quorum. |

---

## 2. Exhaustive REST API Specification

All protected endpoints enforce HTTP Header: `Authorization: Bearer <JWT_TOKEN>`.

### 2.1 Authentication & Self-Inspection Endpoints

#### `POST /api/v1/auth/login`
- **Access**: Public
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "username": "admin",
        "role": "admin"
      }
    }
    ```
  - `401 Unauthorized`: `{"error": "Invalid username or password"}`

#### `GET /api/v1/auth/me`
- **Access**: Authenticated (`admin` or `viewer`)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "username": "admin",
      "role": "admin"
    }
    ```

---

### 2.2 Cluster Administration Endpoints

#### `GET /api/v1/clusters`
- **Access**: Authenticated
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": "local-kafka",
        "name": "Local Development Cluster",
        "bootstrapServers": ["kafka:9093"],
        "status": "online",
        "brokerCount": 1,
        "topicCount": 14
      }
    ]
    ```

#### `GET /api/v1/clusters/:clusterId/cluster`
- **Access**: Authenticated
- **Parameters**: `clusterId` (path parameter, string)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "id": "local-kafka",
      "brokers": [
        {
          "id": 1,
          "host": "kafka",
          "port": 9093,
          "rack": null,
          "isController": true
        }
      ],
      "controllerId": 1,
      "kafkaVersion": "3.8.0",
      "underReplicatedPartitions": 0,
      "offlinePartitions": 0
    }
    ```

---

### 2.3 Topic Management Endpoints

#### `GET /api/v1/clusters/:clusterId/topics`
- **Access**: Authenticated
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "name": "orders.v1",
        "partitionCount": 6,
        "replicationFactor": 1,
        "inSyncReplicas": 6,
        "messageCountEstimate": 450210,
        "cleanupPolicy": "delete",
        "retentionMs": "604800000"
      }
    ]
    ```

#### `POST /api/v1/clusters/:clusterId/topics`
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "name": "payments.v1",
    "partitions": 3,
    "replicationFactor": 1,
    "configs": {
      "cleanup.policy": "delete",
      "retention.ms": "86400000"
    }
  }
  ```
- **Responses**:
  - `201 Created`: `{"message": "Topic created successfully", "name": "payments.v1"}`
  - `400 Bad Request`: `{"error": "Topic name violates Kafka naming constraints"}`
  - `409 Conflict`: `{"error": "Topic already exists"}`

#### `DELETE /api/v1/clusters/:clusterId/topics/:name`
- **Access**: Admin only
- **Responses**:
  - `200 OK`: `{"message": "Topic deleted successfully"}`

#### `GET /api/v1/clusters/:clusterId/topics/:name/messages`
- **Access**: Authenticated
- **Query Parameters**:
  - `partition`: Target partition integer (e.g. `0`, `1`)
  - `offset`: Starting offset integer (`0`, or `-1` for latest)
  - `limit`: Number of records to return (default: `50`, max: `500`)
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "partition": 0,
        "offset": 1042,
        "key": "order-99812",
        "value": "{\"orderId\":\"order-99812\",\"amount\":84.50,\"status\":\"CONFIRMED\"}",
        "timestamp": "2026-10-29T15:20:00Z",
        "headers": {
          "correlation-id": "corr-uuid-88912",
          "producer-version": "1.4.0"
        }
      }
    ]
    ```

#### `POST /api/v1/clusters/:clusterId/topics/:name/messages`
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "partition": 0,
    "key": "order-99813",
    "value": "{\"orderId\":\"order-99813\",\"amount\":120.00,\"status\":\"PENDING\"}",
    "headers": {
      "source": "web-checkout"
    }
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "partition": 0,
      "offset": 1043,
      "timestamp": "2026-10-29T15:20:05Z"
    }
    ```
  - `422 Unprocessable Entity`:
    ```json
    {
      "error": "Schema validation failed",
      "details": "Property 'amount' must be positive number. Missing required field 'orderId'."
    }
    ```

---

### 2.4 Schema Registry & Validation Endpoints

#### `GET /api/v1/clusters/:clusterId/topics/:name/schema`
- **Access**: Authenticated
- **Responses**:
  - `200 OK`:
    ```json
    {
      "id": "4b54e38e-0b1a-4712-8ea5-6ce2bfa81691",
      "clusterId": "local-kafka",
      "topicName": "orders.v1",
      "schemaFormat": "json_schema",
      "schemaVersion": 2,
      "schemaText": "{\"$schema\":\"https://json-schema.org/draft/2020-12/schema\",\"type\":\"object\",\"properties\":{\"orderId\":{\"type\":\"string\"},\"amount\":{\"type\":\"number\"}},\"required\":[\"orderId\",\"amount\"]}",
      "fields": [
        {"name": "orderId", "fieldType": "string", "isRequired": true, "isPrimaryKey": true},
        {"name": "amount", "fieldType": "double", "isRequired": true, "isPrimaryKey": false}
      ]
    }
    ```

#### `PUT /api/v1/clusters/:clusterId/topics/:name/schema`
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "schemaFormat": "json_schema",
    "schemaText": "{\"$schema\":\"https://json-schema.org/draft/2020-12/schema\",\"type\":\"object\"...}",
    "fields": [
      {
        "name": "orderId",
        "fieldType": "string",
        "isRequired": true,
        "isPrimaryKey": true,
        "position": 0
      }
    ]
  }
  ```
- **Responses**:
  - `200 OK`: `{"message": "Schema upserted successfully", "version": 3}`

#### `POST /api/v1/validate-schema`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "schemaFormat": "avro",
    "schemaText": "{\"type\":\"record\",\"name\":\"User\",\"fields\":[{\"name\":\"id\",\"type\":\"string\"}]}",
    "samplePayload": "{\"id\":\"usr_123\"}"
  }
  ```
- **Responses**:
  - `200 OK`: `{"valid": true}`
  - `400 Bad Request`: `{"valid": false, "error": "Schema syntax error at line 1"}`

---

### 2.5 Replication Jobs & K8s Lifecycle Endpoints

#### `GET /api/v1/jobs`
- **Access**: Authenticated
- **Responses**:
  - `200 OK`:
    ```json
    [
      {
        "id": "e4293fbf-93d3-4f93-b1d5-bc44a50d2bb2",
        "name": "Orders to Postgres Analytics",
        "clusterId": "local-kafka",
        "topicName": "orders.v1",
        "consumerGroup": "kafbat-orders-pg",
        "serviceName": "analytics-ingest",
        "destinationType": "postgresql",
        "status": "running",
        "replicas": 2,
        "totalLag": 0,
        "replicatedCount": 245000,
        "lastError": null
      }
    ]
    ```

#### `POST /api/v1/jobs`
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "name": "Orders to Mongo Lake",
    "clusterId": "local-kafka",
    "topicName": "orders.v1",
    "consumerGroup": "kafbat-orders-mongo",
    "serviceName": "mongo-sink",
    "destinationType": "mongodb",
    "destinationConfig": {
      "uri": "mongodb://mongo:27017",
      "database": "datalake",
      "collection": "raw_orders"
    },
    "startPosition": "latest",
    "consumerCount": 2
  }
  ```
- **Responses**:
  - `201 Created`: `{"id": "c88f28a7-68b2-4d2a-bc9e-0498b3c95e12", "status": "pending"}`

#### `PATCH /api/v1/jobs/:id` (Status Transition: pause / resume)
- **Access**: Admin only
- **Request Body**: `{"action": "pause"}` or `{"action": "resume"}`
- **Responses**:
  - `200 OK`: `{"status": "paused", "replicas": 0}`

#### `POST /api/v1/jobs/:id/reset-offset`
- **Access**: Admin only
- **Request Body**: `{"strategy": "earliest"}` | `{"strategy": "latest"}` | `{"offset": 10500}`
- **Responses**:
  - `200 OK`: `{"message": "Consumer group offset reset successfully"}`

#### `GET /api/v1/jobs/:id/logs`
- **Access**: Authenticated
- **Query Parameters**: `lines` (integer, e.g. `100`)
- **Responses**:
  - `200 OK`: `{"logs": "2026-10-29T15:20:00Z INFO worker Subscribed to topic orders.v1\n..."}`

---

### 2.6 Worker Telemetry Endpoints (Pod Callbacks)

#### `POST /api/v1/jobs/:id/metrics`
- **Access**: Internal Pods
- **Request Body**:
  ```json
  {
    "partitionId": 0,
    "currentOffset": 10500,
    "endOffset": 10500,
    "replicatedCount": 4200,
    "lastMessageAt": "2026-10-29T15:20:10Z"
  }
  ```
- **Responses**:
  - `204 No Content`

#### `POST /api/v1/jobs/:id/errors`
- **Access**: Internal Pods
- **Request Body**:
  ```json
  {
    "partitionId": 1,
    "offset": 9942,
    "errorMessage": "psycopg2.errors.NotNullViolation: null value in column 'customer_id' violates not-null constraint [key='order-881' value_keys=['orderId', 'amount']]"
  }
  ```
- **Responses**:
  - `204 No Content`

---

## 3. Relational Database Schema Specifications

The management database uses PostgreSQL 16 with the `pgcrypto` extension for client-agnostic UUIDv4 generation.

```
+---------------------------------------------------------------------------------------------------+
|                                      POSTGRESQL 16 SCHEMA DDL                                     |
+---------------------------------------------------------------------------------------------------+

[ topic_schemas ]
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
cluster_id      TEXT NOT NULL
topic_name      TEXT NOT NULL
schema_type     TEXT NOT NULL DEFAULT 'manual'
avro_raw        TEXT
schema_format   TEXT NOT NULL DEFAULT 'manual' ('manual' | 'none' | 'json_schema' | 'avro' | 'protobuf')
schema_text     TEXT
schema_version  INT NOT NULL DEFAULT 1
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE (cluster_id, topic_name)
      |
      | 1:N CASCADE
      v
[ schema_fields ]
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
schema_id       UUID NOT NULL REFERENCES topic_schemas(id) ON DELETE CASCADE
name            TEXT NOT NULL
field_type      TEXT NOT NULL ('string'|'int'|'long'|'float'|'double'|'boolean'|'timestamp'|'bytes'|'json')
is_required     BOOLEAN NOT NULL DEFAULT FALSE
is_primary_key  BOOLEAN NOT NULL DEFAULT FALSE
default_value   TEXT
description     TEXT
position        INT NOT NULL DEFAULT 0
field_source    TEXT DEFAULT 'payload' ('payload' | 'key' | 'header' | 'timestamp' | 'partition' | 'offset')
INDEX (schema_id)

[ replication_jobs ]
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
name                TEXT NOT NULL
cluster_id          TEXT NOT NULL
topic_name          TEXT NOT NULL
consumer_group      TEXT NOT NULL UNIQUE
service_name        TEXT NOT NULL
destination_type    TEXT NOT NULL ('postgresql' | 'mysql' | 'sqlserver' | 'mongodb')
destination_config  JSONB NOT NULL
start_position      TEXT NOT NULL DEFAULT 'latest' ('latest' | 'earliest')
include_historical  BOOLEAN NOT NULL DEFAULT FALSE
consumer_count_mode TEXT NOT NULL DEFAULT 'fixed' ('fixed' | 'per_partition' | 'custom')
consumer_count      INT NOT NULL DEFAULT 1
status              TEXT NOT NULL DEFAULT 'pending' ('pending' | 'running' | 'paused' | 'failed' | 'stopped')
k8s_deployment_name TEXT
k8s_namespace       TEXT NOT NULL DEFAULT 'kafbat'
last_error          TEXT
team_alert          TEXT
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
INDEX (cluster_id, topic_name)
INDEX (status)
      |
      +-------------------------------------------+
      | 1:N CASCADE                               | 1:N CASCADE
      v                                           v
[ consumer_metrics ]                        [ job_errors ]
id               UUID PRIMARY KEY           id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
job_id           UUID REFERENCES jobs(id)   job_id       UUID REFERENCES jobs(id) ON DELETE CASCADE
partition_id     INT NOT NULL               partition_id INTEGER NOT NULL
current_offset   BIGINT NOT NULL            "offset"     BIGINT NOT NULL
end_offset       BIGINT NOT NULL            error_msg    TEXT NOT NULL
lag              BIGINT GENERATED ALWAYS    occurred_at  TIMESTAMPTZ DEFAULT NOW()
                 AS (GREATEST(end_offset - current_offset, 0)) STORED
replicated_count BIGINT NOT NULL            INDEX (job_id, occurred_at DESC)
last_message_at  TIMESTAMPTZ
updated_at       TIMESTAMPTZ NOT NULL
UNIQUE (job_id, partition_id)
INDEX (job_id)

[ users ]
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
username      TEXT NOT NULL UNIQUE
password_hash TEXT NOT NULL
role          TEXT NOT NULL DEFAULT 'viewer' ('admin' | 'viewer')
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
INDEX (username)
```

---

## 4. Kubernetes Dynamic Deployment Specification

Every user-defined replication job generates a dedicated `apps/v1.Deployment` managed dynamically via Go `client-go`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafbat-worker-${JOB_NAME_SANITIZED}-${JOB_ID_SHORT}
  namespace: kafbat
  labels:
    app: kafbat-worker
    job-id: ${JOB_ID}
spec:
  replicas: ${CONSUMER_COUNT} # Scaled to 0 on pause, restored on resume
  selector:
    matchLabels:
      app: kafbat-worker
      job-id: ${JOB_ID}
  template:
    metadata:
      labels:
        app: kafbat-worker
        job-id: ${JOB_ID}
    spec:
      restartPolicy: Always
      containers:
        - name: worker
          image: ${WORKER_IMAGE} # default: kafbat-worker:latest
          imagePullPolicy: IfNotPresent # PullNever in local Docker Desktop
          env:
            - name: JOB_ID
              value: "${JOB_ID}"
            - name: MGMT_DB_DSN
              value: "${MGMT_DB_DSN_POD_REACHABLE}"
            - name: MGMT_API_URL
              value: "${MGMT_API_URL_POD_REACHABLE}"
            - name: KAFKA_BROKERS
              value: "${KAFKA_BROKERS}"
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 1000m
              memory: 512Mi
```

---

## 5. Environment Configuration Catalog

| Environment Variable | Component | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Backend | No | `8080` | Port for the Go HTTP REST control plane. |
| `CLUSTERS_CONFIG` | Backend | Yes | `/etc/kafbat/clusters.json` | Path to static Kafka cluster definitions with SASL/TLS credentials. |
| `MGMT_DB_DSN` | Backend | Yes | - | PostgreSQL connection string (`postgres://user:pass@host:5432/kafbat_mgmt?sslmode=disable`). |
| `JWT_SECRET` | Backend | Yes | `kafbat-secret-key-change-in-prod` | HMAC-SHA256 signing secret for authentication tokens. |
| `JWT_EXPIRY_HOURS`| Backend | No | `24` | Token lifetime before forced re-authentication. |
| `K8S_NAMESPACE` | Backend | No | `kafbat` | Target Kubernetes namespace where worker pods are spawned. |
| `WORKER_IMAGE` | Backend | No | `kafbat-worker:latest`| Container image tag pulled for replication worker deployments. |
| `K8S_SERVER_URL` | Backend | No | - | Override Kubernetes API server address (crucial for Docker Desktop bridge routing). |
| `KUBECONFIG` | Backend | No | `~/.kube/config` | Local Kubernetes config file path when running outside cluster. |
| `JOB_ID` | Worker | Yes | - | Injected UUID of the active replication job row. |
| `MGMT_API_URL` | Worker | Yes | `http://host.docker.internal:8080` | Control plane endpoint for metric and error reporting callbacks. |
| `KAFKA_BROKERS` | Worker | Yes | `kafka:9093` | Bootstrap broker string for confluent-kafka consumer initialization. |
| `NEXT_PUBLIC_API_URL` | Frontend | No | `http://localhost:8080` | Backend API base URL consumed by React Query and Axios clients. |
