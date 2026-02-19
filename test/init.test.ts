import test from "node:test";
import assert from "node:assert";
import { tmpdir } from "node:os";
import { mkdirSync, rmSync, readFileSync, existsSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { runInit } from "../src/init.js";

test("init: should create workflow file", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });

  try {
    await runInit({
      cwd,
      force: false,
      workflowOnly: false,
      readmeOnly: false,
      addAssets: false,
      workflowName: "Test Workflow",
    });

    const workflowPath = join(cwd, ".github", "workflows", "readme-preview.yml");
    assert(existsSync(workflowPath), "workflow file should exist");

    const content = readFileSync(workflowPath, "utf8");
    assert(content.includes("Test Workflow"), "workflow should have custom name");
    assert(content.includes("readme-preview check --strict"), "workflow should run check command");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});

test("init: should create README if missing", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });

  try {
    await runInit({
      cwd,
      force: false,
      workflowOnly: false,
      readmeOnly: false,
      addAssets: false,
      workflowName: "Test",
    });

    const readmePath = join(cwd, "README.md");
    assert(existsSync(readmePath), "README should be created");

    const content = readFileSync(readmePath, "utf8");
    assert(content.includes("# readme-preview"), "README should have title");
    assert(content.includes("## Badges"), "README should have badges section");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});

test("init: should not overwrite README without --force", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });

  try {
    const readmePath = join(cwd, "README.md");
    const originalContent = "# Original README";
    writeFileSync(readmePath, originalContent);

    await runInit({
      cwd,
      force: false,
      workflowOnly: false,
      readmeOnly: false,
      addAssets: false,
      workflowName: "Test",
    });

    const content = readFileSync(readmePath, "utf8");
    assert(content === originalContent, "README should not be modified without --force");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});

test("init: should overwrite with --force", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });

  try {
    const readmePath = join(cwd, "README.md");
    writeFileSync(readmePath, "# Original");

    await runInit({
      cwd,
      force: true,
      workflowOnly: false,
      readmeOnly: false,
      addAssets: false,
      workflowName: "Test",
    });

    const content = readFileSync(readmePath, "utf8");
    assert(content !== "# Original", "README should be modified with --force");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});

test("init: should skip README with --workflow-only", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });

  try {
    await runInit({
      cwd,
      force: false,
      workflowOnly: true,
      readmeOnly: false,
      addAssets: false,
      workflowName: "Test",
    });

    const readmePath = join(cwd, "README.md");
    assert(!existsSync(readmePath), "README should not be created with --workflow-only");

    const workflowPath = join(cwd, ".github", "workflows", "readme-preview.yml");
    assert(existsSync(workflowPath), "workflow should still be created");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});

test("init: should skip workflow with --readme-only", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });

  try {
    await runInit({
      cwd,
      force: false,
      workflowOnly: false,
      readmeOnly: true,
      addAssets: false,
      workflowName: "Test",
    });

    const workflowPath = join(cwd, ".github", "workflows", "readme-preview.yml");
    assert(!existsSync(workflowPath), "workflow should not be created with --readme-only");

    const readmePath = join(cwd, "README.md");
    assert(existsSync(readmePath), "README should still be created");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});

test("init: should create assets placeholder with --assets", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });

  try {
    await runInit({
      cwd,
      force: false,
      workflowOnly: true,
      readmeOnly: true,
      addAssets: true,
      workflowName: "Test",
    });

    const screenshotPath = join(cwd, "assets", "screenshot.png");
    assert(existsSync(screenshotPath), "screenshot.png should be created");

    const stat = statSync(screenshotPath);
    assert(stat.size > 0, "screenshot.png should not be empty");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});

test("init: should not overwrite assets without --force", async () => {
  const cwd = join(tmpdir(), "readme-preview-test-" + Date.now());
  mkdirSync(cwd, { recursive: true });
  mkdirSync(join(cwd, "assets"), { recursive: true });

  try {
    writeFileSync(join(cwd, "assets", "screenshot.png"), "original");

    await runInit({
      cwd,
      force: false,
      workflowOnly: true,
      readmeOnly: true,
      addAssets: true,
      workflowName: "Test",
    });

    const content = readFileSync(join(cwd, "assets", "screenshot.png"), "utf8");
    assert(content === "original", "assets should not be overwritten without --force");
  } finally {
    rmSync(cwd, { recursive: true });
  }
});
