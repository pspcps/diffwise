# Application Workflows & User Journey Documentation

This document maps out the end-to-end application workflows, step-by-step operations, and sequential interactions across the UI, Go backend, Kafka brokers, PostgreSQL database, and Kubernetes worker pool.

---

## 1. Global User Journey Map

```mermaid
flowchart TD
    Start([User Opens KafkaUI]) --> AuthCheck{JWT in Storage?}
    
    AuthCheck -- No --> LoginPage[Redirect to /login]
    LoginPage --> SubmitLogin[Enter Username & Password]
    SubmitLogin --> APILogin[POST /api/v1/auth/login]
    APILogin --> ValidateCreds{Valid bcrypt hash?}
    ValidateCreds -- No --> LoginError[Show Auth Error]
    ValidateCreds -- Yes --> IssueJWT[Return Signed JWT Token]
    IssueJWT --> SaveToken[Store Token in localStorage]
    SaveToken --> Dashboard[Load Cluster Dashboard]

    AuthCheck -- Yes --> Dashboard
    
    Dashboard --> SelectAction{Choose Action}
    
    SelectAction --> ActionTopics[Browse / Manage Topics]
    SelectAction --> ActionProduce[Produce Messages]
    SelectAction --> ActionConsumer[Inspect Consumer Lag]
    SelectAction --> ActionSchema[Register & Test Schema]
    SelectAction --> ActionJobs[Deploy / Monitor DB Replication]
    SelectAction --> ActionExplore[Browse Unzipped Code]
```

---

## 2. Journey 1: User Authentication & Role-Based Access Control

### 2.1 Description
Ensures that all cluster administrative operations and schema modifications are secured behind JSON Web Tokens with defined role permissions (`admin` vs `viewer`).

### 2.2 Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor User as Operator / Developer
    participant UI as Next.js 14 Frontend
    participant API as Go Backend API
    participant UserRepo as internal/db/UserRepo
    participant DB as PostgreSQL (users table)

    User->>UI: Enter username ("admin") and password
    UI->>API: POST /api/v1/auth/login { username, password }
    API->>UserRepo: GetByUsername(username)
    UserRepo->>DB: SELECT id, password_hash, role FROM users WHERE username = $1
    DB-->>UserRepo: Return user record
    UserRepo-->>API: User model
    API->>API: bcrypt.CompareHashAndPassword(hash, password)
    alt Password Invalid
        API-->>UI: 401 Unauthorized { message: "invalid credentials" }
        UI-->>User: Display error notification
    else Password Valid
        API->>API: Generate HMAC-SHA256 JWT (Claims: user_id, role, exp=24h)
        API-->>UI: 200 OK { token, expiresAt, user: { id, username, role } }
        UI->>UI: Save token to localStorage & set Axios Bearer header
        UI-->>User: Navigate to /clusters (Cluster Dashboard)
    end
```

---

## 3. Journey 2: Topic Creation with Partition & Retention Config

### 3.1 Description
Enables operators to create new topics with custom partition counts, replication factors, and configuration overrides (`retention.ms`, `cleanup.policy`, `compression.type`).

### 3.2 Workflow Flowchart
```mermaid
flowchart TD
    ClickNew[User clicks '+ Create Topic'] --> OpenModal[Open CreateTopicModal]
    OpenModal --> FillForm[Specify Name, Partitions, RF, Retention, Cleanup]
    FillForm --> Submit[Submit Topic Form]
    Submit --> PostAPI[POST /api/v1/clusters/:id/topics]
    PostAPI --> CheckPerms{User is Admin?}
    CheckPerms -- No --> Ret403[403 Forbidden]
    CheckPerms -- Yes --> ValidateParams{Valid Partitions & RF?}
    ValidateParams -- No --> Ret400[400 Bad Request]
    ValidateParams -- Yes --> CallKafkaAdmin[segmentio/kafka-go CreateTopics]
    CallKafkaAdmin --> KafkaCluster[(Kafka Brokers)]
    KafkaCluster -- Success --> Ret201[201 Created]
    Ret201 --> InvalidateCache[React Query invalidates 'topics']
    InvalidateCache --> RefreshTable[UI Updates Topics Table Instantly]
    RefreshTable --> ShowToast[Display Success Toast Notification]
```

---

## 4. Journey 3: Message Production, Schema Validation & Ingestion

### 4.1 Description
A developer creates a test payload and publishes it directly to a topic. The system dynamically validates the message against the registered Avro or JSON Schema before writing to Kafka.

### 4.2 Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Modal as ProduceMessageModal
    participant API as Go Backend API
    participant SchemaCache as internal/validation/Cache
    participant Producer as internal/kafka/Producer
    participant Kafka as Kafka Leader Broker

    Dev->>Modal: Select Topic, Partition (or Auto), Key, JSON Payload, Headers
    Dev->>Modal: Click 'Send Message'
    Modal->>API: POST /api/v1/clusters/:id/topics/:name/messages { partition, key, value, headers }
    
    API->>SchemaCache: GetValidator(clusterId, topicName)
    alt Schema Registered for Topic
        SchemaCache-->>API: Validator instance (Avro / JSON Schema)
        API->>API: Validate(payloadBytes)
        alt Payload Invalid
            API-->>Modal: 400 Bad Request { error: "Schema validation failed: missing 'vin'" }
            Modal-->>Dev: Display Validation Alert Box
        end
    end

    API->>Producer: WriteMessage(ctx, kafka.Message{ Key, Value, Headers, Partition })
    Producer->>Kafka: Socket write over TCP (acks = all)
    Kafka-->>Producer: Broker ACK with partition & committed offset
    Producer-->>API: Nil error
    API-->>Modal: 200 OK
    Modal->>Modal: Close modal
    Modal-->>Dev: Show live toast: "Message produced to P0 @ offset 24810"
```

---

## 5. Journey 4: Consumer Group Monitoring & Offset Reset

### 5.1 Description
A DevOps engineer notices consumer lag building up in a consumer group and needs to inspect individual partition progress or reset offsets to recover processing.

### 5.2 Flowchart
```mermaid
flowchart TD
    OpenCG[User navigates to Consumer Groups] --> FetchGroups[GET /api/v1/clusters/:id/consumer-groups]
    FetchGroups --> KafkaDescribe[Kafka Admin describes consumer groups & offsets]
    KafkaDescribe --> RenderList[Display Group Cards with State & Total Lag]
    RenderList --> ExpandGroup[User expands group 'troublecode-postgres-sync']
    ExpandGroup --> ShowBreakdown[Display Partitions: Committed vs High-Watermark End Offset]
    ShowBreakdown --> ClickReset[User clicks 'Reset to Latest']
    ClickReset --> ConfirmReset{Confirm Reset Action?}
    ConfirmReset -- Yes --> PostReset[POST /api/v1/jobs/:id/reset-offset { position: 'latest' }]
    PostReset --> CommitOffset[segmentio/kafka-go writes offset commit to __consumer_offsets]
    CommitOffset --> UpdateDB[Update consumer_metrics in PostgreSQL]
    UpdateDB --> LagZero[Lag immediately recalculates to 0]
    LagZero --> LiveToast[Show Confirmation Toast: Offsets Advanced]
```

---

## 6. Journey 5: Kubernetes Replication Job Deployment & Worker Sync

### 6.1 Description
A data engineer connects a Kafka topic to PostgreSQL. The control plane provisions an independent Kubernetes deployment with containerized Python workers.

### 6.2 Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Engineer as Data Engineer
    participant UI as Replication Jobs View
    participant API as Go Backend API
    participant DB as Management DB (PostgreSQL)
    participant K8s as Kubernetes API Server
    participant Pod as Worker Pod (Python)
    participant Sink as Target Store (PostgreSQL)

    Engineer->>UI: Fill Job Form: Topic, Target Host/Port, DB, Table, Pod Replicas
    Engineer->>UI: Click 'Launch Worker Job'
    UI->>API: POST /api/v1/jobs { name, topic, destination_type, destination_config, replicas }
    API->>DB: INSERT INTO replication_jobs (status='pending')
    API->>K8s: Create apps/v1.Deployment ("deploy-kafkasync-troublecodes", replicas=2)
    K8s-->>API: Deployment Created
    API-->>UI: 201 Created { job }

    K8s->>Pod: Schedule & Start Pod (injected with JOB_ID, KAFKA_BROKERS, DSN)
    Pod->>DB: Fetch job definition & schema fields
    Pod->>Sink: Ensure table structure exists (CREATE TABLE IF NOT EXISTS)
    
    loop Stream Ingestion
        Pod->>Pod: Poll message batch from Kafka
        Pod->>Sink: Execute batch upsert (execute_batch)
        Sink-->>Pod: Transaction committed
        Pod->>Pod: Commit Kafka offset
        alt Every 5 seconds
            Pod->>API: POST /jobs/:id/metrics { partition_id, current_offset, end_offset }
            API->>DB: UPSERT INTO consumer_metrics
        end
    end

    alt User Scales Pods in UI
        Engineer->>UI: Click '+ pod replica'
        UI->>API: PUT /api/v1/jobs/:id/replicas { replicas: 3 }
        API->>K8s: Scale Deployment to 3 replicas
        K8s-->>API: Scale ACK
        API-->>UI: 200 OK
        UI-->>Engineer: Shows '3 pod(s)'
    end
```
