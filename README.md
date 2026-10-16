# Timeless

Cinematic lyric-scroll site built with Vite, GSAP, Lenis, and vanilla JavaScript.

```bash
npm install
npm run dev
```

Deploy the project root to Vercel with the build command `npm run build`. The repository includes `data/lyrics.json`, so the site works without any runtime API request. The prebuild step attempts to refresh that file from the configured LyricsAPI endpoint, but keeps the committed version if the API is unavailable.

The defaults fetch `Timeless` by The Weeknd from YouTube. Override them with `LYRICS_TITLE`, `LYRICS_ARTIST`, and `LYRICS_PLATFORM` when running the build.
