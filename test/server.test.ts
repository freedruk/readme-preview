import test from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { rmSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { writeBuild } from "../src/server.js";

test("server: should write build to .readme-preview/index.html", async () => {
  const originalCwd = process.cwd();
  const testDir = join(tmpdir(), "server-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });

  try {
    process.chdir(testDir);

    const html = "<html><body>Test</body></html>";
    const out = await writeBuild(html);

    assert(out.includes(".readme-preview"), "output path should include .readme-preview");
    assert(out.endsWith("index.html"), "output should be index.html");
    assert(existsSync(out), "file should be created");

    const content = readFileSync(out, "utf8");
    assert(content === html, "file should contain the provided HTML");
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true });
  }
});

test("server: should create directory structure if missing", async () => {
  const originalCwd = process.cwd();
  const testDir = join(tmpdir(), "server-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });

  try {
    process.chdir(testDir);

    const html = "<html>Test</html>";
    const out = await writeBuild(html);

    const buildDir = join(testDir, ".readme-preview");
    assert(existsSync(buildDir), ".readme-preview directory should exist");
    assert(existsSync(out), "index.html should exist");
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true });
  }
});

test("server: should overwrite existing build", async () => {
  const originalCwd = process.cwd();
  const testDir = join(tmpdir(), "server-test-" + Date.now());
  mkdirSync(testDir, { recursive: true });

  try {
    process.chdir(testDir);

    await writeBuild("<html>First</html>");
    const out = await writeBuild("<html>Second</html>");

    const content = readFileSync(out, "utf8");
    assert(content === "<html>Second</html>", "should overwrite with new content");
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true });
  }
});
