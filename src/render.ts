// src/render.ts
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { readFileSync } from "node:fs";
import { join } from "node:path";

marked.setOptions({ gfm: true });

interface RewriteOptions {
  cwd: string;
  branch: string;
  baseUrl: string | null;
  rewriteLinks: boolean;
}

interface RenderOptions {
  cwd?: string;
  branch?: string;
  baseUrl?: string | null;
  rewriteLinks?: boolean;
  title?: string;
  theme?: string;
}

function ensureSlash(url: string | null ): string | null {
  return url && !url.endsWith("/") ? url + "/" : url;
}

function getGithubRawBase(cwd: string, branch: string): string | null {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8"));
    const repo = pkg.repository?.url || pkg.repository;
    if (!repo) return null;

    const match = String(repo).match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    if (!match) return null;

    const [, user, name] = match;
    return `https://raw.githubusercontent.com/${user}/${name}/${branch}/`;
  } catch {
    return null;
  }
}

function rewriteAssets(
  md: string,
  { cwd, branch, baseUrl, rewriteLinks }: RewriteOptions,
): string {
  const base = ensureSlash(baseUrl) || getGithubRawBase(cwd, branch);
  if (!base) return md;

  // images
  md = md.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/|data:)([^)]+)\)/g,
    (_, alt, path) => `![${alt}](${base}${String(path).replace(/^\.\//, "")})`,
  );

  // links (optional)
  if (rewriteLinks) {
    md = md.replace(
      /\[([^\]]+)\]\((?!https?:\/\/|mailto:|#)([^)]+)\)/g,
      (_, text, path) =>
        `[${text}](${base}${String(path).replace(/^\.\//, "")})`,
    );
  }

  return md;
}

const THEME_NPM = `
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    font: 16px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;
    background: #fff;
    color: #111;
  }
  .wrap { max-width: 960px; margin: 0 auto; padding: 32px 16px; }
  h1 { font-size: 32px; margin-top: 0; }
  h2 { font-size: 24px; margin-top: 32px; }
  h3 { font-size: 20px; margin-top: 24px; }
  pre { background: #f6f8fa; padding: 16px; border-radius: 8px; overflow: auto; }
  code { font-family: ui-monospace,SFMono-Regular,Menlo,monospace; background: #f6f8fa; padding: 2px 6px; border-radius: 4px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d0d7de; padding: 8px; }
  img { max-width: 100%; }
  a { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote { border-left: 4px solid #d0d7de; margin: 0; padding-left: 16px; color: #57606a; }
`;

const THEME_GITHUB = `
  :root { color-scheme: light dark; }
  body { margin: 0; font: 16px/1.6 -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 32px 16px; }
  pre { padding: 16px; border-radius: 6px; overflow: auto; border: 1px solid rgba(127,127,127,.25); }
  code { font-family: ui-monospace,SFMono-Regular,Menlo,monospace; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid rgba(127,127,127,.25); padding: 8px; }
  img { max-width: 100%; }
  blockquote { margin: 0; padding-left: 16px; border-left: 4px solid rgba(127,127,127,.35); }
`;

function pickTheme(theme: string): string {
  const t = String(theme || "").toLowerCase();
  if (t === "github") return THEME_GITHUB;
  return THEME_NPM;
}

export function renderReadmeHtml(markdown: string, opts: RenderOptions = {}): string {
  const {
    cwd = process.cwd(),
    branch = "HEAD",
    baseUrl,
    rewriteLinks = false,
    title = "README Preview",
    theme = "npm",
  } = opts;

  const processed = rewriteAssets(markdown, {
    cwd,
    branch,
    baseUrl: baseUrl === undefined ? null : baseUrl,
    rewriteLinks,
  });
  const raw = marked.parse(processed) as string;

  const safe = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ]),
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
      "*": ["id"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noreferrer noopener",
      }),
    },
  });

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>${pickTheme(theme)}</style>
</head>
<body>
<div class="wrap">${safe}</div>
</body>
</html>`;
}
