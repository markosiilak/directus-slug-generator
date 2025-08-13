# Directus Slug Generator Extension

A powerful Directus extension that automatically generates URL-friendly slugs from other fields in your collection. Perfect for creating SEO-friendly URLs, blog posts, articles, and any content that needs clean, readable URLs.

## 🚀 Quick Start

### NPM Installation (Recommended)

```bash
npm install directus-slug-generator
```

### Manual Installation

1. Copy the extension to your Directus extensions directory
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Restart Directus
5. Configure the interface in your collection fields

## 📦 Installation Methods

### Method 1: NPM Package (Recommended)

```bash
# Install the latest version
npm install directus-slug-generator

```

### Method 2: Directus Extensions Directory

```bash
# Clone or download the extension
git clone https://github.com/markosiilak/directus-slug-generator.git
cd directus-slug-generator

# Install dependencies
npm install

# Build the extension
npm run build

# Copy to your Directus extensions directory
cp -r . /path/to/your/directus/extensions/interfaces/slug-generator/
```

### Method 3: GitHub Release

1. Download the latest release from [GitHub Releases](https://github.com/markosiilak/directus-slug-generator/releases)
2. Extract to your Directus extensions directory
3. Install dependencies and build

## 🔧 Configuration

### 1. Add to Your Collection

1. Go to your Directus admin panel
2. Navigate to **Settings** → **Data Model**
3. Select your collection (e.g., "Articles")
4. Add a new field (e.g., "slug")
5. Set the interface to **"Slug Generator"**

### 2. Configure the Interface

```javascript
{
  "source_field": "title",           // Field to generate slug from
  "auto_update": true,               // Enable automatic updates
  "update_mode": "change",           // When to update: change, blur, focus, realtime
  "preserve_existing": false,        // Keep existing slugs when source changes
  "separator": "-",                  // Character to replace spaces/special chars
  "lowercase": true,                 // Convert to lowercase
  "update_delay": 100,               // Delay before update (ms)
  "validation": {
    "unique": true,                  // Ensure slug uniqueness
    "format": "url-friendly"         // URL format validation
  }
}
```

## ✨ Features

- **🔄 Automatic Slug Generation**: Generate slugs from any field in your collection
- **⚡ Auto-Update Functionality**: Automatically update URL values when source fields change
- **🎛️ Multiple Update Modes**: Choose when to trigger updates (on change, blur, focus, or real-time)
- **💾 Preserve Existing Values**: Option to keep existing URLs when source content changes
- **📅 Date Field Support**: Special handling for date fields with various formats
- **🌍 Multi-language Support**: Transliteration for special characters and accents
- **✅ Validation**: Built-in validation for URL format and uniqueness
- **⚙️ Customizable**: Configurable separators, case sensitivity, and error messages

## 📋 Usage Examples

### Basic Blog Post Setup

```javascript
// Collection: blog_posts
// Fields: title, slug, content, published_date

{
  "source_field": "title",
  "auto_update": true,
  "update_mode": "change",
  "separator": "-",
  "lowercase": true
}

// Input: "My Amazing Blog Post!"
// Output: "my-amazing-blog-post"
```

### Article with Date

```javascript
// Collection: articles
// Fields: title, slug, publish_date, author

{
  "source_field": "title",
  "auto_update": true,
  "update_mode": "blur",
  "separator": "-",
  "lowercase": true,
  "include_date": true,
  "date_format": "YYYY-MM-DD"
}

// Input: "Breaking News Story" + Date: 2024-01-15
// Output: "2024-01-15-breaking-news-story"
```

### Product Catalog

```javascript
// Collection: products
// Fields: name, slug, category, price

{
  "source_field": "name",
  "auto_update": true,
  "update_mode": "change",
  "separator": "-",
  "lowercase": true,
  "preserve_existing": true
}

// Input: "iPhone 15 Pro Max"
// Output: "iphone-15-pro-max"
```

## 🔄 Auto-Update Configuration

### Update Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `disabled` | No automatic updates | Manual slug entry only |
| `change` | Update when source field changes | Real-time updates |
| `blur` | Update when source field loses focus | Less aggressive updates |
| `focus` | Update when source field gains focus | On-demand updates |
| `realtime` | Update continuously as user types | Live preview |

### Configuration Options

```javascript
{
  "auto_update": true,               // Enable/disable auto-updates
  "update_mode": "change",           // When to trigger updates
  "preserve_existing": false,        // Keep existing slugs
  "update_delay": 100,               // Delay before update (ms)
  "validation": {
    "unique": true,                  // Ensure uniqueness
    "format": "url-friendly",        // URL format validation
    "min_length": 3,                 // Minimum slug length
    "max_length": 100                // Maximum slug length
  }
}
```

## 🌍 Internationalization

The extension supports transliteration for various languages:

### Supported Languages

- **English**: Standard ASCII characters
- **European**: é → e, ñ → ny, ä → ae, ö → oe, ß → ss
- **Cyrillic**: а → a, б → b, в → v, г → g
- **Greek**: α → a, β → b, γ → g, δ → d
- **Arabic**: ا → a, ب → b, ت → t, ث → th
- **Chinese**: Basic transliteration support
- **Japanese**: Hiragana/Katakana to Latin

### Custom Transliteration

```javascript
{
  "transliteration": {
    "custom_rules": {
      "&": "and",
      "©": "copyright",
      "®": "registered"
    }
  }
}
```

## ✅ Validation

### Built-in Validation

- **URL Format**: Ensures valid URL structure
- **Uniqueness**: Checks for duplicate slugs (configurable)
- **Length**: Configurable minimum and maximum lengths
- **Characters**: Validates allowed characters
- **Status-based**: Respects draft/published status

### Custom Validation

```javascript
{
  "validation": {
    "unique": true,
    "format": "url-friendly",
    "min_length": 3,
    "max_length": 100,
    "allowed_chars": "a-z0-9-",
    "custom_validator": "function(slug) { return slug.length > 0; }"
  }
}
```

## 🛠️ Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/markosiilak/directus-slug-generator.git
cd directus-slug-generator

# Install dependencies
npm install

# Build for development
npm run build

# Watch for changes
npm run dev

# Run tests
npm test
```

### Building for Production

```bash
# Build optimized version
npm run build

# Build with source maps
npm run build:dev
```

## 📚 API Reference

### Interface Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source_field` | string | - | Field to generate slug from |
| `auto_update` | boolean | true | Enable automatic updates |
| `update_mode` | string | 'change' | When to trigger updates |
| `preserve_existing` | boolean | false | Keep existing slugs |
| `separator` | string | '-' | Character to replace spaces |
| `lowercase` | boolean | true | Convert to lowercase |
| `update_delay` | number | 100 | Delay before update (ms) |

### Events

| Event | Description | Parameters |
|-------|-------------|------------|
| `slug:generated` | Slug was generated | `{ slug, source, field }` |
| `slug:updated` | Slug was updated | `{ oldSlug, newSlug, field }` |
| `slug:error` | Error occurred | `{ error, field }` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/markosiilak/directus-slug-generator/wiki)
- **Issues**: [GitHub Issues](https://github.com/markosiilak/directus-slug-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/markosiilak/directus-slug-generator/discussions)

## 🙏 Acknowledgments

- Built for [Directus](https://directus.io/)
- Inspired by modern URL practices
- Thanks to the Directus community for feedback and contributions

---

**Made with ❤️ by [Marko Siilak](https://github.com/markosiilak)**

