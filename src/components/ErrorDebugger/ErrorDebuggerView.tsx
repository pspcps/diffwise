import React, { useState, useMemo } from 'react';
import {
  Bug,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  FileCode,
  Layers,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Download,
  Terminal,
  Sparkles,
  GitCommit,
  CheckCircle2,
  Code2,
  FileText,
  Search,
} from 'lucide-react';
import { parseErrorLog } from './parser';
import { DEBUG_PRESETS, type DebugPreset } from './presets';
import type { ParsedLogData, LayerType } from './types';

export const ErrorDebuggerView: React.FC = () => {
  const [inputLog, setInputLog] = useState<string>(DEBUG_PRESETS[0].log);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEBUG_PRESETS[0].id);
  const [activeTab, setActiveTab] = useState<'flow' | 'stack' | 'diagnosis' | 'context' | 'raw'>('flow');
  const [onlyAppCode, setOnlyAppCode] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [expandedFrameId, setExpandedFrameId] = useState<string | null>(null);

  // Parse error log deterministically with useMemo
  const parsedData: ParsedLogData = useMemo(() => {
    return parseErrorLog(inputLog);
  }, [inputLog]);

  // Filtered frames
  const filteredFrames = useMemo(() => {
    return parsedData.frames.filter(frame => {
      if (onlyAppCode && !frame.isAppCode) return false;
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const haystack = `${frame.method} ${frame.classOrNamespace} ${frame.fileName} ${frame.layer}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }, [parsedData.frames, onlyAppCode, searchFilter]);

  // Copy raw input
  const handleCopyRaw = async () => {
    await navigator.clipboard.writeText(inputLog);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Copy diagnosis report
  const handleCopyReport = async () => {
    const report = `=====================================================
DEBUGLOW INCIDENT & ROOT CAUSE INVESTIGATION REPORT
=====================================================
Exception Type:    ${parsedData.exceptionType || 'Unknown'}
Method:            ${parsedData.exceptionMethod || 'N/A'}
Level / Severity:  ${parsedData.level}
Timestamp:         ${parsedData.timestamp || 'N/A'}
Language / Runtime:${parsedData.language.toUpperCase()}
Format:            ${parsedData.format.toUpperCase()}

-----------------------------------------------------
CULPRIT & CRASH SITE
-----------------------------------------------------
Culprit Layer:     ${parsedData.rootCause.culpritLayer || 'N/A'}
Source Location:   ${parsedData.rootCause.fileAndLine || 'N/A'}
App Crash Frame:   ${parsedData.appCrashSiteFrame?.classOrNamespace}.${parsedData.appCrashSiteFrame?.method || 'N/A'}
                   ${parsedData.appCrashSiteFrame?.filePath || ''}${parsedData.appCrashSiteFrame?.lineNumber ? `:${parsedData.appCrashSiteFrame.lineNumber}` : ''}

-----------------------------------------------------
ROOT CAUSE SUMMARY
-----------------------------------------------------
Title:             ${parsedData.rootCause.title}
Description:       ${parsedData.rootCause.description}

PROBABLE CAUSES:
${parsedData.rootCause.probableCauses.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}

ACTIONABLE REMEDIATIONS:
${parsedData.rootCause.actionableFixes.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}

-----------------------------------------------------
CHRONOLOGICAL EXECUTION PATH
-----------------------------------------------------
${parsedData.executionPath.map((f, idx) => `  ${idx + 1}. [${f.layer.toUpperCase()}] ${f.classOrNamespace}.${f.method}${f.fileName ? ` (${f.fileName}:${f.lineNumber ?? '?'})` : ''}`).join('\n')}

-----------------------------------------------------
LOG CONTEXT VARIABLES
-----------------------------------------------------
${Object.entries(parsedData.context).map(([k, v]) => `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')}
=====================================================`;

    await navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Download report file
  const handleDownloadReport = () => {
    const reportText = JSON.stringify(parsedData, null, 2);
    const blob = new Blob([reportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debugflow-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const layerColor = (layer: LayerType) => {
    switch (layer) {
      case 'controller':
        return 'text-[#89b4fa] bg-[#89b4fa]/10 border-[#89b4fa]/30';
      case 'service':
        return 'text-[#cba6f7] bg-[#cba6f7]/10 border-[#cba6f7]/30';
      case 'accessor':
      case 'client':
        return 'text-[#f9e2af] bg-[#f9e2af]/10 border-[#f9e2af]/30';
      case 'repository':
        return 'text-[#a6e3a1] bg-[#a6e3a1]/10 border-[#a6e3a1]/30';
      case 'middleware':
        return 'text-[#fab387] bg-[#fab387]/10 border-[#fab387]/30';
      case 'system':
        return 'text-[#6c7086] bg-[#313244]/40 border-[#45475a]';
      default:
        return 'text-[#9399b2] bg-[#313244]/20 border-[#313244]';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181825] text-[#cdd6f4] select-text overflow-hidden font-sans">
      {/* ── Top Header Bar ── */}
      <div className="shrink-0 bg-[#1e1e2e] border-b border-[#313244] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f38ba8]/20 to-[#fab387]/20 border border-[#f38ba8]/30 flex items-center justify-center text-[#f38ba8]">
            <Bug size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">
                DebugFlow — Universal Log &amp; Stack Trace Analyzer
              </h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/30">
                100% Deterministic Engine
              </span>
            </div>
            <p className="text-[11px] text-[#9399b2] mt-0.5">
              Multi-language stack trace disassembler, root-cause synthesizer, and chronological call flow mapper (Zero-AI, Air-Gapped).
            </p>
          </div>
        </div>

        {/* Preset Selector & Quick Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#6c7086] font-medium hidden sm:inline">Presets:</span>
          {DEBUG_PRESETS.map((preset: DebugPreset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPresetId(preset.id);
                setInputLog(preset.log);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedPresetId === preset.id
                  ? 'bg-[#89b4fa] text-[#11111b] font-bold shadow-md shadow-[#89b4fa]/20'
                  : 'bg-[#313244] text-[#a6adc8] hover:text-white hover:bg-[#45475a]'
              }`}
              title={preset.description}
            >
              {preset.badge}
            </button>
          ))}

          <div className="h-4 w-px bg-[#313244] mx-1" />

          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#313244] hover:bg-[#45475a] text-white transition-colors border border-white/5"
            title="Copy structured incident report"
          >
            {copiedReport ? <Check size={13} className="text-[#a6e3a1]" /> : <FileText size={13} />}
            <span>{copiedReport ? 'Report Copied!' : 'Copy Report'}</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#89b4fa]/15 hover:bg-[#89b4fa]/25 text-[#89b4fa] transition-colors border border-[#89b4fa]/30"
            title="Download JSON analysis report"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Download JSON</span>
          </button>
        </div>
      </div>

      {/* ── Main Workspace: Two-Column Split (Left: Input & Metadata, Right: Diagnostic & Flow) ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Input Log / JSON Editor */}
        <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 border-r border-[#313244] flex flex-col bg-[#181825] min-h-[220px] lg:min-h-0">
          <div className="bg-[#1e1e2e]/70 px-3.5 py-2 border-b border-[#313244] flex items-center justify-between text-xs font-mono">
            <span className="text-[#a6adc8] flex items-center gap-2">
              <Terminal size={13} className="text-[#89b4fa]" />
              <span>Input Log / Stack Trace</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRaw}
                className="text-[11px] text-[#9399b2] hover:text-white flex items-center gap-1 transition-colors"
                title="Copy raw log"
              >
                {copiedRaw ? <Check size={11} className="text-[#a6e3a1]" /> : <Copy size={11} />}
                <span>{copiedRaw ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => setInputLog('')}
                className="text-[11px] text-[#9399b2] hover:text-[#f38ba8] flex items-center gap-1 transition-colors"
                title="Clear input"
              >
                <RotateCcw size={11} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 min-h-0 p-2 bg-[#11111b]">
            <textarea
              value={inputLog}
              onChange={e => {
                setInputLog(e.target.value);
                setSelectedPresetId('');
              }}
              placeholder="Paste raw error log, JSON payload, or stacktrace here..."
              spellCheck={false}
              className="w-full h-full p-2.5 bg-transparent text-xs font-mono text-[#cdd6f4] placeholder-[#585b70] resize-none outline-none leading-relaxed overflow-auto"
            />
          </div>

          {/* Input Format & Detection Strip */}
          <div className="shrink-0 bg-[#1e1e2e] border-t border-[#313244] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9399b2]">Detected Language:</span>
              <span className="font-mono font-bold text-white uppercase px-2 py-0.5 rounded bg-[#313244] text-[11px]">
                {parsedData.language}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9399b2]">Log Format:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                  parsedData.format === 'repaired_json'
                    ? 'bg-[#fab387]/20 text-[#fab387] border border-[#fab387]/40'
                    : parsedData.format === 'json'
                    ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
                    : 'bg-[#313244] text-[#cdd6f4]'
                }`}
              >
                {parsedData.format === 'repaired_json' ? 'Auto-Repaired JSON' : parsedData.format.toUpperCase()}
              </span>
            </div>

            {parsedData.timestamp && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9399b2]">Timestamp:</span>
                <span className="font-mono text-[#cdd6f4] text-[11px] truncate max-w-[240px]">
                  {parsedData.timestamp}
                </span>
              </div>
            )}

            {parsedData.level && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9399b2]">Severity Level:</span>
                <span
                  className={`font-mono font-black text-[11px] px-2 py-0.5 rounded ${
                    parsedData.level === 'FATAL' || parsedData.level === 'CRITICAL' || parsedData.level === 'ERROR'
                      ? 'bg-[#f38ba8]/20 text-[#f38ba8] border border-[#f38ba8]/30'
                      : 'bg-[#fab387]/20 text-[#fab387]'
                  }`}
                >
                  {parsedData.level}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Diagnostics, Execution Flow & Stack Explorer */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#181825] overflow-hidden">
          {/* Culprit Headline Banner */}
          <div className="shrink-0 bg-[#1e1e2e]/90 border-b border-[#313244] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f38ba8]/15 border border-[#f38ba8]/30 flex items-center justify-center text-[#f38ba8] shrink-0 mt-0.5">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-[#f38ba8]/20 text-[#f38ba8] border border-[#f38ba8]/30">
                    Crash Origin
                  </span>
                  <span className="text-sm font-bold text-white">
                    {parsedData.exceptionType || 'Unknown Exception'}
                  </span>
                </div>
                <div className="text-xs text-[#a6adc8] mt-1 flex items-center gap-2 flex-wrap">
                  {parsedData.rootCause.fileAndLine && (
                    <span className="font-mono text-[#89b4fa] font-semibold flex items-center gap-1">
                      <FileCode size={12} />
                      {parsedData.rootCause.fileAndLine}
                    </span>
                  )}
                  {parsedData.rootCause.culpritLayer && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#313244] text-[#cba6f7]">
                      Layer: {parsedData.rootCause.culpritLayer}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total Frames Count */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-xs">
              <div className="text-right">
                <div className="text-white font-bold">{parsedData.frames.length} Stack Frames</div>
                <div className="text-[#9399b2] text-[11px]">
                  {parsedData.frames.filter(f => f.isAppCode).length} App Code · {parsedData.frames.filter(f => !f.isAppCode).length} System
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="shrink-0 bg-[#11111b] border-b border-[#313244] px-4 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1">
              {[
                { id: 'flow', label: 'Execution Flow (Chronological)', icon: <ArrowRight size={13} /> },
                { id: 'stack', label: 'Call Stack Explorer', icon: <Layers size={13} /> },
                { id: 'diagnosis', label: 'Deterministic Root Cause & Fixes', icon: <Sparkles size={13} /> },
                { id: 'context', label: `Context Variables (${Object.keys(parsedData.context).length})`, icon: <Terminal size={13} /> },
                { id: 'raw', label: 'Raw Extracted Exception', icon: <Code2 size={13} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#89b4fa] text-white bg-[#181825]'
                      : 'border-transparent text-[#9399b2] hover:text-[#cdd6f4] hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Content Views ── */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
            {/* 1. CHRONOLOGICAL EXECUTION FLOW */}
            {activeTab === 'flow' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-[#1e1e2e]/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <GitCommit size={14} className="text-[#89b4fa]" />
                      <span>Chronological Invocation Pipeline (Entrypoint → Crash Site)</span>
                    </h3>
                    <p className="text-[11px] text-[#9399b2] mt-0.5">
                      Traces the lifecycle of the request starting from the incoming API controller through business services down to the failing accessor or database query.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#89b4fa] font-bold px-3 py-1 rounded-xl bg-[#89b4fa]/10 border border-[#89b4fa]/20 shrink-0">
                    {parsedData.executionPath.length} Steps
                  </span>
                </div>

                {/* Stepper Pipeline */}
                <div className="relative pl-6 sm:pl-8 border-l-2 border-[#313244] space-y-6 ml-3 sm:ml-4">
                  {parsedData.executionPath.map((frame, idx) => {
                    const isLast = idx === parsedData.executionPath.length - 1;
                    const isFirst = idx === 0;

                    return (
                      <div key={frame.id} className="relative group">
                        {/* Dot on Timeline */}
                        <div
                          className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-[#181825] flex items-center justify-center ${
                            isLast
                              ? 'bg-[#f38ba8] ring-4 ring-[#f38ba8]/20 animate-pulse'
                              : isFirst
                              ? 'bg-[#89b4fa]'
                              : frame.isAppCode
                              ? 'bg-[#cba6f7]'
                              : 'bg-[#585b70]'
                          }`}
                        />

                        {/* Step Card */}
                        <div
                          className={`rounded-2xl border p-4 transition-all ${
                            isLast
                              ? 'bg-gradient-to-r from-[#1e1e2e] to-[#f38ba8]/10 border-[#f38ba8]/40 shadow-lg'
                              : 'bg-[#1e1e2e]/90 hover:bg-[#1e1e2e] border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#11111b] text-[#9399b2]">
                                Step {idx + 1}
                              </span>
                              <span
                                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${layerColor(
                                  frame.layer
                                )}`}
                              >
                                {frame.layer}
                              </span>
                              {frame.isAppCode && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/30">
                                  App Code
                                </span>
                              )}
                            </div>

                            {isLast && (
                              <span className="text-xs font-mono font-bold text-[#f38ba8] flex items-center gap-1">
                                <AlertTriangle size={13} />
                                <span>EXCEPTION THROWN HERE</span>
                              </span>
                            )}
                          </div>

                          {/* Method & Class */}
                          <div className="font-mono text-xs sm:text-sm font-bold text-white break-all">
                            {frame.classOrNamespace ? (
                              <>
                                <span className="text-[#a6adc8]">{frame.classOrNamespace}.</span>
                                <span className={isLast ? 'text-[#f38ba8]' : 'text-[#89b4fa]'}>
                                  {frame.method}
                                </span>
                              </>
                            ) : (
                              <span>{frame.method}</span>
                            )}
                          </div>

                          {/* Source File Location */}
                          {frame.filePath && (
                            <div className="mt-2 text-xs font-mono text-[#9399b2] flex items-center gap-1.5 break-all">
                              <FileCode size={12} className="text-[#89b4fa] shrink-0" />
                              <span className="text-[#cdd6f4] font-medium">{frame.fileName}</span>
                              {frame.lineNumber && (
                                <span className="text-[#89b4fa] font-bold">:line {frame.lineNumber}</span>
                              )}
                              <span className="text-[#585b70] text-[10px] truncate max-w-md hidden md:inline">
                                ({frame.filePath})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. CALL STACK EXPLORER */}
            {activeTab === 'stack' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e1e2e] p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search size={14} className="text-[#6c7086]" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      placeholder="Filter stack frames by method, class or file..."
                      className="w-full bg-transparent text-xs text-[#cdd6f4] placeholder-[#585b70] outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs font-medium">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#a6adc8] hover:text-white">
                      <input
                        type="checkbox"
                        checked={onlyAppCode}
                        onChange={e => setOnlyAppCode(e.target.checked)}
                        className="rounded border-[#45475a] bg-[#11111b] text-[#89b4fa] focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Only Show App Code</span>
                    </label>
                    <span className="text-[#585b70]">|</span>
                    <span className="text-[#9399b2] font-mono text-[11px]">
                      Showing {filteredFrames.length} of {parsedData.frames.length} frames
                    </span>
                  </div>
                </div>

                {/* Stack Frames List */}
                <div className="space-y-2 font-mono text-xs">
                  {filteredFrames.map((frame, index) => {
                    const isExpanded = expandedFrameId === frame.id;

                    return (
                      <div
                        key={frame.id}
                        onClick={() => setExpandedFrameId(isExpanded ? null : frame.id)}
                        className={`rounded-2xl border transition-all cursor-pointer ${
                          frame.isCrashSite
                            ? 'bg-[#1e1e2e] border-[#f38ba8]/40 shadow-sm'
                            : frame.isAppCode
                            ? 'bg-[#1e1e2e]/90 hover:bg-[#1e1e2e] border-white/10'
                            : 'bg-[#181825] opacity-75 hover:opacity-100 border-[#313244]'
                        }`}
                      >
                        <div className="p-3.5 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                                frame.isCrashSite
                                  ? 'bg-[#f38ba8] text-[#11111b]'
                                  : 'bg-[#313244] text-[#a6adc8]'
                              }`}
                            >
                              #{index}
                            </span>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${layerColor(
                                    frame.layer
                                  )}`}
                                >
                                  {frame.layer}
                                </span>
                                {frame.isCrashSite && (
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#f38ba8]/20 text-[#f38ba8] border border-[#f38ba8]/30">
                                    Crash Origin
                                  </span>
                                )}
                                {frame.isAppCode ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#a6e3a1]/15 text-[#a6e3a1]">
                                    App Code
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#313244] text-[#6c7086]">
                                    Runtime
                                  </span>
                                )}
                              </div>

                              <div className="text-white font-bold break-all">
                                {frame.classOrNamespace && (
                                  <span className="text-[#9399b2]">{frame.classOrNamespace}.</span>
                                )}
                                <span className={frame.isCrashSite ? 'text-[#f38ba8]' : 'text-[#89b4fa]'}>
                                  {frame.method}
                                </span>
                              </div>

                              {frame.filePath && (
                                <div className="text-[11px] text-[#9399b2] mt-1 flex items-center gap-1.5">
                                  <FileCode size={11} className="text-[#89b4fa]" />
                                  <span className="text-[#cdd6f4]">{frame.fileName}</span>
                                  {frame.lineNumber && (
                                    <span className="text-[#89b4fa] font-bold">:line {frame.lineNumber}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-[#6c7086] hover:text-white mt-1">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>

                        {/* Expanded Raw Line Detail */}
                        {isExpanded && (
                          <div className="border-t border-[#313244] p-3.5 bg-[#11111b] rounded-b-2xl space-y-2">
                            <div>
                              <span className="text-[10px] text-[#6c7086] uppercase block">Raw Stack Line:</span>
                              <pre className="text-xs text-[#a6adc8] font-mono whitespace-pre-wrap break-all mt-0.5">
                                {frame.raw}
                              </pre>
                            </div>
                            {frame.filePath && (
                              <div>
                                <span className="text-[10px] text-[#6c7086] uppercase block">Absolute Path:</span>
                                <span className="text-xs text-[#89b4fa] font-mono break-all">{frame.filePath}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. DETERMINISTIC ROOT CAUSE & FIXES */}
            {activeTab === 'diagnosis' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {/* Executive Diagnosis Card */}
                <div className="rounded-2xl border border-[#89b4fa]/30 bg-gradient-to-br from-[#1e1e2e] to-[#89b4fa]/10 p-5 shadow-xl">
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#89b4fa]/20 border border-[#89b4fa]/40 flex items-center justify-center text-[#89b4fa] shrink-0 mt-0.5">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#89b4fa] font-bold">
                        Deterministic Algorithmic Diagnosis
                      </span>
                      <h2 className="text-base font-bold text-white mt-0.5">{parsedData.rootCause.title}</h2>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-[#cdd6f4] leading-relaxed">
                    {parsedData.rootCause.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[#9399b2] block uppercase">Suspected Culprit Layer</span>
                      <span className="font-bold text-[#cba6f7]">{parsedData.rootCause.culpritLayer}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9399b2] block uppercase">Source File &amp; Line</span>
                      <span className="font-bold text-[#89b4fa]">{parsedData.rootCause.fileAndLine}</span>
                    </div>
                  </div>
                </div>

                {/* Probable Causes */}
                <div className="bg-[#1e1e2e] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-[#fab387]" />
                    <span>Identified Probable Failure Causes</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {parsedData.rootCause.probableCauses.map((cause, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#cdd6f4] leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#fab387] shrink-0 mt-1.5" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actionable Code Fixes */}
                <div className="bg-[#1e1e2e] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} className="text-[#a6e3a1]" />
                    <span>Actionable Engineering Remediations</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {parsedData.rootCause.actionableFixes.map((fix, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-[#cdd6f4] leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a6e3a1] shrink-0 mt-1.5" />
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 4. CONTEXT VARIABLES */}
            {activeTab === 'context' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div className="bg-[#1e1e2e] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-1">
                    <Terminal size={14} className="text-[#89b4fa]" />
                    <span>Extracted Diagnostic Context &amp; Metadata</span>
                  </h3>
                  <p className="text-[11px] text-[#9399b2]">
                    Contextual parameters, tenant IDs, user identities, and operational attributes captured during the incident.
                  </p>
                </div>

                {Object.keys(parsedData.context).length > 0 ? (
                  <div className="bg-[#1e1e2e] border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-[#11111b] text-[#9399b2] border-b border-[#313244]">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Variable Key</th>
                          <th className="py-2.5 px-4 font-semibold">Value</th>
                          <th className="py-2.5 px-4 font-semibold">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#313244]/60">
                        {Object.entries(parsedData.context).map(([k, v]) => (
                          <tr key={k} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 text-[#89b4fa] font-bold">{k}</td>
                            <td className="py-2.5 px-4 text-[#a6e3a1] break-all">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </td>
                            <td className="py-2.5 px-4 text-[#6c7086] text-[11px]">{typeof v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-[#6c7086]">
                    No contextual key-value variables were detected in this log payload.
                  </div>
                )}
              </div>
            )}

            {/* 5. RAW EXTRACTED EXCEPTION */}
            {activeTab === 'raw' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="bg-[#11111b] border border-[#313244] rounded-2xl p-4 overflow-x-auto">
                  <div className="flex items-center justify-between text-xs text-[#9399b2] mb-3 pb-2 border-b border-[#313244]">
                    <span>Parsed Exception Raw Representation</span>
                    <button
                      onClick={handleCopyRaw}
                      className="hover:text-white flex items-center gap-1 text-[11px] font-mono"
                    >
                      {copiedRaw ? <Check size={11} className="text-[#a6e3a1]" /> : <Copy size={11} />}
                      <span>Copy Raw</span>
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-[#cdd6f4] leading-relaxed whitespace-pre-wrap break-all">
                    {inputLog}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDebuggerView;
