# Coding Styles

Project-specific coding conventions. Each section is an independent rule; new rules can be added as additional bullet points.

---

## Imports

- **`@patternfly/chatbot`** — always import from `@patternfly/chatbot/dist/dynamic/<ComponentName>`, never from the package root (`@patternfly/chatbot`) or internal paths (`dist/esm/…`); `dist/dynamic/` is the officially recommended sub-entry.
