# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.3.0](///compare/v0.2.2...v0.3.0) (2026-09-24)


### Features

* add max auto-approve steps limit for workspace tool calls d92e5e3
* add new Chat AI view 43c3ef9
* add permission control (auto-approval) for workspace tools a301880, closes #92
* implement workspace tools f8d71b8, closes #41
* show auto-approved tool names in bot message dcb4768
* show tool names in manual approval request message afc4f22


### Bug Fixes

* handle tool call errors, rejection state, and input validation b869201
* re-enable send button after rejecting a tool call e20276f
* remove approve/reject buttons after tool call decision 433289b
* resolve pending tool calls when auto-tool limit is reached 54fbeb9
* upgrade react-router to 7.18.3 for @hawtio/react 2.3.0 711d530
* workaround max-width in AI prefs 02ff173

## [0.2.2](///compare/v0.2.1...v0.2.2) (2026-06-19)


### Bug Fixes

* thinking info is not displayed with messages in Chatbot [#40](undefined/undefined/undefined/issues/40) 3956479

## [0.2.1](///compare/v0.2.0...v0.2.1) (2026-06-17)


### Bug Fixes

* chat history [#39](undefined/undefined/undefined/issues/39) 401ea48
* upgrade @hawtio/react to 2.3.0-pre.1 d52e5de

## [0.2.0](///compare/v0.1.6...v0.2.0) (2026-06-03)


### Features

* integrate diagnose function with PF 6 Chatbot UI component 27c8364, closes #14


### Bug Fixes

* build with updated langchain deps 4b2c9fb

## [0.1.6](///compare/v0.1.5...v0.1.6) (2026-05-01)


### Bug Fixes

* make attribute modal open automatically after diagnosis finished 06725b6

## [0.1.5](///compare/v0.1.1...v0.1.5) (2026-05-01)


### Features

* add support for OpenAI & Anthropic models 306638d, closes #10


### Bug Fixes

* exclude test app from releasing 5c107bd
* skip publishing test app (finally) 2bb437e
* skip test app deployment (again) 2209659

## [0.1.1](///compare/v0.1.0...v0.1.1) (2026-04-23)


### Bug Fixes

* support tsup build for npm packaging 215cdb8
* upgrade Hawtio to 5.1.0 to fix remote plugin loading at app 68f8571

## 0.1.0 (2026-04-07)
