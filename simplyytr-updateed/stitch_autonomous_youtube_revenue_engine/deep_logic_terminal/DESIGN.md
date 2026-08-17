---
name: Deep Logic Terminal
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#39393a'
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
  secondary: '#d5ffcb'
  on-secondary: '#003907'
  secondary-container: '#00f93f'
  on-secondary-container: '#006d16'
  tertiary: '#faf3ff'
  on-tertiary: '#37265e'
  tertiary-container: '#e1d2ff'
  on-tertiary-container: '#675590'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#72ff71'
  secondary-fixed-dim: '#00e63a'
  on-secondary-fixed: '#002203'
  on-secondary-fixed-variant: '#00530e'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#220f48'
  on-tertiary-fixed-variant: '#4e3d76'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
  surface-matte: '#0e0e0f'
  border-subtle: '#3b494b'
  data-cyan: '#00dbe9'
  data-mint: '#72ff70'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: -0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.02em
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
  margin-safe: 24px
  container-max: 1440px
---

## Brand & Style

The design system is a high-performance "Terminal" aesthetic designed for financial interfaces, developer tools, and data-intensive applications. It pivots away from retro-gaming neon into a **Professional Tech Noir** space—evoking the precision of a high-end command center. The personality is clinical, authoritative, and sophisticated.

The style is a blend of **Minimalism** and **Modern Glassmorphism**. It prioritizes information density and visual clarity over decorative flourishes. By utilizing deep matte surfaces and razor-sharp accents, the UI creates a "Heads-Up Display" (HUD) feel that is both futuristic and utilitarian. The core experience should feel like a premium tool (e.g., Linear or Vercel), where every pixel serves a functional purpose.

## Colors

The palette is optimized for long-duration focus and high-contrast readability in a dark environment.

- **Primary (Solid Cyan):** Used for critical data points, active states, and primary calls to action. It must remain sharp and solid—remove all outer glows.
- **Secondary (Mint Green):** Used for success states, healthy system metrics, and positive delta values.
- **Tertiary (Muted Lavender):** Reserved for secondary metadata or specialized categories to provide visual variety without breaking the technical tone.
- **Neutral (Deep Matte Charcoal):** The foundation is `#131314` (Surface), with `#0e0e0f` (Lowest) used for the background to create a sense of infinite depth.
- **Accents:** Use Mint and Cyan for data points exclusively. Avoid using these as large background fills; they should act as "lights" on a dark dashboard.

## Typography

The typography system distinguishes between structural hierarchy and technical data.

- **Sora** is used for headlines to maintain a modern, wide-aperture look that feels engineered.
- **Inter** handles standard body text, chosen for its neutral tone and exceptional legibility in dense layouts.
- **JetBrains Mono** is the primary font for all data, code, and labels. It must be used with generous line-height and precise letter-spacing to ensure technical readouts are digestible.
- **Hierarchy Tip:** Use `label-caps` for section headers and navigation categories to reinforce the "Terminal" feel. All numerical data should use `JetBrains Mono` to ensure tabular alignment.

## Layout & Spacing

The layout is governed by a **strict 4px baseline grid**, ensuring mathematical alignment of every component.

- **Fixed Grid Model:** Use a 12-column grid for standard content and a 24-column grid for dense dashboard views. 
- **Information Density:** Prioritize compact vertical spacing. Use gutters of 16px to separate distinct data modules.
- **Responsiveness:**
  - **Desktop (>1024px):** Fixed max-width with centered content. Sidebar-driven navigation is preferred.
  - **Tablet (600px-1024px):** Fluid columns with reduced horizontal margins.
  - **Mobile (<600px):** Single column. Use horizontal scrolling for large data tables rather than wrapping content.

## Elevation & Depth

Hierarchy is achieved through layering and transparency rather than shadows.

- **Glassmorphism:** Elements above the base layer must use a `backdrop-filter: blur(16px)` combined with a subtle fill (e.g., `surface-container` at 60% opacity). This creates a "frosted terminal" effect.
- **Subtle Borders:** Depth is defined by 1px solid borders using `outline-variant` or `surface-bright`. No glows.
- **Tonal Tiers:** Use a "Stacked Dark" approach. The further "forward" an object is, the slightly lighter its background fill becomes (from `#0e0e0f` to `#201f20`).
- **Interaction:** On hover, instead of a shadow, increase the border opacity or change the border color to `primary-color`.

## Shapes

The shape language is **Soft (0.25rem)**, providing just enough refinement to feel modern without losing the "hard" edge of a professional tool.

- **Standard Radius:** 4px for buttons, input fields, and small modules.
- **Large Radius:** 8px (rounded-lg) for main container panels and cards.
- **Sharp Accents:** Decorative elements or "tag" indicators may use 0px radius to emphasize a brutalist/technical origin where appropriate.

## Components

- **Buttons:** Use 1px borders with sharp, solid text. The primary button is solid `primary-color` with `on-primary` text (no glow). Secondary buttons are ghost-style with subtle borders.
- **Data Cards:** Use glassmorphic panels with 1px borders. Headers should be separated by a 1px horizontal line (`outline-variant`) that spans the full width of the card.
- **Input Fields:** Use a solid 1px border on all sides. On focus, the border color changes to Cyan. The cursor should be a solid block rather than a thin line.
- **Status Indicators:** Use small, solid circles of Mint (success), Cyan (active), or Red (error). Do not use pulsing animations; use static, high-contrast colors.
- **Lists:** Data lists should use alternating row fills (zebra striping) at very low opacity (2-4%) to maintain horizontal tracking across dense rows.
- **Chips:** Small, rectangular tags with `label-caps` text. Use high-contrast background/text pairings without borders for a "printed label" effect.