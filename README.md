# readme-preview

Preview, validate, and prepare your README for **npm** and **GitHub**
before publishing.

`readme-preview` helps you:

- 👀 **Preview** how Markdown renders
- 🧹 **Rewrite relative assets & links** to working raw URLs
- ✅ **Lint & validate** README quality (CI-ready)
- ⚡ **Bootstrap docs & CI** with a single `init` command

Designed to be **tiny, fast, and zero-config**.

---

# Install

No install required:

```bash
npx readme-preview
```

Or add as a dev dependency:

```bash
npm i -D readme-preview
```

---

# Quick Start

Preview your README in a browser:

```bash
npx readme-preview
```

Run CI-style validation:

```bash
npx readme-preview check --strict
```

Bootstrap README badges + GitHub Action:

```bash
npx readme-preview init --assets
```

---

# Commands

## `preview` (default)

Render README in a local browser preview.

```bash
npx readme-preview
```

Options:

```bash
--file <path>        Markdown file (default: README.md)
--port <number>      Preview port (default: 4173)
--no-open            Do not open browser
--theme <npm|github> Visual theme (default: npm)
--branch <name>      Git branch for raw URLs (default: HEAD)
--base-url <url>     Override raw base URL
--rewrite-links      Rewrite relative markdown links
```

### Examples

Preview a docs README:

```bash
npx readme-preview --file docs/README.md
```

Use GitHub theme:

```bash
npx readme-preview --theme github
```

Rewrite links + images using `main` branch:

```bash
npx readme-preview --branch main --rewrite-links
```

Preview GitLab repo:

```bash
npx readme-preview --base-url https://gitlab.com/user/repo/-/raw/main/
```

---

## `build`

Generate static HTML preview:

```bash
npx readme-preview build
```

Output:

    .readme-preview/index.html

Useful for:

- CI artifacts\
- documentation previews\
- static hosting

---

## `check`

Run README validation rules.

```bash
npx readme-preview check
```

Exit code:

- `0` → pass\
- `1` → issues found

### Strict mode

```bash
npx readme-preview check --strict
```

Strict checks include:

- Missing **H1 title**
- **Relative images**
- README **too short**
- Missing **code blocks**
- Missing **description under H1**
- **Raw HTML** usage
- Missing **Install** section
- Missing **Usage** section

Perfect for **CI enforcement**.

---

## `init`

Bootstrap README quality setup.

```bash
npx readme-preview init
```

Creates or updates:

- GitHub Action workflow\
- README badges section\
- Screenshot section\
- Quick start examples

### Options

```bash
--assets           Add placeholder screenshot
--workflow-only    Only create GitHub Action
--readme-only      Only patch README
--force            Overwrite existing files
--workflow-name    Custom workflow name
```

### Examples

Full setup:

```bash
npx readme-preview init --assets
```

Only CI workflow:

```bash
npx readme-preview init --workflow-only
```

Overwrite existing:

```bash
npx readme-preview init --force
```

---

# Asset & Link Rewriting

Relative paths like:

```md
![Demo](./assets/demo.png)
[Guide](./docs/guide.md)
```

Can be rewritten to:

    https://raw.githubusercontent.com/user/repo/HEAD/assets/demo.png
    https://raw.githubusercontent.com/user/repo/HEAD/docs/guide.md

Controlled by:

```bash
--branch
--base-url
--rewrite-links
```

Works with:

- GitHub\
- GitLab\
- Self-hosted repos

---

# Themes

Switch rendering style:

```bash
--theme npm
--theme github
```

Useful for matching:

- npm package page\
- GitHub README view

---

# CI Integration

Typical GitHub Action step:

```yaml
- name: README checks
  run: npx readme-preview check --strict
```

This ensures:

- Broken docs never reach `main`
- README quality stays high
- Contributors follow standards automatically

---

# Why use readme-preview?

Most projects discover README problems **after publishing**.

This tool lets you:

- Catch rendering issues **before npm release**
- Enforce **documentation quality in CI**
- Provide **working screenshots & links**
- Bootstrap **professional README structure instantly**

All in a **tiny CLI** with **no config**.

---

# Philosophy

Small tools.\
Real problems.\
Zero friction.

---

# License

MIT
