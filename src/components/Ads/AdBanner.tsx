// ── Google AdSense Banner ─────────────────────────────────────────────────────
// To activate real ads:
//  1. Add your publisher ID below (ca-pub-XXXXXXXXXXXXXXXXX)
//  2. Add your ad slot ID below
//  3. Add the AdSense script to index.html (see comment there)
const PUBLISHER_ID = '';   // e.g. 'ca-pub-1234567890123456'
const AD_SLOT_ID   = '';   // e.g. '1234567890'

export default function AdBanner() {
  const active = PUBLISHER_ID && AD_SLOT_ID;

  return (
    <div className="shrink-0 bg-[#13131f] border-t border-[#252535]" style={{ height: active ? 68 : 52 }}>
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <span className="text-[9px] tracking-widest uppercase text-[#2a2b3d] select-none">
          Advertisement
        </span>
        {active ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'inline-block', width: 728, height: 40 }}
            data-ad-client={PUBLISHER_ID}
            data-ad-slot={AD_SLOT_ID}
            data-ad-format="horizontal"
            data-full-width-responsive="false"
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-lg border border-dashed text-[10px] select-none"
            style={{
              width: 728,
              height: 32,
              borderColor: '#252535',
              color: '#2a2b3d',
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            Ad space · Set PUBLISHER_ID in AdBanner.tsx to activate Google AdSense
          </div>
        )}
      </div>
    </div>
  );
}
