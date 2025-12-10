# 📍 Album Location Inference Guide

This project supports **album location inference** to provide fallback GPS coordinates for photos that don't have GPS EXIF metadata.

## How It Works

The map generation system uses a two-tier GPS resolution strategy:

### GPS Resolution Priority

1. **EXIF GPS Data** (accuracy: `"exif"`)
   - If a photo has GPS coordinates in its EXIF metadata, use them
   - This is the most accurate location data

2. **Album Default Location** (accuracy: `"album-default"`)
   - If no EXIF GPS data exists, use the album's approximate location
   - Configured manually in `content/album-locations.json`

3. **Skip Photo**
   - If neither EXIF GPS nor album location exists, skip the photo from the map

## Setup

### 1. Initialize Album Locations Config

Generate the configuration file for all your albums:

```bash
npm run init-locations
```

This creates/updates `content/album-locations.json` with placeholder entries for each album.

### 2. Add Coordinates

Edit `content/album-locations.json` and add coordinates for albums without GPS EXIF data:

```json
{
  "yosemite-2024": {
    "albumSlug": "yosemite-2024",
    "albumTitle": "Yosemite 2024",
    "defaultLocation": {
      "lat": 37.8651,
      "lng": -119.5383,
      "accuracy": "album-default"
    }
  }
}
```

**Tips for finding coordinates:**
- Use Google Maps: Right-click → "What's here?"
- Choose a central or representative location for the album
- Keep existing filled-in coordinates when re-running `init-locations`

### 3. Generate Map Index

Run the scan to generate/update the map with location inference:

```bash
npm run scan
```

The console will show:
- How many photos used EXIF GPS
- How many used album default locations
- How many were skipped

## File Structure

```
content/
├── album-locations.json    # Manual location config (you edit this)
├── albums.json             # Auto-generated album index
├── map.json                # Auto-generated map index
└── albums/
    ├── album-1.json        # Individual album data
    └── album-2.json
```

## Example Output

After running `npm run scan`, you'll see:

```
📍 Building map index with location fallbacks...

✅ Generated map.json with 430 geotagged photo(s):
   0 from EXIF GPS
   430 from album default location
   0 photo(s) skipped (no GPS, no album location)
```

## Map Data Format

Each photo in `content/map.json` includes an accuracy field:

```json
{
  "photos": [
    {
      "albumSlug": "yosemite-2024",
      "albumTitle": "Yosemite 2024",
      "filename": "IMG_001.jpg",
      "path": "images/yosemite-2024/IMG_001.jpg",
      "lat": 37.8651,
      "lng": -119.5383,
      "accuracy": "album-default",
      "dateTaken": "2024-06-15",
      "tags": ["landscape", "travel"]
    }
  ]
}
```

## Workflow

1. **Add new albums** → photos go in `public/images/album-name/`
2. **Run** `npm run init-locations` → adds new albums to config
3. **Edit** `content/album-locations.json` → add coordinates
4. **Run** `npm run scan` → generates map with location inference
5. **View** map at `/map` → see all photos plotted

## Notes

- The `init-locations` script preserves existing coordinates when re-run
- Albums without coordinates will have their photos skipped from the map
- You can mix EXIF GPS and album defaults in the same project
- The `accuracy` field lets you distinguish between precise and approximate locations

