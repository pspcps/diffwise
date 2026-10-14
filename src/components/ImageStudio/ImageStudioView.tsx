import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon, Minimize2, Crop, FlipHorizontal, FlipVertical,
  RotateCw, RotateCcw, Download, Trash2, Sliders,
} from 'lucide-react';

type ImageTool = 'convert' | 'resize' | 'compress' | 'crop' | 'transform';

interface LoadedImage {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  src: string;
  file: File;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ImageStudioView() {
  const [activeTool, setActiveTool] = useState<ImageTool>('convert');
  const [image, setImage] = useState<LoadedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conversion state
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.9);

  // Resize state
  const [resizeWidth, setResizeWidth] = useState<number>(800);
  const [resizeHeight, setResizeHeight] = useState<number>(600);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const aspectRatioRef = useRef<number>(1);

  // Compression state
  const [compressQuality, setCompressQuality] = useState<number>(0.75);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);

  // Transform / Flip & Rotate state
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotation, setRotation] = useState<number>(0);

  // Cropper state
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 }); // percentage
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '16:9' | '4:3' | '9:16'>('free');
  const cropImageRef = useRef<HTMLImageElement>(null);
  const isDraggingCrop = useRef(false);
  const dragStartInfo = useRef<{
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e';
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
    imgW: number;
    imgH: number;
  }>({
    type: 'move',
    startX: 0,
    startY: 0,
    initX: 10,
    initY: 10,
    initW: 80,
    initH: 80,
    imgW: 1,
    imgH: 1,
  });

  const startCropDrag = (
    e: React.MouseEvent | React.TouchEvent,
    type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cropImageRef.current) return;
    const rect = cropImageRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    isDraggingCrop.current = true;
    dragStartInfo.current = {
      type,
      startX: clientX,
      startY: clientY,
      initX: cropBox.x,
      initY: cropBox.y,
      initW: cropBox.width,
      initH: cropBox.height,
      imgW: rect.width || 1,
      imgH: rect.height || 1,
    };

    const handleWindowMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDraggingCrop.current) return;
      const curX = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const curY = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
      const { type: handleType, startX, startY, initX, initY, initW, initH, imgW, imgH } =
        dragStartInfo.current;
      const deltaXPct = ((curX - startX) / imgW) * 100;
      const deltaYPct = ((curY - startY) / imgH) * 100;

      if (handleType === 'move') {
        const newX = Math.max(0, Math.min(100 - initW, initX + deltaXPct));
        const newY = Math.max(0, Math.min(100 - initH, initY + deltaYPct));
        setCropBox(prev => ({ ...prev, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 }));
      } else {
        let newX = initX;
        let newY = initY;
        let newW = initW;
        let newH = initH;

        if (handleType.includes('e')) {
          newW = Math.max(5, Math.min(100 - initX, initW + deltaXPct));
        }
        if (handleType.includes('s')) {
          newH = Math.max(5, Math.min(100 - initY, initH + deltaYPct));
        }
        if (handleType.includes('w')) {
          const maxDeltaLeft = initW - 5;
          const clampedDeltaX = Math.max(-initX, Math.min(maxDeltaLeft, deltaXPct));
          newX = initX + clampedDeltaX;
          newW = initW - clampedDeltaX;
        }
        if (handleType.includes('n')) {
          const maxDeltaTop = initH - 5;
          const clampedDeltaY = Math.max(-initY, Math.min(maxDeltaTop, deltaYPct));
          newY = initY + clampedDeltaY;
          newH = initH - clampedDeltaY;
        }

        setCropBox({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newW * 10) / 10,
          height: Math.round(newH * 10) / 10,
        });
      }
    };

    const handleWindowEnd = () => {
      isDraggingCrop.current = false;
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowEnd);
      window.removeEventListener('touchmove', handleWindowMove);
      window.removeEventListener('touchend', handleWindowEnd);
    };

    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowEnd);
    window.addEventListener('touchmove', handleWindowMove, { passive: false });
    window.addEventListener('touchend', handleWindowEnd);
  };

  // Load Image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const src = URL.createObjectURL(file);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      aspectRatioRef.current = img.naturalWidth / img.naturalHeight;
      setResizeWidth(img.naturalWidth);
      setResizeHeight(img.naturalHeight);
      setImage({
        name: file.name,
        size: file.size,
        type: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
        src,
        file,
      });
      // reset transforms
      setFlipH(false);
      setFlipV(false);
      setRotation(0);
      setCompressedDataUrl(null);
      setCompressedSize(null);
    };
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Resize dimensions sync
  const handleWidthChange = (val: number) => {
    setResizeWidth(val);
    if (keepAspect && aspectRatioRef.current) {
      setResizeHeight(Math.round(val / aspectRatioRef.current));
    }
  };

  const handleHeightChange = (val: number) => {
    setResizeHeight(val);
    if (keepAspect && aspectRatioRef.current) {
      setResizeWidth(Math.round(val * aspectRatioRef.current));
    }
  };

  const applyScalePercent = (percent: number) => {
    if (!image) return;
    const w = Math.round(image.width * (percent / 100));
    const h = Math.round(image.height * (percent / 100));
    setResizeWidth(w);
    setResizeHeight(h);
  };

  // Live compression preview
  const updateCompressionPreview = useCallback(async () => {
    if (!image) return;
    const img = new Image();
    img.src = image.src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>(res =>
      canvas.toBlob(res, targetFormat, compressQuality)
    );
    if (blob) {
      setCompressedSize(blob.size);
      const url = URL.createObjectURL(blob);
      setCompressedDataUrl(url);
    }
  }, [image, targetFormat, compressQuality]);

  useEffect(() => {
    if (activeTool === 'compress' && image) {
      updateCompressionPreview();
    }
  }, [activeTool, image, compressQuality, targetFormat, updateCompressionPreview]);

  // Export / Download generated image
  const executeDownload = async (actionType: ImageTool) => {
    if (!image) return;

    const img = new Image();
    img.src = image.src;
    await img.decode();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let outWidth = img.naturalWidth;
    let outHeight = img.naturalHeight;
    const mimeType = targetFormat;
    let outQuality = quality;

    if (actionType === 'resize') {
      outWidth = resizeWidth;
      outHeight = resizeHeight;
      canvas.width = outWidth;
      canvas.height = outHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, outWidth, outHeight);
    } else if (actionType === 'compress') {
      canvas.width = outWidth;
      canvas.height = outHeight;
      outQuality = compressQuality;
      ctx.drawImage(img, 0, 0);
    } else if (actionType === 'transform') {
      const isRotated90or270 = rotation % 180 !== 0;
      canvas.width = isRotated90or270 ? outHeight : outWidth;
      canvas.height = isRotated90or270 ? outWidth : outHeight;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -outWidth / 2, -outHeight / 2);
      ctx.restore();
    } else if (actionType === 'crop') {
      const cropPxX = (cropBox.x / 100) * img.naturalWidth;
      const cropPxY = (cropBox.y / 100) * img.naturalHeight;
      const cropPxW = (cropBox.width / 100) * img.naturalWidth;
      const cropPxH = (cropBox.height / 100) * img.naturalHeight;

      canvas.width = cropPxW;
      canvas.height = cropPxH;
      ctx.drawImage(img, cropPxX, cropPxY, cropPxW, cropPxH, 0, 0, cropPxW, cropPxH);
    } else {
      // Convert
      canvas.width = outWidth;
      canvas.height = outHeight;
      ctx.drawImage(img, 0, 0);
    }

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mimeType, outQuality));
    if (!blob) return;

    const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
    const baseName = image.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-${actionType}.${ext}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick 1-click Preset Converters
  const applyPreset = (format: 'image/jpeg' | 'image/png' | 'image/webp') => {
    setTargetFormat(format);
    setActiveTool('convert');
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      {/* Top Header / Mode Switcher */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#89b4fa]/15 p-1 text-[#89b4fa]">
              <ImageIcon size={16} />
            </span>
            <h1 className="text-sm font-bold text-[#cdd6f4]">Image Studio</h1>
            <span className="rounded border border-[#a6e3a1]/30 bg-[#a6e3a1]/10 px-1.5 py-0.5 text-[9px] font-medium text-[#a6e3a1]">
              100% Client-Side Fast
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#6c7086]">
            Convert, resize, compress, crop, and transform images in real-time with zero server uploads.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-[#313244] bg-[#11111b] p-0.5">
          {(
            [
              ['convert', 'Format Converter', <ImageIcon size={12} key="c" />],
              ['resize', 'Resize Dimensions', <Minimize2 size={12} key="r" />],
              ['compress', 'Compress Quality', <Sliders size={12} key="cp" />],
              ['crop', 'Crop Tool', <Crop size={12} key="cr" />],
              ['transform', 'Flip & Rotate', <RotateCw size={12} key="t" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setActiveTool(id)}
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

      {/* Main Studio Body */}
      <div className="flex min-h-0 flex-1 overflow-auto p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {!image ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="m-auto flex min-h-[300px] w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#313244] bg-[#181825]/60 p-8 text-center transition-all hover:border-[#89b4fa]"
          >
            <div className="rounded-2xl bg-[#89b4fa]/10 p-4 text-[#89b4fa]">
              <ImageIcon size={38} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#cdd6f4]">Choose or drop an image</div>
              <div className="text-[11px] text-[#6c7086] mt-1">Supports PNG, JPG, WebP, AVIF, SVG, GIF, BMP</div>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="rounded border border-[#313244] bg-[#11111b] px-2 py-1 text-[9px] text-[#9399b2]">
                1-Click Preset Converters
              </span>
              <span className="rounded border border-[#313244] bg-[#11111b] px-2 py-1 text-[9px] text-[#9399b2]">
                Lossless Cropper
              </span>
              <span className="rounded border border-[#313244] bg-[#11111b] px-2 py-1 text-[9px] text-[#9399b2]">
                Live Compressor
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* Visual Preview Canvas */}
            <div className="flex flex-col rounded-xl border border-[#313244] bg-[#181825] p-4">
              <div className="flex items-center justify-between border-b border-[#313244] pb-2 text-xs">
                <div className="truncate font-medium text-[#cdd6f4]">{image.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-[#9399b2]">
                  <span>{image.width} × {image.height} px</span>
                  <span>·</span>
                  <span>{formatBytes(image.size)}</span>
                  <button
                    onClick={() => setImage(null)}
                    title="Remove image"
                    className="text-[#6c7086] hover:text-[#f38ba8]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Image Viewport */}
              <div className="relative my-4 flex min-h-[340px] flex-1 items-center justify-center overflow-hidden rounded-lg bg-[#11111b] p-4">
                {activeTool === 'crop' ? (
                  <div className="relative inline-block select-none rounded p-1">
                    <img
                      ref={cropImageRef}
                      src={image.src}
                      alt="Crop preview"
                      className="max-h-[380px] max-w-full rounded object-contain block pointer-events-none"
                    />

                    {/* Darkened overlay outside the crop box */}
                    <div
                      className="absolute inset-0 bg-black/60 pointer-events-none"
                      style={{
                        clipPath: `polygon(
                          0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                          ${cropBox.x}% ${cropBox.y}%,
                          ${cropBox.x}% ${cropBox.y + cropBox.height}%,
                          ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%,
                          ${cropBox.x + cropBox.width}% ${cropBox.y}%,
                          ${cropBox.x}% ${cropBox.y}%
                        )`,
                      }}
                    />

                    {/* Interactive Draggable & Resizable Crop Box */}
                    <div
                      className="absolute border-2 border-[#89b4fa] shadow-2xl cursor-move group"
                      style={{
                        left: `${cropBox.x}%`,
                        top: `${cropBox.y}%`,
                        width: `${cropBox.width}%`,
                        height: `${cropBox.height}%`,
                      }}
                      onMouseDown={e => startCropDrag(e, 'move')}
                    >
                      {/* Rule of Thirds Grid Lines */}
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-white" />
                        <div className="border-r border-white" />
                        <div />
                      </div>

                      {/* 4 Corner Resize Handles */}
                      <div
                        onMouseDown={e => startCropDrag(e, 'nw')}
                        onTouchStart={e => startCropDrag(e, 'nw')}
                        title="Drag to resize top-left"
                        className="absolute -top-3 -left-3 h-6 w-6 flex items-center justify-center cursor-nwse-resize z-20"
                      >
                        <div className="h-3.5 w-3.5 rounded-full bg-[#89b4fa] border-2 border-white shadow-md hover:scale-125 transition-transform" />
                      </div>

                      <div
                        onMouseDown={e => startCropDrag(e, 'ne')}
                        onTouchStart={e => startCropDrag(e, 'ne')}
                        title="Drag to resize top-right"
                        className="absolute -top-3 -right-3 h-6 w-6 flex items-center justify-center cursor-nesw-resize z-20"
                      >
                        <div className="h-3.5 w-3.5 rounded-full bg-[#89b4fa] border-2 border-white shadow-md hover:scale-125 transition-transform" />
                      </div>

                      <div
                        onMouseDown={e => startCropDrag(e, 'sw')}
                        onTouchStart={e => startCropDrag(e, 'sw')}
                        title="Drag to resize bottom-left"
                        className="absolute -bottom-3 -left-3 h-6 w-6 flex items-center justify-center cursor-nesw-resize z-20"
                      >
                        <div className="h-3.5 w-3.5 rounded-full bg-[#89b4fa] border-2 border-white shadow-md hover:scale-125 transition-transform" />
                      </div>

                      <div
                        onMouseDown={e => startCropDrag(e, 'se')}
                        onTouchStart={e => startCropDrag(e, 'se')}
                        title="Drag to resize bottom-right"
                        className="absolute -bottom-3 -right-3 h-6 w-6 flex items-center justify-center cursor-nwse-resize z-20"
                      >
                        <div className="h-3.5 w-3.5 rounded-full bg-[#89b4fa] border-2 border-white shadow-md hover:scale-125 transition-transform" />
                      </div>

                      {/* 4 Edge Resize Handles */}
                      <div
                        onMouseDown={e => startCropDrag(e, 'n')}
                        onTouchStart={e => startCropDrag(e, 'n')}
                        title="Drag to resize top edge"
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-5 w-12 flex items-center justify-center cursor-ns-resize z-20"
                      >
                        <div className="h-2 w-8 rounded-full bg-[#89b4fa] border border-white hover:bg-white shadow" />
                      </div>

                      <div
                        onMouseDown={e => startCropDrag(e, 's')}
                        onTouchStart={e => startCropDrag(e, 's')}
                        title="Drag to resize bottom edge"
                        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 h-5 w-12 flex items-center justify-center cursor-ns-resize z-20"
                      >
                        <div className="h-2 w-8 rounded-full bg-[#89b4fa] border border-white hover:bg-white shadow" />
                      </div>

                      <div
                        onMouseDown={e => startCropDrag(e, 'w')}
                        onTouchStart={e => startCropDrag(e, 'w')}
                        title="Drag to resize left edge"
                        className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-12 flex items-center justify-center cursor-ew-resize z-20"
                      >
                        <div className="w-2 h-8 rounded-full bg-[#89b4fa] border border-white hover:bg-white shadow" />
                      </div>

                      <div
                        onMouseDown={e => startCropDrag(e, 'e')}
                        onTouchStart={e => startCropDrag(e, 'e')}
                        title="Drag to resize right edge"
                        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-12 flex items-center justify-center cursor-ew-resize z-20"
                      >
                        <div className="w-2 h-8 rounded-full bg-[#89b4fa] border border-white hover:bg-white shadow" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={compressedDataUrl || image.src}
                    alt="Preview"
                    className="max-h-[360px] max-w-full rounded object-contain transition-transform"
                    style={{
                      transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) rotate(${rotation}deg)`,
                    }}
                  />
                )}
              </div>

              {/* Quick Preset Buttons Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#313244] pt-3 text-[10px]">
                <span className="text-[#6c7086]">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => applyPreset('image/jpeg')}
                    className="rounded border border-[#313244] bg-[#11111b] px-2 py-1 text-[#cdd6f4] hover:border-[#89b4fa]"
                  >
                    Convert to JPG
                  </button>
                  <button
                    onClick={() => applyPreset('image/png')}
                    className="rounded border border-[#313244] bg-[#11111b] px-2 py-1 text-[#cdd6f4] hover:border-[#89b4fa]"
                  >
                    Convert to PNG
                  </button>
                  <button
                    onClick={() => applyPreset('image/webp')}
                    className="rounded border border-[#313244] bg-[#11111b] px-2 py-1 text-[#cdd6f4] hover:border-[#89b4fa]"
                  >
                    Convert to WebP
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Controls Panel */}
            <div className="flex flex-col gap-4 rounded-xl border border-[#313244] bg-[#181825] p-4">
              {/* 1. FORMAT CONVERTER */}
              {activeTool === 'convert' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#cdd6f4]">Convert Image Format</h3>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#9399b2] block">Target Format</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ['image/jpeg', 'JPG'],
                          ['image/png', 'PNG'],
                          ['image/webp', 'WebP'],
                        ] as const
                      ).map(([fmt, label]) => (
                        <button
                          key={fmt}
                          onClick={() => setTargetFormat(fmt)}
                          className={`rounded border py-1.5 text-xs font-semibold transition-all ${
                            targetFormat === fmt
                              ? 'border-[#89b4fa] bg-[#89b4fa]/15 text-[#89b4fa]'
                              : 'border-[#313244] text-[#9399b2]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {targetFormat !== 'image/png' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#9399b2]">
                        <span>Quality</span>
                        <span className="font-mono text-[#89b4fa] font-bold">{Math.round(quality * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={quality}
                        onChange={e => setQuality(Number(e.target.value))}
                        className="w-full accent-[#89b4fa]"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => executeDownload('convert')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2.5 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90"
                  >
                    <Download size={14} /> Download Converted File
                  </button>
                </div>
              )}

              {/* 2. RESIZE DIMENSIONS */}
              {activeTool === 'resize' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#cdd6f4]">Change Dimensions</h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#9399b2] block mb-1">Width (px)</label>
                      <input
                        type="number"
                        min="1"
                        value={resizeWidth}
                        onChange={e => handleWidthChange(Number(e.target.value))}
                        className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-xs text-[#cdd6f4]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#9399b2] block mb-1">Height (px)</label>
                      <input
                        type="number"
                        min="1"
                        value={resizeHeight}
                        onChange={e => handleHeightChange(Number(e.target.value))}
                        className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-xs text-[#cdd6f4]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[10px] text-[#cdd6f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepAspect}
                      onChange={e => setKeepAspect(e.target.checked)}
                      className="accent-[#89b4fa]"
                    />
                    <span>Lock Aspect Ratio ({image ? (image.width / image.height).toFixed(2) : '1.00'}:1)</span>
                  </label>

                  <div>
                    <label className="text-[10px] text-[#9399b2] block mb-1.5">Preset Scales</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[25, 50, 75, 150].map(pct => (
                        <button
                          key={pct}
                          onClick={() => applyScalePercent(pct)}
                          className="rounded border border-[#313244] bg-[#11111b] py-1 text-[10px] text-[#cdd6f4] hover:border-[#89b4fa]"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => executeDownload('resize')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2.5 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90"
                  >
                    <Download size={14} /> Download Resized Image
                  </button>
                </div>
              )}

              {/* 3. COMPRESS QUALITY */}
              {activeTool === 'compress' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#cdd6f4]">Compress Image</h3>

                  <div className="rounded-lg border border-[#313244] bg-[#11111b] p-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#9399b2]">Original Size:</span>
                      <span className="font-mono text-[#cdd6f4]">{formatBytes(image.size)}</span>
                    </div>
                    {compressedSize !== null && (
                      <div className="flex justify-between">
                        <span className="text-[#9399b2]">New Estimated:</span>
                        <span className="font-mono font-bold text-[#a6e3a1]">
                          {formatBytes(compressedSize)}
                          {image.size > compressedSize && (
                            <span className="ml-1 text-[10px] text-[#a6e3a1]">
                              (-{Math.round(((image.size - compressedSize) / image.size) * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#9399b2]">
                      <span>Compression Level</span>
                      <span className="font-mono text-[#89b4fa] font-bold">
                        {Math.round(compressQuality * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={compressQuality}
                      onChange={e => setCompressQuality(Number(e.target.value))}
                      className="w-full accent-[#89b4fa]"
                    />
                  </div>

                  <button
                    onClick={() => executeDownload('compress')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2.5 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90"
                  >
                    <Download size={14} /> Download Compressed Image
                  </button>
                </div>
              )}

              {/* 4. CROP TOOL */}
              {activeTool === 'crop' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#cdd6f4]">Crop Area Settings</h3>
                    <span className="font-mono text-[9px] text-[#89b4fa]">
                      {Math.round((cropBox.width / 100) * image.width)} × {Math.round((cropBox.height / 100) * image.height)} px
                    </span>
                  </div>

                  {/* Aspect Ratio Presets */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#9399b2] block">Aspect Ratio</label>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      {(
                        [
                          ['free', 'Free'],
                          ['1:1', '1:1 Square'],
                          ['16:9', '16:9'],
                          ['4:3', '4:3'],
                          ['9:16', '9:16 Story'],
                        ] as const
                      ).map(([asp, lbl]) => (
                        <button
                          key={asp}
                          onClick={() => {
                            setCropAspect(asp);
                            if (asp === '1:1') {
                              setCropBox({ x: 15, y: 15, width: 70, height: 70 });
                            } else if (asp === '16:9') {
                              setCropBox({ x: 10, y: 25, width: 80, height: 45 });
                            } else if (asp === '9:16') {
                              setCropBox({ x: 25, y: 10, width: 50, height: 80 });
                            } else {
                              setCropBox({ x: 10, y: 10, width: 80, height: 80 });
                            }
                          }}
                          className={`rounded border py-1 font-medium transition-all ${
                            cropAspect === asp
                              ? 'border-[#89b4fa] bg-[#89b4fa]/15 text-[#89b4fa]'
                              : 'border-[#313244] text-[#9399b2] hover:text-[#cdd6f4]'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Size Presets */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#9399b2] block">Quick Coverage Size</label>
                    <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                      <button
                        onClick={() => setCropBox({ x: 0, y: 0, width: 100, height: 100 })}
                        className="rounded border border-[#313244] bg-[#181825] py-1 text-[#cdd6f4] hover:border-[#89b4fa]/50"
                      >
                        Full 100%
                      </button>
                      <button
                        onClick={() => setCropBox({ x: 10, y: 10, width: 80, height: 80 })}
                        className="rounded border border-[#313244] bg-[#181825] py-1 text-[#cdd6f4] hover:border-[#89b4fa]/50"
                      >
                        Center 80%
                      </button>
                      <button
                        onClick={() => setCropBox({ x: 25, y: 25, width: 50, height: 50 })}
                        className="rounded border border-[#313244] bg-[#181825] py-1 text-[#cdd6f4] hover:border-[#89b4fa]/50"
                      >
                        Center 50%
                      </button>
                    </div>
                  </div>

                  {/* Width & Height Dimension Controls */}
                  <div className="space-y-3 rounded-lg border border-[#313244] bg-[#181825] p-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#9399b2]">Crop Width:</span>
                        <div className="flex items-center gap-1 font-mono text-[9px] text-[#cdd6f4]">
                          <input
                            type="number"
                            min={5}
                            max={100 - cropBox.x}
                            value={Math.round(cropBox.width)}
                            onChange={e => {
                              const val = Math.max(5, Math.min(100 - cropBox.x, Number(e.target.value)));
                              setCropBox(prev => ({ ...prev, width: val }));
                            }}
                            className="w-12 rounded border border-[#313244] bg-[#11111b] px-1 py-0.5 text-right text-[10px]"
                          />
                          <span>% ({Math.round((cropBox.width / 100) * image.width)}px)</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100 - cropBox.x}
                        value={cropBox.width}
                        onChange={e => setCropBox(prev => ({ ...prev, width: Number(e.target.value) }))}
                        className="w-full accent-[#89b4fa]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#9399b2]">Crop Height:</span>
                        <div className="flex items-center gap-1 font-mono text-[9px] text-[#cdd6f4]">
                          <input
                            type="number"
                            min={5}
                            max={100 - cropBox.y}
                            value={Math.round(cropBox.height)}
                            onChange={e => {
                              const val = Math.max(5, Math.min(100 - cropBox.y, Number(e.target.value)));
                              setCropBox(prev => ({ ...prev, height: val }));
                            }}
                            className="w-12 rounded border border-[#313244] bg-[#11111b] px-1 py-0.5 text-right text-[10px]"
                          />
                          <span>% ({Math.round((cropBox.height / 100) * image.height)}px)</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100 - cropBox.y}
                        value={cropBox.height}
                        onChange={e => setCropBox(prev => ({ ...prev, height: Number(e.target.value) }))}
                        className="w-full accent-[#89b4fa]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#313244]/40 text-[9px]">
                      <div>
                        <span className="text-[#9399b2] block mb-0.5">X Offset: {Math.round(cropBox.x)}%</span>
                        <input
                          type="range"
                          min={0}
                          max={100 - cropBox.width}
                          value={cropBox.x}
                          onChange={e => setCropBox(prev => ({ ...prev, x: Number(e.target.value) }))}
                          className="w-full accent-[#89b4fa]"
                        />
                      </div>
                      <div>
                        <span className="text-[#9399b2] block mb-0.5">Y Offset: {Math.round(cropBox.y)}%</span>
                        <input
                          type="range"
                          min={0}
                          max={100 - cropBox.height}
                          value={cropBox.y}
                          onChange={e => setCropBox(prev => ({ ...prev, y: Number(e.target.value) }))}
                          className="w-full accent-[#89b4fa]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#313244] bg-[#11111b] p-2 text-[10px] text-[#9399b2]">
                    Drag the circular corner/edge handles on the image preview or use the sliders above to change the crop size.
                  </div>

                  <button
                    onClick={() => executeDownload('crop')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2.5 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90"
                  >
                    <Download size={14} /> Download Cropped Image
                  </button>
                </div>
              )}

              {/* 5. FLIP & ROTATE */}
              {activeTool === 'transform' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#cdd6f4]">Flip & Rotate</h3>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFlipH(v => !v)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all ${
                        flipH
                          ? 'border-[#89b4fa] bg-[#89b4fa]/15 text-[#89b4fa]'
                          : 'border-[#313244] text-[#cdd6f4]'
                      }`}
                    >
                      <FlipHorizontal size={13} /> Flip Horizontal
                    </button>
                    <button
                      onClick={() => setFlipV(v => !v)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium transition-all ${
                        flipV
                          ? 'border-[#89b4fa] bg-[#89b4fa]/15 text-[#89b4fa]'
                          : 'border-[#313244] text-[#cdd6f4]'
                      }`}
                    >
                      <FlipVertical size={13} /> Flip Vertical
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-[#313244] p-2 text-xs font-medium text-[#cdd6f4] hover:bg-[#202030]"
                    >
                      <RotateCcw size={13} /> Rotate -90°
                    </button>
                    <button
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-[#313244] p-2 text-xs font-medium text-[#cdd6f4] hover:bg-[#202030]"
                    >
                      <RotateCw size={13} /> Rotate +90°
                    </button>
                  </div>

                  <div className="rounded-lg border border-[#313244] bg-[#11111b] p-2.5 text-[10px] text-[#9399b2] flex justify-between">
                    <span>Current Rotation:</span>
                    <span className="font-mono text-[#89b4fa] font-bold">{rotation}°</span>
                  </div>

                  <button
                    onClick={() => executeDownload('transform')}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#89b4fa] py-2.5 text-xs font-bold text-[#11111b] hover:bg-[#89b4fa]/90"
                  >
                    <Download size={14} /> Download Transformed Image
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
