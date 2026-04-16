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

  /* Quote request modal */
  var quoteModal = qs("[data-quote-modal]");
  var lastQuoteFocus = null;

  function openQuoteModal() {
    if (!quoteModal) return;
    lastQuoteFocus = document.activeElement;
    quoteModal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    var firstInput = qs("#quote-name", quoteModal);
    window.setTimeout(function () {
      if (firstInput) firstInput.focus();
    }, 50);
  }

  function closeQuoteModal() {
    if (!quoteModal || quoteModal.hasAttribute("hidden")) return;
    quoteModal.setAttribute("hidden", "");
    document.body.style.overflow = "";
    if (lastQuoteFocus && typeof lastQuoteFocus.focus === "function") {
      lastQuoteFocus.focus();
    }
    lastQuoteFocus = null;
  }

  qsa("[data-open-quote-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openQuoteModal();
    });
  });

  if (quoteModal) {
    qsa("[data-quote-modal-dismiss]", quoteModal).forEach(function (el) {
      el.addEventListener("click", function () {
        closeQuoteModal();
      });
    });
  }

  /* Typewriter tagline */
  var twEl = qs("[data-typewriter]");
  if (twEl) {
    var twText = "Landscaping you can trust.";
    var twIndex = 0;
    var twStarted = false;

    function runTypewriter() {
      if (twStarted) return;
      twStarted = true;
      var twInterval = setInterval(function () {
        twIndex++;
        twEl.textContent = twText.slice(0, twIndex);
        if (twIndex >= twText.length) {
          clearInterval(twInterval);
          setTimeout(function () {
            twEl.classList.add("typewriter-done");
          }, 1500);
        }
      }, 55);
    }

    if (reduceMotion) {
      twEl.textContent = twText;
      twEl.classList.add("typewriter-done");
    } else if ("IntersectionObserver" in window) {
      var twIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            twIo.disconnect();
            runTypewriter();
          }
        });
      }, { threshold: 0.3 });
      twIo.observe(twEl);
    } else {
      runTypewriter();
    }
  }

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
    if (e.key !== "Escape") return;
    if (quoteModal && !quoteModal.hasAttribute("hidden")) {
      closeQuoteModal();
      return;
    }
    setNavOpen(false);
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

  /* Testimonials carousel (horizontal snap + prev/next) */
  qsa("[data-testimonials-carousel]").forEach(function (wrap) {
    var viewport = qs("[data-carousel-viewport]", wrap);
    var prevBtn = qs("[data-carousel-prev]", wrap);
    var nextBtn = qs("[data-carousel-next]", wrap);
    var track = viewport && qs(".testimonials__track", viewport);
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    function cards() {
      return qsa(".testimonial-card", track);
    }

    function currentIndex() {
      var list = cards();
      if (list.length === 0) return 0;
      var x = viewport.scrollLeft + 2;
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i].offsetLeft <= x) return i;
      }
      return 0;
    }

    function scrollToIndex(idx) {
      var list = cards();
      if (!list[idx]) return;
      viewport.scrollTo({ left: list[idx].offsetLeft, behavior: "smooth" });
    }

    function updateNavDisabled() {
      var list = cards();
      var max = Math.max(0, viewport.scrollWidth - viewport.clientWidth - 1);
      var x = viewport.scrollLeft;
      var i = currentIndex();
      prevBtn.disabled = list.length === 0 || i <= 0;
      nextBtn.disabled = list.length === 0 || i >= list.length - 1;
      if (list.length && x >= max) nextBtn.disabled = true;
    }

    prevBtn.addEventListener("click", function () {
      scrollToIndex(currentIndex() - 1);
    });
    nextBtn.addEventListener("click", function () {
      scrollToIndex(currentIndex() + 1);
    });

    viewport.addEventListener("scroll", function () {
      window.requestAnimationFrame(updateNavDisabled);
    });

    window.addEventListener(
      "resize",
      function () {
        var max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        if (viewport.scrollLeft > max) viewport.scrollLeft = max;
        updateNavDisabled();
      },
      { passive: true }
    );

    updateNavDisabled();
  });

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

  function showFormSuccess(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  /* Visit scheduling toggle */
  qsa("[data-mail-form]").forEach(function (form) {
    var yesBtn = qs("[data-visit-yes]", form);
    var noBtn = qs("[data-visit-no]", form);
    var details = qs("[data-visit-details]", form);
    var hiddenInput = form.querySelector('input[name="visit_scheduled"]');
    var submitBtn = form.querySelector('[type="submit"]');

    if (!yesBtn || !noBtn || !details) return;

    function setVisit(scheduled) {
      if (scheduled) {
        details.removeAttribute("hidden");
        yesBtn.classList.add("btn-visit--active-yes");
        yesBtn.classList.remove("btn-visit--active-no");
        noBtn.classList.remove("btn-visit--active-yes", "btn-visit--active-no");
        if (hiddenInput) hiddenInput.value = "yes";
        if (submitBtn) submitBtn.textContent = submitBtn.getAttribute("data-submit-default") || submitBtn.textContent;
        if (submitBtn && form.getAttribute("data-form-type") === "quote") {
          submitBtn.textContent = "Request Quote & Schedule Visit →";
        }
      } else {
        details.setAttribute("hidden", "");
        noBtn.classList.add("btn-visit--active-no");
        noBtn.classList.remove("btn-visit--active-yes");
        yesBtn.classList.remove("btn-visit--active-yes", "btn-visit--active-no");
        if (hiddenInput) hiddenInput.value = "no";
        if (submitBtn && form.getAttribute("data-form-type") === "quote") {
          submitBtn.textContent = "Get My Free Quote →";
        }
      }
    }

    yesBtn.addEventListener("click", function () { setVisit(true); });
    noBtn.addEventListener("click", function () { setVisit(false); });
  });

  var recaptchaLoadState = "loading";
  var recaptchaSiteKey = "";
  var recaptchaMode = "none";

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
        if (r.status === 404) {
          recaptchaLoadState = "ready";
          recaptchaMode = "none";
          return null;
        }
        if (!r.ok) {
          recaptchaLoadState = "missing";
          showRecaptchaFailure(
            "Could not load form protection. Refresh the page or call us."
          );
          return null;
        }
        return r.json();
      })
      .then(function (cfg) {
        if (!cfg) return;
        recaptchaMode = cfg.mode ? String(cfg.mode) : "none";
        recaptchaSiteKey =
          cfg && cfg.siteKey ? String(cfg.siteKey).trim() : "";

        if (recaptchaMode === "none" || !recaptchaSiteKey) {
          recaptchaLoadState = "ready";
          return;
        }

        var scriptUrl =
          recaptchaMode === "enterprise"
            ? "https://www.google.com/recaptcha/enterprise.js?render=" +
              encodeURIComponent(recaptchaSiteKey)
            : "https://www.google.com/recaptcha/api.js?render=" +
              encodeURIComponent(recaptchaSiteKey);

        var attr =
          recaptchaMode === "enterprise"
            ? "data-recaptcha-enterprise"
            : "data-recaptcha-v3";

        if (document.querySelector("script[" + attr + "]")) {
          recaptchaLoadState = "ready";
          return;
        }

        var s = document.createElement("script");
        s.src = scriptUrl;
        s.async = true;
        s.defer = true;
        s.setAttribute(attr, "true");
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
        recaptchaLoadState = "ready";
        recaptchaMode = "none";
      });
  }

  initMailFormRecaptcha();

  function handleMailForm(form) {
    var type = form.getAttribute("data-form-type");
    var errEl =
      type === "contact"
        ? document.getElementById("contact-error")
        : document.getElementById("quote-error");
    var successEl =
      type === "contact"
        ? document.getElementById("contact-success")
        : document.getElementById("quote-success");

    var fd = new FormData(form);
    var name = (fd.get("name") || "").toString().trim();
    var phone = (fd.get("phone") || "").toString().trim();
    var email = (fd.get("email") || "").toString().trim();
    var service = (fd.get("service") || "").toString().trim();
    var message = (fd.get("message") || "").toString().trim();
    var contactMethod = (fd.get("contact_method") || "").toString().trim();
    var visitScheduled = (fd.get("visit_scheduled") || "").toString().trim();
    var visitStreet = (fd.get("visit_street") || "").toString().trim();
    var visitCity = (fd.get("visit_city") || "").toString().trim();
    var visitZip = (fd.get("visit_zip") || "").toString().trim();
    var visitDatetime = (fd.get("visit_datetime") || "").toString().trim();

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
    if (visitScheduled === "yes") {
      if (!visitStreet) {
        showFormError(errEl, "Please enter your street address for the visit.");
        return;
      }
      if (!visitCity) {
        showFormError(errEl, "Please enter your city.");
        return;
      }
      if (!visitZip || visitZip.length < 5) {
        showFormError(errEl, "Please enter a valid 5-digit ZIP code.");
        return;
      }
      if (!visitDatetime) {
        showFormError(errEl, "Please select a preferred date and time for the visit.");
        return;
      }
    }
    if (type === "contact" && !message && visitScheduled !== "yes") {
      showFormError(errEl, "Please enter a message.");
      return;
    }

    showFormError(errEl, "");

    if (recaptchaMode !== "none") {
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
      if (recaptchaMode === "enterprise") {
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
      } else {
        if (
          typeof grecaptcha === "undefined" ||
          typeof grecaptcha.ready !== "function" ||
          typeof grecaptcha.execute !== "function"
        ) {
          showFormError(
            errEl,
            "Form security is still loading. Wait a moment and try again."
          );
          return;
        }
      }
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
          visitScheduled: visitScheduled,
          visitStreet: visitStreet,
          visitCity: visitCity,
          visitZip: visitZip,
          visitDatetime: visitDatetime,
          recaptchaToken: recaptchaToken || "",
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
            if (visitScheduled === "yes") {
              form.reset();
              var details = qs("[data-visit-details]", form);
              if (details) details.setAttribute("hidden", "");
              qsa(".btn-visit", form).forEach(function (b) {
                b.classList.remove("btn-visit--active-yes", "btn-visit--active-no");
              });
              showFormSuccess(successEl, "Thank you! We will confirm your visit via email soon.");
            } else {
              window.location.href = "/thank-you";
            }
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

    if (recaptchaMode === "none") {
      finishSubmit("");
      return;
    }

    if (recaptchaMode === "enterprise") {
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
    } else {
      grecaptcha.ready(function () {
        grecaptcha
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
            console.error("reCAPTCHA v3 execute error:", e);
            showFormError(
              errEl,
              "Could not verify submission. Please try again."
            );
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }
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
      if (window.location.hash === "#hero-form") {
        openQuoteModal();
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
        return;
      }
      scrollWithOffset(window.location.hash);
    });
  }

  qsa('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute("href");
    if (href.length > 1 && href !== "#") {
      a.addEventListener("click", function (e) {
        var id = href.slice(1);
        if (id === "hero-form") {
          e.preventDefault();
          openQuoteModal();
          return;
        }
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
