# Agents Guide

## Scope
This document applies to the entire `app-voice-vault` repository.

## Project Structure
- `App.tsx`: Main application component.
- `assets/`: Static assets (images, fonts).
- `.github/workflows/`: CI/CD pipelines.

## Development Standards
- **Language**: TypeScript (preferred) / JavaScript.
- **Framework**: React Native with Expo.
- **Package Manager**: pnpm.
- **Styling**: `StyleSheet` from `react-native`.

## Coding Conventions
- Use functional components and Hooks.
- Ensure all new functions have JSDoc comments.
- Maintain a flat component structure where possible.
- Avoid "magic numbers"; use constants or calculated values.

## Testing
- Ensure 100% test coverage for new features.
- Run `pnpm test` before committing.

## Future Roadmap
1. [High Priority] Add persistence (save recordings to disk/AsyncStorage).
2. [Medium Priority] Add ability to rename recordings.
3. [Low Priority] Optimize large list rendering with `FlashList`.
