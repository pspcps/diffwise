export default function SiteFooter() {
  return (
    <footer className="site-information-footer">
      <nav aria-label="Site information">
        <a href="/about/">About</a>
        <a href="/contact/">Contact & support</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
      </nav>
      <p>
        Built by <a href="/portfolio/">Prakash Choudhary</a> ·{" "}
        <a
          href="https://github.com/pspcps/diffwise"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source and documentation
        </a>
      </p>
    </footer>
  );
}
