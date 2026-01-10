# Configuration Guide

**Last Updated**: 2025-01-27  
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

Additional configuration files:
- `content/site/showcase.json` - Showcase images (auto-generated)
- `content/site/about.json` - About page images (auto-generated)

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
    "images": [
      {
        "src": "/hero/hero-1.JPG",
        "alt": "Feature image 1",
        "caption": "Costa Brava",
        "href": "/trips/costa-brava"
      }
    ]
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

#### `hero.images` (OPTIONAL)

- **Type**: `array` of hero image objects
- **Purpose**: Hero images rendered in the home hero cluster
- **Default**: `[]` (empty array)
- **Used in**: `Hero.jsx` component via `getHeroImages()` function
- **Note**: The CSS layout is positioned for 1–5 images (`.hero-image-1` through `.hero-image-5`). More than 5 will render, but won’t have custom positioning.

**Hero Image Schema (minimal):**

Each item must have:

- `src` (required, string): Image path (relative to public root or absolute URL)
- `alt` (optional, string): Alt text for image (falls back to `caption` or `"Hero image"`)
- `caption` (optional, string): Caption text displayed with image

**Image processing workflow:**

1. **Place original images** in `photo-source/originals/config/hero/`:
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`
   - Images can be named anything (e.g., `IMG_9416.JPG`, `hero-main.jpg`)

2. **Run the processing script:**
   ```bash
   npm run process:hero
   ```
   This script will:
   - Process all images from `photo-source/originals/config/hero/`
   - Generate optimized WebP variants in `public/hero/`:
     - `{filename}-large.webp` (1800px longest side, quality 80)
     - `{filename}-small.webp` (800px longest side, quality 80)
     - `{filename}-blur.webp` (40px longest side, quality 40 - for blur placeholders)
   - Automatically update `content/site/site.json` with processed image paths
   - Extract EXIF metadata (alt text, captions, etc.)

3. **The app automatically uses WebP variants:**
   - Hero component prefers WebP variants for performance
   - Falls back to original format if WebP variants are missing
   - Responsive images are served automatically (`srcSmall` for mobile, `srcLarge` for desktop)

**Optional: Metadata configuration**

You can create `photo-source/originals/config/hero/_hero.json` to specify custom metadata:

```json
{
  "images": [
    {
      "filename": "IMG_9416.JPG",
      "alt": "Custom alt text",
      "caption": "Custom caption",
      "href": "/trips/costa-brava"
    }
  ]
}
```

**Validation Behavior:**

- Items missing `src` are skipped (warning logged to console)
- If `hero.images` is missing/empty, the component falls back to its built-in defaults

**Code Reference**: `src/lib/siteConfig.js` - `getHeroImages()` function

**Example:**

```json
{
  "hero": {
    "layout": "default",
    "headline": "Photography & Trips",
    "subheadline": "A minimal archive of places, light, and time.",
    "images": [
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
    "images": []
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
- `content/map.json` - Photo location index (generated by import script)
- `content/album-locations.json` - Manual album location fallbacks (optional)

**Not documented here** - See `docs/DEVELOPMENT.md` for map setup.

### Showcase System

**Files:**
- `content/site/showcase.json` - Showcase images configuration (generated by processing script)

**Configuration:**

The showcase component displays a vertical layout of images with alternating left/right entry animations. Images are processed from a dedicated source directory.

**Image processing workflow:**

1. **Place original images** in `photo-source/originals/config/showcase/`:
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`
   - Unlimited number of images

2. **Run the processing script:**
   ```bash
   npm run process:showcase
   ```
   This script will:
   - Process all images from `photo-source/originals/config/showcase/`
   - Generate optimized WebP variants in `public/photos/showcase/`:
     - `{filename}-large.webp` (1800px longest side, quality 80)
     - `{filename}-small.webp` (800px longest side, quality 80)
     - `{filename}-blur.webp` (40px longest side, quality 40)
   - Extract EXIF data (camera, lens, settings, date)
   - Determine image type from aspect ratio (portrait/landscape/square)
   - Automatically alternate left/right side for entry animations
   - Generate `content/site/showcase.json` with all image data

3. **Optional: Location metadata**

Create `photo-source/originals/config/showcase/_showcase.json` to specify locations:

```json
{
  "locations": {
    "IMG_9041.JPG": "Zion National Park",
    "1": "Bryce Canyon",
    "2": "Arches National Park"
  }
}
```

Locations can be specified by filename or by index (1-based).

**Showcase JSON Schema** (auto-generated):

```json
{
  "images": [
    {
      "type": "portrait",
      "side": "left",
      "src": "/photos/showcase/IMG_9041-large.webp",
      "srcSmall": "/photos/showcase/IMG_9041-small.webp",
      "srcBlur": "/photos/showcase/IMG_9041-blur.webp",
      "alt": "Zion National Park",
      "location": "Zion National Park",
      "width": 3024,
      "height": 4032,
      "aspectRatio": 0.75,
      "exif": {
        "camera": "Canon EOS R5",
        "lens": "RF 24-70mm F2.8 L IS USM",
        "aperture": "f/8",
        "shutterSpeed": "1/250",
        "iso": 400,
        "focalLength": "35mm",
        "dateTaken": "2024-06-15T10:30:00Z"
      }
    }
  ]
}
```

**Code Reference**: `src/components/Showcase.jsx` - Loads from `content/site/showcase.json`

### About System

**Files:**
- `content/site/about.json` - About page images configuration (generated by processing script)

**Configuration:**

The about page can display images (currently the About page component is hardcoded, but the infrastructure exists for future image support).

**Image processing workflow:**

1. **Place original images** in `photo-source/originals/config/about/`:
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`

2. **Run the processing script:**
   ```bash
   npm run process:about
   ```
   This script will:
   - Process all images from `photo-source/originals/config/about/`
   - Generate optimized WebP variants in `public/about/`:
     - `{filename}-large.webp` (1800px longest side, quality 80)
     - `{filename}-small.webp` (800px longest side, quality 80)
     - `{filename}-blur.webp` (40px longest side, quality 40)
   - Extract EXIF metadata
   - Generate `content/site/about.json` with processed image paths

3. **Optional: Metadata configuration**

Create `photo-source/originals/config/about/_about.json` to specify custom metadata:

```json
{
  "images": [
    {
      "filename": "about-photo.jpg",
      "alt": "Custom alt text",
      "caption": "Custom caption"
    }
  ]
}
```

**About JSON Schema** (auto-generated):

```json
{
  "images": [
    {
      "src": "/about/about-photo-large.webp",
      "srcSmall": "/about/about-photo-small.webp",
      "srcBlur": "/about/about-photo-blur.webp",
      "alt": "Description",
      "caption": "Caption text",
      "width": 4000,
      "height": 3000,
      "aspectRatio": 1.33
    }
  ]
}
```

**Note**: The About page component (`src/pages/About.jsx`) currently displays hardcoded content. The JSON configuration is generated for future use.

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

### Configure Hero Images

1. **Place images** in `photo-source/originals/config/hero/`
2. **Run processing:**
   ```bash
   npm run process:hero
   ```
   This automatically updates `content/site/site.json` with the processed images.

3. **Manually edit** `content/site/site.json` if you need to customize:

```json
{
  "hero": {
    "images": [
      {
        "src": "/hero/image1-large.webp",
        "alt": "Description",
        "caption": "Caption text",
        "href": "/trips/costa-brava"
      }
    ]
  }
}
```

4. **Refresh the app** (no rebuild needed in dev mode)

**Note**: The `process:hero` script automatically populates `hero.images` with processed paths. Manual editing is only needed for customization.

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
| `hero.images` | ❌ No | `[]` | If empty, Hero falls back to defaults |
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
- `src/components/Showcase.jsx` - Uses `content/site/showcase.json`
- `src/components/SocialLinks.jsx` - Uses `social.items`
- `src/components/CopyrightNotice.jsx` - Uses `site.ownerName`
- `src/hooks/useSEO.js` - Uses `seo.*` fields
- `src/App.jsx` - Uses `theme.name`

Processing scripts:
- `scripts/processHero.mjs` - Processes hero images from `photo-source/originals/config/hero/`
- `scripts/processShowcase.mjs` - Processes showcase images from `photo-source/originals/config/showcase/`
- `scripts/processAbout.mjs` - Processes about images from `photo-source/originals/config/about/`

---

## Directory Structure for Config Images

All configuration-related images (hero, showcase, about) are now organized under `photo-source/originals/config/`:

```
photo-source/
  └── originals/
      ├── {album-name}/          # Regular album photos
      └── config/                # Configuration images
          ├── hero/              # Hero section images
          │   └── _hero.json     # Optional metadata file
          ├── showcase/          # Showcase images
          │   └── _showcase.json # Optional metadata file
          └── about/             # About page images
              └── _about.json    # Optional metadata file
```

**Important**: Images must be placed in these directories **before** running the processing scripts. The scripts read from these locations and generate optimized outputs in the `public/` directory.

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

### Hero images not displaying?

- Ensure images are placed in `photo-source/originals/config/hero/`
- Run `npm run process:hero` to generate WebP variants
- Verify `hero.images` exists in `content/site/site.json` with valid `src` paths
- Check browser console for validation warnings or 404 errors

### Showcase images not displaying?

- Ensure images are placed in `photo-source/originals/config/showcase/`
- Run `npm run process:showcase` to generate `content/site/showcase.json`
- Check browser console for fetch errors
- Verify `content/site/showcase.json` exists and contains valid image data

### Processing scripts failing?

- Verify source directories exist: `photo-source/originals/config/{hero|showcase|about}/`
- Check that images are in supported formats: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`
- Ensure you have write permissions for `public/` and `content/site/` directories
- Check console output for specific error messages

---

**Note**: This documentation reflects the codebase as of the last update. For implementation details, always refer to `src/lib/siteConfig.js` and the consuming components.
