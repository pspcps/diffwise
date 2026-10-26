import { useEffect } from 'react';

// ── Google AdSense Banner ─────────────────────────────────────────────────────
// Publisher ID for psdevtool.online
export const PUBLISHER_ID = 'ca-pub-4337594386208236';

// Optional: To render this specific bottom banner ad unit, generate a Display Ad Unit
// in your AdSense dashboard (Ads -> By ad unit -> Display ads) and paste its slot ID here.
export const AD_SLOT_ID = '';

export default function AdBanner() {
  const active = Boolean(PUBLISHER_ID && AD_SLOT_ID);

  useEffect(() => {
    if (active) {
      try {
        const w = window as unknown as { adsbygoogle: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
      } catch {
        // Silently catch ad-blocker restrictions
      }
    }
  }, [active]);

  if (!active) {
    // When no manual slot ID is provided, Google AdSense "Auto Ads" handles placements automatically
    return null;
  }

  return (
    <div className="shrink-0 bg-[#13131f] border-t border-[#252535]" style={{ minHeight: 60 }}>
      <div className="flex flex-col items-center justify-center py-1 gap-0.5">
        <span className="text-[9px] tracking-widest uppercase text-[#585b70] select-none">
          Advertisement
        </span>
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width: 728, height: 50, maxWidth: 'calc(100vw - 24px)' }}
          data-ad-client={PUBLISHER_ID}
          data-ad-slot={AD_SLOT_ID}
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
