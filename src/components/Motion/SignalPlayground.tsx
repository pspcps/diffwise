import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import TechnologyIcon from "../Common/TechnologyIcon";
import { useMotion } from "./MotionContext";
export default function SignalPlayground() {
  const { enabled } = useMotion();
  const [sent, setSent] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [packets, setPackets] = useState<number[]>([]);
  const id = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const send = () => {
    if (packets.length >= 6) return;
    setSent((n) => n + 1);
    if (!enabled) {
      setDelivered((n) => n + 1);
      return;
    }
    const next = ++id.current;
    setPackets((p) => [...p, next]);
    const timer = setTimeout(() => {
      setPackets((p) => p.filter((x) => x !== next));
      setDelivered((n) => n + 1);
      timers.current = timers.current.filter((x) => x !== timer);
    }, 1800);
    timers.current.push(timer);
  };
  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSent(0);
    setDelivered(0);
    setPackets([]);
  };
  return (
    <section
      className={`signal-playground ${packets.length ? "signal-active" : ""}`}
      aria-label="Interactive event-flow simulation"
    >
      <div className="signal-heading">
        <div>
          <span className="eyebrow muted">
            A LITTLE SYSTEMS THINKING. YOUR TURN.
          </span>
          <h3>Send an event. Follow the flow.</h3>
        </div>
        <div className="signal-controls">
          <button
            className="signal-send"
            onClick={send}
            disabled={packets.length >= 6}
          >
            Send event <ArrowUpRight size={14} />
          </button>
          <button
            className="signal-reset"
            onClick={reset}
            aria-label="Reset event simulation"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      <div className="signal-track">
        <div className="signal-wire" aria-hidden="true" />
        {[
          ["React", "Browser"],
          ["Node.js", "API"],
          ["Kafka", "Event stream"],
          ["Python", "Worker"],
        ].map(([tech, label], i) => (
          <div
            key={label}
            className="signal-node"
            style={{ "--stage": i } as React.CSSProperties}
          >
            <span>
              <TechnologyIcon name={tech} />
            </span>
            <strong>{label}</strong>
            <small>{tech}</small>
          </div>
        ))}
        {packets.map((packet) => (
          <span key={packet} className="signal-packet" aria-hidden="true" />
        ))}
      </div>
      <div className="signal-status">
        <span>Interactive model · local simulation</span>
        <span role="status" aria-live="polite">
          Sent <b>{sent}</b>
          <span className="signal-status-divider">/</span>Delivered{" "}
          <b>{delivered}</b>
        </span>
      </div>
    </section>
  );
}
