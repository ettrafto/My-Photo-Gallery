# Hero Component Documentation

## Overview

The `Hero` component is a full-width hero section that blends the visual styles of:
- **Hero #1**: Data-Driven Photographer (clean typography, data-focused design)
- **Hero #6**: Dynamic Depth Grid (floating images with depth effects)

## Features

✨ **Visual Design**
- Full-width hero section with black background
- Extremely subtle animated grid (1-2% drift)
- Clean, modern typography with tracking
- Floating diagonal image cluster

🖼️ **Image Display**
- 5 featured images in organic floating layout
- Maintains original orientation (portrait/landscape/square)
- Z-depth hover effect (~12px lift)
- Ambient shadow that tightens on hover
- Rounded corners (16px)
- Staggered fade-in animations (150ms intervals)

🖤 **Retro EXIF Overlays**
- Black bar slides up from bottom on hover
- White monospace text (70-80% opacity)
- Subtle grain effect for retro feel
- Format: `IMG_9439.JPG — 55mm • f/7.1 • 1/400s • ISO 100`
- Consistent with existing album hover style

📝 **Typography**
- Large sans-serif headline with 8% letter spacing
- Monospace subheadline
- Fade + upward drift entrance animation

📱 **Responsive**
- Desktop: Side-by-side text and image cluster
- Tablet: Stacked layout
- Mobile: Vertical staggered column
- Touch support for EXIF overlays
- Slowed animation on mobile for energy efficiency

♿ **Accessibility**
- Proper semantic HTML
- Alt text support for images
- Respects `prefers-reduced-motion`
- Keyboard-accessible hover states

## Installation

The component is already integrated into the project. It uses:
- React + Framer Motion (already installed)
- Tailwind CSS classes (optional, uses custom CSS)
- CSS custom properties from `index.css`

## Basic Usage

```jsx
import Hero from '../components/Hero';

function App() {
  return <Hero />;
}
```

## Usage with Default Props

```jsx
import Hero from '../components/Hero';

export default function Home() {
  return (
    <>
      <Hero />
      {/* Rest of your page content */}
    </>
  );
}
```

## Custom Props Example

```jsx
import Hero from '../components/Hero';

const customImages = [
  {
    url: '/images/custom/photo1.jpg',
    exif: 'IMG_1001.JPG — 24mm • f/2.8 • 1/500s • ISO 200',
    alt: 'Mountain sunset',
    orientation: 'portrait'
  },
  {
    url: '/images/custom/photo2.jpg',
    exif: 'IMG_1002.JPG — 50mm • f/4.0 • 1/250s • ISO 100',
    alt: 'Ocean waves',
    orientation: 'landscape'
  },
  {
    url: '/images/custom/photo3.jpg',
    exif: 'IMG_1003.JPG — 35mm • f/5.6 • 1/320s • ISO 400',
    alt: 'City skyline',
    orientation: 'square'
  },
  {
    url: '/images/custom/photo4.jpg',
    exif: 'IMG_1004.JPG — 85mm • f/1.8 • 1/1000s • ISO 200',
    alt: 'Portrait',
    orientation: 'portrait'
  },
  {
    url: '/images/custom/photo5.jpg',
    exif: 'IMG_1005.JPG — 24mm • f/8.0 • 1/125s • ISO 100',
    alt: 'Desert landscape',
    orientation: 'landscape'
  }
];

export default function CustomHero() {
  return (
    <Hero
      images={customImages}
      headline="Your Custom Headline"
      subheadline="Your Subheadline"
    />
  );
}
```

## Props API

### `images`
- **Type**: `Array<ImageObject>`
- **Default**: Default 5 hero images from `/hero/` directory
- **Required**: No
- **Description**: Array of exactly 5 image objects

#### ImageObject Shape:
```typescript
{
  url: string,           // Image path or URL
  exif: string,          // EXIF text (e.g., "IMG_9439.JPG — 55mm • f/7.1 • 1/400s • ISO 100")
  alt: string,           // Alt text for accessibility
  orientation: 'portrait' | 'landscape' | 'square'  // Image orientation
}
```

### `headline`
- **Type**: `string`
- **Default**: `"Capturing Light Across Time"`
- **Required**: No
- **Description**: Main hero headline (large, tracked text)

### `subheadline`
- **Type**: `string`
- **Default**: `"Photography by Evan Trafton"`
- **Required**: No
- **Description**: Hero subheadline (monospace, subtle)

## Image Setup

1. **Location**: Place hero images in `/public/hero/`
2. **Naming**: Any naming convention works (referenced in `images` prop)
3. **Formats**: JPG, PNG, WebP supported
4. **Sizes**: Optimized for web (1200-2000px wide recommended)
5. **Orientations**: Mix of portrait, landscape, and square for best visual effect

## Styling Customization

### Modify Grid Animation
```css
/* In Hero.css */
.hero-grid-background {
  background-size: 80px 80px; /* Larger grid */
  animation-duration: 45s;    /* Faster animation */
}
```

### Modify Hover Lift Distance
```jsx
/* In Hero.jsx, modify whileHover prop */
whileHover={{ 
  y: -20,  /* Increase from -12 to -20 */
  transition: { duration: 0.3, ease: 'easeOut' }
}}
```

### Modify EXIF Overlay Style
```css
/* In Hero.css */
.hero-exif-overlay {
  background: rgba(0, 0, 0, 0.95); /* Darker background */
  color: rgba(255, 255, 255, 0.90); /* Brighter text */
}
```

## Animation Details

### Entrance Animations
- **Text**: Fade + upward drift (800ms duration)
- **Image 1**: Fade in at 0ms
- **Image 2**: Fade in at 150ms
- **Image 3**: Fade in at 300ms
- **Image 4**: Fade in at 450ms
- **Image 5**: Fade in at 600ms

### Hover Animations
- **Image lift**: 12px upward, 300ms ease-out
- **Shadow**: Tightens and intensifies
- **EXIF**: Slides up 250ms ease

### Background Animation
- **Grid drift**: 60s continuous loop (90s on mobile)
- **Movement**: 1-2% subtle drift

## Responsive Breakpoints

- **Desktop**: `> 1024px` - Side-by-side layout
- **Tablet**: `768px - 1024px` - Stacked, centered
- **Mobile**: `< 768px` - Vertical column, simplified
- **Small Mobile**: `< 480px` - Compact spacing

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Supports `prefers-reduced-motion`
- ✅ Graceful degradation for older browsers

## Performance Optimizations

1. **Lazy loading**: Images use `loading="lazy"`
2. **GPU acceleration**: Transforms use `translateY` and `translateZ`
3. **Reduced motion**: Animation disabled when user prefers
4. **Mobile optimization**: Slower animation on mobile to save battery

## Accessibility

- Semantic HTML (`<section>`, `<h1>`, `<p>`)
- Alt text for all images
- ARIA hidden for decorative grid
- Keyboard navigation support (Framer Motion)
- Respects user motion preferences

## Integration with Existing Project

The Hero component is now integrated into the Home page:

```jsx
// src/pages/Home.jsx
import Hero from '../components/Hero';
import AlbumGrid from '../components/AlbumGrid';

export default function Home() {
  return (
    <>
      <Hero />
      <main className="page-shell">
        <AlbumGrid />
      </main>
    </>
  );
}
```

## Files Created

```
src/components/
├── Hero.jsx         # Main component
└── Hero.css         # Styles

public/
└── hero/            # Hero images directory
    ├── hero-1.JPG
    ├── hero-2.JPG
    ├── hero-3.JPG
    ├── hero-4.JPG
    └── hero-5.JPG
```

## Design Notes

### Typography
- **Headline**: System sans-serif, ultra-wide tracking (8%)
- **Subheadline**: IBM Plex Mono, subtle tracking (5%)
- **EXIF**: Monospace, uppercase, 0.68rem

### Colors
- **Background**: Pure black (`#000000`)
- **Grid**: White at 1.5% opacity
- **Text**: White at 95% opacity (headline), 60% (subheadline)
- **EXIF**: White at 75% opacity on black 92% background

### Spacing
- **Desktop padding**: 4rem horizontal
- **Mobile padding**: 1.5rem horizontal
- **Image gap**: 1rem (desktop), 1.5rem (mobile)

## Troubleshooting

### Images not appearing
- Check that images exist in `/public/hero/`
- Verify image paths in the `images` prop
- Ensure dev server has restarted after adding images

### EXIF not showing on hover
- Verify CSS is imported correctly
- Check browser console for errors
- Test on desktop (mobile requires tap)

### Animation stuttering
- Check GPU acceleration is enabled in browser
- Verify Framer Motion is installed
- Test with `prefers-reduced-motion` disabled

### Layout issues on mobile
- Clear browser cache
- Check responsive breakpoints in Hero.css
- Verify viewport meta tag in index.html

## Future Enhancements

Potential improvements for future iterations:
- [ ] Parallax scroll effect on images
- [ ] Video support in image cluster
- [ ] Real-time EXIF data extraction
- [ ] Multiple layout presets
- [ ] Theme variants (light mode)
- [ ] Intersection Observer for entrance animations
- [ ] WebP/AVIF format support with fallbacks

---

**Created**: December 2025  
**Version**: 1.0.0  
**Dependencies**: React 19, Framer Motion 12, CSS Grid











