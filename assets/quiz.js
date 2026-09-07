/* ============================================================
   learn-ai-agents — reusable quiz engine (vanilla, no deps)
   ------------------------------------------------------------
   Usage in any lesson:

     <div class="quiz" data-quiz="lesson0001"></div>
     <script type="application/json" id="lesson0001">
       [
         {
           "q": "Question text?",
           "options": ["correct answer first is fine — order is shuffled"],
           "answer": 0,
           "explain": "Why this is right / why the others are wrong."
         }
       ]
     </script>
     <script src="../assets/quiz.js"></script>

   Behaviour:
   - Options are shuffled deterministically per quiz id (stable across reloads).
   - Immediate feedback: correct option turns green, wrong pick strikes
     through, explanation appears. First attempt is the one that counts.
   - First-attempt results persist in localStorage under
     "learn-ai-agents:<quizId>" so future sessions can spot weak spots
     (retrieval practice / spaced review).
   - Reopening a fully-answered quiz renders the review summary
     immediately from stored first attempts, no re-answering required.
   ============================================================ */

(function () {
  "use strict";

  function stableShuffle(items, seed) {
    var arr = items.map(function (item, i) { return { item: item, i: i }; });
    // deterministic mulberry32-style PRNG so option order is stable per quiz
    var t = seed;
    function rnd() {
      t += 0x6d2b79f5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    }
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function hashString(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function storageKey(quizId) { return "learn-ai-agents:" + quizId; }

  function loadAttempts(quizId) {
    try { return JSON.parse(localStorage.getItem(storageKey(quizId)) || "{}"); }
    catch (e) { return {}; }
  }

  function saveAttempt(quizId, qIndex, correct) {
    var attempts = loadAttempts(quizId);
    if (!("firstTry" in attempts)) attempts.firstTry = {};
    if (!(String(qIndex) in attempts.firstTry)) {   // first attempt only
      attempts.firstTry[qIndex] = correct;
      try { localStorage.setItem(storageKey(quizId), JSON.stringify(attempts)); } catch (e) {}
    }
  }

  function init() {
    var quizzes = document.querySelectorAll(".quiz[data-quiz]");
    quizzes.forEach(function (mount) {
      var quizId = mount.getAttribute("data-quiz");
      var dataEl = document.getElementById(quizId);
      if (!dataEl) {
        mount.innerHTML = '<p class="quiz-status">quiz data missing: #' + quizId + "</p>";
        return;
      }
      var questions;
      try { questions = JSON.parse(dataEl.textContent); }
      catch (e) {
        mount.innerHTML = '<p class="quiz-status">quiz data invalid: #' + quizId + "</p>";
        return;
      }

      var answered = 0, firstTryCorrect = 0;
      var firstTryResults = [];
      var past = loadAttempts(quizId).firstTry || {};

      questions.forEach(function (q, qi) {
        var field = document.createElement("div");
        field.className = "quiz-item";

        var qEl = document.createElement("p");
        qEl.className = "quiz-question";
        qEl.innerHTML = '<span class="quiz-qno">Q' + (qi + 1) + "</span>";
        qEl.appendChild(document.createTextNode(q.q));
        field.appendChild(qEl);

        var opts = document.createElement("div");
        opts.className = "quiz-options";
        var shuffled = stableShuffle(q.options, hashString(quizId + ":" + qi));
        var picked = false;

        shuffled.forEach(function (entry) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "quiz-opt";
          btn.textContent = entry.item;
          var isAnswer = entry.i === q.answer;

          btn.addEventListener("click", function () {
            if (picked) return;
            picked = true;
            answered++;
            var correct = isAnswer;
            saveAttempt(quizId, qi, correct);
            if (correct) firstTryCorrect++;
            firstTryResults[qi] = correct;
            opts.querySelectorAll(".quiz-opt").forEach(function (b) { b.disabled = true; });
            if (correct) btn.classList.add("correct");
            else {
              btn.classList.add("incorrect");
              opts.querySelectorAll(".quiz-opt").forEach(function (b) {
                if (b.textContent === q.options[q.answer]) b.classList.add("correct");
              });
            }
            var ex = field.querySelector(".quiz-explain");
            if (ex) ex.classList.add("show");
            var st = field.querySelector(".quiz-status");
            if (st) {
              st.textContent = correct
                ? "First attempt: correct."
                : "First attempt: incorrect — the highlighted option is right. Re-read the explanation, then continue.";
            }
            if (answered === questions.length) showScore();
          });
          opts.appendChild(btn);
        });

        field.appendChild(opts);

        var ex = document.createElement("p");
        ex.className = "quiz-explain";
        ex.textContent = q.explain;
        field.appendChild(ex);

        var st = document.createElement("p");
        st.className = "quiz-status";
        if (String(qi) in past) st.textContent = "Previous session first-try: " + (past[String(qi)] ? "correct" : "incorrect") + ".";
        field.appendChild(st);

        mount.appendChild(field);
      });

      var score = document.createElement("p");
      score.className = "quiz-score";
      mount.appendChild(score);

      function showScore() {
        score.classList.add("show");
        var pct = Math.round((firstTryCorrect / questions.length) * 100);
        var missList = [];
        questions.forEach(function (q, qi) {
          if (firstTryResults[qi] === false) {
            missList.push("Q" + (qi + 1) + " — correct answer: \u201C" + q.options[q.answer] + "\u201D");
          }
        });
        var head = "First-attempt score: " + firstTryCorrect + "/" + questions.length + " (" + pct + "%).";
        var tail;
        if (missList.length === 0) {
          tail = " Flawless — but fluency fades. Revisit this quiz in a few days to check storage strength.";
        } else {
          tail = " Review list: " + missList.join("; ") + ". These exact questions return, spaced, in later sessions.";
        }
        score.textContent = head + tail;
      }

      if (Object.keys(past).length === questions.length) {
        answered = questions.length;
        questions.forEach(function (q, qi) {
          firstTryResults[qi] = !!past[String(qi)];
          if (firstTryResults[qi]) firstTryCorrect++;
        });
        showScore();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
