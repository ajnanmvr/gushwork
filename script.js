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
  let autoSlideTimer;
  let resumeAutoSlideTimeout;

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

  const startAutoSlide = () => {
    if (autoSlideTimer) window.clearInterval(autoSlideTimer);
    autoSlideTimer = window.setInterval(() => {
      goTo(1);
    }, 1600);
  };

  const stopAutoSlide = () => {
    if (!autoSlideTimer) return;
    window.clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  };

  const resumeAutoSlideAfterDelay = () => {
    if (resumeAutoSlideTimeout) window.clearTimeout(resumeAutoSlideTimeout);

    resumeAutoSlideTimeout = window.setTimeout(() => {
      if (!carousel.matches(":hover")) {
        startAutoSlide();
      }
    }, 4500);
  };

  prevBtn.addEventListener("click", () => {
    stopAutoSlide();
    goTo(-1);
    resumeAutoSlideAfterDelay();
  });

  nextBtn.addEventListener("click", () => {
    stopAutoSlide();
    goTo(1);
    resumeAutoSlideAfterDelay();
  });

  carousel.addEventListener("mouseenter", stopAutoSlide);
  carousel.addEventListener("mouseleave", startAutoSlide);

  prevBtn.disabled = false;
  nextBtn.disabled = false;

  window.addEventListener("resize", () => setPosition(false));
  setPosition(false);
  startAutoSlide();
}

// ================= IMAGE ZOOM =================
function handleImageZoom() {
  const container = document.querySelector(".hero-image-container");
  const image = document.querySelector(".hero-image");
  const focus = document.querySelector(".hero-zoom-focus");
  const lens = document.querySelector(".hero-zoom-lens");

  if (!container || !image || !focus || !lens) return;

  const zoomLevel = 3.2;

  const setLensBackground = () => {
    lens.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
    lens.style.backgroundSize = `${image.clientWidth * zoomLevel}px ${image.clientHeight * zoomLevel}px`;
  };

  const updateLensPosition = (clientX, clientY) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const focusHalfWidth = focus.offsetWidth / 2;
    const focusHalfHeight = focus.offsetHeight / 2;

    const clampedX = Math.max(focusHalfWidth, Math.min(x, rect.width - focusHalfWidth));
    const clampedY = Math.max(focusHalfHeight, Math.min(y, rect.height - focusHalfHeight));

    focus.style.left = `${clampedX}px`;
    focus.style.top = `${clampedY}px`;

    const lensWidth = lens.clientWidth;
    const lensHeight = lens.clientHeight;
    const bgPosX = -(clampedX * zoomLevel - lensWidth / 2);
    const bgPosY = -(clampedY * zoomLevel - lensHeight / 2);
    lens.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
  };

  const handlePointerMove = (event) => {
    updateLensPosition(event.clientX, event.clientY);
  };

  const handlePointerEnter = (event) => {
    setLensBackground();
    focus.classList.add("is-visible");
    lens.classList.add("is-visible");
    container.classList.add("is-zoom-active");
    updateLensPosition(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    focus.classList.remove("is-visible");
    lens.classList.remove("is-visible");
    container.classList.remove("is-zoom-active");
  };

  container.addEventListener("mousemove", handlePointerMove);
  container.addEventListener("mouseenter", handlePointerEnter);
  container.addEventListener("mouseleave", handlePointerLeave);
  window.addEventListener("resize", setLensBackground);

  if (image.complete) {
    setLensBackground();
  } else {
    image.addEventListener("load", setLensBackground, { once: true });
  }
}

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
  let autoSlideTimer;

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

    // Keep the first card partially visible on the left.
    return firstCard.getBoundingClientRect().width * 0.36;
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

  const startAutoSlide = () => {
    if (autoSlideTimer) window.clearInterval(autoSlideTimer);
    autoSlideTimer = window.setInterval(() => {
      goTo(1);
    }, 1600);
  };

  const stopAutoSlide = () => {
    if (!autoSlideTimer) return;
    window.clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  };

  // Over testimonials, wheel should scroll the page only (not the carousel cards).
  carousel.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      window.scrollBy({
        top: event.deltaY,
        left: 0,
        behavior: "auto",
      });
    },
    { passive: false }
  );

  carousel.addEventListener("mouseenter", stopAutoSlide);
  carousel.addEventListener("mouseleave", startAutoSlide);

  window.addEventListener("resize", () => setPosition(false));
  setPosition(false);
  startAutoSlide();
}

// ================= MODALS & POPUPS =================
function bindModal({
  triggerSelector,
  modalSelector,
  panelSelector,
  closeSelector,
  onOpen,
}) {
  const triggers = Array.from(document.querySelectorAll(triggerSelector));
  const modal = document.querySelector(modalSelector);
  const panel = document.querySelector(panelSelector);
  const closeButton = document.querySelector(closeSelector);

  if (!triggers.length || !modal || !panel || !closeButton) return;

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (onOpen) onOpen();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", openModal);
  });

  closeButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (!panel.contains(event.target)) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

function initDatasheetPopup() {
  const emailInput = document.querySelector("#datasheet-email");
  const submitButton = document.querySelector(".datasheet-submit-btn");

  const setSubmitState = () => {
    if (!emailInput || !submitButton) return;
    const hasEmail = emailInput.value.trim().length > 0;
    submitButton.disabled = !hasEmail;
    submitButton.classList.toggle("is-ready", hasEmail);
  };

  if (emailInput) {
    emailInput.addEventListener("input", setSubmitState);
  }

  bindModal({
    triggerSelector: ".specs-datasheet-trigger",
    modalSelector: ".datasheet-modal",
    panelSelector: ".datasheet-modal-panel",
    closeSelector: ".datasheet-modal-close",
    onOpen: () => {
      if (emailInput) {
        window.setTimeout(() => emailInput.focus(), 0);
      }
      setSubmitState();
    },
  });

  setSubmitState();
}

function initQuotePopup() {
  const firstInput = document.querySelector('.quote-modal-form input[name="fullName"]');

  bindModal({
    triggerSelector: ".quote-modal-trigger",
    modalSelector: ".quote-modal",
    panelSelector: ".quote-modal-panel",
    closeSelector: ".quote-modal-close",
    onOpen: () => {
      if (firstInput) {
        window.setTimeout(() => firstInput.focus(), 0);
      }
    },
  });
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
  initDatasheetPopup();
  initQuotePopup();
  handleFAQ();
});