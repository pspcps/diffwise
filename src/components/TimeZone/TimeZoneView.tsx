import { useRef, useState } from 'react';
import { ArrowLeftRight, CalendarDays, Clock3 } from 'lucide-react';

const supportedTimeZones = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? [
  'America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/Berlin', 'Europe/London', 'UTC',
];
const TIME_ZONES = [...new Set(['UTC', Intl.DateTimeFormat().resolvedOptions().timeZone, ...supportedTimeZones])].sort();

function localDateTime(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '00';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
}

function wallTimeCandidates(value: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/.exec(value);
  if (!match) return [] as Date[];
  const [, yearText, monthText, dayText, hourText = '00', minuteText = '00', secondText = '00', fractionText = ''] = match;
  const [year, month, day, hour, minute, second] = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  const dateCheck = new Date(Date.UTC(year, month - 1, day));
  if (dateCheck.getUTCFullYear() !== year || dateCheck.getUTCMonth() !== month - 1 || dateCheck.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return [];
  const normalized = `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}`;
  const milliseconds = Number((fractionText + '000').slice(0, 3));
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, second, milliseconds);
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 3) {
    offsets.add(offsetMinutes(new Date(desiredUtc + hours * 60 * 60 * 1000), timeZone));
  }
  return [...offsets]
    .map(offset => new Date(desiredUtc - offset * 60 * 1000))
    .filter(date => localDateTime(date, timeZone) === normalized)
    .sort((left, right) => left.getTime() - right.getTime());
}

function zoneLabel(zone: string) {
  return zone.replaceAll('_', ' ');
}

function offsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value ?? 0);
  const localAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'));
  return Math.round((localAsUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

function offsetLabel(date: Date, timeZone: string) {
  const minutes = offsetMinutes(date, timeZone);
  const sign = minutes < 0 ? '-' : '+';
  const absolute = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
}

function zoneName(date: Date, timeZone: string) {
  const offset = offsetMinutes(date, timeZone);
  const seasonalNames: Record<string, [number, string, string]> = {
    'America/Los_Angeles': [-7 * 60, 'PDT', 'PST'],
    'America/Vancouver': [-7 * 60, 'PDT', 'PST'],
    'America/New_York': [-4 * 60, 'EDT', 'EST'],
    'America/Toronto': [-4 * 60, 'EDT', 'EST'],
    'Europe/London': [60, 'BST', 'GMT'],
    'Europe/Paris': [120, 'CEST', 'CET'],
    'Europe/Berlin': [120, 'CEST', 'CET'],
    'Asia/Kolkata': [330, 'IST', 'IST'],
    'Asia/Tokyo': [540, 'JST', 'JST'],
    'Australia/Sydney': [660, 'AEDT', 'AEST'],
  };
  const seasonal = seasonalNames[timeZone];
  if (seasonal) return offset === seasonal[0] ? seasonal[1] : seasonal[2];
  return new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'short' })
    .formatToParts(date).find(part => part.type === 'timeZoneName')?.value ?? timeZone;
}

function epochDate(value: string) {
  if (!value.trim()) return null;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return null;
  const date = new Date(Math.abs(timestamp) < 100_000_000_000 ? timestamp * 1000 : timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/i.exec(value.trim());
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '00', , offset] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const dateCheck = new Date(Date.UTC(year, month - 1, day));
  if (dateCheck.getUTCFullYear() !== year || dateCheck.getUTCMonth() !== month - 1 || dateCheck.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return null;
  if (offset.toUpperCase() !== 'Z') {
    const [offsetHour, offsetMinute] = offset.slice(1).split(':').map(Number);
    if (offsetHour > 23 || offsetMinute > 59) return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function timestampInputDate(value: string, localTimeZone: string) {
  const trimmed = value.trim();
  const numericDate = epochDate(trimmed);
  if (numericDate) return numericDate;
  const zonedIsoDate = isoDate(trimmed);
  if (zonedIsoDate) return zonedIsoDate;

  if (/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)?$/.test(trimmed)) {
    return wallTimeCandidates(trimmed, localTimeZone)[0] ?? null;
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export default function TimeZoneView() {
  const initialZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [sourceZone, setSourceZone] = useState(initialZone);
  const [targetZone, setTargetZone] = useState('UTC');
  const [instantMs, setInstantMs] = useState(Date.now);
  const [epochDraft, setEpochDraft] = useState<string | null>(null);
  const [sourceDraft, setSourceDraft] = useState<string | null>(null);
  const [targetDraft, setTargetDraft] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState('');
  const [targetError, setTargetError] = useState('');
  const [ambiguous, setAmbiguous] = useState<{ side: 'source' | 'target'; candidates: Date[] } | null>(null);
  const pickerRefs = useRef<Record<'source' | 'target', HTMLInputElement | null>>({ source: null, target: null });

  const instant = new Date(instantMs);
  const epochValue = epochDraft ?? String(instantMs);
  const epochDateDraft = epochDraft === null ? instant : timestampInputDate(epochDraft, sourceZone);
  const epochDraftInvalid = epochDraft !== null && epochDraft.trim().length > 0 && !epochDateDraft;
  const sourceTime = sourceDraft ?? localDateTime(instant, sourceZone);
  const targetTime = targetDraft ?? localDateTime(instant, targetZone);

  const clearDrafts = () => {
    setEpochDraft(null);
    setSourceDraft(null);
    setTargetDraft(null);
    setSourceError('');
    setTargetError('');
    setAmbiguous(null);
  };

  const updateLocalTime = (value: string, side: 'source' | 'target') => {
    const timeZone = side === 'source' ? sourceZone : targetZone;
    const setDraft = side === 'source' ? setSourceDraft : setTargetDraft;
    const setError = side === 'source' ? setSourceError : setTargetError;
    setEpochDraft(null);
    setDraft(value);

    if (!value) {
      setError('');
      setAmbiguous(null);
      return;
    }

    const absoluteTime = isoDate(value);
    if (absoluteTime) {
      setInstantMs(absoluteTime.getTime());
      setDraft(null);
      setError('');
      setEpochDraft(null);
      if (side === 'source') {
        setTargetDraft(null);
        setTargetError('');
      } else {
        setSourceDraft(null);
        setSourceError('');
      }
      setAmbiguous(null);
      return;
    }

    const localIso = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?)?$/.test(value);
    const candidates = localIso ? wallTimeCandidates(value, timeZone) : [];
    const recognizedDate = candidates[0] ?? (localIso ? null : timestampInputDate(value, timeZone));
    if (!recognizedDate) {
      setError(localIso
        ? 'This local time is invalid or falls in a daylight-saving gap.'
        : 'Enter a recognized date string, ISO timestamp, or local date/time.');
      setAmbiguous(null);
      return;
    }

    setInstantMs(recognizedDate.getTime());
    setDraft(null);
    setError('');
    if (side === 'source') {
      setTargetDraft(null);
      setTargetError('');
    } else {
      setSourceDraft(null);
      setSourceError('');
    }
    setAmbiguous(candidates.length > 1 ? { side, candidates } : null);
  };

  const updateEpoch = (value: string) => {
    setEpochDraft(value);
    const date = timestampInputDate(value, sourceZone);
    if (!date) return;
    setInstantMs(date.getTime());
    setSourceDraft(null);
    setTargetDraft(null);
    setSourceError('');
    setTargetError('');
    setAmbiguous(null);
  };

  const chooseAmbiguousTime = (candidate: Date) => {
    setInstantMs(candidate.getTime());
    setEpochDraft(null);
    setSourceDraft(null);
    setTargetDraft(null);
    setAmbiguous(null);
  };

  const setCurrentTime = () => {
    setInstantMs(Date.now());
    clearDrafts();
  };

  const swapZones = () => {
    setSourceZone(targetZone);
    setTargetZone(sourceZone);
    clearDrafts();
  };

  const updateSourceZone = (zone: string) => {
    setSourceZone(zone);
    setSourceDraft(null);
    setSourceError('');
    setAmbiguous(null);
  };

  const updateTargetZone = (zone: string) => {
    setTargetZone(zone);
    setTargetDraft(null);
    setTargetError('');
    setAmbiguous(null);
  };

  const openDatePicker = (side: 'source' | 'target') => {
    const picker = pickerRefs.current[side];
    if (!picker) return;
    if (typeof picker.showPicker === 'function') picker.showPicker();
    else picker.click();
  };

  const localPanel = (side: 'source' | 'target') => {
    const isSource = side === 'source';
    const timeZone = isSource ? sourceZone : targetZone;
    const value = isSource ? sourceTime : targetTime;
    const error = isSource ? sourceError : targetError;
    const updateZone = isSource ? updateSourceZone : updateTargetZone;

    return (
      <section className="flex min-w-0 flex-col gap-3 border border-[#313244] bg-[#181825] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-[#cdd6f4]">{isSource ? 'Source local time' : 'Converted local time'}</h2>
          <span className="text-[10px] text-[#9399b2]">{zoneName(instant, timeZone)} · {offsetLabel(instant, timeZone)}</span>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#6c7086]">Date and time</span>
          <span className="relative block">
            <input type="text" value={value} onChange={event => updateLocalTime(event.target.value, side)}
              aria-label={`${isSource ? 'Source' : 'Converted'} local date and time`} placeholder="Paste a date, ISO timestamp, or local time"
              className={`h-11 w-full min-w-0 rounded-md border bg-[#1a1a2c] py-2 pl-3 pr-10 font-mono text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]/50 ${error ? 'border-[#f38ba8]/70' : 'border-[#313244]'}`} />
            <button type="button" onClick={() => openDatePicker(side)} title="Choose date and time" aria-label={`Choose ${isSource ? 'source' : 'converted'} date and time`} className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-white hover:text-[#89b4fa]"><CalendarDays size={15} /></button>
            <input ref={element => { pickerRefs.current[side] = element; }} type="datetime-local" step="1" value={localDateTime(instant, timeZone)}
              onChange={event => { if (event.target.value) updateLocalTime(event.target.value, side); }} aria-hidden="true" tabIndex={-1}
              className="pointer-events-none absolute right-0 top-0 h-px w-px opacity-0" style={{ colorScheme: 'dark' }} />
          </span>
          {error && <span role="alert" className="text-[10px] text-[#f38ba8]">{error}</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[#6c7086]">Time zone</span>
          <select value={timeZone} onChange={event => updateZone(event.target.value)} aria-label={`${isSource ? 'Source' : 'Converted'} time zone`}
            className="h-10 w-full min-w-0 rounded-md border border-[#313244] bg-[#1a1a2c] px-2 text-[11px] text-[#cdd6f4] outline-none focus:border-[#89b4fa]/50">
            {TIME_ZONES.map(zone => <option key={zone} value={zone}>{zoneLabel(zone)} · {zoneName(instant, zone)} · {offsetLabel(instant, zone)}</option>)}
          </select>
        </label>
        <p className="min-h-8 text-[10px] leading-4 text-[#6c7086]">
          {new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'full', timeStyle: 'long' }).format(instant)}
        </p>
      </section>
    );
  };

  const secondsValue = (instantMs / 1000).toFixed(3).replace(/\.?0+$/, '');

  return (
    <section className="flex h-full min-h-0 flex-col overflow-auto bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">Time Zone Converter</h1>
          <p className="mt-0.5 text-[11px] text-[#6c7086]">Edit either local time or the epoch; all three values stay in sync.</p>
        </div>
        <button onClick={setCurrentTime} className="flex items-center gap-1.5 rounded-md border border-[#313244] px-2.5 py-1.5 text-[11px] text-[#9399b2] hover:border-[#585b70] hover:text-[#cdd6f4]"><Clock3 size={12} />Now</button>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 content-center items-stretch gap-3 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)_minmax(0,1fr)]">
        {localPanel('source')}

        <section className="flex min-w-0 flex-col justify-center gap-3 border border-[#89b4fa]/30 bg-[#1a1a2c] p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-[#89b4fa]">Epoch timestamp</h2>
            <button onClick={swapZones} title="Swap source and converted time zones" aria-label="Swap time zones"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#313244] text-[#89b4fa] hover:bg-[#89b4fa]/10"><ArrowLeftRight size={14} /></button>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] text-[#9399b2]">Milliseconds or ISO timestamp</span>
            <input type="text" value={epochValue} onChange={event => updateEpoch(event.target.value)} placeholder="Epoch ms, ISO, or browser Date string"
              onBlur={() => { if (epochDateDraft) setEpochDraft(null); }} aria-label="Epoch milliseconds or date string"
              className={`h-11 w-full min-w-0 rounded-md border bg-[#11111b] px-3 font-mono text-sm text-[#cdd6f4] outline-none focus:border-[#89b4fa]/60 ${epochDraftInvalid ? 'border-[#f38ba8]/70' : 'border-[#313244]'}`} />
            {epochDraftInvalid && <span role="alert" className="text-[10px] text-[#f38ba8]">Enter seconds, milliseconds, or an ISO 8601 timestamp.</span>}
          </label>
          <div className="border-t border-[#313244] pt-2 text-[10px] leading-5 text-[#6c7086]">
            <div>Seconds: <span className="font-mono text-[#cdd6f4]">{secondsValue}</span></div>
            <div>Milliseconds: <span className="font-mono text-[#cdd6f4]">{instantMs}</span></div>
            <div className="mt-1 text-[#585b70]">Accepts seconds, milliseconds, ISO, and standard browser/GMT date strings.</div>
          </div>
        </section>

        {localPanel('target')}

        {ambiguous && <div className="flex flex-wrap items-center justify-center gap-2 border border-[#f9e2af]/20 bg-[#181825] p-3 text-[11px] lg:col-span-3">
          <span className="text-[#f9e2af]">This local time occurs twice because of daylight saving. Choose one:</span>
          {ambiguous.candidates.map((candidate, index) => <button key={candidate.toISOString()} onClick={() => chooseAmbiguousTime(candidate)}
            className="rounded-md border border-[#313244] px-2.5 py-1.5 text-[#cdd6f4] hover:border-[#89b4fa]/50">{index === 0 ? 'Earlier' : 'Later'} · {zoneName(candidate, ambiguous.side === 'source' ? sourceZone : targetZone)} · {offsetLabel(candidate, ambiguous.side === 'source' ? sourceZone : targetZone)}</button>)}
        </div>}
      </div>
    </section>
  );
}