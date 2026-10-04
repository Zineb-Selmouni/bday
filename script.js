(() => {
  const $ = (id) => document.getElementById(id);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // fallback reactions, for questions without their own win/lose lines
  const CORRECT = [
    "Correct. Don't let it go to your head (too late).",
    "Okay, so you DO listen when I talk 👀",
    "Look at you, using your one brain cell 🧠",
    "Correct. I'm impressed and slightly suspicious.",
    "Right answer. Screenshot this, it won't happen often 📸",
  ];
  const WRONG = [
    "Wrong. I'm telling everyone 📢",
    "That answer has been reported to the authorities 🚨",
    "Incorrect. Your birthday privileges are under review.",
    "Wow. Wrong. On your BIRTHDAY.",
    "I'm not mad, just disappointed. Okay, a bit mad.",
  ];
  const RANKS = [
    { min: 1, title: "Certified Bex Expert 🏆", line: "Flawless. You actually listen to me. Shocking." },
    { min: 0.75, title: "Basically a Genius 🧠", line: "Almost perfect. Almost." },
    { min: 0.5, title: "Mid, Honestly 😐", line: "Half right, half stinky." },
    { min: 0.25, title: "Do You Even Know Me? 🤨", line: "Some answers were… creative." },
    { min: 0, title: "Certified Stinky Bum 🦨", line: "Barely a point. On your birthday. Iconic." },
  ];

  // hangman commentary
  const MISS_LINES = [
    (l) => `${l}? Bold. Wrong, but bold.`,
    (l) => `There's no ${l}. Stop stalling 🤨`,
    (l) => `${l}?? In this economy?`,
    () => "Denial is not a strategy 🙄",
    () => "The truth hurts, huh? 🫠",
    () => "You're avoiding the obvious letters on purpose, aren't you",
  ];
  const HIT_LINES = [
    "Ooh, it's coming together 👀",
    "Warmer… and smellier 👃",
    "Keep going, the truth will set you free",
    "Oh no. I see where this is going 😭",
    "Yes! Spell it. Say it. Own it.",
    "The truth is slowly coming out 🫣",
  ];

  // balloon game commentary
  const SKUNK_LINES = [
    "Ew. You popped a skunk. Very on brand 🦨",
    "That was a skunk. Minus two. Smells about right.",
    "Why would you touch the skunk 😭",
    "Skunk popped. Stinky bums stick together, I guess",
  ];
  const POP_LINES = [
    "Pop pop pop 🎈",
    "Look at those reflexes",
    "Fastest thumbs in the west",
    "Okay, balloon assassin 😳",
  ];

  // like pick(), but never the same line twice in a row
  const lastPicked = new Map();
  function fresh(list) {
    let item;
    do item = pick(list);
    while (list.length > 1 && item === lastPicked.get(list));
    lastPicked.set(list, item);
    return item;
  }

  function comment(id, text) {
    const el = $(id);
    el.textContent = text;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  const SCREENS = ["welcome", "quiz", "results", "cake-screen"];
  let index = 0;
  let score = 0;
  let answered = false;

  function show(id) {
    SCREENS.forEach((s) => $(s).classList.toggle("active", s === id));
    window.scrollTo(0, 0);
  }

  /* ---------- sound ---------- */
  let audio;
  let muted = false;

  function tone(freqs, step, type = "sine") {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        const t = audio.currentTime + i * step;
        osc.type = type;
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.6);
        osc.connect(gain).connect(audio.destination);
        osc.start(t);
        osc.stop(t + step * 1.7);
      });
    } catch (e) {
      /* no audio, no problem */
    }
  }

  const sfx = {
    correct: () => tone([660, 880, 1320], 0.09),
    wrong: () => tone([220, 165], 0.16, "triangle"),
    pop: () => tone([520], 0.06),
    boing: () => tone([300, 600], 0.05, "square"),
    fanfare: () => tone([523, 659, 784, 1047, 784, 1047], 0.13),
  };

  $("mute").addEventListener("click", () => {
    muted = !muted;
    $("mute").textContent = muted ? "🔇" : "🔊";
    $("mute").setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
  });

  /* ---------- floating background ---------- */
  const FLOATERS = ["❤️", "🎈", "🌹", "🍒", "💋", "✨"];
  const floaterBox = document.querySelector(".floaters");
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.textContent = FLOATERS[i % FLOATERS.length];
    s.style.left = Math.random() * 100 + "vw";
    s.style.setProperty("--s", 1 + Math.random() * 1.8 + "rem");
    s.style.setProperty("--d", 12 + Math.random() * 14 + "s");
    s.style.setProperty("--delay", -Math.random() * 26 + "s");
    s.style.setProperty("--r", Math.random() * 80 - 40 + "deg");
    floaterBox.appendChild(s);
  }

  /* ---------- confetti ---------- */
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#d7263d", "#ff4d6d", "#f6a5b0", "#fff6f1", "#f7c46c", "#a3132a"];
  let pieces = [];
  let running = false;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();

  function piece(x, y, vx, vy, gravity, maxFall, emojis) {
    return {
      x, y, vx, vy, gravity, maxFall,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: pick(COLORS),
      emoji: emojis && pick(emojis),
      size: 22 + Math.random() * 16,
    };
  }

  function start() {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  // a quick pop of confetti from one spot
  function burst(x, y, count = 40) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i++) {
      pieces.push(piece(x, y, (Math.random() - 0.5) * 14, -Math.random() * 11 - 4, 0.4, 12));
    }
    start();
  }

  // confetti (or emoji, if given) raining from the top of the screen
  function rain(count = 200, emojis) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i++) {
      pieces.push(piece(Math.random() * innerWidth, -20 - Math.random() * innerHeight * 0.8,
        (Math.random() - 0.5) * 2, 2 + Math.random() * 3, 0.05, 3 + Math.random() * 3, emojis));
    }
    start();
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach((p) => {
      p.vy = Math.min(p.vy + p.gravity, p.maxFall);
      p.vx *= 0.99;
      p.x += p.vx + Math.sin(p.angle) * 0.6;
      p.y += p.vy;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.emoji) {
        ctx.rotate(p.angle * 0.25);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.rotate(p.angle);
        ctx.scale(Math.cos(p.angle * 2), 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
    pieces = pieces.filter((p) => p.y < innerHeight + 40);
    if (pieces.length) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  /* ---------- runaway buttons ---------- */
  // The button jumps somewhere random whenever the pointer gets near it (or it's
  // tapped / pressed), so it can never actually be clicked. Returns a reset function.
  function makeRunaway(btn, onDodge) {
    let dodges = 0;
    let last = 0;

    const dodge = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - last < 120) return; // touch fires pointerenter and pointerdown together
      last = now;
      dodges++;
      sfx.boing();

      const from = btn.getBoundingClientRect();
      if (!btn.classList.contains("runaway")) {
        btn.style.left = from.left + "px";
        btn.style.top = from.top + "px";
        btn.classList.add("runaway");
        void btn.offsetWidth;
      }
      if (onDodge) onDodge(dodges);

      const w = btn.offsetWidth;
      const h = btn.offsetHeight;
      const pad = 12;
      let x, y;
      let tries = 0;
      do {
        x = pad + Math.random() * Math.max(0, innerWidth - w - pad * 2);
        y = pad + Math.random() * Math.max(0, innerHeight - h - pad * 2);
      } while (++tries < 12 && Math.hypot(x - from.left, y - from.top) < 160);
      btn.style.left = x + "px";
      btn.style.top = y + "px";
    };

    btn.addEventListener("pointerenter", dodge);
    btn.addEventListener("pointerdown", dodge);
    btn.addEventListener("click", dodge);

    return () => {
      dodges = 0;
      btn.classList.remove("runaway");
      btn.style.left = btn.style.top = "";
    };
  }

  const NOPE_LINES = ["No thanks 🙅", "You don't have a choice", "Nope", "Too late", "It's happening", "Just press play 🙄"];
  const resetNope = makeRunaway($("nope"), (n) => {
    $("nope").textContent = NOPE_LINES[Math.min(n, NOPE_LINES.length - 1)];
  });

  /* ---------- quiz ---------- */
  $("q-count").textContent = QUESTIONS.length;

  function updateTop(done) {
    $("progress-label").textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
    $("score-label").textContent = `Score ${score}`;
    $("progress-fill").style.width = ((index + done) / QUESTIONS.length) * 100 + "%";
  }

  function render() {
    const item = QUESTIONS[index];
    const type = item.type || "choice";
    answered = false;
    stopPop();
    updateTop(0);
    $("question").textContent = item.q;
    $("options").hidden = type !== "choice" && type !== "runaway";
    $("hangman").hidden = type !== "hangman";
    $("pop").hidden = type !== "pop";
    $("reaction").classList.remove("shout");

    if (type === "hangman") renderHangman(item);
    else if (type === "pop") renderPop(item);
    else if (type === "runaway") renderRunaway(item);
    else renderOptions(item);

    $("feedback").classList.remove("show");
    const card = $("card");
    card.classList.remove("enter", "shake");
    void card.offsetWidth; // restart the slide-in animation
    card.classList.add("enter");
  }

  function optionButton(text, letter) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "option";
    b.innerHTML = `<span class="key">${letter}</span><span class="label"></span>`;
    b.querySelector(".label").textContent = text;
    $("options").appendChild(b);
    return b;
  }

  function renderOptions(item) {
    $("options").innerHTML = "";
    item.options.forEach((text, i) => {
      optionButton(text, "ABCDEF"[i]).addEventListener("click", () => choose(i));
    });
  }

  function shakeCard() {
    const card = $("card");
    card.classList.remove("enter", "shake");
    void card.offsetWidth;
    card.classList.add("shake");
  }

  function choose(i) {
    if (answered) return;

    const item = QUESTIONS[index];
    const buttons = [...$("options").children];

    buttons.forEach((b, j) => {
      b.disabled = true;
      if (j === item.answer) {
        b.classList.add("correct");
        b.querySelector(".key").textContent = "✓";
      } else if (j === i) {
        b.classList.add("wrong");
        b.querySelector(".key").textContent = "✗";
      } else {
        b.classList.add("dim");
      }
    });

    settle(i === item.answer, buttons[i], item.quips && item.quips[item.options[i]]);
  }

  // shared ending for every question type: score, sound, reaction, Next button
  function settle(right, anchor, quip) {
    answered = true;
    const item = QUESTIONS[index];

    if (right) {
      score++;
      sfx.correct();
      const r = anchor.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    } else {
      sfx.wrong();
      shakeCard();
    }

    updateTop(1);
    $("reaction").textContent = quip || (right ? item.win || fresh(CORRECT) : item.lose || fresh(WRONG));
    $("note").textContent = item.note || "";
    $("note").hidden = !item.note;
    $("next").textContent = index === QUESTIONS.length - 1 ? "See my score 🥁" : "Next question";
    $("feedback").classList.add("show");
    $("next").focus({ preventScroll: true });
    $("feedback").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
  }

  /* ---------- runaway question ---------- */
  function renderRunaway(item) {
    $("options").innerHTML = "";
    const yes = optionButton(item.yes, "A");
    const no = optionButton(item.no[0], "B");
    yes.classList.add("yes");

    yes.addEventListener("click", () => {
      if (answered) return;
      yes.disabled = true;
      yes.classList.add("correct");
      yes.querySelector(".key").textContent = "✓";
      no.hidden = true;
      settle(true, yes);
    });

    makeRunaway(no, (n) => {
      no.querySelector(".label").textContent = item.no[Math.min(n, item.no.length - 1)];
      yes.style.transform = `scale(${Math.min(1 + n * 0.06, 1.35)})`;
    });
  }

  /* ---------- balloon pop ---------- */
  let popGame;

  function renderPop(item) {
    $("arena").querySelectorAll(".balloon").forEach((b) => b.remove());
    $("pop-start").hidden = false;
    $("pop-comment").textContent = "";
    popGame = { item, count: 0, left: item.seconds, timers: [], over: false };
    popStats();
  }

  function popStats() {
    $("pop-count").textContent = `🎈 ${popGame.count} / ${popGame.item.goal}`;
    $("pop-time").textContent = `⏱ ${Math.max(0, popGame.left).toFixed(1)}s`;
  }

  // 0 at the start of the round, 1 at the end: balloons speed up as time runs out
  function popProgress() {
    return Math.min(1, (performance.now() - popGame.began) / (popGame.item.seconds * 1000));
  }

  function startPop() {
    const game = popGame;
    game.began = performance.now();
    $("pop-start").hidden = true;
    game.timers.push(setInterval(() => {
      game.left = game.item.seconds - (performance.now() - game.began) / 1000;
      popStats();
      if (game.left <= 0) endPop(game.count >= game.item.goal);
    }, 100));

    const spawnLoop = () => {
      if (game.over) return;
      spawnBalloon();
      game.timers.push(setTimeout(spawnLoop, 400 - 150 * popProgress()));
    };
    spawnLoop();
  }

  function spawnBalloon() {
    const item = popGame.item;
    const skunk = Math.random() < (item.skunks ?? 0.3);
    const speedUp = 1 - 0.4 * popProgress();
    const b = document.createElement("button");
    b.type = "button";
    b.className = "balloon";
    b.textContent = skunk ? "🦨" : "🎈";
    b.setAttribute("aria-label", skunk ? "Skunk (don't pop it)" : "Balloon");
    b.style.left = 4 + Math.random() * 80 + "%";
    b.style.setProperty("--d", (1.4 + Math.random()) * speedUp + "s");
    b.style.setProperty("--sway", (20 + Math.random() * 40) * (Math.random() < 0.5 ? -1 : 1) + "px");
    if (reducedMotion) {
      b.style.bottom = 10 + Math.random() * 70 + "%";
      setTimeout(() => b.remove(), 1000 * speedUp);
    }
    b.addEventListener("animationend", () => b.remove());
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      popBalloon(b, skunk);
    });
    b.addEventListener("click", () => popBalloon(b, skunk));
    $("arena").appendChild(b);
  }

  function popBalloon(b, skunk) {
    const game = popGame;
    if (game.over || b.classList.contains("popped")) return;
    b.style.transform = getComputedStyle(b).transform; // freeze it where it was hit
    b.classList.add("popped");

    if (skunk) {
      game.count = Math.max(0, game.count - (game.item.penalty ?? 2));
      sfx.wrong();
      comment("pop-comment", fresh(SKUNK_LINES));
    } else {
      game.count++;
      sfx.pop();
      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 14);
      if (game.count % 3 === 0) comment("pop-comment", fresh(POP_LINES));
    }

    popStats();
    if (game.count >= game.item.goal) endPop(true);
  }

  function stopPop() {
    if (!popGame) return;
    popGame.over = true;
    popGame.timers.forEach((t) => {
      clearInterval(t);
      clearTimeout(t);
    });
  }

  function endPop(won) {
    if (popGame.over) return;
    stopPop();
    $("arena").querySelectorAll(".balloon").forEach((b) => (b.style.animationPlayState = "paused"));
    $("pop-comment").textContent = won ? "" : `Only ${popGame.count}. Embarrassing.`;
    settle(won, $("arena"));
  }

  /* ---------- hangman ---------- */
  const LIVES = 6; // one per body part in the gallows drawing
  let hang;

  function renderHangman(item) {
    const phrase = item.phrase.toUpperCase();
    hang = { needed: new Set(phrase.replace(/[^A-Z]/g, "")), guessed: new Set(), misses: 0 };

    const box = $("phrase");
    box.innerHTML = "";
    phrase.split(/\s+/).forEach((word) => {
      const w = document.createElement("span");
      w.className = "word";
      [...word].forEach((ch) => {
        const isLetter = /[A-Z]/.test(ch);
        const s = document.createElement("span");
        s.className = isLetter ? "slot" : "slot shown";
        s.dataset.letter = ch;
        s.textContent = isLetter ? "" : ch;
        w.appendChild(s);
      });
      box.appendChild(w);
    });

    const keys = $("keyboard");
    keys.innerHTML = "";
    for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "letter";
      b.textContent = letter;
      b.dataset.letter = letter;
      b.addEventListener("click", () => guess(letter));
      keys.appendChild(b);
    }

    $("gallows").classList.remove("lost");
    $("gallows").querySelectorAll(".part").forEach((p) => p.classList.remove("on"));
    $("hang-comment").textContent = "Go on then. Pick a letter 😏";
    updateLives();
  }

  function updateLives() {
    const left = LIVES - hang.misses;
    $("lives").textContent = "❤️".repeat(left) + "🖤".repeat(hang.misses);
  }

  function guess(letter) {
    if (answered || hang.guessed.has(letter)) return;
    hang.guessed.add(letter);
    const key = $("keyboard").querySelector(`[data-letter="${letter}"]`);
    key.disabled = true;

    if (hang.needed.has(letter)) {
      key.classList.add("hit");
      $("phrase").querySelectorAll(`.slot[data-letter="${letter}"]`).forEach((s) => {
        s.textContent = letter;
        s.classList.add("shown");
      });
      if ([...hang.needed].every((l) => hang.guessed.has(l))) {
        endHangman(true);
      } else {
        sfx.pop();
        comment("hang-comment", fresh(HIT_LINES));
      }
    } else {
      key.classList.add("miss");
      hang.misses++;
      $("gallows").querySelectorAll(".part")[hang.misses - 1].classList.add("on");
      updateLives();
      if (hang.misses >= LIVES) {
        endHangman(false);
      } else {
        sfx.wrong();
        shakeCard();
        comment("hang-comment", hang.misses === LIVES - 1 ? "One heart left. Just admit it 🫠" : fresh(MISS_LINES)(letter));
      }
    }
  }

  function endHangman(won) {
    $("keyboard").querySelectorAll("button").forEach((b) => (b.disabled = true));
    $("phrase").querySelectorAll(".slot:not(.shown)").forEach((s) => {
      s.textContent = s.dataset.letter;
      s.classList.add("shown", "missed");
    });
    if (!won) $("gallows").classList.add("lost");
    $("hang-comment").textContent = won ? "Say it louder for the people in the back 📢" : "";
    settle(won, $("phrase"));
    if (won) {
      $("reaction").classList.add("shout");
      rain(80, ["💩", "🦨"]);
    }
  }

  function next() {
    if (index < QUESTIONS.length - 1) {
      index++;
      render();
    } else {
      finish();
    }
  }

  function finish() {
    const total = QUESTIONS.length;
    const ratio = score / total;
    const rank = RANKS.find((r) => ratio >= r.min);
    $("final-score").textContent = score;
    $("final-total").textContent = total;
    $("rank").textContent = rank.title;
    $("rank-line").textContent = rank.line;
    show("results");
    sfx.fanfare();
    if (ratio >= 0.5) rain(160);
  }

  function restart() {
    index = 0;
    score = 0;
    render();
    show("quiz");
  }

  /* ---------- cake ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const CANDLES = 5;
  let lit = CANDLES;

  function svg(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function candleHint() {
    $("candle-hint").textContent = lit
      ? `${lit} candle${lit === 1 ? "" : "s"} to go`
      : "";
  }

  function buildCake() {
    const group = $("candles");
    group.innerHTML = "";
    lit = CANDLES;
    $("cake-title").textContent = "Make a wish, then tap the candles";
    $("bday-message").classList.remove("show");
    $("envelope").hidden = false;
    $("letter").hidden = true;
    candleHint();

    for (let i = 0; i < CANDLES; i++) {
      const x = 95 + i * 27.5;
      const g = svg("g", { class: "candle", tabindex: "0", role: "button", "aria-label": `Blow out candle ${i + 1}` }, group);
      svg("rect", { x: x - 13, y: 22, width: 26, height: 70, fill: "transparent" }, g);
      svg("rect", { x: x - 4, y: 54, width: 8, height: 37, rx: 2, fill: "#fff6f1" }, g);
      svg("rect", { x: x - 4, y: 62, width: 8, height: 4, fill: "#f6a5b0" }, g);
      svg("rect", { x: x - 4, y: 74, width: 8, height: 4, fill: "#f6a5b0" }, g);
      svg("line", { x1: x, y1: 49, x2: x, y2: 54, stroke: "#3a0710", "stroke-width": 1.5 }, g);
      const flame = svg("g", { class: "flame" }, g);
      svg("path", { d: `M${x} 28 C${x + 8} 38 ${x + 8} 48 ${x} 51 C${x - 8} 48 ${x - 8} 38 ${x} 28 Z`, fill: "#f7c46c" }, flame);
      svg("path", { d: `M${x} 37 C${x + 4} 43 ${x + 4} 48 ${x} 50 C${x - 4} 48 ${x - 4} 43 ${x} 37 Z`, fill: "#fff6f1" }, flame);

      const blow = () => blowOut(g, x);
      g.addEventListener("click", blow);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          blow();
        }
      });
    }
  }

  function blowOut(candle, x) {
    if (candle.classList.contains("out")) return;
    candle.classList.add("out");
    candle.setAttribute("aria-label", "Candle blown out");
    sfx.pop();
    const puff = svg("circle", { class: "smoke", cx: x, cy: 44, r: 4, fill: "rgba(255,246,241,.6)" }, candle);
    setTimeout(() => puff.remove(), 1300);
    lit--;
    candleHint();
    if (!lit) setTimeout(celebrate, 450);
  }

  function celebrate() {
    $("cake-title").textContent = "Wish granted ✨";
    $("bday-message").classList.add("show");
    sfx.fanfare();
    rain(260);
    setTimeout(() => rain(160), 1400);
  }

  function openLetter() {
    $("letter-greeting").textContent = LETTER.greeting;
    const body = $("letter-body");
    body.innerHTML = "";
    LETTER.paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
    });
    $("letter-signoff").textContent = LETTER.signoff;
    $("letter-name").textContent = LETTER.name || "";
    $("letter-name").hidden = !LETTER.name;
    const ps = $("letter-ps");
    ps.innerHTML = "";
    [].concat(LETTER.ps || []).forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      ps.appendChild(p);
    });

    $("envelope").hidden = true;
    $("letter").hidden = false;
    sfx.correct();
    rain(50, ["❤️", "💌"]);
  }

  /* ---------- wiring ---------- */
  $("start").addEventListener("click", restart);
  $("next").addEventListener("click", next);
  $("retry").addEventListener("click", restart);
  $("pop-start").addEventListener("click", startPop);
  $("envelope").addEventListener("click", openLetter);
  $("to-cake").addEventListener("click", () => {
    buildCake();
    show("cake-screen");
  });
  $("replay").addEventListener("click", () => {
    resetNope();
    $("nope").textContent = NOPE_LINES[0];
    show("welcome");
  });

  // keyboard: 1-6 or A-F to answer (any letter in hangman), Enter for next
  document.addEventListener("keydown", (e) => {
    if (!$("quiz").classList.contains("active") || answered || e.ctrlKey || e.metaKey || e.altKey) return;
    const type = QUESTIONS[index].type || "choice";
    if (type === "hangman") {
      if (/^[a-z]$/i.test(e.key)) guess(e.key.toUpperCase());
      return;
    }
    const n = "123456".indexOf(e.key) >= 0 ? "123456".indexOf(e.key) : "abcdef".indexOf(e.key.toLowerCase());
    if (type === "runaway" && n === 0) $("options").firstChild.click();
    if (type === "choice" && n >= 0 && n < QUESTIONS[index].options.length) choose(n);
  });
})();
