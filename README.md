# WRGSMK Webflow Integration Guide

## Module Integration Order

To properly integrate all WRGSMK modules in your Webflow project, add the following script tags in this exact order:

### 1. Required External Libraries (in <head>)
```html
<!-- GSAP Core -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollSmoother.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/CustomEase.min.js"></script>
```

### 2. WRGSMK Module Scripts (before closing </body> tag)
```html
<!-- Core Framework (MUST be first) -->
<script src="[PATH]/wrgsmk-core.js"></script>

<!-- Feature Modules (order doesn't matter) -->
<script src="[PATH]/wrgsmk-preloader.js"></script>
<script src="[PATH]/wrgsmk-horizontal-scroll.js"></script>
<script src="[PATH]/wrgsmk-img-grid.js"></script>
<script src="[PATH]/wrgsmk-fancy-vert.js"></script>
<script src="[PATH]/wrgsmk-mouse-follower.js"></script>
```

## Mouse Follower HTML Structure

For the mouse follower module to work, add this HTML structure to your Webflow elements:

```html
<!-- Add this class to your masonry image links -->
<a href="#" class="masonry--image--link" data-page-name="Project Name">
  <!-- Your image content -->
  
  <!-- Add the mouse follower element -->
  <div class="mouse-follower">
    <!-- Text will be dynamically set from data-page-name -->
  </div>
</a>


## Automatic Initialization

All modules are now automatically initialized when `WRGSMK_INIT()` is called. No manual initialization needed for individual modules.

## Data Attributes

The mouse follower module supports these data attributes:

- `data-page-name` - Primary text source
- `data-link-text` - Fallback text source  
- If neither is provided, it uses the link's text content
- Final fallback: "View Project"