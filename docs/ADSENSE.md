# AdSense readiness and review

The owner received an AdSense **Low value content** rejection. This is distinct from Google Search indexing. The message does not identify an individual failing URL, and this change does not claim approval or prove that Google will consider the site ready.

## Concrete site changes

- Four directly accessible, server-rendered information pages: `/about/`, `/contact/`, `/privacy/`, `/terms/`. Shared footers link to them from the homepage and tool guides; the resume gallery also includes the footer.
- Practical walkthroughs for all 20 tools: an original scenario, an input/setup, expected output, explanation and limitations. They supplement the existing tool, steps and FAQs, and are visible before JavaScript as well as after application loading. The workspace has a guide link and a report-issue link.
- `ads.txt` uses the publisher ID supplied by the owner and already present in the AdSense script: `google.com, pub-4337594386208236, DIRECT, f08c47fec0942fa0`. This identifies the authorized Google seller; it does not resolve content quality or guarantee ads.
- The existing AdSense script is retained once on homepage/tool documents. Direct information, resume and 404 HTML does not load it. No fake slot ID, ratings, reviews, visitor counts or testimonials are introduced.
- The optional manual banner remains inactive until a real display slot ID is configured; a publisher/account script is not a display slot. Its placement moves below the guide, separated from editing and download controls, and its container supports narrow screens. The homepage placement follows its main content. A configured unit is requested once near the viewport, and an unfilled unit collapses. Auto Ads placements remain a Google account setting.

## Owner actions in Google AdSense

1. Deploy the changes on `https://psdevtool.online/`. Confirm the real public URLs, not a protected preview, contain the updated content, policies and `ads.txt`.
2. Review the privacy text against actual hosting, Analytics, advertising and proxy/map usage. It describes browser-local processing and its network exceptions rather than promising that the whole site is offline or never communicates with third parties.
3. In AdSense, confirm the domain and publisher ID, allow time for its ads.txt check, and resolve any account-specific notices.
4. Configure **Privacy & messaging**. For ads served to users in the EEA, UK and Switzerland, follow Google’s certified CMP requirements and the applicable consent requirements. A privacy policy or an unconnected custom cookie banner is not a substitute for the required consent setup. This repository does not claim that consent messages have been configured in the owner’s AdSense account.
5. Review Auto Ads previews and page exclusions. Exclude resume documents, information pages, error pages and any empty/loading screens from automatic placements. Do not place ads over editors, navigation, copy/download buttons or modal controls. A script already loaded in a single-page session cannot be reliably removed just by changing the React route; account-side exclusions still matter.
6. Check the tools with real workflows on desktop/mobile, correct errors, and monitor genuine usage. Keep guides synchronized with shipped features. Do not buy artificial traffic, solicit ad clicks or use misleading ad placements.
7. When the deployed site and account requirements are actually addressed, use AdSense’s review workflow. The owner must make any “I confirm I have fixed the issues” declaration; no review was requested by this change.

There is no universal minimum article count, word count or traffic number that guarantees acceptance. Adding generic text, changing a logo or repeatedly inserting the publisher script does not establish unique value. Tool usefulness, working navigation, accurate content and ongoing maintenance are the focus here.

## Sources

- [Google Publisher Policies](https://support.google.com/adsense/answer/9335564)
- [AdSense content and user experience](https://support.google.com/adsense/answer/10015918)
- [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116)
- [Ads.txt guide](https://support.google.com/adsense/answer/7532444)

## Verification

Run `npm run build`, `npm run test:seo`, `npm run test:catalog` and `npm run test:content`. Browser checks cover direct information routes, Back/Forward behavior, JavaScript-disabled guides, guide navigation, contact/privacy links, narrow layouts, script counts and no new browser errors. These checks do not measure Google indexing, Core Web Vitals, AdSense approval, account ownership or consent setup.
