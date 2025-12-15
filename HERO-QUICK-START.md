# Hero Component - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Basic Import & Use
```jsx
import Hero from '../components/Hero';

// Use with defaults
<Hero />
```

### 2. Custom Text
```jsx
<Hero 
  headline="Your Headline Here"
  subheadline="Your Subheadline"
/>
```

### 3. Custom Images
```jsx
const myImages = [
  { url: '/path/to/image1.jpg', exif: 'IMG_001.JPG — 24mm • f/2.8 • 1/500s • ISO 200', alt: 'Description', orientation: 'portrait' },
  { url: '/path/to/image2.jpg', exif: 'IMG_002.JPG — 50mm • f/4.0 • 1/250s • ISO 100', alt: 'Description', orientation: 'landscape' },
  { url: '/path/to/image3.jpg', exif: 'IMG_003.JPG — 35mm • f/5.6 • 1/320s • ISO 400', alt: 'Description', orientation: 'square' },
  { url: '/path/to/image4.jpg', exif: 'IMG_004.JPG — 85mm • f/1.8 • 1/1000s • ISO 200', alt: 'Description', orientation: 'portrait' },
  { url: '/path/to/image5.jpg', exif: 'IMG_005.JPG — 24mm • f/8.0 • 1/125s • ISO 100', alt: 'Description', orientation: 'landscape' }
];

<Hero images={myImages} />
```

---

## ⚙️ Quick Customizations

### Change Grid Animation Speed
**File**: `src/components/Hero.css`
```css
/* Line 18 - Faster animation */
.hero-grid-background {
  animation: gridDrift 30s linear infinite; /* Change from 60s */
}
```

### Change Grid Opacity
```css
/* Lines 13-14 - More visible grid */
background-image: 
  linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), /* Change from 0.015 */
  linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
```

### Change Hover Lift Distance
**File**: `src/components/Hero.jsx`
```jsx
/* Line 47 - Higher lift */
whileHover={{ 
  y: -20, // Change from -12
  transition: { duration: 0.3, ease: 'easeOut' }
}}
```

### Change Border Radius
**File**: `src/components/Hero.css`
```css
/* Line 71 - Sharper corners */
.hero-image-wrapper {
  border-radius: 8px; /* Change from 16px */
}
```

### Change EXIF Bar Color
```css
/* Line 155 - Lighter bar */
.hero-exif-overlay {
  background: rgba(0, 0, 0, 0.85); /* Change from 0.92 */
}
```

### Disable Grid Animation
```css
/* Line 18 */
.hero-grid-background {
  animation: none; /* Remove gridDrift animation */
}
```

---

## 📏 Image Orientation Guide

When providing custom images:

| Orientation | Aspect Ratio | Example Use |
|-------------|--------------|-------------|
| `portrait` | 3:4 or taller | People, buildings, tall landscapes |
| `landscape` | 4:3 or wider | Horizons, wide vistas, panoramas |
| `square` | 1:1 | Instagram-style, balanced compositions |

**Note**: You must provide exactly 5 images in this order:
1. Portrait (primary, largest)
2. Landscape
3. Square
4. Portrait
5. Landscape

---

## 🎨 Common Style Tweaks

### Make Headline Smaller
```css
/* Hero.css - Line 51 */
.hero-headline {
  font-size: clamp(2rem, 5vw, 4rem); /* Change from clamp(2.5rem, 6vw, 5rem) */
}
```

### Reduce Letter Spacing
```css
/* Hero.css - Line 54 */
.hero-headline {
  letter-spacing: 0.04em; /* Change from 0.08em */
}
```

### Change Hero Height
```css
/* Hero.css - Line 9 */
.hero {
  min-height: 80vh; /* Change from 100vh */
}
```

### Adjust Image Cluster Size
```css
/* Hero.css - Line 92 */
.hero-images {
  height: 700px; /* Change from 600px */
}
```

---

## 🐛 Troubleshooting

### Images not showing?
1. Check paths: `/public/hero/` → `/hero/` in URLs
2. Verify images exist: `ls public/hero/`
3. Restart dev server

### EXIF not appearing on hover?
1. Desktop: Hover should work automatically
2. Mobile: Tap once to show, tap again to hide
3. Check CSS is imported in Hero.jsx

### Animation stuttering?
1. Enable GPU acceleration in browser
2. Check `prefers-reduced-motion` setting
3. Update Framer Motion: `npm update framer-motion`

### Layout broken on mobile?
1. Clear browser cache
2. Check viewport meta tag in index.html
3. Test responsive breakpoints in DevTools

---

## 📱 Responsive Behavior

| Screen Size | Layout | Notes |
|-------------|--------|-------|
| Desktop (>1024px) | Side-by-side | Text left, images right |
| Tablet (768-1024px) | Stacked | Centered, full width |
| Mobile (<768px) | Vertical | Simplified spacing |
| Small (<480px) | Compact | Smaller text, reduced padding |

---

## 🎯 Performance Tips

1. **Optimize Images**
   - Use WebP format
   - Resize to ~1200-1600px wide
   - Compress with tools like ImageOptim

2. **Reduce Animation**
   - On mobile, animation is automatically slower
   - Disable completely for `prefers-reduced-motion`

3. **Lazy Loading**
   - Already enabled with `loading="lazy"`
   - Images load as user scrolls

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `src/components/Hero.jsx` | Main component code |
| `src/components/Hero.css` | All styling & animations |
| `public/hero/*` | Image assets |
| `src/pages/Home.jsx` | Integration example |

---

## 💡 Pro Tips

### Tip 1: Match Your Brand Colors
```css
/* Change background gradient for subtle color */
.hero {
  background: linear-gradient(180deg, #000000 0%, #0a0a0a 100%);
}
```

### Tip 2: Add CTA Button
```jsx
<Hero />
<div style={{ textAlign: 'center', marginTop: '-5rem', position: 'relative', zIndex: 10 }}>
  <button className="cta-button">Explore Gallery</button>
</div>
```

### Tip 3: Video Background
Replace grid with video:
```jsx
<video className="hero-video-background" autoPlay loop muted>
  <source src="/video/background.mp4" type="video/mp4" />
</video>
```

### Tip 4: Multiple Hero Variants
Create variants for different pages:
```jsx
// About page
<Hero 
  headline="About the Photographer"
  subheadline="Capturing moments since 2020"
  images={aboutImages}
/>

// Contact page  
<Hero 
  headline="Let's Work Together"
  subheadline="Get in touch"
  images={contactImages}
/>
```

---

## 📚 Full Documentation

For complete details, see:
- **HERO-COMPONENT.md** - Full documentation & API reference
- **HERO-DELIVERABLES.md** - Complete feature list & specs

---

**Quick Start Version**: 1.0.0  
**Last Updated**: December 10, 2025








