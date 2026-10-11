# Loopit

Loopit is an open-source, browser-based AI app builder. Describe an app, generate and edit its code, and run a live preview in your browser.

Loopit is an independent fork of [bolt.diy](https://github.com/stackblitz-labs/bolt.diy). It builds on that project's WebContainer runtime and AI provider integrations. The project is under active development; this fork is not affiliated with StackBlitz.

## What works today

- Generate and edit full-stack JavaScript projects with an AI chat workflow.
- Run project commands and previews in a browser-based WebContainer.
- Configure supported cloud and local AI providers and select models.
- Import, export, and manage project files; connect Git and supported deployment providers.
- Use the existing desktop app build in addition to the browser app.

### API key and browser notes

You provide the API keys for the AI provider you choose, and that provider may charge you for usage. AI provider keys are held in page memory and sent explicitly with the model requests that need them; they are not persisted in the browser by Loopit. Model requests still pass through Loopit's app routes and are not yet sent directly from the browser to AI providers. Refreshing the page clears the entered AI keys, so you will need to enter them again. Integration credentials used by Git and deployment features are separate.

Project execution relies on WebContainers. Browser support and required cross-origin isolation headers depend on the runtime and hosting setup, so test your target browsers and deployment before relying on them in production. Commercial use of WebContainers may require a separate license; see the [WebContainers terms](https://webcontainers.io/enterprise).

## Run locally

### Requirements

- Node.js 18.18 or newer
- pnpm
- A supported browser for WebContainers

### Install and start

```bash
git clone https://github.com/<your-account>/loopit.git
cd loopit
pnpm install
pnpm dev
```

If you need local environment overrides, copy the example file before starting the server. In PowerShell:

```bash
Copy-Item .env.example .env.local
```

On macOS or Linux:

```bash
cp .env.example .env.local
```

Open the local URL printed by the dev server. Add provider credentials in the app's provider settings; do not commit `.env.local` or real API keys.

## Common commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local development server |
| `pnpm build` | Build the browser app |
| `pnpm test` | Run the test suite |
| `pnpm lint` | Lint the app source |
| `pnpm typecheck` | Run the TypeScript check |

## Technology

Loopit uses Remix, React, Vite, and WebContainers. The existing codebase also includes an Electron desktop target and integrations for AI providers, Git, and deployment services.

## Upstream and attribution

This project is derived from [bolt.diy](https://github.com/stackblitz-labs/bolt.diy), an open-source project originally started by [Cole Medin](https://www.youtube.com/@ColeMedin) and maintained by its contributors. See the upstream [documentation](https://stackblitz-labs.github.io/bolt.diy/) and [community resources](https://thinktank.ottomator.ai/) for material about the inherited codebase.

The source code is distributed under the [MIT License](./LICENSE). Third-party services, dependencies, and WebContainers have their own terms and licensing requirements.
