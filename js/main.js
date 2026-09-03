/**
 * Growth Bee Media — Main JavaScript
 * Handles mobile navigation, dynamic contact handlers, and AJAX form submissions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initActiveNavLink();
  initContactForm();
});

/**
 * Mobile Navigation Drawer & Hamburger Toggle
 */
function initMobileNav() {
  const toggleBtn = document.getElementById('navToggleBtn');
  const drawer = document.getElementById('mobileNavDrawer');

  if (!toggleBtn || !drawer) return;

  const openIcon = toggleBtn.querySelector('.icon-hamburger');
  const closeIcon = toggleBtn.querySelector('.icon-close');

  function toggleMenu(forceClose = false) {
    const isOpen = forceClose ? false : !drawer.classList.contains('open');
    
    if (isOpen) {
      drawer.classList.add('open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      if (openIcon) openIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      if (openIcon) openIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking a link inside drawer
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(true);
    });
  });

  // Close when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggleMenu(true);
    }
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && drawer.classList.contains('open')) {
      toggleMenu(true);
    }
  });
}

/**
 * Automatically highlight the current active link in navigation
 */
function initActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-links a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/**
 * Contact Form AJAX Submission with Inline Feedback
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const successAlert = document.getElementById('formSuccessAlert');
  const errorAlert = document.getElementById('formErrorAlert');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset previous alerts
    if (successAlert) successAlert.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'none';

    // Basic client validation
    const nameInput = form.querySelector('[name="name"]');
    const contactInput = form.querySelector('[name="contact"]');
    const messageInput = form.querySelector('[name="message"]');

    if (!nameInput?.value.trim() || !contactInput?.value.trim() || !messageInput?.value.trim()) {
      alert('Please fill in all three fields before submitting.');
      return;
    }

    // Set button loading state & body cursor state
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
    }
    document.body.classList.add('is-submitting');

    const formData = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        // Success
        form.reset();
        if (successAlert) {
          successAlert.style.display = 'flex';
          successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        // Response error
        throw new Error('Form submission returned non-200');
      }
    } catch (err) {
      console.warn('Form submission encountered an error:', err);
      if (errorAlert) {
        errorAlert.style.display = 'flex';
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } finally {
      document.body.classList.remove('is-submitting');
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    }
  });
}
