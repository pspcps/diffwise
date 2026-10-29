# Project Overview: KafkaUI (Kafbat-Inspired Cluster & Stream Manager)

## 1. Executive Summary
**KafkaUI** is a modern, enterprise-grade distributed stream management, schema governance, and database replication platform. Built with a **Next.js 14 / React 18** frontend, a high-performance **Go (Gin)** control-plane backend, and **Kubernetes-native Python replication workers**, it eliminates the operational overhead of managing Apache Kafka clusters, consumer lag, and change-data/event replication pipelines.

Historically, organizations running Apache Kafka face three distinct operational friction points:
1. **Cluster Observability & Diagnostics**: Traditional UIs are frequently heavy, JVM-bound, complex to deploy, or locked behind expensive enterprise SaaS licenses.
2. **Schema Integrity & Poison-Pill Prevention**: Upstream producers frequently push unversioned, malformed messages that cause downstream consumer groups to crash or hang indefinitely.
3. **Database Streaming & CDC Sinks**: Replicating topic streams into analytical and transactional databases (PostgreSQL, MySQL, SQL Server, MongoDB) typically requires configuring heavy Kafka Connect distributed clusters with complex XML/JSON configurations, rigid plugins, and high memory footprints.

KafkaUI addresses all three challenges within a unified, self-contained architecture. It delivers real-time cluster observation, an in-flight schema registry and validation engine, and dynamic point-and-click deployment of containerized replication workers directly onto Kubernetes.

---

## 2. Core Problem Statement & Solutions

| Problem in Event-Driven Architecture | How KafkaUI Solves It |
|---|---|
| **JVM Memory Bloat in Tooling**: Tools like traditional Kafka Connect or legacy Java UIs consume 1.5GB–4GB RAM per instance just for management tasks. | **Zero-JVM Control Plane**: A lightweight Go binary consuming $\le 30\text{MB}$ memory and starting in under 200ms, paired with isolated containerized workers. |
| **Consumer Group Deadlock on Poison Pills**: A single corrupt message halts consumer progress, requiring manual CLI offset manipulation. | **Automated Dead-Letter Routing**: When a worker encounters an unparseable record, it commits the offset, logs the exact payload, partition, and offset to `job_errors`, and alerts operators in the UI without halting the stream. |
| **Multi-Cloud Authentication Headaches**: Teams operate across local dev (KRaft), AWS MSK, Confluent Cloud, and on-prem clusters with diverse auth requirements. | **Unified Multi-Cluster Engine**: Native support for AWS MSK IAM (SigV4 signing), SASL/SCRAM-SHA-512, SASL/PLAIN over TLS, and unauthenticated local development. |
| **Opaque Consumer Lag**: Identifying which consumer is lagging on which specific partition requires running verbose CLI scripts (`kafka-consumer-groups.sh`). | **Sub-Second Partition Lag Breakdown**: Visual tabular and card monitors showing high-watermark end offsets, committed offsets, and generated lag calculations per partition. |

---

## 3. Key Features & Capabilities

### 3.1 Cluster & Broker Topology Management
- **KRaft & ZooKeeper Support**: Native observation of Apache Kafka 3.x+ clusters operating in KRaft metadata mode (Broker + Controller roles) or classic ZooKeeper mode.
- **Node Health & Metric Inspection**: Real-time tracking of broker ID, host/port endpoints, controller leadership, availability racks, disk utilization percentages, and CPU usage.
- **Multi-Cluster Context Switching**: Instant hot-switching between clusters defined via environment variables (`KAFKA_BOOTSTRAP`) or JSON multi-cluster configs (`clusters.json`).

### 3.2 Topic Management & Message Streaming
- **Lifecycle Operations**: Create, inspect, configure, and delete Kafka topics with custom partition counts, replication factors, and cleanup policies (`delete` vs `compact`).
- **Partition Watermarks & ISR Tracking**: Detailed inspection of In-Sync Replicas (`isr`), leader broker IDs, start offsets, and high-watermark end offsets.
- **Message Browser**: Filter messages by partition ID, offset, key substring, or value JSON content. Features an expandable message inspector displaying decoded keys, payload formatting, headers, and timestamps.
- **Message Producer**: Publish test or transactional messages with targeted partition selection, custom keys, JSON payload validation, and user-defined headers.

### 3.3 Consumer Groups & Lag Diagnostics
- **Rebalance State Monitoring**: Live tracking of group states (`Stable`, `Empty`, `PreparingRebalance`, `CompletingRebalance`, `Dead`).
- **Partition-by-Partition Lag**: Visual progress indicators displaying committed offset vs log end offset for every assigned partition.
- **Offset Reset Controls**: Fast-forward or rewind consumer offsets (`earliest`, `latest`, or exact custom offsets per partition) to recover stuck consumer groups.

### 3.4 Schema Registry & Contract Enforcement
- **Multi-Format Governance**: Supports **Apache Avro**, **JSON Schema**, and **Protobuf** formats.
- **Contract Validation**: Pre-compiles schemas into memory; validates incoming producer payloads and sample messages before writing to topics.
- **Field-Level Mapping**: Explicit mapping of schema fields, data types, sources (`value`, `key`, `header`), primary keys, and required status.

### 3.5 Micro-Replication Connectors (Kubernetes-Powered)
- **Multi-Target Relational & Document Sinks**: Stream topics into **PostgreSQL**, **MySQL**, **Microsoft SQL Server**, and **MongoDB**.
- **Dynamic Kubernetes Deployments**: Spawns isolated worker pods running in namespace `kafbat` with configurable pod replica counts.
- **At-Least-Once Delivery**: Offsets are committed to Kafka *only* after database batch upserts commit.
- **Pod Log Streaming & Lifecycle**: View live pod stdout/stderr logs, pause jobs, resume jobs, and dynamically scale worker pod replicas.

---

## 4. Intended Users & Target Personas

```
+-------------------------------------------------------------------------------+
|                             KAFKAUI USER PERSONAS                             |
+-------------------+-----------------------------------------------------------+
| Software Engineer | • Publishes & tests message payloads during local dev     |
|                   | • Inspects topic schema contracts & partition offsets     |
|                   | • Browses real-time messages & debugs event payloads      |
+-------------------+-----------------------------------------------------------+
| DevOps & SRE      | • Monitors cluster health, broker quorum, and disk usage  |
|                   | • Tracks consumer group lag and recovers stuck offsets    |
|                   | • Manages Kubernetes worker deployments and log streams   |
+-------------------+-----------------------------------------------------------+
| Data Engineer     | • Sets up database replication pipelines into data lakes  |
|                   | • Configures target schemas for Postgres, MySQL, Mongo    |
|                   | • Monitors data sink replication lag and error logs       |
+-------------------+-----------------------------------------------------------+
| Engineering Lead  | • Oversees stream infrastructure and resource consumption |
|                   | • Audits RBAC security and multi-cloud MSK/Confluent auth |
+-------------------+-----------------------------------------------------------+
```

---

## 5. Business Value & ROI
1. **Infrastructure Cost Reduction**: Replaces multi-gigabyte JVM Kafka Connect clusters with lightweight, ephemeral Kubernetes pods that scale to zero when jobs are paused.
2. **Accelerated Developer Velocity**: Eliminates CLI dependency for topic creation, message debugging, and consumer lag verification, saving engineering hours during incident triage.
3. **Data Quality Assurance**: Prevents downstream system failures by stopping schema violations at the cluster boundary before records pollute analytical databases.
4. **Cloud Agility**: Provides seamless portability across local developer Docker environments, self-hosted Kubernetes clusters, AWS MSK, and Confluent Cloud.
