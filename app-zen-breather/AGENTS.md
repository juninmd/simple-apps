# AGENTS.md

## Overview

This file serves as a guide for AI agents working on this codebase. It contains context, conventions, and a roadmap.

## Project Structure

- `App.tsx`: Main entry point and component.
- `app.json`: Expo configuration.
- `.github/workflows/`: CI/CD pipelines.

## Conventions

- **Package Manager**: Use `pnpm`.
- **Code Style**: Follow `.eslintrc.js` and `.prettierrc`.
- **Testing**: Use `jest` and `@testing-library/react-native`. Aim for high coverage.
- **Constraints**:
  - Prefer functional components and Hooks.
  - Keep logic simple and readable.

## Future Roadmap

1. **State Management**: Refactor `App.tsx` to use a reducer or context if state becomes complex.
2. **Settings Screen**: Allow users to customize breathing timings (currently hardcoded 4-4-4-4).
3. **Sound Effects**: Add soothing sounds for each phase.
4. **Haptic Feedback**: Add vibrations for phase changes.

## Living Memory

- **2023-10-27**: Initial audit performed. Identified critical bug in `App.tsx` (stale closure) and missing CI/CD.
