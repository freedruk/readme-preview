import test from "node:test";
import assert from "node:assert";
import { runChecks } from "../src/check.js";

test("check: should pass valid README", () => {
  const md = `# My Project

This is a description of my project.

## Install

\`\`\`bash
npm install my-project
\`\`\`

## Usage

\`\`\`bash
npm run my-project
\`\`\`
`;
  const { issues, strictIssues } = runChecks(md);
  assert.strictEqual(issues.length, 0, "should have no issues");
});

test("check: should detect missing H1", () => {
  const md = `## My Project\n\nSome content`;
  const { issues } = runChecks(md);
  assert.strictEqual(issues.length, 1, "should detect missing H1");
  assert.match(issues[0], /H1/);
});

test("check: should detect relative image URLs", () => {
  const md = `# Project\n\n![screenshot](./assets/screenshot.png)`;
  const { issues } = runChecks(md);
  assert.strictEqual(issues.length, 1, "should detect relative images");
  assert.match(issues[0], /image/i);
});

test("check: should allow absolute image URLs", () => {
  const md = `# Project\n\n![screenshot](https://example.com/screenshot.png)`;
  const { issues } = runChecks(md);
  assert.strictEqual(issues.length, 0, "should allow absolute URLs");
});

test("check: should allow data: URLs", () => {
  const md = `# Project\n\n![screenshot](data:image/png;base64,abc123)`;
  const { issues } = runChecks(md);
  assert.strictEqual(issues.length, 0, "should allow data URLs");
});

test("check: should warn about short README (strict)", () => {
  const md = `# Short`;
  const { strictIssues } = runChecks(md);
  assert(strictIssues.some((i) => i.includes("short")), "should warn about short README");
});

test("check: should warn about missing code blocks (strict)", () => {
  const md = `# Project\n\nThis is a long enough project description but it has no code examples at all.`;
  const { strictIssues } = runChecks(md);
  assert(strictIssues.some((i) => i.includes("code")), "should warn about missing code blocks");
});

test("check: should detect HTML tags (strict)", () => {
  const md = `# Project\n\n<div>HTML content</div>\n\n\`\`\`\n<div>code block</div>\n\`\`\``;
  const { strictIssues } = runChecks(md);
  assert(strictIssues.some((i) => i.includes("HTML")), "should detect HTML outside code blocks");
});

test("check: should ignore HTML in code blocks", () => {
  const md = `# Project\n\n\`\`\`\n<div>HTML in code</div>\n\`\`\`\n\n## Install\n\nnpm install`;
  const { strictIssues } = runChecks(md);
  assert(!strictIssues.some((i) => i.includes("HTML")), "should ignore HTML in code blocks");
});

test("check: should warn about missing Install section (strict)", () => {
  const md = `# Project\n\nSome description\n\n\`\`\`bash\ncode\n\`\`\`\n\n## Usage\n\nUsage here`;
  const { strictIssues } = runChecks(md);
  assert(strictIssues.some((i) => i.includes("Install")), "should warn about missing Install");
});

test("check: should warn about missing Usage section (strict)", () => {
  const md = `# Project\n\nSome description\n\n\`\`\`bash\ncode\n\`\`\`\n\n## Install\n\nInstall here`;
  const { strictIssues } = runChecks(md);
  assert(strictIssues.some((i) => i.includes("Usage")), "should warn about missing Usage");
});

test("check: should ignore spaces in code blocks", () => {
  const md = `# Project\n\n\`\`\`\n[link]( http://example.com )\n\`\`\`\n\n## Install\n\nnpm i\n\n## Usage\n\ncode`;
  const { strictIssues } = runChecks(md);
  assert(!strictIssues.some((i) => i.includes("spaces")), "should ignore spaces in code blocks");
});
