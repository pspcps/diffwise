import { useRef, useState } from 'react';
import { Copy, Download, ImagePlus, Upload } from 'lucide-react';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'] as const;

export default function Base64ImageView() {
  const [base64Input, setBase64Input] = useState('');
  const [uploadedDataUrl, setUploadedDataUrl] = useState('');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState<(typeof MIME_TYPES)[number]>('image/png');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'base64' | 'data-url' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSelectImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose a valid image file.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Images must be 20 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setUploadedDataUrl(result);
      setUploadedBase64(result.split(',')[1] ?? '');
      setBase64Input('');
      setFileName(file.name);
      if ((MIME_TYPES as readonly string[]).includes(file.type)) setMimeType(file.type as (typeof MIME_TYPES)[number]);
      setError('');
    };
    reader.onerror = () => setError('Could not read this image.');
    reader.readAsDataURL(file);
  };

  const trimmedInput = base64Input.trim();
  const dataUrlMatch = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]*)$/i.exec(trimmedInput);
  const base64Payload = (dataUrlMatch?.[2] ?? (trimmedInput.startsWith('data:') ? '' : trimmedInput)).replace(/\s/g, '');
  const isValidBase64 = base64Payload.length > 0 && (!trimmedInput.startsWith('data:') || Boolean(dataUrlMatch))
    && /^[A-Za-z0-9+/]*={0,2}$/.test(base64Payload)
    && base64Payload.length % 4 !== 1;
  const decodedDataUrl = dataUrlMatch?.[0] ?? (isValidBase64 ? `data:${mimeType};base64,${base64Payload}` : '');
  const preview = uploadedDataUrl || (!uploadedDataUrl && isValidBase64 ? decodedDataUrl : '');
  const isShowingBase64 = Boolean(uploadedDataUrl);
  const outputBase64 = isShowingBase64 ? uploadedBase64 : base64Payload;
  const outputDataUrl = isShowingBase64 ? uploadedDataUrl : decodedDataUrl;
  const inputError = trimmedInput && !isValidBase64
    ? trimmedInput.startsWith('data:') ? 'Use a valid image data URL or raw Base64.' : 'This is not valid Base64 data.'
    : '';

  const copyText = async (kind: 'base64' | 'data-url') => {
    const value = kind === 'base64' ? outputBase64 : outputDataUrl;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setError('Clipboard access is unavailable in this browser context.');
    }
  };

  const downloadImage = () => {
    if (!preview) return;
    const actualMimeType = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(preview)?.[1] ?? mimeType;
    const extension = actualMimeType.split('/')[1]?.replace('svg+xml', 'svg') ?? 'png';
    const anchor = document.createElement('a');
    anchor.href = preview;
    anchor.download = `image.${extension}`;
    anchor.click();
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">Image Base64 Converter</h1>
          <p className="mt-0.5 text-[11px] text-[#6c7086]">Choose an image to encode, or paste Base64 to preview it.</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-3 py-1.5 text-[11px] text-[#89b4fa] hover:bg-[#89b4fa]/15"><Upload size={12} />Choose image</button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={event => onSelectImage(event.target.files?.[0])} className="sr-only" />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <div className="flex min-h-0 flex-col border-b border-[#313244] md:border-b-0 md:border-r">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2">
            <span className="text-[11px] font-medium text-[#9399b2]">{uploadedDataUrl ? 'Selected image' : 'Paste image Base64'}</span>
            {!dataUrlMatch && !uploadedDataUrl && <select value={mimeType} onChange={event => setMimeType(event.target.value as (typeof MIME_TYPES)[number])} aria-label="Image type for raw Base64" className="rounded border border-[#313244] bg-[#1a1a2c] px-2 py-1 text-[10px] text-[#cdd6f4]">{MIME_TYPES.map(type => <option key={type} value={type}>{type.replace('image/', '')}</option>)}</select>}
            {fileName && <span className="max-w-48 truncate text-[10px] text-[#6c7086]">{fileName}</span>}
          </div>
          {uploadedDataUrl ? <div className="flex min-h-36 flex-1 items-center justify-center bg-[#1a1a2c] p-4"><div className="text-center"><ImagePlus size={24} className="mx-auto text-[#89b4fa]" /><p className="mt-2 text-xs text-[#cdd6f4]">{fileName}</p><p className="mt-1 text-[10px] text-[#6c7086]">{Math.max(1, Math.round((uploadedBase64.length * 3) / 4 / 1024))} KB · ready to encode</p><img src={uploadedDataUrl} alt="Selected image" className="mx-auto mt-4 max-h-48 max-w-full object-contain" /></div></div>
            : <textarea value={base64Input} onChange={event => { setBase64Input(event.target.value); setUploadedDataUrl(''); setUploadedBase64(''); setFileName(''); setError(''); }} placeholder="Paste raw Base64 or a data:image/...;base64,... URL" spellCheck={false} aria-label="Image or Base64 input"
              className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[11px] leading-5 text-[#cdd6f4] outline-none placeholder:text-[#585b70] focus:ring-1 focus:ring-inset focus:ring-[#89b4fa]/20" />}
          {error && <p role="alert" className="shrink-0 px-4 py-2 text-[10px] text-[#f38ba8]">{error}</p>}
          {inputError && !error && <p role="status" className="shrink-0 px-4 py-2 text-[10px] text-[#f38ba8]">{inputError}</p>}
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
            <span className="text-[11px] font-medium text-[#9399b2]">{isShowingBase64 ? 'Base64 output' : 'Image preview'}</span>
            <div className="flex items-center gap-1.5">
              {outputBase64 && <span className="text-[10px] text-[#6c7086]">{Math.max(1, Math.round((outputBase64.length * 3) / 4 / 1024))} KB</span>}
              {preview && <button onClick={downloadImage} title="Download image" aria-label="Download image" className="rounded-md border border-[#313244] p-1.5 text-[#9399b2] hover:text-[#cdd6f4]"><Download size={13} /></button>}
              <button onClick={() => void copyText('base64')} disabled={!outputBase64} title={copied === 'base64' ? 'Base64 copied' : 'Copy Base64'} aria-label="Copy Base64" className="rounded-md border border-[#313244] p-1.5 text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40"><Copy size={13} /></button>
              <button onClick={() => void copyText('data-url')} disabled={!outputDataUrl} title={copied === 'data-url' ? 'Data URL copied' : 'Copy data URL'} aria-label="Copy data URL" className="rounded-md border border-[#313244] p-1.5 text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40"><Copy size={13} /></button>
            </div>
          </div>
          {isShowingBase64 ? <textarea readOnly value={uploadedBase64} aria-label="Generated Base64 output" placeholder="Encoded image data will appear here..." className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[11px] leading-5 text-[#a6e3a1] outline-none" />
            : <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#1a1a2c] p-4">{preview ? <img src={preview} alt="Base64 image preview" onError={() => setError('The Base64 data is not a valid image.')} className="max-h-full max-w-full object-contain" /> : <div className="flex flex-col items-center gap-2 text-center text-xs text-[#585b70]"><ImagePlus size={22} />{inputError || 'Choose an image or paste Base64 to see the result.'}</div>}</div>}
        </div>
      </div>
    </section>
  );
}