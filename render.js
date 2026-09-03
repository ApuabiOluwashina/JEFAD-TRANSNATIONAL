/* ==========================================================================
   JEFAD Transnational — small reusable render helpers
   Used by the inline "page script" at the bottom of each HTML page to turn
   the loaded data (Google Sheet or fallback JSON) into DOM markup.
   ========================================================================== */
window.JEFAD_UI = (function () {
  "use strict";

  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function resolve(path) {
    return window.JEFAD_RESOLVE ? window.JEFAD_RESOLVE(path) : path;
  }

  // Renders an array of service objects into a grid container as icon
  // tiles (icon circle + yellow corner-arrow), first tile highlighted.
  function serviceCards(container, services, opts) {
    opts = opts || {};
    if (!container || !services) return;
    container.innerHTML = "";
    services.forEach(function (svc, i) {
      var tile = el("article", "service-tile" + (i === 0 && !opts.noHighlight ? " highlight" : ""));
      tile.appendChild(el("div", "num-icon", svc.icon || "★"));
      tile.appendChild(el("span", "corner-link", "&#8599;"));
      tile.appendChild(el("h3", null, svc.category));
      tile.appendChild(el("p", null, svc.summary || ""));
      container.appendChild(tile);
    });
  }

  // Full detail block (icon + all bullet items) - used on the Services page.
  function serviceDetail(container, services) {
    if (!container || !services) return;
    container.innerHTML = "";
    services.forEach(function (svc) {
      var row = el("div", "split");
      var media = el("div", "about-media");
      if (svc.image) {
        var img = el("img");
        img.src = resolve(svc.image);
        img.alt = svc.category;
        // No loading="lazy" here on purpose: these are small (~20KB) images
        // in a long detail list, and lazy-loading them caused some browsers
        // (and screenshot/print tooling that doesn't scroll incrementally)
        // to never trigger the image's intersection load — worse UX than
        // the negligible bandwidth this would have saved.
        media.appendChild(img);
      } else {
        var ph = el("div", "thumb-fallback", svc.icon || "★");
        ph.style.borderRadius = "10px";
        ph.style.height = "260px";
        ph.style.boxShadow = "var(--shadow)";
        media.appendChild(ph);
      }
      var copy = el("div");
      copy.appendChild(el("span", "eyebrow", (svc.icon || "") + " Service Pillar"));
      copy.appendChild(el("h3", null, svc.category));
      copy.appendChild(el("p", null, svc.summary || ""));
      var ul = el("ul", "check-list");
      (svc.items || []).forEach(function (t) {
        ul.appendChild(el("li", null, t));
      });
      copy.appendChild(ul);
      row.appendChild(media);
      row.appendChild(copy);
      container.appendChild(row);
    });
  }

  function chipList(container, list) {
    if (!container || !list) return;
    container.innerHTML = "";
    list.forEach(function (row) {
      container.appendChild(el("span", "chip", row.item));
    });
  }

  function checkList(container, list) {
    if (!container || !list) return;
    container.innerHTML = "";
    list.forEach(function (row) {
      container.appendChild(el("li", null, row.item));
    });
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      e.setAttribute(k, attrs[k]);
    });
    return e;
  }

  // Renders a row of circular stat badges. Values that are genuine
  // percentages ("75%") get a proportional ring; everything else (counts,
  // registration numbers, etc.) gets a full decorative ring so we never
  // draw a fake percentage for a number that isn't one. Long values that
  // won't fit inside a ring fall back to a plain flat stat.
  function ringStats(container, stats) {
    if (!container || !stats) return;
    container.innerHTML = "";
    var r = 42, c = 2 * Math.PI * r;
    stats.forEach(function (s) {
      var value = String(s.num || "");
      if (value.length > 5) {
        var flat = el("div", "ring");
        flat.style.width = "auto";
        var num = el("div", null, value);
        num.style.cssText = "font-size:22px;font-weight:900;color:#fff;margin-bottom:6px;";
        flat.appendChild(num);
        flat.appendChild(el("div", "ring-label", s.label));
        container.appendChild(flat);
        return;
      }
      var pct = /^(\d+)%$/.exec(value);
      var fraction = pct ? Math.min(100, parseInt(pct[1], 10)) / 100 : 1;
      var wrap = el("div", "ring");
      var svg = svgEl("svg", { width: 100, height: 100, viewBox: "0 0 100 100" });
      svg.appendChild(
        svgEl("circle", { cx: 50, cy: 50, r: r, fill: "none", stroke: "rgba(255,255,255,0.18)", "stroke-width": 6 })
      );
      var arc = svgEl("circle", {
        cx: 50,
        cy: 50,
        r: r,
        fill: "none",
        stroke: "#d7e023",
        "stroke-width": 6,
        "stroke-linecap": "round",
        "stroke-dasharray": c,
        "stroke-dashoffset": c * (1 - fraction)
      });
      svg.appendChild(arc);
      var text = svgEl("text", { x: 50, y: 56, "text-anchor": "middle", class: "ring-num" });
      text.textContent = value;
      svg.appendChild(text);
      wrap.appendChild(svg);
      wrap.appendChild(el("div", "ring-label", s.label));
      container.appendChild(wrap);
    });
  }

  // Three-column "Cleaner / Stronger / Better"-style highlight row.
  function reasonCols(container, list) {
    if (!container || !list) return;
    container.innerHTML = "";
    list.forEach(function (row) {
      var col = el("div", "reason-col");
      col.appendChild(el("div", "chev", "&#8250;"));
      col.appendChild(el("h4", null, row.item));
      container.appendChild(col);
    });
  }

  // "Commitment" cards — an honest stand-in for a testimonials section.
  // We never fabricate client quotes/names, so this renders short factual
  // statements (e.g. from the Lists "why_partner" section) instead.
  function commitmentCards(container, list, opts) {
    opts = opts || {};
    if (!container || !list) return;
    container.innerHTML = "";
    var icons = opts.icons || ["🤝", "📣", "🌱", "🔗", "💬", "🚀", "⭐"];
    list.forEach(function (row, i) {
      var card = el("div", "commitment-card");
      card.appendChild(el("div", "avatar-icon", icons[i % icons.length]));
      card.appendChild(el("h4", null, row.item));
      if (opts.subtitle) card.appendChild(el("p", null, opts.subtitle));
      container.appendChild(card);
    });
  }

  return {
    el: el,
    resolve: resolve,
    serviceCards: serviceCards,
    serviceDetail: serviceDetail,
    chipList: chipList,
    checkList: checkList,
    ringStats: ringStats,
    commitmentCards: commitmentCards,
    reasonCols: reasonCols
  };
})();
