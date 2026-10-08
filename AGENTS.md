# Rendering rules

- Keep the arcade terrain skin in a separate client-only script loaded after the existing game scripts; this isolates visual changes from gameplay and saved state.
- Cache procedural terrain sprites and draw shoreline edges from neighboring tiles; this avoids per-frame texture generation and preserves the original terrain layout.
