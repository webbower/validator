# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog][Keep a Changelog] and this project adheres to [Semantic Versioning][Semantic Versioning].

## [Unreleased]
### Added
- `.assertWhen(condition, test, failureMessage)` to only run an assertion conditionally.

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
