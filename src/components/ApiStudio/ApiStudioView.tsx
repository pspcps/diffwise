import { useState, useEffect, useMemo, useRef } from 'react';
import YAML from 'yaml';
import { ApiResponseViewer } from './ApiResponseViewer';
import {
  Send,
  Plus,
  FolderPlus,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  Clock,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export type BodyType = 'none' | 'json' | 'graphql' | 'form-data' | 'x-www-form-urlencoded' | 'raw';

export interface ApiRequestItem {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  bodyType: BodyType;
  bodyContent: string;
  authType: 'none' | 'bearer' | 'basic' | 'apikey';
  authBearerToken?: string;
  authBasicUser?: string;
  authBasicPass?: string;
  authApiKeyName?: string;
  authApiKeyValue?: string;
  authApiKeyLocation?: 'header' | 'query';
  useCorsProxy?: boolean;
  graphqlQuery?: string;
  graphqlVariables?: string;
  graphqlOperationName?: string;
}

export interface ApiCollection {
  id: string;
  name: string;
  requests: ApiRequestItem[];
}

export interface ApiResponseData {
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  data: string;
  isJson: boolean;
  parsedJson?: unknown;
}

export interface SwaggerRouteParam {
  name: string;
  in: 'query' | 'header' | 'path' | 'body' | 'formData';
  required?: boolean;
  type?: string;
  schema?: Record<string, unknown>;
  description?: string;
}

export interface SwaggerRoute {
  path: string;
  method: HttpMethod;
  summary?: string;
  description?: string;
  tags: string[];
  operationId?: string;
  parameters?: SwaggerRouteParam[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>;
  };
  responses?: Record<string, {
    description?: string;
    schema?: Record<string, unknown>;
    content?: Record<string, { schema?: Record<string, unknown> }>;
  }>;
}

const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-[#a6e3a1]/15', text: 'text-[#a6e3a1]', border: 'border-[#a6e3a1]/30' },
  POST: { bg: 'bg-[#89b4fa]/15', text: 'text-[#89b4fa]', border: 'border-[#89b4fa]/30' },
  PUT: { bg: 'bg-[#fab387]/15', text: 'text-[#fab387]', border: 'border-[#fab387]/30' },
  PATCH: { bg: 'bg-[#cba6f7]/15', text: 'text-[#cba6f7]', border: 'border-[#cba6f7]/30' },
  DELETE: { bg: 'bg-[#f38ba8]/15', text: 'text-[#f38ba8]', border: 'border-[#f38ba8]/30' },
  HEAD: { bg: 'bg-[#94e2d5]/15', text: 'text-[#94e2d5]', border: 'border-[#94e2d5]/30' },
  OPTIONS: { bg: 'bg-[#f9e2af]/15', text: 'text-[#f9e2af]', border: 'border-[#f9e2af]/30' },
};

const DEFAULT_COLLECTIONS: ApiCollection[] = [
  {
    id: 'col-samples',
    name: 'Sample Public APIs',
    requests: [
      {
        id: 'req-get-users',
        name: 'Get Users List',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users',
        params: [],
        headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
        bodyType: 'none',
        bodyContent: '',
        authType: 'none',
        useCorsProxy: false,
      },
      {
        id: 'req-create-post',
        name: 'Create New Post',
        method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/posts',
        params: [],
        headers: [
          { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
          { id: 'h2', key: 'Accept', value: 'application/json', enabled: true },
        ],
        bodyType: 'json',
        bodyContent: JSON.stringify(
          {
            title: 'Testing with ApiDesk Studio',
            body: 'High-speed client-side API testing made simple!',
            userId: 1,
          },
          null,
          2
        ),
        authType: 'none',
        useCorsProxy: false,
      },
      {
        id: 'req-graphql-countries',
        name: 'GraphQL: Query Countries API',
        method: 'POST',
        url: 'https://countries.trevorblades.com/graphql',
        params: [],
        headers: [
          { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
          { id: 'h2', key: 'Accept', value: 'application/json', enabled: true },
        ],
        bodyType: 'graphql',
        bodyContent: '',
        graphqlQuery: `query GetCountries {\n  countries(filter: { continent: { eq: "EU" } }) {\n    code\n    name\n    capital\n    emoji\n    currency\n  }\n}`,
        graphqlVariables: '{\n}',
        authType: 'none',
        useCorsProxy: true,
      },
      {
        id: 'req-echo-test',
        name: 'HTTPBin Echo Anything',
        method: 'POST',
        url: 'https://httpbin.org/anything',
        params: [{ id: 'p1', key: 'client', value: 'apidesk', enabled: true }],
        headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
        bodyType: 'json',
        bodyContent: JSON.stringify({ message: 'Hello from PSDevTool ApiDesk!' }, null, 2),
        authType: 'none',
        useCorsProxy: true,
      },
    ],
  },
];

const SAMPLE_SWAGGER_URLS = [
  { name: 'Swagger Petstore (OpenAPI 3.0)', url: 'https://petstore.swagger.io/v2/swagger.json' },
  { name: 'HTTPBin Specs', url: 'https://httpbin.org/spec.json' },
];

const DEFAULT_SAMPLE_SWAGGER = {
  swagger: '2.0',
  info: {
    title: 'Swagger Petstore Demo',
    description: 'A sample pet store server for testing ApiDesk Studio routes & conversion.',
    version: '1.0.0',
  },
  host: 'petstore.swagger.io',
  basePath: '/v2',
  schemes: ['https'],
  paths: {
    '/pet/findByStatus': {
      get: {
        tags: ['pet'],
        summary: 'Finds Pets by status',
        description: 'Multiple status values can be provided with comma separated strings',
        operationId: 'findPetsByStatus',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Status values that need to be considered for filter',
            required: true,
            type: 'string',
            default: 'available',
          },
        ],
        responses: {
          '200': { description: 'successful operation' },
          '400': { description: 'Invalid status value' },
        },
      },
    },
    '/pet/{petId}': {
      get: {
        tags: ['pet'],
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        operationId: 'getPetById',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'ID of pet to return',
            required: true,
            type: 'integer',
          },
        ],
        responses: {
          '200': { description: 'successful operation' },
          '404': { description: 'Pet not found' },
        },
      },
      delete: {
        tags: ['pet'],
        summary: 'Deletes a pet',
        description: 'Deletes a pet record',
        operationId: 'deletePet',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'Pet id to delete',
            required: true,
            type: 'integer',
          },
        ],
        responses: {
          '400': { description: 'Invalid ID supplied' },
        },
      },
    },
    '/pet': {
      post: {
        tags: ['pet'],
        summary: 'Add a new pet to the store',
        description: 'Create a new pet object in the database',
        operationId: 'addPet',
        parameters: [
          {
            name: 'body',
            in: 'body',
            description: 'Pet object that needs to be added to the store',
            required: true,
            schema: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string', example: 'doggie' },
                status: { type: 'string', example: 'available' },
              },
            },
          },
        ],
        responses: {
          '405': { description: 'Invalid input' },
        },
      },
    },
    '/store/inventory': {
      get: {
        tags: ['store'],
        summary: 'Returns pet inventories by status',
        description: 'Returns a map of status codes to quantities',
        operationId: 'getInventory',
        responses: {
          '200': { description: 'successful operation' },
        },
      },
    },
  },
};

const STORAGE_KEY = 'psdevtool_apidesk_collections_v1';
const HISTORY_KEY = 'psdevtool_apidesk_history_v1';


export function parseCurlCommand(rawInput: string): Partial<ApiRequestItem> | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  
  // Normalize line continuations and bash ANSI quotes
  const normalized = trimmed
    .split("\n").map(l => l.replace(/\\$/, "").trim()).join(" ")
    .replace(/\$'([\s\S]*?)'/g, "'$1'")
    .trim();
  const isCurl = normalized.toLowerCase().startsWith("curl") || normalized.includes(" -H ") || normalized.includes(" --header ");
  if (!isCurl) return null;

  let method: HttpMethod = "GET";
  let url = "";
  const headers: KeyValuePair[] = [];
  const params: KeyValuePair[] = [];
  let bodyContent = "";
  let bodyType: BodyType = "none";
  let authType: "none" | "bearer" | "basic" | "apikey" = "none";
  let authBearerToken = "";
  let authBasicUser = "";
  let authBasicPass = "";

  // 1. HTTP Method
  const methodMatch = normalized.match(/(?:-X|--request)\s+['"]?([A-Za-z]+)['"]?/i);
  if (methodMatch) {
    const m = methodMatch[1].toUpperCase();
    if (["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(m)) {
      method = m as HttpMethod;
    }
  }

  // 2. URL Extraction
  const urlMatch = normalized.match(/['"](https?:\/\/[^'"]+)['"]/i) ||
                   normalized.match(/(?:^|\s)(https?:\/\/[^\s'"]+)/i);
  if (urlMatch) {
    url = urlMatch[1].trim();
  } else {
    const domainMatch = normalized.match(/['"]?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s'"]*)['"]?/i);
    if (domainMatch) {
      url = "https://" + domainMatch[1].trim();
    }
  }

  // Parse Query Parameters from URL
  if (url.includes("?")) {
    try {
      const qPart = url.substring(url.indexOf("?") + 1);
      const searchParams = new URLSearchParams(qPart);
      searchParams.forEach((val, k) => {
        params.push({
          id: Math.random().toString(36).substring(2, 9),
          key: k,
          value: val,
          enabled: true,
        });
      });
    } catch {}
  }

  // 3. Headers
  const headerRegex = /(?:-H|--header)\s+(?:[']([^']*)[']|["]([^"]*)["]|(\S+))/gi;
  let hMatch;
  while ((hMatch = headerRegex.exec(normalized)) !== null) {
    const rawHeader = hMatch[1] ?? hMatch[2] ?? hMatch[3] ?? "";
    const colonIdx = rawHeader.indexOf(":");
    if (colonIdx > 0) {
      const key = rawHeader.substring(0, colonIdx).trim();
      const value = rawHeader.substring(colonIdx + 1).trim();

      if (key.toLowerCase() === "authorization") {
        if (value.toLowerCase().startsWith("bearer ")) {
          authType = "bearer";
          authBearerToken = value.substring(7).trim();
        } else if (value.toLowerCase().startsWith("basic ")) {
          authType = "basic";
          try {
            const decoded = atob(value.substring(6).trim());
            const [u, p] = decoded.split(":");
            authBasicUser = u || "";
            authBasicPass = p || "";
          } catch {}
        }
      }

      headers.push({
        id: Math.random().toString(36).substring(2, 9),
        key,
        value,
        enabled: true,
      });
    }
  }

  // 4. Basic Auth flag (-u / --user)
  const userMatch = normalized.match(/(?:-u|--user)\s+['"]?([^\x27":\s]+)(?::([^\x27"\s]*))?['"]?/i);
  if (userMatch) {
    authType = "basic";
    authBasicUser = userMatch[1] || "";
    authBasicPass = userMatch[2] || "";
  }

  // 5. Body (-d, --data, --data-raw, --data-binary, --data-ascii, --json)
  const dataRegex = /(?:-d|--data|--data-raw|--data-binary|--data-ascii|--json)\s+(?:[']([\s\S]*?)[']|["]((?:\\.|[^"\\])*)["]|(\S+))/gi;
  let dMatch;
  while ((dMatch = dataRegex.exec(normalized)) !== null) {
    const bodyStr = dMatch[1] ?? dMatch[2] ?? dMatch[3] ?? "";
    bodyContent = bodyStr;
    if (!methodMatch) {
      method = "POST";
    }
  }

  if (bodyContent) {
    try {
      JSON.parse(bodyContent);
      bodyType = "json";
    } catch {
      bodyType = "raw";
    }
  }

  return {
    method,
    url: url || "https://api.example.com",
    headers: headers.length > 0 ? headers : [{ id: "h-def", key: "Accept", value: "application/json", enabled: true }],
    params,
    bodyType,
    bodyContent,
    authType,
    authBearerToken,
    authBasicUser,
    authBasicPass,
  };
}

export default function ApiStudioView() {
  // Top level mode: 'client' (Postman API Client) vs 'swagger' (Swagger / OpenAPI Hub)
  const [studioMode, setStudioMode] = useState<'client' | 'swagger'>('client');

  const [collections, setCollections] = useState<ApiCollection[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_COLLECTIONS;
    } catch {
      return DEFAULT_COLLECTIONS;
    }
  });

  const [history, setHistory] = useState<ApiRequestItem[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Current active request in builder
  const [activeRequest, setActiveRequest] = useState<ApiRequestItem>(() => {
    return collections[0]?.requests[0] || DEFAULT_COLLECTIONS[0].requests[0];
  });

  const [requestTab, setRequestTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'settings'>('params');

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponseData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [curlParsedToast, setCurlParsedToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [curlInput, setCurlInput] = useState('');

  // --- SWAGGER / OPENAPI STATE ---
  const [swaggerUrlInput, setSwaggerUrlInput] = useState('https://petstore.swagger.io/v2/swagger.json');
  const [swaggerRawText, setSwaggerRawText] = useState(() => JSON.stringify(DEFAULT_SAMPLE_SWAGGER, null, 2));
  const [swaggerFormat, setSwaggerFormat] = useState<'json' | 'yaml'>('json');
  const [swaggerLoading, setSwaggerLoading] = useState(false);
  const [swaggerError, setSwaggerError] = useState<string | null>(null);
  const [swaggerRouteFilter, setSwaggerRouteFilter] = useState('');
  const [swaggerMethodFilter, setSwaggerMethodFilter] = useState<'ALL' | HttpMethod>('ALL');
  const [expandedRouteKey, setExpandedRouteKey] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save collections & history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    } catch {
      // storage quota or disabled
    }
  }, [collections]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    } catch {
      // storage quota
    }
  }, [history]);

  const handleCopy = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Fallback needed");
      }
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch {}
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Sync Query params into URL
  const updateUrlWithParams = (params: KeyValuePair[]) => {
    try {
      const currentUrl = activeRequest.url.split('?')[0] || '';
      const activePairs = params.filter(p => p.enabled && p.key.trim().length > 0);
      if (activePairs.length === 0) {
        setActiveRequest(prev => ({ ...prev, url: currentUrl, params }));
      } else {
        const searchParams = new URLSearchParams();
        activePairs.forEach(p => searchParams.append(p.key.trim(), p.value));
        const newUrl = `${currentUrl}?${searchParams.toString()}`;
        setActiveRequest(prev => ({ ...prev, url: newUrl, params }));
      }
    } catch {
      setActiveRequest(prev => ({ ...prev, params }));
    }
  };

  // When user edits URL text directly or pastes a cURL command:
  const handleUrlChange = (newUrl: string) => {
    const trimmed = newUrl.trim();
    if (trimmed.toLowerCase().startsWith("curl") || trimmed.includes(" -H ") || trimmed.includes(" --header ")) {
      const parsed = parseCurlCommand(trimmed);
      if (parsed && parsed.url) {
        setActiveRequest(prev => ({
          ...prev,
          method: parsed.method || prev.method,
          url: parsed.url || prev.url,
          headers: parsed.headers && parsed.headers.length ? parsed.headers : prev.headers,
          params: parsed.params || prev.params,
          bodyType: parsed.bodyType || prev.bodyType,
          bodyContent: parsed.bodyContent !== undefined ? parsed.bodyContent : prev.bodyContent,
          authType: parsed.authType || prev.authType,
          authBearerToken: parsed.authBearerToken || prev.authBearerToken,
          authBasicUser: parsed.authBasicUser || prev.authBasicUser,
          authBasicPass: parsed.authBasicPass || prev.authBasicPass,
        }));
        setCurlParsedToast(`Auto-parsed cURL: ${parsed.method || "GET"} ${parsed.url}`);
        setTimeout(() => setCurlParsedToast(null), 3500);
        return;
      }
    }

    try {
      if (newUrl.includes("?")) {
        const queryPart = newUrl.substring(newUrl.indexOf("?") + 1);
        const searchParams = new URLSearchParams(queryPart);
        const newParams: KeyValuePair[] = [];
        searchParams.forEach((value, key) => {
          newParams.push({
            id: Math.random().toString(36).substring(2, 9),
            key,
            value,
            enabled: true,
          });
        });
        setActiveRequest(prev => ({ ...prev, url: newUrl, params: newParams }));
      } else {
        setActiveRequest(prev => ({ ...prev, url: newUrl }));
      }
    } catch {
      setActiveRequest(prev => ({ ...prev, url: newUrl }));
    }
  };

  // Execute Request in API Client
  const handleSend = async () => {
    if (!activeRequest.url.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage(null);
    setResponse(null);

    const startTime = performance.now();

    try {
      let targetUrl = activeRequest.url.trim();

      // Append query params if any
      const activeParams = activeRequest.params.filter(p => p.enabled && p.key.trim());
      if (activeParams.length > 0 && !targetUrl.includes('?')) {
        const qs = new URLSearchParams();
        activeParams.forEach(p => qs.append(p.key.trim(), p.value));
        targetUrl += `?${qs.toString()}`;
      }

      // If CORS proxy enabled, wrap URL
      if (activeRequest.useCorsProxy) {
        targetUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;
      }

      // Build Headers
      const headersInit: Record<string, string> = {};
      activeRequest.headers
        .filter(h => h.enabled && h.key.trim())
        .forEach(h => {
          headersInit[h.key.trim()] = h.value;
        });

      // Auth Headers
      if (activeRequest.authType === 'bearer' && activeRequest.authBearerToken) {
        headersInit['Authorization'] = `Bearer ${activeRequest.authBearerToken.trim()}`;
      } else if (activeRequest.authType === 'basic' && activeRequest.authBasicUser) {
        const credentials = btoa(`${activeRequest.authBasicUser}:${activeRequest.authBasicPass || ''}`);
        headersInit['Authorization'] = `Basic ${credentials}`;
      } else if (
        activeRequest.authType === 'apikey' &&
        activeRequest.authApiKeyName &&
        activeRequest.authApiKeyValue &&
        activeRequest.authApiKeyLocation === 'header'
      ) {
        headersInit[activeRequest.authApiKeyName.trim()] = activeRequest.authApiKeyValue;
      }

      // Build Body
      let requestBody: BodyInit | undefined = undefined;
      if (activeRequest.bodyType === 'graphql') {
        let varsObj = {};
        try {
          if (activeRequest.graphqlVariables?.trim()) {
            varsObj = JSON.parse(activeRequest.graphqlVariables);
          }
        } catch {}
        const payload = {
          query: activeRequest.graphqlQuery || '',
          variables: Object.keys(varsObj).length > 0 ? varsObj : undefined,
          operationName: activeRequest.graphqlOperationName?.trim() || undefined,
        };
        requestBody = JSON.stringify(payload);
        if (!headersInit['Content-Type']) {
          headersInit['Content-Type'] = 'application/json';
        }
      } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(activeRequest.method)) {
        if (activeRequest.bodyType === 'json' && activeRequest.bodyContent.trim()) {
          requestBody = activeRequest.bodyContent;
          if (!headersInit['Content-Type']) {
            headersInit['Content-Type'] = 'application/json';
          }
        } else if (activeRequest.bodyType === 'raw' && activeRequest.bodyContent) {
          requestBody = activeRequest.bodyContent;
        }
      }

      const res = await fetch(targetUrl, {
        method: activeRequest.method,
        headers: headersInit,
        body: requestBody,
        signal: controller.signal,
      });

      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      const textData = await res.text();
      const sizeBytes = new Blob([textData]).size;

      let parsedJson: unknown = undefined;
      let isJson = false;

      try {
        parsedJson = JSON.parse(textData);
        isJson = true;
      } catch {
        isJson = false;
      }

      const responseObj: ApiResponseData = {
        status: res.status,
        statusText: res.statusText,
        timeMs,
        sizeBytes,
        headers: resHeaders,
        data: textData,
        isJson,
        parsedJson,
      };

      setResponse(responseObj);

      // Add to history
      setHistory(prev => [activeRequest, ...prev.filter(h => h.id !== activeRequest.id)].slice(0, 30));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMessage('Request aborted by user.');
      } else {
        const msg = err instanceof Error ? err.message : 'Network request failed';
        setErrorMessage(
          `${msg}. Note: If testing external APIs without CORS headers, enable "Use CORS Proxy" in Settings tab!`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  // Generate cURL Command
  const generateCurlCommand = (req: ApiRequestItem): string => {
    const parts = ['curl', '-X', req.method];

    // Headers
    req.headers
      .filter(h => h.enabled && h.key.trim())
      .forEach(h => {
        parts.push('-H', `'${h.key.trim()}: ${h.value}'`);
      });

    // Auth
    if (req.authType === 'bearer' && req.authBearerToken) {
      parts.push('-H', `'Authorization: Bearer ${req.authBearerToken.trim()}'`);
    } else if (req.authType === 'basic' && req.authBasicUser) {
      parts.push('-u', `'${req.authBasicUser}:${req.authBasicPass || ''}'`);
    }

    // Body
    if (req.bodyType === 'graphql' && req.graphqlQuery) {
      let varsObj = {};
      try {
        if (req.graphqlVariables?.trim()) varsObj = JSON.parse(req.graphqlVariables);
      } catch {}
      const payload = { query: req.graphqlQuery, variables: varsObj };
      parts.push('-H', "'Content-Type: application/json'");
      parts.push('-d', `'${JSON.stringify(payload).replace(/'/g, "\\'")}'`);
    } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.bodyContent.trim()) {
      parts.push('-d', `'${req.bodyContent.replace(/'/g, "\\'")}'`);
    }

    parts.push(`'${req.url}'`);
    return parts.join(' ');
  };

  // Import cURL
  const handleParseCurl = () => {
    if (!curlInput.trim()) return;

    try {
      const curl = curlInput.trim();
      let method: HttpMethod = 'GET';
      let url = '';
      const headers: KeyValuePair[] = [];
      let body = '';

      const methodMatch = curl.match(/-X\s+([A-Z]+)/i) || curl.match(/--request\s+([A-Z]+)/i);
      if (methodMatch) {
        method = methodMatch[1].toUpperCase() as HttpMethod;
      }

      const urlMatch = curl.match(/['"](https?:\/\/[^'"]+)['"]/i) || curl.match(/\s(https?:\/\/[^\s]+)/i);
      if (urlMatch) {
        url = urlMatch[1];
      }

      const headerMatches = curl.matchAll(/(?:-H|--header)\s+['"]([^'"]+)['"]/gi);
      for (const match of headerMatches) {
        const headerStr = match[1];
        const splitIdx = headerStr.indexOf(':');
        if (splitIdx > 0) {
          const key = headerStr.substring(0, splitIdx).trim();
          const value = headerStr.substring(splitIdx + 1).trim();
          headers.push({
            id: Math.random().toString(36).substring(2, 9),
            key,
            value,
            enabled: true,
          });
        }
      }

      const dataMatch = curl.match(/(?:-d|--data|--data-raw)\s+['"]([\s\S]*?)['"](?:\s|$)/i);
      if (dataMatch) {
        body = dataMatch[1];
        if (!methodMatch) method = 'POST';
      }

      const newReq: ApiRequestItem = {
        id: `req-curl-${Date.now()}`,
        name: `Imported cURL (${method})`,
        method,
        url: url || 'https://api.example.com',
        params: [],
        headers,
        bodyType: body ? 'json' : 'none',
        bodyContent: body,
        authType: 'none',
        useCorsProxy: false,
      };

      setActiveRequest(newReq);
      setShowCurlModal(false);
      setCurlInput('');
      setStudioMode('client');
    } catch {
      alert('Could not parse cURL string. Please check format.');
    }
  };

  // Add / Save Request
  const handleSaveToCollection = (collectionId: string) => {
    setCollections(prev =>
      prev.map(c => {
        if (c.id === collectionId) {
          const exists = c.requests.some(r => r.id === activeRequest.id);
          const updated = exists
            ? c.requests.map(r => (r.id === activeRequest.id ? activeRequest : r))
            : [...c.requests, activeRequest];
          return { ...c, requests: updated };
        }
        return c;
      })
    );
  };

  const handleCreateNewRequest = () => {
    const newReq: ApiRequestItem = {
      id: `req-${Date.now()}`,
      name: 'Untitled Request',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [],
      headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
      bodyType: 'none',
      bodyContent: '',
      authType: 'none',
      useCorsProxy: false,
    };
    setActiveRequest(newReq);
    setStudioMode('client');
  };

  const handleCreateCollection = () => {
    const name = prompt('Enter new Collection name:');
    if (!name || !name.trim()) return;
    const newCol: ApiCollection = {
      id: `col-${Date.now()}`,
      name: name.trim(),
      requests: [],
    };
    setCollections(prev => [...prev, newCol]);
  };

  const handleDeleteRequest = (reqId: string) => {
    setCollections(prev =>
      prev.map(c => ({
        ...c,
        requests: c.requests.filter(r => r.id !== reqId),
      }))
    );
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(activeRequest.bodyContent);
      setActiveRequest(prev => ({
        ...prev,
        bodyContent: JSON.stringify(parsed, null, 2),
      }));
    } catch {
      // invalid json
    }
  };

  // --- SWAGGER / OPENAPI LOGIC ---
  // Parse current Swagger text (JSON or YAML) into an object
  const parsedSwagger = useMemo(() => {
    if (!swaggerRawText.trim()) return null;
    try {
      // Try JSON first
      const trimmed = swaggerRawText.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return { data: JSON.parse(trimmed), format: 'json' as const, error: null };
      }
      // Try YAML
      const yData = YAML.parse(trimmed);
      if (yData && typeof yData === 'object') {
        return { data: yData, format: 'yaml' as const, error: null };
      }
      return { data: null, format: 'json' as const, error: 'Could not parse document as JSON or YAML' };
    } catch (err: unknown) {
      return { data: null, format: 'json' as const, error: err instanceof Error ? err.message : 'Invalid format' };
    }
  }, [swaggerRawText]);

  // Extract Routes from parsed Swagger
  const swaggerRoutesInfo = useMemo(() => {
    if (!parsedSwagger?.data || typeof parsedSwagger.data !== 'object') {
      return { title: 'No Spec Loaded', version: '', description: '', baseUrl: '', routes: [] as SwaggerRoute[] };
    }
    const spec = parsedSwagger.data as Record<string, unknown>;
    const info = (spec.info as Record<string, string>) || {};
    const title = info.title || 'OpenAPI Specification';
    const version = info.version || '1.0.0';
    const description = info.description || '';

    let baseUrl = '';
    if (Array.isArray(spec.servers) && spec.servers.length > 0 && spec.servers[0]?.url) {
      baseUrl = String(spec.servers[0].url);
    } else if (spec.host) {
      const schemes = Array.isArray(spec.schemes) && spec.schemes.length ? spec.schemes[0] : 'https';
      baseUrl = `${schemes}://${spec.host}${spec.basePath || ''}`;
    }

    const routes: SwaggerRoute[] = [];
    const paths = (spec.paths as Record<string, Record<string, unknown>>) || {};

    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

    for (const [pathKey, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      const commonParams = Array.isArray(pathItem.parameters) ? (pathItem.parameters as SwaggerRouteParam[]) : [];

      for (const m of httpMethods) {
        const op = pathItem[m] as Record<string, unknown> | undefined;
        if (op && typeof op === 'object') {
          const opParams = Array.isArray(op.parameters) ? (op.parameters as SwaggerRouteParam[]) : [];
          routes.push({
            path: pathKey,
            method: m.toUpperCase() as HttpMethod,
            summary: typeof op.summary === 'string' ? op.summary : '',
            description: typeof op.description === 'string' ? op.description : '',
            tags: Array.isArray(op.tags) && op.tags.length ? op.tags.map(String) : ['default'],
            operationId: typeof op.operationId === 'string' ? op.operationId : '',
            parameters: [...commonParams, ...opParams],
            requestBody: op.requestBody as SwaggerRoute['requestBody'],
            responses: op.responses as SwaggerRoute['responses'],
          });
        }
      }
    }

    return { title, version, description, baseUrl, routes };
  }, [parsedSwagger]);

  // Filter routes by search and method
  const filteredSwaggerRoutes = useMemo(() => {
    return swaggerRoutesInfo.routes.filter(r => {
      const matchMethod = swaggerMethodFilter === 'ALL' || r.method === swaggerMethodFilter;
      const q = swaggerRouteFilter.toLowerCase();
      const matchQuery =
        !q ||
        r.path.toLowerCase().includes(q) ||
        (r.summary && r.summary.toLowerCase().includes(q)) ||
        r.tags.some(t => t.toLowerCase().includes(q));
      return matchMethod && matchQuery;
    });
  }, [swaggerRoutesInfo.routes, swaggerRouteFilter, swaggerMethodFilter]);

  // Group routes by tags
  const routesByTag = useMemo(() => {
    const map: Record<string, SwaggerRoute[]> = {};
    filteredSwaggerRoutes.forEach(r => {
      const tag = r.tags[0] || 'default';
      if (!map[tag]) map[tag] = [];
      map[tag].push(r);
    });
    return map;
  }, [filteredSwaggerRoutes]);

  // Fetch Swagger Spec from URL
  const handleFetchSwaggerUrl = async (urlToFetch?: string) => {
    const target = urlToFetch || swaggerUrlInput.trim();
    if (!target) return;

    setSwaggerLoading(true);
    setSwaggerError(null);

    try {
      let fetchUrl = target;
      // Try direct fetch first
      let res: Response;
      try {
        res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch {
        // Fallback to CORS proxy
        fetchUrl = `https://corsproxy.io/?url=${encodeURIComponent(target)}`;
        res = await fetch(fetchUrl);
      }

      const text = await res.text();
      setSwaggerRawText(text);

      // detect format
      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        setSwaggerFormat('json');
      } else {
        setSwaggerFormat('yaml');
      }
    } catch (err: unknown) {
      setSwaggerError(
        `Failed to fetch Swagger spec: ${err instanceof Error ? err.message : 'Network error'}. You can also download the file and use "Upload File".`
      );
    } finally {
      setSwaggerLoading(false);
    }
  };

  // Handle Swagger File Upload (.json, .yaml, .yml)
  const handleSwaggerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setSwaggerRawText(content);
        if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          setSwaggerFormat('yaml');
        } else {
          setSwaggerFormat('json');
        }
        setSwaggerError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Convert Swagger between JSON and YAML
  const handleConvertSwagger = (targetFormat: 'json' | 'yaml') => {
    if (!parsedSwagger?.data) return;
    try {
      if (targetFormat === 'json') {
        const jsonStr = JSON.stringify(parsedSwagger.data, null, 2);
        setSwaggerRawText(jsonStr);
        setSwaggerFormat('json');
      } else {
        const yamlStr = YAML.stringify(parsedSwagger.data);
        setSwaggerRawText(yamlStr);
        setSwaggerFormat('yaml');
      }
      setSwaggerError(null);
    } catch (err: unknown) {
      setSwaggerError(`Conversion error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  // Download Swagger Spec
  const handleDownloadSwagger = () => {
    const blob = new Blob([swaggerRawText], {
      type: swaggerFormat === 'json' ? 'application/json' : 'text/yaml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swagger_spec.${swaggerFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // "Send in API Client": load route into Postman client
  const handleLoadRouteInClient = (route: SwaggerRoute) => {
    const base = swaggerRoutesInfo.baseUrl || 'https://api.example.com';
    let fullUrl = `${base.replace(/\/$/, '')}/${route.path.replace(/^\//, '')}`;

    const headers: KeyValuePair[] = [
      { id: 'h1', key: 'Accept', value: 'application/json', enabled: true },
    ];

    const params: KeyValuePair[] = [];

    // Extract query & path params
    if (route.parameters) {
      route.parameters.forEach(p => {
        if (p.in === 'query') {
          params.push({
            id: Math.random().toString(36).substring(2, 9),
            key: p.name,
            value: p.type === 'integer' ? '1' : 'test',
            enabled: p.required || false,
            description: p.description,
          });
        } else if (p.in === 'path') {
          // Replace {param} in path with dummy value
          fullUrl = fullUrl.replace(`{${p.name}}`, '1');
        } else if (p.in === 'header') {
          headers.push({
            id: Math.random().toString(36).substring(2, 9),
            key: p.name,
            value: '',
            enabled: p.required || false,
            description: p.description,
          });
        }
      });
    }

    // Sample body
    let bodyContent = '';
    let bodyType: BodyType = 'none';

    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      bodyType = 'json';
      headers.push({ id: 'h-ct', key: 'Content-Type', value: 'application/json', enabled: true });

      // Check requestBody or body parameter
      const bodyParam = route.parameters?.find(p => p.in === 'body');
      if (bodyParam?.schema) {
        bodyContent = JSON.stringify({ sample: 'value' }, null, 2);
      } else {
        bodyContent = JSON.stringify({ key: 'value' }, null, 2);
      }
    }

    const newReq: ApiRequestItem = {
      id: `req-swg-${Date.now()}`,
      name: route.summary || `${route.method} ${route.path}`,
      method: route.method,
      url: fullUrl,
      params,
      headers,
      bodyType,
      bodyContent,
      authType: 'none',
      useCorsProxy: true,
    };

    setActiveRequest(newReq);
    setStudioMode('client');
  };

  // Import all Swagger routes as a new Collection in API Client
  const handleImportAllRoutesToCollection = () => {
    if (swaggerRoutesInfo.routes.length === 0) return;

    const base = swaggerRoutesInfo.baseUrl || 'https://api.example.com';
    const newRequests: ApiRequestItem[] = swaggerRoutesInfo.routes.map((route, idx) => {
      let fullUrl = `${base.replace(/\/$/, '')}/${route.path.replace(/^\//, '')}`;
      if (route.parameters) {
        route.parameters.forEach(p => {
          if (p.in === 'path') fullUrl = fullUrl.replace(`{${p.name}}`, '1');
        });
      }

      return {
        id: `req-imp-${idx}-${Date.now()}`,
        name: route.summary || `${route.method} ${route.path}`,
        method: route.method,
        url: fullUrl,
        params: (route.parameters || [])
          .filter(p => p.in === 'query')
          .map(p => ({
            id: Math.random().toString(36).substring(2, 9),
            key: p.name,
            value: '',
            enabled: p.required || false,
          })),
        headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
        bodyType: ['POST', 'PUT', 'PATCH'].includes(route.method) ? 'json' : 'none',
        bodyContent: ['POST', 'PUT', 'PATCH'].includes(route.method) ? '{\n  "test": true\n}' : '',
        authType: 'none',
        useCorsProxy: true,
      };
    });

    const newCollection: ApiCollection = {
      id: `col-swg-${Date.now()}`,
      name: `${swaggerRoutesInfo.title} (${newRequests.length} endpoints)`,
      requests: newRequests,
    };

    setCollections(prev => [...prev, newCollection]);
    if (newRequests[0]) {
      setActiveRequest(newRequests[0]);
    }
    setStudioMode('client');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181825] text-[#cdd6f4] overflow-hidden">
      {/* Top Header: Title & Studio Mode Switcher */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1e2e] border-b border-[#313244] gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-[#a6e3a1]/10 text-[#a6e3a1] border border-[#a6e3a1]/20">
            <Send size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#cdd6f4]">ApiDesk Studio</h2>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#89b4fa]/15 text-[#89b4fa] font-semibold border border-[#89b4fa]/30">
                Postman &amp; Swagger Hub
              </span>
            </div>
            <p className="text-[11px] text-[#9399b2]">
              {studioMode === 'client'
                ? 'Send API requests, test endpoints, inspect latency & headers, and organize collections'
                : 'Inspect all Swagger/OpenAPI routes, convert between JSON and YAML, and test in client'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle: API Client vs Swagger Explorer */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-[#11111b] border border-[#313244] p-1">
            <button
              onClick={() => setStudioMode('client')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                studioMode === 'client'
                  ? 'bg-[#89b4fa] text-[#11111b] shadow-sm'
                  : 'text-[#9399b2] hover:text-[#cdd6f4]'
              }`}
            >
              <Send size={13} />
              <span>API Client (Postman)</span>
            </button>

            <button
              onClick={() => setStudioMode('swagger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                studioMode === 'swagger'
                  ? 'bg-[#cba6f7] text-[#11111b] shadow-sm'
                  : 'text-[#9399b2] hover:text-[#cdd6f4]'
              }`}
            >
              <BookOpen size={13} />
              <span>Swagger &amp; OpenAPI Hub</span>
            </button>
          </div>

          {studioMode === 'client' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowCurlModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-xs font-medium text-[#cdd6f4] border border-[#45475a] transition-all"
                title="Import cURL command"
              >
                <Upload size={13} className="text-[#89b4fa]" />
                <span className="hidden sm:inline">Import cURL</span>
              </button>

              <button
                onClick={() => handleCopy(generateCurlCommand(activeRequest), 'curl')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-xs font-medium text-[#cdd6f4] border border-[#45475a] transition-all"
                title="Copy as cURL"
              >
                {copiedKey === 'curl' ? <Check size={13} className="text-[#a6e3a1]" /> : <Copy size={13} />}
                <span className="hidden sm:inline">Copy cURL</span>
              </button>

              <button
                onClick={handleCreateNewRequest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] text-xs font-bold transition-all shadow-md"
              >
                <Plus size={14} />
                <span>New</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. API CLIENT MODE (Postman Request Runner & Collections)     */}
      {/* ============================================================== */}
      {studioMode === 'client' && (
        <div className="flex-1 flex min-h-0 divide-x divide-[#313244] overflow-hidden">
          {/* Left Sidebar: Collections & Requests */}
          <div className="w-64 bg-[#11111b] flex flex-col shrink-0 min-h-0 overflow-hidden">
            <div className="p-3 border-b border-[#313244] flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9399b2] flex items-center gap-1.5">
                <Layers size={13} className="text-[#89b4fa]" />
                <span>Collections</span>
              </span>
              <button
                onClick={handleCreateCollection}
                className="p-1 rounded hover:bg-[#313244] text-[#89b4fa]"
                title="Create Collection"
              >
                <FolderPlus size={15} />
              </button>
            </div>

            {/* Search collections */}
            <div className="p-2 border-b border-[#252535]">
              <div className="flex items-center px-2 py-1 bg-[#181825] rounded-lg border border-[#313244]">
                <Search size={12} className="text-[#6c7086] mr-1.5" />
                <input
                  type="text"
                  placeholder="Filter requests..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-[#cdd6f4] placeholder-[#585b70] focus:outline-none"
                />
              </div>
            </div>

            {/* Collections List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {collections.map(col => {
                const filteredRequests = col.requests.filter(
                  r =>
                    !searchFilter.trim() ||
                    r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    r.url.toLowerCase().includes(searchFilter.toLowerCase())
                );

                return (
                  <div key={col.id} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#cdd6f4] uppercase tracking-wider group">
                      <span className="truncate">{col.name}</span>
                      <button
                        onClick={() => handleSaveToCollection(col.id)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-[#89b4fa] hover:underline"
                        title="Save current request here"
                      >
                        + Save Here
                      </button>
                    </div>

                    <div className="space-y-0.5">
                      {filteredRequests.map(req => {
                        const isActive = activeRequest.id === req.id;
                        const mColor = METHOD_COLORS[req.method];

                        return (
                          <div
                            key={req.id}
                            onClick={() => setActiveRequest(req)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs group transition-colors ${
                              isActive ? 'bg-[#89b4fa]/15 text-[#cdd6f4]' : 'hover:bg-[#181825] text-[#9399b2]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${mColor.bg} ${mColor.text} ${mColor.border}`}
                              >
                                {req.method}
                              </span>
                              <span className="truncate text-xs text-[#cdd6f4] font-medium">{req.name}</span>
                            </div>

                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteRequest(req.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-[#f38ba8] hover:text-[#f38ba8]/80 p-0.5"
                              title="Delete request"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* History Section */}
              {history.length > 0 && (
                <div className="pt-3 border-t border-[#252535] space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#6c7086] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> Recent History
                    </span>
                    <button
                      onClick={() => setHistory([])}
                      className="text-[10px] text-[#f38ba8] hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {history.slice(0, 8).map((req, idx) => {
                      const mColor = METHOD_COLORS[req.method];
                      return (
                        <div
                          key={`hist-${idx}`}
                          onClick={() => setActiveRequest(req)}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-lg cursor-pointer text-xs hover:bg-[#181825] text-[#9399b2] truncate"
                        >
                          <span
                            className={`text-[9px] font-bold font-mono px-1 py-0.2 rounded border ${mColor.bg} ${mColor.text} ${mColor.border}`}
                          >
                            {req.method}
                          </span>
                          <span className="truncate text-[11px] font-mono">{req.url}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Panel: Request Builder (Top) + Response Viewer (Bottom) */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Request Name & URL Row */}
            <div className="p-4 bg-[#1e1e2e]/50 border-b border-[#313244] space-y-3 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={activeRequest.name}
                  onChange={e => setActiveRequest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Request Name (e.g. Get User Profile)"
                  className="bg-transparent text-sm font-bold text-[#cdd6f4] placeholder-[#585b70] focus:outline-none border-b border-transparent focus:border-[#89b4fa] pb-0.5"
                />

                <div className="flex items-center gap-2 text-xs">
                  {collections[0] && (
                    <button
                      onClick={() => handleSaveToCollection(collections[0].id)}
                      className="px-2.5 py-1 rounded bg-[#313244] hover:bg-[#45475a] text-[#89b4fa] font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
              </div>

              {/* URL bar with Method selector */}
              <div className="flex items-center gap-2">
                <select
                  value={activeRequest.method}
                  onChange={e =>
                    setActiveRequest(prev => ({ ...prev, method: e.target.value as HttpMethod }))
                  }
                  className={`px-3 py-2 rounded-xl font-bold font-mono text-xs border focus:outline-none cursor-pointer ${
                    METHOD_COLORS[activeRequest.method].bg
                  } ${METHOD_COLORS[activeRequest.method].text} ${
                    METHOD_COLORS[activeRequest.method].border
                  }`}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="HEAD">HEAD</option>
                  <option value="OPTIONS">OPTIONS</option>
                </select>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={activeRequest.url}
                  onChange={e => handleUrlChange(e.target.value)}
                  onPaste={e => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted && (pasted.trim().toLowerCase().startsWith("curl") || pasted.includes(" -H ") || pasted.includes(" --header "))) {
                      e.preventDefault();
                      handleUrlChange(pasted);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Paste URL or full cURL command (e.g. curl -X POST https://api... -H ... -d ...)"
                  className="w-full px-3 py-2 bg-[#11111b] border border-[#313244] rounded-xl font-mono text-xs text-[#cdd6f4] placeholder-[#585b70] focus:outline-none focus:border-[#89b4fa]"
                />
                {curlParsedToast && (
                  <div className="absolute top-full left-0 mt-1 z-20 px-2.5 py-1 bg-[#a6e3a1]/20 border border-[#a6e3a1]/40 rounded-lg text-[11px] font-bold text-[#a6e3a1] shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <Check size={12} />
                    <span>{curlParsedToast}</span>
                  </div>
                )}
              </div>

                {isLoading ? (
                  <button
                    onClick={handleCancelRequest}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#f38ba8] hover:bg-[#f38ba8]/80 text-[#11111b] font-bold text-xs transition-all shadow-md shrink-0"
                  >
                    <RotateCcw size={14} className="animate-spin" />
                    <span>Cancel</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] font-bold text-xs transition-all shadow-md shrink-0"
                  >
                    <Send size={14} />
                    <span>Send</span>
                  </button>
                )}
              </div>
            </div>

            {/* Request Sub-Tabs */}
            <div className="border-b border-[#313244] bg-[#181825] px-4 pt-2 shrink-0">
              <div className="flex gap-4 text-xs font-medium">
                {[
                  { id: 'params', label: `Params (${activeRequest.params.filter(p => p.enabled).length})` },
                  { id: 'headers', label: `Headers (${activeRequest.headers.filter(h => h.enabled).length})` },
                  { id: 'body', label: `Body ${activeRequest.bodyType !== 'none' ? '●' : ''}` },
                  { id: 'auth', label: `Auth ${activeRequest.authType !== 'none' ? '●' : ''}` },
                  { id: 'settings', label: 'Settings' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRequestTab(tab.id as typeof requestTab)}
                    className={`pb-2.5 px-1 relative transition-colors ${
                      requestTab === tab.id ? 'text-[#89b4fa] font-bold' : 'text-[#6c7086] hover:text-[#cdd6f4]'
                    }`}
                  >
                    {tab.label}
                    {requestTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#89b4fa] rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Tab Contents */}
            <div className="p-4 bg-[#181825] border-b border-[#313244] max-h-60 overflow-y-auto shrink-0">
              {/* PARAMS TAB */}
              {requestTab === 'params' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#9399b2] mb-1">
                    <span>Query Parameters</span>
                    <button
                      onClick={() => {
                        const newP: KeyValuePair = {
                          id: Math.random().toString(36).substring(2, 9),
                          key: '',
                          value: '',
                          enabled: true,
                        };
                        updateUrlWithParams([...activeRequest.params, newP]);
                      }}
                      className="flex items-center gap-1 text-[11px] text-[#89b4fa] hover:underline"
                    >
                      <Plus size={12} /> Add Parameter
                    </button>
                  </div>

                  {activeRequest.params.length === 0 ? (
                    <p className="text-xs text-[#6c7086] italic py-2">
                      No query parameters. Click &quot;Add Parameter&quot; to append key-value pairs to the URL.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeRequest.params.map((param, pIdx) => (
                        <div key={param.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={param.enabled}
                            onChange={e => {
                              const updated = [...activeRequest.params];
                              updated[pIdx].enabled = e.target.checked;
                              updateUrlWithParams(updated);
                            }}
                            className="rounded border-[#313244] text-[#89b4fa] focus:ring-0"
                          />
                          <input
                            type="text"
                            placeholder="Key"
                            value={param.key}
                            onChange={e => {
                              const updated = [...activeRequest.params];
                              updated[pIdx].key = e.target.value;
                              updateUrlWithParams(updated);
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg text-xs font-mono text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={param.value}
                            onChange={e => {
                              const updated = [...activeRequest.params];
                              updated[pIdx].value = e.target.value;
                              updateUrlWithParams(updated);
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg text-xs font-mono text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                          />
                          <button
                            onClick={() => {
                              const updated = activeRequest.params.filter((_, idx) => idx !== pIdx);
                              updateUrlWithParams(updated);
                            }}
                            className="p-1 text-[#6c7086] hover:text-[#f38ba8]"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* HEADERS TAB */}
              {requestTab === 'headers' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#9399b2] mb-1">
                    <span>HTTP Request Headers</span>
                    <button
                      onClick={() => {
                        const newH: KeyValuePair = {
                          id: Math.random().toString(36).substring(2, 9),
                          key: '',
                          value: '',
                          enabled: true,
                        };
                        setActiveRequest(prev => ({ ...prev, headers: [...prev.headers, newH] }));
                      }}
                      className="flex items-center gap-1 text-[11px] text-[#89b4fa] hover:underline"
                    >
                      <Plus size={12} /> Add Header
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {activeRequest.headers.map((header, hIdx) => (
                      <div key={header.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={e => {
                            const updated = [...activeRequest.headers];
                            updated[hIdx].enabled = e.target.checked;
                            setActiveRequest(prev => ({ ...prev, headers: updated }));
                          }}
                          className="rounded border-[#313244] text-[#89b4fa] focus:ring-0"
                        />
                        <input
                          type="text"
                          placeholder="Header (e.g. Content-Type)"
                          value={header.key}
                          onChange={e => {
                            const updated = [...activeRequest.headers];
                            updated[hIdx].key = e.target.value;
                            setActiveRequest(prev => ({ ...prev, headers: updated }));
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg text-xs font-mono text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. application/json)"
                          value={header.value}
                          onChange={e => {
                            const updated = [...activeRequest.headers];
                            updated[hIdx].value = e.target.value;
                            setActiveRequest(prev => ({ ...prev, headers: updated }));
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg text-xs font-mono text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                        />
                        <button
                          onClick={() => {
                            const updated = activeRequest.headers.filter((_, idx) => idx !== hIdx);
                            setActiveRequest(prev => ({ ...prev, headers: updated }));
                          }}
                          className="p-1 text-[#6c7086] hover:text-[#f38ba8]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BODY TAB */}
              {requestTab === 'body' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      {(['none', 'json', 'raw'] as BodyType[]).map(type => (
                        <label key={type} className="flex items-center gap-1.5 cursor-pointer text-[#cdd6f4]">
                          <input
                            type="radio"
                            name="bodyType"
                            value={type}
                            checked={activeRequest.bodyType === type}
                            onChange={() => setActiveRequest(prev => ({ ...prev, bodyType: type }))}
                            className="text-[#89b4fa]"
                          />
                          <span className="capitalize">{type}</span>
                        </label>
                      ))}
                    </div>

                    {activeRequest.bodyType === 'json' && (
                      <button
                        onClick={handleFormatJson}
                        className="flex items-center gap-1 text-[11px] text-[#89b4fa] hover:underline"
                      >
                        <Sparkles size={12} /> Format JSON
                      </button>
                    )}
                  </div>

                  {activeRequest.bodyType !== 'none' && (
                    <textarea
                      value={activeRequest.bodyContent}
                      onChange={e => setActiveRequest(prev => ({ ...prev, bodyContent: e.target.value }))}
                      placeholder={'{\n  "key": "value"\n}'}
                      className="w-full h-32 p-3 bg-[#11111b] border border-[#313244] rounded-xl font-mono text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa] resize-none"
                    />
                  )}
                </div>
              )}

              {/* AUTH TAB */}
              {requestTab === 'auth' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs">
                    <label className="text-[#9399b2]">Auth Type:</label>
                    <select
                      value={activeRequest.authType}
                      onChange={e =>
                        setActiveRequest(prev => ({
                          ...prev,
                          authType: e.target.value as ApiRequestItem['authType'],
                        }))
                      }
                      className="px-2.5 py-1 bg-[#11111b] border border-[#313244] rounded-lg text-xs text-[#cdd6f4] focus:outline-none"
                    >
                      <option value="none">No Auth</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="basic">Basic Auth</option>
                      <option value="apikey">API Key</option>
                    </select>
                  </div>

                  {activeRequest.authType === 'bearer' && (
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#9399b2]">Bearer Token:</label>
                      <input
                        type="text"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={activeRequest.authBearerToken || ''}
                        onChange={e =>
                          setActiveRequest(prev => ({ ...prev, authBearerToken: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg font-mono text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                      />
                    </div>
                  )}

                  {activeRequest.authType === 'basic' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9399b2]">Username:</label>
                        <input
                          type="text"
                          value={activeRequest.authBasicUser || ''}
                          onChange={e =>
                            setActiveRequest(prev => ({ ...prev, authBasicUser: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg font-mono text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9399b2]">Password:</label>
                        <input
                          type="password"
                          value={activeRequest.authBasicPass || ''}
                          onChange={e =>
                            setActiveRequest(prev => ({ ...prev, authBasicPass: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg font-mono text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                        />
                      </div>
                    </div>
                  )}

                  {activeRequest.authType === 'apikey' && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9399b2]">Key Name:</label>
                        <input
                          type="text"
                          placeholder="X-API-Key"
                          value={activeRequest.authApiKeyName || ''}
                          onChange={e =>
                            setActiveRequest(prev => ({ ...prev, authApiKeyName: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg font-mono text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9399b2]">Key Value:</label>
                        <input
                          type="text"
                          placeholder="secret_key_123"
                          value={activeRequest.authApiKeyValue || ''}
                          onChange={e =>
                            setActiveRequest(prev => ({ ...prev, authApiKeyValue: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg font-mono text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#9399b2]">Add To:</label>
                        <select
                          value={activeRequest.authApiKeyLocation || 'header'}
                          onChange={e =>
                            setActiveRequest(prev => ({
                              ...prev,
                              authApiKeyLocation: e.target.value as 'header' | 'query',
                            }))
                          }
                          className="w-full px-3 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg text-xs text-[#cdd6f4] focus:outline-none"
                        >
                          <option value="header">Header</option>
                          <option value="query">Query Params</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {requestTab === 'settings' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={activeRequest.useCorsProxy || false}
                      onChange={e =>
                        setActiveRequest(prev => ({ ...prev, useCorsProxy: e.target.checked }))
                      }
                      className="rounded border-[#313244] text-[#89b4fa] focus:ring-0"
                    />
                    <div>
                      <span className="font-bold text-[#cdd6f4]">Use Browser CORS Proxy</span>
                      <p className="text-[11px] text-[#9399b2]">
                        Bypasses browser &quot;CORS Missing Allow Origin&quot; restrictions when testing third-party APIs
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* RESPONSE SECTION */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#11111b]">
              {/* Response Top Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#313244] bg-[#181825] gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#cdd6f4]">Response</span>

                  {response && (
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold ${
                          response.status < 300
                            ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
                            : response.status < 400
                            ? 'bg-[#89b4fa]/20 text-[#89b4fa]'
                            : response.status < 500
                            ? 'bg-[#fab387]/20 text-[#fab387]'
                            : 'bg-[#f38ba8]/20 text-[#f38ba8]'
                        }`}
                      >
                        {response.status} {response.statusText}
                      </span>

                      <span className="text-[11px] text-[#9399b2] flex items-center gap-1 font-mono">
                        <Clock size={11} /> {response.timeMs} ms
                      </span>

                      <span className="text-[11px] text-[#9399b2] font-mono">
                        {(response.sizeBytes / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  )}
                </div>

                {response && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#a6e3a1] font-medium bg-[#a6e3a1]/10 px-2 py-0.5 rounded border border-[#a6e3a1]/20">
                      Response Received
                    </span>
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-[#f38ba8]/10 border-b border-[#f38ba8]/30 text-xs text-[#f38ba8] flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    onClick={() => setActiveRequest(prev => ({ ...prev, useCorsProxy: true }))}
                    className="px-2 py-0.5 rounded bg-[#f38ba8]/20 font-bold hover:underline"
                  >
                    Enable CORS Proxy
                  </button>
                </div>
              )}

              {/* Response Content Body */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {!response && !isLoading && !errorMessage && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1e1e2e] border border-[#313244] flex items-center justify-center text-[#89b4fa]">
                      <Send size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#cdd6f4]">Enter URL and click Send</h3>
                      <p className="text-xs text-[#6c7086] max-w-sm mt-1">
                        Choose any HTTP method, add headers, params, authentication or body, and execute queries directly in your browser.
                      </p>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <RotateCcw size={28} className="animate-spin text-[#89b4fa]" />
                    <p className="text-xs text-[#9399b2]">Waiting for response from {activeRequest.url}...</p>
                  </div>
                )}

                {response && (
                  <ApiResponseViewer response={response} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SWAGGER & OPENAPI HUB (URL Fetch, File Upload, Routes View) */}
      {/* ============================================================== */}
      {studioMode === 'swagger' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Top Swagger Action Bar: URL Input + Upload + Format Converter */}
          <div className="p-4 bg-[#1e1e2e] border-b border-[#313244] space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-[#cdd6f4]">Swagger &amp; OpenAPI Spec Explorer</h3>
                <p className="text-[11px] text-[#9399b2]">
                  Paste a Swagger URL, upload a JSON/YAML file, explore all routes, and test them directly in the API client
                </p>
              </div>

              {/* Conversion Buttons (Swagger to JSON / YAML) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-[#11111b] border border-[#313244] p-0.5">
                  <button
                    onClick={() => handleConvertSwagger('json')}
                    disabled={swaggerFormat === 'json'}
                    className={`px-2.5 py-1 text-xs rounded font-medium ${
                      swaggerFormat === 'json' ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold' : 'text-[#9399b2] hover:text-[#cdd6f4]'
                    }`}
                  >
                    Format as JSON
                  </button>
                  <button
                    onClick={() => handleConvertSwagger('yaml')}
                    disabled={swaggerFormat === 'yaml'}
                    className={`px-2.5 py-1 text-xs rounded font-medium ${
                      swaggerFormat === 'yaml' ? 'bg-[#cba6f7]/20 text-[#cba6f7] font-bold' : 'text-[#9399b2] hover:text-[#cdd6f4]'
                    }`}
                  >
                    Format as YAML
                  </button>
                </div>

                <button
                  onClick={() => handleCopy(swaggerRawText, 'swagger-raw')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-xs font-medium text-[#cdd6f4]"
                  title="Copy full specification"
                >
                  {copiedKey === 'swagger-raw' ? <Check size={12} className="text-[#a6e3a1]" /> : <Copy size={12} />}
                  <span>Copy</span>
                </button>

                <button
                  onClick={handleDownloadSwagger}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-xs font-medium text-[#cdd6f4]"
                  title="Download specification file"
                >
                  <Download size={12} />
                  <span>Download .{swaggerFormat}</span>
                </button>

                {swaggerRoutesInfo.routes.length > 0 && (
                  <button
                    onClick={handleImportAllRoutesToCollection}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#89b4fa] text-[#11111b] text-xs font-bold hover:bg-[#b4befe] shadow-sm"
                  >
                    <FolderPlus size={13} />
                    <span>Import All to Collection</span>
                  </button>
                )}
              </div>
            </div>

            {/* URL Input Bar & File Upload */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                placeholder="Enter Swagger / OpenAPI JSON or YAML URL (e.g. https://petstore.swagger.io/v2/swagger.json)"
                value={swaggerUrlInput}
                onChange={e => setSwaggerUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleFetchSwaggerUrl();
                }}
                className="flex-1 px-3 py-2 bg-[#11111b] border border-[#313244] rounded-xl font-mono text-xs text-[#cdd6f4] placeholder-[#585b70] focus:outline-none focus:border-[#cba6f7]"
              />

              <button
                onClick={() => handleFetchSwaggerUrl()}
                disabled={swaggerLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#cba6f7] hover:bg-[#cba6f7]/80 text-[#11111b] font-bold text-xs transition-all shadow-md shrink-0 disabled:opacity-50"
              >
                {swaggerLoading ? <RotateCcw size={13} className="animate-spin" /> : <ExternalLink size={13} />}
                <span>Fetch Spec</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#313244] hover:bg-[#45475a] text-[#cdd6f4] font-medium text-xs border border-[#45475a] shrink-0"
              >
                <Upload size={13} className="text-[#89b4fa]" />
                <span>Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleSwaggerFileUpload}
                className="hidden"
              />
            </div>

            {/* Sample URLs quick select */}
            <div className="flex items-center gap-2 text-xs text-[#9399b2] flex-wrap">
              <span>Samples:</span>
              {SAMPLE_SWAGGER_URLS.map(s => (
                <button
                  key={s.name}
                  onClick={() => {
                    setSwaggerUrlInput(s.url);
                    handleFetchSwaggerUrl(s.url);
                  }}
                  className="px-2 py-0.5 rounded bg-[#181825] hover:bg-[#313244] text-[11px] text-[#89b4fa] border border-[#313244]"
                >
                  {s.name}
                </button>
              ))}
            </div>

            {swaggerError && (
              <div className="p-3 bg-[#f38ba8]/10 border border-[#f38ba8]/30 rounded-xl text-xs text-[#f38ba8]">
                {swaggerError}
              </div>
            )}
          </div>

          {/* Swagger Meta Info & Route Filters */}
          <div className="p-4 bg-[#181825] border-b border-[#313244] flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#cdd6f4]">{swaggerRoutesInfo.title}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#313244] font-mono text-[#89b4fa]">
                  v{swaggerRoutesInfo.version}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#a6e3a1]/15 text-[#a6e3a1] font-mono">
                  {swaggerRoutesInfo.routes.length} total endpoints
                </span>
              </div>
              {swaggerRoutesInfo.description && (
                <p className="text-xs text-[#9399b2] mt-0.5 max-w-2xl">{swaggerRoutesInfo.description}</p>
              )}
            </div>

            {/* Method filter & search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-lg bg-[#11111b] border border-[#313244] p-0.5 text-xs font-mono font-bold">
                {(['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setSwaggerMethodFilter(m)}
                    className={`px-2 py-1 rounded ${
                      swaggerMethodFilter === m
                        ? 'bg-[#cba6f7] text-[#11111b]'
                        : 'text-[#9399b2] hover:text-[#cdd6f4]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="flex items-center px-2.5 py-1.5 bg-[#11111b] border border-[#313244] rounded-lg">
                <Search size={13} className="text-[#6c7086] mr-1.5" />
                <input
                  type="text"
                  placeholder="Filter routes (/pet, order)..."
                  value={swaggerRouteFilter}
                  onChange={e => setSwaggerRouteFilter(e.target.value)}
                  className="bg-transparent text-xs text-[#cdd6f4] placeholder-[#585b70] focus:outline-none w-44"
                />
              </div>
            </div>
          </div>

          {/* Swagger Routes List grouped by tags */}
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {Object.keys(routesByTag).length === 0 ? (
              <div className="p-12 text-center text-xs text-[#6c7086]">
                No routes matching your criteria. Try changing method or filter.
              </div>
            ) : (
              Object.entries(routesByTag).map(([tag, routes]) => (
                <div key={tag} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9399b2]">
                    <span className="text-[#cba6f7]">{tag}</span>
                    <span className="text-[10px] text-[#6c7086]">({routes.length} routes)</span>
                    <div className="flex-1 h-px bg-[#313244]" />
                  </div>

                  <div className="space-y-2">
                    {routes.map(route => {
                      const routeKey = `${route.method}-${route.path}`;
                      const isExpanded = expandedRouteKey === routeKey;
                      const mColor = METHOD_COLORS[route.method];

                      return (
                        <div
                          key={routeKey}
                          className="bg-[#1e1e2e] border border-[#313244] rounded-xl overflow-hidden transition-all hover:border-[#45475a]"
                        >
                          {/* Route Row Header */}
                          <div
                            onClick={() => setExpandedRouteKey(isExpanded ? null : routeKey)}
                            className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`px-2.5 py-1 rounded-lg font-bold font-mono text-xs border ${mColor.bg} ${mColor.text} ${mColor.border}`}
                              >
                                {route.method}
                              </span>
                              <span className="font-mono text-xs text-[#cdd6f4] font-semibold truncate">
                                {route.path}
                              </span>
                              {route.summary && (
                                <span className="text-xs text-[#9399b2] truncate hidden md:inline">
                                  — {route.summary}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleLoadRouteInClient(route);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#89b4fa]/15 hover:bg-[#89b4fa]/25 text-[#89b4fa] border border-[#89b4fa]/30 text-xs font-bold transition-all"
                                title="Open and test in API Client"
                              >
                                <span>Try in Client</span>
                                <ArrowRight size={12} />
                              </button>

                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCopy(
                                    `${swaggerRoutesInfo.baseUrl || ''}${route.path}`,
                                    `swg-url-${routeKey}`
                                  );
                                }}
                                className="p-1 rounded text-[#6c7086] hover:text-[#cdd6f4]"
                                title="Copy endpoint URL"
                              >
                                {copiedKey === `swg-url-${routeKey}` ? (
                                  <Check size={13} className="text-[#a6e3a1]" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>

                              <span className="text-[#6c7086]">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Details: Parameters, Request Body, Responses */}
                          {isExpanded && (
                            <div className="p-4 bg-[#181825] border-t border-[#313244] space-y-4 text-xs font-mono">
                              {route.description && (
                                <p className="text-[#9399b2] font-sans">{route.description}</p>
                              )}

                              {/* Parameters Table */}
                              {route.parameters && route.parameters.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="text-[11px] font-bold text-[#89b4fa] uppercase tracking-wider font-sans">
                                    Parameters ({route.parameters.length})
                                  </div>
                                  <div className="border border-[#313244] rounded-lg overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-[#11111b] border-b border-[#313244] text-[#9399b2]">
                                        <tr>
                                          <th className="px-3 py-1.5 font-sans">Name</th>
                                          <th className="px-3 py-1.5 font-sans">In</th>
                                          <th className="px-3 py-1.5 font-sans">Type</th>
                                          <th className="px-3 py-1.5 font-sans">Required</th>
                                          <th className="px-3 py-1.5 font-sans">Description</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#313244]">
                                        {route.parameters.map((p, pIdx) => (
                                          <tr key={pIdx} className="hover:bg-[#1e1e2e]">
                                            <td className="px-3 py-1.5 font-bold text-[#cdd6f4]">
                                              {p.name}
                                            </td>
                                            <td className="px-3 py-1.5 text-[#cba6f7]">{p.in}</td>
                                            <td className="px-3 py-1.5 text-[#fab387]">
                                              {p.type || (p.schema?.type as string) || 'string'}
                                            </td>
                                            <td className="px-3 py-1.5">
                                              {p.required ? (
                                                <span className="text-[#f38ba8] font-bold">Yes</span>
                                              ) : (
                                                <span className="text-[#6c7086]">No</span>
                                              )}
                                            </td>
                                            <td className="px-3 py-1.5 text-[#9399b2] font-sans">
                                              {p.description || '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Responses Table */}
                              {route.responses && (
                                <div className="space-y-1.5">
                                  <div className="text-[11px] font-bold text-[#a6e3a1] uppercase tracking-wider font-sans">
                                    Responses
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {Object.entries(route.responses).map(([statusCode, resp]) => (
                                      <div
                                        key={statusCode}
                                        className="px-2.5 py-1 rounded bg-[#11111b] border border-[#313244] flex items-center gap-2"
                                      >
                                        <span
                                          className={`font-bold ${
                                            statusCode.startsWith('2')
                                              ? 'text-[#a6e3a1]'
                                              : statusCode.startsWith('4')
                                              ? 'text-[#fab387]'
                                              : 'text-[#f38ba8]'
                                          }`}
                                        >
                                          {statusCode}
                                        </span>
                                        <span className="text-[#9399b2] font-sans">
                                          {resp.description || 'Response'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Import cURL Modal */}
      {showCurlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1e1e2e] border border-[#313244] rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#cdd6f4]">Import cURL Command</h3>
              <button onClick={() => setShowCurlModal(false)} className="text-[#6c7086] hover:text-[#cdd6f4]">
                ✕
              </button>
            </div>

            <textarea
              value={curlInput}
              onChange={e => setCurlInput(e.target.value)}
              placeholder="curl -X POST https://api.example.com/v1/users -H 'Content-Type: application/json' -d '{...}'"
              className="w-full h-36 p-3 bg-[#11111b] border border-[#313244] rounded-xl font-mono text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa] resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCurlModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#9399b2] hover:bg-[#313244]"
              >
                Cancel
              </button>
              <button
                onClick={handleParseCurl}
                className="px-4 py-1.5 rounded-lg bg-[#89b4fa] text-[#11111b] font-bold text-xs hover:bg-[#b4befe]"
              >
                Import &amp; Load Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
