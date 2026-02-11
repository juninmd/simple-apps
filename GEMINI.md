# Gemini Memory

## Repository Overview
- **Name**: app-voice-vault
- **Tech Stack**: React Native, Expo, TypeScript.
- **State**: Prototype with recording, playback, and deletion capabilities.

## Context & Learnings
- **Audio Handling**: Uses `expo-av` for recording and playback.
- **State Management**: Local component state (`useState`).
- **Issues**:
  - No persistence (recordings are lost on app reload).
  - Tests require mocking `expo-av` carefully (especially `unloadAsync` returning a Promise).
  - Jest with `pnpm` and `react-native` requires careful `transformIgnorePatterns` configuration.

## Updates
- [2024-05-23] Initial audit performed. Standardized repo, added tests (Jest + Testing Library), implemented "Delete Recording" feature. Added Semantic Release to CI.
