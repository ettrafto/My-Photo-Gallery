# Theme System Documentation

## Overview

The theme system allows you to change the visual appearance of the site by switching themes via JSON configuration. Themes are applied as CSS classes to the app root element and override default styles.

### How It Works

1. **Configuration**: Theme name is set in `content/site/site.json` under `theme.name`
2. **Validation**: Theme names are validated against a whitelist in `src/lib/siteConfig.js`
3. **Application**: The theme class (`theme-{name}`) is applied to `.app-shell` in `src/App.jsx`
4. **Styling**: Theme-specific CSS rules are defined in `src/styles/themes.css` under `.theme-{name}` selectors
5. **Independence**: Themes are independent of `hero.layout` - both systems work together without conflict

### Current Themes

- **`mono`**: Default dark theme (black background, light text, monospace fonts)
- **`paper`**: Light theme (cream background, dark text, serif fonts - Crimson Pro & Playfair Display)

---

## How to Add a New Theme

### Step 1: Add Theme Name to Whitelist

Edit `src/lib/siteConfig.js` and add your theme name to the `VALID_THEMES` array:

```javascript
// Theme whitelist
const VALID_THEMES = ['mono', 'paper', 'your-theme-name'];
```

**Location**: Line 64 in `src/lib/siteConfig.js`

### Step 2: Set Theme in Configuration

Edit `content/site/site.json` and set the theme name:

```json
{
  "theme": {
    "name": "your-theme-name"
  }
}
```

**Location**: `content/site/site.json`

### Step 3: Add Font Import (Optional)

If your theme uses custom fonts, add the Google Fonts import to `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Your+Font:wght@400;600&display=swap');
```

**Location**: `src/index.css` (add before the themes.css import)

### Step 4: Add CSS Rules

Add your theme CSS block to `src/styles/themes.css`. See the "Theme CSS Template" section below for a complete template.

**Location**: `src/styles/themes.css`

**Note**: If changing fonts, override the CSS variables `--mono-ui` and `--mono-display` in your theme block.

### Step 5: Test

1. Set `theme.name` to your new theme in `site.json`
2. Refresh the browser
3. Verify the theme class is applied: inspect `.app-shell` element - it should have class `theme-{name}`
4. Check that all components are styled correctly (use the checklist below)
5. Verify `hero.layout` still works independently
6. Test invalid theme name fallback: set `theme.name` to an invalid value - should log warning and default to `"mono"`

---

## Required CSS Coverage Checklist

This checklist is based on the actual selectors used in the codebase. Each theme must provide overrides for these selectors to ensure complete visual coverage.

### Global Surface

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.theme-{name}` | Root theme container | `background-color`, `color` | Applied to `.app-shell` |
| `body:has(.theme-{name})` | Body background override | `background-color` | For areas outside app-shell |
| `a` | Global link color | `color` | Base link color |
| `a:hover` | Link hover state | `color` | Hover link color |

### Navigation

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.nav-shell` | Navigation container | `background`, `border-bottom-color` | Top nav bar |
| `.nav-brand-main` | Site title | `color` | Main brand text |
| `.nav-brand-sub` | Owner name | `color` | Subtitle text |
| `.nav-link` | Nav link button | `color`, `background`, `border-color` | Default state |
| `.nav-link:hover` | Nav link hover | `color`, `background` | Hover state |
| `.nav-link-active` | Active nav link | `color`, `background`, `border-color` | Current page indicator |

### Hero Section

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.hero` | Hero container | `background-color` | Full viewport hero section |
| `.hero-headline` | Main headline | `color` | Large hero title |
| `.hero-subheadline` | Subheadline | `color` | Hero subtitle |
| `.hero-grid-background` | Animated grid pattern | `background-image` | Subtle grid overlay |
| `.hero-exif-overlay` | EXIF info overlay | `background`, `color`, `background-image` | Image metadata display |

### Page Content

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.page-block` | Content panel | `background`, `border-color` | Card/panel containers |
| `.page-label` | Section label | `color` | Optional - inherits from global |
| `.page-title` | Page title | `color` | Optional - inherits from global |
| `.page-subtitle` | Page subtitle | `color` | Optional - inherits from global |
| `.page-body` | Body text | `color` | Optional - inherits from global |

### Footer / Copyright

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.copyright-notice` | Copyright container | `border-top-color`, `color` | Footer section |
| `.copyright-link` | Copyright link | `color` | Link in copyright |
| `.copyright-link:hover` | Copyright link hover | `color` | Hover state |

### Layout Controls

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.layout-controls` | Control bar container | `border-bottom-color` | Layout switcher container |
| `.control-label` | Control label text | `color` | "Images Across:", "Layout:" labels |
| `.segmented-control` | Button group container | `background`, `border-color` | Segmented control wrapper |
| `.segment-btn` | Individual button | `color`, `border-right-color` | Default state |
| `.segment-btn:hover` | Button hover | `color`, `background` | Hover state |
| `.segment-btn.active` | Active button | `color`, `background` | Selected state |

### EXIF Overlay (Image Hover)

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.exif-overlay` | EXIF container | `background`, `color` | Hover overlay on images |
| `.exif-header` | EXIF header section | `border-bottom-color` | Filename/position divider |
| `.exif-filename` | Filename text | `color` | Image filename |
| `.exif-position` | Position text | `color` | "1 / 10" position indicator |
| `.exif-line` | EXIF data line | `color` | General EXIF text |
| `.exif-camera` | Camera info | `color` | Camera/lens info |
| `.exif-date` | Date info | `color` | Date taken |
| `.exif-settings` | Camera settings | `color` | Aperture/shutter/ISO |
| `.exif-fallback` | Fallback message | `color` | "No EXIF data" message |

### Album Card

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.album-cover` | Album cover image container | `border-radius`, `overflow` | All corners should match card border-radius (typically `8px`). Use `overflow: hidden` to ensure child elements respect border-radius |
| `.album-cover .lazy-image-wrapper` | Image wrapper inside cover | `border-radius` | Should match cover border-radius on all corners (typically `8px`) |
| `.album-cover .lazy-image-photo` | Actual image element | `border-radius` | Should match cover border-radius on all corners (typically `8px`) to ensure the image itself has rounded corners |
| `.album-info` | Album info section | `border-radius` | Bottom corners should match card border-radius (typically `0 0 8px 8px`) |

### Album Card Hover Collage

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.hover-collage` | Album hover collage container | `background`, `border-radius` | Background behind 3-photo grid on hover, should match cover border-radius |
| `.collage-image` | Individual collage image cell | `background` | Background for each photo cell in the grid |

### Album Page Photo Items

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.photo-item` | Individual photo container | `background` | Should match theme background (typically same as theme background color) to prevent black corners |
| `.photo-item .lazy-image-wrapper` | Image wrapper inside photo item | `border-radius`, `overflow` | Should match photo-item border-radius (typically `4px`). Use `overflow: hidden` to ensure child elements respect border-radius |
| `.photo-item .lazy-image-photo` | Actual image element | `border-radius` | Should match photo-item border-radius (typically `4px`) to prevent black corners from showing |

### Filter Bar Components

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.filter-separator` | Visual separator | `background` | Divider line between filter groups |
| `.filter-btn` | Filter button | `background`, `border-color`, `color` | Default state |
| `.filter-btn:hover` | Button hover | `background`, `border-color` | Hover state |
| `.filter-btn.active` | Active filter | `background`, `color`, `border-color` | Active/inverted state |
| `.filter-dropdown` | Dropdown trigger | `background`, `border-color`, `color` | Select/dropdown button |
| `.filter-dropdown:hover` | Dropdown hover | `background`, `border-color` | Hover state |
| `.filter-dropdown option` | Dropdown options | `background`, `color` | Native select options |
| `.dropdown-menu` | Custom dropdown | `background`, `border-color`, `box-shadow` | Popup menu container |
| `.dropdown-search` | Search input | `background`, `border-bottom-color`, `color` | Filter search field |
| `.dropdown-search::placeholder` | Placeholder text | `color` | Search placeholder |
| `.dropdown-search:focus` | Focused search | `background` | Focus state |
| `.dropdown-option` | Dropdown item | `color` | Menu item text |
| `.dropdown-option:hover` | Item hover | `background` | Hover state |
| `.dropdown-option.active` | Active item | `background` | Selected item |
| `.dropdown-checkbox` | Checkbox item | `color` | Checkbox label |
| `.dropdown-checkbox:hover` | Checkbox hover | `background` | Hover state |
| `.filter-chip` | Active filter chip | `background`, `color` | Removable filter tag |
| `.filter-chip:hover` | Chip hover | `background` | Hover state |
| `.clear-all-btn` | Clear all button | `color` | Clear filters link |
| `.clear-all-btn:hover` | Clear hover | `color` | Hover state |

### Date Filter Presets

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.preset-chip` | Date preset button | `background`, `border-color`, `color` | "All time", "Last 12 months", etc. |
| `.preset-chip:hover` | Preset hover | `background`, `border-color`, `color` | Hover state |
| `.preset-chip.active` | Active preset | `background`, `border-color`, `color` | Selected preset |

### Year Dropdown

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.year-dropdown-trigger` | Dropdown button | `background`, `border-color`, `color` | Year selector button |
| `.year-dropdown-trigger:hover` | Button hover | `background`, `border-color`, `color` | Hover state |
| `.year-dropdown-trigger.active` | Active button | `background`, `border-color`, `color` | When dropdown open |
| `.year-dropdown-menu` | Dropdown menu | `background`, `border-color`, `box-shadow` | Popup menu |
| `.year-option` | Year option | `color` | Menu item text |
| `.year-option:hover` | Option hover | `background`, `color` | Hover state |
| `.year-option.selected` | Selected year | `background`, `color` | Active year |
| `.year-divider` | Menu divider | `background` | Separator line |
| `.check-mark` | Checkmark icon | `color` | Selected indicator |

### Year Timeline

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.all-tick` | "All" button | `background`, `border-color`, `color` | Timeline reset button |
| `.all-tick:hover` | Button hover | `background`, `border-color`, `color` | Hover state |
| `.all-tick.active` | Active button | `background`, `border-color`, `color` | When "All" selected |
| `.timeline-line::before` | Timeline line | `background` | Horizontal timeline line |
| `.tick-mark` | Year tick mark | `background`, `border-color` | Year indicator dot |
| `.timeline-tick:hover .tick-mark` | Tick hover | `background`, `border-color` | Hover state |
| `.timeline-tick.active .tick-mark` | Active tick | `background`, `border-color`, `box-shadow` | Selected year |
| `.tick-label` | Year label | `color` | Year text (hidden by default) |
| `.timeline-tick:hover .tick-label` | Label on hover | `color` | Visible on hover |
| `.timeline-tick.active .tick-label` | Active label | `color` | Visible when active |

### Search Bar (if used)

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.search-input` | Search input field | `background`, `border-color`, `color` | Text input |
| `.search-input::placeholder` | Placeholder | `color` | Placeholder text |
| `.search-input:focus` | Focused input | `background`, `border-color` | Focus state |
| `.search-button` | Search button | `background`, `border-color`, `color` | Submit button |
| `.search-button:hover` | Button hover | `background`, `border-color` | Hover state |

### Social Links (if used)

| Selector | Purpose | Required Properties | Notes |
|----------|---------|-------------------|-------|
| `.social-link` | Social link | `color` | Link text/icon |
| `.social-link:hover` | Link hover | `color` | Hover state |

---

## Theme CSS Template

Copy this template and replace `{name}` with your theme name:

```css
/* ===== Theme: {name} =====
 * Description: Brief description of the theme's visual style
 * Goal: What should change visually (e.g., "Dark theme with neon accents")
 * 
 * Typography: If changing fonts, override CSS variables:
 *   --mono-ui: 'Your Font', fallback, serif/sans-serif;
 *   --mono-display: 'Your Display Font', fallback, serif/sans-serif;
 */

.theme-{name} {
  /* Global defaults for this theme */
  background-color: #YOUR_COLOR;
  color: #YOUR_COLOR;
  
  /* Optional: Override fonts by redefining CSS variables */
  /* --mono-ui: 'Your Body Font', Georgia, serif; */
  /* --mono-display: 'Your Heading Font', 'Your Body Font', serif; */
  /* font-family: var(--mono-ui); */
}

/* Override body background and font when theme is active */
body:has(.theme-{name}) {
  background-color: #YOUR_COLOR;
  /* Optional: Include font-family if changing typeface */
  /* font-family: 'Your Font', fallback, serif/sans-serif; */
}

/* Global links */
.theme-{name} a {
  color: #YOUR_COLOR;
}

.theme-{name} a:hover {
  color: #YOUR_COLOR;
}

/* Navigation */
.theme-{name} .nav-shell {
  background: rgba(R, G, B, A);
  border-bottom-color: rgba(R, G, B, A);
}

.theme-{name} .nav-brand-main {
  color: #YOUR_COLOR;
}

.theme-{name} .nav-brand-sub {
  color: rgba(R, G, B, A);
}

.theme-{name} .nav-link {
  color: rgba(R, G, B, A);
  background: rgba(R, G, B, A);
  border-color: transparent;
}

.theme-{name} .nav-link:hover {
  background: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .nav-link-active {
  border-color: rgba(R, G, B, A);
  background: rgba(R, G, B, A);
  color: #YOUR_COLOR;
}

/* Hero Section */
.theme-{name} .hero {
  background-color: #YOUR_COLOR;
}

.theme-{name} .hero-headline {
  color: #YOUR_COLOR;
}

.theme-{name} .hero-subheadline {
  color: rgba(R, G, B, A);
}

.theme-{name} .hero-grid-background {
  background-image: 
    linear-gradient(rgba(R, G, B, A) 1px, transparent 1px),
    linear-gradient(90deg, rgba(R, G, B, A) 1px, transparent 1px);
}

.theme-{name} .hero-exif-overlay {
  background: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(R, G, B, A) 2px,
      rgba(R, G, B, A) 4px
    );
}

/* Page Content */
.theme-{name} .page-block {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

/* Footer / Copyright */
.theme-{name} .copyright-notice {
  border-top-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .copyright-link {
  color: rgba(R, G, B, A);
}

.theme-{name} .copyright-link:hover {
  color: rgba(R, G, B, A);
}

/* Layout Controls */
.theme-{name} .layout-controls {
  border-bottom-color: rgba(R, G, B, A);
}

.theme-{name} .control-label {
  color: rgba(R, G, B, A);
}

.theme-{name} .segmented-control {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

.theme-{name} .segment-btn {
  color: rgba(R, G, B, A);
  border-right-color: rgba(R, G, B, A);
}

.theme-{name} .segment-btn:hover {
  background: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .segment-btn.active {
  background: rgba(R, G, B, A);
  color: #YOUR_COLOR;
}

/* EXIF Overlay */
.theme-{name} .exif-overlay {
  background: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .exif-header {
  border-bottom-color: rgba(R, G, B, A);
}

.theme-{name} .exif-filename {
  color: rgba(R, G, B, A);
}

.theme-{name} .exif-position {
  color: rgba(R, G, B, A);
}

.theme-{name} .exif-line {
  color: rgba(R, G, B, A);
}

.theme-{name} .exif-camera {
  color: rgba(R, G, B, A);
}

.theme-{name} .exif-date {
  color: rgba(R, G, B, A);
}

.theme-{name} .exif-settings {
  color: rgba(R, G, B, A);
}

.theme-{name} .exif-fallback {
  color: rgba(R, G, B, A);
}

/* Album Card */
.theme-{name} .album-cover {
  border-radius: 8px; /* All corners rounded to match card */
  overflow: hidden; /* Ensure child elements respect border-radius */
}

.theme-{name} .album-cover .lazy-image-wrapper {
  border-radius: 8px; /* Match cover border-radius on all corners */
}

.theme-{name} .album-cover .lazy-image-photo {
  border-radius: 8px; /* Ensure the actual image has rounded corners */
}

.theme-{name} .album-info {
  border-radius: 0 0 8px 8px; /* Bottom corners rounded to match card */
}

/* Album Card Hover Collage */
.theme-{name} .hover-collage {
  background: #YOUR_COLOR;
  border-radius: 8px 8px 0 0; /* Match cover border-radius */
}

.theme-{name} .collage-image {
  background: #YOUR_COLOR;
}

/* Album Page Photo Items */
.theme-{name} .photo-item {
  background: #YOUR_COLOR; /* Match theme background instead of default black */
}

.theme-{name} .photo-item .lazy-image-wrapper {
  border-radius: 4px; /* Match photo-item border-radius (4px) */
  overflow: hidden; /* Ensure child elements respect border-radius */
}

.theme-{name} .photo-item .lazy-image-photo {
  border-radius: 4px; /* Match photo-item border-radius to prevent black corners */
}

/* Filter Bar */
.theme-{name} .filter-separator {
  background: rgba(R, G, B, A);
}

.theme-{name} .filter-btn {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .filter-btn:hover {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

.theme-{name} .filter-btn.active {
  background: rgba(R, G, B, A);
  color: #YOUR_COLOR;
  border-color: rgba(R, G, B, A);
}

.theme-{name} .filter-dropdown {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .filter-dropdown:hover {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

.theme-{name} .filter-dropdown option {
  background: #YOUR_COLOR;
  color: #YOUR_COLOR;
}

.theme-{name} .dropdown-menu {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  box-shadow: 0 4px 12px rgba(R, G, B, A);
}

.theme-{name} .dropdown-search {
  background: rgba(R, G, B, A);
  border-bottom-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .dropdown-search::placeholder {
  color: rgba(R, G, B, A);
}

.theme-{name} .dropdown-search:focus {
  background: rgba(R, G, B, A);
}

.theme-{name} .dropdown-option {
  color: rgba(R, G, B, A);
}

.theme-{name} .dropdown-option:hover {
  background: rgba(R, G, B, A);
}

.theme-{name} .dropdown-option.active {
  background: rgba(R, G, B, A);
}

.theme-{name} .dropdown-checkbox {
  color: rgba(R, G, B, A);
}

.theme-{name} .dropdown-checkbox:hover {
  background: rgba(R, G, B, A);
}

.theme-{name} .filter-chip {
  background: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .filter-chip:hover {
  background: rgba(R, G, B, A);
}

.theme-{name} .clear-all-btn {
  color: rgba(R, G, B, A);
}

.theme-{name} .clear-all-btn:hover {
  color: rgba(R, G, B, A);
}

/* Date Filter Presets */
.theme-{name} .preset-chip {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .preset-chip:hover {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .preset-chip.active {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: #YOUR_COLOR;
}

/* Year Dropdown */
.theme-{name} .year-dropdown-trigger {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .year-dropdown-trigger:hover {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .year-dropdown-trigger.active {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: #YOUR_COLOR;
}

.theme-{name} .year-dropdown-menu {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  box-shadow: 0 8px 24px rgba(R, G, B, A);
}

.theme-{name} .year-option {
  color: rgba(R, G, B, A);
}

.theme-{name} .year-option:hover {
  background: rgba(R, G, B, A);
  color: #YOUR_COLOR;
}

.theme-{name} .year-option.selected {
  background: rgba(R, G, B, A);
  color: #YOUR_COLOR;
}

.theme-{name} .year-divider {
  background: rgba(R, G, B, A);
}

.theme-{name} .check-mark {
  color: rgba(R, G, B, A);
}

/* Year Timeline */
.theme-{name} .all-tick {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .all-tick:hover {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .all-tick.active {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: #YOUR_COLOR;
}

.theme-{name} .timeline-line::before {
  background: rgba(R, G, B, A);
}

.theme-{name} .tick-mark {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

.theme-{name} .timeline-tick:hover .tick-mark {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

.theme-{name} .timeline-tick.active .tick-mark {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  box-shadow: 0 0 8px rgba(R, G, B, A);
}

.theme-{name} .tick-label {
  color: rgba(R, G, B, A);
}

.theme-{name} .timeline-tick:hover .tick-label,
.theme-{name} .timeline-tick.active .tick-label {
  color: rgba(R, G, B, A);
}

/* Search Bar (if used) */
.theme-{name} .search-input {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .search-input::placeholder {
  color: rgba(R, G, B, A);
}

.theme-{name} .search-input:focus {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

.theme-{name} .search-button {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
  color: rgba(R, G, B, A);
}

.theme-{name} .search-button:hover {
  background: rgba(R, G, B, A);
  border-color: rgba(R, G, B, A);
}

/* Social Links (if used) */
.theme-{name} .social-link {
  color: rgba(R, G, B, A);
}

.theme-{name} .social-link:hover {
  color: rgba(R, G, B, A);
}
```

**Note**: Replace all `#YOUR_COLOR` and `rgba(R, G, B, A)` placeholders with your actual color values.

---

## Minimal Test Theme

To quickly test the theme system without implementing a full theme, create a minimal theme with just 3-5 highly visible overrides:

1. **Global background and text** (`.theme-{name}`)
2. **Navigation** (`.nav-shell`, `.nav-link`)
3. **Hero headline** (`.hero-headline`)
4. **Links** (`a`)
5. **One filter component** (`.filter-btn`)

This confirms:
- Theme class is applied correctly
- CSS overrides work
- Layout remains unchanged
- `hero.layout` still functions

Example minimal test theme:

```css
.theme-test {
  background-color: #ff0000; /* Red background for visibility */
  color: #ffffff;
}

body:has(.theme-test) {
  background-color: #ff0000;
}

.theme-test .nav-shell {
  background: rgba(200, 0, 0, 0.9);
}

.theme-test .hero-headline {
  color: #ffff00; /* Yellow text */
}

.theme-test a {
  color: #00ff00; /* Green links */
}
```

---

## Testing Checklist

When creating a new theme, verify:

- [ ] Theme name added to `VALID_THEMES` in `src/lib/siteConfig.js`
- [ ] Theme name set in `content/site/site.json`
- [ ] CSS block added to `src/styles/themes.css`
- [ ] Theme class appears on `.app-shell` element (inspect DOM)
- [ ] Global background and text colors applied
- [ ] Navigation styled correctly (all states: default, hover, active)
- [ ] Hero section styled (headline, subheadline, background)
- [ ] Links styled (default and hover)
- [ ] Page blocks/cards styled
- [ ] Footer/copyright styled
- [ ] Layout controls styled (if used)
- [ ] EXIF overlay styled (hover over images)
- [ ] Album card hover collage styled (background colors)
- [ ] Album page photo items styled (background, border-radius)
- [ ] Filter components styled (buttons, dropdowns, chips)
- [ ] Date presets styled
- [ ] Year dropdown styled
- [ ] Year timeline styled (if used)
- [ ] Search bar styled (if used)
- [ ] Social links styled (if used)
- [ ] Layout unchanged (no flex/grid/width/height changes)
- [ ] `hero.layout` still works independently
- [ ] Invalid theme name falls back to `"mono"` with console warning

---

## Typography / Typefaces

### Changing Fonts in Themes

Themes can override the default monospace fonts by redefining CSS variables in the theme block:

- **`--mono-ui`**: Used for body text, UI elements, navigation, buttons
- **`--mono-display`**: Used for headings, hero text, large display text

**Example** (from paper theme):

```css
.theme-paper {
  /* Override font variables */
  --mono-ui: 'Crimson Pro', Georgia, 'Times New Roman', serif;
  --mono-display: 'Playfair Display', 'Crimson Pro', Georgia, serif;
  font-family: var(--mono-ui);
}
```

**Steps to add custom fonts**:

1. Add Google Fonts import to `src/index.css` (before themes.css import):
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Your+Font:wght@400;600&display=swap');
   ```

2. Override CSS variables in your theme block:
   ```css
   .theme-{name} {
     --mono-ui: 'Your Font', fallback, serif;
     --mono-display: 'Your Display Font', fallback, serif;
     font-family: var(--mono-ui);
   }
   ```

3. Optionally override body font:
   ```css
   body:has(.theme-{name}) {
     font-family: 'Your Font', fallback, serif;
   }
   ```

**Font Selection Tips**:
- **Serif fonts** (Crimson Pro, Lora, Merriweather): Classic, readable, paper-like
- **Sans-serif fonts** (Inter, Work Sans, Poppins): Modern, clean
- **Display fonts** (Playfair Display, Bebas Neue): For headings only
- Always include fallback fonts (Georgia, serif) or (Arial, sans-serif)

---

## Versioning / Maintenance Notes

### Adding New Components

When new UI components are added to the site:

1. **Identify new selectors** that define colors, backgrounds, borders, or shadows
2. **Add to this checklist** in the "Required CSS Coverage Checklist" section
3. **Update the template** in "Theme CSS Template" section
4. **Update existing themes** to include the new selectors (or document as optional)

### Theme Scope Rules

- **DO**: Scope all theme styles under `.theme-{name}` selector
- **DO**: Only override visual properties (colors, backgrounds, borders, shadows)
- **DON'T**: Change layout properties (flex, grid, width, height, position)
- **DON'T**: Modify `hero.layout` behavior or classes
- **DON'T**: Touch component logic or markup

### CSS Variable Strategy

The codebase currently uses CSS variables for fonts (`--mono-ui`, `--mono-display`) but not for colors. If you want to add CSS variable support for themes:

1. Define theme variables in `.theme-{name}` block
2. Use variables in component CSS files
3. Update this documentation to reflect the new approach

**Current approach**: Direct color overrides (no variables) - simpler and more explicit.

---

## Reference: File Locations

- **Theme config**: `content/site/site.json` → `theme.name`
- **Theme validation**: `src/lib/siteConfig.js` → `VALID_THEMES` array (line 64)
- **Theme application**: `src/App.jsx` → `.app-shell.theme-{name}` (line 37)
- **Theme CSS**: `src/styles/themes.css`
- **Theme import**: `src/index.css` → `@import './styles/themes.css'` (line 4)

---

## Example: Paper Theme Reference

See `src/styles/themes.css` for a complete implementation example. The `.theme-paper` block demonstrates:

- All required selectors with actual color values
- Font override using CSS variables (`--mono-ui` and `--mono-display`)
- Serif typeface (Crimson Pro for body, Playfair Display for headings)
- Complete theme implementation

**Paper Theme Typography**:
- **Body/UI**: Crimson Pro (serif, readable)
- **Headings/Display**: Playfair Display (elegant serif)
- **Font Import**: Added in `src/index.css` (line 2)

