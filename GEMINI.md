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
  - **Documentation**: Established `ROADMAP.md` and updated `AGENTS.md` to streamline project tracking.

## Context

- **Tech Stack**: React Native, Expo, TypeScript.
- **Package Manager**: pnpm.
