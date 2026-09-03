# AGENTS.md

Guidelines for AI coding agents working on this repository.

## Project Info

- Primary language: Java (backend), TypeScript + React (frontend)
- Build tool: Maven (backend), Yarn v4 + Webpack (frontend)
- Java version: 17
- Node.js version: v24 (managed by `frontend-maven-plugin`)
- UI framework: [PatternFly v6](https://www.patternfly.org/)
- AI library: [LangChain.js](https://js.langchain.com/) (`langchain`, `@langchain/*`)
- Commit style: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `chore:`, etc.)

## Project Structure

This repository is an extension plugin that adds AI functionality to [Hawtio v5](https://github.com/hawtio/hawtio). It consists of a TypeScript/React plugin module and a Spring Boot test application.

```text
.
├── plugin/               # @hawtio/ai-plugin — TypeScript/React plugin (npm package)
└── app/                  # hawtio-ai-plugin-test-app — Spring Boot test application
```

## Documentation Index

Read these documents **only when the task requires it** — do not load them all upfront.

| Document | When to read |
| --- | --- |
| [`README.md`](README.md) | Project overview, installation, and development guide |
| [`plugin/README.md`](plugin/README.md) | Plugin-specific details |
| [`plugin/CHANGELOG.md`](plugin/CHANGELOG.md) | Release history |

## Essential Commands

```bash
# Build everything (Maven + frontend)
mvn clean install

# Run the test app (uses already-built frontend assets)
mvn spring-boot:run -pl app -Dskip.yarn

# Fast rebuild: skip yarn when only Java changed
mvn spring-boot:run -Dskip.yarn
```

```bash
# Frontend-only commands (run inside plugin/)
cd plugin

yarn start          # start Webpack dev server (hot reload at http://localhost:3001/hawtio/)
yarn build          # production Webpack build
yarn build:tsup     # library build via tsup (used for npm publish)
yarn test           # run Jest tests
yarn format:check   # check Prettier formatting
yarn format:fix     # auto-fix Prettier formatting
```

## Development Workflow

For a fast frontend feedback cycle, run the backend and frontend separately:

1. Start the Spring Boot test app in one terminal:

   ```bash
   mvn spring-boot:run -Dskip.yarn
   ```

2. Start the plugin in dev mode in another terminal:

   ```bash
   cd plugin
   yarn start
   ```

3. Open <http://localhost:3001/hawtio/> to preview the plugin.
4. To test JMX features, use the Connect plugin at <http://localhost:3001/hawtio/connect> and point it to the Jolokia endpoint at <http://localhost:8080/hawtio/jolokia>.

## Testing

- Unit tests: `yarn test` inside `plugin/`, or automatically via `mvn install`.
- No E2E test suite in this repository yet.

## Code Style

See [`.editorconfig`](.editorconfig) and [`plugin/.prettierrc.js`](plugin/.prettierrc.js).
