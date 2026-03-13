# Jules Agent Protocol - Local Context

## Scope

This file applies to the `app-decision-roulette` repository.

## Roadmap

See `ROADMAP.md` for the current project status and future plans.

## Constraints

- Use `pnpm` for package management.
- Ensure 100% test coverage for new/modified code.

## Sentinel Log

- **Testing**: Fixed `App.test.tsx` React `act(...)` console warnings via fake timers and `unmount()`.
- **Linting & Formatting**: Implemented ESLint + Prettier configuration.

## Release-Bot Log

- **CI/CD Setup**: Generated GitHub Actions workflow (`main.yml`) with automated linting, testing, Android APK building, and semantic releases.
