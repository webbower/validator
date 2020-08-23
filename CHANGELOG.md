# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][Keep a Changelog] and this project adheres to [Semantic Versioning][Semantic Versioning].

## [Unreleased]
### Added
- `Validator#assertWhen(condition, test, failureMessage)` to only run an assertion conditionally.
- `Validator.Optional()` to create a `Validator` that will pass all assertions for nil (`null` or `undefined`) values.
- Prettier with ESLint integration and reformatted files.
- Enable CJS and ESM support.
- `Validator#hasErrors()` method to check for assertions that threw errors.

### Changed
- Replaced `tape` with `riteway` for testing and updated testing NPM commands to use `chokidar` instead of `watch`.
- Changed naming of private and public APIs for better debugging and stack trace reporting.

## [0.1.0] - 2020-04-16
### Added
- `Validator` with baseline functionality:
  - `.assert()` to apply tests with failure messages
  - `.hasFailures()` to test whether any assertions failed
  - `.getFailuresAndErrors()` to get all assertion failures and `ValidationError`s thrown by assertions
  - `.getFailures()` to get all assertion failure messages
  - `.getErrors()` to get all `ValidationError`s thrown by assertions
- `ValidationError` to wrap errors thrown by assertions
- Unit tests for baseline functionality

<!-- Links -->
[Keep a Changelog]: https://keepachangelog.com/
[Semantic Versioning]: https://semver.org/

<!-- Versions -->
[Unreleased]: https://github.com/webbower/validator/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/webbower/validator/releases/v0.1.0
