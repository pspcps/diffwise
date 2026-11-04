import type { DetectedLanguage, LayerType, ParsedLogData, StackFrame } from './types';

// Deterministic layer detection based on naming conventions
function detectLayer(name: string, filePath: string): LayerType {
  const lower = (name + ' ' + filePath).toLowerCase();
  if (lower.includes('controller') || lower.includes('handler') || lower.includes('endpoint') || lower.includes('resource') || lower.includes('router') || lower.includes('route')) {
    return 'controller';
  }
  if (lower.includes('service') || lower.includes('manager') || lower.includes('workflow') || lower.includes('orchestrat') || lower.includes('usecase')) {
    return 'service';
  }
  if (lower.includes('accessor') || lower.includes('client') || lower.includes('http') || lower.includes('rest') || lower.includes('api') || lower.includes('fetch') || lower.includes('gateway') || lower.includes('connector')) {
    return 'accessor';
  }
  if (lower.includes('repository') || lower.includes('dao') || lower.includes('database') || lower.includes('db') || lower.includes('sql') || lower.includes('entity') || lower.includes('dbcontext')) {
    return 'repository';
  }
  if (lower.includes('middleware') || lower.includes('filter') || lower.includes('interceptor') || lower.includes('pipe') || lower.includes('guard')) {
    return 'middleware';
  }
  if (lower.includes('system.') || lower.includes('microsoft.') || lower.includes('node:') || lower.includes('java.lang') || lower.includes('org.springframework') || lower.includes('runtime')) {
    return 'system';
  }
  return 'unknown';
}

// Determines if a frame is user application code vs third-party/runtime library
function isApplicationCode(className: string, filePath: string): boolean {
  if (filePath && (filePath.includes('/src/') || filePath.includes('\\src\\') || filePath.includes('/app/') || filePath.includes('\\app\\') || filePath.includes('/Users/') || filePath.includes('/home/') || filePath.includes('C:\\'))) {
    return true;
  }
  const lower = (className + ' ' + filePath).toLowerCase();
  const thirdPartyPrefixes = [
    'system.', 'microsoft.', 'newrelic', 'datadog', 'serilog',
    'org.springframework', 'java.', 'javax.', 'sun.', 'kotlin.',
    'node:internal', 'node_modules', 'webpack', 'express', 'django', 'flask',
    'fastapi', 'starlette', 'goroutine', 'runtime.'
  ];
  for (const prefix of thirdPartyPrefixes) {
    if (lower.startsWith(prefix) || lower.includes('/node_modules/') || lower.includes('\\node_modules\\')) {
      return false;
    }
  }
  return true;
}

// Robust JSON repair for incomplete or broken JSON
export function repairJsonString(input: string): { parsed: Record<string, unknown> | null; isRepaired: boolean } {
  const trimmed = input.trim();
  
  // 1. Try standard JSON.parse first
  try {
    const direct = JSON.parse(trimmed);
    if (typeof direct === 'object' && direct !== null) {
      return { parsed: direct, isRepaired: false };
    }
  } catch {
    // proceed to repair
  }

  // 2. Extract JSON if wrapped in log prefix like [2026-11-04 08:07:47] ERROR: { ... }
  const firstBrace = trimmed.indexOf('{');
  if (firstBrace !== -1) {
    let candidate = trimmed.slice(firstBrace);
    
    // Check if trailing junk or unclosed
    const lastBrace = candidate.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace > 0) {
      candidate = candidate.slice(0, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === 'object' && parsed !== null) {
        return { parsed, isRepaired: true };
      }
    } catch {
      // Continue repair heuristics
    }

    // Heuristic repairs:
    // a) Fix unescaped newlines inside strings
    let sanitized = candidate
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '  ');
    
    // b) Replace unescaped literal newlines inside quotes
    sanitized = sanitized.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (_match, group) => {
      return '"' + group.replace(/\n/g, '\\n') + '"';
    });

    // c) Remove trailing commas: ,} or ,]
    sanitized = sanitized.replace(/,\s*([}\]])/g, '$1');

    // d) If closing brace is missing because it was truncated
    let openBraces = 0;
    let inQuotes = false;
    let escape = false;

    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      if (char === '\\' && !escape) {
        escape = true;
        continue;
      }
      if (char === '"' && !escape) {
        inQuotes = !inQuotes;
      }
      if (!inQuotes) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
      }
      escape = false;
    }

    if (inQuotes) {
      sanitized += '"';
    }
    while (openBraces > 0) {
      sanitized += '}';
      openBraces--;
    }

    try {
      const repaired = JSON.parse(sanitized);
      if (typeof repaired === 'object' && repaired !== null) {
        return { parsed: repaired, isRepaired: true };
      }
    } catch {
      // fallback to regex extraction
    }
  }

  return { parsed: null, isRepaired: false };
}

// Regex fallback for broken or partial JSON when JSON.parse cannot recover it
function extractFieldsWithRegex(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Extract stacktrace
  const stackMatch = text.match(/"(?:exception_stacktrace|stacktrace|stack_trace|stack|trace)"\s*:\s*"((?:[^"\\]|\\.)*)"/s) ||
                     text.match(/(?:exception_stacktrace|stacktrace|stack):\s*([^\n\r]+(?:\n\s*at[^\n\r]+)+)/s);
  if (stackMatch) {
    result.exception_stacktrace = stackMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
  }

  // Extract exception_type
  const typeMatch = text.match(/"(?:exception_type|error_type|exception|error)"\s*:\s*"([^"]+)"/i);
  if (typeMatch) result.exception_type = typeMatch[1];

  // Extract method
  const methodMatch = text.match(/"(?:exception_method|method|action)"\s*:\s*"([^"]+)"/i);
  if (methodMatch) result.exception_method = methodMatch[1];

  // Extract level
  const levelMatch = text.match(/"(?:level|severity|log_level)"\s*:\s*"([^"]+)"/i);
  if (levelMatch) result.level = levelMatch[1];

  // Extract logger
  const loggerMatch = text.match(/"(?:logger|source|caller|service)"\s*:\s*"([^"]+)"/i);
  if (loggerMatch) result.logger = loggerMatch[1];

  // Extract date / timestamp
  const dateMatch = text.match(/"(?:date|timestamp|time|@timestamp)"\s*:\s*"([^"]+)"/i);
  if (dateMatch) result.date = dateMatch[1];

  // Extract context variables like "ctx_user": "...", "ctx_company": 1129
  const ctxMatches = text.matchAll(/"(ctx_[a-zA-Z0-9_]+)"\s*:\s*("([^"]+)"|(\d+)|true|false|null)/g);
  for (const m of ctxMatches) {
    const key = m[1];
    const val = m[3] ?? m[4] ?? m[2];
    result[key] = isNaN(Number(val)) ? val : Number(val);
  }

  return result;
}

// Detect language and runtime environment
export function detectLanguage(text: string, parsedObj?: Record<string, unknown> | null): DetectedLanguage {
  const combined = (text + ' ' + (parsedObj?.exception_type ?? '') + ' ' + (parsedObj?.exception_stacktrace ?? '')).toLowerCase();

  if (combined.includes('in /users/') && combined.includes('.cs:line') || combined.includes('.cs:line') || combined.includes('void movenext()') || combined.includes('system.private.') || combined.includes('nopermissionexception') || combined.includes('nullreferenceexception')) {
    return 'csharp';
  }
  if (combined.includes('.java:') || combined.includes('caused by:') || combined.includes('nullpointerexception') || combined.includes('spring') || combined.includes('org.springframework')) {
    return 'java';
  }
  if (combined.includes('traceback (most recent call last):') || combined.includes('file "') && combined.includes('", line ') || combined.includes('keyerror:') || combined.includes('valueerror:')) {
    return 'python';
  }
  if (combined.includes('node:internal/') || combined.includes('typeerror: cannot read properties') || combined.includes('at object.') || combined.includes('.js:') || combined.includes('.ts:')) {
    return 'javascript';
  }
  if (combined.includes('goroutine ') || combined.includes('.go:') && combined.includes('+0x') || combined.includes('panic:')) {
    return 'go';
  }
  if (combined.includes('panicked at') || combined.includes('.rs:')) {
    return 'rust';
  }
  if (combined.includes('#0 ') && combined.includes('.php(') || combined.includes('fatal error: uncaught')) {
    return 'php';
  }
  return 'csharp'; // Default fallback when looking at .NET style traces
}

// Parse .NET C# stack traces
function parseDotNetTrace(stackText: string): StackFrame[] {
  const lines = stackText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const frames: StackFrame[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // e.g. "at Enterprise.Payments.Accessors.PaymentAccessor.AuthorizeCharge() in /src/Accessors/PaymentAccessor.cs:line 48"
    // or   "at Enterprise.Payments.Gateway.HttpClient.HandleErrorResponse(HttpResponseMessage response)"
    const matchWithFile = line.match(/^at\s+(.+?)\s+in\s+(.+?):line\s+(\d+)$/i);
    const matchSimple = line.match(/^at\s+(.+)$/i);

    let fullCall = '';
    let filePath = '';
    let lineNumber: number | null = null;

    if (matchWithFile) {
      fullCall = matchWithFile[1].trim();
      filePath = matchWithFile[2].trim();
      lineNumber = parseInt(matchWithFile[3], 10);
    } else if (matchSimple) {
      fullCall = matchSimple[1].trim();
    } else {
      continue;
    }

    // Split method signature and namespace
    let method = fullCall;
    let classOrNamespace = '';
    let args = '';

    const parenIdx = fullCall.indexOf('(');
    if (parenIdx !== -1) {
      args = fullCall.slice(parenIdx);
      const withoutArgs = fullCall.slice(0, parenIdx);
      const lastDot = withoutArgs.lastIndexOf('.');
      if (lastDot !== -1) {
        classOrNamespace = withoutArgs.slice(0, lastDot);
        method = withoutArgs.slice(lastDot + 1) + args;
      }
    }

    const fileName = filePath ? filePath.split(/[/\\]/).pop() || '' : '';
    const isApp = isApplicationCode(classOrNamespace || fullCall, filePath);
    const layer = detectLayer(classOrNamespace + '.' + method, filePath);

    frames.push({
      id: `frame-${i}`,
      index: i,
      raw: line,
      method,
      classOrNamespace,
      moduleOrPackage: classOrNamespace.split('.').slice(0, 3).join('.'),
      filePath,
      fileName,
      lineNumber,
      columnNumber: null,
      isAppCode: isApp,
      layer,
      isCrashSite: i === 0,
      arguments: args,
    });
  }

  return frames;
}

// Parse Java Stack Traces
function parseJavaTrace(stackText: string): StackFrame[] {
  const lines = stackText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const frames: StackFrame[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // at com.example.service.UserService.getUser(UserService.java:45)
    // or at com.example.service.UserService.getUser(Native Method)
    const match = line.match(/^at\s+([a-zA-Z0-9_$.]+)\.([a-zA-Z0-9_$<>]+)\(([^)]+)\)$/);
    if (match) {
      const classOrNamespace = match[1];
      const methodName = match[2];
      const location = match[3];

      let fileName = '';
      let lineNumber: number | null = null;

      if (location.includes(':')) {
        const [fn, ln] = location.split(':');
        fileName = fn;
        lineNumber = parseInt(ln, 10);
      } else {
        fileName = location;
      }

      const isApp = !classOrNamespace.startsWith('java.') &&
                    !classOrNamespace.startsWith('javax.') &&
                    !classOrNamespace.startsWith('org.springframework.') &&
                    !classOrNamespace.startsWith('sun.');

      frames.push({
        id: `frame-${i}`,
        index: i,
        raw: line,
        method: methodName,
        classOrNamespace,
        moduleOrPackage: classOrNamespace.split('.').slice(0, 3).join('.'),
        filePath: fileName,
        fileName,
        lineNumber,
        columnNumber: null,
        isAppCode: isApp,
        layer: detectLayer(classOrNamespace, fileName),
        isCrashSite: i === 0,
      });
    }
  }

  return frames;
}

// Parse Python Traceback
function parsePythonTrace(stackText: string): StackFrame[] {
  const lines = stackText.split(/\r?\n/);
  const frames: StackFrame[] = [];

  // Python stack traces are ordered chronologically: entrypoint first, crash site at bottom
  let frameIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // File "/app/src/services/order.py", line 42, in process_order
    const match = line.match(/File "([^"]+)", line (\d+), in (.+)$/);
    if (match) {
      const filePath = match[1];
      const lineNumber = parseInt(match[2], 10);
      const method = match[3];
      const fileName = filePath.split('/').pop() || '';
      const isApp = !filePath.includes('site-packages') && !filePath.includes('lib/python');

      frames.push({
        id: `frame-${frameIdx}`,
        index: frameIdx,
        raw: line,
        method,
        classOrNamespace: fileName.replace(/\.py$/, ''),
        moduleOrPackage: filePath.split('/').slice(-3, -1).join('.'),
        filePath,
        fileName,
        lineNumber,
        columnNumber: null,
        isAppCode: isApp,
        layer: detectLayer(method, filePath),
        isCrashSite: false, // will update below
      });
      frameIdx++;
    }
  }

  // In Python, last frame is the crash site
  if (frames.length > 0) {
    frames[frames.length - 1].isCrashSite = true;
  }

  return frames;
}

// Parse JavaScript / TypeScript V8 traces
function parseJsTrace(stackText: string): StackFrame[] {
  const lines = stackText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const frames: StackFrame[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // at Context.test (/Users/.../test.ts:45:12) or at /Users/.../index.js:12:3
    const match = line.match(/^at\s+(?:([^\s(]+)\s+\()?(?:file:\/\/\/?)?([^\s)]+):(\d+):(\d+)\)?$/);
    if (match) {
      const method = match[1] || 'anonymous';
      const filePath = match[2];
      const lineNumber = parseInt(match[3], 10);
      const columnNumber = parseInt(match[4], 10);
      const fileName = filePath.split(/[/\\]/).pop() || '';
      const isApp = !filePath.includes('node_modules') && !filePath.includes('node:internal');

      frames.push({
        id: `frame-${i}`,
        index: i,
        raw: line,
        method,
        classOrNamespace: method.includes('.') ? method.split('.').slice(0, -1).join('.') : '',
        moduleOrPackage: '',
        filePath,
        fileName,
        lineNumber,
        columnNumber,
        isAppCode: isApp,
        layer: detectLayer(method, filePath),
        isCrashSite: i === 0,
      });
    }
  }

  return frames;
}

// Generic fallback stack parser
function parseGenericTrace(stackText: string): StackFrame[] {
  const lines = stackText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const frames: StackFrame[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('at ') || line.includes(':line ') || line.includes('.cs') || line.includes('.java') || line.includes('.py')) {
      frames.push({
        id: `frame-${i}`,
        index: i,
        raw: line,
        method: line.replace(/^at\s+/, '').split('(')[0].split(' in ')[0],
        classOrNamespace: '',
        moduleOrPackage: '',
        filePath: '',
        fileName: '',
        lineNumber: null,
        columnNumber: null,
        isAppCode: true,
        layer: 'unknown',
        isCrashSite: i === 0,
      });
    }
  }

  return frames;
}

// Deterministic rule-based root cause analysis (100% pure algorithm, NO AI)
function analyzeRootCause(
  exceptionType: string,
  frames: StackFrame[],
  context: Record<string, unknown>,
  exceptionMessage?: string
): ParsedLogData['rootCause'] {
  const cleanType = exceptionType || 'UnknownException';
  const lowerType = cleanType.toLowerCase();
  const lowerMsg = (exceptionMessage || '').toLowerCase();

  // Find crash site and deepest application frame
  const crashFrame = frames.find(f => f.isCrashSite) || frames[0];
  const appFrame = frames.find(f => f.isAppCode && f.lineNumber !== null) || frames.find(f => f.isAppCode);

  const fileAndLine = appFrame?.fileName && appFrame?.lineNumber
    ? `${appFrame.fileName}:line ${appFrame.lineNumber}`
    : crashFrame?.fileName && crashFrame?.lineNumber
    ? `${crashFrame.fileName}:line ${crashFrame.lineNumber}`
    : 'System stack';

  const culpritLayer = (appFrame?.layer && appFrame.layer !== 'unknown' ? appFrame.layer : crashFrame?.layer) || 'accessor';

  // Rule 1: NoPermissionException / Unauthorized / Forbidden
  if (lowerType.includes('nopermission') || lowerType.includes('unauthorized') || lowerType.includes('forbidden') || lowerType.includes('securityexception') || lowerType.includes('accessdenied')) {
    const user = context.ctx_user || context.ctx_user_id || context.userId ? String(context.ctx_user || context.ctx_user_id || context.userId) : 'caller/subject';
    const tenant = context.ctx_tenant_id || context.ctx_company || context.tenantId ? String(context.ctx_tenant_id || context.ctx_company || context.tenantId) : 'tenant context';
    const methodRef = appFrame?.method ? `${appFrame.classOrNamespace ? appFrame.classOrNamespace + '.' : ''}${appFrame.method}` : (crashFrame?.method || 'AuthorizationService.Authorize');
    return {
      title: `Authorization Failure: ${cleanType}`,
      description: `The request was rejected due to insufficient permissions or invalid authorization credentials while invoking a downstream service endpoint.`,
      culpritLayer: `${culpritLayer.toUpperCase()} Layer (${methodRef})`,
      fileAndLine,
      probableCauses: [
        `Downstream service returned HTTP 403 (Forbidden) or HTTP 401 (Unauthorized).`,
        `Subject [${user}] does not have the required role or permission scope in tenant [${tenant}].`,
        `Expired, invalid, or missing Bearer token / SecurityContext in client request pipeline.`,
        `Tenant scoping or audience mismatch between the requested resource and caller token.`
      ],
      actionableFixes: [
        `Verify that subject '${user}' has valid active role bindings for tenant '${tenant}' in the authorization policy store.`,
        `Inspect downstream HTTP error response to verify the exact status code (401 Unauthorized vs 403 Forbidden) and response body.`,
        `Verify that the security context passed into '${methodRef}' contains a non-expired authorization header.`,
        `Check if the downstream service requires specific OAuth scopes or claims that are missing.`
      ]
    };
  }

  // Rule 2: NullReference / NullPointer
  if (lowerType.includes('nullreference') || lowerType.includes('nullpointer') || lowerType.includes('typeerror') || lowerMsg.includes('null') || lowerMsg.includes('undefined')) {
    return {
      title: `Null Reference Dereference: ${cleanType}`,
      description: `An attempt was made to access a member or property on an object that evaluated to null or undefined.`,
      culpritLayer: culpritLayer.toUpperCase(),
      fileAndLine,
      probableCauses: [
        `An accessor or database query returned null instead of an expected model/response.`,
        `A required parameter or configuration value was missing or uninitialized.`,
        `Deserialization failed to populate an expected property on the returned JSON object.`
      ],
      actionableFixes: [
        `Add null-coalescing ('??') or optional chaining ('?.') before accessing properties at ${fileAndLine}.`,
        `Verify that preceding database or API calls return an actual instance before invoking methods on it.`,
        `Enable C# nullable reference types ('<Nullable>enable</Nullable>') or strict null checks.`
      ]
    };
  }

  // Rule 3: Database / SQL / Redshift / Mongo exceptions
  if (lowerType.includes('sql') || lowerType.includes('db') || lowerType.includes('npgsql') || lowerType.includes('mongo') || lowerType.includes('postgres') || lowerType.includes('redshift') || lowerMsg.includes('relation') || lowerMsg.includes('connection')) {
    return {
      title: `Database Error: ${cleanType}`,
      description: `A database query or connection failure occurred while executing an operation in the storage layer.`,
      culpritLayer: 'DATABASE / REPOSITORY',
      fileAndLine,
      probableCauses: [
        `Database connection timed out or pool was exhausted.`,
        `Query syntax error, missing table/relation, or column schema mismatch.`,
        `Deadlock or lock acquisition timeout under concurrent transaction load.`
      ],
      actionableFixes: [
        `Check database connection string, firewall rules, and VPC security groups.`,
        `Inspect parameter values passed to the query to ensure they meet constraints and data types.`,
        `Verify database schema migrations have executed in the active environment.`
      ]
    };
  }

  // Rule 4: Timeout / Socket / Network
  if (lowerType.includes('timeout') || lowerType.includes('socket') || lowerType.includes('webexception') || lowerType.includes('httprequestexception') || lowerMsg.includes('timed out')) {
    return {
      title: `Network or Upstream Timeout: ${cleanType}`,
      description: `An outgoing HTTP or socket connection timed out before receiving a response from the downstream service.`,
      culpritLayer: 'NETWORKING / HTTP CLIENT',
      fileAndLine,
      probableCauses: [
        `Downstream service is experiencing high latency, cold starts, or is unavailable.`,
        `Configured client timeout (e.g. 5000ms) is too aggressive for the downstream payload size.`,
        `Network routing or DNS resolution failure.`
      ],
      actionableFixes: [
        `Check downstream service health metrics and endpoint latency dashboards.`,
        `Implement exponential backoff retry policy using Polly or equivalent resilience library.`,
        `Increase HTTP client timeout or optimize query execution on the downstream system.`
      ]
    };
  }

  // Default deterministic diagnosis
  return {
    title: `Unhandled Exception: ${cleanType}`,
    description: `System encountered an unexpected exception in ${culpritLayer} layer.`,
    culpritLayer: culpritLayer.toUpperCase(),
    fileAndLine,
    probableCauses: [
      `Exception was thrown at '${crashFrame?.method || 'stack origin'}' and propagated unhandled up the call chain.`,
      `Input state or environment condition was outside expected operating parameters.`,
      `Check logs surrounding this timestamp for preceding warning messages.`
    ],
    actionableFixes: [
      `Set a breakpoint or inspect input parameters at ${fileAndLine}.`,
      `Wrap the invocation in a try/catch block with explicit logging of error response payloads.`,
      `Verify dependencies and network reachability for downstream services.`
    ]
  };
}

// Master Parser Function
export function parseErrorLog(rawInput: string): ParsedLogData {
  const trimmed = rawInput.trim();
  let format: ParsedLogData['format'] = 'plain_log';
  let parsedObj: Record<string, unknown> | null = null;

  // 1. Check if JSON or repairable JSON
  if (trimmed.startsWith('{') || trimmed.includes('"exception_stacktrace"') || trimmed.includes('"level"')) {
    const { parsed, isRepaired } = repairJsonString(trimmed);
    if (parsed) {
      parsedObj = parsed;
      format = isRepaired ? 'repaired_json' : 'json';
    } else {
      // Regex extraction fallback
      const extracted = extractFieldsWithRegex(trimmed);
      if (Object.keys(extracted).length > 0) {
        parsedObj = extracted;
        format = 'repaired_json';
      }
    }
  }

  // 2. Extract fields from parsedObj or raw text
  let stackText = '';
  let exceptionType = '';
  let exceptionMethod = '';
  let exceptionMessage = '';
  let level = '';
  let logger = '';
  let timestamp = '';
  const context: Record<string, unknown> = {};

  if (parsedObj) {
    stackText = String(parsedObj.exception_stacktrace || parsedObj.stacktrace || parsedObj.stack || parsedObj.trace || '');
    exceptionType = String(parsedObj.exception_type || parsedObj.error_type || parsedObj.exception || parsedObj.error || '');
    exceptionMethod = String(parsedObj.exception_method || parsedObj.method || '');
    exceptionMessage = String(parsedObj.message || parsedObj.msg || parsedObj.error_message || '');
    level = String(parsedObj.level || parsedObj.severity || 'ERROR');
    logger = String(parsedObj.logger || parsedObj.source || '');
    timestamp = String(parsedObj.date || parsedObj.timestamp || parsedObj.time || parsedObj['@timestamp'] || '');

    // Collect context variables (ctx_*, user, company, id, etc.)
    for (const [k, v] of Object.entries(parsedObj)) {
      if (['exception_stacktrace', 'stacktrace', 'stack', 'trace'].includes(k)) continue;
      context[k] = v;
    }
  } else {
    // Plain text or raw stacktrace
    stackText = trimmed;
    format = 'raw_trace';

    // Try extracting level and timestamp from plain log line
    const logHeader = trimmed.match(/^\[?(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\s\]]*)[\]\s]+\[?(ERROR|FATAL|CRITICAL|WARN|WARNING|INFO|DEBUG)\]?\s*(.*)$/im);
    if (logHeader) {
      timestamp = logHeader[1];
      level = logHeader[2].toUpperCase();
    }

    const typeMatch = trimmed.match(/([a-zA-Z0-9_$.]+(?:Exception|Error|Panic)):?\s*([^\r\n]*)/);
    if (typeMatch) {
      exceptionType = typeMatch[1];
      exceptionMessage = typeMatch[2];
    }
  }

  // 3. Detect language
  const language = detectLanguage(stackText || trimmed, parsedObj);

  // 4. Parse stack frames based on language
  let frames: StackFrame[] = [];
  if (language === 'csharp') {
    frames = parseDotNetTrace(stackText || trimmed);
  } else if (language === 'java') {
    frames = parseJavaTrace(stackText || trimmed);
  } else if (language === 'python') {
    frames = parsePythonTrace(stackText || trimmed);
  } else if (language === 'javascript') {
    frames = parseJsTrace(stackText || trimmed);
  } else {
    frames = parseGenericTrace(stackText || trimmed);
  }

  // If no frames parsed with specific language, try .NET or generic parser
  if (frames.length === 0) {
    frames = parseDotNetTrace(stackText || trimmed);
    if (frames.length === 0) {
      frames = parseGenericTrace(stackText || trimmed);
    }
  }

  // 5. Build Execution Path (Chronological flow: Entry Point -> Intermediate Services -> Deepest App Code -> Crash Site)
  // For .NET and Java, stack trace has index 0 as crash site, and last index as entrypoint (e.g. Controller)
  // For Python, stack trace has index 0 as entrypoint and last index as crash site
  let executionPath: StackFrame[] = [];
  if (language === 'python') {
    executionPath = [...frames];
  } else {
    executionPath = [...frames].reverse();
  }

  const crashSiteFrame = frames.find(f => f.isCrashSite) || frames[0];
  const appCrashSiteFrame = frames.find(f => f.isAppCode && f.lineNumber !== null) || frames.find(f => f.isAppCode);

  // 6. Run 100% deterministic rule-based root cause analysis
  const rootCause = analyzeRootCause(exceptionType, frames, context, exceptionMessage);

  return {
    rawInput,
    format,
    language,
    timestamp,
    level: level || 'ERROR',
    logger,
    exceptionType: exceptionType || (crashSiteFrame?.method ? `${crashSiteFrame.classOrNamespace} error` : 'Exception'),
    exceptionMessage,
    exceptionMethod,
    context,
    frames,
    executionPath,
    crashSiteFrame,
    appCrashSiteFrame,
    rootCause,
  };
}
