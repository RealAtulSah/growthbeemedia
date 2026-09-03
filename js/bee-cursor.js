/**
 * Growth Bee Media — 10 Custom Bee Cursors & Motion Engine
 * Features:
 * 1. 10 Distinct Bee Cursor States mapped to semantic page elements
 * 2. Moving Flight Effect: Smooth golden dotted flight trails with flight tilt & speed bursts
 * 3. Click Effect: Golden pollen ripple bursts & micro-squish bounce on click
 * 4. Responsive & Touch-Safe: Automatically disables on touch devices
 */

(function () {
  'use strict';

  // Check if device supports fine hover pointer (desktop/laptop)
  const isTouchDevice = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (isTouchDevice()) {
    return; // Leave touch devices completely untouched
  }

  // Cursor Asset Definitions
  const CURSOR_ASSETS = {
    'default': 'images/cursors/cursor-default-hd.png',
    'pointer': 'images/cursors/cursor-pointer-hd.png',
    'wait': 'images/cursors/cursor-wait-hd.png',
    'crosshair': 'images/cursors/cursor-crosshair-hd.png',
    'move': 'images/cursors/cursor-move-hd.png',
    'text': 'images/cursors/cursor-text-hd.png',
    'expand': 'images/cursors/cursor-expand-hd.png',
    'help': 'images/cursors/cursor-help-hd.png',
    'not-allowed': 'images/cursors/cursor-not-allowed-hd.png',
    'speed': 'images/cursors/cursor-speed-hd.png'
  };

  // Hotspots for each cursor (x, y offsets relative to image top-left)
  const HOTSPOTS = {
    'default': { x: 4, y: 4 },
    'pointer': { x: 18, y: 6 },
    'wait': { x: 22, y: 22 },
    'crosshair': { x: 22, y: 22 },
    'move': { x: 22, y: 22 },
    'text': { x: 14, y: 20 },
    'expand': { x: 22, y: 22 },
    'help': { x: 18, y: 18 },
    'not-allowed': { x: 20, y: 20 },
    'speed': { x: 34, y: 20 }
  };

  // State Variables
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let prevMouseX = mouseX;
  let prevMouseY = mouseY;
  let velocity = 0;
  let flightAngle = 0;
  let currentType = 'default';
  let isMouseDown = false;
  let isSubmitting = false;
  let isMoving = false;
  let moveTimeout = null;
  let trailPoints = [];
  const maxTrailPoints = 14;

  // DOM Elements
  let cursorContainer = null;
  let cursorBee = null;
  let trailCanvas = null;
  let trailCtx = null;

  /**
   * Initialize Cursor System
   */
  function init() {
    document.body.classList.add('has-custom-cursor');
    createCursorDOM();
    setupEventListeners();
    setupCanvas();
    requestAnimationFrame(renderLoop);
  }

  /**
   * Create Custom Cursor DOM Elements
   */
  function createCursorDOM() {
    // Flight trail canvas (full screen background layer)
    trailCanvas = document.createElement('canvas');
    trailCanvas.id = 'bee-flight-trail-canvas';
    trailCanvas.style.position = 'fixed';
    trailCanvas.style.top = '0';
    trailCanvas.style.left = '0';
    trailCanvas.style.width = '100vw';
    trailCanvas.style.height = '100vh';
    trailCanvas.style.pointerEvents = 'none';
    trailCanvas.style.zIndex = '99998';
    document.body.appendChild(trailCanvas);
    trailCtx = trailCanvas.getContext('2d');

    // Follower Container
    cursorContainer = document.createElement('div');
    cursorContainer.id = 'bee-cursor-follower';
    cursorContainer.className = 'bee-cursor-follower cursor-type-default';
    cursorContainer.setAttribute('aria-hidden', 'true');

    // Bee Graphic element
    cursorBee = document.createElement('div');
    cursorBee.className = 'bee-cursor-img-wrap';
    cursorBee.innerHTML = `<img src="${CURSOR_ASSETS['default']}" alt="" class="bee-cursor-img" id="beeCursorActiveImg">`;
    cursorContainer.appendChild(cursorBee);

    document.body.appendChild(cursorContainer);
    resizeCanvas();
  }

  /**
   * Handle Window Canvas Sizing
   */
  function setupCanvas() {
    window.addEventListener('resize', resizeCanvas, { passive: true });
  }

  function resizeCanvas() {
    if (!trailCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    trailCanvas.width = window.innerWidth * dpr;
    trailCanvas.height = window.innerHeight * dpr;
    if (trailCtx) trailCtx.scale(dpr, dpr);
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!cursorContainer.classList.contains('active')) {
        cursorContainer.classList.add('active');
      }

      // Detect movement
      isMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
      }, 100);

      // Add trail point when moving
      addTrailPoint(mouseX, mouseY);
    }, { passive: true });

    // Mouse leave / enter window
    document.addEventListener('mouseleave', () => {
      cursorContainer.classList.remove('active');
    });

    document.addEventListener('mouseenter', () => {
      cursorContainer.classList.add('active');
    });

    // Mouse Down (Click Start)
    window.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      cursorContainer.classList.add('is-clicking');
      createClickRipple(e.clientX, e.clientY);
    });

    // Mouse Up (Click Release)
    window.addEventListener('mouseup', () => {
      isMouseDown = false;
      cursorContainer.classList.remove('is-clicking');
    });

    // Mouse Over Elements — Semantic Target Detection
    document.addEventListener('mouseover', handleElementHover, { passive: true });

    // Monitor Form Submission State
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('is-submitting')) {
        setCursorType('wait');
        isSubmitting = true;
      } else if (isSubmitting) {
        isSubmitting = false;
        setCursorType('default');
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /**
   * Detect Semantic Element Hover
   */
  function handleElementHover(e) {
    if (isSubmitting) return;

    const target = e.target;
    if (!target || !(target instanceof HTMLElement)) return;

    // Explicit data-cursor attribute has highest priority
    const customCursor = target.closest('[data-cursor]')?.getAttribute('data-cursor');
    if (customCursor && CURSOR_ASSETS[customCursor]) {
      setCursorType(customCursor);
      return;
    }

    // 1. Forbidden / Not-Allowed
    if (target.closest(':disabled, [aria-disabled="true"], .disabled, .btn-disabled')) {
      setCursorType('not-allowed');
      return;
    }

    // 2. Loading / Wait
    if (target.closest('.is-loading, [aria-busy="true"], .cursor-wait')) {
      setCursorType('wait');
      return;
    }

    // 3. Text / I-Beam
    if (target.closest('input[type="text"], input[type="email"], input[type="tel"], input[type="search"], textarea, [contenteditable="true"]')) {
      setCursorType('text');
      return;
    }

    // 4. Help / FAQ / Tooltips
    if (target.closest('.faq-item, .faq-question, .help-badge, [data-tooltip], abbr, .cursor-help')) {
      setCursorType('help');
      return;
    }

    // 5. Expand / Diagonal Resize / External Links
    if (target.closest('a[target="_blank"], a[href^="tel:"], a[href*="wa.me"], .external-link, .cursor-expand')) {
      setCursorType('expand');
      return;
    }

    // 6. Move / Draggable / Carousels / Practice Cards
    if (target.closest('.practice-card, .pill-marquee, .draggable, .cursor-move, .quote-cell')) {
      setCursorType('move');
      return;
    }

    // 7. Crosshair / Target / Precision Stats & Trust Cells
    if (target.closest('.stat-cell, .trust-cell, .metric-badge, .cursor-crosshair')) {
      setCursorType('crosshair');
      return;
    }

    // 8. Speed Boost on Primary CTAs
    if (target.closest('.btn-speed, .hero-cta, .btn-primary')) {
      setCursorType('speed');
      return;
    }

    // 9. Pointer on General Clickables
    if (target.closest('a, button, [role="button"], label, .btn, .nav-link, .pill-tag, .clickable, summary')) {
      setCursorType('pointer');
      return;
    }

    // 10. Default Cursor
    setCursorType('default');
  }

  /**
   * Switch Active Cursor State
   */
  function setCursorType(type) {
    if (currentType === type || !CURSOR_ASSETS[type]) return;
    currentType = type;

    // Update image source
    const imgEl = document.getElementById('beeCursorActiveImg');
    if (imgEl) {
      imgEl.src = CURSOR_ASSETS[type];
    }

    // Update container class for custom dimensions/transforms
    cursorContainer.className = `bee-cursor-follower active cursor-type-${type}`;
    if (isMouseDown) cursorContainer.classList.add('is-clicking');
  }

  /**
   * Golden Pollen Click Ripple Effect
   */
  function createClickRipple(x, y) {
    // 1. Shockwave Ripple Ring
    const ripple = document.createElement('div');
    ripple.className = 'bee-click-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);

    // 2. Pollen Honey Sparkle Burst (5 floating golden dots)
    const particleCount = 6;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'bee-pollen-sparkle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;

      const angle = (Math.PI * 2 / particleCount) * i + (Math.random() * 0.4);
      const distance = 24 + Math.random() * 22;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);

      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 600);
    }

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Add Golden Flight Trail Dot
   */
  function addTrailPoint(x, y) {
    const hs = HOTSPOTS[currentType] || { x: 16, y: 16 };
    trailPoints.push({
      x: x + hs.x,
      y: y + hs.y,
      alpha: 1.0,
      size: currentType === 'speed' ? 3.8 : 2.5
    });

    if (trailPoints.length > maxTrailPoints) {
      trailPoints.shift();
    }
  }

  /**
   * Draw Honeybee Flight Trail on Canvas
   */
  function drawFlightTrail() {
    if (!trailCtx || trailPoints.length === 0) return;

    trailCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw dashed path between points
    if (trailPoints.length > 1) {
      trailCtx.save();
      trailCtx.beginPath();
      trailCtx.moveTo(trailPoints[0].x, trailPoints[0].y);

      for (let i = 1; i < trailPoints.length; i++) {
        const xc = (trailPoints[i].x + trailPoints[i - 1].x) / 2;
        const yc = (trailPoints[i].y + trailPoints[i - 1].y) / 2;
        trailCtx.quadraticCurveTo(trailPoints[i - 1].x, trailPoints[i - 1].y, xc, yc);
      }

      // Golden dashed honey flight line (styled like Cursor 3 & Cursor 10)
      trailCtx.setLineDash([4, 5]);
      trailCtx.lineCap = 'round';
      trailCtx.strokeStyle = currentType === 'speed' 
        ? 'rgba(243, 231, 51, 0.8)' 
        : 'rgba(243, 231, 51, 0.45)';
      trailCtx.lineWidth = currentType === 'speed' ? 2.8 : 1.8;
      trailCtx.stroke();
      trailCtx.restore();
    }

    // Draw individual fading honey dots
    for (let i = 0; i < trailPoints.length; i++) {
      const p = trailPoints[i];
      p.alpha -= 0.055;

      if (p.alpha > 0) {
        trailCtx.save();
        trailCtx.beginPath();
        trailCtx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        trailCtx.fillStyle = `rgba(243, 231, 51, ${p.alpha * 0.9})`;
        trailCtx.shadowColor = '#F3E733';
        trailCtx.shadowBlur = 6;
        trailCtx.fill();
        trailCtx.restore();
      }
    }

    trailPoints = trailPoints.filter(p => p.alpha > 0);
  }

  /**
   * Main 60 FPS Render Loop
   */
  function renderLoop() {
    // 1. Velocity & Movement Direction
    const dx = mouseX - prevMouseX;
    const dy = mouseY - prevMouseY;
    velocity = Math.sqrt(dx * dx + dy * dy);

    // Natural banking/tilt into flight direction
    if (velocity > 1.5) {
      const tilt = Math.max(-22, Math.min(22, dx * 1.2));
      flightAngle += (tilt - flightAngle) * 0.2;
    } else {
      flightAngle += (0 - flightAngle) * 0.15;
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // High velocity speed boost trigger
    if (velocity > 45 && currentType === 'default') {
      setCursorType('speed');
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        if (currentType === 'speed') setCursorType('default');
      }, 350);
    }

    // 2. Snappy Lerp Cursor Position
    cursorX += (mouseX - cursorX) * 0.85;
    cursorY += (mouseY - cursorY) * 0.85;

    // 3. Position the follower container
    if (cursorContainer) {
      cursorContainer.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    }

    // 4. Tilt and animate the bee graphic
    if (cursorBee) {
      let scale = isMouseDown ? 0.82 : 1;
      const flutter = isMoving ? Math.sin(Date.now() / 35) * 1.5 : 0;
      cursorBee.style.transform = `rotate(${flightAngle + flutter}deg) scale(${scale})`;
    }

    // 5. Draw Flight Trail
    drawFlightTrail();

    requestAnimationFrame(renderLoop);
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global controller for showcase testing
  window.GrowthBeeCursor = {
    setCursor: setCursorType,
    getCursor: () => currentType,
    types: Object.keys(CURSOR_ASSETS)
  };
})();
