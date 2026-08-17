---
name: Terminal Core Final
colors:
  surface: '#0d1515'
  surface-dim: '#0d1515'
  surface-bright: '#333b3b'
  surface-container-lowest: '#080f10'
  surface-container-low: '#151d1e'
  surface-container: '#192122'
  surface-container-high: '#232b2c'
  surface-container-highest: '#2e3637'
  on-surface: '#dce4e5'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dce4e5'
  inverse-on-surface: '#2a3233'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#c8c6c7'
  on-secondary: '#313031'
  secondary-container: '#49494a'
  on-secondary-container: '#bab8b9'
  tertiary: '#fff5de'
  on-tertiary: '#3b2f00'
  tertiary-container: '#fed639'
  on-tertiary-container: '#715d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e5e2e3'
  secondary-fixed-dim: '#c8c6c7'
  on-secondary-fixed: '#1c1b1c'
  on-secondary-fixed-variant: '#474647'
  tertiary-fixed: '#ffe179'
  tertiary-fixed-dim: '#eac324'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#0d1515'
  on-background: '#dce4e5'
  surface-variant: '#2e3637'
  glow-cyan: '#00f0ff'
  alert-orange: '#ff8c00'
  terminal-green: '#00fb40'
  obsidian-deep: '#0e0e0f'
  system-red: '#ffb4ab'
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
    letterSpacing: 0.15em
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
  margin-safe: 32px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system moves into its "Final Deployment" state, shifting from a development-phase Cyber-Noir to a high-fidelity, mission-critical **System-Core** aesthetic. The personality is authoritative, immutable, and optimized for peak performance. It targets technical operators who require absolute clarity during high-stakes deployments.

The visual style is a fusion of **Minimalism** and **Tactile-Digital**. It utilizes a "Darkroom" philosophy—deep obsidian backgrounds paired with high-luminance status indicators. The interface mimics a hardened command center, prioritizing functional density and visual evidence of system integrity. Design decisions are driven by the "Finalization" narrative: everything is polished, verified, and locked into its terminal state.

## Colors
The palette is optimized for maximum contrast in low-light environments, using light as the primary communicator of state.

- **Primary (Glow-Cyan):** The lifeblood of the system. Used for active states, focus indicators, and high-priority interactions. It represents an energized, operational status.
- **Secondary (Obsidian Deep):** Used for structural grounding. Backgrounds should remain `#0e0e0f` to ensure "Pure Black" OLED efficiency.
- **Tertiary (Terminal-Green):** The "Success" signature. Used for finalized deployments, healthy metrics, and verified logs.
- **Alert-Orange:** Reserved strictly for "Warning" and "Finalization Pending" states. It cuts through the cyan/black palette to demand immediate operator attention.
- **Functional Neutrals:** Use low-opacity tints of Cyan (4-12%) for surface layering to maintain the glassmorphic depth without introducing new hues.

## Typography
Typography creates a stark contrast between "Interface Guidance" and "System Logic."

- **Sora** handles the "Human Interface" layer. Use it for bold headlines that define the spatial hierarchy.
- **Inter** is the "Narrative" layer, providing neutral, highly legible body text for documentation.
- **JetBrains Mono** is the "Machine Core" layer. It is used for all technical readouts, labels, and state indicators.
- **Label Caps:** Always rendered in uppercase with increased letter spacing. Use these for category headers, metadata keys, and non-interactive status tags to reinforce the cataloged system look.

## Layout & Spacing
The layout follows a rigid **4px mathematical grid**. All components must snap to this baseline to maintain the "Finalized" precision of the system.

- **Grid Model:** A 12-column fluid grid is used for standard views. For high-density data dashboards, transition to a 24-column micro-grid.
- **Modular Sections:** Content should be grouped into distinct, bordered "Modules." Avoid loose elements; every piece of data must belong to a structural container.
- **Responsive Behavior:** 
  - **Desktop (1024px+):** Multi-pane layout with fixed sidebars for system logs.
  - **Tablet (600px-1023px):** Collapsible sidebars, transitioning to a vertical stack of modules.
  - **Mobile (<600px):** Single column. Spacing units are halved (`stack-lg` becomes 16px) to maximize data density on small screens.

## Elevation & Depth
Depth is signaled through **chromatic intensity and edge treatment** rather than traditional drop shadows.

- **Tonal Tiers:** Level 0 is the background. Level 1 (Surface) uses a 1px border of `outline-variant` with a 2% Cyan fill. Level 2 (Active/Hover) increases border opacity and adds a subtle Glow-Cyan inner stroke.
- **State-Based Glow:** Elements in an "Active" or "Success" state emit a soft outer glow (`box-shadow: 0 0 12px currentColor`) with 0.25 opacity. This simulates a hardware LED indicator.
- **Glassmorphism:** Use `backdrop-filter: blur(16px)` on any floating overlays (modals/tooltips). The "glass" should be tinted with the `surface-container` color at 80% opacity to maintain text legibility against complex data backgrounds.

## Shapes
The shape language is **industrial and disciplined**. Large radii are forbidden as they detract from the "System-Core" precision.

- **Base Geometry:** Use `rounded-sm` (0.25rem) for all standard interactive components (buttons, inputs).
- **Hard Edges:** 0px radius is preferred for large structural containers and layout-dividing lines to emphasize the grid.
- **Terminal Accents:** Use 45-degree corner clips (chamfers) on the top-right corner of header modules and primary action buttons to evoke military-spec hardware aesthetics.

## Components
- **Buttons:** 
  - *Active:* Solid Glow-Cyan background with `#00363a` text. 
  - *Default:* 1px Cyan border, ghost background, text in Glow-Cyan.
  - *Warning:* Solid Alert-Orange background for destructive finalization actions.
- **Status Chips:** Small, monospaced text blocks. Use `Terminal-Green` for "Verified," `Alert-Orange` for "Pending," and `Glow-Cyan` for "Processing."
- **Input Fields:** Styled as terminal prompts. A subtle bottom border with a block-style blinking cursor. Focused states should highlight the entire module border in Glow-Cyan.
- **System Logs:** A persistent, auto-scrolling area using `code-sm`. New entries should "pulse" in Terminal-Green before settling into the default text color.
- **Cards/Modules:** 1px bordered containers. Headers must include a `label-caps` title and a horizontal separator line that extends to the container edges.
- **Progress Indicators:** Use segmented bars (stepped progress) rather than smooth gradients to simulate vintage hardware readouts.