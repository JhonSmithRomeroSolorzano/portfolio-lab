# Jhon Smith Romero · Portfolio Lab

A full-stack developer's portfolio, with an interactive experiment you can actually use.

**[Explore the portfolio](https://jhonsmithromerosolorzano.github.io/portfolio-lab/)** · **[GitHub profile](https://github.com/JhonSmithRomeroSolorzano)** · **[Roadmap](ROADMAP.md)**

## Signal Lab

Change incoming traffic, toggle a warm read cache, and slow down or disconnect the database. The interface shows how these choices affect successful requests, database demand, and mean response time.

This is an original, browser-only simulation, not a connection to live infrastructure. Every number follows the documented model in [`src/simulation.ts`](src/simulation.ts). The diagram shows a conceptual architecture; this first milestone does not run a Node API, Redis, or a database.

### Share an experiment

The address bar reflects your settings. Use **Copy experiment link** to share a URL that opens the same scenario at the lab. If clipboard access is unavailable, select and copy the fallback link. Shared links include only experiment settings, excluding unrelated query parameters.

For example, [`?traffic=300&cache=off&database=slow#lab`](https://jhonsmithromerosolorzano.github.io/portfolio-lab/?traffic=300&cache=off&database=slow#lab) opens 300 requests per second with no cache and a slow database. Invalid or repeated fields use their default values. **Reset the experiment** restores defaults and clears the experiment parameters.

### Model assumptions

- API overhead: 12 ms per request.
- Warm cache: adjustable hit rate (80% by default); hits complete in 8 ms when enabled.
- Database: 8 connections, 80 ms per read normally, 400 ms when slow.
- Capacity: `connections × 1000 / latencyMs` requests per second.
- Reads over capacity or to an offline database time out after 1,000 ms.
- Mean response time includes both successes and timeouts.

No queue, retries, writes, expiry, or network variability are modeled yet. These simplifications are deliberate and visible in the demo. The model illustrates trade-offs, not production performance.

## Run locally

Use Node.js 22.12+ (Node 24 LTS recommended).

```sh
npm ci
npm run dev
```

```sh
npm test       # behavior and boundary tests for the model
npm run build # strict TypeScript check and production build
npm run preview
```

## Project structure

```text
src/App.tsx            Portfolio and interactive controls
src/styles.css        Responsive layout and visual system
src/simulation.ts     Pure, typed simulation model
tests/                Model behavior tests
public/               Static assets
.github/workflows/    Validation and GitHub Pages deployment
```

The app uses React, TypeScript, and Vite. Relative asset paths support both GitHub Pages project URLs and root hosting. It has keyboard-operable controls, a skip link, live metric announcements, and reduced-motion support. Typography loads from Google Fonts with local fallbacks.

## About me

I'm Jhon Smith Romero, a full-stack developer with more than five years of experience working for a US-based company. My experience includes JavaScript, TypeScript, React, Mithril.js, Node.js, Express, NoSQL, SQL, Redis, WebSockets, Docker, testing, and GitHub Actions.

This repository contains original portfolio work. It does not contain employer code or client data. Features are developed with AI assistance and reviewed through tests, builds, and documented checks.

## Development approach

Each change should add something useful: a feature, a fix, a meaningful test, or an explanation of a real engineering decision. See [ROADMAP.md](ROADMAP.md) for the next milestone and [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.

## Deployment

GitHub Actions validates pull requests and deploys passing changes on `main` to GitHub Pages. The repository's Pages source must be set to **GitHub Actions**. The `.openai/hosting.json` manifest also supports an owner-private Sites preview.
