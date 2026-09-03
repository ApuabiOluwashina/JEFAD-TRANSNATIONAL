/* ==========================================================================
   JEFAD Transnational — data loader & shared behaviour
   --------------------------------------------------------------------------
   1. Tries to load content from the Google Sheet named in config.js
      (public gviz JSON endpoint — no API key needed).
   2. Falls back to the bundled data/content.json if no Sheet ID is set,
      the Sheet can't be reached, or a tab is missing/empty.
   3. Binds any element with data-bind="settings.some_key" (and
      data-bind-href / data-bind-src variants) automatically.
   4. Fires a "jefad:data-ready" event with the full data object so each
      page's own small inline script can render its dynamic sections
      (service cards, audience chips, etc).
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.JEFAD_CONFIG || {};

  function gvizUrl(sheetId, tab) {
    return (
      "https://docs.google.com/spreadsheets/d/" +
      sheetId +
      "/gviz/tq?tqx=out:json&headers=1&sheet=" +
      encodeURIComponent(tab)
    );
  }

  function parseGviz(text) {
    // Response looks like: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    var start = text.indexOf("{");
    var end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Unrecognised Sheets response");
    var json = JSON.parse(text.slice(start, end + 1));
    var cols = (json.table.cols || []).map(function (c) {
      return (c.label || c.id || "").toString().trim().toLowerCase();
    });
    var rows = (json.table.rows || []).map(function (r) {
      var obj = {};
      (r.c || []).forEach(function (cell, i) {
        var key = cols[i];
        if (!key) return;
        obj[key] = cell && (cell.v !== null && cell.v !== undefined) ? cell.v : "";
      });
      return obj;
    });
    return rows;
  }

  function fetchTab(sheetId, tab) {
    return fetch(gvizUrl(sheetId, tab), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Sheet tab '" + tab + "' request failed (" + res.status + ")");
        return res.text();
      })
      .then(parseGviz);
  }

  function buildSettings(rows) {
    var out = {};
    rows.forEach(function (r) {
      if (r.key) out[String(r.key).trim()] = r.value !== undefined ? r.value : "";
    });
    return out;
  }

  function buildServices(rows) {
    return rows
      .filter(function (r) {
        return r.category;
      })
      .map(function (r) {
        return {
          order: Number(r.order) || 0,
          category: r.category,
          image: r.image || "",
          icon: r.icon || "",
          summary: r.summary || "",
          items: r.items
            ? String(r.items)
                .split("|")
                .map(function (s) {
                  return s.trim();
                })
                .filter(Boolean)
            : []
        };
      })
      .sort(function (a, b) {
        return a.order - b.order;
      });
  }

  function buildLists(rows) {
    var out = {};
    rows.forEach(function (r) {
      if (!r.section || !r.item) return;
      var section = String(r.section).trim();
      if (!out[section]) out[section] = [];
      out[section].push({ item: r.item, order: Number(r.order) || 0 });
    });
    Object.keys(out).forEach(function (section) {
      out[section].sort(function (a, b) {
        return a.order - b.order;
      });
    });
    return out;
  }

  function loadFromSheet() {
    var id = CFG.SHEET_ID;
    var tabs = CFG.TABS || { settings: "Settings", services: "Services", lists: "Lists" };
    if (!id) return Promise.reject(new Error("No SHEET_ID configured"));
    return Promise.all([fetchTab(id, tabs.settings), fetchTab(id, tabs.services), fetchTab(id, tabs.lists)]).then(
      function (results) {
        return {
          settings: buildSettings(results[0]),
          services: buildServices(results[1]),
          lists: buildLists(results[2]),
          source: "google-sheet"
        };
      }
    );
  }

  function loadFromFallback() {
    var path = (CFG.FALLBACK_JSON || "data/content.json").replace(/^\//, "");
    return fetch(resolvePath(path), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Fallback JSON missing");
        return res.json();
      })
      .then(function (json) {
        json.source = "local-fallback";
        return json;
      });
  }

  // All asset paths in the data (content.json / Sheet "image" column) are
  // written relative to the site root ("assets/img/..."), so the browser
  // resolves them correctly from any page whether the site is served at a
  // domain root or a GitHub Pages project sub-path (/jefad-website/) —
  // no rewriting needed. Kept as a passthrough so render.js has one place
  // to route asset paths through if that ever changes.
  function resolvePath(path) {
    return path;
  }
  window.JEFAD_RESOLVE = resolvePath;

  function bindSettings(settings) {
    document.querySelectorAll("[data-bind]").forEach(function (el) {
      var key = el.getAttribute("data-bind").replace(/^settings\./, "");
      if (settings[key] !== undefined && settings[key] !== "") {
        el.textContent = settings[key];
      }
    });
    document.querySelectorAll("[data-bind-href]").forEach(function (el) {
      var key = el.getAttribute("data-bind-href").replace(/^settings\./, "");
      var val = settings[key];
      if (!val) return;
      if (key.indexOf("email") !== -1) el.setAttribute("href", "mailto:" + val);
      else if (key === "phone") el.setAttribute("href", "tel:" + val.replace(/[^+\d]/g, ""));
      else el.setAttribute("href", val);
    });
    document.querySelectorAll("[data-bind-src]").forEach(function (el) {
      var key = el.getAttribute("data-bind-src").replace(/^settings\./, "");
      if (settings[key]) el.setAttribute("src", settings[key]);
    });
    // Hide social icons that have no URL configured
    document.querySelectorAll("[data-social]").forEach(function (el) {
      var key = el.getAttribute("data-social");
      if (!settings[key]) el.style.display = "none";
    });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });
    var yearEls = document.querySelectorAll("[data-year]");
    yearEls.forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    // The topbar + header float transparently over the hero photo (like the
    // reference template) but switch to a solid dark bar once the page is
    // scrolled, so the nav stays legible over plain white section content.
    var overlay = document.querySelector(".nav-overlay");
    if (overlay) {
      var onScroll = function () {
        overlay.classList.toggle("solid", window.scrollY > 40);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function fixAssetPaths() {
    document.querySelectorAll("img[data-src]").forEach(function (img) {
      img.src = resolvePath(img.getAttribute("data-src"));
    });
  }

  // Newsletter band on every page — same no-backend mailto approach as the
  // contact form (see contact.html) so it works with zero setup. Swap for
  // Mailchimp / a Google Form action once you have a real list (README.md).
  function initNewsletter() {
    var form = document.getElementById("newsletter-form");
    if (!form) return;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var to =
        (window.JEFAD_DATA && window.JEFAD_DATA.settings && window.JEFAD_DATA.settings.email_primary) ||
        "jefadtransnational@gmail.com";
      var email = form.email.value;
      window.location.href =
        "mailto:" + to + "?subject=" + encodeURIComponent("Newsletter sign-up") +
        "&body=" + encodeURIComponent("Please add this address to the JEFAD newsletter: " + email);
    });
  }

  function init() {
    initNav();
    initNewsletter();
    fixAssetPaths();
    loadFromSheet()
      .catch(function (err) {
        if (CFG.SHEET_ID) console.warn("Falling back to local content.json —", err.message);
        return loadFromFallback();
      })
      .then(function (data) {
        window.JEFAD_DATA = data;
        bindSettings(data.settings || {});
        var banner = document.querySelector(".data-status");
        if (banner) {
          banner.textContent =
            data.source === "google-sheet"
              ? "Live content loaded from Google Sheets."
              : "Showing default content (Google Sheet not connected yet — see README.md).";
          if (window.location.hash === "#debug") banner.classList.add("show");
        }
        document.dispatchEvent(new CustomEvent("jefad:data-ready", { detail: data }));
      })
      .catch(function (err) {
        console.error("JEFAD content failed to load:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
