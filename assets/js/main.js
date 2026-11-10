/* ==========================================================================
   ASCEND — SITE SCRIPT
   --------------------------------------------------------------------------
   Plain JavaScript. No libraries, no build step.
   Everything here is progressive: with JavaScript switched off the page still
   works (the menu stays visible and all content is shown).

   1. Mark that JavaScript is available
   2. Mobile menu
   3. Scroll reveal animation
   4. Header shadow on scroll
   5. Quote request form
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. JavaScript is available
     The "no-js" class on <html> provides a no-JavaScript fallback in CSS.
     ------------------------------------------------------------------ */
  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");


  /* ------------------------------------------------------------------
     2. Mobile menu
     ------------------------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#primary-nav");
  var navLinks = nav ? nav.querySelectorAll("a") : [];

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close after tapping a link, so the destination is visible.
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    // Close with the Escape key and return focus to the button.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });

    // Reset the menu when the layout switches to the desktop version.
    var desktop = window.matchMedia("(min-width: 900px)");
    var onBreakpoint = function (event) {
      if (event.matches) setMenu(false);
    };
    if (desktop.addEventListener) {
      desktop.addEventListener("change", onBreakpoint);
    } else if (desktop.addListener) {
      desktop.addListener(onBreakpoint); // older Safari
    }
  }


  /* ------------------------------------------------------------------
     3. Scroll reveal animation
     Each [data-reveal] element fades in once, the first time it enters
     the viewport. Animation is skipped when the visitor prefers reduced
     motion or the browser lacks IntersectionObserver.
     ------------------------------------------------------------------ */
  var revealItems = document.querySelectorAll("[data-reveal]");

  function showAll() {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }


  /* ------------------------------------------------------------------
     4. Header shadow on scroll
     ------------------------------------------------------------------ */
  var header = document.querySelector(".site-header");
  var ticking = false;

  function updateHeader() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    ticking = false;
  }

  if (header) {
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateHeader);
      },
      { passive: true }
    );
    updateHeader();
  }


  /* ------------------------------------------------------------------
     5. Quote request form
     ------------------------------------------------------------------
     Validates the four fields, blocks duplicate and double submits, and
     only reports success when Web3Forms itself returns success:true.
     The access key in the form is public by design; no other credentials
     are used, and nothing the visitor types is ever logged.
     ------------------------------------------------------------------ */
  var form = document.getElementById("quote-form");

  if (form) {
    var statusEl = document.getElementById("form-status");
    var submitBtn = document.getElementById("quote-submit");
    var doneEl = document.getElementById("quote-done");
    var keyInput = document.getElementById("quote-access-key");
    var honeypot = document.getElementById("field-botcheck");

    var MAIL = "ascendagent7@gmail.com";
    var ENDPOINT = form.getAttribute("action") || "https://api.web3forms.com/submit";
    var TIMEOUT_MS = 15000;
    var submitLabel = submitBtn ? submitBtn.textContent.trim() : "Send quote request";
    var sending = false;
    var sent = false;

    var rules = {
      "field-first-name": function (value) {
        return value.trim() ? "" : "Enter your first name.";
      },
      "field-surname": function (value) {
        return value.trim() ? "" : "Enter your surname.";
      },
      "field-email": function (value) {
        var v = value.trim();
        if (!v) return "Enter your email address.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
          ? ""
          : "Enter a valid email address.";
      },
      "field-phone": function (value) {
        if (!value.trim()) return "Enter your phone number.";
        var digits = value.replace(/[^0-9]/g, "");
        return digits.length >= 7 && digits.length <= 15
          ? ""
          : "Enter a phone number we can reach you on.";
      }
    };

    var inputs = [];
    Object.keys(rules).forEach(function (id) {
      var input = document.getElementById(id);
      if (input) inputs.push(input);
    });

    function errorBox(input) {
      return document.getElementById("error-" + input.id.replace("field-", ""));
    }

    function setError(input, message) {
      var box = errorBox(input);
      if (message) {
        input.setAttribute("aria-invalid", "true");
        if (box) {
          box.textContent = message;
          box.hidden = false;
        }
      } else {
        input.removeAttribute("aria-invalid");
        if (box) {
          box.textContent = "";
          box.hidden = true;
        }
      }
    }

    function validate(input) {
      var rule = rules[input.id];
      var message = rule ? rule(input.value) : "";
      setError(input, message);
      return !message;
    }

    // Returns the first invalid field, or null when everything passes.
    function validateAll() {
      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validate(input) && !firstInvalid) firstInvalid = input;
      });
      return firstInvalid;
    }

    function setStatus(text, state) {
      if (!statusEl) return;
      statusEl.textContent = text || "";
      statusEl.className = "quote-form__status" + (state ? " is-" + state : "");
    }

    function setSending(on) {
      sending = on;
      if (submitBtn) {
        submitBtn.disabled = on;
        submitBtn.textContent = on ? "Sending\u2026" : submitLabel;
      }
      form.setAttribute("aria-busy", on ? "true" : "false");
    }

    function fail(message) {
      setSending(false);
      setStatus(message, "error");
    }

    inputs.forEach(function (input) {
      // Only nag once a field has been submitted or has been touched.
      input.addEventListener("blur", function () {
        if (input.value.trim() || input.getAttribute("aria-invalid") === "true") {
          validate(input);
        }
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") validate(input);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // Duplicate submits: ignore while sending and after a confirmed send.
      if (sending || sent) return;

      var firstInvalid = validateAll();
      if (firstInvalid) {
        setStatus("Please check the highlighted fields.", "error");
        firstInvalid.focus();
        return;
      }

      // A real person never ticks this; a bot usually does. Never send.
      if (honeypot && honeypot.checked) {
        fail("We couldn't send your request. Please try again, or email " + MAIL + ".");
        return;
      }

      var accessKey = keyInput ? keyInput.value.trim() : "";
      if (!accessKey) {
        fail("This form isn't connected yet. Please email " + MAIL + " instead.");
        return;
      }

      if (typeof window.fetch !== "function") {
        fail("Your browser could not send this form. Please email " + MAIL + ".");
        return;
      }

      var payload = { access_key: accessKey };
      inputs.forEach(function (input) {
        payload[input.name] = input.value.trim();
      });
      var subjectField = form.querySelector('[name="subject"]');
      var fromField = form.querySelector('[name="from_name"]');
      if (subjectField) payload.subject = subjectField.value;
      if (fromField) payload.from_name = fromField.value;

      setSending(true);
      setStatus("Sending your request\u2026", "pending");

      var controller = typeof window.AbortController === "function"
        ? new window.AbortController()
        : null;
      var timer = window.setTimeout(function () {
        if (controller) controller.abort();
      }, TIMEOUT_MS);

      var options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      };
      if (controller) options.signal = controller.signal;

      window
        .fetch(ENDPOINT, options)
        .then(function (response) {
          return response
            .json()
            .then(function (body) {
              return { ok: response.ok, body: body || {} };
            })
            .catch(function () {
              return { ok: false, body: {} };
            });
        })
        .then(function (result) {
          window.clearTimeout(timer);

          // Success is shown only when the provider confirms it.
          if (result.ok && result.body.success === true) {
            sent = true;
            form.hidden = true;
            if (doneEl) {
              doneEl.hidden = false;
              doneEl.focus();
            }
            return;
          }

          fail(
            "We couldn't send your request. Please try again, or email " +
              MAIL +
              "."
          );
        })
        .catch(function (error) {
          window.clearTimeout(timer);
          var timedOut = error && error.name === "AbortError";
          fail(
            timedOut
              ? "That took too long, so we stopped. Please try again, or email " +
                  MAIL +
                  "."
              : "We couldn't send your request. Check your connection and try again, or email " +
                  MAIL +
                  "."
          );
        });
    });
  }
})();
