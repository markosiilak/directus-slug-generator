## [1.1.1] - 2025-08-08

### Added
- Version 1.1.1 release

## [1.1.0] - 2025-08-08

### Added
- Version 1.1.0 release

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of the Directus Slug Generator extension
- **Auto-Update Functionality**: Automatically update URL values when source fields change
- **Multiple Update Modes**: 
  - On Change: Update when source field value changes
  - On Blur: Update when source field loses focus
  - On Focus: Update when source field gains focus
  - Real-time: Update continuously as user types
  - Disabled: No automatic updates
- **Preserve Existing Values**: Option to keep existing URLs when source content changes
- **Configurable Update Delay**: Set delay before triggering updates
- **Advanced Field Detection**: Support for various field types including Directus components
- **Date Field Support**: Special handling for date fields with multiple formats
- **Multi-language Transliteration**: Support for accented characters, Cyrillic, German/Nordic characters
- **Comprehensive Validation**: URL format and uniqueness validation
- **Interactive Interface**: Preview/edit mode with validation feedback
- **Custom Error Messages**: Configurable validation messages
- **Hierarchical Path Support**: Support for URLs with slashes and paths

### Features
- Automatic slug generation from any field in collection
- Real-time validation with visual feedback
- Support for translation collections
- Configurable separators (hyphen, underscore)
- Case sensitivity options
- Unique slug validation within collections
- Status-based validation (draft/published)
- Manual slug regeneration capability
- Responsive design with Directus UI integration

### Technical
- TypeScript support with full type definitions
- Vue 3 composition API
- Directus Extensions SDK v9 compatibility
- Modular architecture with separate utilities
- Comprehensive error handling
- Performance optimized with debounced updates 