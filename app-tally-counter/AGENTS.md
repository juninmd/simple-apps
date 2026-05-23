# AGENTS.md

This file guides autonomous agents working on this repository.

## Project Scope
Tally Counter App. A simple multi-counter application.

## Standards
- **Package Manager:** `pnpm`
- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **Testing:** Jest + React Native Testing Library. Aim for 100% coverage on changes.
- **Code Style:** Follow existing patterns. Use functional components and hooks.

## Future Roadmap
1.  **Refactor**: Split `App.tsx` into smaller components (Counter, CounterList, Controls).
2.  **Feature**: Add "Reset" button for individual counters.
3.  **Feature**: Add "Delete" button for counters.
4.  **UI/UX**: Improve styling and add dark mode support.
5.  **Analytics**: Integrate basic analytics (privacy-focused).

## Instructions for Agents
- Read `GEMINI.md` for context.
- Update `GEMINI.md` with new learnings.
- Ensure all new code is covered by tests.
- Run `pnpm test` before submitting.
