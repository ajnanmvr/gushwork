// ================= STICKY HEADER =================
function handleStickyHeader() {
  const header = document.querySelector(".header");
  const stickyProductBar = document.querySelector(".sticky-product-bar");
  if (!header) return;

  const root = document.documentElement;
  let lastScrollY = window.scrollY;
  let isTicking = false;

  const setHeaderHeight = () => {
    root.style.setProperty("--header-height", `${header.offsetHeight}px`);

    if (stickyProductBar) {
      root.style.setProperty(
        "--sticky-strip-height",
        `${stickyProductBar.offsetHeight}px`
      );
    }
  };

  const updateStickyState = (scrollY) => {
    const threshold = window.innerHeight;
    const isBeyondFirstFold = scrollY > threshold;
    const isScrollingDown = scrollY > lastScrollY + 2;
    const isScrollingUp = scrollY < lastScrollY - 2;

    if (!isBeyondFirstFold) {
      document.body.classList.remove("has-sticky-header");
      document.body.classList.remove("has-sticky-strip");
      header.classList.remove("sticky-active", "sticky-visible", "sticky-hidden");
      lastScrollY = scrollY;
      return;
    }

    document.body.classList.add("has-sticky-header");
    header.classList.add("sticky-active");

    if (isScrollingDown) {
      header.classList.add("sticky-visible");
      header.classList.remove("sticky-hidden");
      document.body.classList.add("has-sticky-strip");
    } else if (isScrollingUp) {
      header.classList.add("sticky-hidden");
      header.classList.remove("sticky-visible");
      document.body.classList.remove("has-sticky-strip");
    } else if (
      !header.classList.contains("sticky-visible") &&
      !header.classList.contains("sticky-hidden")
    ) {
      header.classList.add("sticky-visible");
      document.body.classList.add("has-sticky-strip");
    }

    lastScrollY = scrollY;
  };

  const onScroll = () => {
    if (isTicking) return;

    isTicking = true;
    window.requestAnimationFrame(() => {
      updateStickyState(window.scrollY);
      isTicking = false;
    });
  };

  setHeaderHeight();
  updateStickyState(window.scrollY);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    setHeaderHeight();
    updateStickyState(window.scrollY);
  });
}

// ================= CAROUSEL =================
function initCarousel() {}

// ================= IMAGE ZOOM =================
function handleImageZoom() {}

// ================= FAQ TOGGLE =================
function handleFAQ() {
  const faqItems = document.querySelectorAll(".faq-item");
  
  faqItems.forEach((item) => {
    const header = item.querySelector(".faq-header");
    const toggle = item.querySelector(".faq-toggle");
    
    if (!header || !toggle) return;

    const handleToggle = () => {
      const isExpanded = item.classList.contains("faq-item-expanded");
      
      // Close all other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("faq-item-expanded")) {
          otherItem.classList.remove("faq-item-expanded");
          const btn = otherItem.querySelector(".faq-toggle");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });

      // Toggle current item
      item.classList.toggle("faq-item-expanded");
      toggle.setAttribute("aria-expanded", !isExpanded);
    };

    header.addEventListener("click", handleToggle);
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      handleToggle();
    });
  });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  handleStickyHeader();
  initCarousel();
  handleImageZoom();
  handleFAQ();
});