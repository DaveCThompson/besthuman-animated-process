# Readme: Animated SVG Process Diagram

This document provides a comprehensive technical specification for the interactive SVG process diagram component. It details the solutions for achieving perfectly concentric rotation, implementing an intuitive "tracer" animation, managing state, and styling complex interactive elements. This document should be the first point of reference for any future development or maintenance.

## 1. Project Overview

This component is a stateful, interactive process diagram built with HTML, CSS, and JavaScript. The core of the component is an SVG graphic that is dynamically styled and animated using the GreenSock Animation Platform (GSAP), including the `MotionPathPlugin`.

-   **Interactivity:** Users can click on one of five stages (or their corresponding nodes) to view detailed information. The central hub can be hovered to trigger a playful "convergence" animation.
-   **State Management:** A central JavaScript object tracks the `activeIndex` and animation status (`isAnimating`) to ensure smooth, predictable user interactions.
-   **Visual Feedback:** The active stage is clearly highlighted with brand colors, borders, and high-contrast text. Unselected nodes provide clear hover feedback by changing their background, border, and icon colors.
-   **Process Flow Animation:** When transitioning between states, a "tracer dot" animates along the central ring from the previous node to the current one. Upon its arrival, the new node activates, and the tracer path gracefully fades, providing a clean and intuitive visual flow.
-   **Ambient Animation:** The outermost ring rotates continuously, and the central hub "breathes" with a subtle pulse, giving the diagram a dynamic and engaging feel.

## 2. Core Features & Animations

### 2.1. The "Tracer" Process Flow Animation

To visually connect the stages, a refined "tracer" animation is triggered when the user clicks a new node. This provides an intuitive guide showing the progression from one step to the next.

-   **Technology:** GSAP `MotionPathPlugin`.
-   **SVG Structure:**
    -   A series of invisible `<path>` elements (`.inter-node-path`) are defined in the SVG, tracing the arc between each of the five nodes. Each path has `data-from` and `data-to` attributes to identify its start and end points.
    -   A small `<circle>` element (`#tracer-dot`) serves as the visual tracer.
-   **Animation Logic (`script.js`):**
    1.  When a state change is initiated, the script immediately deactivates the previously active node's styles.
    2.  A master GSAP timeline orchestrates the entire sequence to ensure perfect timing:
        -   The correct `.inter-node-path` is made visible, and its `strokeDashoffset` is animated from its full length to 0, making the path appear to "draw" itself.
        -   Simultaneously, the `#tracer-dot` element's position is animated along that exact path using `MotionPathPlugin`.
    3.  **The Hand-off:** The moment the tracer animation completes, the target node's active styles (the inner ring node's color and the connecting line's gradient) are applied instantly.
    4.  The temporary tracer path then gracefully fades out, completing the transition.
-   **Critical Bug Fix:** An issue where the line animation would only play once was resolved. The root cause was GSAP leaving a persistent `opacity: 0` inline style on the path after its fade-out animation. The fix involves using `gsap.set()` to explicitly reset the path's opacity to `1` before every new animation, ensuring it is always visible when needed.

### 2.2. Interactive States & Feedback Effects

To make the diagram feel responsive and alive, several subtle effects are employed:

-   **Hover State:** Hovering over an unselected outer node group (`.outer-node-group`) provides clear feedback:
    -   The background rectangle changes to a subtle hover color (`--primary-hover`).
    -   The 1px border changes from grey to the brand's accent color.
    -   The icon path changes from grey to the brand's accent color.
-   **Active State:** The active node is styled distinctively and does *not* show hover effects:
    -   The outer rectangle fills with the brand's accent color and has a matching border.
    -   The text becomes white for high contrast.
    -   The icon path fills with the brand accent color.
    -   The connecting line from the inner ring to the outer node transitions from grey to a brand-colored gradient.
    -   The corresponding inner ring node fills with the brand accent color.
-   **Central Hub "Breathe":** The main hub (`#central-hub`) has a slow, continuous `sine.inOut` scale animation, giving the entire component a calm, ambient motion.

### 2.3. Central Hub Interactivity: The "Node Convergence"

When the user hovers over the central hub, a playful, logical animation is triggered to show the interconnectedness of the system.

-   **Animation:**
    1.  The continuous rotation of the outermost ring accelerates to 3x its normal speed.
    2.  Simultaneously, all five outer node groups gently pull inwards toward the center by a few pixels with a satisfying elastic ease.
-   **On Mouse Out:** The effects smoothly reverse, returning the diagram to its ambient state.
-   **Technical Solution:**
    -   **Preserving Concentricity:** To avoid breaking the perfect rotation, the speed-up effect is achieved by animating the `timeScale` property of the master rotation tween in GSAP. This is a robust method that does not interfere with the SVG `transform` attribute.
    -   **Dynamic Positioning:** On initialization, the script pre-calculates the precise vector for each outer node required to move it directly towards the diagram's center. These values are stored and used by GSAP to ensure the "pull" is geometrically accurate for every node.

## 3. Critical Challenge: Non-Concentric Rotation (Drift/Wobble)

The most critical technical challenge was ensuring the continuous rotation of the outer dashed ring (`.Dial_ring_outmost`) was perfectly concentric. Initial CSS-based approaches resulted in a noticeable "wobble" where the ring would drift off-center during its rotation.

### Root Cause Analysis

The drift is caused by browser rounding errors when translating the SVG's internal `viewBox` coordinate system to the browser's pixel-based CSS coordinate system. A CSS `transform-origin` calculation is often imprecise at a sub-pixel level, and this tiny error, when accumulated over a 360-degree rotation, creates a visible wobble that undermines the design's precision.

## 4. The Definitive Solution: The SVG Group Transform Method

To solve this, a method was implemented that is immune to browser rendering errors because it operates **entirely within the SVG's native, mathematically pure coordinate system.** This is a two-part solution that must be maintained.

### Part 1: SVG Structure for a Reliable Origin

The rotating circle is wrapped in a parent group (`<g>`) element. This structure is non-negotiable for maintaining smooth rotation.

-   The **group (`<g class="rotating-group">`)** is permanently moved to the SVG's true center using an SVG `transform` attribute: `transform="translate(110 146)"`.
-   The **circle (`<circle class="Dial_ring_outmost">`)** inside this group is then drawn at the group's local origin: `cx="0" cy="0"`.

This creates a new, reliable coordinate system where `(0,0)` is the exact center of rotation.

**Code Snippet (`index.html`):**
```xml
<!-- The group establishes the true center of rotation -->
<g class="rotating-group" transform="translate(110 146)">
  <!-- The circle is drawn at the group's origin, ensuring a perfect rotational axis -->
  <circle cx="0" cy="0" r="107.5" ... class="Dial_ring_outmost"/>
</g>