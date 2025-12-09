# Images Directory

Drop your photo albums here as folders.

## Structure

```
public/images/
  ├── my-vacation/
  │   ├── _album.json (optional)
  │   ├── photo1.jpg
  │   ├── photo2.jpg
  │   └── photo3.jpg
  └── another-album/
      ├── _album.json (optional)
      └── photos...
```

## Album Metadata

Create an optional `_album.json` file in each album folder:

```json
{
  "title": "My Vacation 2025",
  "description": "Summer trip to Iceland",
  "tags": ["travel", "landscape"],
  "date": "2025-07-15",
  "cover": "photo2.jpg"
}
```

## Workflow

1. Add images to album folders
2. Run `npm run scan`
3. Run `npm run dev` to preview
4. Run `npm run build` to build for production

## Supported Formats

- .jpg / .jpeg
- .png
- .webp
- .avif

EXIF metadata will be automatically extracted and preserved.




