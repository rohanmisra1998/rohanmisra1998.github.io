# DM Sans OG text paths

`DMSans-VariableFont_opsz,wght.ttf` is the DM Sans variable font from the
[Google Fonts DM Sans source](https://github.com/google/fonts/tree/main/ofl/dmsans),
downloaded from the pinned source URL below on 2026-08-18:

`https://github.com/google/fonts/raw/main/ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf`

It is licensed under the SIL Open Font License 1.1; the complete license is
included in `OFL-1.1.txt`.

`dm-sans-og-paths.json.gz` is a committed, losslessly gzipped JSON subset of
the DM Sans glyph outlines for the two social-card strings. The asset pipeline
decompresses these paths into SVG `<path>` elements, so the social-card build
does not read a host font or depend on librsvg font fallback.
