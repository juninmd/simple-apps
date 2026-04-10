# GEMINI Memory

## Project Overview

`app-decision-roulette` is a React Native application built with Expo that provides a simple decision-making wheel.

## Key Learnings

- **Initial Audit (2025-02-18)**:
  - **Infrastructure**: Established `pnpm`, `jest`, `jest-expo`, and GitHub Actions for testing.
  - **Fixes**: Resolved a critical animation bug in `App.tsx` where `Animated.Value` was re-created on every render.
  - **Standardization**: Added `README`, `CONTRIBUTING`, templates, and `AGENTS.md`/`GEMINI.md`.
  - **Testing**: Jest 30 is incompatible with current `jest-expo`/`react-native` setup; downgraded to Jest 29.7.0.
- **Antigravity Audit**:
  - **Refactor**: Extracted `OPTIONS` constant in `App.tsx` to improve performance and readability.
  - **Tests**: Resolved React `act(...)` console warnings during tests in `App.test.tsx` by using fake timers, cleaning up components with `unmount`, and fast-forwarding timers.
  - **E2E Testing**: Implemented basic Maestro E2E test script (`.maestro/app.yaml`) to automate interactions and verify results.
  - **Audit**: Verified component sizes are below 150 lines.
  - **Documentation**: Established `ROADMAP.md` and updated `AGENTS.md` to streamline project tracking.
- **CI/CD Integration (Release-Bot)**:
  - **Pipeline**: Configured `main.yml` with setup, lint, test, build, and release steps.
  - **Releases**: Integrated `semantic-release` for automated versioning and changelog generation.

## Context

- **Tech Stack**: React Native, Expo, TypeScript.
- **Package Manager**: pnpm.
