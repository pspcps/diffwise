export type InformationId = "about" | "privacy" | "contact" | "terms";
export interface InformationSection {
  heading: string;
  paragraphs: string[];
  links?: { label: string; href: string }[];
}
export interface InformationPage {
  id: InformationId;
  name: string;
  description: string;
  sections: InformationSection[];
}
export const SITE_INFORMATION: InformationPage[] = [
  {
    id: "about",
    name: "About PSDevTool",
    description:
      "Meet the independent developer behind PSDevTool, explore how its browser tools work, and learn how to report problems and suggest improvements.",
    sections: [
      {
        heading: "Built around everyday engineering work",
        paragraphs: [
          "PSDevTool is an independent collection of 20 browser tools built by Prakash Choudhary. It brings text comparison, structured-data inspection, API debugging, document and image workflows, measurement calculators and resume templates into one workspace.",
          "The project is intended for the small tasks that interrupt development: comparing two payloads, finding a value inside JSON, inspecting a network capture or checking a coordinate calculation. The tools are free to access without a paid application subscription.",
        ],
        links: [
          {
            label: "Meet Prakash and explore his engineering work",
            href: "/portfolio/",
          },
          { label: "Browse all tools", href: "/" },
        ],
      },
      {
        heading: "How the tools are implemented",
        paragraphs: [
          "The application uses React and TypeScript. Many transformations run in your browser, including text comparison, formatting and local file processing. Network-dependent features, including API requests, map tiles and optional routing, contact external services. Loading the site also requests application assets, analytics and advertising resources.",
          "Tool guides explain a practical workflow, a worked example and limitations. For example, a decoded token is not proof of identity, and a straight-line coordinate distance is not a driving distance. Review results in the context of your own application.",
        ],
        links: [
          {
            label: "Source code and development history",
            href: "https://github.com/pspcps/diffwise",
          },
          { label: "Read the privacy policy", href: "/privacy/" },
        ],
      },
      {
        heading: "Maintenance and corrections",
        paragraphs: [
          "Source changes are tracked in the public GitHub repository. If an example, result or interface appears wrong, report the tool name, the steps to reproduce it, a non-sensitive sample and the expected result. Reports help identify what needs fixing; a response time or release schedule is not promised.",
        ],
        links: [
          { label: "Report a problem or send a suggestion", href: "/contact/" },
        ],
      },
    ],
  },
  {
    id: "privacy",
    name: "Privacy Policy",
    description:
      "How PSDevTool handles browser tool inputs, local storage, external services, Google Analytics and Google advertising, including ways to manage your data.",
    sections: [
      {
        heading: "Who operates this site",
        paragraphs: [
          "PSDevTool is operated by Prakash Choudhary. This policy describes the hosted service at psdevtool.online. For questions about privacy or to report a concern, use the contact page.",
        ],
        links: [{ label: "Contact the operator", href: "/contact/" }],
      },
      {
        heading: "Tool inputs and files",
        paragraphs: [
          "Text formatters, comparisons and many document, image and calculation operations process the data you select in browser memory. The application does not provide a central account or a server database for storing those tool inputs. The editor does not intentionally include raw pasted text or selected file contents in analytics events.",
          "This does not mean the whole site is offline or that every feature avoids the network. API Desk sends the request, headers and body to the endpoint you choose. Enabling its optional proxy sends that request through the proxy provider as well. Never send credentials or confidential data to a service you do not trust. Map features fetch tiles and may send coordinate pairs to a routing service when routing is requested. External providers have their own policies.",
        ],
        links: [
          {
            label: "OpenStreetMap privacy policy",
            href: "https://osmfoundation.org/wiki/Privacy_Policy",
          },
          {
            label: "Optional API proxy provider",
            href: "https://corsproxy.io/privacy-policy/",
          },
        ],
      },
      {
        heading: "Browser storage and downloads",
        paragraphs: [
          "The site uses local storage for settings such as language theme, motion preference, favorites and recent tools. Some tools also keep browser-local information such as API collections or history and resume details when saving is enabled. Anyone with access to your browser profile may be able to access that information.",
          "Use the tool’s available clear/reset controls or your browser’s site-data settings to remove stored information. Clearing site data can erase saved work. Export a backup first where the tool offers one. Downloaded files are saved outside the site’s browser storage and must be managed on your device.",
        ],
      },
      {
        heading: "Hosting and third-party resources",
        paragraphs: [
          "The site is hosted on Vercel. Hosting and resource providers may receive technical information needed to deliver requests, such as IP address, browser headers, requested address and request time. Editor resources, fonts and other third-party assets can also make network requests.",
          "Retention and handling of provider logs are governed by those providers; PSDevTool does not promise a specific retention period for data it does not control.",
        ],
        links: [
          {
            label: "Vercel privacy notice",
            href: "https://vercel.com/legal/privacy-policy",
          },
        ],
      },
      {
        heading: "Google Analytics and advertising",
        paragraphs: [
          "The hosted site includes Google Analytics and Google AdSense integrations. Google and its partners may use cookies, local storage, IP addresses or other identifiers to measure visits, serve ads and assess ad performance, subject to applicable consent choices and regional requirements. These services can collect information from visits to this site and other websites or apps.",
          "Advertising resources may be requested even while an AdSense application is being reviewed; including the code does not mean ads are approved or available. Personalization and cookie behavior depend on Google’s settings, your choices and any consent messages configured for the site.",
        ],
        links: [
          {
            label: "How Google uses information from sites and apps",
            href: "https://policies.google.com/technologies/partner-sites",
          },
          {
            label: "Manage Google ad personalization",
            href: "https://myadcenter.google.com/",
          },
          {
            label: "Google privacy policy",
            href: "https://policies.google.com/privacy",
          },
        ],
      },
      {
        heading: "Your choices and policy updates",
        paragraphs: [
          "You can manage cookies and site storage in your browser, use available provider privacy controls and contact the operator with a question about this policy. Blocking scripts may affect editor loading, maps or other features. This policy does not replace any consent choices required for advertising.",
          "This policy was updated on 19 November 2026. Changes to the tools, integrations or data handling should be reflected here.",
        ],
      },
    ],
  },
  {
    id: "contact",
    name: "Contact & Support",
    description:
      "Contact the developer of PSDevTool, report a reproducible tool issue, suggest an improvement, or ask a privacy or advertising question about the site.",
    sections: [
      {
        heading: "Get in touch",
        paragraphs: [
          "PSDevTool is built and maintained by Prakash Choudhary. Use the public project issue tracker for reproducible bugs and feature suggestions, or email the operator for privacy, site ownership and advertising questions.",
        ],
        links: [
          {
            label: "Email Prakash: prakash.seervi9460@gmail.com",
            href: "mailto:prakash.seervi9460@gmail.com",
          },
          {
            label: "Open the GitHub issue tracker",
            href: "https://github.com/pspcps/diffwise/issues",
          },
          { label: "View the developer’s portfolio", href: "/portfolio/" },
        ],
      },
      {
        heading: "Make a bug report useful",
        paragraphs: [
          "Include the tool name, the page address, your browser, the steps you took, the result you expected and what happened instead. Small synthetic samples are easier to reproduce than screenshots of large documents.",
          "Remove API tokens, passwords, private keys, customer records and personal information before posting publicly. GitHub issues are public. For a security-sensitive concern, email first and share only the minimum information needed to describe the problem.",
        ],
      },
      {
        heading: "What to expect",
        paragraphs: [
          "This is an independently maintained project. Messages can be reviewed as maintenance time permits; there is no guaranteed response time or paid support service. You do not need to click an ad or pay to send feedback.",
        ],
      },
    ],
  },
  {
    id: "terms",
    name: "Terms of Use",
    description:
      "Practical terms for using PSDevTool, including authorized use, checking outputs, external services, source licensing and reporting issues with the tools.",
    sections: [
      {
        heading: "Using the tools",
        paragraphs: [
          "You may use the publicly available tools for lawful tasks involving data and files you are authorized to process. Do not use API features to access systems without permission, evade service limits or interfere with someone else’s service. You remain responsible for the information you enter and the requests you send.",
        ],
      },
      {
        heading: "Review outputs before relying on them",
        paragraphs: [
          "Tools and examples are provided as available, and errors are possible. Validate code, conversions, generated documents and diagnostic suggestions in your own environment. Keep backups of important originals before changing files.",
          "Distance and route estimates are not navigation guarantees. Calculators use numerical approximations. Decoding a token does not validate trust in its issuer. Resume formatting estimates do not guarantee ATS acceptance, employment or a particular score in a third-party screening system.",
        ],
      },
      {
        heading: "External services and availability",
        paragraphs: [
          "Network-dependent features rely on their providers, who can change availability, limits or terms. A public map, proxy or API endpoint may stop responding. The project does not promise uninterrupted access or a specific maintenance schedule.",
        ],
        links: [
          {
            label: "Read how data and external requests are handled",
            href: "/privacy/",
          },
        ],
      },
      {
        heading: "Source code, names and feedback",
        paragraphs: [
          "Source availability and any reuse rights are governed by the repository’s applicable license and third-party notices. Technology names, logos and trademarks belong to their respective owners. Listing a technology does not imply endorsement.",
          "These terms were updated on 19 November 2026. Contact the operator with questions or report a reproducible issue through the project tracker.",
        ],
        links: [
          {
            label: "Project source and notices",
            href: "https://github.com/pspcps/diffwise",
          },
          { label: "Contact", href: "/contact/" },
        ],
      },
    ],
  },
];
export const isInformationId = (id: string): id is InformationId =>
  SITE_INFORMATION.some((p) => p.id === id);
