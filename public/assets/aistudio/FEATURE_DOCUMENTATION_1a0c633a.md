# Detailed Feature Documentation

This document provides exhaustive technical documentation for every major feature implemented in the Kafbat UI platform. Each feature is broken down by operational purpose, user trigger, step-by-step execution flow, participating components, business logic, and error/edge-case handling.

---

## Feature 1: Multi-Cluster Inventory & Real-Time Health Inspection

### 1.1 Purpose & Expected Behavior
Provides unified visibility into all registered Apache Kafka clusters (development, staging, production, and cloud-hosted environments like AWS MSK). Displays real-time cluster connectivity state, broker counts, active KRaft/ZooKeeper controller identity, under-replicated partition alarms, and partition balance.

### 1.2 User Interaction Trigger
- User navigates to the `/clusters` dashboard or switches active clusters via the top navigation dropdown.

### 1.3 Step-by-Step Execution Flow
1. **Frontend Request**: The React Query client issues `GET /api/v1/clusters`.
2. **Cluster Enumeration**: The Go backend reads `clusters.json` through `kafka.Registry` and queries cached connectivity statuses.
3. **Broker Metadata Fetch**: For the selected cluster, frontend issues `GET /api/v1/clusters/:clusterId/cluster`.
4. **Sarama Cluster Admin**: `internal/kafka/admin.go` calls `ClusterAdmin.DescribeCluster()`.
5. **Controller Resolution**: Identifies which broker ID currently holds the active controller lock.
6. **Data Presentation**: Frontend renders the broker topology grid, listener ports, rack assignments, and health badges.

### 1.4 Components Involved
- **Frontend**: `app/clusters/page.tsx`, `Header.tsx` (Cluster Selector).
- **Backend**: `handlers/clusters.go`, `kafka/registry.go`, `kafka/admin.go`.
- **Infrastructure**: Apache Kafka brokers on port `9092` / `9093`.

### 1.5 Edge Cases & Error Handling
- **Broker Unreachable**: If TCP handshake fails within 5 seconds, status displays as `Degraded` or `Offline` with the exact socket error; cluster remains selectable but mutations are disabled.
- **Controller Re-election**: If an active controller re-election is underway, the backend catches `sarama.ErrControllerNotAvailable` and returns cached controller ID with a 2-second retry advice header.

---

## Feature 2: Topic Management & Partition Inspection

### 2.1 Purpose & Expected Behavior
Allows administrators to create, reconfigure, browse, and delete Kafka topics. Inspects partition layout, log size estimates, in-sync replicas (ISR), and topic-level configurations (`cleanup.policy`, `retention.ms`, `min.insync.replicas`).

### 2.2 User Interaction Trigger
- **View Topics**: Navigate to `/topics`.
- **Create Topic**: Click "+ New Topic" button, configure partition count, replication factor, and optional retention parameters.
- **Delete Topic**: Click topic action menu -> "Delete Topic" -> confirm in modal.

### 2.3 Step-by-Step Execution Flow
```
User -> Next.js Modal -> POST /api/v1/clusters/:clusterId/topics
     -> JWTAuth (verifies role == "admin")
     -> TopicHandler.CreateTopic()
     -> sarama.ClusterAdmin.CreateTopic(name, &TopicDetail{...})
     -> Kafka Broker commit to KRaft metadata log
     -> Returns 201 Created -> React Query invalidates ["topics", clusterId]
```

### 2.4 Components Involved
- **Frontend**: `app/topics/page.tsx`, `TopicListTable.tsx`, `CreateTopicModal.tsx`.
- **Backend**: `handlers/topics.go`, `kafka/admin.go`.
- **Kafka**: Broker Admin Protocol.

### 2.5 Edge Cases & Error Handling
- **Topic Already Exists**: Returns `409 Conflict` with clear explanation: `Topic '<name>' already exists in cluster`.
- **Invalid Replication Factor**: If user requests replication factor of 3 on a 1-broker cluster, backend catches `sarama.ErrInvalidReplicationFactor` and returns `400 Bad Request` stating available broker count.

---

## Feature 3: Live Message Browser & Partition Seeking

### 3.1 Purpose & Expected Behavior
Allows developers and support engineers to inspect messages inside any topic without launching command-line CLI tools. Supports seeking to specific partitions, jumping to explicit offsets, tailing newest messages, filtering by key/content, and inspecting headers.

### 3.2 User Interaction Trigger
- User selects a topic, navigates to the "Messages" tab, selects partition `0`, enters starting offset or selects "Latest", and clicks "Fetch Messages".

### 3.3 Step-by-Step Execution Flow
1. **Frontend Call**: `GET /api/v1/clusters/:clusterId/topics/:name/messages?partition=0&offset=1024&limit=50`.
2. **Ephemeral Consumer**: Backend instantiates a lightweight `sarama.PartitionConsumer` at the requested partition and offset.
3. **Message Consumption**: Reads up to `limit` records or stops when the high watermark is reached or timeout expires (3.0 seconds).
4. **Header & Key Unpacking**: Decodes byte arrays into UTF-8 strings or JSON objects.
5. **Response**: Closes consumer and returns JSON array of message objects.

### 3.4 Components Involved
- **Frontend**: `components/MessageBrowser.tsx`, JSON Syntax Highlighter.
- **Backend**: `handlers/topics.go`, `kafka/consumer.go`.
- **Kafka**: Broker partition log segments.

### 3.5 Edge Cases & Error Handling
- **Offset Out of Bounds**: If offset is greater than high watermark or smaller than lowest available retention offset, returns empty array with partition watermark limits (`minOffset`, `maxOffset`) allowing the UI to snap to valid boundaries.
- **Non-UTF-8 Binary Payloads**: Decodes safely using lossy replacement (`errors="replace"`), preventing string decoding panics while allowing hex inspection.

---

## Feature 4: Safe Message Producer with In-Flight Schema Validation

### 4.1 Purpose & Expected Behavior
Enables publishing test and operational messages directly from the UI with strict schema enforcement. If a schema is registered for the topic, the message is validated in memory before it can touch the Kafka broker, guaranteeing that invalid data never corrupts downstream consumer pipelines.

### 4.2 User Interaction Trigger
- User clicks "Produce Message", enters optional key, custom headers, and JSON/Avro payload, and clicks "Send Message".

### 4.3 Step-by-Step Execution Flow
```
User clicks "Send Message"
  |
  v
POST /api/v1/clusters/:id/topics/:name/messages (Key, Payload, Headers)
  |
  +--> [Check Schema Repo] -> Schema registered?
  |       |
  |       +-- YES -> [Validation Cache] -> Validate JSON/Avro
  |       |             |
  |       |             +-- FAIL -> Return 422 Unprocessable Entity (Schema violations)
  |       |             +-- PASS -> Continue
  |       |
  |       +-- NO  -> Bypass validation (schemaless mode)
  |
  v
Sarama SyncProducer.SendMessage() -> Written to Kafka Partition
  |
  v
Return 200 OK { partition: 0, offset: 1045, timestamp: "2026-10-29T..." }
```

### 4.4 Components Involved
- **Frontend**: `components/MessagePublisher.tsx`.
- **Backend**: `handlers/topics.go`, `validation/cache.go`, `validation/avro.go`, `validation/jsonschema.go`, `kafka/producer.go`.
- **Database**: `topic_schemas` table.

### 4.5 Edge Cases & Error Handling
- **Schema Validation Failure**: Returns `422 Unprocessable Entity` containing exact JSON path violations (e.g. `Field 'email' is required`, `Field 'age' must be >= 18`).
- **Kafka Producer Timeout**: If leader broker is temporarily unresponsive, returns `504 Gateway Timeout` without committing the request.

---

## Feature 5: In-Memory Schema Registry & Visual Designer

### 5.1 Purpose & Expected Behavior
Provides a central repository for topic schemas supporting JSON Schema (Draft 2020-12) and Apache Avro specifications. Features a visual field designer and real-time validation tester for verifying sample payloads before deploying schemas to production topics.

### 5.2 User Interaction Trigger
- Navigate to `/schemas` or open the "Schema" tab inside any topic view.
- Choose schema format (`json_schema` or `avro`), define field types, primary keys, and nullability, or paste raw schema JSON.
- Click "Validate Sample" to test payload against schema.
- Click "Save Schema" to commit changes.

### 5.3 Step-by-Step Execution Flow
1. **Frontend Call**: `PUT /api/v1/clusters/:clusterId/topics/:name/schema`.
2. **Schema Compilation**: Backend verifies schema syntax using `hamba/avro` or `santhosh-tekuri/jsonschema`.
3. **Database Upsert**: Updates `topic_schemas` and `schema_fields` within a single PostgreSQL transaction.
4. **Cache Invalidation**: Evicts old compiled validator from `validation.Cache` and compiles new version.
5. **Return**: Returns `200 OK` with incremented `schema_version`.

### 5.4 Components Involved
- **Frontend**: `app/schemas/page.tsx`, `components/SchemaEditor.tsx`.
- **Backend**: `handlers/schemas.go`, `db/schema_repo.go`, `validation/cache.go`.
- **Database**: `topic_schemas`, `schema_fields`.

---

## Feature 6: Consumer Group Lag Monitoring & Offset Reset

### 6.1 Purpose & Expected Behavior
Monitors consumer group progress across all topic partitions. Calculates real-time consumer lag ($Lag = High Watermark - Current Offset$). Allows operational teams to re-point or reset consumer group offsets (to `earliest`, `latest`, or explicit offset) during disaster recovery or bug backfills.

### 6.2 User Interaction Trigger
- User opens "Consumer Groups" tab, inspects consumer group table, and selects "Reset Offsets" from group actions.

### 6.3 Step-by-Step Execution Flow
1. **Lag Computation**:
   - `sarama.ClusterAdmin.ListConsumerGroupOffsets()` retrieves committed partition offsets.
   - For each partition, `sarama.Client.GetOffset(topic, partition, OffsetNewest)` gets end offset.
   - Computes difference per partition and aggregates total group lag.
2. **Offset Reset**:
   - User submits desired target (`earliest`, `latest`, or custom numeric offset).
   - Backend calls `sarama.ClusterAdmin.ResetConsumerGroupOffsets(...)`.
   - Kafka updates `__consumer_offsets` topic.

### 6.4 Components Involved
- **Frontend**: `ConsumerLagTable.tsx`, `ResetOffsetModal.tsx`.
- **Backend**: `handlers/consumer_groups.go`, `kafka/admin.go`.
- **Kafka**: `__consumer_offsets` internal partition store.

---

## Feature 7: Kubernetes-Native Database Replication Connectors

### 7.1 Purpose & Expected Behavior
Deploys real-time streaming data replication pipelines that consume messages from Kafka topics and continuously stream them into external databases (PostgreSQL, MySQL, SQL Server, MongoDB). Each job runs as an isolated, auto-restarting Kubernetes `Deployment` with configurable replicas and dynamic scaling.

### 7.2 User Interaction Trigger
- Navigate to `/jobs` -> "+ New Replication Connector".
- Select source cluster and topic.
- Choose destination type (`postgresql`, `mysql`, `sqlserver`, `mongodb`) and provide host, credentials, and target table name.
- Select consumer start position (`earliest` for historical backfill, `latest` for real-time only) and initial pod replica count.
- Click "Deploy Replication Pipeline".

### 7.3 Step-by-Step Execution Flow
```
User clicks "Deploy" -> POST /api/v1/jobs
  |
  +--> Go Backend inserts row into `replication_jobs` (status = "pending")
  |
  +--> k8sClient.CreateDeployment(DeploymentSpec{
         Name: "kafbat-worker-orders-pg",
         JobID: job.ID,
         Replicas: 1,
         MgmtDBDSN: dsn,
         KafkaBrokers: brokers
       })
  |
  +--> Kubernetes API creates Deployment & spawns Pod
  |
  +--> Worker Pod starts `worker/main.py`:
         1. Connects to Mgmt DB -> reads config & schema fields
         2. Connects to Target DB -> executes `ensure_table()`
         3. Connects to Kafka -> joins consumer group & begins consuming
         4. For each record:
              - Enriches with __key__, __headers__, timestamp
              - dest.insert(record, partition, offset, ts)
              - consumer.commit(asynchronous=False)
         5. Periodically flushes metrics to `/api/v1/jobs/:id/metrics`
```

### 7.4 Components Involved
- **Frontend**: `app/jobs/page.tsx`, `JobWizard.tsx`, `LiveMetricsChart.tsx`.
- **Backend**: `handlers/jobs.go`, `db/job_repo.go`, `k8s/client.go`.
- **Kubernetes**: API Server, `Deployment`, `Pod` in namespace `kafbat`.
- **Worker**: Python 3.11 container (`confluent-kafka`, database adapters).
- **Database**: PostgreSQL `replication_jobs`, `consumer_metrics`, `job_errors`.

---

## Feature 8: Pod Health Monitoring, Log Streaming & Poison-Pill Isolation

### 8.1 Purpose & Expected Behavior
Provides observability into replication workers without requiring cluster access or `kubectl`. Features live ANSI terminal log streaming, health status reconciliation, and automatic poison-pill message isolation.

### 8.2 Operational Mechanics
- **Log Streaming**: Backend uses `k8sClient.GetPodLogs(jobID, 200)` to tail pod logs and stream raw terminal output directly to the UI's log console component.
- **Health Reconciliation**: When checking job health, `GetDeploymentHealth` inspects `AvailableReplicas` and pod container termination states (`Waiting.Reason`, `Terminated.ExitCode`).
- **Poison-Pill Isolation**: If a corrupt or malformed message causes an unhandled database insertion error, the worker:
  1. Catches the exception in `worker/main.py`.
  2. Constructs a rich error description with key, offset, and payload attributes.
  3. POSTs the error to `/api/v1/jobs/:id/errors` which stores it in the `job_errors` table.
  4. Commits the offset so the consumer loop does not freeze on the corrupt message.
  5. The UI surfaces an alert banner with the error stack trace, allowing the engineer to inspect the record and reset offsets if needed.
