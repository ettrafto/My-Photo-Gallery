# Image Performance Audit
**Date**: December 10, 2025  
**Purpose**: Document current image loading practices and identify optimization opportunities

---

## Executive Summary

The photo portfolio currently uses **basic lazy loading** (`loading="lazy"` attribute) but lacks:
- Advanced lazy loading with IntersectionObserver
- Responsive image support (srcSet/sizes)
- Blur-up placeholders for perceived performance
- Dimension hints to prevent layout shift (partially implemented)
- Shared image component for consistency

**Primary bottleneck**: Large images loaded directly from `/public/images/` without multiple sizes or progressive loading.

---

## Image Usage by Component

### 1. **AlbumPage.jsx** (High Priority - Heaviest)
**Location**: `src/components/AlbumPage.jsx` lines 92-96  
**Usage**: Album photo grids (10-100+ photos per page)

```jsx
<img
  src={photoUrl}
  alt={photo.exif?.description || photo.filename}
  loading="lazy"
/>
```

**Current State**:
- ✅ Native `loading="lazy"` present
- ✅ Aspect ratio preserved via `aspectRatio` CSS (line 88)
- ❌ No `decoding="async"`
- ❌ No srcSet or multiple sizes
- ❌ No blur-up placeholder
- ❌ No IntersectionObserver for better control
- ❌ Images loaded at full resolution regardless of viewport

**Issues**:
- All images in album (20-100+) rendered immediately to DOM
- Native lazy loading has limited viewport threshold
- Large JPGs (2-5MB) loaded even in small grid cells
- No progressive loading experience

**Impact**: HIGH - This is the primary performance bottleneck

---

### 2. **AlbumCard.jsx** (Medium Priority)
**Location**: `src/components/AlbumCard.jsx` lines 42-46, 53-57  
**Usage**: Album cover images and hover collage (3-4 images per card)

```jsx
// Cover image
<img 
  src={coverUrl}
  alt={album.title}
  loading="lazy"
/>

// Collage images (3x on hover)
<img 
  src={`${import.meta.env.BASE_URL}${photo.path}`}
  alt=""
  loading="lazy"
/>
```

**Current State**:
- ✅ Native `loading="lazy"` present
- ✅ Aspect ratio set via CSS (line 40)
- ❌ No `decoding="async"`
- ❌ Hover collage loads 3 extra images on mouseover
- ❌ No preloading hint for hover images
- ❌ No srcSet

**Issues**:
- Hover collage creates sudden network spike
- No size optimization for thumbnail context

**Impact**: MEDIUM - Many cards on home page

---

### 3. **TripGallery.jsx** (High Priority)
**Location**: `src/components/TripGallery.jsx` lines 94-99  
**Usage**: Trip photo grids organized by album

```jsx
<img
  src={photoUrl}
  alt={photo.filename}
  className="trip-gallery-image"
  loading="lazy"
/>
```

**Current State**:
- ✅ Native `loading="lazy"` present
- ✅ Aspect ratio via CSS (3:2) in line 71
- ❌ No `decoding="async"`
- ❌ No srcSet
- ❌ No placeholder

**Issues**:
- Similar to AlbumPage - many full-resolution images
- Trip pages can have 50-200+ photos

**Impact**: HIGH - Heavy trip detail pages

---

### 4. **TripDetail.jsx** (Medium Priority)
**Location**: `src/pages/TripDetail.jsx` lines 500-505, 549  
**Usage**: Destination photos and misc images

```jsx
// Destination photos
<img
  src={photoUrl}
  alt={photo.filename}
  className="destination-photo-image"
  loading="lazy"
/>

// Misc images
<img src={`${import.meta.env.BASE_URL}${img.src}`} alt={img.caption || ''} />
```

**Current State**:
- ✅ Native `loading="lazy"` on destination photos
- ❌ **Missing** `loading="lazy"` on misc images (line 549)
- ❌ No `decoding="async"`
- ❌ No srcSet

**Issues**:
- Misc images have NO lazy loading attribute
- Inconsistent lazy loading implementation

**Impact**: MEDIUM

---

### 5. **Lightbox.jsx** (Low Priority)
**Location**: `src/components/Lightbox.jsx` lines 48-52  
**Usage**: Full-size photo viewer (single image at a time)

```jsx
<img
  src={`${import.meta.env.BASE_URL}${currentPhoto.path}`}
  alt={currentPhoto.exif?.description || currentPhoto.filename}
  className="lightbox-image"
/>
```

**Current State**:
- ❌ **No** `loading="lazy"` (intentional - should load immediately)
- ❌ No `decoding="async"`
- ❌ Could benefit from preloading next/previous images

**Issues**:
- No preload strategy for adjacent images
- User navigates sequentially but each image loads on demand

**Impact**: LOW - Single image context, but could be smoother

---

### 6. **TripHighlightsCarousel.jsx** (Medium Priority)
**Location**: `src/components/TripHighlightsCarousel.jsx` lines 112-114  
**Usage**: Carousel highlight images

```jsx
<img src={`${import.meta.env.BASE_URL}${highlight.image}`} alt={highlight.title} />
```

**Current State**:
- ❌ **Missing** `loading="lazy"`
- ❌ No `decoding="async"`
- ❌ All carousel images load immediately

**Issues**:
- 5-10 carousel images all load at once
- Could lazy load off-screen slides

**Impact**: MEDIUM

---

### 7. **TripMedia.jsx** (Low Priority)
**Location**: `src/components/TripMedia.jsx` lines 20, 62, 89  
**Usage**: Supplemental trip media (maps, artifacts, collages)

```jsx
// Map images
<img src={`${baseUrl}${item.src}`} alt={item.caption || 'Route map'} />

// Artifact images
<img src={`${baseUrl}${item.src}`} alt={item.caption || 'Artifact'} />

// Collages
<img src={`${baseUrl}${item.src}`} alt={item.caption || 'Photo collage'} />
```

**Current State**:
- ❌ **Missing** `loading="lazy"` on all media types
- ❌ No `decoding="async"`

**Issues**:
- All media loads immediately
- Usually only 2-5 items but can be large

**Impact**: LOW - Few items per page

---

### 8. **TripCard.jsx** (Medium Priority)
**Location**: `src/components/TripCard.jsx` lines 66-71  
**Usage**: Trip cover images on trips listing

```jsx
<img 
  src={coverImageUrl} 
  alt={trip.title} 
  className="trip-card-image"
  loading="lazy"
/>
```

**Current State**:
- ✅ Native `loading="lazy"` present
- ❌ No `decoding="async"`
- ❌ No srcSet
- ❌ Has loading state but no skeleton/placeholder

**Issues**:
- No visual feedback during loading beyond text
- No size optimization

**Impact**: MEDIUM - Multiple cards on trips page

---

### 9. **Hero.jsx** (Low Priority)
**Location**: `src/components/Hero.jsx` lines 51-56  
**Usage**: Hero section feature images (5 images)

```jsx
<img 
  src={image.url} 
  alt={image.alt}
  className="hero-image"
  loading="lazy"
/>
```

**Current State**:
- ✅ Native `loading="lazy"` present
- ❌ No `decoding="async"`
- ❌ No srcSet (but probably not needed - hero images should be visible)

**Issues**:
- Hero images SHOULD load eagerly (above fold)
- Using `loading="lazy"` might delay initial paint

**Impact**: LOW - Should probably remove lazy loading

---

## Data Model Analysis

### Current Photo Object Structure
Based on `map.json` and album JSON files:

```typescript
{
  "filename": "IMG_9281.JPG",
  "path": "images/Death Valley/IMG_9281.JPG",
  "width": 6000,
  "height": 4000,
  "aspectRatio": 1.5,
  "lat": 36.5323,
  "lng": -116.9325,
  "dateTaken": "2025-10-15T14:23:00",
  "exif": {
    "camera": "Canon EOS R5",
    "lens": "RF 24-105mm F4",
    "focalLength": "24mm",
    "aperture": "f/8.0",
    "shutterSpeed": "1/250s",
    "iso": 100
  }
}
```

**Available for optimization**:
- ✅ `width` and `height` present
- ✅ `aspectRatio` present (prevents layout shift)
- ❌ No multiple sizes (small/medium/large)
- ❌ No thumbnail URLs
- ❌ No placeholder/blur-hash data

**Opportunities**:
- Can use `width` and `height` to set img dimensions
- Can calculate optimal sizes based on aspect ratio
- Could add `pathSmall`, `pathMedium`, `pathLarge` in future

---

## CSS Layout Analysis

### Grid Layouts
**AlbumPage** (lines 69-76):
- CSS Grid with dynamic columns: `repeat(${imagesAcross}, 1fr)`
- Masonry mode uses CSS `column-count`
- ✅ Good: CSS-based, not JS-heavy
- ✅ Good: Aspect ratios prevent shift

**TripGallery** (line 63-67):
- CSS Grid: `repeat(auto-fill, minmax(250px, 1fr))`
- Fixed 3:2 aspect ratio
- ✅ Good: CSS-based, performant

### Re-render Analysis
- Photo grids use `photo.filename` as key (line 83) ✅ GOOD - stable keys
- No unnecessary re-renders detected
- Layout calculations are CSS-based ✅ GOOD

**Verdict**: Layout code is already well-optimized. No major changes needed.

---

## Performance Issues Summary

### Critical Issues (Must Fix)
1. **No responsive images** - All photos load at full resolution (2-6MB)
2. **Limited lazy loading** - Native lazy loading is basic
3. **Missing lazy loading** - Several components missing the attribute
4. **No placeholders** - Blank space until image loads
5. **No async decoding** - Blocks main thread

### Medium Issues (Should Fix)
6. **Inconsistent implementation** - Every component implements images differently
7. **Hover collage spike** - AlbumCard loads 3 images suddenly
8. **No preloading** - Lightbox doesn't preload adjacent images

### Minor Issues (Nice to Have)
9. **Hero images lazy loaded** - Should be eager
10. **No blur-up effect** - Could improve perceived performance

---

## Optimization Opportunities

### Phase 1: Quick Wins (No data changes)
- ✅ Add `decoding="async"` everywhere
- ✅ Add missing `loading="lazy"` attributes
- ✅ Create shared `<Photo>` component
- ✅ Implement IntersectionObserver lazy loading
- ✅ Add dimension hints where missing
- ✅ Preload lightbox adjacent images

### Phase 2: With Minimal Data Changes
- ✅ Implement client-side responsive images with URL manipulation
- ✅ Add blur-up placeholders using CSS filters
- ✅ Add skeleton loaders during loading

### Phase 3: Future (Requires Image Generation)
- ⏳ Generate multiple image sizes (small/medium/large)
- ⏳ Generate thumbnail images (100-200px)
- ⏳ Generate blur-hash data for placeholders
- ⏳ Convert to WebP/AVIF formats
- ⏳ Implement CDN with on-demand resizing

---

## Estimated Performance Gains

### Initial Load (Homepage with 20 album cards)
- **Current**: ~15-30MB, 2-4s load time
- **After optimization**: ~2-5MB, 0.5-1s load time
- **Improvement**: **70-80% reduction** in data transfer

### Album Page (50 photos)
- **Current**: ~100-200MB, 5-10s load time, laggy scrolling
- **After optimization**: ~10-20MB initially, smooth scrolling
- **Improvement**: **90% reduction** in initial load, ~5x faster perceived performance

### Scroll Performance
- **Current**: Janky on albums with 50+ photos
- **After optimization**: Smooth with IntersectionObserver control
- **Improvement**: Significant improvement in responsiveness

---

## Next Steps

1. ✅ **Create shared Photo component** (Step 2)
2. ✅ **Implement LazyImage wrapper** (Step 3)
3. ✅ **Add blur-up support** (Step 4)
4. ✅ **Implement responsive images** (Step 5)
5. ✅ **Optimize remaining issues** (Step 6)
6. ✅ **Document everything** (Step 7)

---

## Files to Modify

### Components to Replace Image Usage
- `src/components/AlbumPage.jsx` (HIGH PRIORITY)
- `src/components/AlbumCard.jsx`
- `src/components/TripGallery.jsx` (HIGH PRIORITY)
- `src/pages/TripDetail.jsx`
- `src/components/Lightbox.jsx`
- `src/components/TripHighlightsCarousel.jsx`
- `src/components/TripMedia.jsx`
- `src/components/TripCard.jsx`
- `src/components/Hero.jsx`

### New Files to Create
- `src/components/Photo.jsx` - Shared photo component
- `src/components/LazyImage.jsx` - IntersectionObserver wrapper
- `src/hooks/useImagePreload.js` - Preload hook for lightbox
- `src/utils/imageUtils.js` - Helper functions for responsive images
- `docs/image-optimization-guide.md` - Usage documentation

---

**End of Audit**



