# Site Architecture

## Overview

Photo-Log is a **fully static** photo portfolio built with React. It has no backend, no database, and no API. All content is generated at build time from source images and JSON configuration files.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD TIME                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  photo-source/originals/                                    │
│    └── {album}/                                             │
│        ├── IMG_001.jpg                                      │
│        └── _album.json (optional)                           │
│                                                             │
│         ↓ Processing Scripts                                │
│                                                             │
│  scripts/importPhotos.mjs                                   │
│  scripts/processHero.mjs                                    │
│  scripts/processShowcase.mjs                                │
│  scripts/processAbout.mjs                                   │
│  scripts/rebuildAlbumsIndex.mjs                            │
│                                                             │
│         ↓ Generates                                          │
│                                                             │
│  public/photos/{album}/                                     │
│    ├── IMG_001-large.webp (1800px)                         │
│    ├── IMG_001-small.webp (800px)                          │
│    └── IMG_001-blur.webp (40px)                            │
│                                                             │
│  content/                                                    │
│    ├── site/site.json                                       │
│    ├── albums.json (index)                                  │
│    ├── albums/{slug}.json (full album data)                │
│    ├── trips/{slug}.json                                    │
│    └── map.json                                             │
│                                                             │
│         ↓ Vite Build                                        │
│                                                             │
│  vite build                                                  │
│                                                             │
│         ↓ Copy Content                                      │
│                                                             │
│  scripts/copy-content.mjs                                   │
│                                                             │
│         ↓                                                    │
│                                                             │
│  dist/                                                      │
│    ├── index.html                                           │
│    ├── assets/ (JS/CSS bundles)                            │
│    ├── photos/ (processed images)                          │
│    └── content/ (JSON files)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser loads dist/index.html                              │
│         ↓                                                   │
│  React app initializes (src/main.jsx)                      │
│         ↓                                                   │
│  Router loads page component                               │
│         ↓                                                   │
│  Component fetches JSON from dist/content/                 │
│    - fetch('content/albums.json')                          │
│    - fetch('content/albums/{slug}.json')                   │
│    - fetch('content/site/site.json')                       │
│         ↓                                                   │
│  Component renders with data                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

1. **Static Generation**: All content is pre-processed at build time
2. **JSON-Driven**: Content is stored as JSON files, not a database
3. **Data Preservation**: Scripts never overwrite manual edits to JSON files
4. **Incremental Processing**: Only processes new or changed images
5. **No Backend**: Fully static - deploy `dist/` folder to any static host

## Directory Structure

```
Photo-Log/
├── photo-source/originals/          # Source images (not in git)
│   ├── {album}/                     # Album folders
│   │   ├── IMG_001.jpg
│   │   └── _album.json (optional)
│   └── config/                      # Special images
│       ├── hero/
│       ├── showcase/
│       └── about/
├── public/                          # Processed images (in git)
│   └── photos/{album-slug}/
│       ├── IMG_001-large.webp
│       ├── IMG_001-small.webp
│       └── IMG_001-blur.webp
├── content/                         # JSON manifests (in git)
│   ├── site/
│   │   ├── site.json
│   │   ├── showcase.json
│   │   └── about.json
│   ├── albums.json                  # Album index
│   ├── albums/{slug}.json           # Full album data
│   ├── trips/{slug}.json            # Trip definitions
│   └── map.json                     # Global map data
├── src/                             # React application
│   ├── pages/                       # Route pages
│   ├── components/                  # Reusable components
│   ├── lib/                         # Utilities (siteConfig, etc.)
│   ├── hooks/                       # Custom React hooks
│   └── utils/                       # Helper functions
├── scripts/                          # Build-time processing
│   ├── importPhotos.mjs             # Main photo pipeline
│   ├── processHero.mjs
│   ├── processShowcase.mjs
│   ├── processAbout.mjs
│   ├── rebuildAlbumsIndex.mjs
│   └── copy-content.mjs
└── dist/                            # Production build (generated)
    ├── index.html
    ├── assets/
    ├── photos/
    └── content/
```

## Build Pipeline

1. **Photo Processing**: `npm run import:photos`
   - Scans `photo-source/originals/{album}/`
   - Generates WebP variants to `public/photos/{album-slug}/`
   - Extracts EXIF metadata
   - Creates/updates `content/albums/{slug}.json`
   - Updates `content/albums.json` index

2. **Special Images**: `npm run process:hero`, `process:showcase`, `process:about`
   - Process images from `photo-source/originals/config/{type}/`
   - Generate variants to `public/{type}/`
   - Update `content/site/{type}.json`

3. **React Build**: `vite build`
   - Bundles React app to `dist/`
   - Code splitting (React, Framer Motion, Leaflet, D3)
   - Minification and optimization

4. **Content Copy**: `scripts/copy-content.mjs`
   - Copies `content/` to `dist/content/`
   - Makes JSON available at runtime

## React Application

### Entry Point
- `src/main.jsx` - Renders `App.jsx` into DOM

### Routing (`src/App.jsx`)
- `/` - Home (Hero, Globe, Showcase, Favorites)
- `/albums` - Album grid with filters
- `/albums/:slug` - Individual album page
- `/trips` - Trip index
- `/trips/:slug` - Trip detail page
- `/map` - Global map view
- `/about` - About page

### Data Loading
- Components fetch JSON via `fetch()` at runtime
- Site config loaded once and cached (`src/lib/siteConfig.js`)
- No API calls - all data is static JSON files

### Component Hierarchy
```
App
├── NavBar (loads site config)
├── Routes
│   ├── Home
│   │   ├── Hero
│   │   ├── Globe
│   │   ├── Showcase
│   │   └── Favorites
│   ├── Albums
│   │   └── AlbumGrid (fetches albums.json)
│   ├── AlbumPage (fetches albums/{slug}.json)
│   ├── Trips
│   │   └── TripCard (fetches trips/{slug}.json)
│   ├── TripDetail (fetches trip + album JSONs)
│   ├── Map (fetches albums.json)
│   └── About
│       ├── AboutCameraFocus
│       └── AboutSocialLinks
└── Footer (loads site config)
```

## Content Relationships

```
site.json
  ├── hero.images → public/hero/
  ├── showcase → content/site/showcase.json
  ├── about.camera → content/site/about.json
  └── favorites → albums.json / trips/{slug}.json

albums.json (index)
  └── albums[] → albums/{slug}.json (full data)

albums/{slug}.json
  ├── photos[] → public/photos/{album-slug}/
  └── primaryLocation → map.json

trips/{slug}.json
  └── albumIds[] → albums/{slug}.json

map.json (generated)
  └── albums[] (from albums with geo data)
```

## Key Technologies

- **React 19** - UI framework
- **Vite 7** - Build tool
- **React Router 7** - Client-side routing
- **Framer Motion** - Animations
- **Sharp** - Image processing (build-time)
- **exifr** - EXIF extraction (build-time)
- **Leaflet** - Map visualization
- **D3.js** - Globe visualization
