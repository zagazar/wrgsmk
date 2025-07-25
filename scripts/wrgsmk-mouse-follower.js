/**
 * WRGSMK Mouse Follower Module
 * Creates mouse-following hover effects for masonry image links with dynamic text
 */

window.WRGSMK_MOUSE_FOLLOWER = {
  
  SELECTORS: {
    CONTAINER: '.masonry--image--link',
    FOLLOWER: '.mouse-follower'
  },

  CONFIG: {
    POSITION_DURATION: 0.3,
    POSITION_EASE: "power2",
    SCALE_EASE: "power1.inOut"
  },

  state: {
    activeElements: []
  },

  setupMouseFollower: function(container) {
    const follower = container.querySelector(this.SELECTORS.FOLLOWER);
    
    if (!follower) return;

    // Get text from data attribute or link text
    const linkText = container.getAttribute('data-page-name') || 
                    container.getAttribute('data-link-text') ||
                    container.textContent.trim() ||
                    'View Project';

    // Set the follower text
    follower.textContent = linkText;

    // Initial setup: center follower and make it invisible
    gsap.set(follower, {
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      opacity: 1
    });

    // Create smooth position animations
    const xTo = gsap.quickTo(follower, "x", { 
      duration: this.CONFIG.POSITION_DURATION, 
      ease: this.CONFIG.POSITION_EASE 
    });
    const yTo = gsap.quickTo(follower, "y", { 
      duration: this.CONFIG.POSITION_DURATION, 
      ease: this.CONFIG.POSITION_EASE 
    });

    // Create scale animation (paused by default)
    const scaleTween = gsap.to(follower, {
      scale: 1,
      ease: this.CONFIG.SCALE_EASE,
      paused: true
    });

    // Mouse event handlers
    const handleMouseEnter = () => scaleTween.play();
    const handleMouseLeave = () => scaleTween.reverse();
    const handleMouseMove = (e) => {
      xTo(e.offsetX);
      yTo(e.offsetY);
    };

    // Add event listeners
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("mousemove", handleMouseMove);

    // Store element data for cleanup
    this.state.activeElements.push({
      container,
      follower,
      scaleTween,
      handlers: {
        mouseenter: handleMouseEnter,
        mouseleave: handleMouseLeave,
        mousemove: handleMouseMove
      }
    });
  },

  init: function() {
    const containers = gsap.utils.toArray(this.SELECTORS.CONTAINER);
    
    if (containers.length === 0) return;

    containers.forEach(container => {
      this.setupMouseFollower(container);
    });
  },

  destroy: function() {
    this.state.activeElements.forEach(({ container, scaleTween, handlers }) => {
      // Remove event listeners
      container.removeEventListener("mouseenter", handlers.mouseenter);
      container.removeEventListener("mouseleave", handlers.mouseleave);
      container.removeEventListener("mousemove", handlers.mousemove);
      
      // Kill GSAP animations
      if (scaleTween) {
        scaleTween.kill();
      }
    });

    this.state.activeElements = [];
  }
};