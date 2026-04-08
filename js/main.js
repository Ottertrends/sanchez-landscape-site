(function () {
  "use strict";

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

  var quoteMobile = qs(".header__quote-mobile");
  if (quoteMobile) {
    quoteMobile.addEventListener("click", function () {
      setNavOpen(false);
    });
  }

  qsa(".nav__link, .nav__contact-link").forEach(function (link) {
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

    handle.addEventListener(
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

  function showFormError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  }

  var recaptchaLoadState = "loading";
  var recaptchaSiteKey = "";

  function showRecaptchaFailure(msg) {
    qsa("[data-mail-form]").forEach(function (mailForm) {
      var t = mailForm.getAttribute("data-form-type");
      var errEl =
        t === "contact"
          ? document.getElementById("contact-error")
          : document.getElementById("quote-error");
      showFormError(errEl, msg);
    });
  }

  function initMailFormRecaptcha() {
    fetch("/api/recaptcha-config")
      .then(function (r) {
        return r.json();
      })
      .then(function (cfg) {
        recaptchaSiteKey =
          cfg && cfg.siteKey ? String(cfg.siteKey).trim() : "";
        if (!recaptchaSiteKey) {
          recaptchaLoadState = "missing";
          showRecaptchaFailure(
            "Form protection is missing on the server (NEXT_PUBLIC_RECAPTCHA_SITE_KEY)."
          );
          return;
        }
        if (document.querySelector("script[data-recaptcha-enterprise]")) {
          recaptchaLoadState = "ready";
          return;
        }
        var s = document.createElement("script");
        s.src =
          "https://www.google.com/recaptcha/enterprise.js?render=" +
          encodeURIComponent(recaptchaSiteKey);
        s.async = true;
        s.defer = true;
        s.setAttribute("data-recaptcha-enterprise", "true");
        s.onload = function () {
          recaptchaLoadState = "ready";
        };
        s.onerror = function () {
          recaptchaLoadState = "missing";
          showRecaptchaFailure(
            "Could not load form security. Check your connection or turn off strict blockers, then refresh."
          );
        };
        document.head.appendChild(s);
      })
      .catch(function () {
        recaptchaLoadState = "missing";
        showRecaptchaFailure(
          "Could not load form protection. Refresh the page or call us."
        );
      });
  }

  initMailFormRecaptcha();

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

    var contactMethod = "";
    if (type === "contact") {
      if (!message) {
        showFormError(errEl, "Please enter a message.");
        return;
      }
      contactMethod = (fd.get("contact_method") || "").toString();
    }

    showFormError(errEl, "");

    if (recaptchaLoadState === "loading") {
      showFormError(
        errEl,
        "One moment — loading form security. Please try again."
      );
      return;
    }
    if (recaptchaLoadState === "missing") {
      showFormError(
        errEl,
        "Form security could not load. Please refresh the page or call us."
      );
      return;
    }

    if (
      typeof grecaptcha === "undefined" ||
      !grecaptcha.enterprise ||
      typeof grecaptcha.enterprise.ready !== "function" ||
      typeof grecaptcha.enterprise.execute !== "function"
    ) {
      showFormError(
        errEl,
        "Form security is still loading. Wait a moment and try again."
      );
      return;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    function finishSubmit(recaptchaToken) {
      fetch("/api/send-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: type,
          name: name,
          phone: phone,
          email: email,
          service: service,
          message: message,
          contactMethod: contactMethod,
          recaptchaToken: recaptchaToken,
        }),
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { res: res, data: data };
            });
        })
        .then(function (r) {
          if (r.res.ok && r.data && r.data.ok) {
            window.location.href = "/thank-you";
            return;
          }
          var msg =
            (r.data && r.data.error) ||
            "Something went wrong. Please try again or call us.";
          showFormError(errEl, msg);
        })
        .catch(function () {
          showFormError(
            errEl,
            "Network error. Please check your connection and try again."
          );
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    }

    grecaptcha.enterprise.ready(function () {
      grecaptcha.enterprise
        .execute(recaptchaSiteKey, { action: "submit" })
        .then(function (token) {
          if (!token) {
            showFormError(
              errEl,
              "Could not verify submission. Please try again."
            );
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          finishSubmit(token);
        })
        .catch(function (e) {
          console.error("reCAPTCHA Enterprise execute error:", e);
          showFormError(
            errEl,
            "Could not verify submission. Please try again."
          );
          if (submitBtn) submitBtn.disabled = false;
        });
    });
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
    var behavior = reduceMotion ? "auto" : "smooth";
    /* #top lives on the fixed header — getBoundingClientRect is viewport-relative, so the offset math would only step by ~header height each click */
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: behavior });
      return;
    }
    var target = document.getElementById(id);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: top, behavior: behavior });
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

  /* Cookie settings modal + Consent Mode updates */
  var STORAGE_ANALYTICS = "sl_cmp_analytics";
  var STORAGE_MARKETING = "sl_cmp_marketing";

  function consentAnalytics(granted) {
    if (typeof gtag !== "function") return;
    gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
    });
  }

  function consentMarketing(granted) {
    if (typeof gtag !== "function") return;
    gtag("consent", "update", {
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
    });
  }

  var cookieModal = qs("[data-cookie-modal]");
  var analyticsToggle = qs("[data-cookie-analytics]");
  var marketingToggle = qs("[data-cookie-marketing]");

  if (cookieModal && analyticsToggle && marketingToggle) {
    var cookieOpenBtn = qs("[data-cookie-settings-open]");

    function openCookieModal() {
      cookieModal.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
      var doneBtn = qs("[data-cookie-modal-dismiss].cookie-modal__done");
      if (doneBtn) doneBtn.focus();
    }

    function closeCookieModal() {
      cookieModal.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }

    var storedA = localStorage.getItem(STORAGE_ANALYTICS);
    var storedM = localStorage.getItem(STORAGE_MARKETING);

    if (storedA === "0") {
      analyticsToggle.checked = false;
      consentAnalytics(false);
    }
    if (storedM === "0") {
      marketingToggle.checked = false;
      consentMarketing(false);
    }

    if (cookieOpenBtn) {
      cookieOpenBtn.addEventListener("click", openCookieModal);
    }

    qsa("[data-cookie-modal-dismiss]").forEach(function (el) {
      el.addEventListener("click", closeCookieModal);
    });

    analyticsToggle.addEventListener("change", function () {
      var on = analyticsToggle.checked;
      localStorage.setItem(STORAGE_ANALYTICS, on ? "1" : "0");
      consentAnalytics(on);
    });

    marketingToggle.addEventListener("change", function () {
      var on = marketingToggle.checked;
      localStorage.setItem(STORAGE_MARKETING, on ? "1" : "0");
      consentMarketing(on);
    });

    window.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (cookieModal.hasAttribute("hidden")) return;
      closeCookieModal();
    });
  }
})();
