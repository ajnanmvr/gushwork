// ================= STICKY HEADER =================
function handleStickyHeader() {
  const header = document.querySelector(".header");
  const stickyProductBar = document.querySelector(".sticky-product-bar");
  const heroSection = document.querySelector(".hero");
  if (!header) return;

  const root = document.documentElement;
  let lastScrollY = window.scrollY;
  let isTicking = false;
  let wasPastHero = false;
  let isPastHeroLocked = false;
  let directionTravel = 0;
  const hideToggleDistance = 24;
  const showToggleDistance = 8;

  const setHeaderHeight = () => {
    root.style.setProperty("--header-height", `${header.offsetHeight}px`);

    if (stickyProductBar) {
      root.style.setProperty(
        "--sticky-strip-height",
        `${stickyProductBar.offsetHeight}px`
      );
    }
  };

  const hideHeaderImmediately = () => {
    header.classList.add("sticky-no-transition", "sticky-hidden");
    header.classList.remove("sticky-visible");
    document.body.classList.remove("has-sticky-header");

    // Re-enable transitions on the next paint for normal behavior afterwards.
    window.requestAnimationFrame(() => {
      header.classList.remove("sticky-no-transition");
    });
  };

  const updateStickyState = (scrollY) => {
    const heroBottom = heroSection
      ? heroSection.offsetTop + heroSection.offsetHeight
      : window.innerHeight;
    const enterBuffer = 2;
    const exitBuffer = 10;

    if (!isPastHeroLocked && scrollY > heroBottom + enterBuffer) {
      isPastHeroLocked = true;
    } else if (isPastHeroLocked && scrollY < heroBottom - exitBuffer) {
      isPastHeroLocked = false;
    }

    const isPastHero = isPastHeroLocked;
    const justEnteredPastHero = isPastHero && !wasPastHero;
    const scrollDelta = scrollY - lastScrollY;

    if (!isPastHero) {
      document.body.classList.remove("has-sticky-header");
      document.body.classList.remove("has-sticky-strip");
      header.classList.remove("sticky-active", "sticky-visible", "sticky-hidden");
      directionTravel = 0;
      lastScrollY = scrollY;
      wasPastHero = false;
      return;
    }

    document.body.classList.add("has-sticky-strip");
    header.classList.add("sticky-active");

    if (justEnteredPastHero) {
      hideHeaderImmediately();
      directionTravel = 0;
    } else if (Math.abs(scrollDelta) > 1) {
      if (scrollDelta > 0) {
        directionTravel = Math.max(0, directionTravel) + scrollDelta;

        if (directionTravel >= hideToggleDistance) {
          header.classList.add("sticky-hidden");
          header.classList.remove("sticky-visible");
          document.body.classList.remove("has-sticky-header");
          directionTravel = 0;
        }
      } else {
        directionTravel = Math.min(0, directionTravel) + scrollDelta;

        if (directionTravel <= -showToggleDistance) {
          header.classList.add("sticky-visible");
          header.classList.remove("sticky-hidden");
          document.body.classList.add("has-sticky-header");
          directionTravel = 0;
        }
      }
    }

    lastScrollY = scrollY;
    wasPastHero = true;
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
function initInfiniteAutoCarousel({
  carouselSelector,
  trackSelector,
  cardSelector,
  offsetRatio,
  prevSelector,
  nextSelector,
  autoSlideInterval = 2000,
  resumeDelay,
}) {
  const carousel = document.querySelector(carouselSelector);
  const track = document.querySelector(trackSelector);
  const prevBtn = prevSelector ? document.querySelector(prevSelector) : null;
  const nextBtn = nextSelector ? document.querySelector(nextSelector) : null;

  if (!carousel || !track) return;
  if ((prevSelector && !prevBtn) || (nextSelector && !nextBtn)) return;

  const originalCards = Array.from(track.querySelectorAll(cardSelector));
  if (originalCards.length < 2) return;

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
  let hasPlayedInitialSlide = false;
  let autoSlideTimer;
  let resumeAutoSlideTimeout;

  const getCardStep = () => {
    const firstCard = track.querySelector(cardSelector);
    if (!firstCard) return 0;

    const trackStyles = window.getComputedStyle(track);
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(trackStyles.gap || "0");

    return cardWidth + gap;
  };

  const getOffset = () => {
    const firstCard = track.querySelector(cardSelector);
    if (!firstCard) return 0;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const isMobileViewport = window.matchMedia("(max-width: 800px)").matches;

    if (isMobileViewport) {
      return Math.max(0, (carousel.clientWidth - cardWidth) / 2);
    }

    return cardWidth * offsetRatio;
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

  const playInitialSlide = () => {
    if (hasPlayedInitialSlide) return;

    hasPlayedInitialSlide = true;
    goTo(1);
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

    track.getBoundingClientRect();
    track.style.transition = "transform 0.35s ease";
    isAnimating = false;
  });

  const startAutoSlide = () => {
    if (autoSlideTimer) window.clearInterval(autoSlideTimer);
    autoSlideTimer = window.setInterval(() => {
      goTo(1);
    }, autoSlideInterval);
  };

  const stopAutoSlide = () => {
    if (!autoSlideTimer) return;
    window.clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  };

  const resumeAutoSlideAfterDelay = () => {
    if (!resumeDelay) {
      startAutoSlide();
      return;
    }

    if (resumeAutoSlideTimeout) window.clearTimeout(resumeAutoSlideTimeout);

    resumeAutoSlideTimeout = window.setTimeout(() => {
      if (!carousel.matches(":hover")) {
        startAutoSlide();
      }
    }, resumeDelay);
  };

  if (prevBtn && nextBtn) {
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

    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  carousel.addEventListener("mouseenter", stopAutoSlide);
  carousel.addEventListener("mouseleave", startAutoSlide);

  window.addEventListener("resize", () => setPosition(false));
  setPosition(false);
  window.requestAnimationFrame(() => {
    playInitialSlide();
    startAutoSlide();
  });
}

function initCarousel() {
  initInfiniteAutoCarousel({
    carouselSelector: ".applications-carousel",
    trackSelector: ".applications-track",
    cardSelector: ".application-card",
    offsetRatio: 0.34,
    prevSelector: ".app-control-prev",
    nextSelector: ".app-control-next",
    autoSlideInterval: 2000,
  });
}

// ================= HERO GALLERY =================
function initHeroGallery() {
  const heroImage = document.querySelector(".hero-image");
  const thumbnailItems = Array.from(
    document.querySelectorAll(".thumbnail-container .thumbnail")
  );
  const prevButton = document.querySelector(
    ".hero-image-container .slider-controls button:first-child"
  );
  const nextButton = document.querySelector(
    ".hero-image-container .slider-controls button:last-child"
  );

  if (!heroImage || !thumbnailItems.length || !prevButton || !nextButton) return;

  const imageSources = thumbnailItems
    .map((thumbnail) => {
      if (thumbnail instanceof HTMLImageElement) {
        return thumbnail.getAttribute("src") || thumbnail.currentSrc || thumbnail.src;
      }

      return thumbnail.getAttribute("data-image");
    })
    .filter(Boolean);

  if (!imageSources.length) return;

  const normalizeUrl = (src) => {
    try {
      return new URL(src, window.location.href).href;
    } catch {
      return src;
    }
  };

  const initialIndex = Math.max(
    0,
    imageSources.findIndex(
      (src) => normalizeUrl(src) === normalizeUrl(heroImage.currentSrc || heroImage.src)
    )
  );

  let currentIndex = initialIndex;

  const setActiveThumbnail = () => {
    thumbnailItems.forEach((thumbnail, index) => {
      const isActive = index === currentIndex;
      thumbnail.setAttribute("aria-current", isActive ? "true" : "false");
      if (!(thumbnail instanceof HTMLButtonElement)) {
        thumbnail.setAttribute("tabindex", "0");
        thumbnail.setAttribute("role", "button");
      }
    });
  };

  const updateHeroImage = (index) => {
    currentIndex = (index + imageSources.length) % imageSources.length;
    heroImage.src = imageSources[currentIndex];

    const activeThumbnail = thumbnailItems[currentIndex];
    if (activeThumbnail instanceof HTMLImageElement && activeThumbnail.alt.trim()) {
      heroImage.alt = activeThumbnail.alt;
    }

    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }

    setActiveThumbnail();
  };

  thumbnailItems.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => {
      updateHeroImage(index);
    });

    thumbnail.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      updateHeroImage(index);
    });
  });

  prevButton.addEventListener("click", () => {
    updateHeroImage(currentIndex - 1);
  });

  nextButton.addEventListener("click", () => {
    updateHeroImage(currentIndex + 1);
  });

  setActiveThumbnail();
}

// ================= IMAGE ZOOM =================
function handleImageZoom() {
  const container = document.querySelector(".hero-image-container");
  const image = document.querySelector(".hero-image");
  const focus = document.querySelector(".hero-zoom-focus");
  const lens = document.querySelector(".hero-zoom-lens");

  if (!container || !image || !focus || !lens) return;

  const zoomLevel = 3.2;

  const getCoverMetrics = () => {
    const displayWidth = image.clientWidth;
    const displayHeight = image.clientHeight;
    const naturalWidth = image.naturalWidth || displayWidth;
    const naturalHeight = image.naturalHeight || displayHeight;

    const scale = Math.max(
      displayWidth / naturalWidth,
      displayHeight / naturalHeight
    );

    const renderedWidth = naturalWidth * scale;
    const renderedHeight = naturalHeight * scale;

    return {
      displayWidth,
      displayHeight,
      renderedWidth,
      renderedHeight,
      cropX: (renderedWidth - displayWidth) / 2,
      cropY: (renderedHeight - displayHeight) / 2,
    };
  };

  const setLensBackground = () => {
    const { renderedWidth, renderedHeight } = getCoverMetrics();

    lens.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
    lens.style.backgroundSize = `${renderedWidth * zoomLevel}px ${renderedHeight * zoomLevel}px`;
  };

  const updateLensPosition = (clientX, clientY) => {
    const rect = image.getBoundingClientRect();
    const imageStyles = window.getComputedStyle(image);
    const borderLeft = parseFloat(imageStyles.borderLeftWidth || "0");
    const borderTop = parseFloat(imageStyles.borderTopWidth || "0");
    const x = clientX - rect.left - borderLeft;
    const y = clientY - rect.top - borderTop;

    const { displayWidth, displayHeight, cropX, cropY } = getCoverMetrics();

    const focusHalfWidth = focus.offsetWidth / 2;
    const focusHalfHeight = focus.offsetHeight / 2;

    const clampedX = Math.max(
      focusHalfWidth,
      Math.min(x, displayWidth - focusHalfWidth)
    );
    const clampedY = Math.max(
      focusHalfHeight,
      Math.min(y, displayHeight - focusHalfHeight)
    );

    focus.style.left = `${clampedX}px`;
    focus.style.top = `${clampedY}px`;

    const lensWidth = lens.clientWidth;
    const lensHeight = lens.clientHeight;

    const lensTop = Math.max(
      lensHeight / 2,
      Math.min(clampedY, displayHeight - lensHeight / 2)
    );
    lens.style.top = `${lensTop}px`;

    const coverX = clampedX + cropX;
    const coverY = clampedY + cropY;

    const bgPosX = -(coverX * zoomLevel - lensWidth / 2);
    const bgPosY = -(coverY * zoomLevel - lensHeight / 2);
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
  initInfiniteAutoCarousel({
    carouselSelector: ".testimonials-carousel",
    trackSelector: ".testimonials-track",
    cardSelector: ".testimonial-card",
    offsetRatio: 0.36,
    autoSlideInterval: 2000,
  });
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

  const setExpandedState = (item, expand) => {
    const answer = item.querySelector(".faq-answer");
    const toggle = item.querySelector(".faq-toggle");
    if (!answer || !toggle) return;

    if (expand) {
      item.classList.add("faq-item-expanded");
      answer.style.height = "auto";
      const fullHeight = answer.scrollHeight;
      answer.style.height = "0px";
      void answer.offsetHeight;
      answer.style.height = `${fullHeight}px`;
      toggle.setAttribute("aria-expanded", "true");
      return;
    }

    answer.style.height = `${answer.scrollHeight}px`;
    void answer.offsetHeight;
    item.classList.remove("faq-item-expanded");
    answer.style.height = "0px";
    toggle.setAttribute("aria-expanded", "false");
  };

  faqItems.forEach((item) => {
    const header = item.querySelector(".faq-header");
    const toggle = item.querySelector(".faq-toggle");
    const answer = item.querySelector(".faq-answer");

    if (!header || !toggle) return;

    if (answer) {
      const answerId = answer.id || `faq-answer-${Math.random().toString(36).slice(2, 8)}`;
      answer.id = answerId;
      toggle.setAttribute("aria-controls", answerId);

      answer.addEventListener("transitionend", (event) => {
        if (event.propertyName !== "height") return;
        if (item.classList.contains("faq-item-expanded")) {
          answer.style.height = "auto";
        }
      });
    }

    toggle.setAttribute(
      "aria-expanded",
      item.classList.contains("faq-item-expanded") ? "true" : "false"
    );

    const handleToggle = () => {
      const isExpanded = item.classList.contains("faq-item-expanded");

      // Close all other items
      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("faq-item-expanded")) {
          setExpandedState(otherItem, false);
        }
      });

      // Toggle current item
      setExpandedState(item, !isExpanded);
    };

    header.addEventListener("click", handleToggle);
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      handleToggle();
    });

    if (item.classList.contains("faq-item-expanded") && answer) {
      answer.style.height = "auto";
    } else if (answer) {
      answer.style.height = "0px";
    }
  });

  window.addEventListener("resize", () => {
    faqItems.forEach((item) => {
      if (!item.classList.contains("faq-item-expanded")) return;
      const answer = item.querySelector(".faq-answer");
      if (!answer) return;
      answer.style.height = "auto";
    });
  });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  handleStickyHeader();
  initCarousel();
  initTestimonialsCarousel();
  initHeroGallery();
  handleImageZoom();
  initProcessSteps();
  initDatasheetPopup();
  initQuotePopup();
  handleFAQ();
});