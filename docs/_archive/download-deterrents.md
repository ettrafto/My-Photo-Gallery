# Download Deterrents Implementation

**Date**: December 2025  
**Purpose**: Document the download deterrent features implemented on gallery pages

---

## Overview

This document describes the download deterrent features implemented to discourage casual downloading of gallery images. **These are deterrents only, not real security measures.** Determined users can still access images via browser developer tools or other methods.

---

## Implementation

### Components

1. **`NoDownloadImageWrapper.jsx`** - Reusable wrapper component that:
   - Prevents right-click context menu on gallery images
   - Disables drag-to-desktop functionality
   - Adds transparent overlay to block "Save image as..." via right-click
   - Maintains click interactions (lightbox still works)
   - Preserves accessibility (alt text remains on images)

2. **`CopyrightNotice.jsx`** - Copyright/licensing notice component displayed on gallery pages

### Applied To

- **AlbumPage** - All photo tiles in album grids
- **TripGallery** - All photo tiles in trip galleries
- **TripAlbumSection** - All photo tiles in trip album sections
- **Lightbox** - Images displayed in lightbox view

### Features

#### Right-Click Prevention
- Context menu is suppressed only for gallery images
- Right-click still works normally for non-gallery UI (nav, text, links, etc.)
- Scoped to gallery image containers using wrapper component

#### Drag-to-Desktop Prevention
- All gallery `<img>` elements have `draggable={false}`
- `onDragStart` events are prevented
- Implemented via wrapper component

#### Transparent Overlay
- Each gallery image is wrapped in a `position: relative` container
- Transparent overlay div with `position: absolute; inset: 0` sits on top
- Overlay blocks right-click but allows left-clicks to pass through for lightbox
- Overlay is `aria-hidden="true"` for accessibility

#### Copyright Notice
- Displays on all gallery pages (album pages, trip pages)
- Minimal, tasteful design matching site's retro monochrome aesthetic
- Text: "© Evan Trafton. Images may not be used or reproduced without permission."
- Optionally includes contact link (if Contact route exists)

---

## Important Notes

### This is a Deterrent Only

**These features do NOT provide real security:**
- Images can still be accessed via browser developer tools
- Network tab shows all image requests
- Browser extensions can bypass these restrictions
- Determined users can still download images

**Best Practices:**
- Never host original high-resolution images publicly
- Use watermarks for sensitive content if needed
- Consider server-side protection for truly sensitive images
- These deterrents are meant to discourage casual downloading only

### Design Preservation

- All existing design/layout remains intact
- Minimal visual changes (only structural wrapper)
- Grid spacing and tile sizing unchanged
- Click interactions (lightbox) still work
- Hover effects and EXIF overlays preserved

---

## Technical Details

### Wrapper Implementation

The `NoDownloadImageWrapper` uses:
- `useEffect` hooks to attach event listeners
- Context menu prevention via `onContextMenu` handler
- Drag prevention via `draggable` attribute and `dragstart` event
- Transparent overlay div for additional protection

### Click Handling

- Left-clicks bubble naturally from overlay → wrapper → parent (photo-item)
- Photo-item's `onClick` handler still fires for lightbox
- Right-clicks are prevented at the overlay level

### Accessibility

- Alt text remains on `<img>` elements
- Overlay is `aria-hidden="true"`
- No keyboard navigation is affected
- Screen readers are not impacted

---

## Maintenance

If adding new gallery components in the future:
1. Wrap gallery images with `<NoDownloadImageWrapper>`
2. Add `<CopyrightNotice />` to gallery pages
3. Test that right-click is blocked and left-click (lightbox) still works

