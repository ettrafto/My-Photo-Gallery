# Configuration Guide

**Last Updated**: 2025-01-XX  
**Source of Truth**: Code in `src/lib/siteConfig.js` and component implementations

> 📚 **See also**: [Development Guide](DEVELOPMENT.md) | [Architecture Guide](ARCHITECTURE.md) | [README](../README.md)

This guide documents all JSON-driven configuration options that are **actually implemented in the codebase**. Every field documented here is referenced in the code.

---

## Overview

Site-wide configuration is managed through JSON files in the `content/` directory. The primary configuration file is `content/site/site.json`, which controls:

- Site identity (title, owner name, tagline)
- Theme selection
- Navigation menu items
- Social links
- SEO defaults
- Hero section content and layout

---

## Site Configuration (`content/site/site.json`)

### Loading and Validation

The site configuration is loaded by `src/lib/siteConfig.js` via the `loadSiteConfig()` function:

- **Location**: `content/site/site.json`
- **Load method**: Fetched at runtime via `fetch()` (relative to `BASE_URL`)
- **Caching**: Configuration is cached after first load
- **Error handling**: If loading fails, a fallback configuration is returned to prevent crashes

### Complete Schema

```json
{
  "site": {
    "title": "PHOTO.LOG",
    "ownerName": "Evan Trafton",
    "tagline": "Photography / Trips / Experiments"
  },
  "theme": {
    "name": "paper"
  },
  "nav": {
    "items": [
      { "label": "home", "href": "/", "enabled": true },
      { "label": "albums", "href": "/albums", "enabled": true },
      { "label": "trips", "href": "/trips", "enabled": true },
      { "label": "map", "href": "/map", "enabled": true },
      { "label": "about", "href": "/about", "enabled": true }
    ]
  },
  "social": {
    "items": [
      { "label": "GitHub", "href": "https://github.com/USERNAME", "icon": "github", "enabled": false },
      { "label": "LinkedIn", "href": "https://www.linkedin.com/in/USERNAME", "icon": "linkedin", "enabled": false },
      { "label": "Resume", "href": "/resume.pdf", "icon": "file", "enabled": false }
    ]
  },
  "seo": {
    "defaultTitle": "PHOTO.LOG",
    "titleTemplate": "%s · PHOTO.LOG",
    "description": "A minimal photo archive of trips, places, and light.",
    "siteUrl": "https://photos.evantrafton.me",
    "ogImage": "/images/og-default.webp",
    "robots": "index,follow"
  },
  "hero": {
    "layout": "default",
    "headline": "Photography & Trips",
    "subheadline": "A minimal archive of places, light, and time.",
    "grid": {
      "enabled": false,
      "items": [
        {
          "src": "/hero/hero-1.JPG",
          "alt": "Feature image 1",
          "caption": "Costa Brava",
          "href": "/trips/costa-brava"
        }
      ]
    }
  }
}
```

---

## Field Reference

### `site` Object

#### `site.title` (REQUIRED)

- **Type**: `string`
- **Purpose**: Main site title displayed in navigation bar and as browser title fallback
- **Used in**: `NavBar.jsx` (header), `useSEO.js` (document title fallback)
- **Validation**: Must be a non-empty string, throws error if missing
- **Example**: `"PHOTO.LOG"`

#### `site.ownerName` (REQUIRED)

- **Type**: `string`
- **Purpose**: Owner name displayed in navigation bar subtitle and copyright notices
- **Used in**: `NavBar.jsx` (subtitle), `CopyrightNotice.jsx` (copyright text)
- **Validation**: Must be a non-empty string, throws error if missing
- **Example**: `"Evan Trafton"`

#### `site.tagline` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Site tagline/subtitle (stored but currently not displayed in UI)
- **Default**: `""` (empty string)
- **Used in**: Loaded by `siteConfig.js` but not currently consumed by components
- **Example**: `"Photography / Trips / Experiments"`

---

### `theme` Object

#### `theme.name` (OPTIONAL)

- **Type**: `string` (enum)
- **Purpose**: Theme identifier that applies CSS classes to the app root
- **Default**: `"mono"`
- **Valid Values**: `"mono"`, `"paper"` (whitelist in code)
- **Validation**: If invalid theme provided, logs warning and defaults to `"mono"`
- **Used in**: `App.jsx` (applies theme class), `getThemeName()` function
- **Code Reference**: `src/lib/siteConfig.js:64` - `VALID_THEMES` array

**How to change theme:**

1. Edit `content/site/site.json`
2. Set `theme.name` to `"mono"` or `"paper"`
3. Refresh the app

---

### `nav` Object

#### `nav.items` (OPTIONAL)

- **Type**: `array` of navigation item objects
- **Purpose**: Defines navigation menu items displayed in the header
- **Default**: `[]` (empty array, no nav items shown)
- **Used in**: `NavBar.jsx` via `getNavItems()` function
- **Filtering**: Only items with `enabled: true` are displayed

**Navigation Item Schema:**

Each item must have:

- `label` (required, string): Display text for the navigation link
- `href` (required, string): URL path (internal paths start with `/`, external with `http://` or `https://`)
- `enabled` (optional, boolean): If `false` or missing, item is filtered out

**Validation Behavior:**

- Items with `enabled: false` are skipped
- Items missing `label` or `href` are skipped (warning logged to console)
- Invalid items are silently filtered out

**Example:**

```json
{
  "nav": {
    "items": [
      { "label": "home", "href": "/", "enabled": true },
      { "label": "albums", "href": "/albums", "enabled": true },
      { "label": "external", "href": "https://example.com", "enabled": true }
    ]
  }
}
```

**Code Reference**: `src/lib/siteConfig.js:169-192` - `getNavItems()` function

---

### `social` Object

#### `social.items` (OPTIONAL)

- **Type**: `array` of social link objects
- **Purpose**: Defines social links displayed in the footer/social section
- **Default**: `[]` (empty array, no social links shown)
- **Used in**: `SocialLinks.jsx` via `getSocialItems()` function
- **Filtering**: Only items with `enabled: true` are displayed

**Social Item Schema:**

Each item must have:

- `label` (required, string): Display text for the link
- `href` (required, string): URL (internal paths start with `/`, external with protocol)
- `icon` (optional, string): Icon identifier (e.g., `"github"`, `"linkedin"`, `"file"`)
- `enabled` (optional, boolean): If `false` or missing, item is filtered out

**Icon Mapping:**

Icons are mapped via a simple iconMap in `SocialLinks.jsx`:

- `github` → 🔗
- `linkedin` → 🔗
- `instagram` → 📷
- `twitter` → 🐦
- `mail` → ✉️
- `file` → 📄
- `globe` → 🌐

Unknown icons fall back to label text only.

**Validation Behavior:**

- Items with `enabled: false` are skipped
- Items missing `label` or `href` are skipped (warning logged to console)
- External links (`href` doesn't start with `/`) open in new tab with `rel="noopener noreferrer"`

**Code Reference**: `src/lib/siteConfig.js:198-222` - `getSocialItems()` function

---

### `seo` Object

All SEO fields are optional. If missing, sensible defaults are used.

#### `seo.defaultTitle` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Default document title when no page-specific title is provided
- **Default**: Falls back to `site.title` if not provided
- **Used in**: `useSEO.js` hook (document title)
- **Example**: `"PHOTO.LOG"`

#### `seo.titleTemplate` (OPTIONAL)

- **Type**: `string` (supports `%s` placeholder)
- **Purpose**: Template for page-specific titles (e.g., "Album Name · PHOTO.LOG")
- **Default**: `"%s · {site.title}"` (where `{site.title}` is interpolated)
- **Used in**: `useSEO.js` hook - replaces `%s` with page title
- **Example**: `"%s · PHOTO.LOG"`

#### `seo.description` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Default meta description for all pages
- **Default**: `""` (empty string)
- **Used in**: `useSEO.js` hook (meta description, OG description, Twitter description)
- **Note**: Can be overridden per-page via `useSEO({ description: "..." })`

#### `seo.siteUrl` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Base URL for the site (used in OG tags and canonical URLs)
- **Default**: `""` (empty string)
- **Used in**: `useSEO.js` hook - constructs `og:url` as `siteUrl + pathname`
- **Example**: `"https://photos.evantrafton.me"`

#### `seo.ogImage` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Default Open Graph image path (relative or absolute URL)
- **Default**: `""` (empty string)
- **Used in**: `useSEO.js` hook (`og:image`, `twitter:image`)
- **Note**: Can be overridden per-page via `useSEO({ ogImage: "..." })`
- **Example**: `"/images/og-default.webp"`

#### `seo.twitterHandle` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Twitter/X handle (e.g., `"@username"`)
- **Default**: `""` (empty string)
- **Used in**: `useSEO.js` hook - sets `twitter:site` meta tag if provided
- **Example**: `"@evantrafton"`

#### `seo.robots` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Robots meta tag content
- **Default**: `"index,follow"`
- **Used in**: `useSEO.js` hook (robots meta tag)
- **Note**: Can be overridden per-page via `useSEO({ robots: "..." })`
- **Example**: `"index,follow"` or `"noindex,nofollow"`

**Code Reference**: `src/hooks/useSEO.js` - entire hook implementation

**Per-Page SEO Override:**

Components can override SEO defaults by passing options to `useSEO()`:

```jsx
useSEO({
  pageTitle: "Album Name",
  description: "Custom page description",
  ogImage: "/custom-og-image.jpg",
  robots: "noindex"
});
```

---

### `hero` Object

#### `hero.headline` (REQUIRED)

- **Type**: `string`
- **Purpose**: Main headline text displayed in hero section
- **Validation**: Must be a non-empty string, throws error if missing
- **Used in**: `Hero.jsx` component
- **Fallback**: Component has hardcoded fallback `"Welcome"` if config missing
- **Example**: `"Photography & Trips"`

#### `hero.subheadline` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Subheadline text displayed below headline in hero section
- **Default**: `""` (empty string)
- **Used in**: `Hero.jsx` component (only rendered if non-empty)
- **Example**: `"A minimal archive of places, light, and time."`

#### `hero.layout` (OPTIONAL)

- **Type**: `string`
- **Purpose**: Layout identifier for hero photo arrangement (CSS class applied)
- **Default**: `"default"`
- **Validation**: Must be a string (if not string, defaults to `"default"` with warning)
- **Used in**: `Hero.jsx` component - applies class `hero-layout-{layout}`
- **Note**: Currently only `"default"` layout is implemented
- **Code Reference**: `src/lib/siteConfig.js:94`, `src/components/Hero.jsx:90`

#### `hero.grid.enabled` (OPTIONAL)

- **Type**: `boolean`
- **Purpose**: Whether to use hero grid items instead of default image cluster
- **Default**: `false`
- **Used in**: `Hero.jsx` component - determines if grid items are rendered
- **Code Reference**: `src/lib/siteConfig.js:96`

#### `hero.grid.items` (OPTIONAL)

- **Type**: `array` of grid item objects
- **Purpose**: Array of hero grid images (max 3 displayed)
- **Default**: `[]` (empty array)
- **Used in**: `Hero.jsx` component via `getHeroGridItems()` function
- **Limit**: Maximum 3 items are displayed (`.slice(0, 3)`)

**Hero Grid Item Schema:**

Each item must have:

- `src` (required, string): Image path (relative to public root or absolute URL)
- `alt` (optional, string): Alt text for image (falls back to `caption` or `"Hero image"`)
- `caption` (optional, string): Caption text displayed with image
- `href` (optional, string): Link destination (if provided, image becomes clickable)

**Validation Behavior:**

- Items missing `src` are skipped (warning logged to console)
- Maximum 3 items are displayed (additional items are ignored)
- Items are only used if `hero.grid.enabled === true`

**Code Reference**: `src/lib/siteConfig.js:228-253` - `getHeroGridItems()` function

**Example:**

```json
{
  "hero": {
    "layout": "default",
    "headline": "Photography & Trips",
    "subheadline": "A minimal archive of places, light, and time.",
    "grid": {
      "enabled": true,
      "items": [
        {
          "src": "/hero/hero-1.JPG",
          "alt": "Feature image 1",
          "caption": "Costa Brava",
          "href": "/trips/costa-brava"
        },
        {
          "src": "/hero/hero-2.JPG",
          "alt": "Feature image 2",
          "caption": "Utah",
          "href": "/trips/utah"
        }
      ]
    }
  }
}
```

---

## Fallback Configuration

If `content/site/site.json` fails to load, the following fallback configuration is used (see `src/lib/siteConfig.js:120-152`):

```json
{
  "site": {
    "title": "PHOTO.LOG",
    "ownerName": "Evan Trafton"
  },
  "seo": {
    "defaultTitle": "PHOTO.LOG",
    "titleTemplate": "%s · PHOTO.LOG",
    "description": "",
    "siteUrl": "",
    "ogImage": "",
    "twitterHandle": "",
    "robots": "index,follow"
  },
  "nav": {
    "items": []
  },
  "social": {
    "items": []
  },
  "theme": {
    "name": "mono"
  },
  "hero": {
    "headline": "Welcome",
    "subheadline": "",
    "layout": "default",
    "grid": {
      "enabled": false,
      "items": []
    }
  }
}
```

This prevents the app from crashing if the config file is missing or invalid.

---

## Other JSON Configuration Files

### Albums System

**Files:**
- `content/albums.json` - Master index of all albums
- `content/albums/{slug}.json` - Individual album data (generated by scan script)

**Not documented here** - See `docs/DEVELOPMENT.md` for album creation workflow.

### Trips System

**Files:**
- `content/trips/{slug}.json` - Individual trip data files
- `src/data/trips.js` - Registry of trip slugs (must match JSON filenames)

**Not documented here** - See `docs/DEVELOPMENT.md` for trip creation workflow.

### Map System

**Files:**
- `content/map.json` - Photo location index (generated by scan script)
- `content/album-locations.json` - Manual album location fallbacks (optional)

**Not documented here** - See `docs/DEVELOPMENT.md` for map setup.

---

## Common Configuration Tasks

### Change Site Title

Edit `content/site/site.json`:

```json
{
  "site": {
    "title": "Your New Title"
  }
}
```

Refresh the app. No rebuild required.

### Add Navigation Item

Edit `content/site/site.json`:

```json
{
  "nav": {
    "items": [
      { "label": "home", "href": "/", "enabled": true },
      { "label": "new page", "href": "/new-page", "enabled": true }
    ]
  }
}
```

Refresh the app.

### Enable Social Links

Edit `content/site/site.json`:

```json
{
  "social": {
    "items": [
      { "label": "GitHub", "href": "https://github.com/yourusername", "icon": "github", "enabled": true },
      { "label": "Twitter", "href": "https://twitter.com/yourusername", "icon": "twitter", "enabled": true }
    ]
  }
}
```

Refresh the app.

### Change Theme

Edit `content/site/site.json`:

```json
{
  "theme": {
    "name": "paper"
  }
}
```

Refresh the app.

### Configure Hero Grid

Edit `content/site/site.json`:

```json
{
  "hero": {
    "grid": {
      "enabled": true,
      "items": [
        {
          "src": "/hero/image1.jpg",
          "alt": "Description",
          "caption": "Caption text",
          "href": "/albums/album-slug"
        }
      ]
    }
  }
}
```

Refresh the app.

---

## Validation Summary

| Field | Required | Default | Validation |
|-------|----------|---------|------------|
| `site.title` | ✅ Yes | - | Must be non-empty string |
| `site.ownerName` | ✅ Yes | - | Must be non-empty string |
| `site.tagline` | ❌ No | `""` | - |
| `theme.name` | ❌ No | `"mono"` | Must be `"mono"` or `"paper"` (warns if invalid) |
| `hero.headline` | ✅ Yes | - | Must be non-empty string |
| `hero.subheadline` | ❌ No | `""` | - |
| `hero.layout` | ❌ No | `"default"` | Must be string (warns if invalid) |
| `hero.grid.enabled` | ❌ No | `false` | - |
| `hero.grid.items` | ❌ No | `[]` | Max 3 items displayed |
| `nav.items` | ❌ No | `[]` | Items filtered by `enabled` and validated |
| `social.items` | ❌ No | `[]` | Items filtered by `enabled` and validated |
| `seo.*` | ❌ No | Various | See SEO section above |

---

## Code References

All configuration loading logic is in:
- `src/lib/siteConfig.js` - Configuration loader and getter functions

Components that consume configuration:
- `src/components/NavBar.jsx` - Uses `site.title`, `site.ownerName`, `nav.items`
- `src/components/Hero.jsx` - Uses `hero.*` fields
- `src/components/SocialLinks.jsx` - Uses `social.items`
- `src/components/CopyrightNotice.jsx` - Uses `site.ownerName`
- `src/hooks/useSEO.js` - Uses `seo.*` fields
- `src/App.jsx` - Uses `theme.name`

---

## Troubleshooting

### Configuration not loading?

- Check browser console for fetch errors
- Verify `content/site/site.json` exists in the build output
- Ensure JSON is valid (no trailing commas, proper quotes)

### Navigation items not showing?

- Ensure `enabled: true` is set on the item
- Check that `label` and `href` are valid strings
- Check browser console for validation warnings

### Theme not changing?

- Verify theme name is `"mono"` or `"paper"` (check console for warnings)
- Ensure CSS theme files exist for the selected theme

### Hero grid not displaying?

- Set `hero.grid.enabled: true`
- Ensure at least one item in `hero.grid.items` has a valid `src`
- Check browser console for validation warnings

---

**Note**: This documentation reflects the codebase as of the last update. For implementation details, always refer to `src/lib/siteConfig.js` and the consuming components.
