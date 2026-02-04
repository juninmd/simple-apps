# GEMINI.md

## Context
This repository contains "Zen Breather", a React Native Expo app.

## Learnings
- The app uses `Animated` API for the breathing circle.
- Initial state management was flawed (stale closures in `setTimeout`).
- Project was missing standard DevOps tools (linting, testing).
- `jest-expo` mocks `Animated` animations to finish instantly, which simplifies testing but requires awareness when asserting intermediate states.

## Current Status
- DevOps pipeline established.
- Codebase standardized.
- Critical bug in `App.tsx` regarding the breathing cycle loop has been resolved.
- Added "Stop" feature and improved accessibility.
