# Codebase Structure & Module Architecture Guide

This guide provides a comprehensive tour of the physical codebase, file hierarchy, package responsibilities, execution entry points, and cross-cutting connections across the Go backend, Python worker engine, PostgreSQL migrations, and Next.js frontend.

---

## 1. Directory Tree & Physical Organization

```
kafkaUI-main/
├── backend/                             # Go 1.21 Control Plane Microservice
│   ├── cmd/
│   │   └── server/
│   │       └── main.go                  # Service Bootstrap & Dependency Injection Root
│   ├── internal/
│   │   ├── api/
│   │   │   ├── handlers/                # HTTP Request Handlers (Gin)
│   │   │   │   ├── auth.go              # Login, token validation, user context
│   │   │   │   ├── clusters.go          # Cluster enumeration and broker metadata
│   │   │   │   ├── consumer_groups.go   # Group lag, active members, topic offsets
│   │   │   │   ├── health.go            # Liveness/Readiness probes
│   │   │   │   ├── jobs.go              # Job CRUD, replica scaling, offset reset, log stream
│   │   │   │   ├── schemas.go           # Avro/JSON schema registry & validation endpoints
│   │   │   │   └── topics.go            # Topic creation, deletion, browsing, publishing
│   │   │   ├── middleware/              # Gin Interceptors
│   │   │   │   ├── auth.go              # JWT parsing, signature verification, RBAC role check
│   │   │   │   ├── cluster.go           # Cluster context extraction & client binding
│   │   │   │   └── cors.go              # Cross-Origin Resource Sharing headers
│   │   │   └── router.go                # Route registration, handler wiring, middleware chains
│   │   ├── auth/                        # Security & Token Primitives
│   │   │   ├── config.go                # JWT expiration & secret management
│   │   │   └── token.go                 # HMAC-SHA256 signing and claims extraction
│   │   ├── db/                          # PostgreSQL Persistence Layer (lib/pq)
│   │   │   ├── db.go                    # Connection pool management & ping verification
│   │   │   ├── job_repo.go              # CRUD for replication_jobs, metrics, and errors
│   │   │   ├── schema_repo.go           # DDL schema persistence and version management
│   │   │   └── user_repo.go             # User lookup and bcrypt password verification
│   │   ├── k8s/                         # Kubernetes Orchestration
│   │   │   └── client.go                # client-go Deployments, Pod status, and Log streaming
│   │   ├── kafka/                       # Pure-Go Kafka Engine (Sarama)
│   │   │   ├── admin.go                 # Cluster metadata, topic DDL, broker inspection
│   │   │   ├── config.go                # Cluster credentials parser (SASL/TLS/Plain)
│   │   │   ├── consumer.go              # On-demand message browsing and reverse seek
│   │   │   ├── producer.go              # Synchronous message publishing with header injection
│   │   │   └── registry.go              # Thread-safe multi-cluster client connection cache
│   │   ├── models/                      # Cross-Domain Data Transfer Objects (DTOs)
│   │   │   ├── cluster.go               # Broker, Rack, and Cluster specifications
│   │   │   ├── job.go                   # Job status, metrics, and destination configs
│   │   │   ├── schema.go                # Field definitions, Avro/JSON types
│   │   │   └── topic.go                 # Partition offset ranges, ISR, and configuration maps
│   │   └── validation/                  # Synchronous Validation Engine
│   │       ├── avro.go                  # Hamba Avro schema compiler and validator
│   │       ├── cache.go                 # Thread-safe sync.Map validator cache
│   │       └── jsonschema.go            # Santhosh Tekuri JSON Schema Draft 2020-12 engine
│   ├── Dockerfile                       # Multi-stage Go build to alpine minimal container
│   └── go.mod                           # Go dependencies and direct requirements
│
├── worker/                              # Python 3.11 High-Throughput Replication Engine
│   ├── destinations/                    # Polymorphic Database Destination Adapters
│   │   ├── __init__.py                  # Factory method for adapter instantiation
│   │   ├── base.py                      # Abstract Base Class (ABC) defining adapter lifecycle
│   │   ├── mongodb.py                   # PyMongo adapter with automatic document upserts
│   │   ├── mysql.py                     # PyMySQL adapter with batch parameter binding
│   │   ├── postgres.py                  # Psycopg2 adapter using execute_batch and ON CONFLICT
│   │   └── sqlserver.py                 # PyODBC adapter for Microsoft SQL Server
│   ├── config.py                        # Job configuration loader from PostgreSQL management DB
│   ├── errors.py                        # Non-blocking error reporting to Go control plane
│   ├── main.py                          # C-librdkafka consumer loop, signal traps, and commit logic
│   ├── metrics.py                       # Periodic watermark offset polling and telemetry pusher
│   ├── requirements.txt                 # Python dependencies (confluent-kafka, fastavro, etc.)
│   └── Dockerfile                       # Python 3.11 slim image with C build tools and librdkafka
│
├── db/                                  # Database Migrations & Schemas
│   └── migrations/
│       ├── 001_init.sql                 # Base tables (topic_schemas, replication_jobs, metrics)
│       ├── 002_field_source.sql         # Column mapping source (payload, key, headers, metadata)
│       ├── 003_last_error.sql           # Replication job last error tracking column
│       ├── 004_job_errors.sql           # Detailed per-message error table with offset context
│       ├── 005_team_alert.sql           # On-call alerting and team notification metadata
│       ├── 006_users.sql                # RBAC users table with bcrypt password hashes
│       └── 007_schema_validation.sql    # Typed schema support (JSON Schema, Avro, versioning)
│
├── frontend/                            # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/                         # App Router Page Declarations
│   │   │   ├── clusters/                # Cluster overview and broker inventory pages
│   │   │   ├── jobs/                    # Replication job builder, metrics monitor, and logs
│   │   │   ├── schemas/                 # Schema Registry designer and validation workbench
│   │   │   ├── topics/                  # Topic browser, message publisher, and partition viewer
│   │   │   ├── layout.tsx               # Root navigation shell, sidebar, and status indicators
│   │   │   └── page.tsx                 # Dashboard summary metrics and health overview
│   │   ├── components/                  # Modular React UI Elements
│   │   │   ├── ConsumerLagTable.tsx     # Partition-level offset lag and throughput charts
│   │   │   ├── MessageBrowser.tsx       # Real-time message tailing and JSON tree inspector
│   │   │   ├── MessagePublisher.tsx     # Interactive message composer with schema validation
│   │   │   ├── PodLogViewer.tsx         # ANSI-compatible real-time Kubernetes log streamer
│   │   │   └── SchemaEditor.tsx         # Monaco/JSON editor for schema definitions
│   │   └── lib/
│   │       ├── api.ts                   # Typed Axios API client with automatic token injection
│   │       └── auth.ts                  # LocalStorage session and role evaluation helpers
│   ├── package.json                     # Frontend dependencies and Next.js build scripts
│   └── tsconfig.json                    # TypeScript compiler options
│
├── scripts/                             # Utility & Automation Scripts
│   ├── 01_create_topics.sh              # Bash script to create standard demo topics via kafka-topics
│   ├── 02_seed_data.sh                  # Python/bash message generator injecting mock traffic
│   └── run_migrations.sh                # Sequential psql execution of 001..007 migrations
│
├── clusters.json                        # Cluster connection inventory (Local, Staging, Production)
├── docker-compose.yml                   # Multi-service stack (Kafka KRaft, Postgres, Backend, UI)
├── setup.sh                             # One-touch initialization script for local environment
└── README.md                            # Quickstart repository documentation
```

---

## 2. Key Modules & Subsystem Responsibilities

### 2.1 Backend Control Plane (Go)

#### `backend/cmd/server/main.go`
- **Responsibility**: System initialization root.
- **Workflow**:
  1. Reads environment configuration (`PORT`, `CLUSTERS_CONFIG`, `MGMT_DB_DSN`, `JWT_SECRET`).
  2. Parses `clusters.json` and initializes `kafka.Registry`.
  3. Connects to PostgreSQL management database via `db.Connect` and verifies connectivity.
  4. Initializes repositories (`UserRepo`, `JobRepo`, `SchemaRepo`).
  5. Initializes `validation.Cache` for in-memory Avro and JSON Schema compiled evaluators.
  6. Attempts connection to Kubernetes API via `k8s.NewClient`; gracefully degrades to local-only mode if Kubernetes is unavailable.
  7. Instantiates the Gin router via `api.NewRouter(...)` and begins listening on configured port.

#### `backend/internal/kafka/registry.go` & `admin.go`
- **Responsibility**: Manages client lifecycle and connection multiplexing across multiple Kafka clusters.
- **Key Pattern**: A thread-safe map `sync.RWMutex` caches `sarama.ClusterAdmin` and `sarama.Client` instances. Handlers obtain an active client via `registry.Get(clusterID)`, preventing the overhead of creating new TCP connections on every API request.
- **Admin Capabilities**: Discovers broker controller IDs, creates topics with custom partition/replica specs, alters topic configuration parameters, deletes topics, and inspects consumer group metadata.

#### `backend/internal/validation/` (`cache.go`, `avro.go`, `jsonschema.go`)
- **Responsibility**: Schema pre-compilation and sub-millisecond payload validation.
- **Key Pattern**: Compiling JSON Schema or Avro definitions into abstract syntax trees is computationally intensive. The `validation.Cache` maintains a concurrent `sync.Map` of `(cluster_id:topic_name:version) -> CompiledValidator`. When a message is published, the validator is looked up in $O(1)$ time and evaluated against the incoming payload.

#### `backend/internal/k8s/client.go`
- **Responsibility**: Translates user configuration into declarative Kubernetes resources.
- **Key Methods**:
  - `CreateDeployment(ctx, spec)`: Constructs an `apps/v1.Deployment` manifest with container resource limits, environment variables (`JOB_ID`, `KAFKA_BROKERS`, `MGMT_DB_DSN`), and applies it to the `kafbat` namespace.
  - `ScaleDeployment(ctx, name, replicas)`: Directly scales deployment replicas (e.g. `replicas=0` to pause, `replicas=N` to resume).
  - `GetPodLogs(ctx, jobID, lines)`: Locates the newest active pod matching label `job-id=<UUID>` and streams the trailing log lines via the Kubernetes API.
  - `GetDeploymentHealth(ctx, deployName, jobID)`: Inspects `d.Status.AvailableReplicas` and pod container termination states (`Waiting`, `Terminated.ExitCode`) to report precise pod error reasons.

---

### 2.2 Replication Worker Engine (Python)

#### `worker/main.py`
- **Responsibility**: The high-throughput execution core.
- **Key Mechanics**:
  1. Bootstraps by reading `JOB_ID` and fetching job parameters from the PostgreSQL management DB via `config.py`.
  2. Dynamically loads the target destination adapter (`postgres`, `mysql`, `sqlserver`, or `mongodb`).
  3. Calls `dest.ensure_table()` to verify that the target table/collection exists.
  4. Configures `confluent_kafka.Consumer` with `enable.auto.commit=False` and IPv4 resolution (`broker.address.family=v4`).
  5. Enters an infinite consumption loop:
     - Polls messages using `consumer.poll(timeout=1.0)`.
     - Injects metadata: `__key__`, `__headers__`, and converted UTC publish timestamp.
     - Performs target database insertion via `dest.insert(...)`.
     - **Synchronous Commit**: On success, immediately commits offset via `consumer.commit(message=msg, asynchronous=False)`.
     - **Poison-Pill Isolation**: On insert failure, formats exception details, posts an error report to `/jobs/:id/errors`, and commits the offset anyway to prevent consumer deadlock.
  6. Flushes watermark metrics to `/jobs/:id/metrics` every 5 seconds.

#### `worker/destinations/` (`base.py`, `postgres.py`, `mongodb.py`, etc.)
- **Responsibility**: Provides polymorphic database sink implementations conforming to `BaseDestination`.
- **Key Methods**:
  - `ensure_table()`: Automatically executes `CREATE TABLE IF NOT EXISTS` matching configured schema fields, creating appropriate primary key constraints.
  - `insert(record, partition, offset, timestamp)`: Maps payload attributes into target SQL parameters or BSON documents, applying upsert or append logic.
  - `close()`: Gracefully terminates database connection pools.

---

### 2.3 Management Database Migrations (`db/migrations/`)

- **`001_init.sql`**: Seeds tables for `topic_schemas`, `schema_fields`, `replication_jobs`, and `consumer_metrics`. Defines trigger functions `set_updated_at()` for automatic timestamp tracking.
- **`002_field_source.sql`**: Extends schema fields with `field_source` (`payload`, `key`, `header`, `metadata`) to support advanced extraction rules.
- **`003_last_error.sql`**: Adds `last_error` text column to `replication_jobs` for instant UI banner display.
- **`004_job_errors.sql`**: Creates `job_errors` table to store offset-specific crash stack traces with descending timestamp indexes.
- **`005_team_alert.sql`**: Adds on-call alert targets and webhook destinations.
- **`006_users.sql`**: Adds RBAC authentication tables with role enums (`admin`, `viewer`).
- **`007_schema_validation.sql`**: Adds `schema_format` (`manual`, `none`, `json_schema`, `avro`), `schema_text`, and `schema_version` to support active producer validation.

---

## 3. Key Execution Paths

```
+--------------------------------------------------------------------------------------------------+
|                                  PRIMARY EXECUTION FLOWS                                         |
+--------------------------------------------------------------------------------------------------+

1. Cluster Metadata Discovery Flow:
   Browser Request -> Next.js Page -> GET /api/v1/clusters/:id/cluster
   -> Gin Router -> ClusterMiddleware -> Registry.Get(clusterId)
   -> Sarama.ClusterAdmin.DescribeCluster() -> Broker & Controller List -> JSON Response

2. Safe Message Publish Flow:
   MessagePublisher.tsx -> POST /api/v1/clusters/:id/topics/:name/messages
   -> JWTAuth Middleware (Role: Admin) -> TopicHandler.ProduceMessage()
   -> SchemaRepo.GetSchema() -> ValidationCache.Validate(Payload)
      [If Invalid -> 422 Unprocessable Entity + Error Detail]
      [If Valid] -> Sarama.SyncProducer.SendMessage(Topic, Key, Value, Headers)
   -> Returns Partition & Assigned Offset

3. Worker Lifecycle & Scale Flow:
   Admin clicks "Pause" -> PATCH /api/v1/jobs/:id {"action": "pause"}
   -> JobHandler.UpdateStatus() -> DB: status = 'paused'
   -> k8sClient.ScaleDeployment(deployName, 0)
   -> K8s API terminates worker pods
   -> UI displays status "Paused" with 0 active pods
```
