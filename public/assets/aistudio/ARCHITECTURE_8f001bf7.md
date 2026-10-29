# System Architecture: KafkaUI Control Plane & Execution Engine

## 1. Architectural Philosophy & Design Principles

KafkaUI is engineered around three foundational architectural principles:

1. **Decoupling of Control Plane and Data Plane**:
   - The **Control Plane** (Go REST API + Next.js UI) is responsible strictly for metadata queries, cluster administration, schema compilation, and Kubernetes resource orchestration. It never handles high-volume message streaming directly in memory.
   - The **Data Plane** (Python Worker Pods in Kubernetes) executes data-intensive streaming consumption and database bulk upserts in dedicated, horizontally scalable containers.
2. **Zero-Dependency Native Clients**:
   - Avoids JVM wrappers by utilizing pure Go Kafka drivers (`github.com/segmentio/kafka-go`) in the control plane and native C bindings (`confluent-kafka` with `librdkafka`) in the worker runtime.
3. **Fail-Safe Kubernetes Autonomy**:
   - Every replication job runs as an independent Kubernetes `Deployment` object in its own namespace (`kafbat`). A crash or memory leak in one worker pod has zero impact on other sync jobs or the web console.

---

## 2. High-Level Component Topology

```mermaid
graph TB
    subgraph Presentation_Tier ["Client Tier (Browser / Mobile)"]
        WebClient["Next.js 14 / React 18 SPA\n• React Query Cache\n• Axios with JWT Interceptor\n• Tailwind CSS Responsive UI"]
    end

    subgraph Control_Plane_Tier ["Control Plane Tier (Go + Gin Engine :8080)"]
        Router["Gin Engine HTTP Router\n• CORS & Recovery Middleware\n• JWT Claims Auth Guard"]
        
        subgraph Internal_Modules ["Go Core Internal Modules"]
            KafkaReg["internal/kafka/Registry\n• Cluster Pool\n• SASL/IAM/TLS Client\n• Admin & Watermarks"]
            K8sClient["internal/k8s/Client\n• client-go\n• Deployments & Scaling\n• Pod Health Poller"]
            SchemaEngine["internal/validation/Cache\n• Avro & JSON Schema Validator\n• Fast In-Memory Cache"]
            DBRepos["internal/db/Repositories\n• JobRepo, SchemaRepo, UserRepo\n• Connection Pool (lib/pq)"]
        end
    end

    subgraph Event_Brokers ["Streaming Platform (Kafka Cluster)"]
        KafkaCluster["Apache Kafka 3.8.0\n• KRaft Controller Quorum\n• Topic Partitions (0..N)\n• __consumer_offsets log"]
    end

    subgraph State_Storage ["Control Plane Storage (PostgreSQL 16)"]
        PostgresDB[(PostgreSQL Management DB :5432\n• replication_jobs\n• consumer_metrics (SQL Computed Lag)\n• topic_schemas & schema_fields\n• users & job_errors)]
    end

    subgraph K8s_Execution_Pool ["Kubernetes Worker Pool (Namespace: kafbat)"]
        WorkerPod1["Worker Pod 1\n• main.py\n• confluent-kafka (C librdkafka)\n• Batch buffer"]
        WorkerPodN["Worker Pod N\n• main.py\n• confluent-kafka (C librdkafka)\n• Batch buffer"]
    end

    subgraph Target_Sinks ["External Database Sinks"]
        SinkPG[(PostgreSQL)]
        SinkMySQL[(MySQL)]
        SinkMSSQL[(SQL Server)]
        SinkMongo[(MongoDB)]
    end

    %% Communications
    WebClient -->|HTTP/1.1 REST + Bearer JWT| Router
    Router --> KafkaReg
    Router --> K8sClient
    Router --> SchemaEngine
    Router --> DBRepos

    KafkaReg <-->|Kafka Binary Wire Protocol :9092| KafkaCluster
    DBRepos <-->|PostgreSQL Wire Protocol :5432| PostgresDB

    K8sClient -->|Kubernetes API / REST / HTTPS| WorkerPod1
    K8sClient -->|Kubernetes API / REST / HTTPS| WorkerPodN

    WorkerPod1 <-->|Consumer Group TCP Connection| KafkaCluster
    WorkerPodN <-->|Consumer Group TCP Connection| KafkaCluster

    WorkerPod1 -->|HTTP POST /api/v1/jobs/:id/metrics| Router
    WorkerPodN -->|HTTP POST /api/v1/jobs/:id/metrics| Router

    WorkerPod1 -->|psycopg2 Bulk Upsert| SinkPG
    WorkerPod1 -->|pymongo Insert| SinkMongo
    WorkerPodN -->|pymysql Batch Insert| SinkMySQL
    WorkerPodN -->|pyodbc Merge| SinkMSSQL
```

---

## 3. Component Deep Dive

### 3.1 Frontend Web & Mobile Application (`/frontend`)
- **Framework**: Next.js 14 (App Router) with React 18 and TypeScript.
- **State & Data Fetching**: TanStack React Query (`@tanstack/react-query`) handles automated polling (15s for consumer groups, 5s for live partition metrics, 30s for cluster overviews), request deduplication, and stale-time caching.
- **Styling**: Tailwind CSS with responsive breakpoints (`sm:`, `md:`, `lg:`), mobile slide-over drawers, and thumb-zone bottom navigation bars.
- **Security Interceptor**: Axios request interceptor injects `Authorization: Bearer <token>`; response interceptor clears authentication and triggers redirect on HTTP 401.

### 3.2 Backend Control Plane Gateway (`/backend`)
- **Language**: Go 1.21.
- **HTTP Engine**: Gin (`github.com/gin-gonic/gin`) running in release or debug mode.
- **Kafka Administrative Client**: `github.com/segmentio/kafka-go` provides cluster metadata extraction, topic CRUD, partition watermark offset inspection, and synchronous message production.
- **Kubernetes Controller**: `k8s.io/client-go` programmatically creates, updates, scales, and inspects `apps/v1.Deployment` objects, streams pod container logs, and synchronizes pod health statuses back to PostgreSQL.
- **Authentication**: Salted `bcrypt` password hashing and signed HMAC-SHA256 JWT generation with role-based claims (`admin` vs `viewer`).

### 3.3 Micro-Replication Worker Engine (`/worker`)
- **Runtime**: Python 3.11 on Alpine Linux.
- **Kafka Consumer**: `confluent-kafka` leveraging high-performance C `librdkafka`.
- **Destination Adapters**: Modular pluggable drivers:
  - `PostgresDestination`: Uses `psycopg2` with `execute_batch` and `ON CONFLICT DO UPDATE`.
  - `MySQLDestination`: Uses `pymysql` with `INSERT ... ON DUPLICATE KEY UPDATE`.
  - `SQLServerDestination`: Uses `pyodbc` with T-SQL `MERGE` statements.
  - `MongoDBDestination`: Uses `pymongo` with `bulk_write` and `UpdateOne(upsert=True)`.
- **Metrics Reporter**: Flushes current partition offset, end offset, and calculated lag back to the Go API every 5 seconds.

### 3.4 Management Database (`/db`)
- **Database Engine**: PostgreSQL 16 Alpine.
- **Key Schemas**:
  - `replication_jobs`: Canonical job definitions, destination JSONB configurations, k8s deployment references.
  - `consumer_metrics`: Real-time partition lag calculated dynamically in PostgreSQL via generated column:
    ```sql
    lag BIGINT GENERATED ALWAYS AS (GREATEST(end_offset - current_offset, 0)) STORED
    ```
  - `topic_schemas` & `schema_fields`: Avro and JSON Schema contracts.
  - `job_errors`: Dead-letter tracking holding partition ID, offset, and error messages.
  - `users`: Operator accounts with bcrypt hashes.

---

## 4. Key Architectural Decisions & Trade-Offs

| Decision | Alternative Considered | Why This Choice Won | Trade-Off Accepted |
|---|---|---|---|
| **Go for API Control Plane** | Node.js / Express or Java Spring Boot | Sub-second boot times, minimal memory consumption ($\le 30\text{MB}$), zero GC pauses for metadata queries. | Fewer ready-made enterprise ORM abstractions compared to Spring/Hibernate. |
| **Python for Worker Tasks** | Go / Java workers | Python offers rich, mature database client adapters (Postgres, Mongo, SQL Server) that simplify schema mapping. | Single-threaded GIL per worker process (mitigated by running multiple Kubernetes pod replicas). |
| **Kubernetes Deployments per Job** | Shared multi-tenant worker daemon | Hard fault isolation. A crash in a MongoDB job cannot impact a PostgreSQL job. Independent CPU/memory quotas. | Requires access to a Kubernetes cluster or Docker Desktop K8s. |
| **Generated SQL Columns for Lag** | Application-level lag math | Eliminates race conditions and simplifies SQL queries for aggregated total lag calculations. | Slight write amplification during high-frequency metric upserts. |
| **Stored JSON Schemas in PostgreSQL** | External Confluent Schema Registry | Zero external dependency; self-contained schema governance and field-level mapping. | Does not natively sync with Confluent Schema Registry unless mirrored. |

---

## 5. Dependency & Protocol Matrix

```
+-----------------------------------------------------------------------------------+
|                           COMMUNICATION PROTOCOL MATRIX                           |
+---------------------+---------------------+------------------+--------------------+
| Source Component    | Target Component    | Protocol / Port  | Authentication     |
+---------------------+---------------------+------------------+--------------------+
| Frontend Web        | Backend API         | HTTPS/REST :8080 | Bearer JWT Header  |
| Backend API         | Kafka Brokers       | Kafka Wire :9092 | PLAINTEXT/SASL/IAM |
| Backend API         | Management DB       | PostgreSQL :5432 | Username/Password  |
| Backend API         | Kubernetes API      | HTTPS :6443      | In-Cluster/KubeCfg |
| Worker Pods         | Kafka Brokers       | Kafka Wire :9093 | Internal PLAINTEXT |
| Worker Pods         | Backend API         | HTTP/REST :8090  | Service Network    |
| Worker Pods         | PostgreSQL Sink     | PostgreSQL :5432 | DSN Credentials    |
| Worker Pods         | MongoDB Sink        | MongoDB :27017   | Mongo Auth SCRAM   |
+---------------------+---------------------+------------------+--------------------+
```
