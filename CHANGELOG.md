# Change Log
All notable changes to the "cursor-align" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.4] - 2024-12-17
### Changed
- Updated icon.

## [2.0.3] - 2024-12-17
### Changed
- Updated icon.

## [2.0.2] - 2024-10-28
### Changed
- Remove uneeded images from vsix.

## [2.0.1] - 2024-10-28
### Changed
- Updated description.

## [2.0.0] - 2024-10-27
### Added
- Multi-column support.
- Alignment using tabs.

### Changed
- ⚠️ **Breaking:** Multiple selections per line are now aligned in groups rather than being combined into a single selection.
- ⚠️ **Breaking:** Multiline selections are now ignored rather than being split into two 0-length selections.
- ⚠️ **Breaking:** Tab size setting is now respected rather than always having a column span of 1.

### Fixed
- Surrogate pairs are now considered to have a column span of 1 rather than 2.

## [1.1.2] - 2023-07-12
### Changed
- Updated icon.

## [1.1.0] - 2021-11-29
### Added
- Added web support.
- Added local support.

### Changed
- Cleaned up dependencies.

## [1.0.4] - 2017-09-06
### Changed
- Updated readme and demo GIFs.

## [1.0.3] - 2017-09-06
### Removed
- Removed known issues from README.

## [1.0.2] - 2017-09-06
### Fixed
- Fixed selections on redo.

## [1.0.1] - 2017-09-01
### Added
- Added keybindings and urls to manifest.

### Fixed
- Fixed URLs in changelog.

## [1.0.0] - 2017-08-31
### Added
- Inital Release

[Unreleased]: https://github.com/yo1dog/vscode-cursor-align/compare/v2.0.4...HEAD
[2.0.1]: https://github.com/yo1dog/vscode-cursor-align/compare/v2.0.3...v2.0.4
[2.0.1]: https://github.com/yo1dog/vscode-cursor-align/compare/v2.0.2...v2.0.3
[2.0.1]: https://github.com/yo1dog/vscode-cursor-align/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/yo1dog/vscode-cursor-align/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/yo1dog/vscode-cursor-align/compare/v1.1.2...v2.0.0
[1.1.2]: https://github.com/yo1dog/vscode-cursor-align/compare/v1.1.0...v1.1.2
[1.1.0]: https://github.com/yo1dog/vscode-cursor-align/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/yo1dog/vscode-cursor-align/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/yo1dog/vscode-cursor-align/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/yo1dog/vscode-cursor-align/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/yo1dog/vscode-cursor-align/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/yo1dog/vscode-cursor-align/releases/tag/v1.0.0
