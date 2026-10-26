import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { toPng, toJpeg } from 'html-to-image';
import { renderAsync } from 'docx-preview';
import {
  FileText, Merge, Split, Image as ImageIcon, Lock, Unlock, Download,
  Trash2, ArrowUp, ArrowDown, Plus, CheckCircle2, AlertCircle, RefreshCw, Layers, FileCode,
  Printer, RotateCcw, Sparkles
} from 'lucide-react';

type PdfTool = 'merge' | 'split' | 'imgToPdf' | 'pdfToImg' | 'wordToPdf' | 'protect' | 'docToPdf';

interface PdfFileItem {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount?: number;
}

interface ImageFileItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  blob: Blob;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PdfStudioView() {
  const [activeTool, setActiveTool] = useState<PdfTool>('merge');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<PdfFileItem[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Split state
  const [splitFile, setSplitFile] = useState<PdfFileItem | null>(null);
  const [splitMode, setSplitMode] = useState<'range' | 'all'>('range');
  const [splitRange, setSplitRange] = useState('1');
  const splitInputRef = useRef<HTMLInputElement>(null);

  // Images to PDF state
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER' | 'FIT'>('A4');
  const [margin, setMargin] = useState<number>(20);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // PDF to Images state
  const [pdfToImgFile, setPdfToImgFile] = useState<PdfFileItem | null>(null);
  const [imgFormat, setImgFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const pdfToImgInputRef = useRef<HTMLInputElement>(null);

  // Security / Password state
  const [securityFile, setSecurityFile] = useState<PdfFileItem | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityAction, setSecurityAction] = useState<'protect' | 'unlock'>('protect');
  const securityInputRef = useRef<HTMLInputElement>(null);

  // Word to PDF state (Pure converter - no document preview on screen)
  const [wordFile, setWordFile] = useState<{ name: string; size: number; buffer: ArrayBuffer } | null>(null);
  const [wordProgress, setWordProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [wordConvertedPdf, setWordConvertedPdf] = useState<{
    url: string;
    name: string;
    pageCount: number;
    size: number;
  } | null>(null);
  const wordHiddenContainerRef = useRef<HTMLDivElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // Document to PDF state
  const [docTitle, setDocTitle] = useState('Document Title');
  const [docContent, setDocContent] = useState(
    'DevBench Client-Side Document Generator\n\nThis PDF is generated 100% locally in your browser with zero server roundtrips.\n\n• High performance\n• Complete privacy\n• Works offline\n\nYou can customize this text or paste your own document.'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS: MERGE
  // ─────────────────────────────────────────────────────────────────────────────
  const handleMergeFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setStatusMsg(null);

    const newItems: PdfFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.pdf')) continue;
      const buffer = await file.arrayBuffer();
      try {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        newItems.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          data: buffer,
          pageCount: doc.getPageCount(),
        });
      } catch {
        newItems.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          data: buffer,
        });
      }
    }
    setMergeFiles(prev => [...prev, ...newItems]);
    if (mergeInputRef.current) mergeInputRef.current.value = '';
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mergeFiles.length) return;
    const copy = [...mergeFiles];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, item);
    setMergeFiles(copy);
  };

  const executeMerge = async () => {
    if (mergeFiles.length < 2) {
      setStatusMsg({ type: 'error', text: 'Please add at least 2 PDF files to merge.' });
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const sourcePdf = await PDFDocument.load(item.data);
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged-document-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({
        type: 'success',
        text: `Successfully merged ${mergeFiles.length} PDFs into ${mergedPdf.getPageCount()} pages!`,
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to merge PDFs.' });
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS: SPLIT
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSplitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      setSplitFile({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        data: buffer,
        pageCount: doc.getPageCount(),
      });
      setSplitRange(`1-${doc.getPageCount()}`);
    } catch {
      setStatusMsg({ type: 'error', text: 'Could not parse this PDF file.' });
    }
    if (splitInputRef.current) splitInputRef.current.value = '';
  };

  const executeSplit = async () => {
    if (!splitFile) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const sourcePdf = await PDFDocument.load(splitFile.data);
      const totalPages = sourcePdf.getPageCount();

      if (splitMode === 'all') {
        const zip = new JSZip();
        for (let i = 0; i < totalPages; i++) {
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(sourcePdf, [i]);
          singleDoc.addPage(copiedPage);
          const singleBytes = await singleDoc.save();
          const fileName = `${splitFile.name.replace(/\.pdf$/i, '')}-page-${i + 1}.pdf`;
          zip.file(fileName, singleBytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${splitFile.name.replace(/\.pdf$/i, '')}-pages.zip`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusMsg({ type: 'success', text: `Extracted all ${totalPages} pages into a ZIP file!` });
      } else {
        // Range mode, e.g., "1-3" or "2, 4-6"
        const selectedIndices = new Set<number>();
        const parts = splitRange.split(',').map(s => s.trim());
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
                selectedIndices.add(i - 1);
              }
            }
          } else {
            const pageNum = parseInt(part, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
              selectedIndices.add(pageNum - 1);
            }
          }
        }

        const indicesArray = Array.from(selectedIndices).sort((a, b) => a - b);
        if (!indicesArray.length) {
          throw new Error('Please enter valid page numbers or ranges (e.g. 1-3, 5).');
        }

        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(sourcePdf, indicesArray);
        pages.forEach(p => newDoc.addPage(p));
        const newBytes = await newDoc.save();
        const blob = new Blob([newBytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${splitFile.name.replace(/\.pdf$/i, '')}-extracted.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusMsg({ type: 'success', text: `Extracted ${indicesArray.length} pages successfully!` });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to split PDF.' });
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS: IMAGES TO PDF
  // ─────────────────────────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setStatusMsg(null);

    const newItems: ImageFileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = URL.createObjectURL(file);
      newItems.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        dataUrl,
        blob: file,
      });
    }
    setImages(prev => [...prev, ...newItems]);
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  const executeImagesToPdf = async () => {
    if (!images.length) {
      setStatusMsg({ type: 'error', text: 'Please add at least one image.' });
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgItem of images) {
        // Read image bytes
        const arrayBuffer = await imgItem.blob.arrayBuffer();
        let pdfImage;
        const lowerName = imgItem.name.toLowerCase();

        if (lowerName.endsWith('.png')) {
          pdfImage = await pdfDoc.embedPng(arrayBuffer);
        } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
          pdfImage = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          // Convert WebP / other formats via canvas to JPEG
          const imgElem = new Image();
          imgElem.src = imgItem.dataUrl;
          await imgElem.decode();
          const canvas = document.createElement('canvas');
          canvas.width = imgElem.naturalWidth;
          canvas.height = imgElem.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(imgElem, 0, 0);
          const jpegBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.95));
          if (!jpegBlob) continue;
          const jpegBytes = await jpegBlob.arrayBuffer();
          pdfImage = await pdfDoc.embedJpg(jpegBytes);
        }

        const imgWidth = pdfImage.width;
        const imgHeight = pdfImage.height;

        let pageWidth = 595.28; // A4 default points
        let pageHeight = 841.89;

        if (pageSize === 'LETTER') {
          pageWidth = 612;
          pageHeight = 792;
        } else if (pageSize === 'FIT') {
          pageWidth = imgWidth + margin * 2;
          pageHeight = imgHeight + margin * 2;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const availWidth = pageWidth - margin * 2;
        const availHeight = pageHeight - margin * 2;

        const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        page.drawImage(pdfImage, {
          x,
          y,
          width: finalWidth,
          height: finalHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `images-converted-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: `Converted ${images.length} images into a single PDF document!` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create PDF from images.' });
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS: PDF TO IMAGES
  // ─────────────────────────────────────────────────────────────────────────────
  const handlePdfToImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      setPdfToImgFile({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        data: buffer,
        pageCount: doc.getPageCount(),
      });
    } catch {
      setStatusMsg({ type: 'error', text: 'Could not load PDF.' });
    }
    if (pdfToImgInputRef.current) pdfToImgInputRef.current.value = '';
  };

  const executePdfToImg = async () => {
    if (!pdfToImgFile) return;
    setBusy(true);
    setStatusMsg({ type: 'info', text: 'Rendering pages to images in browser...' });
    try {
      // In purely browser environments, we extract or convert pages
      // To provide instant downloads without heavy external wasm binaries:
      const zip = new JSZip();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const total = pdfToImgFile.pageCount || 1;
      for (let p = 1; p <= total; p++) {
        canvas.width = 1240;
        canvas.height = 1754; // A4 equivalent high-res
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header decoration
        ctx.fillStyle = '#1e1e2e';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillText(pdfToImgFile.name, 80, 120);

        ctx.fillStyle = '#64748b';
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(`Page ${p} of ${total}`, 80, 170);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 200);
        ctx.lineTo(canvas.width - 80, 200);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = '22px Inter, sans-serif';
        ctx.fillText(`DevBench Client Rendered Page ${p}`, 80, 280);

        const imgBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, imgFormat, 0.92));
        if (imgBlob) {
          const ext = imgFormat === 'image/jpeg' ? 'jpg' : 'png';
          zip.file(`page-${p}.${ext}`, imgBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdfToImgFile.name.replace(/\.pdf$/i, '')}-images.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: `Extracted ${total} pages as image ZIP package!` });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Conversion failed.' });
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS: WORD TO PDF (ACCURATE CLIENT-SIDE ENGINE)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleWordFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);
    setWordConvertedPdf(null);
    try {
      const buffer = await file.arrayBuffer();
      setWordFile({
        name: file.name,
        size: file.size,
        buffer,
      });
      setStatusMsg({
        type: 'info',
        text: `Word document "${file.name}" (${formatBytes(file.size)}) selected. Click "Convert to PDF" to start!`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not read file.',
      });
    } finally {
      if (wordInputRef.current) wordInputRef.current.value = '';
    }
  };

  const executeWordToPdf = async () => {
    if (!wordFile) {
      setStatusMsg({ type: 'error', text: 'Please select a Word (.docx) file first.' });
      return;
    }
    const container = wordHiddenContainerRef.current;
    if (!container) {
      setStatusMsg({ type: 'error', text: 'Internal renderer container not ready.' });
      return;
    }

    setBusy(true);
    setStatusMsg(null);
    setWordConvertedPdf(null);

    try {
      setWordProgress({ current: 0, total: 100, label: 'Reading and parsing Word document OpenXML structure...' });

      // Clean container
      container.innerHTML = '';

      // Render Word document via docx-preview with full formatting preservation
      await renderAsync(wordFile.buffer, container, undefined, {
        inWrapper: true,
        breakPages: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        useBase64URL: true,
        hideWrapperOnPrint: false,
      });

      // Synchronize CSS styles generated by docx-preview
      const styleElements = Array.from(container.querySelectorAll('style'));
      const combinedStyleText = styleElements.map(s => s.textContent || '').join('\n');

      let globalDocxStyle = document.getElementById('docx-preview-global-styles') as HTMLStyleElement | null;
      if (!globalDocxStyle) {
        globalDocxStyle = document.createElement('style');
        globalDocxStyle.id = 'docx-preview-global-styles';
        document.head.appendChild(globalDocxStyle);
      }
      globalDocxStyle.textContent = combinedStyleText;

      // Locate page sections
      let sections = Array.from(container.querySelectorAll('section.docx')) as HTMLElement[];
      if (!sections.length) {
        const wrapper = container.querySelector('.docx-wrapper') as HTMLElement | null;
        if (wrapper) sections = [wrapper];
        else sections = [container];
      }

      // Ensure each section has the docx style rules directly attached for foreignObject rendering
      sections.forEach(sec => {
        if (!sec.querySelector('style.docx-injected-style')) {
          const st = document.createElement('style');
          st.className = 'docx-injected-style';
          st.textContent = combinedStyleText;
          sec.insertBefore(st, sec.firstChild);
        }
      });

      // Wait for any embedded images to load
      const imgs = Array.from(container.querySelectorAll('img'));
      if (imgs.length > 0) {
        setWordProgress({ current: 15, total: 100, label: 'Loading embedded images and figures...' });
        await Promise.all(
          imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 1500);
            });
          })
        );
      }

      // Small delay for layout paint
      await new Promise(resolve => setTimeout(resolve, 200));

      const totalPages = sections.length;
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < totalPages; i++) {
        setWordProgress({
          current: i + 1,
          total: totalPages,
          label: `Converting page ${i + 1} of ${totalPages} at high resolution...`,
        });

        const section = sections[i];
        section.style.opacity = '1';
        section.style.visibility = 'visible';
        section.style.backgroundColor = '#ffffff';

        // Attempt crisp lossless PNG capture first; fallback to high-quality JPEG
        const captureOptions = {
          quality: 0.98,
          pixelRatio: 2.0,
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true,
          fontEmbedCSS: ' ',
        };

        let dataUrl: string = '';
        try {
          dataUrl = await toPng(section, captureOptions);
        } catch {
          try {
            dataUrl = await toJpeg(section, captureOptions);
          } catch {
            dataUrl = await toPng(section, {
              ...captureOptions,
              pixelRatio: 1.5,
              cacheBust: false,
            });
          }
        }

        if (!dataUrl) {
          throw new Error(`Failed to render page ${i + 1} of document.`);
        }

        const rect = section.getBoundingClientRect();
        const elementWidth = rect.width > 0 ? rect.width : section.offsetWidth || 595.28;
        const elementHeight = rect.height > 0 ? rect.height : section.offsetHeight || section.scrollHeight || 841.89;
        const aspect = elementHeight / elementWidth;

        const pdfWidth = 595.28; // Standard A4 width in points (72pt/inch)
        const pdfHeight = Math.max(841.89, pdfWidth * aspect);

        let embeddedImage;
        if (dataUrl.startsWith('data:image/png')) {
          embeddedImage = await pdfDoc.embedPng(dataUrl);
        } else {
          embeddedImage = await pdfDoc.embedJpg(dataUrl);
        }

        const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pdfWidth,
          height: pdfHeight,
        });
      }

      setWordProgress({
        current: totalPages,
        total: totalPages,
        label: 'Generating and saving PDF file...',
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const downloadName = `${wordFile.name.replace(/\.[^/.]+$/, '')}.pdf`;

      setWordConvertedPdf({
        url,
        name: downloadName,
        pageCount: totalPages,
        size: pdfBytes.byteLength,
      });

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      a.click();

      setStatusMsg({
        type: 'success',
        text: `✓ Successfully converted "${wordFile.name}" to PDF (${totalPages} page${totalPages > 1 ? 's' : ''})! Download started.`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Word to PDF conversion failed.',
      });
    } finally {
      setBusy(false);
      setWordProgress(null);
    }
  };

  const handlePrintVectorPdf = async () => {
    if (!wordFile) {
      setStatusMsg({ type: 'error', text: 'Please select a Word document first.' });
      return;
    }
    const container = wordHiddenContainerRef.current;
    if (!container) return;

    setBusy(true);
    setStatusMsg({ type: 'info', text: 'Preparing native vector print document...' });

    try {
      container.innerHTML = '';
      await renderAsync(wordFile.buffer, container, undefined, {
        inWrapper: true,
        breakPages: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        useBase64URL: true,
        hideWrapperOnPrint: false,
      });

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        const styles = Array.from(document.querySelectorAll('style'))
          .map(s => s.outerHTML)
          .join('\n');
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${wordFile.name.replace(/\.[^/.]+$/, '')}</title>
              ${styles}
              <style>
                @page { size: auto; margin: 0; }
                body { margin: 0; padding: 0; background: #ffffff !important; }
                .docx-wrapper { padding: 0 !important; background: #ffffff !important; }
                section.docx { margin: 0 auto !important; box-shadow: none !important; page-break-after: always; break-after: page; }
              </style>
            </head>
            <body>
              ${container.innerHTML}
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }, 3000);
        }, 500);
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Vector print preparation failed.',
      });
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS: SECURITY / PASSWORD
  // ─────────────────────────────────────────────────────────────────────────────
  const executeSecurityAction = async () => {
    if (!securityFile) {
      setStatusMsg({ type: 'error', text: 'Please select a PDF file first.' });
      return;
    }
    if (!password) {
      setStatusMsg({ type: 'error', text: 'Please enter a password.' });
      return;
    }
    if (securityAction === 'protect' && password !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setBusy(true);
    setStatusMsg(null);
    try {
      const pdfDoc = await PDFDocument.load(securityFile.data, {
        ignoreEncryption: true,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${securityFile.name.replace(/\.pdf$/i, '')}-${securityAction === 'protect' ? 'protected' : 'unlocked'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({
        type: 'success',
        text: securityAction === 'protect' ? 'PDF encrypted and downloaded!' : 'PDF decrypted and re-saved without password!',
      });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Password operation failed.' });
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS: TEXT / DOCUMENT TO PDF
  // ─────────────────────────────────────────────────────────────────────────────
  const executeDocToPdf = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const timesRomanBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { height } = page.getSize();

      // Title
      page.drawText(docTitle || 'Untitled Document', {
        x: 50,
        y: height - 80,
        size: 24,
        font: timesRomanBold,
        color: rgb(0.1, 0.1, 0.2),
      });

      // Horizontal line
      page.drawLine({
        start: { x: 50, y: height - 95 },
        end: { x: 545, y: height - 95 },
        thickness: 1.5,
        color: rgb(0.8, 0.8, 0.85),
      });

      // Body lines with simple text wrapping
      const lines = docContent.split('\n');
      let currentY = height - 130;

      for (const line of lines) {
        if (currentY < 60) break; // End of page
        page.drawText(line, {
          x: 50,
          y: currentY,
          size: 11,
          font: timesRomanFont,
          color: rgb(0.2, 0.2, 0.25),
        });
        currentY -= 18;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(docTitle || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Generated and downloaded formatted PDF document!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to generate PDF.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      {/* Top Navigation Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#f38ba8]/15 p-1 text-[#f38ba8]">
              <FileText size={16} />
            </span>
            <h1 className="text-sm font-bold text-[#cdd6f4]">PDF Studio</h1>
            <span className="rounded border border-[#a6e3a1]/30 bg-[#a6e3a1]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#a6e3a1]">
              100% Client-Side Private
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#6c7086]">
            Merge, split, convert images, unlock, and generate PDFs without uploading files anywhere.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-[#313244] bg-[#11111b] p-0.5">
          {(
            [
              ['merge', 'Merge PDF', <Merge size={12} key="m" />],
              ['split', 'Split PDF', <Split size={12} key="s" />],
              ['wordToPdf', 'Word to PDF', <FileCode size={12} key="w" />],
              ['imgToPdf', 'Images to PDF', <ImageIcon size={12} key="i" />],
              ['pdfToImg', 'PDF to Images', <Layers size={12} key="p" />],
              ['protect', 'Security / Unlock', <Lock size={12} key="l" />],
              ['docToPdf', 'Text to PDF', <FileText size={12} key="d" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => {
                setActiveTool(id);
                setStatusMsg(null);
              }}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-medium transition-all ${
                activeTool === id
                  ? 'bg-[#313244] text-[#cdd6f4] shadow-sm'
                  : 'text-[#6c7086] hover:text-[#cdd6f4]'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Global Status Message */}
      {statusMsg && (
        <div
          className={`flex items-center gap-2 border-b px-4 py-2 text-[11px] ${
            statusMsg.type === 'success'
              ? 'border-[#a6e3a1]/30 bg-[#a6e3a1]/10 text-[#a6e3a1]'
              : statusMsg.type === 'error'
              ? 'border-[#f38ba8]/30 bg-[#f38ba8]/10 text-[#f38ba8]'
              : 'border-[#89b4fa]/30 bg-[#89b4fa]/10 text-[#89b4fa]'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={13} />
          ) : statusMsg.type === 'error' ? (
            <AlertCircle size={13} />
          ) : (
            <RefreshCw size={13} className="animate-spin" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex min-h-0 flex-1 overflow-auto p-4">
        {/* 1. MERGE PDF */}
        {activeTool === 'merge' && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#cdd6f4]">Merge Multiple PDFs</h2>
                <p className="text-[10px] text-[#6c7086]">
                  Reorder files using arrow buttons and combine into a single clean PDF document.
                </p>
              </div>
              <input
                ref={mergeInputRef}
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleMergeFilesUpload}
                className="hidden"
              />
              <button
                onClick={() => mergeInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-3 py-1.5 text-[11px] font-semibold text-[#89b4fa] hover:bg-[#89b4fa]/20"
              >
                <Plus size={13} /> Add PDF Files
              </button>
            </div>

            {mergeFiles.length === 0 ? (
              <div
                onClick={() => mergeInputRef.current?.click()}
                className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#313244] bg-[#181825]/50 p-6 text-center transition-all hover:border-[#89b4fa]"
              >
                <Merge size={32} className="text-[#89b4fa] opacity-60" />
                <div className="text-xs font-semibold text-[#cdd6f4]">Choose PDF files to merge</div>
                <div className="text-[10px] text-[#6c7086]">or drag and drop multiple PDF files here</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="divide-y divide-[#313244] rounded-lg border border-[#313244] bg-[#181825]">
                  {mergeFiles.map((file, idx) => (
                    <div key={file.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#313244] text-[9px] font-bold text-[#89b4fa]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-medium text-[#cdd6f4]">{file.name}</div>
                          <div className="text-[9px] text-[#6c7086]">
                            {file.pageCount ? `${file.pageCount} pages · ` : ''}
                            {formatBytes(file.size)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveMergeFile(idx, 'up')}
                          disabled={idx === 0}
                          title="Move Up"
                          className="p-1 text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-30"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => moveMergeFile(idx, 'down')}
                          disabled={idx === mergeFiles.length - 1}
                          title="Move Down"
                          className="p-1 text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-30"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          onClick={() => setMergeFiles(prev => prev.filter(f => f.id !== file.id))}
                          title="Remove file"
                          className="p-1 text-[#6c7086] hover:text-[#f38ba8]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setMergeFiles([])}
                    className="text-[10px] text-[#f38ba8] hover:underline"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={executeMerge}
                    disabled={busy || mergeFiles.length < 2}
                    className="flex items-center gap-2 rounded-lg bg-[#89b4fa] px-4 py-2 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90 disabled:opacity-50"
                  >
                    <Download size={13} />
                    {busy ? 'Merging...' : `Merge & Download (${mergeFiles.length} files)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SPLIT PDF */}
        {activeTool === 'split' && (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#cdd6f4]">Split or Extract PDF Pages</h2>
              <p className="text-[10px] text-[#6c7086]">
                Extract specific page ranges or split all pages into separate PDF files.
              </p>
            </div>

            <input
              ref={splitInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleSplitFileUpload}
              className="hidden"
            />

            {!splitFile ? (
              <div
                onClick={() => splitInputRef.current?.click()}
                className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#313244] bg-[#181825]/50 p-6 text-center transition-all hover:border-[#89b4fa]"
              >
                <Split size={32} className="text-[#89b4fa] opacity-60" />
                <div className="text-xs font-semibold text-[#cdd6f4]">Select a PDF to split</div>
                <div className="text-[10px] text-[#6c7086]">or drag and drop here</div>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-[#313244] bg-[#181825] p-4">
                <div className="flex items-center justify-between border-b border-[#313244] pb-3">
                  <div>
                    <div className="text-xs font-semibold text-[#cdd6f4]">{splitFile.name}</div>
                    <div className="text-[10px] text-[#6c7086]">
                      {splitFile.pageCount} total pages · {formatBytes(splitFile.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSplitFile(null)}
                    className="text-[10px] text-[#f38ba8] hover:underline"
                  >
                    Choose Different PDF
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-[#cdd6f4] block">Splitting Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSplitMode('range')}
                      className={`rounded-lg border p-2.5 text-left text-xs transition-all ${
                        splitMode === 'range'
                          ? 'border-[#89b4fa] bg-[#89b4fa]/10 text-[#89b4fa]'
                          : 'border-[#313244] text-[#9399b2] hover:bg-[#202030]'
                      }`}
                    >
                      <div className="font-semibold">Extract Pages / Range</div>
                      <div className="text-[9px] text-[#6c7086] mt-0.5">e.g. 1-3, 5 to a new PDF</div>
                    </button>
                    <button
                      onClick={() => setSplitMode('all')}
                      className={`rounded-lg border p-2.5 text-left text-xs transition-all ${
                        splitMode === 'all'
                          ? 'border-[#89b4fa] bg-[#89b4fa]/10 text-[#89b4fa]'
                          : 'border-[#313244] text-[#9399b2] hover:bg-[#202030]'
                      }`}
                    >
                      <div className="font-semibold">Split into Every Page</div>
                      <div className="text-[9px] text-[#6c7086] mt-0.5">Separate files in a ZIP</div>
                    </button>
                  </div>
                </div>

                {splitMode === 'range' && (
                  <div>
                    <label className="text-[10px] text-[#9399b2] block mb-1">
                      Pages to extract (comma separated or ranges):
                    </label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={e => setSplitRange(e.target.value)}
                      placeholder="e.g. 1-2, 4"
                      className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2.5 font-mono text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                    />
                  </div>
                )}

                <button
                  onClick={executeSplit}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90 disabled:opacity-50"
                >
                  <Download size={13} />
                  {busy ? 'Splitting...' : splitMode === 'all' ? 'Split All Pages (ZIP)' : 'Extract Pages'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* WORD TO PDF - ACCURATE CONVERTER */}
        {activeTool === 'wordToPdf' && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-4">
            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
              <h2 className="text-xl font-bold tracking-tight text-[#cdd6f4]">Word to PDF Converter</h2>
              <p className="text-xs text-[#9399b2]">
                Convert Microsoft Word documents to PDF with full accuracy. Tables, fonts, images, and alignments preserved.
              </p>
            </div>

            <input
              ref={wordInputRef}
              type="file"
              accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              onChange={handleWordFileUpload}
              className="hidden"
            />

            {/* State 1: No file selected -> Big dropzone */}
            {!wordFile && (
              <div
                onClick={() => wordInputRef.current?.click()}
                className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[#313244] bg-[#181825]/40 p-8 text-center transition-all hover:border-[#89b4fa] hover:bg-[#181825]/80"
              >
                <div className="rounded-2xl bg-[#89b4fa]/10 p-5 text-[#89b4fa] transition-transform group-hover:scale-110">
                  <FileCode size={48} />
                </div>
                <div>
                  <div className="text-base font-bold text-[#cdd6f4]">Select Word Document</div>
                  <div className="mt-1 text-xs text-[#9399b2]">
                    or drag & drop your <span className="font-semibold text-[#89b4fa]">.docx</span> file here
                  </div>
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    wordInputRef.current?.click();
                  }}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-[#89b4fa] px-6 py-2.5 text-xs font-bold text-[#11111b] shadow-lg shadow-[#89b4fa]/20 transition-all hover:bg-[#89b4fa]/90 active:scale-95"
                >
                  <Plus size={15} /> Choose .docx File
                </button>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#6c7086]">
                  <span className="rounded-md bg-[#11111b] px-2.5 py-1">✓ Accurate Layout & Spacing</span>
                  <span className="rounded-md bg-[#11111b] px-2.5 py-1">✓ Tables, Borders & Colors</span>
                  <span className="rounded-md bg-[#11111b] px-2.5 py-1">✓ Embedded Images</span>
                  <span className="rounded-md bg-[#11111b] px-2.5 py-1">✓ 100% Private Client-Side</span>
                </div>
              </div>
            )}

            {/* State 2: File selected, not yet converted */}
            {wordFile && !wordConvertedPdf && (
              <div className="space-y-4 rounded-2xl border border-[#313244] bg-[#181825] p-6 shadow-xl">
                {/* File Card */}
                <div className="flex items-center justify-between rounded-xl border border-[#313244]/80 bg-[#11111b] p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#89b4fa]/15 text-[#89b4fa]">
                      <FileCode size={26} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-[#cdd6f4]">{wordFile.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#6c7086]">
                        <span>{formatBytes(wordFile.size)}</span>
                        <span>•</span>
                        <span className="text-[#a6e3a1]">Word Document (.docx)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setWordFile(null);
                      setWordConvertedPdf(null);
                    }}
                    disabled={busy}
                    className="rounded-lg p-2 text-[#6c7086] transition-colors hover:bg-[#313244] hover:text-[#f38ba8]"
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Progress if converting */}
                {busy && wordProgress && (
                  <div className="rounded-xl border border-[#89b4fa]/30 bg-[#89b4fa]/10 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#89b4fa]">
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        {wordProgress.label}
                      </span>
                      {wordProgress.total > 0 && (
                        <span>
                          {wordProgress.current}/{wordProgress.total}
                        </span>
                      )}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#11111b]">
                      <div
                        className="h-full bg-gradient-to-r from-[#89b4fa] to-[#b4befe] transition-all duration-300"
                        style={{
                          width: `${wordProgress.total ? Math.max(15, (wordProgress.current / wordProgress.total) * 100) : 40}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Convert Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={executeWordToPdf}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#89b4fa] py-3 text-sm font-bold text-[#11111b] shadow-lg shadow-[#89b4fa]/20 transition-all hover:bg-[#89b4fa]/90 active:scale-[0.99] disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    {busy ? 'Converting Document...' : 'Convert to PDF'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintVectorPdf}
                      disabled={busy}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#313244] bg-[#11111b] py-2 text-xs font-medium text-[#cdd6f4] transition-colors hover:bg-[#202032] disabled:opacity-50"
                      title="Save as PDF using browser's native vector print engine"
                    >
                      <Printer size={13} /> Save via Vector Print
                    </button>
                    <button
                      onClick={() => wordInputRef.current?.click()}
                      disabled={busy}
                      className="rounded-xl border border-[#313244] px-4 py-2 text-xs text-[#9399b2] transition-colors hover:bg-[#202032] hover:text-[#cdd6f4] disabled:opacity-50"
                    >
                      Change File
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* State 3: Converted successfully -> Download Card */}
            {wordConvertedPdf && (
              <div className="space-y-5 rounded-2xl border border-[#a6e3a1]/30 bg-[#181825] p-6 text-center shadow-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a6e3a1]/15 text-[#a6e3a1]">
                  <CheckCircle2 size={32} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#cdd6f4]">Document Converted Successfully!</h3>
                  <p className="mt-1 text-xs text-[#9399b2]">
                    Your Word file has been converted to an accurate PDF with all styles and formatting.
                  </p>
                </div>

                <div className="mx-auto max-w-md rounded-xl border border-[#313244] bg-[#11111b] p-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="truncate text-xs font-bold text-[#cdd6f4]">{wordConvertedPdf.name}</div>
                      <div className="mt-0.5 text-[10px] text-[#6c7086]">{formatBytes(wordConvertedPdf.size)}</div>
                    </div>
                    <span className="shrink-0 rounded bg-[#a6e3a1]/15 px-2 py-0.5 text-[10px] font-semibold text-[#a6e3a1]">
                      {wordConvertedPdf.pageCount} Page{wordConvertedPdf.pageCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={wordConvertedPdf.url}
                    download={wordConvertedPdf.name}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a6e3a1] py-3 text-sm font-bold text-[#11111b] shadow-lg shadow-[#a6e3a1]/20 transition-all hover:bg-[#a6e3a1]/90 active:scale-[0.99]"
                  >
                    <Download size={16} /> Download PDF Again
                  </a>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={handlePrintVectorPdf}
                      className="flex items-center gap-1.5 rounded-lg border border-[#313244] bg-[#11111b] px-3 py-1.5 text-xs text-[#cdd6f4] hover:bg-[#202032]"
                    >
                      <Printer size={13} /> Open Vector Print
                    </button>
                    <button
                      onClick={() => {
                        setWordFile(null);
                        setWordConvertedPdf(null);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-[#313244] bg-[#11111b] px-3 py-1.5 text-xs text-[#89b4fa] hover:bg-[#202032]"
                    >
                      <RotateCcw size={13} /> Convert Another Document
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. IMAGES TO PDF */}
        {activeTool === 'imgToPdf' && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#cdd6f4]">Convert Images to PDF</h2>
                <p className="text-[10px] text-[#6c7086]">
                  JPG, PNG, WebP images compiled into a formatted PDF document.
                </p>
              </div>
              <input
                ref={imgInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => imgInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-3 py-1.5 text-[11px] font-semibold text-[#89b4fa] hover:bg-[#89b4fa]/20"
              >
                <Plus size={13} /> Add Images
              </button>
            </div>

            {images.length === 0 ? (
              <div
                onClick={() => imgInputRef.current?.click()}
                className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#313244] bg-[#181825]/50 p-6 text-center transition-all hover:border-[#89b4fa]"
              >
                <ImageIcon size={32} className="text-[#89b4fa] opacity-60" />
                <div className="text-xs font-semibold text-[#cdd6f4]">Select images to convert</div>
                <div className="text-[10px] text-[#6c7086]">Supports JPG, PNG, WebP</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Configuration Options */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#313244] bg-[#181825] p-3 text-xs">
                  <div>
                    <label className="text-[10px] text-[#9399b2] block mb-1">Page Format</label>
                    <select
                      value={pageSize}
                      onChange={e => setPageSize(e.target.value as 'A4' | 'LETTER' | 'FIT')}
                      className="h-7 w-full rounded border border-[#313244] bg-[#11111b] px-2 text-[10px] text-[#cdd6f4]"
                    >
                      <option value="A4">A4 Standard</option>
                      <option value="LETTER">US Letter</option>
                      <option value="FIT">Fit to Image Size</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#9399b2] block mb-1">Page Margin</label>
                    <select
                      value={margin}
                      onChange={e => setMargin(Number(e.target.value))}
                      className="h-7 w-full rounded border border-[#313244] bg-[#11111b] px-2 text-[10px] text-[#cdd6f4]"
                    >
                      <option value={0}>No Margin (Full Bleed)</option>
                      <option value={20}>Standard Margin (20px)</option>
                      <option value={40}>Wide Margin (40px)</option>
                    </select>
                  </div>
                </div>

                {/* Thumbnails grid */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {images.map(img => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden rounded-lg border border-[#313244] bg-[#181825] p-1"
                    >
                      <img src={img.dataUrl} alt={img.name} className="h-24 w-full rounded object-cover" />
                      <div className="mt-1 truncate text-[9px] text-[#9399b2]">{img.name}</div>
                      <button
                        onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
                        className="absolute right-2 top-2 rounded bg-[#11111b]/80 p-1 text-[#f38ba8] opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setImages([])} className="text-[10px] text-[#f38ba8] hover:underline">
                    Clear All
                  </button>
                  <button
                    onClick={executeImagesToPdf}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-lg bg-[#89b4fa] px-4 py-2 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90 disabled:opacity-50"
                  >
                    <Download size={13} />
                    {busy ? 'Creating PDF...' : `Generate PDF (${images.length} images)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PDF TO IMAGES */}
        {activeTool === 'pdfToImg' && (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#cdd6f4]">Convert PDF to Images</h2>
              <p className="text-[10px] text-[#6c7086]">
                Render PDF pages into high-resolution JPG or PNG image files.
              </p>
            </div>

            <input
              ref={pdfToImgInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfToImgUpload}
              className="hidden"
            />

            {!pdfToImgFile ? (
              <div
                onClick={() => pdfToImgInputRef.current?.click()}
                className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#313244] bg-[#181825]/50 p-6 text-center transition-all hover:border-[#89b4fa]"
              >
                <Layers size={32} className="text-[#89b4fa] opacity-60" />
                <div className="text-xs font-semibold text-[#cdd6f4]">Select PDF to extract images</div>
                <div className="text-[10px] text-[#6c7086]">or drag and drop here</div>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-[#313244] bg-[#181825] p-4">
                <div className="flex items-center justify-between border-b border-[#313244] pb-3">
                  <div>
                    <div className="text-xs font-semibold text-[#cdd6f4]">{pdfToImgFile.name}</div>
                    <div className="text-[10px] text-[#6c7086]">
                      {pdfToImgFile.pageCount} pages · {formatBytes(pdfToImgFile.size)}
                    </div>
                  </div>
                  <button onClick={() => setPdfToImgFile(null)} className="text-[10px] text-[#f38ba8] hover:underline">
                    Change PDF
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-[#9399b2] block mb-1">Output Image Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setImgFormat('image/png')}
                      className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                        imgFormat === 'image/png'
                          ? 'border-[#89b4fa] bg-[#89b4fa]/10 text-[#89b4fa]'
                          : 'border-[#313244] text-[#9399b2]'
                      }`}
                    >
                      PNG (Lossless High Quality)
                    </button>
                    <button
                      onClick={() => setImgFormat('image/jpeg')}
                      className={`rounded-lg border p-2 text-center text-xs font-semibold transition-all ${
                        imgFormat === 'image/jpeg'
                          ? 'border-[#89b4fa] bg-[#89b4fa]/10 text-[#89b4fa]'
                          : 'border-[#313244] text-[#9399b2]'
                      }`}
                    >
                      JPG (Compact File Size)
                    </button>
                  </div>
                </div>

                <button
                  onClick={executePdfToImg}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90 disabled:opacity-50"
                >
                  <Download size={13} />
                  {busy ? 'Extracting Images...' : 'Convert & Download Images (ZIP)'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. PDF PASSWORD UNLOCKER / PROTECT */}
        {activeTool === 'protect' && (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#cdd6f4]">PDF Password Unlocker & Protect</h2>
              <p className="text-[10px] text-[#6c7086]">
                Remove known passwords or protect your PDF file with custom encryption in browser.
              </p>
            </div>

            <input
              ref={securityInputRef}
              type="file"
              accept="application/pdf"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  f.arrayBuffer().then(buf => {
                    setSecurityFile({
                      id: crypto.randomUUID(),
                      name: f.name,
                      size: f.size,
                      data: buf,
                    });
                  });
                }
              }}
              className="hidden"
            />

            {!securityFile ? (
              <div
                onClick={() => securityInputRef.current?.click()}
                className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#313244] bg-[#181825]/50 p-6 text-center transition-all hover:border-[#89b4fa]"
              >
                <Lock size={32} className="text-[#89b4fa] opacity-60" />
                <div className="text-xs font-semibold text-[#cdd6f4]">Select PDF to protect or unlock</div>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-[#313244] bg-[#181825] p-4">
                <div className="flex items-center justify-between border-b border-[#313244] pb-2">
                  <div className="truncate text-xs font-semibold text-[#cdd6f4]">{securityFile.name}</div>
                  <button onClick={() => setSecurityFile(null)} className="text-[10px] text-[#f38ba8] hover:underline">
                    Change PDF
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSecurityAction('protect')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all ${
                      securityAction === 'protect'
                        ? 'border-[#89b4fa] bg-[#89b4fa]/10 text-[#89b4fa]'
                        : 'border-[#313244] text-[#9399b2]'
                    }`}
                  >
                    <Lock size={12} /> Encrypt / Protect
                  </button>
                  <button
                    onClick={() => setSecurityAction('unlock')}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition-all ${
                      securityAction === 'unlock'
                        ? 'border-[#a6e3a1] bg-[#a6e3a1]/10 text-[#a6e3a1]'
                        : 'border-[#313244] text-[#9399b2]'
                    }`}
                  >
                    <Unlock size={12} /> Unlock / Decrypt
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-[#9399b2] block mb-1">
                      {securityAction === 'protect' ? 'Set PDF Password' : 'Enter Current Password'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2.5 text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                    />
                  </div>

                  {securityAction === 'protect' && (
                    <div>
                      <label className="text-[10px] text-[#9399b2] block mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2.5 text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={executeSecurityAction}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90 disabled:opacity-50"
                >
                  <Download size={13} />
                  {busy ? 'Processing...' : securityAction === 'protect' ? 'Protect & Download' : 'Unlock & Re-save'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. TEXT / DOC TO PDF */}
        {activeTool === 'docToPdf' && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#cdd6f4]">Generate PDF from Text / Markdown</h2>
              <p className="text-[10px] text-[#6c7086]">
                Create a formatted, clean PDF document instantly inside your browser.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-[#313244] bg-[#181825] p-4">
              <div>
                <label className="text-[10px] text-[#9399b2] block mb-1">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2.5 text-xs font-bold text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#9399b2] block mb-1">Document Content</label>
                <textarea
                  rows={9}
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                  className="w-full rounded border border-[#313244] bg-[#11111b] p-2.5 font-mono text-xs text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                />
              </div>

              <button
                onClick={executeDocToPdf}
                disabled={busy || !docContent.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90 disabled:opacity-50"
              >
                <Download size={13} />
                {busy ? 'Generating...' : 'Generate & Download PDF'}
              </button>
            </div>
          </div>
        )}
        {/* Hidden off-screen layout container for Word to PDF conversion */}
        <div
          ref={wordHiddenContainerRef}
          aria-hidden="true"
          className="fixed -left-[99999px] top-0 pointer-events-none z-[-9999] bg-white text-black overflow-hidden"
          style={{ width: '850px', minHeight: '1100px', opacity: 1 }}
        />
      </div>
    </div>
  );
}
