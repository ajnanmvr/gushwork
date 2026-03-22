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
function initCarousel() {
  const carousel = document.querySelector(".applications-carousel");
  const track = document.querySelector(".applications-track");
  const prevBtn = document.querySelector(".app-control-prev");
  const nextBtn = document.querySelector(".app-control-next");

  if (!carousel || !track || !prevBtn || !nextBtn) return;

  const originalSlides = Array.from(track.querySelectorAll(".application-card"));
  if (originalSlides.length < 2) return;

  // Clone the full set on both sides so wide viewports + half-card offset never reveal gaps.
  const cloneCount = originalSlides.length;
  const headClones = originalSlides
    .slice(-cloneCount)
    .map((slide) => slide.cloneNode(true));
  const tailClones = originalSlides
    .slice(0, cloneCount)
    .map((slide) => slide.cloneNode(true));

  headClones.forEach((clone) => {
    clone.setAttribute("aria-hidden", "true");
    track.insertBefore(clone, track.firstChild);
  });

  tailClones.forEach((clone) => {
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  let currentIndex = cloneCount;
  let isAnimating = false;

  const getCardStep = () => {
    const firstCard = track.querySelector(".application-card");
    if (!firstCard) return 0;

    const trackStyles = window.getComputedStyle(track);
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(trackStyles.gap || "0");

    return cardWidth + gap;
  };

  const getOffset = () => {
    const firstCard = track.querySelector(".application-card");
    if (!firstCard) return 0;

    // Keep the first visible card half cut off on the left.
    return firstCard.getBoundingClientRect().width * 0.34;
  };

  const setPosition = (withTransition = true) => {
    const step = getCardStep();
    const startOffset = getOffset();

    track.style.transition = withTransition ? "transform 0.35s ease" : "none";
    track.style.transform = `translateX(${-(currentIndex * step + startOffset)}px)`;
  };

  const goTo = (direction) => {
    if (isAnimating) return;

    isAnimating = true;
    currentIndex += direction;
    setPosition(true);
  };

  track.addEventListener("transitionend", () => {
    const totalOriginal = originalSlides.length;

    if (currentIndex >= totalOriginal + cloneCount) {
      currentIndex = cloneCount;
      setPosition(false);
    } else if (currentIndex < cloneCount) {
      currentIndex = totalOriginal + cloneCount - 1;
      setPosition(false);
    }

    // Force reflow before restoring transition for next click.
    track.getBoundingClientRect();
    track.style.transition = "transform 0.35s ease";
    isAnimating = false;
  });

  prevBtn.addEventListener("click", () => goTo(-1));
  nextBtn.addEventListener("click", () => goTo(1));

  prevBtn.disabled = false;
  nextBtn.disabled = false;

  window.addEventListener("resize", () => setPosition(false));
  setPosition(false);
}

// ================= IMAGE ZOOM =================
function handleImageZoom() {}

// ================= PROCESS STEPS =================
function initProcessSteps() {
  const processPanel = document.querySelector(".process-panel");
  if (!processPanel) return;

  const stepButtons = Array.from(processPanel.querySelectorAll(".process-step"));
  const stepLabel = processPanel.querySelector(".process-mobile-step-label");
  const prevButton = processPanel.querySelector(".process-mobile-prev");
  const nextButton = processPanel.querySelector(".process-mobile-next");

  if (!stepButtons.length || !stepLabel || !prevButton || !nextButton) return;

  let currentIndex = Math.max(
    0,
    stepButtons.findIndex((button) => button.classList.contains("is-active"))
  );

  const totalSteps = stepButtons.length;

  const updateStepState = () => {
    stepButtons.forEach((button, index) => {
      const isActive = index === currentIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    const stepName = stepButtons[currentIndex].textContent.trim();
    stepLabel.textContent = `Step ${currentIndex + 1}/${totalSteps}: ${stepName}`;
  };

  stepButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      currentIndex = index;
      updateStepState();
    });
  });

  prevButton.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + totalSteps) % totalSteps;
    updateStepState();
  });

  nextButton.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % totalSteps;
    updateStepState();
  });

  updateStepState();
}

// ================= TESTIMONIALS CAROUSEL =================
function initTestimonialsCarousel() {
  const carousel = document.querySelector(".testimonials-carousel");
  const track = document.querySelector(".testimonials-track");

  if (!carousel || !track) return;

  const originalCards = Array.from(track.querySelectorAll(".testimonial-card"));
  if (originalCards.length < 2) return;

  // Clone the full set on both sides for infinite scroll
  const cloneCount = originalCards.length;
  const headClones = originalCards
    .slice(-cloneCount)
    .map((card) => card.cloneNode(true));
  const tailClones = originalCards
    .slice(0, cloneCount)
    .map((card) => card.cloneNode(true));

  headClones.forEach((clone) => {
    clone.setAttribute("aria-hidden", "true");
    track.insertBefore(clone, track.firstChild);
  });

  tailClones.forEach((clone) => {
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
  });

  let currentIndex = cloneCount;
  let isAnimating = false;
  let wheelTimeout;

  const getCardStep = () => {
    const firstCard = track.querySelector(".testimonial-card");
    if (!firstCard) return 0;

    const trackStyles = window.getComputedStyle(track);
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(trackStyles.gap || "0");

    return cardWidth + gap;
  };

  const getOffset = () => {
    const firstCard = track.querySelector(".testimonial-card");
    if (!firstCard) return 0;

    // Keep the first visible card 34% cut off on the left
    return firstCard.getBoundingClientRect().width * 0.34;
  };

  const setPosition = (withTransition = true) => {
    const step = getCardStep();
    const startOffset = getOffset();

    track.style.transition = withTransition ? "transform 0.35s ease" : "none";
    track.style.transform = `translateX(${-(currentIndex * step + startOffset)}px)`;
  };

  const scroll = (direction) => {
    if (isAnimating) return;

    isAnimating = true;
    currentIndex += direction;
    setPosition(true);
  };

  track.addEventListener("transitionend", () => {
    const totalOriginal = originalCards.length;

    if (currentIndex >= totalOriginal + cloneCount) {
      currentIndex = cloneCount;
      setPosition(false);
    } else if (currentIndex < cloneCount) {
      currentIndex = totalOriginal + cloneCount - 1;
      setPosition(false);
    }

    // Force reflow before restoring transition for next scroll
    track.getBoundingClientRect();
    track.style.transition = "transform 0.35s ease";
    isAnimating = false;
  });

  // Mouse wheel scroll
  carousel.addEventListener("wheel", (e) => {
    e.preventDefault();

    clearTimeout(wheelTimeout);

    // Determine scroll direction
    const direction = e.deltaY > 0 ? 1 : -1;
    scroll(direction);

    // Reset animation flag after timeout to allow another scroll
    wheelTimeout = setTimeout(() => {
      isAnimating = false;
    }, 50);
  }, { passive: false });

  window.addEventListener("resize", () => setPosition(false));
  setPosition(false);
}

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
  initTestimonialsCarousel();
  handleImageZoom();
  initProcessSteps();
  handleFAQ();
});