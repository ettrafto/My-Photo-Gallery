# Architecture Guide

**Last Updated**: 2025-01-XX

This document describes the high-level architecture, data flow, and system design of the Photo Log application.

> 📚 **See also**: [Configuration Guide](CONFIGURATION.md) | [Development Guide](DEVELOPMENT.md) | [README](../README.md)

---

## Overview

Photo Log is a static React application that generates JSON manifests from photo folders and renders them in a gallery interface. The architecture separates content generation (build-time scripts) from content consumption (runtime React app).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Build-Time (Scripts)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  photo-source/originals/  →  importPhotos.mjs  →  content/ │
│  ├── album-1/              (process images,       ├── albums.json
│  │   ├── *.JPG              extract EXIF,          ├── albums/
│  │   └── _album.json        generate JSON)         │   └── *.json
│                                                      └── map.json
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ (deploy)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Runtime (React Application)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  App.jsx                                                     │
│  ├── loadSiteConfig()  →  siteConfig.js  →  content/site/  │
│  ├── Router                                                  │
│  │   ├── / → Home → Hero + AlbumGrid                        │
│  │   ├── /albums → Albums → AlbumGrid                       │
│  │   ├── /album/:slug → AlbumPage                           │
│  │   ├── /trips → Trips → TripCard grid                     │
│  │   ├── /trips/:slug → TripDetail                          │
│  │   ├── /map → Map → Leaflet map                           │
│  │   └── /about → About                                     │
│  │                                                           │
│  └── Components                                              │
│      ├── NavBar (site config)                                │
│      ├── Hero (site config)                                  │
│      ├── AlbumGrid (content/albums.json)                     │
│      ├── AlbumPage (content/albums/{slug}.json)              │
│      └── ...                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Configuration Loading Flow

```
1. App.jsx mounts
   ↓
2. loadSiteConfig() called
   ↓
3. fetch('content/site/site.json')
   ↓
4. siteConfig.js validates and caches
   ↓
5. Components consume via getSiteConfig(), getNavItems(), etc.
```

**Key Points:**
- Configuration is fetched at runtime (not bundled)
- First load caches config in memory
- Fallback config prevents crashes if file missing
- Components use getter functions, not direct fetch

### Album Data Flow

```
1. AlbumGrid component mounts
   ↓
2. fetch('content/albums.json') → gets album summaries
   ↓
3. For each album: fetch('content/albums/{slug}.json')
   ↓
4. State updates with full album data (including photos)
   ↓
5. Filtering/search applied client-side
   ↓
6. AlbumCard components render
```

**Key Points:**
- Two-step loading: index first, then individual albums
- Full album data needed for collage feature
- All filtering done client-side (no backend)

### Trip Data Flow

```
1. Trips page mounts
   ↓
2. Read TRIP_SLUGS from src/data/trips.js (static)
   ↓
3. For each slug: fetch('content/trips/{slug}.json')
   ↓
4. TripDetail: Also fetch('content/map.json') for photo locations
   ↓
5. Filter map.json photos by trip's albumIds
   ↓
6. Render trip with map, timeline, gallery
```

**Key Points:**
- Trip slugs are hardcoded in source (not discovered dynamically)
- Trip photos come from map.json, filtered by album membership
- Map data provides GPS coordinates for route visualization

---

## Configuration System

### Site Configuration (`content/site/site.json`)

**Loaded by**: `src/lib/siteConfig.js`

**Consumed by**:
- `NavBar.jsx` - site title, owner name, nav items
- `Hero.jsx` - headline, subheadline, layout, grid items
- `SocialLinks.jsx` - social items
- `CopyrightNotice.jsx` - owner name
- `useSEO.js` - SEO defaults
- `App.jsx` - theme name

**Validation**: 
- Required fields throw errors
- Optional fields have defaults
- Invalid values log warnings and use fallbacks

**Caching**: In-memory cache after first load

See `docs/CONFIGURATION.md` for complete reference.

---

## Theme System

### Implementation

1. **Config Source**: `content/site/site.json` → `theme.name`
2. **Validation**: Whitelist (`"mono"`, `"paper"`)
3. **Application**: CSS class on app root (`theme-{name}`)
4. **Location**: `App.jsx` applies class, CSS files define theme styles

### How It Works

```jsx
// App.jsx
<div className={`app-shell theme-${themeName}`}>
  {/* App content */}
</div>
```

CSS uses class-based selectors:
```css
.theme-mono { /* mono theme styles */ }
.theme-paper { /* paper theme styles */ }
```

---

## Hero Layout System

### Architecture

1. **Config Source**: `content/site/site.json` → `hero.layout`
2. **Current Implementation**: Only `"default"` layout exists
3. **CSS Application**: Class `hero-layout-{layout}` applied to hero images container
4. **Grid Override**: If `hero.grid.enabled === true`, grid items replace default image cluster

### Data Flow

```
Hero.jsx mounts
  ↓
loadSiteConfig() → get hero.* fields
  ↓
If hero.grid.enabled === true:
  getHeroGridItems() → filters/validates grid items (max 3)
  ↓
  Render grid items
Else:
  Use default image cluster (props.images)
```

**Code Reference**: `src/components/Hero.jsx`, `src/lib/siteConfig.js:228-253`

---

## Image Rendering Pipeline

### Component Hierarchy

```
LazyImage (IntersectionObserver)
  ↓
Photo (quality selection, srcSet building)
  ↓
<img> (native browser image)
```

### Quality Selection

1. **Viewport-based**: `useLowQualityMode()` hook checks window width
   - < 768px → use small images
   - ≥ 768px → use large images

2. **Network-aware** (optional): `useAdaptiveQuality()` considers:
   - Connection speed
   - Data saver mode
   - Viewport size

3. **SrcSet Generation**: Builds responsive srcSet for optimal loading

**Code Reference**: 
- `src/components/LazyImage.jsx`
- `src/components/Photo.jsx`
- `src/hooks/useLowQualityMode.js`

### Image Paths

**Modern pipeline** (`import:photos`):
- `public/photos/{album}/{filename}-large.webp`
- `public/photos/{album}/{filename}-small.webp`
- `public/photos/{album}/{filename}-blur.webp`

**Legacy pipeline** (`scan`):
- `public/images/{album}/{filename}` (original files)

---

## Routing Architecture

### Route Structure

```jsx
<Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/albums" element={<Albums />} />
    <Route path="/album/:slug" element={<AlbumPage />} />
    <Route path="/trips" element={<Trips />} />
    <Route path="/trips/:slug" element={<TripDetail />} />
    <Route path="/map" element={<Map />} />
    <Route path="/about" element={<About />} />
  </Routes>
</Router>
```

**Dynamic Routes**: 
- `/album/:slug` - loads `content/albums/{slug}.json`
- `/trips/:slug` - loads `content/trips/{slug}.json`

**Static Routes**: All other routes render static page components

---

## SEO System

### Implementation

1. **Hook**: `useSEO()` in `src/hooks/useSEO.js`
2. **Default Config**: Loaded from `siteConfig.seo`
3. **Per-Page Override**: Components can pass options to `useSEO()`

### How It Works

```jsx
// Default SEO (all pages)
useSEO(); // Uses config defaults

// Per-page override
useSEO({
  pageTitle: "Album Name",
  description: "Custom description",
  ogImage: "/custom-image.jpg"
});
```

### Meta Tags Set

- Document title (with template support)
- Meta description
- Robots meta
- Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- Twitter Card tags

**Implementation**: Direct DOM manipulation (no React Helmet dependency)

---

## Build Process

### Production Build Pipeline

```bash
npm run build
```

1. **Image Processing**: `import:photos`
   - Processes `photo-source/originals/`
   - Generates optimized images in `public/photos/`
   - Extracts EXIF data
   - Generates `content/albums.json` and `content/albums/*.json`
   - Generates `content/map.json`

2. **React Build**: `vite build`
   - Bundles React app
   - Minifies and optimizes
   - Outputs to `dist/`

3. **Content Copy**: `copy-content.mjs`
   - Copies `content/` to `dist/content/`
   - Ensures JSON files are available at runtime

### Build Output Structure

```
dist/
├── assets/          # Bundled JS/CSS (hashed filenames)
├── index.html       # Entry HTML
└── content/         # JSON manifests (copied from content/)
    ├── site/
    ├── albums.json
    ├── albums/
    ├── trips/
    └── map.json
```

**Note**: Images in `public/photos/` are copied automatically by Vite.

---

## Performance Architecture

### Image Loading Strategy

1. **Lazy Loading**: `IntersectionObserver` watches for viewport entry
2. **Skeleton States**: Placeholder UI while images load
3. **Responsive Images**: `srcSet` and `sizes` attributes for optimal loading
4. **Blur Placeholders**: Tiny blurred images shown during load

### Code Splitting

- Vite automatically code-splits routes
- Components loaded on-demand via React Router

### Caching

- **Config Cache**: In-memory after first load
- **Browser Cache**: JSON files and images cached by browser
- **Build Cache**: Vite cache for faster rebuilds

---

## Data Models

### Album JSON Schema

```typescript
{
  id: string;
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  date: string;
  startDate?: string;
  endDate?: string;
  cover: string;
  coverAspectRatio: number;
  count: number;
  isFavorite: boolean;
  primaryLocation?: {
    name: string;
    lat?: number;
    lng?: number;
  };
  photos: Array<{
    filename: string;
    path: string;
    pathSmall?: string;
    pathLarge?: string;
    aspectRatio: number;
    width?: number;
    height?: number;
    exif?: { ... };
  }>;
}
```

### Trip JSON Schema

See `src/types/trips.jsdoc.js` for complete type definitions.

Key fields:
- `slug`, `title`, `dateStart`, `dateEnd`
- `albumIds` - array of album slugs
- `route` - polyline points for map
- `highlights` - key moments with GPS
- `media` - supplemental content

### Site Config Schema

See `docs/CONFIGURATION.md` for complete reference.

---

## Key Design Decisions

### Why JSON at Runtime?

- **Flexibility**: Update content without rebuilding
- **Simplicity**: No database or CMS needed
- **Static Hosting**: Works with any static host
- **Version Control**: JSON files are versioned with code

### Why Separate Config Loader?

- **Centralized Validation**: Single source of truth for validation
- **Caching**: Prevents redundant fetches
- **Type Safety**: Consistent getter functions
- **Fallback Handling**: Graceful degradation

### Why Client-Side Filtering?

- **No Backend**: Fully static architecture
- **Instant Feedback**: No server round-trips
- **Simple Implementation**: Array.filter() is sufficient
- **Offline Capable**: Works without network (after initial load)

---

## Extension Points

### Adding a New Theme

1. Add theme name to `VALID_THEMES` in `siteConfig.js`
2. Create CSS file with `.theme-{name}` classes
3. Users set `theme.name` in `site.json`

### Adding a New Hero Layout

1. Add layout identifier to `hero.layout` in `site.json`
2. Create CSS for `hero-layout-{layout}` class
3. Hero component automatically applies class

### Adding a New Route

1. Add route to `App.jsx`
2. Create page component in `src/pages/`
3. Optionally add nav item in `site.json`

---

## See Also

- [Configuration Guide](CONFIGURATION.md) - Complete configuration reference
- [Development Guide](DEVELOPMENT.md) - Development workflow and setup
- [README](../README.md) - Project overview and quick start
