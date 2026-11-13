import { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Clock,
  Lock,
  AlertCircle,
  FileCode,
  Terminal,
  Edit3,
  ClipboardPaste,
} from 'lucide-react';

function base64UrlEncode(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return '';
  }
}

function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    return '';
  }
}

const STANDARD_CLAIM_LABELS: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expiration Time',
  nbf: 'Not Before',
  iat: 'Issued At',
  jti: 'JWT ID',
};

// Native Web Cryptography HMAC-SHA256 signature verification and creation
async function computeHmacSha256(data: string, secret: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64;
  } catch {
    return '';
  }
}

const SAMPLE_TOKENS = {
  valid: {
    label: 'Standard User (Valid)',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'usr_8829104',
      name: 'Sarah Connor',
      email: 'sarah.connor@psdevtool.online',
      role: 'developer',
      tier: 'pro',
      iat: Math.floor(Date.now() / 1000) - 300,
      exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours in future
      iss: 'https://auth.psdevtool.online',
    },
    secret: 'your-256-bit-secret',
  },
  admin: {
    label: 'Admin Role (RBAC)',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'adm_9918231',
      name: 'Alexander Pierce',
      email: 'admin@company.internal',
      role: 'super_admin',
      permissions: ['users.read', 'users.write', 'billing.manage', 'db.admin'],
      iat: Math.floor(Date.now() / 1000) - 600,
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      iss: 'https://security.company.com',
      aud: 'https://api.company.com',
    },
    secret: 'super-secret-admin-key',
  },
  expired: {
    label: 'Expired Token',
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: 'usr_expired_331',
      name: 'Expired Session',
      iat: 1672531199, // 2023
      exp: 1672534799,
      iss: 'https://auth.psdevtool.online',
    },
    secret: 'secret-key-123',
  },
};

export default function JwtStudioView() {
  const [tokenInput, setTokenInput] = useState('');
  const [headerJson, setHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [secretKey, setSecretKey] = useState('your-256-bit-secret');
  const [signatureStatus, setSignatureStatus] = useState<'valid' | 'invalid' | 'unchecked'>('unchecked');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isEditingToken, setIsEditingToken] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadSample = async (type: keyof typeof SAMPLE_TOKENS) => {
    const s = SAMPLE_TOKENS[type];
    const hStr = JSON.stringify(s.header, null, 2);
    const pStr = JSON.stringify(s.payload, null, 2);
    setHeaderJson(hStr);
    setPayloadJson(pStr);
    setSecretKey(s.secret);

    const hB64 = base64UrlEncode(JSON.stringify(s.header));
    const pB64 = base64UrlEncode(JSON.stringify(s.payload));
    const sig = await computeHmacSha256(`${hB64}.${pB64}`, s.secret);
    setTokenInput(`${hB64}.${pB64}.${sig}`);
    setSignatureStatus('valid');
    setParseError(null);
  };

  // Initialize with sample token on first load
  useEffect(() => {
    loadSample('valid');
  }, []);

  // When user edits the raw token input string:
  const handleTokenChange = async (rawToken: string) => {
    const trimmed = rawToken.trim();
    setTokenInput(trimmed);
    if (!trimmed) {
      setParseError(null);
      setSignatureStatus('unchecked');
      return;
    }

    const parts = trimmed.split('.');
    if (parts.length < 2) {
      setParseError('A valid JWT must contain at least 2 dot-separated segments (Header and Payload).');
      return;
    }

    try {
      const decodedHeader = base64UrlDecode(parts[0]);
      const decodedPayload = base64UrlDecode(parts[1]);

      if (decodedHeader) {
        setHeaderJson(JSON.stringify(JSON.parse(decodedHeader), null, 2));
      }
      if (decodedPayload) {
        setPayloadJson(JSON.stringify(JSON.parse(decodedPayload), null, 2));
      }
      setParseError(null);

      // Verify signature if secret provided and algorithm is HS256
      if (parts.length === 3 && secretKey) {
        const expectedSig = await computeHmacSha256(`${parts[0]}.${parts[1]}`, secretKey);
        setSignatureStatus(expectedSig === parts[2] ? 'valid' : 'invalid');
      } else {
        setSignatureStatus('unchecked');
      }
    } catch {
      setParseError('Unable to parse token segments as valid JSON.');
    }
  };

  // When user edits JSON in the Header or Payload boxes, recalculate the token:
  const handleJsonEdit = async (newHeader: string, newPayload: string) => {
    setHeaderJson(newHeader);
    setPayloadJson(newPayload);
    try {
      const parsedH = JSON.parse(newHeader);
      const parsedP = JSON.parse(newPayload);
      const hB64 = base64UrlEncode(JSON.stringify(parsedH));
      const pB64 = base64UrlEncode(JSON.stringify(parsedP));
      const sig = await computeHmacSha256(`${hB64}.${pB64}`, secretKey);
      setTokenInput(`${hB64}.${pB64}.${sig}`);
      setSignatureStatus('valid');
      setParseError(null);
    } catch {
      // User is mid-edit of JSON
    }
  };

  // Verify signature when secret changes
  const handleSecretChange = async (newSecret: string) => {
    setSecretKey(newSecret);
    const parts = tokenInput.trim().split('.');
    if (parts.length === 3 && newSecret) {
      const expectedSig = await computeHmacSha256(`${parts[0]}.${parts[1]}`, newSecret);
      setSignatureStatus(expectedSig === parts[2] ? 'valid' : 'invalid');
    } else {
      setSignatureStatus('unchecked');
    }
  };

  // Parse claims for expiration and timestamps
  const claims = useMemo(() => {
    try {
      const parsed = JSON.parse(payloadJson);
      return parsed;
    } catch {
      return null;
    }
  }, [payloadJson]);

  // Expiration calculation
  const expStatus = useMemo(() => {
    if (!claims || typeof claims.exp !== 'number') return null;
    const diff = claims.exp - currentTimestamp;
    const expDate = new Date(claims.exp * 1000);

    if (diff > 0) {
      const mins = Math.floor(diff / 60);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      let relative = `${mins}m`;
      if (days > 0) relative = `${days}d ${hours % 24}h`;
      else if (hours > 0) relative = `${hours}h ${mins % 60}m`;

      return {
        isExpired: false,
        text: `Active (Expires in ${relative})`,
        formatted: expDate.toLocaleString(),
      };
    } else {
      const passed = Math.abs(diff);
      const mins = Math.floor(passed / 60);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      let relative = `${mins}m ago`;
      if (days > 0) relative = `${days}d ago`;
      else if (hours > 0) relative = `${hours}h ago`;

      return {
        isExpired: true,
        text: `Expired (${relative})`,
        formatted: expDate.toLocaleString(),
      };
    }
  }, [claims, currentTimestamp]);

  // Split token into visual chunks for display
  const tokenParts = useMemo(() => {
    const parts = tokenInput.trim().split('.');
    return {
      header: parts[0] || '',
      payload: parts[1] || '',
      signature: parts[2] || '',
    };
  }, [tokenInput]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111612] text-[#e4ebdd] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#171d19] border-b border-[#344435] gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#f19aa6]/10 text-[#f19aa6] border border-[#f19aa6]/20">
            <KeyRound size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#e4ebdd]">JWT Inspector</h2>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#b5dfa3]/15 text-[#b5dfa3] font-semibold border border-[#b5dfa3]/30">
                Local token analysis
              </span>
            </div>
            <p className="text-[11px] text-[#b1bea8]">
              Decode tokens, inspect claims, verify HMAC-SHA256 signatures, and calculate expiration timestamps locally
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-[#b1bea8]">Samples:</span>
          {(['valid', 'admin', 'expired'] as const).map(type => (
            <button
              key={type}
              onClick={() => loadSample(type)}
              className="px-2.5 py-1 rounded-lg bg-[#344435] hover:bg-[#71836b] text-xs font-medium text-[#e4ebdd] border border-[#71836b] transition-all"
            >
              {SAMPLE_TOKENS[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Encoded Token (Left) vs Decoded JSON (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#344435] min-h-0 overflow-y-auto">
        {/* LEFT COLUMN: ENCODED TOKEN */}
        <div className="flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* Unified Single Box Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-[#e4ebdd]">Input or Replace JWT String:</label>
              <div className="flex items-center rounded-lg bg-[#0d120f] border border-[#344435] p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setIsEditingToken(false)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    !isEditingToken ? 'bg-[#c8edb6]/20 text-[#c8edb6] font-bold' : 'text-[#9eac96] hover:text-[#e4ebdd]'
                  }`}
                >
                  Color-Coded
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingToken(true)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    isEditingToken ? 'bg-[#c8edb6]/20 text-[#c8edb6] font-bold' : 'text-[#9eac96] hover:text-[#e4ebdd]'
                  }`}
                >
                  Edit / Paste
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      handleTokenChange(text);
                      setIsEditingToken(false);
                    }
                  } catch {}
                }}
                className="flex items-center gap-1 text-[11px] text-[#b5dfa3] hover:underline"
                title="Paste from clipboard"
              >
                <ClipboardPaste size={12} />
                Paste
              </button>
              <button
                type="button"
                onClick={() => handleCopy(tokenInput, 'token')}
                className="flex items-center gap-1 text-[11px] text-[#c8edb6] hover:underline"
              >
                {copiedKey === 'token' ? <Check size={12} /> : <Copy size={12} />}
                Copy Token
              </button>
              <button
                type="button"
                onClick={() => handleCopy(`Authorization: Bearer ${tokenInput}`, 'curl')}
                className="flex items-center gap-1 text-[11px] text-[#ceb8f6] hover:underline"
                title="Copy Authorization: Bearer header"
              >
                {copiedKey === 'curl' ? <Check size={12} /> : <Terminal size={12} />}
                Copy cURL
              </button>
            </div>
          </div>

          {/* Merged Single Token Box */}
          <div className="space-y-2">
            {!isEditingToken ? (
              <div
                onClick={() => setIsEditingToken(true)}
                className="p-3.5 bg-[#0d120f] rounded-xl border border-[#344435] hover:border-[#c8edb6]/50 font-mono text-xs break-all leading-relaxed min-h-[140px] max-h-[240px] overflow-y-auto cursor-text group relative transition-colors"
                title="Click anywhere to edit or replace JWT string"
              >
                {tokenInput.trim() ? (
                  <>
                    <span className="text-[#f19aa6]">{tokenParts.header}</span>
                    {tokenParts.payload && <span className="text-[#e4ebdd]">.</span>}
                    <span className="text-[#ceb8f6]">{tokenParts.payload}</span>
                    {tokenParts.signature && <span className="text-[#e4ebdd]">.</span>}
                    <span className="text-[#c8edb6]">{tokenParts.signature}</span>
                  </>
                ) : (
                  <span className="text-[#899980] italic">
                    Paste or enter your JWT string here (e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)...
                  </span>
                )}

                <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 px-2 py-0.5 rounded bg-[#344435] text-[10px] text-[#c8edb6] transition-opacity pointer-events-none flex items-center gap-1">
                  <Edit3 size={11} />
                  <span>Click to edit or paste</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  autoFocus
                  value={tokenInput}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="Paste or enter your JWT string here (eyJhbGciOi...)..."
                  className="w-full h-36 p-3 bg-[#0d120f] border border-[#c8edb6] rounded-xl font-mono text-xs text-[#e4ebdd] focus:outline-none resize-none leading-relaxed break-all"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#9eac96]">Press Done when finished to view color breakdown</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingToken(false)}
                    className="px-2.5 py-1 rounded bg-[#344435] hover:bg-[#71836b] text-xs font-medium text-[#c8edb6] transition-colors"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            )}

            {/* Token segment color legend */}
            <div className="flex items-center gap-3 text-[10px] text-[#b1bea8]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f19aa6]" /> Header
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ceb8f6]" /> Payload
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c8edb6]" /> Signature
              </span>
            </div>
          </div>

          {parseError && (
            <div className="p-3 rounded-xl bg-[#f19aa6]/10 border border-[#f19aa6]/30 text-xs text-[#f19aa6] flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* HMAC-SHA256 Signature Verification Section */}
          <div className="bg-[#171d19] rounded-xl border border-[#344435] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#e4ebdd] flex items-center gap-1.5">
                <Lock size={13} className="text-[#c8edb6]" />
                HMAC-SHA256 (HS256) Signature Check
              </span>

              {signatureStatus === 'valid' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#b5dfa3]/15 text-[#b5dfa3] border border-[#b5dfa3]/30 flex items-center gap-1">
                  <ShieldCheck size={12} /> Signature Verified
                </span>
              )}
              {signatureStatus === 'invalid' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f19aa6]/15 text-[#f19aa6] border border-[#f19aa6]/30 flex items-center gap-1">
                  <ShieldAlert size={12} /> Invalid Signature
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#b1bea8]">Secret Key / Passphrase:</label>
              <input
                type="text"
                value={secretKey}
                onChange={(e) => handleSecretChange(e.target.value)}
                placeholder="your-256-bit-secret"
                className="w-full px-3 py-1.5 bg-[#111612] border border-[#344435] rounded-lg font-mono text-xs text-[#e4ebdd] focus:outline-none focus:border-[#c8edb6]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DECODED PAYLOAD & CLAIMS */}
        <div className="flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* Expiration Status Pill */}
          {expStatus && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                expStatus.isExpired
                  ? 'bg-[#f19aa6]/10 border-[#f19aa6]/30 text-[#f19aa6]'
                  : 'bg-[#b5dfa3]/10 border-[#b5dfa3]/30 text-[#b5dfa3]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={15} />
                <span className="font-bold">{expStatus.text}</span>
              </div>
              <span className="font-mono text-[11px] text-[#b1bea8]">{expStatus.formatted}</span>
            </div>
          )}

          {/* Decoded Header */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#f19aa6] uppercase tracking-wider flex items-center gap-1.5">
                <FileCode size={13} /> Header: Algorithm &amp; Token Type
              </span>
              <button
                onClick={() => handleCopy(headerJson, 'header')}
                className="text-[10px] text-[#c8edb6] hover:underline flex items-center gap-1"
              >
                {copiedKey === 'header' ? <Check size={10} /> : <Copy size={10} />} Copy
              </button>
            </div>
            <textarea
              value={headerJson}
              onChange={(e) => handleJsonEdit(e.target.value, payloadJson)}
              className="w-full h-24 p-3 bg-[#0d120f] border border-[#f19aa6]/30 rounded-xl font-mono text-xs text-[#f19aa6] focus:outline-none focus:border-[#f19aa6] resize-none"
            />
          </div>

          {/* Decoded Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#ceb8f6] uppercase tracking-wider flex items-center gap-1.5">
                <FileCode size={13} /> Payload: Data &amp; Claims
              </span>
              <button
                onClick={() => handleCopy(payloadJson, 'payload')}
                className="text-[10px] text-[#c8edb6] hover:underline flex items-center gap-1"
              >
                {copiedKey === 'payload' ? <Check size={10} /> : <Copy size={10} />} Copy JSON
              </button>
            </div>
            <textarea
              value={payloadJson}
              onChange={(e) => handleJsonEdit(headerJson, e.target.value)}
              className="w-full h-56 p-3 bg-[#0d120f] border border-[#ceb8f6]/30 rounded-xl font-mono text-xs text-[#ceb8f6] focus:outline-none focus:border-[#ceb8f6] resize-none"
            />
          </div>

          {/* Claims & Payload Values Inspector */}
          {claims && typeof claims === 'object' && Object.keys(claims).length > 0 && (
            <div className="bg-[#171d19] rounded-xl border border-[#344435] p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-[#c8edb6] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Claims &amp; Payload Values</span>
                  <span className="text-[10px] font-normal text-[#9eac96]">({Object.keys(claims).length} claims)</span>
                </div>
                <span className="text-[10px] text-[#9eac96]">Click copy icon in front of any value</span>
              </div>

              <div className="space-y-1.5 text-xs divide-y divide-[#2b382c]">
                {Object.entries(claims).map(([key, val]) => {
                  const isTime = (key === 'exp' || key === 'iat' || key === 'nbf') && typeof val === 'number';
                  const rawValString = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
                  const humanTime = isTime ? new Date((val as number) * 1000).toLocaleString() : null;
                  const label = STANDARD_CLAIM_LABELS[key];
                  const isCopied = copiedKey === `val-${key}`;

                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-1.5 first:pt-0">
                      <div className="flex items-center gap-1.5 text-[#b1bea8] shrink-0 min-w-[130px]">
                        <span className="font-mono text-[#ceb8f6] font-semibold">{key}</span>
                        {label && <span className="text-[10px] text-[#9eac96]">({label})</span>}
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                        {/* Copy icon button in front of value */}
                        <button
                          type="button"
                          onClick={() => handleCopy(rawValString, `val-${key}`)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all shrink-0 ${
                            isCopied
                              ? 'bg-[#b5dfa3]/20 border-[#b5dfa3]/40 text-[#b5dfa3]'
                              : 'bg-[#111612] border-[#344435] text-[#c8edb6] hover:text-[#e4ebdd] hover:border-[#c8edb6]/50'
                          }`}
                          title={`Copy ${key} value`}
                        >
                          {isCopied ? <Check size={11} className="text-[#b5dfa3]" /> : <Copy size={11} />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>

                        <div className="font-mono text-[#e4ebdd] text-xs truncate" title={rawValString}>
                          <span>{rawValString}</span>
                          {humanTime && <span className="ml-1.5 text-[10px] text-[#b1bea8]">({humanTime})</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
