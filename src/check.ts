interface CheckResult {
  issues: string[];
  strictIssues: string[];
}

export function runChecks(md: string): CheckResult {
  const issues: string[] = [];
  const strictIssues: string[] = [];

  // 1) Strip fenced code blocks and inline code so examples don't trigger lint rules
  const withoutFences = stripFencedCode(md);
  const lintText = stripInlineCode(withoutFences);

  // --- BASIC CHECKS (on lintText) ---

  // Relative images outside code blocks
  const relImgs =
    lintText.match(/!\[[^\]]*\]\((?!https?:\/\/|data:)([^)]+)\)/g) || [];
  if (relImgs.length > 0) {
    issues.push("Relative image URLs detected.");
  }

  // Missing H1 (use original md so code removal doesn't affect it)
  if (!/^#\s+\S+/m.test(md)) {
    issues.push("Missing H1 title.");
  }

  // --- STRICT CHECKS ---

  if (md.length < 400) {
    strictIssues.push("README is very short (<400 chars).");
  }

  if (!/```/.test(md)) {
    strictIssues.push("No code blocks found.");
  }

  if (!/^#\s+.+\n\n.+/s.test(md)) {
    strictIssues.push("Missing description text under H1.");
  }

  // Only flag REAL HTML tags (not <path>, <number>, etc.)
  // We match a known set of html tags commonly used in READMEs.
  const htmlTagNames = [
    "div",
    "span",
    "p",
    "br",
    "hr",
    "img",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "pre",
    "code",
    "blockquote",
    "details",
    "summary",
  ].join("|");

  const realHtmlTag = new RegExp(`</?\\s*(?:${htmlTagNames})\\b[^>]*>`, "i");
  if (realHtmlTag.test(lintText)) {
    strictIssues.push("Raw HTML detected (may be sanitized on npm).");
  }

  if (!/\binstall\b/i.test(md)) {
    strictIssues.push(
      'No "Install" section detected (keyword "install" not found).',
    );
  }

  if (!/\busage\b/i.test(md)) {
    strictIssues.push(
      'No "Usage" section detected (keyword "usage" not found).',
    );
  }

  // Spaces inside URLs (outside code blocks)
  const mdLinksOrImgs = lintText.match(/!?\[[^\]]*\]\(([^)]+)\)/g) || [];
  const spaced = mdLinksOrImgs.filter((s) => /\(\s*[^)]+\s+[^)]+\s*\)/.test(s));
  if (spaced.length > 0) {
    strictIssues.push(
      "Found spaces inside markdown URLs (likely broken links).",
    );
  }

  return { issues, strictIssues };
}

function stripFencedCode(s: string): string {
  // remove ```...``` blocks (including language)
  return s.replace(/```[\s\S]*?```/g, "");
}

function stripInlineCode(s: string): string {
  // remove `inline code`
  return s.replace(/`[^`]*`/g, "");
}
