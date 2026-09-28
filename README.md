[![Tests](https://github.com/OMICRONEnergyOSS/oscd-editor-subscriber-databinding/actions/workflows/test.yml/badge.svg)](https://github.com/OMICRONEnergyOSS/oscd-editor-subscriber-databinding/actions/workflows/test.yml) ![NPM Version](https://img.shields.io/npm/v/@omicronenergy/oscd-editor-subscriber-databinding)

# Subscriber Data Binding

## `<oscd-editor-subscriber-databinding>`

## What is this?

This is an [OpenSCD](https://openscd.org) editor plugin for GOOSE and SMV (Sampled Values) subscriber data binding. Start up a demo server with `npm run start` and see for yourself!

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

## Testing with Web Test Runner

To execute a single run of the unit tests (`src/**/*.spec.ts`):

```bash
npm run test
```

To run the unit tests in interactive watch mode run:

```bash
npm run test:watch
```

To run the visual regression tests (`src/**/*.test.ts`), or update their baseline screenshots:

```bash
npm run test:visual
npm run test:update
```

## Tooling configs

This package uses [`@omicronenergy/oscd-tooling`](https://www.npmjs.com/package/@omicronenergy/oscd-tooling) for linting, building, bundling, testing, deploying and git hooks. The `oscd` CLI it provides resolves its own shared configs (ESLint, TypeScript, Rollup, Web Test Runner, commitlint, lint-staged), so this repo only keeps the minimal config it needs:

- `package.json` `scripts` call `oscd <command>` instead of invoking each tool directly.
- `tsconfig.json` and `eslint.config.js` are thin wrappers that extend `@omicronenergy/oscd-tooling`'s shared configs.
- `npm run prepare` (`oscd install-hooks`, run automatically by `npm install`) installs Git hooks into `.githooks/` and points `core.hooksPath` at them.

If you need to diverge from the shared defaults for a specific tool, add a local config file of the same name (e.g. `rollup.config.js`) - see the `@omicronenergy/oscd-tooling` README for what's overridable.

## Local Demo with `web-dev-server`

```bash
npm run start
```

To run a local development server that serves the basic demo located in `demo/index.html`

&copy; 2025 OMICRON electronics GmbH

## License

[Apache-2.0](LICENSE)
