# Font Files

Place your aBCFavorit font files in this directory.

## Required Files

You need the following font files in WOFF2 format:

- `ABCFavorit-Regular.woff2` (weight 400)
- `ABCFavorit-Medium.woff2` (weight 500)
- `ABCFavorit-Bold.woff2` (weight 700)

## Where to Get Fonts

If you don't have the WOFF2 files, you can convert your existing font files using:
- https://cloudconvert.com/woff-to-woff2
- https://transfonter.org/

## Alternative Formats

If you only have .woff, .ttf, or .otf files, you can update the font paths in:
`/Users/manoj/Desktop/joblisting/frontend/src/app/layout.tsx`

For example, if you have .woff files:
```typescript
const abcFavorit = localFont({
  src: [
    {
      path: '../../public/fonts/ABCFavorit-Regular.woff',  // Change extension
      weight: '400',
      style: 'normal',
    },
    // ... other weights
  ],
  variable: '--font-abc-favorit',
})
```

## Fallback Fonts

The font configuration includes fallbacks:
- ui-sans-serif
- system-ui
- sans-serif
- Apple Color Emoji
- Segoe UI Emoji
- Segoe UI Symbol
- Noto Color Emoji

These will be used if aBCFavorit fails to load.
