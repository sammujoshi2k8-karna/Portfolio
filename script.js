document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  // 1. Clock
  const updateClock = () => { $("live-clock").innerText = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
  setInterval(updateClock, 1000); updateClock();

  // 2. Intro
  $("enter-btn").addEventListener("click", () => {
    $("intro-screen").classList.add("fade-out");
    setTimeout(() => {
      $("intro-screen").style.display = "none";
      $("app").classList.remove("hidden");
      document.body.classList.remove("loading-state");
      setupBadge();
    }, 700);
  });

  // 3. Hanging ID badge: a verlet-rope lanyard you can drag
  const wrap = $("badge-wrapper"), cv = $("lanyard"), card = $("id-card"), inner = card.querySelector(".id-inner");
  const ctx = cv.getContext("2d");
  const N = 8, SEG = 36;
  let W = 0, H = 0, pts = [], drag = false, grab = { x: 0, y: 0 }, vx = 0, started = false, tap = 0, moved = 0;

  function setupBadge() {
    const r = wrap.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    W = r.width; H = r.height;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    pts = [];
    for (let i = 0; i < N; i++) { const x = W / 2 + i * SEG * 0.9, y = -10 + i * SEG * 0.45; pts.push({ x, y, ox: x, oy: y }); }
    if (!started) { started = true; loop(); }
  }
  window.addEventListener("resize", () => { if (started) setupBadge(); });

  function step() {
    const last = N - 1;
    for (let i = 1; i < N; i++) {
      if (drag && i === last) continue;
      const a = pts[i], dx = (a.x - a.ox) * 0.985, dy = (a.y - a.oy) * 0.985;
      a.ox = a.x; a.oy = a.y; a.x += dx; a.y += dy + 0.7;
    }
    for (let k = 0; k < 14; k++) {
      pts[0].x = W / 2; pts[0].y = -10;
      for (let i = 0; i < last; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1, diff = (dist - SEG) / dist;
        let wa = i === 0 ? 0 : 0.5, wb = i === 0 ? 1 : 0.5;
        if (drag && i + 1 === last) { wb = 0; wa = i === 0 ? 0 : 1; }
        a.x += dx * diff * wa; a.y += dy * diff * wa;
        b.x -= dx * diff * wb; b.y -= dy * diff * wb;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = ctx.lineJoin = "round";
    const path = () => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < N; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); };
    ctx.shadowColor = "rgba(255,255,255,.35)"; ctx.shadowBlur = 12; ctx.strokeStyle = "#e6e6e6"; ctx.lineWidth = 12; path();
    ctx.shadowBlur = 0; ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); path(); ctx.setLineDash([]);
    const l = pts[N - 1], p = pts[N - 3];
    const rot = -Math.atan2(l.x - p.x, l.y - p.y);
    vx += ((l.x - l.ox) - vx) * 0.2;
    const ry = Math.max(-28, Math.min(28, vx * 3));
    card.style.transform = `translate(${l.x}px,${l.y - 4}px) rotate(${rot}rad) rotateY(${ry}deg)`;
  }

  function loop() { step(); draw(); requestAnimationFrame(loop); }

  const local = e => { const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  card.addEventListener("pointerdown", e => {
    drag = true; moved = 0; card.setPointerCapture(e.pointerId);
    const m = local(e), l = pts[N - 1]; grab = { x: m.x - l.x, y: m.y - l.y };
  });
  card.addEventListener("pointermove", e => {
    if (!drag) return;
    const m = local(e), l = pts[N - 1];
    const nx = Math.max(20, Math.min(W - 20, m.x - grab.x)), ny = Math.max(40, Math.min(H - 20, m.y - grab.y));
    moved += Math.abs(nx - l.x) + Math.abs(ny - l.y);
    l.ox = l.x; l.oy = l.y; l.x = nx; l.y = ny;
    const s = Math.hypot(l.x - l.ox, l.y - l.oy);
    if (s > 40) { l.ox = l.x - (l.x - l.ox) * 40 / s; l.oy = l.y - (l.y - l.oy) * 40 / s; }
  });
  const release = () => {
    if (!drag) return; drag = false;
    const now = Date.now();
    if (moved < 8) { if (now - tap < 350) { inner.classList.toggle("flipped"); tap = 0; } else tap = now; }
  };
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);

  const toggleBtn = $("toggle-id-badge");
  toggleBtn.addEventListener("click", () => {
    const showing = wrap.classList.toggle("show");
    toggleBtn.innerText = showing ? "HIDE CARD" : "SHOW CARD";
    if (showing) setTimeout(setupBadge, 50);
  });

  // Soft spotlight that follows the mouse
  window.addEventListener("pointermove", e => {
    document.body.style.setProperty("--mx", e.clientX + "px");
    document.body.style.setProperty("--my", e.clientY + "px");
  });

  // 4. Tabs
  const tabBtns = document.querySelectorAll(".tab-btn"), tabPanels = document.querySelectorAll(".tab-panel");
  tabBtns.forEach(btn => btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabPanels.forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const t = $(`tab-${btn.dataset.tab}`); if (t) t.classList.add("active");
  }));

  // 5. 3D tilt on tiles and project cards
  document.querySelectorAll(".tilt").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(600px) rotateX(${-y * 18}deg) rotateY(${x * 18}deg) translateZ(10px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });

  // 6. About modal with typewriter heading
  const modal = $("about-modal"), title = $("about-title");
  let typer;
  const openAbout = e => {
    if (e) e.preventDefault();
    modal.classList.add("active"); document.body.style.overflow = "hidden";
    clearInterval(typer); title.textContent = ""; let i = 0; const txt = "About Myself";
    typer = setInterval(() => { title.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(typer); }, 80);
  };
  const closeAbout = () => { modal.classList.remove("active"); document.body.style.overflow = "auto"; };
  $("open-about-modal").addEventListener("click", openAbout);
  $("nav-about-trigger").addEventListener("click", openAbout);
  $("close-about-modal").addEventListener("click", closeAbout);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAbout(); });

  // 7. Contact form opens your email app with the message filled in
  $("contact-form").addEventListener("submit", e => {
    e.preventDefault();
    const n = $("f-name").value.trim(), m = $("f-msg").value.trim();
    location.href = `mailto:samarthjoshi2k8@gmail.com?subject=${encodeURIComponent("Portfolio message from " + n)}&body=${encodeURIComponent(m)}`;
  });
});
