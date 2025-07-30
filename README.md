# Slug Generator Extension

A Directus extension that automatically generates URL-friendly slugs from other fields in your collection.

## Features

- **Automatic Slug Generation**: Generate slugs from any field in your collection
- **Auto-Update Functionality**: Automatically update URL values when source fields change
- **Multiple Update Modes**: Choose when to trigger updates (on change, blur, focus, or real-time)
- **Preserve Existing Values**: Option to keep existing URLs when source content changes
- **Date Field Support**: Special handling for date fields with various formats
- **Multi-language Support**: Transliteration for special characters
- **Validation**: Built-in validation for URL format and uniqueness
- **Customizable**: Configurable separators, case sensitivity, and error messages

## Auto-Update Configuration

The extension now supports automatic URL updates with the following options:

### Auto Update Mode
- **Disabled**: No automatic updates
- **On Change**: Update when the source field value changes
- **On Blur**: Update when the source field loses focus
- **On Focus**: Update when the source field gains focus
- **Real-time**: Update continuously as the user types

### Additional Options
- **Preserve Existing Values**: When enabled, existing URL values won't be overwritten if the source field changes
- **Update Delay**: Configure the delay (in milliseconds) before triggering an update

## Usage

1. **Configure the Interface**:
   - Set the source collection and field
   - Choose your auto-update mode
   - Configure other options as needed

2. **Field Setup**:
   - Add the slug generator interface to your target field
   - Configure the source field that should trigger updates
   - Set your preferred update behavior

3. **Auto-Update Behavior**:
   - The URL field will automatically update based on your configuration
   - Users can still manually edit the URL if needed
   - Validation ensures URL format and uniqueness

## Example Configuration

```javascript
// Interface configuration
{
  select_collection: 'articles',
  select_field: 'title',
  auto_update_mode: 'change',
  preserve_existing: false,
  update_delay: 100,
  separator: '-',
  lowercase: true
}
```

## Advanced Usage

### Programmatic Auto-Updates

You can also trigger auto-updates programmatically:

```javascript
import { autoUpdateField } from './utils/autoUpdate';

// Update a single field
const result = await autoUpdateField('title', 'url', {
  separator: '-',
  lowercase: true,
  preserveExisting: false
});

console.log('Update result:', result);
```

### Custom Auto-Updater Instance

For more control, create a custom auto-updater:

```javascript
import { createAutoUpdater } from './utils/autoUpdate';

const updater = createAutoUpdater({
  sourceField: 'title',
  targetField: 'url',
  separator: '-',
  lowercase: true,
  autoUpdate: true,
  preserveExisting: false,
  updateOnChange: true,
  updateOnBlur: false,
  updateOnFocus: false
});

// Initialize the updater
updater.initialize();

// Manual update
const result = await updater.update();

// Clean up
updater.destroy();
```

## Field Detection

The extension automatically detects various field types and handles them appropriately:

- **Text Fields**: Standard text input, textarea, contenteditable
- **Date Fields**: Date inputs with various formats (ISO, DD/MM/YY, MM/DD/YY, natural language)
- **Directus Fields**: Vuetify input components, field containers

## Transliteration

Special characters are automatically converted to URL-friendly equivalents:

- **Accented Characters**: é → e, ñ → ny, etc.
- **Cyrillic**: а → a, б → b, etc.
- **German/Nordic**: ä → ae, ö → oe, ß → ss, etc.

## Validation

The extension includes comprehensive validation:

- **URL Format**: Ensures valid URL structure
- **Uniqueness**: Checks for duplicate slugs (configurable)
- **Status-based**: Respects draft/published status
- **Custom Messages**: Configurable error messages

## Installation

1. Copy the extension to your Directus extensions directory
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Restart Directus
5. Configure the interface in your collection fields

## Development

```bash
# Install dependencies
npm install

# Build for development
npm run build

# Watch for changes
npm run dev
```

## License

MIT License

