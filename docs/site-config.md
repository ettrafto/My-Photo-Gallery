# Site Configuration

**Date**: December 2025  
**Purpose**: Document the site-wide JSON configuration system for site content, navigation, social links, SEO, and hero section

---

## Overview

Site-wide content (site info, navigation, social links, SEO defaults, hero section) is managed through a single JSON configuration file. This allows easy updates without modifying component code.

---

## Configuration File

**Location**: `content/site/site.json`

### Schema

```json
{
  "site": {
    "title": "PHOTO.LOG",
    "ownerName": "Evan Trafton",
    "tagline": "Photography / Trips / Experiments"
  },
  "seo": {
    "defaultTitle": "PHOTO.LOG",
    "titleTemplate": "%s · PHOTO.LOG",
    "description": "A minimal photo archive of trips, places, and light.",
    "siteUrl": "https://evantrafton.com",
    "ogImage": "/images/og-default.webp",
    "twitterHandle": "@evantrafton",
    "robots": "index,follow"
  },
  "nav": {
    "items": [
      { "label": "home", "href": "/", "enabled": true },
      { "label": "trips", "href": "/trips", "enabled": true }
    ]
  },
  "social": {
    "items": [
      { "label": "GitHub", "href": "https://github.com/USERNAME", "icon": "github", "enabled": true }
    ]
  },
  "theme": {
    "name": "mono"
  },
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
        }
      ]
    }
  }
}
```

### Field Descriptions

#### `site.title` (required)
- **Type**: String
- **Purpose**: Main site title displayed in:
  - Navigation bar (header)
  - Browser document title
- **Example**: `"PHOTO.LOG"`

#### `site.ownerName` (required)
- **Type**: String
- **Purpose**: Owner name used in:
  - Navigation bar subtitle (`/ {ownerName}`)
  - Copyright notices (`© {year} {ownerName}`)
- **Example**: `"Evan Trafton"`

#### `site.tagline` (optional)
- **Type**: String
- **Purpose**: Site tagline/subtitle (currently stored but not displayed)
- **Fallback**: Empty string
- **Example**: `"Photography / Trips / Experiments"`

---

### Theme Section

#### `theme.name` (optional)
- **Type**: String (enum)
- **Purpose**: Theme identifier that applies a CSS class to the app root
- **Fallback**: `"mono"` (if missing or invalid)
- **Valid Values**: `"mono"`, `"paper"`
- **Example**: `"mono"` or `"paper"`
- **Important**: 
  - Theme classes (`theme-{name}`) are applied to the app root (`.app-shell`)
  - Each theme has CSS rules defined in `src/styles/themes.css`
  - This does not conflict with `hero.layout` - they are independent systems
  - **Current themes**:
    - `"mono"`: Dark theme (default) - black background, light text
    - `"paper"`: Light theme - cream/paper background, dark text

---

### SEO Section

#### `seo.defaultTitle` (optional)
- **Type**: String
- **Purpose**: Default document title when no page-specific title is provided
- **Fallback**: Uses `site.title` if missing
- **Example**: `"PHOTO.LOG"`

#### `seo.titleTemplate` (optional)
- **Type**: String
- **Purpose**: Template for page-specific titles. Use `%s` as placeholder for page title
- **Fallback**: `"%s · {site.title}"`
- **Example**: `"%s · PHOTO.LOG"` → "About · PHOTO.LOG"

#### `seo.description` (optional)
- **Type**: String
- **Purpose**: Default meta description for all pages
- **Fallback**: Empty string
- **Example**: `"A minimal photo archive of trips, places, and light."`

#### `seo.siteUrl` (optional)
- **Type**: String
- **Purpose**: Full site URL (used for OG tags)
- **Fallback**: Empty string
- **Example**: `"https://evantrafton.com"`

#### `seo.ogImage` (optional)
- **Type**: String
- **Purpose**: Default Open Graph image path
- **Fallback**: Empty string
- **Example**: `"/images/og-default.webp"`

#### `seo.twitterHandle` (optional)
- **Type**: String
- **Purpose**: Twitter/X handle for Twitter Card tags
- **Fallback**: Empty string
- **Example**: `"@evantrafton"`

#### `seo.robots` (optional)
- **Type**: String
- **Purpose**: Default robots meta tag value
- **Fallback**: `"index,follow"`
- **Example**: `"index,follow"` or `"noindex,nofollow"`

---

### Navigation Section

#### `nav.items` (optional)
- **Type**: Array of objects
- **Purpose**: Navigation menu items
- **Fallback**: Empty array (no nav items rendered)
- **Structure**:
  ```json
  {
    "label": "home",
    "href": "/",
    "enabled": true
  }
  ```
- **Fields**:
  - `label` (required): Display text for nav link
  - `href` (required): Link destination (internal `/path` or external `https://...`)
  - `enabled` (optional): Boolean, defaults to `true`. Set to `false` to hide item
- **Behavior**:
  - Only enabled items with valid `label` and `href` are rendered
  - Array order controls display order
  - Invalid items are skipped with console warning (app doesn't crash)
  - Internal links (`/path`) use React Router NavLink
  - External links open in new tab with `noopener noreferrer`

---

### Social Links Section

#### `social.items` (optional)
- **Type**: Array of objects
- **Purpose**: Social media and external links
- **Fallback**: Empty array (no social links rendered)
- **Structure**:
  ```json
  {
    "label": "GitHub",
    "href": "https://github.com/USERNAME",
    "icon": "github",
    "enabled": true
  }
  ```
- **Fields**:
  - `label` (required): Display text
  - `href` (required): Link URL
  - `icon` (optional): Icon identifier (see supported icons below)
  - `enabled` (optional): Boolean, defaults to `true`
- **Supported Icons**: `github`, `linkedin`, `instagram`, `twitter`, `mail`, `file`, `globe`
- **Behavior**:
  - Unknown icon keys fall back to label text only (no crash)
  - External links open in new tab with security attributes
  - Internal links (`/resume.pdf`) use same-tab navigation
  - Invalid items are skipped with console warning

---

### Hero Section

#### `hero.headline` (required)
- **Type**: String
- **Purpose**: Main hero headline text
- **Fallback**: `"Welcome"` (if missing)
- **Example**: `"Photography & Trips"`

#### `hero.subheadline` (optional)
- **Type**: String
- **Purpose**: Hero subheadline text below headline
- **Fallback**: Empty string (if missing, subheadline is hidden)
- **Example**: `"A minimal archive of places, light, and time."`

#### `hero.layout` (optional)
- **Type**: String
- **Purpose**: Hero photo layout identifier - determines which photo arrangement to use
- **Fallback**: `"default"` (if missing)
- **Example**: `"default"`
- **Note**: Currently only "default" layout is implemented. Additional layouts can be added by creating CSS classes (`hero-layout-{name}`) and layout logic in the Hero component.

#### `hero.grid` (optional)
- **Type**: Object
- **Purpose**: Hero grid images configuration (alternative to default images)
- **Structure**:
  ```json
  {
    "enabled": true,
    "items": [
      {
        "src": "/hero/hero-1.JPG",
        "alt": "Feature image 1",
        "caption": "Costa Brava",
        "href": "/trips/costa-brava"
      }
    ]
  }
  ```
- **Fields**:
  - `enabled` (optional): Boolean, defaults to `false`. Set to `true` to use grid items instead of default images
  - `items` (optional): Array of grid image objects
- **Grid Item Fields**:
  - `src` (required): Image path relative to public directory
  - `alt` (optional): Alt text, falls back to `caption` or "Hero image"
  - `caption` (optional): Caption text displayed on hover (if UI supports it)
  - `href` (optional): Link destination. If provided, image wraps in link (internal or external)
- **Behavior**:
  - Only renders if `enabled === true` AND at least 1 valid item exists
  - Maximum 3 items rendered (first 3 enabled/valid items)
  - Works with `hero.layout` system - grid items render within layout container
  - Missing `src` → item skipped
  - Uses `Photo` component for optimized loading
  - Falls back to default images if grid disabled or empty

---

## Usage Examples

### Updating Hero Content

To change the hero headline and subheadline:

```json
{
  "hero": {
    "headline": "My New Headline",
    "subheadline": "My new subheadline text"
  }
}
```

### Changing Hero Layout

To switch between different hero photo layouts (when additional layouts are implemented):

```json
{
  "hero": {
    "headline": "Photography & Trips",
    "subheadline": "A minimal archive of places, light, and time.",
    "layout": "default"
  }
}
```

**Note**: Currently only the "default" layout is available. Additional layouts can be added by:
1. Creating new CSS classes (e.g., `.hero-layout-grid`, `.hero-layout-masonry`)
2. Adding layout-specific logic in the Hero component
3. Setting `hero.layout` to the new layout name

### Changing Site Title

To update the site title in header and browser tab:

```json
{
  "site": {
    "title": "My Photo Portfolio"
  }
}
```

### Changing Owner Name

To update the owner name in copyright and nav:

```json
{
  "site": {
    "ownerName": "John Doe"
  }
}
```

---

## Technical Implementation

### Loader Utility

**Location**: `src/lib/siteConfig.js`

**Functions**:
- `loadSiteConfig()` - Async function that loads and validates config
- `getSiteConfig()` - Synchronous getter for cached config
- `useSiteConfig()` - Hook-like function for React components
- `getNavItems()` - Returns enabled nav items only (filters invalid items)
- `getSocialItems()` - Returns enabled social items only (filters invalid items)
- `getHeroGridItems()` - Returns enabled hero grid items only (max 3, filters invalid items)
- `getThemeName()` - Returns theme name from config (defaults to "mono")

### Validation

The loader performs basic runtime validation:
- Checks for required fields (`site.title`, `site.ownerName`, `hero.headline`)
- Validates field types (must be strings)
- Provides clear error messages if validation fails
- Falls back to default values to prevent crashes

### Caching

Config is cached after first load to avoid repeated fetches. The cache is stored in memory and persists for the session.

### Error Handling

If the config file is missing or invalid:
- Console error is logged
- Fallback values are used:
  - `site.title`: `"PHOTO.LOG"`
  - `site.ownerName`: `"Evan Trafton"`
  - `hero.headline`: `"Welcome"`
  - `hero.subheadline`: `""`
  - `hero.cta`: `null`

---

## Components Using Site Config

### Hero Component
- **File**: `src/components/Hero.jsx`
- **Uses**: `hero.headline`, `hero.subheadline`, `hero.layout`, `hero.grid`
- **Fallbacks**: Headline defaults to "Welcome", subheadline hidden if empty, layout defaults to "default"
- **Layout System**: Applies CSS class `hero-layout-{layout}` to the hero images container, allowing different photo arrangements via CSS
- **Grid System**: If `hero.grid.enabled === true`, renders grid items from JSON instead of default images. Grid items work within the layout system.

### NavBar Component
- **File**: `src/components/NavBar.jsx`
- **Uses**: `site.title`, `site.ownerName`, `nav.items` (via `getNavItems()`)
- **Behavior**: Renders nav links from JSON. Internal links use React Router, external links open in new tab.

### SocialLinks Component
- **File**: `src/components/SocialLinks.jsx`
- **Uses**: `social.items` (via `getSocialItems()`)
- **Behavior**: Renders social links with icon mapping. Unknown icons degrade gracefully to label text.

### SEO Hook
- **File**: `src/hooks/useSEO.js`
- **Uses**: `seo.*` fields
- **Behavior**: Sets document title and meta tags via direct DOM manipulation. Supports per-page overrides.

### NavBar Component
- **File**: `src/components/NavBar.jsx`
- **Uses**: `site.title`, `site.ownerName`
- **Display**: `{site.title}` and `/ {site.ownerName}`

### CopyrightNotice Component
- **File**: `src/components/CopyrightNotice.jsx`
- **Uses**: `site.ownerName`
- **Display**: `© {year} {ownerName}. Images may not be used or reproduced without permission.`

### App Component
- **File**: `src/App.jsx`
- **Uses**: `site.title`, `theme.name`
- **Display**: 
  - Sets `document.title` to `site.title` (via SEO hook)
  - Applies `theme-{name}` class to app root (`.app-shell`)
  - Theme class is currently a no-op (no visual changes)

---

## Development Workflow

### Making Changes

1. Edit `content/site/site.json`
2. Save the file
3. Refresh the browser (config is loaded on component mount)
4. Changes should appear immediately

### Testing

After making changes, verify:
- ✅ Header title updates
- ✅ Hero headline updates
- ✅ Hero subheadline updates (or hides if removed)
- ✅ Hero layout class is applied correctly
- ✅ Copyright notice shows correct owner name
- ✅ Browser tab title updates

### Common Mistakes

#### Invalid Nav Items
- Missing `label` or `href` → Item skipped with console warning
- Invalid `href` format → Still renders but may not work correctly
- **Fix**: Ensure all nav items have valid `label` (string) and `href` (string)

#### Unknown Social Icons
- Icon key not in supported list → Falls back to label text only
- **Fix**: Use supported icons (`github`, `linkedin`, `instagram`, `twitter`, `mail`, `file`, `globe`) or accept text-only display

#### Hero Grid Issues
- `enabled: true` but no valid items → Grid hidden, falls back to default images
- Missing `src` → Item skipped
- More than 3 items → Only first 3 rendered
- **Fix**: Ensure at least 1 item has valid `src`, keep items array to 3 or fewer

#### SEO Meta Tags
- Missing `siteUrl` → OG tags may have incomplete URLs
- Missing `ogImage` → No OG image set
- **Fix**: Provide full URLs and image paths for proper social sharing

### Theme Configuration

The theme class (`theme-{name}`) is applied to the app root (`.app-shell`). Each theme has CSS rules defined in `src/styles/themes.css`.

**Available Themes**:
- `"mono"`: Dark theme (default) - black background (`#000000`), light text
- `"paper"`: Light theme - cream/paper background (`#f6f1e6`), dark text (`#1a1a1a`)

To change theme:
```json
{
  "theme": {
    "name": "paper"
  }
}
```

**Note**: Invalid theme values will log a warning and default to `"mono"`.

#### Testing Theme Switching

**Manual Test Checklist**:

1. **Set theme to "mono"**:
   ```json
   { "theme": { "name": "mono" } }
   ```
   - Expected: Dark background, light text (current default look)
   - Verify: Root element has class `theme-mono`

2. **Set theme to "paper"**:
   ```json
   { "theme": { "name": "paper" } }
   ```
   - Expected: Light cream background (`#f6f1e6`), dark text (`#1a1a1a`), dark blue links (`#0b3d91`)
   - Verify: Root element has class `theme-paper`
   - Verify: Page blocks have light backgrounds and dark borders
   - Verify: Copyright notice has dark text

3. **Set theme to invalid value**:
   ```json
   { "theme": { "name": "badvalue" } }
   ```
   - Expected: Console warning logged, theme falls back to "mono"
   - Verify: Root element has class `theme-mono` (not `theme-badvalue`)

4. **Verify hero.layout still works with paper theme**:
   - Set `hero.layout` to different values while `theme.name` is "paper"
   - Expected: Hero layout changes (if other layouts exist), but theme remains "paper"
   - Verify: Both classes present: `theme-paper` and `hero-layout-{layout}`

### Removing Optional Fields

To test fallback behavior:
- Remove `hero.subheadline` → Subheadline should be hidden
- Remove `hero.layout` → Layout should default to "default"
- Remove `hero.grid` → Falls back to default images
- Set `nav.items[].enabled: false` → Item hidden from nav
- Set `social.items[].enabled: false` → Item hidden from social links
- Set `theme.name` to invalid value → Logs warning and defaults to "mono"
- Remove `site.title` → Should see console error and fallback to "PHOTO.LOG"

---

## Future Extensibility

The site config system is designed to be easily extended. To add new fields:

1. Add field to `content/site/site.json`
2. Update validation in `src/lib/siteConfig.js` (if required)
3. Use the field in your component:
   ```jsx
   const config = await loadSiteConfig();
   const myNewField = config.mySection.myNewField || 'fallback';
   ```

---

## Notes

- Config is loaded asynchronously, so components show fallback values briefly during initial load
- Config is cached after first load for performance
- All string fields are validated to ensure they're not empty
- Optional fields gracefully degrade (hidden/not rendered) rather than causing errors

