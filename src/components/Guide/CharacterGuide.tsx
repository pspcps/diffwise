import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle, X, Volume2 } from "lucide-react";
export default function CharacterGuide({
  stories,
  compact = false,
}: {
  stories: string[];
  compact?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(!compact);
  const story = stories[step % stories.length];
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [],
  );
  return (
    <div
      className={`character-guide ${compact ? "guide-compact" : ""} mood-${step % 3}`}
    >
      {open && (
        <div className="guide-speech">
          <div className="guide-label">
            PRAKASH’S DEV GUIDE{" "}
            {compact && (
              <button aria-label="Close guide" onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            )}
          </div>
          <p aria-live="polite">{story}</p>
          <div className="guide-actions">
            <button onClick={() => setStep((s) => s + 1)}>
              Next {compact ? "tip" : "story"} <ArrowRight size={14} />
            </button>
            {"speechSynthesis" in window && (
              <button
                aria-label="Read guide aloud"
                onClick={() => {
                  speechSynthesis.cancel();
                  speechSynthesis.speak(new SpeechSynthesisUtterance(story));
                }}
              >
                <Volume2 size={15} />
              </button>
            )}
          </div>
        </div>
      )}
      <button
        className="character-button"
        aria-label={
          compact ? "Open tool guide" : "Change character expression and story"
        }
        onClick={() => {
          if (open) setStep((s) => s + 1);
          else setOpen(true);
        }}
      >
        <svg
          viewBox="0 0 300 310"
          role="img"
          aria-label="Friendly cartoon developer with glasses and a laptop"
        >
          <defs>
            <linearGradient id={compact ? "coat-mini" : "coat"} x2="1" y2="1">
              <stop stopColor="var(--user-accent,#c8edb6)" />
              <stop offset="1" stopColor="#476151" />
            </linearGradient>
            <linearGradient
              id={compact ? "screen-mini" : "screen"}
              x2="0"
              y2="1"
            >
              <stop stopColor="#344039" />
              <stop offset="1" stopColor="#111b16" />
            </linearGradient>
          </defs>
          <ellipse
            cx="152"
            cy="289"
            rx="104"
            ry="13"
            fill="#000"
            opacity=".25"
          />
          <g className="character-body">
            <path
              d="M77 256 Q72 179 118 170 L180 170 Q228 183 225 256Z"
              fill={`url(#${compact ? "coat-mini" : "coat"})`}
              stroke="#c8edb633"
              strokeWidth="2"
            />
            <path d="M130 173 L149 213 L172 172" fill="#1b2b22" />
            <path
              d="M135 149 L135 180 Q151 192 167 179 L166 148"
              fill="#cc966e"
            />
            <g className="character-head">
              <ellipse cx="103" cy="113" rx="13" ry="18" fill="#dca67c" />
              <ellipse cx="198" cy="113" rx="13" ry="18" fill="#dca67c" />
              <path
                d="M103 78 Q102 43 153 43 Q200 46 199 92 L195 133 Q188 166 153 171 Q116 166 107 135Z"
                fill="#edbb90"
              />
              <path
                d="M102 104 Q85 66 114 43 Q153 14 192 48 Q212 64 198 106 L188 78 Q158 88 133 65 Q124 88 107 87Z"
                fill="#252c2a"
              />
              <path
                d="M113 51 Q145 29 177 48"
                fill="none"
                stroke="#465049"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <g fill="none" stroke="#354440" strokeWidth="4">
                <rect x="110" y="100" width="35" height="25" rx="10" />
                <rect x="157" y="100" width="35" height="25" rx="10" />
                <path d="M145 110 Q151 106 157 110" />
              </g>
              <g className="character-eyes" fill="#26342d">
                <ellipse cx="129" cy="112" rx="3" ry="5" />
                <ellipse cx="174" cy="112" rx="3" ry="5" />
              </g>
              <path
                d="M150 114 L146 130 L155 130"
                fill="none"
                stroke="#c78f66"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="character-smile"
                d="M137 143 Q151 156 169 141"
                fill="none"
                stroke="#854c36"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="119" cy="134" r="7" fill="#dd9476" opacity=".4" />
              <circle cx="181" cy="134" r="7" fill="#dd9476" opacity=".4" />
            </g>
            <g className="character-wave">
              <path
                d="M213 213 Q235 198 241 164"
                fill="none"
                stroke="var(--user-accent,#c8edb6)"
                strokeWidth="25"
                strokeLinecap="round"
              />
              <path
                d="M242 169 L233 153 Q227 145 234 143 L241 150 L237 128 Q239 121 244 127 L249 146 L250 123 Q254 117 257 124 L257 147 L263 129 Q268 126 269 132 L266 154 Q275 143 278 149 Q279 167 258 180Z"
                fill="#edbb90"
                stroke="#cc966e"
                strokeWidth="1.5"
              />
            </g>
            <path
              d="M78 212 Q64 231 83 249"
              fill="none"
              stroke="#edbb90"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M79 222 L210 222 L198 278 L91 278Z"
              fill={`url(#${compact ? "screen-mini" : "screen"})`}
              stroke="#7f96804d"
              strokeWidth="2"
            />
            <path d="M75 278 L215 278 L223 285 L70 285Z" fill="#6d7e6e" />
            <text
              x="145"
              y="258"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="20"
              fill="var(--user-accent,#c8edb6)"
            >
              {"</>"}
            </text>
          </g>
        </svg>
        {compact && (
          <span className="guide-launch-label">
            <MessageCircle size={12} /> Tool tips
          </span>
        )}
      </button>
      {!compact && (
        <span className="character-hint">
          Tap me — there’s a story behind every build.
        </span>
      )}
    </div>
  );
}
