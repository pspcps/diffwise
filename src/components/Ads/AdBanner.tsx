import { useEffect, useRef } from "react";

// ── Google AdSense Banner ─────────────────────────────────────────────────────
// Publisher ID for psdevtool.online
export const PUBLISHER_ID = "ca-pub-4337594386208236";

// Optional: To render this specific bottom banner ad unit, generate a Display Ad Unit
// in your AdSense dashboard (Ads -> By ad unit -> Display ads) and paste its slot ID here.
export const AD_SLOT_ID = "";

export default function AdBanner() {
  const active = Boolean(PUBLISHER_ID && /^\d+$/.test(AD_SLOT_ID));
  const slot = useRef<HTMLModElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!active || !slot.current) return;
    const request = () => {
      if (requested.current) return;
      try {
        const w = window as unknown as { adsbygoogle: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
        requested.current = true;
      } catch {
        /* The workspace remains usable if ads are blocked. */
      }
    };
    if (!("IntersectionObserver" in window)) {
      request();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          request();
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(slot.current);
    return () => observer.disconnect();
  }, [active]);

  if (!active) {
    // An unconfigured manual slot occupies no space. Auto Ads are an account setting.
    return null;
  }

  return (
    <div
      className="ad-placement"
      role="complementary"
      aria-label="Advertisement"
      style={{
        minHeight: 90,
        padding: "24px 12px",
        margin: "24px auto",
        maxWidth: 760,
      }}
    >
      <div className="flex flex-col items-center justify-center py-1 gap-2 w-full">
        <span className="text-[10px] tracking-widest uppercase text-[#9eac96] select-none">
          Advertisement
        </span>
        <ins
          ref={slot}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: 90 }}
          data-ad-client={PUBLISHER_ID}
          data-ad-slot={AD_SLOT_ID}
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
