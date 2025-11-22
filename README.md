# Absolute Minority

A mobile-first party game where players vote on dares and race to five points. This repository currently contains the functional and technical specification for version 1 of the web experience and a reference implementation of the round resolution logic.

## Specification

See [docs/functional-technical-spec.md](docs/functional-technical-spec.md) for the full game rules, flows, and architectural outline.

## Game logic prototype

The `src/gameLogic.js` module models the authoritative round resolution rules described in the specification, including:

- Majority/minority handling and special one-vote edge cases.
- Full-score reset when everyone votes NO.
- Challenge assignment, elimination on failed performances, and winner detection with the specified tie-breaker.

A lightweight test harness in `tests/run-tests.js` executes scenario-based assertions in `tests/gameLogic.test.js` without external dependencies.

### Running tests

```bash
npm test
```

All tests are written with Node's built-in `assert` and a minimal test runner to avoid external package installation.
