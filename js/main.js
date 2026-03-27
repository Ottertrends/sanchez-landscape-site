(function () {
  "use strict";

  var EMAIL = "sanchezlandscape512@gmail.com";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* Sticky header */
  var header = qs("[data-header]");
  function updateHeader() {
    if (!header) return;
    var y = window.scrollY || document.documentElement.scrollTop;
    if (y > 48) header.classList.add("header--scrolled");
    else header.classList.remove("header--scrolled");
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var heroVideo = qs(".hero-video");
  if (heroVideo && reduceMotion) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  /* Mobile nav */
  var navToggle = qs("[data-nav-toggle]");
  var navOverlay = qs("[data-nav-overlay]");
  var navEl = navToggle && navToggle.closest(".nav");

  function setNavOpen(open) {
    if (!navToggle || !navEl) return;
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navEl.classList.toggle("nav--open", open);
    if (navOverlay) {
      if (open) navOverlay.removeAttribute("hidden");
      else navOverlay.setAttribute("hidden", "");
    }
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") !== "true";
      setNavOpen(open);
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener("click", function () {
      setNavOpen(false);
    });
  }

  qsa('.nav__link[href^="#"], .nav__contact-link').forEach(function (link) {
    link.addEventListener("click", function () {
      setNavOpen(false);
    });
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNavOpen(false);
  });

  /* Intersection Observer — scroll reveals */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    qsa("[data-animate]").forEach(function (el) {
      io.observe(el);
    });
  } else {
    qsa("[data-animate]").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Before / after sliders (transformations) */
  function setBaSlider(slider, pct) {
    var mask = qs("[data-ba-mask]", slider);
    var handle = qs("[data-ba-handle]", slider);
    if (!mask || !handle) return;
    var p = Math.max(5, Math.min(95, pct));
    mask.style.width = p + "%";
    handle.style.left = p + "%";
    handle.style.transform = "translateX(-50%)";
    handle.setAttribute("aria-valuenow", String(Math.round(p)));
  }

  function initBaSlider(slider) {
    var handle = qs("[data-ba-handle]", slider);
    if (!handle) return;

    function pctFromClientX(clientX) {
      var r = slider.getBoundingClientRect();
      return ((clientX - r.left) / r.width) * 100;
    }

    var dragging = false;

    function onMove(clientX) {
      setBaSlider(slider, pctFromClientX(clientX));
    }

    slider.addEventListener("mousedown", function (e) {
      dragging = true;
      onMove(e.clientX);
      e.preventDefault();
    });

    slider.addEventListener(
      "touchstart",
      function (e) {
        if (!e.touches || !e.touches[0]) return;
        dragging = true;
        onMove(e.touches[0].clientX);
      },
      { passive: true }
    );

    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      onMove(e.clientX);
    });

    window.addEventListener(
      "touchmove",
      function (e) {
        if (!dragging || !e.touches || !e.touches[0]) return;
        onMove(e.touches[0].clientX);
      },
      { passive: true }
    );

    function endDrag() {
      dragging = false;
    }
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);

    handle.addEventListener("keydown", function (e) {
      var cur = parseFloat(handle.getAttribute("aria-valuenow") || "50");
      var step = e.shiftKey ? 10 : 5;
      if (e.key === "ArrowLeft") {
        setBaSlider(slider, cur - step);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setBaSlider(slider, cur + step);
        e.preventDefault();
      }
    });

    setBaSlider(slider, 50);
  }

  qsa("[data-ba-slider]").forEach(initBaSlider);

  /* Gallery: load more (reveals items beyond 12) */
  var galleryLoadMore = qs("[data-gallery-load-more]");
  if (galleryLoadMore) {
    var hiddenGallery = qsa(".gallery-item--collapsed");
    if (hiddenGallery.length === 0) {
      galleryLoadMore.hidden = true;
    } else {
      galleryLoadMore.addEventListener("click", function () {
        hiddenGallery.forEach(function (el) {
          el.classList.add("is-revealed");
        });
        galleryLoadMore.hidden = true;
      });
    }
  }

  /* Lightbox */
  var lightbox = qs("[data-lightbox]");
  var lightboxImg = qs("[data-lightbox-img]", lightbox);
  var lightboxClose = qs("[data-lightbox-close]", lightbox);

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute("hidden", "");
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  qsa("[data-lightbox-src]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openLightbox(btn.getAttribute("data-lightbox-src"), btn.getAttribute("data-lightbox-alt"));
    });
  });

  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  if (lightboxClose) {
    lightboxClose.addEventListener("click", function (e) {
      e.stopPropagation();
      closeLightbox();
    });
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox && !lightbox.hasAttribute("hidden")) closeLightbox();
  });

  /* Phone validation */
  function digitsPhone(s) {
    return String(s || "").replace(/\D/g, "");
  }

  function validPhone(s) {
    var d = digitsPhone(s);
    return d.length === 10 || d.length === 11;
  }

  function validEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  function buildMailto(subject, body) {
    return (
      "mailto:" +
      EMAIL +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function showFormError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  }

  function handleMailForm(form) {
    var type = form.getAttribute("data-form-type");
    var errEl =
      type === "contact"
        ? document.getElementById("contact-error")
        : document.getElementById("quote-error");

    var fd = new FormData(form);
    var name = (fd.get("name") || "").toString().trim();
    var phone = (fd.get("phone") || "").toString().trim();
    var email = (fd.get("email") || "").toString().trim();
    var service = (fd.get("service") || "").toString().trim();
    var message = (fd.get("message") || "").toString().trim();

    if (!name) {
      showFormError(errEl, "Please enter your name.");
      return;
    }
    if (!validPhone(phone)) {
      showFormError(errEl, "Please enter a valid 10-digit phone number.");
      return;
    }
    if (!validEmail(email)) {
      showFormError(errEl, "Please enter a valid email address.");
      return;
    }
    if (!service) {
      showFormError(errEl, "Please select a service.");
      return;
    }

    var subject;
    var bodyParts;

    if (type === "contact") {
      if (!message) {
        showFormError(errEl, "Please enter a message.");
        return;
      }
      var method = (fd.get("contact_method") || "").toString();
      subject = "Website inquiry — " + name;
      bodyParts = [
        "Name: " + name,
        "Phone: " + phone,
        "Email: " + email,
        "Service: " + service,
        "Preferred contact: " + method,
        "",
        message
      ];
    } else {
      subject = "Quote request — " + name;
      bodyParts = [
        "Name: " + name,
        "Phone: " + phone,
        "Email: " + email,
        "Service: " + service,
        "",
        message || "(No additional message)"
      ];
    }

    showFormError(errEl, "");
    window.location.href = buildMailto(subject, bodyParts.join("\n"));
  }

  qsa("[data-mail-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleMailForm(form);
    });
  });

  /* Smooth offset for fixed header when hash navigation */
  function scrollWithOffset(hash) {
    var id = hash && hash.replace("#", "");
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  if (window.location.hash) {
    window.requestAnimationFrame(function () {
      scrollWithOffset(window.location.hash);
    });
  }

  qsa('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute("href");
    if (href.length > 1 && href !== "#") {
      a.addEventListener("click", function (e) {
        var id = href.slice(1);
        if (document.getElementById(id)) {
          e.preventDefault();
          history.pushState(null, "", href);
          scrollWithOffset(href);
        }
      });
    }
  });

  var footerYear = qs("[data-footer-year]");
  if (footerYear) {
    footerYear.textContent = String(new Date().getFullYear());
  }
})();
