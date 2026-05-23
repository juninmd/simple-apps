# GEMINI Memory

## Project Context
Unit Converter Pro is a React Native (Expo) application for converting various units (Length, Weight, Temp, Speed).

## Tech Stack
- React Native
- Expo
- TypeScript
- pnpm (package manager)
- Jest (Testing)

## Key Learnings
- Project uses `pnpm`.
- Conversion logic has been extracted to `src/utils/converter.ts` to enable unit testing.
- `ts-jest` is used for unit testing logic, avoiding complex `jest-expo` setup for now.
- CI/CD pipeline set up for testing and building.

## Current State
- Documentation complete.
- Refactoring complete.
- 100% test coverage for utility logic.
- CI workflows in place.
