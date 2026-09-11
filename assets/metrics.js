/* ============================================================
   learn-ai-agents — metric labs (vanilla, no deps)
   ------------------------------------------------------------
   Interactive mounts for READING RAG metrics. Style: metrics.css.

     <div class="rank-lab" data-ranking="0,1,2,3" data-gold="0,1" data-k="2"></div>
     <div class="faith-lab" data-claims='[["claim text",true],["other claim",false]]'></div>
     <link rel="stylesheet" href="../assets/metrics.css">
     <script src="../assets/metrics.js"></script>

   RankLab — one query's ranking, chunk indices best-first. Click a
   chip to toggle "a human marked this chunk gold"; slide k to move
   the top-k window (chips beyond k dim). Readouts always name the
   numerator and the denominator, then the fraction, then the decimal:
   recall@k, precision@k, and this row's 1/rank share of MRR.

   FaithLab — the judge's decomposition of one answer into claims.
   Click a badge to flip that claim's verdict; the faithfulness ratio
   updates live (eq. 16.26: the judge enumerates, the code divides).
   ============================================================ */

(function () {
  "use strict";

  function f3(n) { return n.toFixed(3); }

  function span(cls, text) {
    var s = document.createElement("span");
    s.className = cls;
    s.textContent = text;
    return s;
  }

  /* ---------- RankLab: the ranking machine ---------- */

  function mountRankLab(el) {
    var ranking = (el.getAttribute("data-ranking") || "0,1,2,3")
      .split(",").map(function (s) { return Number(s.trim()); });
    var goldSet = {};
    (el.getAttribute("data-gold") || "")
      .split(",").map(function (s) { return s.trim(); }).filter(Boolean)
      .forEach(function (g) { goldSet[Number(g)] = true; });
    var k = Number(el.getAttribute("data-k") || "2");
    if (!(k >= 1 && k <= ranking.length)) k = Math.min(2, ranking.length);

    el.appendChild(span("ml-title", "the ranking machine — one query's chunks, best first"));

    var chipsEl = document.createElement("div");
    chipsEl.className = "ml-chips";
    el.appendChild(chipsEl);

    var kRow = document.createElement("div");
    kRow.className = "ml-krow";
    kRow.appendChild(span("ml-klabel", "k"));
    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = "1";
    slider.max = String(ranking.length);
    slider.value = String(k);
    var kLabel = span("", "");
    kRow.appendChild(slider);
    kRow.appendChild(kLabel);
    el.appendChild(kRow);

    var readouts = document.createElement("div");
    readouts.className = "ml-readouts";
    var rRecall = document.createElement("p"); rRecall.className = "ml-readout";
    var rPrec = document.createElement("p"); rPrec.className = "ml-readout";
    var rRank = document.createElement("p"); rRank.className = "ml-readout";
    readouts.appendChild(rRecall);
    readouts.appendChild(rPrec);
    readouts.appendChild(rRank);
    el.appendChild(readouts);

    el.appendChild(span("ml-hint", "click a chip to toggle whether a human marked it gold · slide k to move the top-k window"));

    var chipEls = ranking.map(function (chunk, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ml-chip";
      b.appendChild(span("ml-rank", "rank " + (i + 1)));
      b.appendChild(span("ml-chunk", "c" + chunk));
      b.addEventListener("click", function () {
        if (goldSet[chunk]) delete goldSet[chunk]; else goldSet[chunk] = true;
        render();
      });
      chipsEl.appendChild(b);
      return b;
    });

    slider.addEventListener("input", function () {
      k = Number(slider.value);
      render();
    });

    function render() {
      var goldTotal = ranking.filter(function (c) { return goldSet[c]; }).length;
      var firstGoldRank = 0;
      for (var i = 0; i < ranking.length; i++) {
        if (goldSet[ranking[i]]) { firstGoldRank = i + 1; break; }
      }
      chipEls.forEach(function (b, i) {
        var chunk = ranking[i];
        b.classList.toggle("gold", !!goldSet[chunk]);
        b.classList.toggle("out", i >= k);
        b.classList.toggle("first", firstGoldRank !== 0 && i === firstGoldRank - 1);
      });
      kLabel.textContent = "k = " + k + " — top-" + k + " fed to the model";

      if (goldTotal === 0) {
        rRecall.textContent = "recall: no gold marked — this row has no denominator yet";
        rPrec.textContent = "precision: no gold marked — mark a chip to measure dilution";
        rRank.textContent = "1/rank: no gold anywhere — this row would contribute 0.000 to MRR";
        return;
      }

      var goldIn = 0;
      for (var j = 0; j < k; j++) if (goldSet[ranking[j]]) goldIn++;

      rRecall.innerHTML =
        "recall@" + k + " — gold inside window <b>" + goldIn + "</b> · gold existing <b>" + goldTotal +
        "</b> = <span class='ml-frac'>" + goldIn + "/" + goldTotal + "</span> → <b>" + f3(goldIn / goldTotal) + "</b>";
      rPrec.innerHTML =
        "precision@" + k + " — gold inside window <b>" + goldIn + "</b> · window width <b>" + k +
        "</b> = <span class='ml-frac'>" + goldIn + "/" + k + "</span> → <b>" + f3(goldIn / k) + "</b>";
      rRank.innerHTML = firstGoldRank
        ? "1/rank (this row's MRR share) — first gold at rank <b>" + firstGoldRank +
          "</b> = <span class='ml-frac'>1/" + firstGoldRank + "</span> → <b>" + f3(1 / firstGoldRank) + "</b>"
        : "1/rank (this row's MRR share) — gold exists but sits outside the ranking → <b>0.000</b>";
    }

    render();
  }

  /* ---------- FaithLab: the claims bench ---------- */

  function mountFaithLab(el) {
    var claims;
    try { claims = JSON.parse(el.getAttribute("data-claims") || "[]"); }
    catch (e) { el.textContent = "faith-lab: data-claims is not valid JSON"; return; }

    el.appendChild(span("ml-title", "the claims bench — the judge's decomposition of one answer"));

    var list = document.createElement("div");
    el.appendChild(list);

    var readout = document.createElement("p");
    readout.className = "ml-readout";
    var wrap = document.createElement("div");
    wrap.className = "ml-readouts";
    wrap.appendChild(readout);
    el.appendChild(wrap);

    el.appendChild(span("ml-hint", "click a badge to flip the judge's verdict on that claim"));

    claims.forEach(function (pair) {
      var row = document.createElement("div");
      row.className = "ml-claim";
      var badge = document.createElement("button");
      badge.type = "button";
      function paint() {
        badge.className = "ml-badge " + (pair[1] ? "on" : "off");
        badge.textContent = pair[1] ? "✓ in context" : "✗ from nowhere";
      }
      badge.addEventListener("click", function () {
        pair[1] = !pair[1];
        paint();
        render();
      });
      paint();
      row.appendChild(badge);
      row.appendChild(span("ml-claim-text", pair[0]));
      list.appendChild(row);
    });

    function render() {
      var sup = claims.filter(function (p) { return p[1]; }).length;
      readout.innerHTML =
        "faithfulness — claims supported <b>" + sup + "</b> · claims total <b>" + claims.length +
        "</b> = <span class='ml-frac'>" + sup + "/" + claims.length + "</span> → <b>" + f3(sup / claims.length) +
        "</b> (eq. 16.26: the judge enumerates, the code divides)";
    }

    render();
  }

  function init() {
    document.querySelectorAll(".rank-lab").forEach(mountRankLab);
    document.querySelectorAll(".faith-lab").forEach(mountFaithLab);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
