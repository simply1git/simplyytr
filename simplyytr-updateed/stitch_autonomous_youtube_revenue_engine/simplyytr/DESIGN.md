---
name: simplyytr
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#ddffd3'
  on-tertiary: '#003907'
  tertiary-container: '#00fb40'
  on-tertiary-container: '#006e16'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#72ff70'
  tertiary-fixed-dim: '#00e639'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#00530e'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1440px
---

## Brand & Style
The design system embodies a **Cyber-Tech Noir** aesthetic, tailored for an automated, self-improving AI entity. The personality is efficient, cold, and profoundly capable. It targets a technical audience—developers, researchers, and system architects—who value raw data density and terminal-like precision.

The style is a synthesis of **System-Core** and **Glassmorphism**. It utilizes deep obsidian voids, high-frequency neon accents, and structural grid overlays to simulate a living motherboard. The UI should evoke the feeling of peering directly into the "mind" of the machine: modular, transparent, and perpetually in flux. Visuals emphasize the $0 budget, open-source nature through the use of system-standard monospaced fonts and raw, functional geometries, avoiding unnecessary skeuomorphic flourish in favor of digital-first artifacts.

## Colors
The palette is rooted in a "Pure Black" ethos to maximize contrast and power efficiency on OLED displays.

- **Primary (Electric Cyan):** Used for interactive states, primary actions, and "active" AI processes. It represents the flow of data.
- **Secondary (Neon Purple):** Reserved for elevated system status, encryption, or background depth.
- **Tertiary (Terminal Green):** Used exclusively for success states, logs, and "healthy" system metrics.
- **Neutral (Obsidian):** The foundation of the UI. Backgrounds are `#000000` or `#0A0A0B` to allow the glowing accents to pop.
- **Surface:** Surfaces use low-opacity washes of primary/secondary colors (2-8% opacity) to create the glassmorphic layering effect.

## Typography
Typography creates a hierarchy between "Human Interface" and "Machine Logic."

- **Headlines:** Use **Sora** for a wide, high-tech geometric feel. High weight (700+) is preferred to cut through background noise.
- **Body:** **Inter** provides maximum legibility for long-form documentation and system descriptions.
- **Data/Labels:** **JetBrains Mono** is used for all technical readouts, timestamps, and metadata. This reinforces the "System-Core" narrative.
- **Styling:** Use `label-caps` for all secondary navigation and small headers to maintain a technical, cataloged appearance.

## Layout & Spacing
The layout follows a strict **4px baseline grid**, ensuring all elements align with mathematical precision. 

- **Grid System:** Use a 12-column fluid grid for desktop. For data-dense views, utilize a 24-column grid to allow for modular "widgets" of varying widths.
- **Grid Pattern:** A subtle background mesh (1px lines every 32px at 5% opacity) should be visible in the background to emphasize the "System" feel.
- **Breakpoints:** 
  - Mobile: < 600px (single column, full width).
  - Tablet: 600px - 1024px (adaptive columns).
  - Desktop: > 1024px (fixed max-width for content).

## Elevation & Depth
In this design system, depth is achieved through **luminance and translucency** rather than physical shadows.

- **Tonal Layers:** Level 0 is pure black. Level 1 (containers) is slightly lighter `#121214`.
- **Glassmorphism:** All modal or overlay elements must use a `backdrop-filter: blur(12px)` and a semi-transparent border (1px, 15% opacity white/cyan) to simulate glass panels.
- **Glow Effects:** Critical elements (active buttons, status indicators) use a soft outer glow (`box-shadow: 0 0 15px rgba(0, 240, 255, 0.3)`) instead of traditional drop shadows.
- **Interaction:** On hover, elements should increase in border-opacity and glow intensity, simulating a "powering up" effect.

## Shapes
Shapes are **sharp and modular**. High-radius rounding is avoided to prevent the UI from appearing too "consumer-friendly" or soft.

- **Standard Elements:** Use `rounded-sm` (0.25rem) for buttons, inputs, and cards.
- **Accents:** Use 45-degree chamfered edges (clipped corners) on decorative elements or headers to reinforce the "Cyber-Tech" aesthetic.
- **Borders:** Every container should have a 1px border. Use variable opacity for borders to create hierarchy (Primary actions = 40% opacity; Secondary = 10% opacity).

## Components
- **Buttons:** Ghost-style by default with 1px Electric Cyan borders. Primary buttons use a "solid-glow" fill where the background is a dark cyan and the text is bright white/cyan.
- **Chips:** Monospaced text inside a subtle `#7000FF` (purple) low-opacity pill. Use for tags or metadata.
- **Inputs:** Terminal-style. Underline-only or 4-sided thin borders with a blinking block cursor (`|`) to simulate a command-line interface.
- **Cards:** Glassmorphic panels with a 1px border. Headers should be separated by a 1px horizontal rule.
- **Progress/Data Visualization:** Use "strobe" animations for loading. Bar charts and graphs should use the Neon Cyan and Terminal Green palette with no gradients, only solid fills or patterns.
- **System Logs:** A dedicated component for scrolling text in `code-sm`, appearing in the bottom-right or a dedicated sidebar, showing real-time AI background tasks.