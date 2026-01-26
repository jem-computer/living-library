# living-library

Zero-config documentation site generator for GSD `.planning` folders.

Run `npx living-library` in any repo with a `.planning` folder and instantly browse your project documentation as a clean, searchable site.

## Usage

```bash
# Start dev server with live reload
npx living-library

# Build static site for deployment
npx living-library build
```

That's it. No config files, no setup.

## Features

- **Zero config** — auto-detects `.planning` folder in your repo
- **GSD-aware navigation** — understands phases, milestones, research, todos
- **Full-text search** — powered by Pagefind, built at compile time
- **Light/dark themes** — respects system preference, toggle in header
- **Milestone timeline** — visualizes project history from ROADMAP.md
- **Live reload** — file changes reflect instantly during development
- **Static build** — deploy anywhere (Netlify, Vercel, GitHub Pages)

## What it expects

A `.planning` folder with markdown files. Works great with [get-shit-done](https://github.com/anthropics/claude-code) project structure:

```
your-repo/
├── .planning/
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── REQUIREMENTS.md
│   ├── phases/
│   │   ├── 01-foundation/
│   │   └── 02-features/
│   └── milestones/
└── src/
```

But any `.planning` folder with markdown files will work.

## CLI Options

```bash
# Dev server
npx living-library [options]
  --port, -p     Port number (default: 4321, auto-finds free port)
  --verbose, -v  Show detailed output

# Static build
npx living-library build [options]
  --output, -o   Output directory (default: ./dist)
  --verbose, -v  Show detailed output
```

## Part of the development coven

- **[get-shit-done](https://github.com/anthropics/claude-code)** — AI-native project execution framework
- **living-library** — documentation viewer for GSD projects
- **[Esoterica](https://github.com/anthropics/esoterica)** — tarot for developers

## License

MIT
