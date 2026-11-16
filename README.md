# teststore.e2e

End-to-end tests for [teststore.automationtesting.co.uk](https://teststore.automationtesting.co.uk), built with [Playwright](https://playwright.dev) and TypeScript.

> **AI-generated tests.** The tests and page objects in this repo are generated with [Claude Code](https://claude.com/claude-code).
> To extend or maintain them, use Claude Code with the project skills and agents in [`.claude/`](.claude):
>
> - Skills: `page-object-creator`, `playwright-cli`
> - Agents: `playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer`

## Prerequisites

- [Node.js](https://nodejs.org) latest 22.x, 24.x or 26.x.
- [Claude Code](https://claude.com/claude-code), only needed to generate or update tests

## Setup

```bash
npm ci
npx playwright install --with-deps
```

## Running tests

```bash
npx playwright test                    # all tests, all browsers
npx playwright test --project=chromium # single browser
npx playwright test tests/auth         # single folder or file
npx playwright test --ui               # interactive UI mode
npx playwright show-report             # open the last HTML report
```

## Project structure

```text
pages/   Page objects and their locators
tests/   Test specs
data/    Test data
.claude/ Claude Code skills and agents
```
