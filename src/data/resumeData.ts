export const RESUME = {
  name: 'Prakash Choudhary',
  initials: 'PC',
  email: 'prakash.seervi9460@gmail.com',
  phone: '+91-8440944580',
  linkedin: 'https://linkedin.com/in/prakashseervi63',
  title: 'Senior Software Engineer',
  focus: 'Kafka · Node.js · React · AWS · GCP · GenAI',
  summary: 'Results-driven backend engineer with 9+ years of experience building high-scale, cloud-native microservices and real-time systems. Deep expertise in Kafka, Node.js, PostgreSQL, and AWS/GCP, with a strong background in event-driven architecture and performance optimization. Led and mentored teams of 4–6 engineers, driving architectural decisions and delivering solutions generating over $1M/year in cost savings.',

  stats: [
    { value: '9+', label: 'Years Experience', color: '#4f8ef7' },
    { value: '~$1M', label: 'Annual Cost Saved', color: '#10b981' },
    { value: '4–6', label: 'Team Size Led', color: '#8b5cf6' },
    { value: '99%', label: 'Tracking Accuracy', color: '#f59e0b' },
  ],

  experience: [
    {
      company: 'Lytx India Technologies',
      role: 'Sr. Software Engineer',
      period: 'Oct 2024 – Present',
      current: true,
      color: '#4f8ef7',
      bullets: [
        'Architected high-RPS reverse geocoding system (OSM + Redis), replacing Google Maps API — saving ~$1M/year.',
        'Built AI-driven diagnostic tool using device data, accelerating issue resolution by 40%.',
        'Reduced alert noise by 60% via enhanced event-muting for non-critical events.',
        'Optimized bulk inserts via batching, reducing DB errors by 60–70%.',
      ],
    },
    {
      company: 'Pluralsight India Pvt. Ltd.',
      role: 'SDE-3 → SDE-2',
      period: 'Nov 2022 – Oct 2024',
      current: false,
      color: '#8b5cf6',
      bullets: [
        'Designed Kafka-based real-time content tracking pipelines with exactly-once semantics, improving accuracy by 99%.',
        'Monitored Kafka lag and consumer health via Grafana/OpsGenie, reducing production incidents.',
        'Optimized 100+ complex SQL queries, reducing execution times by 60–70%.',
      ],
    },
    {
      company: 'EGVERSE Technology Solutions',
      role: 'Software Engineer',
      period: 'Mar 2022 – Oct 2022',
      current: false,
      color: '#10b981',
      bullets: [
        'Migrated 2M+ records from MongoDB to PostgreSQL with zero data loss.',
        'Developed Snowflake SQL queries to optimize analytics pipelines, boosting performance by 20%.',
      ],
    },
    {
      company: 'Reliable Soft Technologies',
      role: 'Tech Lead → SDE',
      period: 'Jan 2017 – Mar 2022',
      current: false,
      color: '#f59e0b',
      bullets: [
        'Architected full-stack solutions using Node.js, React.js, Kafka, PostgreSQL for CRM platforms.',
        'Designed Kafka-based bulk file ingestion pipelines for large async dataset processing.',
        'Automated workflows via SQL Service Broker, improving performance by 50%.',
        'Integrated payment gateways across 3+ enterprise systems.',
      ],
    },
  ],

  skills: {
    'Languages & Frameworks': { color: '#4f8ef7', items: ['Node.js', 'TypeScript', 'NestJS', 'React.js', 'GraphQL', 'C#', 'F#'] },
    'Messaging & Streaming':  { color: '#8b5cf6', items: ['Kafka', 'RabbitMQ', 'AWS SQS', 'MQTT'] },
    'Databases':              { color: '#10b981', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'T-SQL', 'Snowflake'] },
    'DevOps & Cloud':         { color: '#f59e0b', items: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'GitLab CI/CD', 'Jenkins'] },
    'GenAI & Emerging Tech':  { color: '#ec4899', items: ['Gemini', 'Vertex AI', 'ADK', 'MCP', 'Ollama', 'LangChain', 'ChromaDB', 'Claude', 'AIDLC'] },
  },

  projects: [
    {
      title: 'DiffWise',
      subtitle: 'Smart Online Diff Tool for Developers',
      period: '2025',
      tech: ['React', 'TypeScript', 'Vite', 'Monaco Editor', 'Tailwind CSS'],
      color: '#89b4fa',
      github: 'https://github.com/pspcps/diffwise',
      bullets: [
        'Side-by-side text and file comparison tool powered by Monaco Editor with syntax highlighting for 50+ languages.',
        'Per-line diff arrows in a dedicated center strip let users move individual changed lines left or right with one click.',
        'File Compare mode uses a hidden diff engine sharing live Monaco models for zero-flicker ViewZone alignment.',
      ],
    },
    {
      title: 'ApiDesk Studio',
      subtitle: 'API Testing, Mocking & Collaboration Workspace',
      period: '2025',
      tech: ['React', 'Node.js', 'Express', 'PostgreSQL', 'OpenAPI', 'REST'],
      color: '#f97316',
      github: 'https://github.com/pspcps/ApiDesk-Studio',
      bullets: [
        'Centralized workspace for designing, testing, and validating REST APIs with a clean developer-first workflow.',
        'Supports request building, response inspection, environment configuration, and streamlined API collaboration.',
      ],
    },
    {
      title: 'Wealth Management Portfolio Tracker',
      subtitle: 'Portfolio Monitoring & Investment Insights Dashboard',
      period: '2025',
      tech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Charts', 'Finance'],
      color: '#10b981',
      github: 'https://github.com/pspcps/Wealth-Management-Portfolio-Tracker',
      bullets: [
        'Tracks investment holdings and portfolio performance with a clear overview of balances, trends, and allocation health.',
        'Designed to help users monitor wealth growth, portfolio composition, and key financial insights in one place.',
      ],
    },
    {
      title: 'Project Drishti',
      subtitle: 'Agentic AI Crowd Safety Platform',
      period: 'May 2025 – Present',
      tech: ['React', 'Vite', 'Firebase', 'Vertex AI', 'Gemini', 'Cloud Run', 'Docker'],
      color: '#4f8ef7',
      github: 'https://github.com/pspcps/project-drishti',
      bullets: [
        'Live webcam/mobile frame analysis via Vertex AI Vision for real-time crowd density and person counting.',
        'Gemini LLM autonomously assesses risk (smoke, fire, medical emergencies, crowd surges) and auto-assigns responders — ~85–90% fully agentic.',
        'Real-time dashboard with live risk levels, incident status, and responder tracking on Google Cloud Run.',
      ],
    },
    {
      title: 'Resume AI',
      subtitle: 'AI-Powered Resume Analyzer & Job Matcher',
      period: 'May 2025 – Present',
      tech: ['React', 'TypeScript', 'Firebase', 'Gemini 2.5 Pro', 'Vertex AI', 'Firestore'],
      color: '#8b5cf6',
      github: 'https://github.com/pspcps/resume-ai',
      bullets: [
        'Uploads PDF/text resume; Gemini 2.5 Pro scores it 0–100 (ATS), identifying skills, strengths, weaknesses, and improvement suggestions.',
        'AI-powered job role matching with reasoning, covering upload, analysis, builder, and job-match pages.',
      ],
    },
    {
      title: 'Ask My Docs',
      subtitle: 'Private Local RAG Chatbot for Your Documents',
      period: '2025',
      tech: ['Python', 'Ollama', 'LangChain', 'Redis', 'Streamlit', 'Flask'],
      color: '#10b981',
      github: 'https://github.com/pspcps/ask-my-docs',
      bullets: [
        'Ingest PDFs, text files, or notes into Redis as vector embeddings — 100% offline, data never leaves your machine.',
        'RAG pipeline retrieves relevant chunks and feeds them to a local Ollama LLM (llama3/mistral/codellama) for grounded answers.',
      ],
    },
    {
      title: 'Safety App',
      subtitle: 'AI Driver Monitoring via Local Vision LLM',
      period: '2025',
      tech: ['Python', 'Flask', 'Ollama', 'llama3.2-vision', 'ffmpeg'],
      color: '#ec4899',
      github: 'https://github.com/pspcps/safety_app',
      bullets: [
        'Accepts video uploads, extracts frames via ffmpeg, and analyzes each with a local vision LLM (llama3.2-vision:11b).',
        'Two modes: in-cabin (eating, sleeping, phone use, fatigue) and road-facing (accident risk, weather, road hazards) — fully local.',
      ],
    },
    {
      title: 'InkMind',
      subtitle: 'Offline AI Notebook — Write, Think, Draw & Simulate',
      period: '2025',
      tech: ['React', 'TypeScript', 'Electron', 'FastAPI', 'Ollama', 'ChromaDB', 'ReactFlow'],
      color: '#f59e0b',
      github: 'https://github.com/pspcps/inkMind',
      bullets: [
        'Markdown notes with RAG-powered AI chat (Ask & Agent modes), bulk PDF/HTML import, and source citations — all offline.',
        'Flow Simulator: switch architecture diagrams into live simulation mode with animated packets, per-node delay/error rates, and real-time metrics.',
        'Cross-platform: macOS .dmg, Windows .exe, and Android APK via Capacitor.',
      ],
    },
    {
      title: 'Kafbat UI',
      subtitle: 'Web-Based Kafka Cluster Management Interface',
      period: '2025',
      tech: ['Next.js 14', 'React', 'TypeScript', 'Go', 'Gin', 'Sarama', 'PostgreSQL', 'Docker', 'Kafka'],
      color: '#f97316',
      github: 'https://github.com/pspcps/kafkaUI',
      bullets: [
        'Full-stack Kafka management dashboard — view broker/topic/consumer group status and controller info in real time.',
        'Topics manager with create/list/delete, partition details, and a message browser with filter by partition, offset, key, and value.',
        'Consumer group monitoring with per-topic per-partition lag breakdown; Go backend using IBM Sarama, frontend on Next.js 14 App Router.',
      ],
    },
    {
      title: 'FleetMind',
      subtitle: 'Agentic Natural-Language Query System for Fleet Ops',
      period: '2025',
      tech: ['DynamoDB', 'MySQL', 'New Relic', 'React', 'AI Agents', 'CLI'],
      color: '#06b6d4',
      github: null,
      bullets: [
        'Natural-language interface for fleet operators to query live device and event data — no SQL or dashboard switching required.',
        'Multi-agent orchestration fans queries to specialized agents across DynamoDB, MySQL, and New Relic, returning one synthesized answer.',
      ],
    },
  ],

  openSource: [
    { project: 'Liquibase', link: 'https://github.com/liquibase/liquibase', contribution: 'Added GENERATED ALWAYS attribute support for PostgreSQL (Release 4.6.2).' },
    { project: 'Free RADIUS', link: '#', contribution: 'Customized database and functionality for Fair Usage Policy implementation.' },
    { project: 'Mikro-Node', link: '#', contribution: 'Fixed bugs and implemented API enhancements for MikroTik devices.' },
    { project: 'jQuery-Draggable', link: '#', contribution: 'Fixed drag-and-drop core functionality for a custom use case.' },
  ],

  education: {
    degree: 'Bachelor of Technology in Computer Science',
    institution: 'Vyas College of Engineering',
    location: 'Jodhpur, Rajasthan, India',
    period: 'Aug 2013 – May 2017',
  },

  certifications: [
    { name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', color: '#f59e0b' },
  ],
};
