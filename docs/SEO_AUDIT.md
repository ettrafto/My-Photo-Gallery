# SEO Audit Report

## Overview

This audit evaluates the site's SEO implementation against best practices for minimal but correct SEO setup.

## Audit Criteria

1. ✅ Page titles are set and meaningful
2. ✅ Meta descriptions exist for main pages
3. ✅ Favicon + ICO are correct
4. ✅ OpenGraph image works when sharing links
5. ✅ No accidental noindex headers

---

## 1. Page Titles ✅ PARTIAL

### Current Implementation

- **Default Title**: Set via `useSEO()` hook in `SEOWrapper` component
- **Title Template**: `"%s · PHOTO.LOG"` (from `site.json`)
- **Default Fallback**: `"PHOTO.LOG"` (from `site.json`)

### Issues Found

❌ **All pages use the same default title**

Pages are not setting page-specific titles:
- `Home.jsx` - No `useSEO()` call, uses default
- `Albums.jsx` - No `useSEO()` call, uses default
- `Trips.jsx` - No `useSEO()` call, uses default
- `TripDetail.jsx` - No `useSEO()` call, uses default
- `Map.jsx` - No `useSEO()` call, uses default
- `About.jsx` - No `useSEO()` call, uses default
- `AlbumPage.jsx` - No `useSEO()` call, uses default

**Result**: All pages show `"PHOTO.LOG"` as the title, which is not meaningful for individual pages.

### Recommendations

Each page should call `useSEO()` with a page-specific title:

```jsx
// Home.jsx
useSEO({ pageTitle: "Home" }); // Results in "Home · PHOTO.LOG"

// Albums.jsx
useSEO({ pageTitle: "Albums" }); // Results in "Albums · PHOTO.LOG"

// About.jsx
useSEO({ pageTitle: "About" }); // Results in "About · PHOTO.LOG"

// TripDetail.jsx
useSEO({ 
  pageTitle: trip?.title || "Trip" 
}); // Results in "Trip Name · PHOTO.LOG"

// AlbumPage.jsx
useSEO({ 
  pageTitle: album?.title || "Album" 
}); // Results in "Album Name · PHOTO.LOG"
```

---

## 2. Meta Descriptions ✅ PARTIAL

### Current Implementation

- **Default Description**: `"A minimal photo archive of trips, places, and light."` (from `site.json`)
- **Applied**: Via `useSEO()` hook in `SEOWrapper`

### Issues Found

❌ **All pages use the same generic description**

No pages are setting page-specific descriptions, so all pages share the same meta description.

### Recommendations

Add page-specific descriptions:

```jsx
// Home.jsx
useSEO({ 
  pageTitle: "Home",
  description: "A minimal photo archive of trips, places, and light. Explore photography collections from adventures around the world."
});

// Albums.jsx
useSEO({ 
  pageTitle: "Albums",
  description: "Browse photo albums organized by location, date, and theme. Each album contains curated images from specific places and moments."
});

// Trips.jsx
useSEO({ 
  pageTitle: "Trips",
  description: "Journeys through beautiful places. Each trip brings together albums from a specific adventure, showing the route, highlights, and stories along the way."
});

// TripDetail.jsx
useSEO({ 
  pageTitle: trip?.title || "Trip",
  description: trip?.summary || `Explore ${trip?.title || 'this trip'} through photos, maps, and highlights.`
});

// AlbumPage.jsx
useSEO({ 
  pageTitle: album?.title || "Album",
  description: album?.description || `View ${album?.count || 0} photos from ${album?.title || 'this album'}.`
});

// Map.jsx
useSEO({ 
  pageTitle: "Map",
  description: "Explore photo locations on an interactive map. See where photos were taken around the world."
});

// About.jsx
useSEO({ 
  pageTitle: "About",
  description: "Learn about the photographer, the site, and how this photo archive was built."
});
```

---

## 3. Favicon + ICO ✅ CORRECT

### Current Implementation

- **Location**: `/favicons/film.ico`
- **HTML Reference**: `<link rel="icon" type="image/x-icon" href="/favicons/film.ico" />` in `index.html`
- **Format**: `.ico` file

### Status

✅ **Favicon is correctly configured**

The favicon is:
- Present at `/favicons/film.ico`
- Properly referenced in `index.html`
- Using the correct `.ico` format
- Using the correct `rel="icon"` attribute

### Recommendations

✅ No changes needed. Consider adding additional favicon sizes for better browser support:

```html
<link rel="icon" type="image/x-icon" href="/favicons/film.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/film-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/film-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/favicons/film-180x180.png" />
```

---

## 4. OpenGraph Image ⚠️ MISSING

### Current Implementation

- **Config**: `seo.ogImage` in `site.json` is empty string `""`
- **Hook**: `useSEO()` sets `og:image` from config or page-specific override
- **Current Value**: Empty (no OG image set)

### Issues Found

❌ **OpenGraph image is not configured**

The `ogImage` field in `site.json` is empty, so no OpenGraph image is set for social sharing.

### Impact

When sharing links on social media (Facebook, Twitter, LinkedIn, etc.), no preview image will appear.

### Recommendations

1. **Create an OpenGraph image** (recommended: 1200x630px)
   - Should represent the site/brand
   - Place in `public/og-image.jpg` or `public/og-image.png`

2. **Update `site.json`**:
   ```json
   {
     "seo": {
       "ogImage": "/og-image.jpg"
     }
   }
   ```

3. **Optional: Page-specific OG images**
   - Album pages: Use album cover image
   - Trip pages: Use trip cover image
   - Example:
     ```jsx
     // AlbumPage.jsx
     useSEO({ 
       pageTitle: album?.title,
       ogImage: album?.cover || "/og-image.jpg"
     });
     ```

---

## 5. Noindex Headers ✅ CORRECT

### Current Implementation

- **Default**: `robots: "index,follow"` (from `site.json`)
- **Applied**: Via `useSEO()` hook
- **Override**: Can be set per-page via `useSEO({ robots: "..." })`

### Status

✅ **No accidental noindex found**

- Default robots tag is `"index,follow"` (correct for public site)
- No pages are setting `noindex`
- No HTTP headers setting noindex
- No meta tags with `noindex` found

### Recommendations

✅ No changes needed. The site is correctly configured to be indexed.

**Note**: If you need to prevent indexing of specific pages in the future:
```jsx
useSEO({ robots: "noindex,nofollow" });
```

---

## Summary

### ✅ Passing
- Favicon configuration
- No accidental noindex

### ⚠️ Needs Improvement
- Page titles (all pages use default)
- Meta descriptions (all pages use default)
- OpenGraph image (not configured)

### Priority Fixes

1. **High Priority**: Add page-specific titles to all pages
2. **High Priority**: Add page-specific descriptions to all pages
3. **Medium Priority**: Create and configure OpenGraph image

---

## Implementation Checklist

- [ ] Add `useSEO()` calls to all pages with page-specific titles
- [ ] Add page-specific descriptions to all pages
- [ ] Create OpenGraph image (1200x630px)
- [ ] Update `site.json` with `ogImage` path
- [ ] (Optional) Add page-specific OG images for albums/trips
- [ ] (Optional) Add additional favicon sizes for better browser support

---

## Code Examples

### Example: Home Page
```jsx
// src/pages/Home.jsx
import { useSEO } from '../hooks/useSEO';

export default function Home() {
  useSEO({ 
    pageTitle: "Home",
    description: "A minimal photo archive of trips, places, and light. Explore photography collections from adventures around the world."
  });

  return (
    // ... existing code
  );
}
```

### Example: Album Page
```jsx
// src/components/AlbumPage.jsx
import { useSEO } from '../hooks/useSEO';

export default function AlbumPage() {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  
  // ... existing loading logic

  useSEO({ 
    pageTitle: album?.title || "Album",
    description: album?.description || `View ${album?.count || 0} photos from ${album?.title || 'this album'}.`,
    ogImage: album?.cover || undefined // Use album cover if available
  });

  // ... rest of component
}
```

### Example: Trip Detail Page
```jsx
// src/pages/TripDetail.jsx
import { useSEO } from '../hooks/useSEO';

export default function TripDetail() {
  const { slug } = useParams();
  const [trip, setTrip] = useState(null);
  
  // ... existing loading logic

  useSEO({ 
    pageTitle: trip?.title || "Trip",
    description: trip?.summary || `Explore ${trip?.title || 'this trip'} through photos, maps, and highlights.`,
    ogImage: trip?.coverImage || undefined
  });

  // ... rest of component
}
```
