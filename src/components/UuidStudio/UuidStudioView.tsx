import { useState, useEffect } from 'react';
import {
  Fingerprint,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export type IdType = 'uuidv4' | 'uuidv7' | 'uuidv1' | 'snowflake' | 'ulid' | 'nanoid' | 'objectid';

// Generate UUID v4
function genUUIDv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate UUID v7 (RFC 9562 - 48-bit timestamp ms + version 7 + random)
function genUUIDv7(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0'); // 48 bits = 12 hex chars

  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);

  // Set version 7 in high nibble of byte 0
  randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70;
  // Set variant in 2 high bits of byte 2
  randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80;

  const randHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // 8-4-4-4-12 format
  const p1 = timeHex.slice(0, 8);
  const p2 = timeHex.slice(8, 12);
  const p3 = randHex.slice(0, 4);
  const p4 = randHex.slice(4, 8);
  const p5 = randHex.slice(8, 20);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

// Generate UUID v1 (timestamp based simulation)
function genUUIDv1(): string {
  const now = Date.now();
  const timeLow = (now & 0xffffffff).toString(16).padStart(8, '0');
  const timeMid = ((now >> 32) & 0xffff).toString(16).padStart(4, '0');
  const timeHi = (((now >> 48) & 0x0fff) | 0x1000).toString(16).padStart(4, '0');

  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  randomBytes[0] = (randomBytes[0] & 0x3f) | 0x80; // variant
  const node = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);

  return `${timeLow}-${timeMid}-${timeHi}-8000-${node}`;
}

// Twitter / Discord Snowflake generator (64-bit integer)
// Custom epoch: 2020-01-01 (1577836800000 ms)
const SNOWFLAKE_EPOCH = 1577836800000n;
let snowflakeSequence = 0n;

function genSnowflake(workerId: number = 1, processId: number = 1): string {
  const now = BigInt(Date.now());
  const timeDiff = now - SNOWFLAKE_EPOCH;
  snowflakeSequence = (snowflakeSequence + 1n) & 0xfffn; // 12 bits sequence

  const wId = BigInt(workerId & 0x1f); // 5 bits
  const pId = BigInt(processId & 0x1f); // 5 bits

  // 41 bits timestamp + 5 bits worker + 5 bits process + 12 bits sequence
  const snowflake = (timeDiff << 22n) | (wId << 17n) | (pId << 12n) | snowflakeSequence;
  return snowflake.toString();
}

// Crockford Base32 ULID generator (26 chars: 10 chars timestamp + 16 chars random)
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function genULID(): string {
  const now = Date.now();
  let timeStr = '';
  let timeVal = now;
  for (let i = 9; i >= 0; i--) {
    const mod = timeVal % 32;
    timeStr = ENCODING[mod] + timeStr;
    timeVal = Math.floor(timeVal / 32);
  }

  const randBytes = new Uint8Array(10);
  crypto.getRandomValues(randBytes);
  let randStr = '';
  for (let i = 0; i < 16; i++) {
    const randIndex = randBytes[i % 10] % 32;
    randStr += ENCODING[randIndex];
  }

  return timeStr + randStr;
}

// NanoID generator (21 characters URL friendly)
const NANO_ALPHABET = 'useandom-26T1983_40STOpqaHERKeydocFXZINJ';

function genNanoID(size: number = 21): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < size; i++) {
    id += NANO_ALPHABET[bytes[i] % NANO_ALPHABET.length];
  }
  return id;
}

// MongoDB ObjectId generator (24 hex chars: 4-byte timestamp, 5-byte random, 3-byte counter)
let mongoCounter = Math.floor(Math.random() * 0xffffff);

function genObjectId(): string {
  const timeSec = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomBytes = new Uint8Array(5);
  crypto.getRandomValues(randomBytes);
  const randHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  mongoCounter = (mongoCounter + 1) & 0xffffff;
  const countHex = mongoCounter.toString(16).padStart(6, '0');

  return (timeSec + randHex + countHex).toLowerCase();
}

const ID_CONFIGS: Record<IdType, { label: string; desc: string; badge: string; color: string }> = {
  uuidv4: {
    label: 'UUID v4',
    desc: 'Random cryptographic identifier. Industry standard for distributed keys.',
    badge: 'Random',
    color: '#89b4fa',
  },
  uuidv7: {
    label: 'UUID v7',
    desc: 'Unix millisecond timestamp prefix + random bits. Best for database indexes & B-Trees.',
    badge: 'Time-Sorted',
    color: '#a6e3a1',
  },
  snowflake: {
    label: 'Snowflake ID',
    desc: 'Twitter & Discord 64-bit integer with 41-bit timestamp, worker ID, and sequence.',
    badge: '64-Bit Integer',
    color: '#f9e2af',
  },
  ulid: {
    label: 'ULID',
    desc: 'Universally Unique Lexicographically Sortable Identifier (26 Crockford Base32 characters).',
    badge: 'Sortable Base32',
    color: '#cba6f7',
  },
  nanoid: {
    label: 'NanoID',
    desc: 'Compact, secure, URL-friendly unique ID with custom alphabet support.',
    badge: 'Compact URL-Safe',
    color: '#fab387',
  },
  objectid: {
    label: 'Mongo ObjectId',
    desc: '24-hex-character document identifier (timestamp + random machine + counter).',
    badge: 'MongoDB BSON',
    color: '#94e2d5',
  },
  uuidv1: {
    label: 'UUID v1',
    desc: 'Time-based UUID combining timestamp with host clock sequence.',
    badge: 'Legacy Timestamp',
    color: '#b4befe',
  },
};

export default function UuidStudioView() {
  const [selectedType, setSelectedType] = useState<IdType>('uuidv4');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [isBraces, setIsBraces] = useState<boolean>(false);
  const [isHyphens, setIsHyphens] = useState<boolean>(true);
  const [isQuotes, setIsQuotes] = useState<boolean>(false);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generateIds = () => {
    const list: string[] = [];
    for (let i = 0; i < batchCount; i++) {
      let id = '';
      switch (selectedType) {
        case 'uuidv4': id = genUUIDv4(); break;
        case 'uuidv7': id = genUUIDv7(); break;
        case 'uuidv1': id = genUUIDv1(); break;
        case 'snowflake': id = genSnowflake(); break;
        case 'ulid': id = genULID(); break;
        case 'nanoid': id = genNanoID(); break;
        case 'objectid': id = genObjectId(); break;
      }

      // Formatting options
      if (!isHyphens && (selectedType.startsWith('uuid'))) {
        id = id.replace(/-/g, '');
      }
      if (isUppercase) {
        id = id.toUpperCase();
      } else {
        id = id.toLowerCase();
      }
      if (isBraces) {
        id = `{${id}}`;
      }
      if (isQuotes) {
        id = `"${id}"`;
      }

      list.push(id);
    }
    setGeneratedIds(list);
  };

  useEffect(() => {
    generateIds();
  }, [selectedType, batchCount, isUppercase, isBraces, isHyphens, isQuotes]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadAs = (format: 'txt' | 'json' | 'csv') => {
    let content = '';
    let mime = 'text/plain';
    const filename = `generated_ids_${Date.now()}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(generatedIds, null, 2);
      mime = 'application/json';
    } else if (format === 'csv') {
      content = 'id\n' + generatedIds.join('\n');
      mime = 'text/csv';
    } else {
      content = generatedIds.join('\n');
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181825] text-[#cdd6f4] overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1e2e] border-b border-[#313244] gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#89b4fa]/10 text-[#89b4fa] border border-[#89b4fa]/20">
            <Fingerprint size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#cdd6f4]">UUID &amp; Unique ID Generator</h2>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#a6e3a1]/15 text-[#a6e3a1] font-semibold border border-[#a6e3a1]/30">
                100% Cryptographic Client-Side
              </span>
            </div>
            <p className="text-[11px] text-[#9399b2]">
              Generate UUID v4, UUID v7 (Time-Sorted), Twitter Snowflake, ULID, NanoID, and MongoDB ObjectIds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateIds}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw size={13} />
            Regenerate ({batchCount})
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Control Sidebar */}
        <div className="w-full lg:w-80 bg-[#1e1e2e] border-r border-[#313244] p-4 space-y-5 overflow-y-auto shrink-0">
          {/* Generator Type Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#9399b2] block mb-2">
              ID Algorithm
            </label>
            <div className="space-y-1.5">
              {(Object.keys(ID_CONFIGS) as IdType[]).map(key => {
                const cfg = ID_CONFIGS[key];
                const active = selectedType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-[#181825] border-[#89b4fa] shadow-sm'
                        : 'bg-[#181825]/40 border-[#313244] hover:bg-[#181825]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-[#cdd6f4]">{cfg.label}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold"
                        style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                      >
                        {cfg.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#6c7086] line-clamp-2 leading-tight">
                      {cfg.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batch quantity */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#9399b2] block mb-2">
              Quantity ({batchCount})
            </label>
            <div className="flex items-center gap-1.5 bg-[#181825] border border-[#313244] rounded-lg p-1">
              {[1, 5, 10, 25, 50].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setBatchCount(cnt)}
                  className={`flex-1 py-1 rounded text-xs font-mono font-medium transition-all ${
                    batchCount === cnt
                      ? 'bg-[#89b4fa] text-[#11111b] font-bold'
                      : 'text-[#9399b2] hover:text-[#cdd6f4]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Formatting Options */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#9399b2] block mb-2">
              Formatting
            </label>
            <div className="space-y-2 bg-[#181825] border border-[#313244] rounded-xl p-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-[#cdd6f4]">Uppercase Letters</span>
                <input
                  type="checkbox"
                  checked={isUppercase}
                  onChange={(e) => setIsUppercase(e.target.checked)}
                  className="rounded border-[#313244] text-[#89b4fa] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-[#cdd6f4]">Include Hyphens</span>
                <input
                  type="checkbox"
                  checked={isHyphens}
                  onChange={(e) => setIsHyphens(e.target.checked)}
                  className="rounded border-[#313244] text-[#89b4fa] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-[#cdd6f4]">Surround with Braces &#123; &#125;</span>
                <input
                  type="checkbox"
                  checked={isBraces}
                  onChange={(e) => setIsBraces(e.target.checked)}
                  className="rounded border-[#313244] text-[#89b4fa] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-[#cdd6f4]">Enclose in Quotes &quot; &quot;</span>
                <input
                  type="checkbox"
                  checked={isQuotes}
                  onChange={(e) => setIsQuotes(e.target.checked)}
                  className="rounded border-[#313244] text-[#89b4fa] focus:ring-0"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Generated IDs Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#181825] p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#252535] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#cdd6f4]">
                Generated {ID_CONFIGS[selectedType].label} ({generatedIds.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(generatedIds.join('\n'), 'all')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-xs font-medium text-[#cdd6f4] border border-[#45475a] transition-all"
              >
                {copiedKey === 'all' ? <Check size={13} className="text-[#a6e3a1]" /> : <Copy size={13} />}
                Copy All
              </button>

              <div className="flex items-center bg-[#1e1e2e] border border-[#313244] rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => downloadAs('txt')}
                  className="px-2 py-1 text-[#9399b2] hover:text-[#cdd6f4]"
                  title="Download as TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => downloadAs('json')}
                  className="px-2 py-1 text-[#9399b2] hover:text-[#cdd6f4]"
                  title="Download as JSON array"
                >
                  JSON
                </button>
                <button
                  onClick={() => downloadAs('csv')}
                  className="px-2 py-1 text-[#9399b2] hover:text-[#cdd6f4]"
                  title="Download as CSV"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* List of generated IDs */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 font-mono text-xs">
            {generatedIds.map((id, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1e1e2e] border border-[#313244] hover:border-[#89b4fa]/50 transition-all group"
              >
                <span className="text-[#89b4fa] break-all select-all font-medium">
                  {id}
                </span>

                <button
                  onClick={() => handleCopy(id, `id-${index}`)}
                  className="p-1.5 rounded-lg text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] opacity-80 group-hover:opacity-100 transition-all shrink-0 ml-2"
                  title="Copy this ID"
                >
                  {copiedKey === `id-${index}` ? <Check size={14} className="text-[#a6e3a1]" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>

          {/* Quick info tip for selected type */}
          <div className="mt-3 p-3 rounded-xl bg-[#1e1e2e] border border-[#313244] text-[11px] text-[#9399b2] flex items-center justify-between shrink-0">
            <span>
              💡 <strong>{ID_CONFIGS[selectedType].label}:</strong> {ID_CONFIGS[selectedType].desc}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
