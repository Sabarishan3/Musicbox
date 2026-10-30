---
name: Pixel Wave Arcade Audio
colors:
  surface: '#11131a'
  surface-dim: '#11131a'
  surface-bright: '#373941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b22'
  surface-container: '#1d1f26'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#bacbb6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#859581'
  outline-variant: '#3c4b3a'
  surface-tint: '#00e556'
  primary: '#f2ffed'
  on-primary: '#00390f'
  primary-container: '#39ff6a'
  on-primary-container: '#007226'
  inverse-primary: '#006e25'
  secondary: '#73dcff'
  on-secondary: '#003543'
  secondary-container: '#00c3ed'
  on-secondary-container: '#004c5e'
  tertiary: '#fffafa'
  on-tertiary: '#650030'
  tertiary-container: '#ffd4de'
  on-tertiary-container: '#bd1462'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6cff80'
  primary-fixed-dim: '#00e556'
  on-primary-fixed: '#002106'
  on-primary-fixed-variant: '#00531a'
  secondary-fixed: '#b6ebff'
  secondary-fixed-dim: '#48d6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#ffd9e1'
  tertiary-fixed-dim: '#ffb1c6'
  on-tertiary-fixed: '#3f001c'
  on-tertiary-fixed-variant: '#8e0047'
  background: '#11131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Press Start 2P
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0px
  headline-lg:
    fontFamily: Press Start 2P
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0px
  headline-md:
    fontFamily: Press Start 2P
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0px
  headline-sm:
    fontFamily: Press Start 2P
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0px
  title-md:
    fontFamily: Press Start 2P
    fontSize: 9px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0px
  body-lg:
    fontFamily: VT323
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.5px
  body-md:
    fontFamily: VT323
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.5px
  body-sm:
    fontFamily: VT323
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0px
  label-lg:
    fontFamily: Press Start 2P
    fontSize: 9px
    fontWeight: '400'
    lineHeight: 12px
    letterSpacing: 0px
  label-md:
    fontFamily: Press Start 2P
    fontSize: 8px
    fontWeight: '400'
    lineHeight: 10px
    letterSpacing: 0px
  label-sm:
    fontFamily: Press Start 2P
    fontSize: 7px
    fontWeight: '400'
    lineHeight: 8px
    letterSpacing: 0px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system channels late-80s arcade cabinets, vintage handheld game consoles, and underground chiptune culture into a modern streaming audio player interface. It merges functional mobile music ergonomics with raw, unapologetic 8-bit aesthetics: strict raster grids, stepped pixel borders, vibrant high-voltage phosphors, and tactile arcade hardware metaphors.

### Visual Principles
- **Strictly Quantized Geometry:** Modern smooth vector curves and Gaussian blurs are strictly rejected. Everything snaps to crisp pixels, hard angles, and orthogonal stepped borders.
- **CRT & Phosphor Luminescence:** Deep cathode-tube blacks provide infinite contrast for burning neon phosphor emitters (toxic green, hot synth pink, electric cyan).
- **Arcade Physicality:** Interactive targets mimic micro-switched arcade pushbuttons, DIP switches, LED segment readouts, and coin-op cabinetry bevels rather than floating paper layers.
- **Dithered Texture & Scanlines:** Surfaces embrace horizontal cathode scanlines and 1-bit pixel dithering to produce tactile depth without relying on modern alpha blurs.

## Colors

The palette simulates high-intensity phosphor emissions against a pitch-black, vacuum-sealed cathode tube face.

### Palette Architecture
- **Base Canvas (`#05070D`):** Near-black deep navy. Acts as the zero-signal CRT background across all surfaces.
- **Surface Elevation 1 (`#0D1224`):** Recessed deck and container backing.
- **Surface Elevation 2 (`#141C38`):** Elevated pixel cards and interactive housings.
- **Primary Phosphor (`#39FF6A`):** Toxic Arcade Green. Reserved for active playback, primary action buttons, volume peaks, and system-critical statuses.
- **Secondary Phosphor (`#33D4FF`):** Arcade Cyan. Used for glowing inner focus frames, active track metadata, loop/shuffle indicators, and navigational markers.
- **Tertiary Phosphor (`#FF4F93`):** Hot Pink / Magenta. Applied to favorite states, heart toggles, live stream indicators, and genre badges.
- **Accent Blue (`#4AA8FF`):** Electric blue for secondary audio metrics, scrubber thumbs, and ancillary playlist badges.
- **Cabinet Purples (`#8A2BE2` & `#59168B`):** Deep cabinet chassis trims and outer double-stroke component boundaries.
- **Text Tiers:**
  - `Text Phosphor`: `#39FF6A` (Headings and high-emphasis labels)
  - `Text Bright`: `#FFFFFF` (Primary song titles and core timestamps)
  - `Text Medium`: `#A6B5D9` (Artist names, album titles, and body content)
  - `Text Dim`: `#4F5D85` (Inactive icons, secondary metrics, and disabled triggers)

## Typography

The type system is strictly dual-engine retro, eliminating anti-aliased sans-serif conventions.

### Font Engine Hierarchy
1. **Press Start 2P:** Used exclusively for display headers, micro-labels, screen prompts, badge copy, and arcade status readouts. It is dense and wide; copy must remain short, punchy, and frequently converted to uppercase (`ALL CAPS`).
2. **VT323:** Used for continuous scanning text—song titles in dense lists, artist discographies, lyrics engines, metadata tracks, and real-time counter timestamps. It offers rapid terminal legibility at natural readable sizes.

### Display Rules
- All text renders with crisp font smoothing: `image-rendering: pixelated; text-rendering: geometricPrecision;`.
- Avoid non-pixel font scaling; strictly adhere to integer multiples when adjusting display sizing.

## Layout & Spacing

Layout geometry strictly locks to a 4px/8px base pixel grid. Components must align to crisp edge coordinates to prevent anti-aliasing artifacts on high-DPI mobile viewports.

### Grid & Ergonomics
- **Mobile First Focus (360px - 430px canvas):** A compact 4-column layout model with 16px (`1rem`) outer margins and 12px (`0.75rem`) gutters.
- **Chunky Touch Geometry:** Interactive targets (play, skip, coin-in, shuffle) must maintain a minimum physical hit envelope of 48px × 48px, even when the inner visual pixel icon is rendered at 16px × 16px.
- **Stepped Bottom Navigation:** Sticky fixed bottom transport deck (Now Playing bar / Arcade dock) anchored at 72px base height with 2px hard top border framing.

## Elevation & Depth

Modern blur-based dropshadows are forbidden. Elevation is engineered using hard, un-blurred pixel offsets, stepped box borders, and phosphor glow simulations.

### Depth Mechanics
- **Level 0 (CRT Substrate):** `#05070D` canvas overlaid with an SVG/CSS micro-scanline pattern (1px transparent line alternating with 1px `#000000` at 35% opacity).
- **Level 1 (Recessed Well):** Inset borders using `box-shadow: inset 2px 2px 0px #000000, inset -2px -2px 0px #1E2749`.
- **Level 2 (Cabinet Bordering):** Primary cards and panels utilize a dual-step pixel border:
  - Outer border: 2px solid `#59168B` (Cabinet Chassis).
  - Inner outline: 2px solid `#33D4FF` (Phosphor Neon Frame).
- **Level 3 (Hard Drop Offset / Pressed States):**
  - Resting Interactive Element: `box-shadow: 4px 4px 0px 0px #000000`.
  - Active / Pressed Element: `transform: translate(2px, 2px); box-shadow: 2px 2px 0px 0px #000000;`.
- **Phosphor Bloom (Non-Blur):** Simulates high voltage using hard, multi-tiered 1px/2px stepped non-diffuse shadows (e.g., `box-shadow: 0 0 0 2px #39FF6A, 0 0 0 4px #1A6630`).

## Shapes

The roundedness token is set to `0` (Sharp).

### Geometry Constraints
- **Zero Border-Radius:** `border-radius: 0px` globally across every button, card, modal, album artwork container, input field, and slider thumb.
- **Stepped Pixel Corners (Optional Chamfer):** For arcade badges and flagship display plates, pseudo-corner cutouts are achieved strictly via stepped CSS clip-paths or transparent corner pixel ticks (2px × 2px diagonal cut).
- **No Curves:** Progress indicators, scrubber bars, and level meters must be constructed of discrete, stepped blocks rather than smooth continuous rounded bars.

## Components

### Buttons
- **Primary Play / Action:** Background `#39FF6A` with horizontal 2px repeating scanline overlay (`repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)`). Text rendered in `#05070D` using `Press Start 2P`. 2px solid `#FFFFFF` outer highlight, offset shadow `4px 4px 0px #000000`.
- **Secondary (Transport, Shuffle, Queue):** Background `#0D1224`, 2px solid `#33D4FF`, text `#33D4FF`. Hover/Touch fills background with `#141C38`.
- **Destructive / Arcade Eject:** 2px solid `#FF4F93`, text `#FF4F93`. Active state flashes inverted (`#FF4F93` fill with `#05070D` text).

### Album Artwork & Display Cards
- **Pixelated Art Housing:** Album art displayed without rounded corners. Wrapped in a double-layer border: 2px `#8A2BE2` outer, 2px `#33D4FF` inner with a 2px gap `#05070D`. Optional retro 16-bit downsample rendering filter.
- **Audio Cards:** Container with `#0D1224` background, bordered with 2px solid `#1E2749`. Selected or playing card swaps border to 2px solid `#39FF6A` with an animated pulsing 2px outer cyan glow ring.

### Audio Track Lists
- **Row Architecture:** 56px height, alternating subtle rows (`#05070D` and `#090D1A`).
- **Left Slot:** 24px width for track number (`01`, `02`) in `Press Start 2P` font (`#4F5D85`). Active playing track displays an animated 3-bar stepped pixel graphic equalizer in `#39FF6A`.
- **Center Slot:** Song Title in `VT323` (20px, `#FFFFFF`), subtitle artist name in `VT323` (15px, `#A6B5D9`).
- **Right Slot:** Duration timestamp (`03:42`) in `VT323` (18px, `#33D4FF`).

### Audio Scrubber & Equalizer
- **Track Progress:** Height 12px, segmented into 4px pixel chunks. Filled progress displays solid `#39FF6A`; empty background is `#141C38` with 1px dotted pattern.
- **Scrubber Thumb:** 16px × 16px solid square, color `#FFFFFF` with 2px solid border `#05070D`.
- **Spectrum Analyzer:** Segmented vertical VU-meter bars (Green from 0%–70%, Cyan from 71%–85%, Pink from 86%–100%).

### Chips & Badges
- **Arcade Category Chips:** Height 24px, 2px solid `#59168B`, text in `Press Start 2P` 8px. Selected chip swaps to `#FF4F93` background with `#05070D` black typography.

### Checkboxes & Radio Controls
- **Pixel Checkbox:** 16px × 16px square, `#05070D` background, 2px solid `#33D4FF`. Checked state renders an unmistakable 8-bit cross-mark or centered 6px × 6px square in `#39FF6A`.
- **Arcade Radio:** 16px × 16px sharp diamond shape (rotated 45deg) with solid interior pixel block when active.

### Inputs & Search Bars
- **Terminal Prompt Search:** Background `#0D1224`, 2px solid `#33D4FF`. Placeholder text displays `SEARCH_TRACKS_` with a blinking rectangular 2Hz block cursor (`#39FF6A`). Input text renders in `VT323` (20px, `#39FF6A`).