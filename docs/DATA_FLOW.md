# Data Flow

## Build-Time Data Flow

### Source to Processed Images

```
photo-source/originals/{album}/IMG_001.jpg
         ↓
    [importPhotos.mjs]
         ↓
    ┌─────────────────┐
    │ Extract EXIF    │ → Camera, lens, GPS, dates
    │ Generate WebP   │ → large, small, blur variants
    │ Calculate dims  │ → width, height, aspectRatio
    └─────────────────┘
         ↓
public/photos/{album-slug}/
    ├── IMG_001-large.webp
    ├── IMG_001-small.webp
    └── IMG_001-blur.webp
```

### JSON Manifest Generation

```
Source Image + EXIF + Metadata
         ↓
    [importPhotos.mjs]
         ↓
content/albums/{slug}.json
{
  "slug": "album-name",
  "photos": [
    {
      "filename": "IMG_001.jpg",
      "path": "photos/album-name/IMG_001-large.webp",
      "pathLarge": "photos/album-name/IMG_001-large.webp",
      "pathSmall": "photos/album-name/IMG_001-small.webp",
      "pathBlur": "photos/album-name/IMG_001-blur.webp",
      "width": 6000,
      "height": 4000,
      "aspectRatio": 1.5,
      "lat": 40.123,
      "lng": -111.456,
      "exif": { ... }
    }
  ]
}
```

### Index Generation

```
content/albums/{slug}.json (individual albums)
         ↓
    [rebuildAlbumsIndex.mjs]
         ↓
content/albums.json (index - no photos array)
{
  "albums": [
    {
      "slug": "album-name",
      "title": "Album Title",
      "count": 10,
      "cover": "photos/album-name/IMG_001-large.webp",
      "primaryLocation": { "lat": 40.123, "lng": -111.456 }
    }
  ]
}
         ↓
content/map.json (albums with GPS for Globe)
{
  "albums": [
    {
      "albumSlug": "album-name",
      "lat": 40.123,
      "lng": -111.456,
      "photoCount": 10
    }
  ]
}
```

## Runtime Data Flow

### Component Data Loading Pattern

```
Component mounts (useEffect)
         ↓
fetch(`${BASE_URL}content/{resource}.json`)
         ↓
Response.json()
         ↓
setState(data)
         ↓
Component renders with data
```

### Example: AlbumGrid

```javascript
// 1. Load index
fetch('content/albums.json')
  .then(res => res.json())
  .then(data => data.albums) // Array of album summaries

// 2. Load full data for each album
albums.map(album =>
  fetch(`content/albums/${album.slug}.json`)
    .then(res => res.json()) // Full album with photos array
)
```

### Example: TripDetail

```javascript
// 1. Load trip
fetch(`content/trips/${slug}.json`)
  .then(res => res.json())
  .then(trip => trip.albumIds) // ['album-1', 'album-2']

// 2. Load referenced albums
trip.albumIds.map(slug =>
  fetch(`content/albums/${slug}.json`)
    .then(res => res.json()) // Full album data
)
```

### Site Config Loading

```javascript
// Loaded once, cached globally
fetch('content/site/site.json')
  .then(res => res.json())
  .then(config => {
    // Cached in siteConfig.js module
    // All components access via getSiteConfig()
  })
```

## Content Relationships

### Albums → Trips

```
albums.json
  └── albums[] → { slug: "zion" }
         ↓
trips/{slug}.json
  └── albumIds: ["zion", "bryce"]
         ↓
TripDetail loads:
  - trips/{slug}.json
  - albums/zion.json
  - albums/bryce.json
```

### Albums → Map

```
albums/{slug}.json
  └── photos[] → { lat: 40.123, lng: -111.456 }
         ↓
rebuildAlbumsIndex.mjs
         ↓
map.json
  └── albums[] → { albumSlug, lat, lng }
         ↓
Globe component displays markers
```

### Site Config → Components

```
content/site/site.json
  ├── hero.images → Hero component
  ├── showcase → Showcase component
  ├── about.camera → AboutCameraFocus
  ├── nav.items → NavBar
  ├── social.items → AboutSocialLinks, Footer
  └── favorites → FavoriteAlbum, FavoriteTrip
```

## Data Preservation Strategy

### How Manual Edits Are Preserved

1. **Album JSON**
   - Script loads existing `content/albums/{slug}.json` first
   - Merges new photo data with existing photos
   - Matches by filename/path
   - Preserves all existing fields (custom EXIF, tags, etc.)

2. **Albums Index**
   - `rebuildAlbumsIndex.mjs` reads existing `albums.json`
   - Preserves `primaryLocation` if manually set
   - Preserves `isFavorite` status
   - Only updates from individual album files if not manually set

3. **Site Config**
   - Processing scripts update only image paths
   - Never overwrites text content, order, captions
   - User edits in JSON are source of truth

## Build vs Runtime

| Aspect | Build-Time | Runtime |
|--------|-----------|---------|
| **Image Processing** | ✅ Sharp, exifr | ❌ |
| **JSON Generation** | ✅ Scripts write JSON | ❌ |
| **JSON Reading** | ✅ Scripts read JSON | ✅ Components fetch JSON |
| **React Rendering** | ✅ Vite pre-renders | ✅ React hydrates |
| **Data Transformation** | ✅ All processing | ❌ Display only |
