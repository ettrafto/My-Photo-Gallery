# Image Optimization - Quick Reference Card

## 🚀 TL;DR

**All images are now optimized!** Use the new `Photo` and `LazyImage` components for all future image rendering.

---

## When to Use What?

### Use `<LazyImage>` for:
- ✅ Album photo grids (10+ photos)
- ✅ Trip galleries
- ✅ Any page with 20+ images
- ✅ When you want skeleton loaders

### Use `<Photo>` for:
- ✅ Album/trip card covers
- ✅ Single images
- ✅ Carousel/slider images
- ✅ Hero sections (with `loading="eager"`)

---

## Copy-Paste Examples

### Album Grid (Most Common)

```jsx
import LazyImage from '../components/LazyImage';
import { getAlbumGridSizes, buildPhotoProps } from '../utils/imageUtils';

{album.photos.map((photo, index) => {
  const photoProps = buildPhotoProps(photo, {
    baseUrl: import.meta.env.BASE_URL,
    sizes: getAlbumGridSizes(3),
  });
  
  return (
    <LazyImage
      key={photo.filename}
      {...photoProps}
      threshold={index < 6 ? 0 : 0.01}
      rootMargin="100px"
    />
  );
})}
```

### Card Cover Image

```jsx
import Photo from '../components/Photo';

<Photo 
  src={coverUrl}
  alt={album.title}
  aspectRatio={1.5}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
/>
```

### Hero Image (Above Fold)

```jsx
import Photo from '../components/Photo';

<Photo 
  src={heroUrl}
  alt="Hero image"
  loading="eager"
  fetchPriority="high"
  decoding="async"
/>
```

---

## Common Sizes Strings

```jsx
// Album grid (3 columns)
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

// Album grid (5 columns)
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"

// Full width
sizes="100vw"

// Half width on all screens
sizes="50vw"
```

Or use the helpers:

```jsx
import { getAlbumGridSizes, getTripGallerySizes } from '../utils/imageUtils';

const albumSizes = getAlbumGridSizes(3);  // For album grids
const tripSizes = getTripGallerySizes();  // For trip galleries
```

---

## Required Props Checklist

### For Photo Component:
- ✅ `src` - Image URL (required)
- ✅ `alt` - Accessibility text (required)
- ✅ `aspectRatio` - Prevents layout shift (strongly recommended)
- ⚠️ `sizes` - For responsive images (recommended)

### For LazyImage Component:
- ✅ Everything from Photo, plus:
- ⚠️ `threshold` - When to load (0 = immediately, 0.01 = just before viewport)
- ⚠️ `rootMargin` - Load distance ("100px" = 100px before viewport)

---

## Performance Rules

### ✅ DO:
1. Use LazyImage for grids with 10+ photos
2. Provide `aspectRatio` to prevent layout shift
3. Load first 6 images eagerly (`threshold={0}`)
4. Use `loading="eager"` for hero images
5. Use `buildPhotoProps()` helper to reduce boilerplate

### ❌ DON'T:
1. Use `loading="lazy"` with LazyImage (it handles it)
2. Skip `aspectRatio` (causes layout shift!)
3. Lazy load hero images (they should load immediately)
4. Forget `alt` text (accessibility!)
5. Use `index` as key (use `photo.filename`)

---

## Troubleshooting

### Image not loading?
Check the `src` URL is correct in browser DevTools

### Layout shifting?
Add `aspectRatio` prop from photo data

### Loading too late?
Increase `rootMargin` or decrease `threshold`

### Loading too early (wasting bandwidth)?
Increase `threshold` or decrease `rootMargin`

---

## Need More Info?

📖 **Full Guide**: `docs/image-optimization-guide.md`  
📊 **Audit Report**: `docs/image-performance-audit.md`  
📋 **Summary**: `docs/image-optimization-summary.md`

---

**Quick Reference v1.0** | Updated: Dec 2025








