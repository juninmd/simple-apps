# GEMINI.md - Living Memory

## Project Overview
Tally Counter App is a React Native application managed with Expo.

## Learnings
- **Initial Audit (2024-05-20):**
    - The project lacks persistence, testing, and documentation.
    - Codebase is small (single `App.tsx`).
    - Uses `npm` initially, migrating to `pnpm`.
    - No CI/CD beyond basic APK build.
- **Testing Setup:**
    - Used `jest` with `preset: "react-native"` instead of `jest-expo` due to `ReferenceError` with `pnpm` and `expo` runtime.
    - `transformIgnorePatterns: []` was necessary to transform `react-native` (and dependencies) correctly in `pnpm` environment.
    - Achieved 100% line coverage on `App.tsx`.

## Key Decisions
- **Persistence:** using `@react-native-async-storage/async-storage`.
- **Package Manager:** Switching to `pnpm`.
- **Testing:** Introducing `jest` and `react-test-renderer` / `@testing-library/react-native`.

## Context
- This file should be updated with new insights, bottlenecks, and architectural decisions after every session.
