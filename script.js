const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

(function () {
  const ring = document.querySelector(".home .scroll-ring-text");
  if (!ring) return;

  const characters = Array.from(ring.textContent);
  const letters = document.createDocumentFragment();
  ring.style.setProperty("--char-count", characters.length);
  characters.forEach(function (character, index) {
    const letter = document.createElement("span");
    letter.className = "scroll-ring-char";
    letter.style.setProperty("--char-index", index);
    letter.textContent = character;
    letters.appendChild(letter);
  });
  ring.replaceChildren(letters);
  ring.classList.add("is-ready");

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = null;
  function update() {
    frame = null;
    ring.style.transform = motionPreference.matches
      ? "none"
      : "rotate(" + (Math.max(0, window.scrollY) * 0.12) + "deg)";
  }
  window.addEventListener("scroll", function () {
    if (motionPreference.matches || frame !== null) return;
    frame = window.requestAnimationFrame(update);
  }, { passive: true });
  motionPreference.addEventListener("change", update);
  window.addEventListener("pageshow", update);
  update();
})();

const header = document.querySelector(".site-header");
const hero = document.querySelector(".hero");

(function () {
  if (!header) return;
  const body = document.body;
  const isHome = body.classList.contains("home");

  function colourAt(y) {
    const stack = document.elementsFromPoint(window.innerWidth / 2, y);
    for (let i = 0; i < stack.length; i++) {
      let el = stack[i];
      if (header.contains(el) || el.closest(".brand-movers")) continue;

      if (el.getBoundingClientRect().width < 60) continue;
      while (el && el !== document.documentElement) {
        const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        if (m && (m.length < 4 || Number(m[3]) > 0.5)) return m.slice(0, 3).map(Number);
        el = el.parentElement;
      }
    }
    return [223, 192, 182];
  }

  function same(a, b) { return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }
  function rgba(c) { return "rgba(" + c.join(", ") + ", 0.50)"; }

  let ticking = false;
  function update() {
    ticking = false;

    if (document.documentElement.classList.contains("menu-open")) return;

    const overHero = isHome && hero && window.scrollY < window.innerHeight * 0.5;
    body.classList.toggle("over-hero", overHero);

    const h = header.offsetHeight;
    const topColour = colourAt(1);
    const bottomColour = colourAt(h - 1);

    if (overHero) {
      header.style.background = "";
    } else if (same(topColour, bottomColour)) {
      header.style.background = rgba(topColour);
    } else {
      let lo = 1, hi = h - 1;
      for (let k = 0; k < 7; k++) {
        const mid = (lo + hi) / 2;
        if (same(colourAt(mid), topColour)) lo = mid; else hi = mid;
      }
      const edge = Math.round(hi);
      header.style.background = "linear-gradient(to bottom, " +
        rgba(topColour) + " 0, " + rgba(topColour) + " " + edge + "px, " +
        rgba(bottomColour) + " " + edge + "px, " + rgba(bottomColour) + " 100%)";
    }

    const mid = overHero ? [42, 41, 43] : colourAt(h / 2);
    const lum = (0.2126 * mid[0] + 0.7152 * mid[1] + 0.0722 * mid[2]) / 255;
    header.dataset.tone = lum > 0.5 ? "light" : (mid[0] > mid[1] + 35 ? "wine" : "dark");
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", update);
  update();
})();

function fitBrandNames() {
  document.querySelectorAll(".site-header .brand-name, .hero-name").forEach(function (el) {
    el.style.fontSize = "";
    let size = parseFloat(getComputedStyle(el).fontSize);
    const smallest = size * 0.5;

    const room = function () {
      return el.classList.contains("hero-name") ? window.innerWidth * 0.92 : el.clientWidth;
    };
    while (el.scrollWidth > room() + 1 && size > smallest) {
      size = size * 0.95;
      el.style.fontSize = size.toFixed(1) + "px";
    }
  });
}
fitBrandNames();
window.addEventListener("load", fitBrandNames);
window.addEventListener("resize", fitBrandNames);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBrandNames);

(function () {
  const MOVE_DISTANCE = 0.6;

  const body = document.body;
  if (!body.classList.contains("home") || !header || prefersLessMotion) return;
  const name = document.querySelector(".hero-name");
  const toName = header.querySelector(".brand-name");
  const shell = document.querySelector(".page-shell");
  if (!name || !toName || !shell) return;

  const layer = document.createElement("div");
  layer.className = "brand-movers";
  layer.setAttribute("aria-hidden", "true");
  const moveName = document.createElement("span");
  moveName.className = "brand-name brand-mover";
  layer.appendChild(moveName);
  shell.appendChild(layer);
  body.classList.add("brand-moving");

  function place(el, from, to, p) {
    const scale = 1 + (to.width / from.width - 1) * p;
    const x = from.left + (to.left - from.left) * p;
    const fromMiddle = from.top + from.height / 2;
    const toMiddle = to.top + to.height / 2;
    const y = fromMiddle + (toMiddle - fromMiddle) * p - (from.height * scale) / 2;
    el.style.width = from.width + "px";
    el.style.height = from.height + "px";
    el.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px) scale(" + scale.toFixed(4) + ")";
  }

  let ticking = false;
  function update() {
    ticking = false;
    if (document.documentElement.classList.contains("menu-open")) return;

    if (moveName.textContent !== name.textContent) moveName.textContent = name.textContent;
    moveName.style.fontSize = getComputedStyle(name).fontSize;

    const raw = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * MOVE_DISTANCE)));
    const p = raw * raw * (3 - 2 * raw);
    place(moveName, name.getBoundingClientRect(), toName.getBoundingClientRect(), p);

    moveName.style.color = "color-mix(in srgb, " + getComputedStyle(toName).color +
      " " + Math.round(p * 100) + "%, " + getComputedStyle(name).color + ")";
    body.classList.toggle("brand-arrived", raw >= 0.995);
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("load", update);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  update();
})();

(function () {
  const PAGE_GAP = 48;
  const TRANSITION_MS = 700;

  const menu = document.getElementById("site-menu");
  const shell = document.querySelector(".page-shell");
  const toggle = document.querySelector(".menu-toggle");
  if (!menu || !shell || !toggle) return;
  const closeButton = menu.querySelector(".menu-close");
  const root = document.documentElement;
  const phone = window.matchMedia("(max-width: 700px)");
  let isOpen = false;
  let closingTimer = null;

  function measure() {
    const panel = menu.getBoundingClientRect().width;
    const width = window.innerWidth;
    const scale = Math.min(0.62, Math.max(0.3, (width - panel - PAGE_GAP * 2) / width));
    root.style.setProperty("--menu-scale", scale.toFixed(4));
    root.style.setProperty("--menu-x", PAGE_GAP + "px");
    root.style.setProperty("--menu-ty", ((window.innerHeight * (1 - scale)) / 2).toFixed(1) + "px");
    root.style.setProperty("--menu-card-w", (width * scale).toFixed(1) + "px");
    root.style.setProperty("--menu-card-h", (window.innerHeight * scale).toFixed(1) + "px");
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    clearTimeout(closingTimer);
    root.classList.remove("menu-closing");
    root.style.setProperty("--menu-y", window.scrollY + "px");

    root.style.setProperty("--page-bg", getComputedStyle(document.body).backgroundColor);

    root.dataset.menuTone = (header && header.dataset.tone) || "wine";
    if (!phone.matches) measure();
    root.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    menu.inert = false;
    shell.inert = true;
    window.setTimeout(function () { closeButton.focus(); }, 60);
  }

  function close(thenGo) {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove("menu-open");
    root.classList.add("menu-closing");
    toggle.setAttribute("aria-expanded", "false");
    menu.inert = true;
    shell.inert = false;
    toggle.focus({ preventScroll: true });
    closingTimer = window.setTimeout(function () {
      root.classList.remove("menu-closing");
      setTouch(false);
      if (thenGo) thenGo();
    }, phone.matches ? 400 : TRANSITION_MS);
  }

  toggle.addEventListener("click", open);
  closeButton.addEventListener("click", function () { close(); });

  document.addEventListener("click", function (event) {
    if (isOpen && !menu.contains(event.target)) {
      event.preventDefault();
      close();
    }
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen) close();
  });

  menu.addEventListener("click", function (event) {
    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank") return;
    const here = location.href.split("#")[0];
    const there = link.href.split("#")[0];
    if (here !== there) return;
    event.preventDefault();
    close(function () {
      if (link.hash) location.hash = link.hash;
    });
  });

  const touch = menu.querySelector(".menu-touch");
  const touchButton = touch && touch.querySelector(".menu-touch-toggle");
  function setTouch(open) {
    if (!touch) return;
    touch.classList.toggle("is-open", open);
    touchButton.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (touchButton) {
    touchButton.addEventListener("click", function () {
      setTouch(!touch.classList.contains("is-open"));
    });
  }

  window.addEventListener("resize", function () {
    if (isOpen && !phone.matches) measure();
  });
  phone.addEventListener("change", function () { if (isOpen) close(); });
})();

(function () {
  const video = document.querySelector(".hero-image[data-mobile-src]");
  if (!video || !window.matchMedia("(max-width: 700px) and (orientation: portrait)").matches) return;
  const source = video.querySelector("source");
  if (!source) return;
  const original = source.getAttribute("src");
  source.addEventListener("error", function () {
    source.setAttribute("src", original);
    video.load();
  }, { once: true });
  source.setAttribute("src", video.dataset.mobileSrc);
  video.load();
})();
let heroTicking = false;

function updateHeroFade() {
  const fade = Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);
  hero.style.setProperty("--fade", fade.toFixed(3));
  heroTicking = false;
}

if (hero && !prefersLessMotion) {
  window.addEventListener("scroll", function () {
    if (heroTicking) return;
    heroTicking = true;
    window.requestAnimationFrame(updateHeroFade);
  });
  updateHeroFade();
}

const stackSections = Array.from(document.querySelectorAll(".stack"));
const footer = document.querySelector(".site-footer");
let stickTops = [];

function measureStack() {
  stickTops = stackSections.map(function (section) {
    const stickTop = Math.min(0, window.innerHeight - section.offsetHeight);
    section.style.setProperty("--stick-top", stickTop + "px");
    return stickTop;
  });
  updateStack();
}

function updateStack() {
  stackSections.forEach(function (section, i) {

    const next = section.nextElementSibling || footer;
    if (!next) return;

    const stuckBottom = stickTops[i] + section.offsetHeight;
    const nextTop = next.getBoundingClientRect().top;
    const distance = Math.min(section.offsetHeight, window.innerHeight);

    let covered = (stuckBottom - nextTop) / distance;
    covered = Math.min(Math.max(covered, 0), 1);

    section.style.setProperty("--covered", covered.toFixed(3));

    const top = section.getBoundingClientRect().top;
    const arrive = Math.min(Math.max(1 - top / window.innerHeight, 0), 1);
    section.style.setProperty("--arrive", arrive.toFixed(3));
  });
}

let stackTicking = false;

function onStackScroll() {
  if (stackTicking) return;
  stackTicking = true;
  window.requestAnimationFrame(function () {
    updateStack();
    stackTicking = false;
  });
}

if (stackSections.length && !prefersLessMotion) {
  measureStack();
  window.addEventListener("scroll", onStackScroll);
  window.addEventListener("resize", measureStack);
  window.addEventListener("load", measureStack);
}

const fadeItems = document.querySelectorAll(".scroll-fade");
let fadeTicking = false;

function updateFades() {
  const screen = window.innerHeight;
  const zone = screen * 0.3;

  fadeItems.forEach(function (item) {
    const box = item.getBoundingClientRect();
    const fadingIn = (screen - box.top) / zone;
    const fadingOut = box.bottom / zone;
    const view = Math.min(1, Math.max(0, Math.min(fadingIn, fadingOut)));
    item.style.setProperty("--view", view.toFixed(3));
  });

  fadeTicking = false;
}

if (fadeItems.length && !prefersLessMotion) {
  window.addEventListener("scroll", function () {
    if (fadeTicking) return;
    fadeTicking = true;
    window.requestAnimationFrame(updateFades);
  });
  window.addEventListener("resize", updateFades);
  updateFades();
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !prefersLessMotion) {
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealItems.forEach(function (item) {
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach(function (item) {
    item.classList.add("is-revealed");
  });
}

const nextEventSection = document.querySelector(".next-event");

if (nextEventSection) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function readDate(item, which) {
    const text = (which === "end" && item.dataset.end) || item.dataset.date;
    const parts = text.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const allEvents = Array.from(nextEventSection.querySelectorAll(".featured-event"));

  allEvents.forEach(function (item) {
    const label = item.querySelector(".featured-date");
    if (!label || !item.dataset.date) return;
    const start = readDate(item), end = readDate(item, "end");
    const full = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    if (end <= start) {
      label.textContent = start.toLocaleDateString("en-AU", full);
      return;
    }
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const first = sameMonth
      ? start.toLocaleDateString("en-AU", { weekday: "long" }) + " " + start.getDate()
      : start.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
    label.textContent = first + " \u2013 " + end.toLocaleDateString("en-AU", full);
  });

  const upcomingEvents = allEvents
    .filter(function (item) { return readDate(item, "end") >= today; })
    .sort(function (a, b) { return readDate(a) - readDate(b); });

  const counter = nextEventSection.querySelector(".event-counter");
  let shown = 0;

  function showEvent(index) {
    shown = (index + upcomingEvents.length) % upcomingEvents.length;
    allEvents.forEach(function (item) { item.classList.remove("is-current"); });
    upcomingEvents[shown].classList.add("is-current");
    counter.textContent = (shown + 1) + " / " + upcomingEvents.length;
  }

  if (upcomingEvents.length === 0) {
    nextEventSection.classList.add("is-empty");
  } else {
    showEvent(0);
    nextEventSection.querySelector(".event-prev").addEventListener("click", function () { showEvent(shown - 1); });
    nextEventSection.querySelector(".event-next").addEventListener("click", function () { showEvent(shown + 1); });
  }
}

document.querySelectorAll(".rates-toggle").forEach(function (button) {
  button.addEventListener("click", function () {
    const info = button.closest(".space-info");
    const isOpen = info.classList.toggle("is-open");
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    button.textContent = isOpen ? "Hide rates" : "View rates";
  });
});

const carousel = document.querySelector(".carousel");
const carouselButtons = document.querySelectorAll(".carousel-button");

if (carousel) {
  carouselButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const direction = Number(button.dataset.direction);
      carousel.scrollBy({ left: direction * carousel.clientWidth, behavior: "smooth" });
    });
  });
}

const filterButtons = document.querySelectorAll(".filter-button");
const projects = document.querySelectorAll(".project");

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const filter = button.dataset.filter;

    filterButtons.forEach(function (b) {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");

    projects.forEach(function (project) {
      const matches = filter === "all" || project.dataset.category === filter;
      project.classList.toggle("is-hidden", !matches);
      project.classList.add("is-revealed");
    });
  });
});

const lightbox = document.querySelector(".lightbox");

if (lightbox) {
  const lightboxImage = lightbox.querySelector(".lightbox-figure img");
  const lightboxCaption = lightbox.querySelector(".lightbox-figure figcaption");
  const lightboxTitle = lightbox.querySelector(".lightbox-title");
  const lightboxCount = lightbox.querySelector(".lightbox-count");
  let albumPhotos = [];
  let current = 0;

  function showPhoto(index) {

    current = (index + albumPhotos.length) % albumPhotos.length;
    const photo = albumPhotos[current];
    delete lightboxImage.dataset.backupUsed;
    lightboxImage.src = photo.dataset.src;
    lightboxImage.alt = photo.alt;
    lightboxCaption.textContent = photo.alt;
    lightboxCount.textContent = (current + 1) + " / " + albumPhotos.length;
  }

  document.querySelectorAll(".album").forEach(function (album) {
    album.querySelectorAll(".album-open").forEach(function (button) {
      button.addEventListener("click", function () {
        albumPhotos = Array.from(album.querySelectorAll(".album-photos img"));
        lightboxTitle.textContent = album.querySelector("h3").textContent;
        showPhoto(Number(button.dataset.start) || 0);
        lightbox.showModal();
        document.body.classList.add("lightbox-open");
      });
    });
  });

  lightbox.querySelector(".lightbox-prev").addEventListener("click", function () { showPhoto(current - 1); });
  lightbox.querySelector(".lightbox-next").addEventListener("click", function () { showPhoto(current + 1); });
  lightbox.querySelector(".lightbox-close").addEventListener("click", function () { lightbox.close(); });

  lightbox.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") showPhoto(current - 1);
    if (event.key === "ArrowRight") showPhoto(current + 1);
  });

  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox || event.target.classList.contains("lightbox-inner")) {
      lightbox.close();
    }
  });

  lightbox.addEventListener("close", function () {
    document.body.classList.remove("lightbox-open");
  });
}

document.querySelectorAll("img").forEach(function (img) {
  const src = img.getAttribute("src");
  if (img.closest(".album-photos")) return;
  if (src === "" || (src && img.complete && img.naturalWidth === 0)) {
    useBackupPhoto(img);
  }
  img.addEventListener("error", function () {
    useBackupPhoto(img);
  });
});
