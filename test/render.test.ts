import test from "node:test";
import assert from "node:assert";
import { renderReadmeHtml } from "../src/render.js";

test("render: should render basic markdown to HTML", () => {
  const md = "# Hello\n\nWorld";
  const html = renderReadmeHtml(md);
  assert(html.includes("<h1>Hello</h1>"), "should contain h1");
  assert(html.includes("World"), "should contain content");
  assert(html.includes("<!doctype html>"), "should be valid HTML");
});

test("render: should include title in output", () => {
  const html = renderReadmeHtml("# Test", { title: "Custom Title" });
  assert(html.includes("<title>Custom Title</title>"), "should include custom title");
});

test("render: should use npm theme by default", () => {
  const html = renderReadmeHtml("# Test");
  assert(html.includes("color-scheme: light dark"), "should include color-scheme");
});

test("render: should use github theme when specified", () => {
  const html = renderReadmeHtml("# Test", { theme: "github" });
  assert(html.includes("color-scheme: light dark"), "should include color-scheme");
});

test("render: should sanitize HTML tags", () => {
  const md = "# Test\n\n<script>alert('xss')</script>\n\nSafe";
  const html = renderReadmeHtml(md);
  assert(!html.includes("<script>"), "should remove script tags");
  assert(html.includes("Safe"), "should keep text content");
});

test("render: should allow safe HTML tags", () => {
  const md = "# Test\n\n| Header |\n|--------|\n| Cell   |";
  const html = renderReadmeHtml(md);
  assert(html.includes("<table>"), "should allow table tags");
});

test("render: should render code blocks", () => {
  const md = "# Test\n\n```bash\necho hello\n```";
  const html = renderReadmeHtml(md);
  assert(html.includes("<pre>"), "should contain pre tag");
  assert(html.includes("<code>"), "should contain code tag");
});

test("render: should render inline code", () => {
  const md = "# Test\n\nUse `npm install` to install";
  const html = renderReadmeHtml(md);
  assert(html.includes("<code>"), "should contain inline code");
  assert(html.includes("npm install"), "should contain code content");
});

test("render: should render links with target=_blank", () => {
  const md = "# Test\n\n[Example](https://example.com)";
  const html = renderReadmeHtml(md);
  assert(html.includes("target=\"_blank\""), "should have target=_blank");
  assert(html.includes("rel=\"noreferrer noopener\""), "should have noopener rel");
});

test("render: should render images with alt text", () => {
  const md = "# Test\n\n![Screenshot](https://example.com/img.png)";
  const html = renderReadmeHtml(md);
  assert(html.includes("<img"), "should contain img tag");
  assert(html.includes("Screenshot"), "should contain alt text");
});

test("render: should rewrite relative image URLs when base URL provided", () => {
  const md = "# Test\n\n![img](./assets/screenshot.png)";
  const html = renderReadmeHtml(md, { baseUrl: "https://example.com/" });
  assert(html.includes("https://example.com/assets/screenshot.png"), "should rewrite relative URL");
});

test("render: should rewrite relative links when rewriteLinks is true", () => {
  const md = "# Test\n\n[link](./other.md)";
  const html = renderReadmeHtml(md, { baseUrl: "https://example.com/", rewriteLinks: true });
  assert(html.includes("https://example.com/other.md"), "should rewrite relative link");
});

test("render: should not rewrite hash links", () => {
  const md = "# Test\n\n[link](#section)";
  const html = renderReadmeHtml(md, { baseUrl: "https://example.com/", rewriteLinks: true });
  assert(html.includes("href=\"#section\""), "should keep hash links");
});

test("render: should not rewrite mailto links", () => {
  const md = "# Test\n\n[email](mailto:test@example.com)";
  const html = renderReadmeHtml(md, { baseUrl: "https://example.com/", rewriteLinks: true });
  assert(html.includes("mailto:test@example.com"), "should keep mailto links");
});

test("render: should handle absolute URLs in images", () => {
  const md = "# Test\n\n![img](https://example.com/img.png)";
  const html = renderReadmeHtml(md, { baseUrl: "https://other.com/" });
  assert(html.includes("https://example.com/img.png"), "should keep absolute URLs");
});

test("render: should wrap content in .wrap div", () => {
  const html = renderReadmeHtml("# Test");
  assert(html.includes('div class="wrap"'), "should wrap content");
});

test("render: should include viewport meta tag", () => {
  const html = renderReadmeHtml("# Test");
  assert(html.includes('name="viewport"'), "should include viewport meta");
});

test("render: should render blockquotes", () => {
  const md = "# Test\n\n> This is a quote";
  const html = renderReadmeHtml(md);
  assert(html.includes("<blockquote>"), "should contain blockquote");
  assert(html.includes("This is a quote"), "should contain quote content");
});
