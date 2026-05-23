# Agents Guide

This file provides instructions and context for agents (AI and human) working on this repository.

## Development Guidelines
- **Package Manager**: `pnpm`
- **Linting**: `pnpm lint`
- **Testing**: `pnpm test`
- **Logic Rule**: Keep logic units under 100 lines. Refactor if larger.
- **Coverage**: Ensure 100% test coverage for new or modified logic.

## Roadmap
1. **High Priority**:
   - [x] Implement actual flashlight functionality.
   - [x] Add comprehensive unit tests.
   - [x] Setup CI/CD.

2. **Medium Priority**:
   - [ ] Add UI Tests (e.g., Maestro or Detox).
   - [ ] Improve Accessibility (ARIA labels, voiceover support).
   - [ ] Add " SOS " quick button.
   - [ ] Handle Camera permissions more gracefully (linking to settings).

3. **Low Priority**:
   - [ ] Settings screen (adjust WPM/speed).
   - [ ] Dark/Light mode toggle (system default is currently hardcoded dark-ish).
