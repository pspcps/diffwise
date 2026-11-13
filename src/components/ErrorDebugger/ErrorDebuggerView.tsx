import AdvancedSection from "../Workspace/AdvancedSection";
import ToolHeader from "../Workspace/ToolHeader";
import React, { useState, useMemo } from "react";
import {
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
} from "lucide-react";
import { parseErrorLog } from "./parser";
import { DEBUG_PRESETS } from "./presets";
import type { ParsedLogData, LayerType } from "./types";

export const ErrorDebuggerView: React.FC = () => {
  const [inputLog, setInputLog] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "flow" | "stack" | "diagnosis" | "context" | "raw"
  >("flow");
  const [onlyAppCode, setOnlyAppCode] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [mobilePane, setMobilePane] = useState<"input" | "analysis">("input");
  const [copyError, setCopyError] = useState(false);
  const [expandedFrameId, setExpandedFrameId] = useState<string | null>(null);

  // Parse error log deterministically with useMemo
  const parsedData: ParsedLogData = useMemo(() => {
    return parseErrorLog(inputLog);
  }, [inputLog]);

  // Filtered frames
  const filteredFrames = useMemo(() => {
    return parsedData.frames.filter((frame) => {
      if (onlyAppCode && !frame.isAppCode) return false;
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const haystack =
          `${frame.method} ${frame.classOrNamespace} ${frame.fileName} ${frame.layer}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }, [parsedData.frames, onlyAppCode, searchFilter]);

  // Copy raw input
  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(inputLog);
      setCopyError(false);
    } catch {
      setCopyError(true);
      return;
    }
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Copy diagnosis report
  const handleCopyReport = async () => {
    const report = `=====================================================
DEBUGFLOW ANALYSIS REPORT
=====================================================
Exception Type:    ${parsedData.exceptionType || "Unknown"}
Method:            ${parsedData.exceptionMethod || "N/A"}
Level / Severity:  ${parsedData.level}
Timestamp:         ${parsedData.timestamp || "N/A"}
Language / Runtime:${parsedData.language.toUpperCase()}
Format:            ${parsedData.format.toUpperCase()}

-----------------------------------------------------
CULPRIT & CRASH SITE
-----------------------------------------------------
Culprit Layer:     ${parsedData.rootCause.culpritLayer || "N/A"}
Source Location:   ${parsedData.rootCause.fileAndLine || "N/A"}
App Crash Frame:   ${parsedData.appCrashSiteFrame?.classOrNamespace}.${parsedData.appCrashSiteFrame?.method || "N/A"}
                   ${parsedData.appCrashSiteFrame?.filePath || ""}${parsedData.appCrashSiteFrame?.lineNumber ? `:${parsedData.appCrashSiteFrame.lineNumber}` : ""}

-----------------------------------------------------
ROOT CAUSE SUMMARY
-----------------------------------------------------
Title:             ${parsedData.rootCause.title}
Description:       ${parsedData.rootCause.description}

PROBABLE CAUSES:
${parsedData.rootCause.probableCauses.map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

ACTIONABLE REMEDIATIONS:
${parsedData.rootCause.actionableFixes.map((f, i) => `  ${i + 1}. ${f}`).join("\n")}

-----------------------------------------------------
CHRONOLOGICAL EXECUTION PATH
-----------------------------------------------------
${parsedData.executionPath.map((f, idx) => `  ${idx + 1}. [${f.layer.toUpperCase()}] ${f.classOrNamespace}.${f.method}${f.fileName ? ` (${f.fileName}:${f.lineNumber ?? "?"})` : ""}`).join("\n")}

-----------------------------------------------------
LOG CONTEXT VARIABLES
-----------------------------------------------------
${Object.entries(parsedData.context)
  .map(([k, v]) => `  ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
  .join("\n")}
=====================================================`;

    try {
      await navigator.clipboard.writeText(report);
      setCopyError(false);
    } catch {
      setCopyError(true);
      return;
    }
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Download report file
  const handleDownloadReport = () => {
    const reportText = JSON.stringify(parsedData, null, 2);
    const blob = new Blob([reportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debugflow-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const layerColor = (layer: LayerType) => {
    switch (layer) {
      case "controller":
        return "text-[#c8edb6] bg-[#c8edb6]/10 border-[#c8edb6]/30";
      case "service":
        return "text-[#ceb8f6] bg-[#ceb8f6]/10 border-[#ceb8f6]/30";
      case "accessor":
      case "client":
        return "text-[#f3d58c] bg-[#f3d58c]/10 border-[#f3d58c]/30";
      case "repository":
        return "text-[#b5dfa3] bg-[#b5dfa3]/10 border-[#b5dfa3]/30";
      case "middleware":
        return "text-[#f3c18e] bg-[#f3c18e]/10 border-[#f3c18e]/30";
      case "system":
        return "text-[#9eac96] bg-[#344435]/40 border-[#71836b]";
      default:
        return "text-[#b1bea8] bg-[#344435]/20 border-[#344435]";
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#111612] text-[#e4ebdd] select-text overflow-hidden font-sans debug-workspace"
      data-mobile-pane={mobilePane}
    >
      <ToolHeader
        title="DebugFlow"
        description="Paste a log or stack trace to inspect frames, context and suggested checks."
        actions={
          <>
            <select
              aria-label="Load a sample log"
              value={selectedPresetId}
              onChange={(e) => {
                const preset = DEBUG_PRESETS.find(
                  (p) => p.id === e.target.value,
                );
                if (preset) {
                  setSelectedPresetId(preset.id);
                  setInputLog(preset.log);
                }
              }}
            >
              <option value="" disabled>
                Try a sample…
              </option>
              {DEBUG_PRESETS.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.badge}
                </option>
              ))}
            </select>
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#344435] hover:bg-[#71836b] text-white transition-colors border border-white/5"
              title="Copy structured incident report"
            >
              {copiedReport ? (
                <Check size={13} className="text-[#b5dfa3]" />
              ) : (
                <FileText size={13} />
              )}
              <span>{copiedReport ? "Report Copied!" : "Copy Report"}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#c8edb6]/15 hover:bg-[#c8edb6]/25 text-[#c8edb6] transition-colors border border-[#c8edb6]/30"
              title="Download JSON analysis report"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download JSON</span>
            </button>
          </>
        }
      />
      {copyError && (
        <p className="workspace-feedback" role="status">
          Clipboard access is blocked. Select the log to copy it manually, or
          download the JSON report.
        </p>
      )}
      <div
        className="debug-mobile-nav"
        role="group"
        aria-label="DebugFlow workspace"
      >
        <button
          type="button"
          aria-pressed={mobilePane === "input"}
          onClick={() => setMobilePane("input")}
        >
          1 · Input log
        </button>
        <button
          type="button"
          aria-pressed={mobilePane === "analysis"}
          onClick={() => setMobilePane("analysis")}
        >
          2 · Analysis
        </button>
      </div>
      {/* ── Main Workspace: Two-Column Split (Left: Input & Metadata, Right: Diagnostic & Flow) ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden debug-layout">
        {/* Left Side: Input Log / JSON Editor */}
        <div className="debug-input-panel w-full lg:w-[360px] xl:w-[390px] shrink-0 border-r border-[#344435] flex flex-col bg-[#111612] min-h-[220px] lg:min-h-0">
          <div className="bg-[#171d19]/70 px-3.5 py-2 border-b border-[#344435] flex items-center justify-between text-xs font-mono">
            <span className="text-[#c3ceba] flex items-center gap-2">
              <Terminal size={13} className="text-[#c8edb6]" />
              <span>Input Log / Stack Trace</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRaw}
                className="text-[11px] text-[#b1bea8] hover:text-white flex items-center gap-1 transition-colors"
                title="Copy raw log"
              >
                {copiedRaw ? (
                  <Check size={11} className="text-[#b5dfa3]" />
                ) : (
                  <Copy size={11} />
                )}
                <span>{copiedRaw ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={() => setInputLog("")}
                className="text-[11px] text-[#b1bea8] hover:text-[#f19aa6] flex items-center gap-1 transition-colors"
                title="Clear input"
              >
                <RotateCcw size={11} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 min-h-0 p-2 bg-[#0d120f]">
            <textarea
              aria-label="Log or stack trace"
              value={inputLog}
              onChange={(e) => {
                setInputLog(e.target.value);
                setSelectedPresetId("");
              }}
              placeholder="Paste raw error log, JSON payload, or stacktrace here..."
              spellCheck={false}
              className="w-full h-full p-2.5 bg-transparent text-xs font-mono text-[#e4ebdd] placeholder-[#899980] resize-none outline-none leading-relaxed overflow-auto"
            />
          </div>

          {/* Input Format & Detection Strip */}
          <AdvancedSection
            className="debug-metadata"
            title="Detected log details"
          >
            <div className="shrink-0 bg-[#171d19] border-t border-[#344435] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bea8]">Detected Language:</span>
                <span className="font-mono font-bold text-white uppercase px-2 py-0.5 rounded bg-[#344435] text-[11px]">
                  {parsedData.language}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#b1bea8]">Log Format:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    parsedData.format === "repaired_json"
                      ? "bg-[#f3c18e]/20 text-[#f3c18e] border border-[#f3c18e]/40"
                      : parsedData.format === "json"
                        ? "bg-[#b5dfa3]/20 text-[#b5dfa3]"
                        : "bg-[#344435] text-[#e4ebdd]"
                  }`}
                >
                  {parsedData.format === "repaired_json"
                    ? "Auto-Repaired JSON"
                    : parsedData.format.toUpperCase()}
                </span>
              </div>

              {parsedData.timestamp && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#b1bea8]">Timestamp:</span>
                  <span className="font-mono text-[#e4ebdd] text-[11px] truncate max-w-[240px]">
                    {parsedData.timestamp}
                  </span>
                </div>
              )}

              {parsedData.level && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#b1bea8]">Severity Level:</span>
                  <span
                    className={`font-mono font-black text-[11px] px-2 py-0.5 rounded ${
                      parsedData.level === "FATAL" ||
                      parsedData.level === "CRITICAL" ||
                      parsedData.level === "ERROR"
                        ? "bg-[#f19aa6]/20 text-[#f19aa6] border border-[#f19aa6]/30"
                        : "bg-[#f3c18e]/20 text-[#f3c18e]"
                    }`}
                  >
                    {parsedData.level}
                  </span>
                </div>
              )}
            </div>
          </AdvancedSection>
        </div>

        {/* Right Side: Interactive Diagnostics, Execution Flow & Stack Explorer */}
        <div className="debug-output-panel flex-1 flex flex-col min-h-0 bg-[#111612] overflow-hidden">
          {!inputLog.trim() ? (
            <div className="tool-state">
              <strong>Your analysis will appear here</strong>
              <p>
                Paste a log in the input panel, or choose a sample to explore
                the tool. Suggestions are based on the supplied trace.
              </p>
            </div>
          ) : (
            <>
              {/* Culprit Headline Banner */}
              <div className="shrink-0 bg-[#171d19]/90 border-b border-[#344435] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#f19aa6]/15 border border-[#f19aa6]/30 flex items-center justify-center text-[#f19aa6] shrink-0 mt-0.5">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-[#f19aa6]/20 text-[#f19aa6] border border-[#f19aa6]/30">
                        Exception
                      </span>
                      <span className="text-sm font-bold text-white">
                        {parsedData.exceptionType || "Unknown Exception"}
                      </span>
                    </div>
                    <div className="text-xs text-[#c3ceba] mt-1 flex items-center gap-2 flex-wrap">
                      {parsedData.rootCause.fileAndLine && (
                        <span className="font-mono text-[#c8edb6] font-semibold flex items-center gap-1">
                          <FileCode size={12} />
                          {parsedData.rootCause.fileAndLine}
                        </span>
                      )}
                      {parsedData.rootCause.culpritLayer && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#344435] text-[#ceb8f6]">
                          Layer: {parsedData.rootCause.culpritLayer}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Frames Count */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-xs">
                  <div className="text-right">
                    <div className="text-white font-bold">
                      {parsedData.frames.length} Stack Frames
                    </div>
                    <div className="text-[#b1bea8] text-[11px]">
                      {parsedData.frames.filter((f) => f.isAppCode).length} App
                      Code ·{" "}
                      {parsedData.frames.filter((f) => !f.isAppCode).length}{" "}
                      System
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="shrink-0 bg-[#0d120f] border-b border-[#344435] px-4 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1">
                  {[
                    {
                      id: "flow",
                      label: "Call flow",
                      icon: <ArrowRight size={13} />,
                    },
                    {
                      id: "stack",
                      label: "Stack frames",
                      icon: <Layers size={13} />,
                    },
                    {
                      id: "diagnosis",
                      label: "Suggested checks",
                      icon: <Sparkles size={13} />,
                    },
                    {
                      id: "context",
                      label: `Context (${Object.keys(parsedData.context).length})`,
                      icon: <Terminal size={13} />,
                    },
                    { id: "raw", label: "Raw log", icon: <Code2 size={13} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-[#c8edb6] text-white bg-[#111612]"
                          : "border-transparent text-[#b1bea8] hover:text-[#e4ebdd] hover:bg-white/5"
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
                {activeTab === "flow" && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="bg-[#171d19]/80 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                          <GitCommit size={14} className="text-[#c8edb6]" />
                          <span>Inferred call chain</span>
                        </h3>
                        <p className="text-[11px] text-[#b1bea8] mt-0.5">
                          Shows the call chain inferred from this trace. Async and concurrent execution may differ.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-[#c8edb6] font-bold px-3 py-1 rounded-xl bg-[#c8edb6]/10 border border-[#c8edb6]/20 shrink-0">
                        {parsedData.executionPath.length} Steps
                      </span>
                    </div>

                    {/* Stepper Pipeline */}
                    <div className="relative pl-6 sm:pl-8 border-l-2 border-[#344435] space-y-6 ml-3 sm:ml-4">
                      {parsedData.executionPath.map((frame, idx) => {
                        const isLast =
                          idx === parsedData.executionPath.length - 1;
                        const isFirst = idx === 0;

                        return (
                          <div key={frame.id} className="relative group">
                            {/* Dot on Timeline */}
                            <div
                              className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-[#111612] flex items-center justify-center ${
                                isLast
                                  ? "bg-[#f19aa6] ring-4 ring-[#f19aa6]/20 animate-pulse"
                                  : isFirst
                                    ? "bg-[#c8edb6]"
                                    : frame.isAppCode
                                      ? "bg-[#ceb8f6]"
                                      : "bg-[#899980]"
                              }`}
                            />

                            {/* Step Card */}
                            <div
                              className={`rounded-2xl border p-4 transition-all ${
                                isLast
                                  ? "bg-gradient-to-r from-[#171d19] to-[#f19aa6]/10 border-[#f19aa6]/40 shadow-lg"
                                  : "bg-[#171d19]/90 hover:bg-[#171d19] border-white/5 hover:border-white/15"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0d120f] text-[#b1bea8]">
                                    Step {idx + 1}
                                  </span>
                                  <span
                                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${layerColor(
                                      frame.layer,
                                    )}`}
                                  >
                                    {frame.layer}
                                  </span>
                                  {frame.isAppCode && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#b5dfa3]/15 text-[#b5dfa3] border border-[#b5dfa3]/30">
                                      App Code
                                    </span>
                                  )}
                                </div>

                                {isLast && (
                                  <span className="text-xs font-mono font-bold text-[#f19aa6] flex items-center gap-1">
                                    <AlertTriangle size={13} />
                                    <span>EXCEPTION THROWN HERE</span>
                                  </span>
                                )}
                              </div>

                              {/* Method & Class */}
                              <div className="font-mono text-xs sm:text-sm font-bold text-white break-all">
                                {frame.classOrNamespace ? (
                                  <>
                                    <span className="text-[#c3ceba]">
                                      {frame.classOrNamespace}.
                                    </span>
                                    <span
                                      className={
                                        isLast
                                          ? "text-[#f19aa6]"
                                          : "text-[#c8edb6]"
                                      }
                                    >
                                      {frame.method}
                                    </span>
                                  </>
                                ) : (
                                  <span>{frame.method}</span>
                                )}
                              </div>

                              {/* Source File Location */}
                              {frame.filePath && (
                                <div className="mt-2 text-xs font-mono text-[#b1bea8] flex items-center gap-1.5 break-all">
                                  <FileCode
                                    size={12}
                                    className="text-[#c8edb6] shrink-0"
                                  />
                                  <span className="text-[#e4ebdd] font-medium">
                                    {frame.fileName}
                                  </span>
                                  {frame.lineNumber && (
                                    <span className="text-[#c8edb6] font-bold">
                                      :line {frame.lineNumber}
                                    </span>
                                  )}
                                  <span className="text-[#899980] text-[10px] truncate max-w-md hidden md:inline">
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
                {activeTab === "stack" && (
                  <div className="space-y-4 max-w-5xl mx-auto">
                    {/* Search & Filter Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#171d19] p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <Search size={14} className="text-[#9eac96]" />
                        <input
                          type="text"
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Filter stack frames by method, class or file..."
                          className="w-full bg-transparent text-xs text-[#e4ebdd] placeholder-[#899980] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs font-medium">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#c3ceba] hover:text-white">
                          <input
                            type="checkbox"
                            checked={onlyAppCode}
                            onChange={(e) => setOnlyAppCode(e.target.checked)}
                            className="rounded border-[#71836b] bg-[#0d120f] text-[#c8edb6] focus:ring-0 focus:ring-offset-0"
                          />
                          <span>Only Show App Code</span>
                        </label>
                        <span className="text-[#899980]">|</span>
                        <span className="text-[#b1bea8] font-mono text-[11px]">
                          Showing {filteredFrames.length} of{" "}
                          {parsedData.frames.length} frames
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
                            onClick={() =>
                              setExpandedFrameId(isExpanded ? null : frame.id)
                            }
                            className={`rounded-2xl border transition-all cursor-pointer ${
                              frame.isCrashSite
                                ? "bg-[#171d19] border-[#f19aa6]/40 shadow-sm"
                                : frame.isAppCode
                                  ? "bg-[#171d19]/90 hover:bg-[#171d19] border-white/10"
                                  : "bg-[#111612] opacity-75 hover:opacity-100 border-[#344435]"
                            }`}
                          >
                            <div className="p-3.5 flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                                    frame.isCrashSite
                                      ? "bg-[#f19aa6] text-[#0d120f]"
                                      : "bg-[#344435] text-[#c3ceba]"
                                  }`}
                                >
                                  #{index}
                                </span>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span
                                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${layerColor(
                                        frame.layer,
                                      )}`}
                                    >
                                      {frame.layer}
                                    </span>
                                    {frame.isCrashSite && (
                                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#f19aa6]/20 text-[#f19aa6] border border-[#f19aa6]/30">
                                        Exception
                                      </span>
                                    )}
                                    {frame.isAppCode ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#b5dfa3]/15 text-[#b5dfa3]">
                                        App Code
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#344435] text-[#9eac96]">
                                        Runtime
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-white font-bold break-all">
                                    {frame.classOrNamespace && (
                                      <span className="text-[#b1bea8]">
                                        {frame.classOrNamespace}.
                                      </span>
                                    )}
                                    <span
                                      className={
                                        frame.isCrashSite
                                          ? "text-[#f19aa6]"
                                          : "text-[#c8edb6]"
                                      }
                                    >
                                      {frame.method}
                                    </span>
                                  </div>

                                  {frame.filePath && (
                                    <div className="text-[11px] text-[#b1bea8] mt-1 flex items-center gap-1.5">
                                      <FileCode
                                        size={11}
                                        className="text-[#c8edb6]"
                                      />
                                      <span className="text-[#e4ebdd]">
                                        {frame.fileName}
                                      </span>
                                      {frame.lineNumber && (
                                        <span className="text-[#c8edb6] font-bold">
                                          :line {frame.lineNumber}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0 text-[#9eac96] hover:text-white mt-1">
                                {isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </div>
                            </div>

                            {/* Expanded Raw Line Detail */}
                            {isExpanded && (
                              <div className="border-t border-[#344435] p-3.5 bg-[#0d120f] rounded-b-2xl space-y-2">
                                <div>
                                  <span className="text-[10px] text-[#9eac96] uppercase block">
                                    Raw Stack Line:
                                  </span>
                                  <pre className="text-xs text-[#c3ceba] font-mono whitespace-pre-wrap break-all mt-0.5">
                                    {frame.raw}
                                  </pre>
                                </div>
                                {frame.filePath && (
                                  <div>
                                    <span className="text-[10px] text-[#9eac96] uppercase block">
                                      Absolute Path:
                                    </span>
                                    <span className="text-xs text-[#c8edb6] font-mono break-all">
                                      {frame.filePath}
                                    </span>
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
                {activeTab === "diagnosis" && (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {/* Executive Diagnosis Card */}
                    <div className="rounded-2xl border border-[#c8edb6]/30 bg-gradient-to-br from-[#171d19] to-[#c8edb6]/10 p-5 shadow-xl">
                      <div className="flex items-start gap-3.5 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#c8edb6]/20 border border-[#c8edb6]/40 flex items-center justify-center text-[#c8edb6] shrink-0 mt-0.5">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#c8edb6] font-bold">
                            Suggested explanation
                          </span>
                          <h2 className="text-base font-bold text-white mt-0.5">
                            {parsedData.rootCause.title}
                          </h2>
                        </div>
                      </div>
                      <p className="workspace-feedback">
                        Rule-based suggestions can help investigation; verify
                        them against your code and runtime behavior.
                      </p>
                      <p className="text-xs sm:text-sm text-[#e4ebdd] leading-relaxed">
                        {parsedData.rootCause.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-[#b1bea8] block uppercase">
                            Suspected Culprit Layer
                          </span>
                          <span className="font-bold text-[#ceb8f6]">
                            {parsedData.rootCause.culpritLayer}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#b1bea8] block uppercase">
                            Source File &amp; Line
                          </span>
                          <span className="font-bold text-[#c8edb6]">
                            {parsedData.rootCause.fileAndLine}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Probable Causes */}
                    <div className="bg-[#171d19] border border-white/5 rounded-2xl p-5">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                        <AlertTriangle size={14} className="text-[#f3c18e]" />
                        <span>Identified Probable Failure Causes</span>
                      </h3>
                      <ul className="space-y-2.5">
                        {parsedData.rootCause.probableCauses.map((cause, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-xs text-[#e4ebdd] leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f3c18e] shrink-0 mt-1.5" />
                            <span>{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actionable Code Fixes */}
                    <div className="bg-[#171d19] border border-white/5 rounded-2xl p-5">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                        <CheckCircle2 size={14} className="text-[#b5dfa3]" />
                        <span>Actionable Engineering Remediations</span>
                      </h3>
                      <ul className="space-y-2.5">
                        {parsedData.rootCause.actionableFixes.map((fix, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-xs text-[#e4ebdd] leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b5dfa3] shrink-0 mt-1.5" />
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 4. CONTEXT VARIABLES */}
                {activeTab === "context" && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <div className="bg-[#171d19] border border-white/5 rounded-2xl p-4">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-1">
                        <Terminal size={14} className="text-[#c8edb6]" />
                        <span>Extracted Diagnostic Context &amp; Metadata</span>
                      </h3>
                      <p className="text-[11px] text-[#b1bea8]">
                        Contextual parameters, tenant IDs, user identities, and
                        operational attributes captured during the incident.
                      </p>
                    </div>

                    {Object.keys(parsedData.context).length > 0 ? (
                      <div className="bg-[#171d19] border border-white/5 rounded-2xl overflow-hidden">
                        <table className="w-full text-left font-mono text-xs">
                          <thead className="bg-[#0d120f] text-[#b1bea8] border-b border-[#344435]">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">
                                Variable Key
                              </th>
                              <th className="py-2.5 px-4 font-semibold">
                                Value
                              </th>
                              <th className="py-2.5 px-4 font-semibold">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#344435]/60">
                            {Object.entries(parsedData.context).map(
                              ([k, v]) => (
                                <tr key={k} className="hover:bg-white/[0.02]">
                                  <td className="py-2.5 px-4 text-[#c8edb6] font-bold">
                                    {k}
                                  </td>
                                  <td className="py-2.5 px-4 text-[#b5dfa3] break-all">
                                    {typeof v === "object"
                                      ? JSON.stringify(v)
                                      : String(v)}
                                  </td>
                                  <td className="py-2.5 px-4 text-[#9eac96] text-[11px]">
                                    {typeof v}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-xs text-[#9eac96]">
                        No contextual key-value variables were detected in this
                        log payload.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. RAW EXTRACTED EXCEPTION */}
                {activeTab === "raw" && (
                  <div className="space-y-4 max-w-5xl mx-auto">
                    <div className="bg-[#0d120f] border border-[#344435] rounded-2xl p-4 overflow-x-auto">
                      <div className="flex items-center justify-between text-xs text-[#b1bea8] mb-3 pb-2 border-b border-[#344435]">
                        <span>Parsed Exception Raw Representation</span>
                        <button
                          onClick={handleCopyRaw}
                          className="hover:text-white flex items-center gap-1 text-[11px] font-mono"
                        >
                          {copiedRaw ? (
                            <Check size={11} className="text-[#b5dfa3]" />
                          ) : (
                            <Copy size={11} />
                          )}
                          <span>Copy Raw</span>
                        </button>
                      </div>
                      <pre className="font-mono text-xs text-[#e4ebdd] leading-relaxed whitespace-pre-wrap break-all">
                        {inputLog}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDebuggerView;
