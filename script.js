const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector(".site-header");
const hero = document.querySelector(".hero");

(function () {
  const INTRO_TIME = 2500;
  const EVERY_VISIT = true;

  const body = document.body;
  if (!body.classList.contains("home")) return;

  const intro = document.querySelector(".hero-intro");
  const seal = intro ? intro.querySelector(".intro-seal") : null;
  const ring = seal ? seal.querySelector(".intro-ring") : null;
  const crest = document.querySelector(".hero-crest");
  if (!intro || !seal || !crest) { body.classList.add("intro-done", "intro-skip"); return; }

  const skipEvents = ["click", "keydown", "wheel", "touchstart"];
  let timer = null;

  function restInCrest() {
    seal.style.transform = "";
    seal.style.animation = "";
    crest.appendChild(seal);
    intro.hidden = true;
  }

  function finish() {
    if (body.classList.contains("intro-done")) return;
    clearTimeout(timer);
    skipEvents.forEach(function (name) { window.removeEventListener(name, finish); });
    try { sessionStorage.setItem("stables-intro", "seen"); } catch (e) {}

    const m = new DOMMatrix(getComputedStyle(ring).transform);
    const angle = Math.atan2(m.b, m.a) * 180 / Math.PI;
    ring.style.animation = "none";
    ring.style.transform = "rotate(" + angle + "deg)";
    ring.getBoundingClientRect();
    ring.style.transition = "transform 1.6s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.9s ease 0.3s";
    ring.style.transform = "rotate(" + (angle + 70) + "deg)";

    const from = seal.getBoundingClientRect();
    const to = crest.getBoundingClientRect();
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    seal.style.animation = "none";
    seal.getBoundingClientRect();
    seal.style.transform = "translate(" + dx + "px, " + dy + "px)";

    body.classList.add("intro-done");

    setTimeout(restInCrest, 1600);
  }

  function start() {
    let seen = false;
    try { seen = sessionStorage.getItem("stables-intro") === "seen"; } catch (e) {}

    if (prefersLessMotion || (!EVERY_VISIT && seen)) {
      body.classList.add("intro-done", "intro-skip");
      restInCrest();
      return;
    }
    timer = setTimeout(finish, INTRO_TIME);
    skipEvents.forEach(function (name) {
      window.addEventListener(name, finish, { passive: true });
    });
  }

  start();

  window.addEventListener("pageshow", function (event) {
    if (!event.persisted || !EVERY_VISIT || prefersLessMotion) return;
    body.classList.remove("intro-done", "intro-skip");
    ring.style.cssText = "";
    seal.style.cssText = "";
    intro.querySelector(".intro-seal") || intro.appendChild(seal);
    intro.hidden = false;
    start();
  });
})();

(function () {
  if (!header) return;
  const logo = header.querySelector(".logo-image");
  const LOGOS = {
    dark: "images/logo.png",
    wine: "images/logo-wine.png",
    light: "images/logo-light.png",
    blush: "images/logo-blush.png",
  };
  Object.keys(LOGOS).forEach(function (k) { new Image().src = LOGOS[k]; });

  function colourAt(y) {
    const stack = document.elementsFromPoint(window.innerWidth / 2, y);
    for (let i = 0; i < stack.length; i++) {
      let el = stack[i];
      if (header.contains(el)) continue;
      while (el && el !== document.documentElement) {
        const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        if (m && (m.length < 4 || Number(m[3]) > 0.5)) return m.slice(0, 3).map(Number);
        el = el.parentElement;
      }
    }
    return [223, 192, 182];
  }
 let logoTimer = null;
  let logoTop = null;
  function swapLogo(src) {
    if (!logo || logo.dataset.want === src) return;
    logo.dataset.want = src;

    if (!logoTop) {
      logo.setAttribute("src", src);
      logoTop = logo.cloneNode();
      logoTop.removeAttribute("data-want");
      logoTop.className = "logo-image logo-image-top";
      logoTop.alt = "";
      logoTop.setAttribute("aria-hidden", "true");
      logo.parentNode.appendChild(logoTop);
      return;
    }

    clearTimeout(logoTimer);
    if (logoTop.classList.contains("is-showing")) {
      logo.setAttribute("src", logoTop.getAttribute("src"));
    }
    logoTop.classList.remove("is-showing");
    logoTop.onload = function () {
      logoTop.onload = null;
      logoTop.getBoundingClientRect();
      logoTop.classList.add("is-showing");
      logoTimer = setTimeout(function () {
        logo.setAttribute("src", src);
        logoTop.classList.remove("is-showing");
      }, 300);
    };
    logoTop.setAttribute("src", src);
    if (logoTop.complete) logoTop.onload();
  }

  function same(a, b) { return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }
  function rgba(c) { return "rgba(" + c.join(", ") + ", 0.70)"; }

  let ticking = false;
  function update() {
    ticking = false;
    const h = header.offsetHeight;
    const topColour = colourAt(1);
    const bottomColour = colourAt(h - 1);

    if (same(topColour, bottomColour)) {
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

    const mid = colourAt(h / 2);
    const lum = (0.2126 * mid[0] + 0.7152 * mid[1] + 0.0722 * mid[2]) / 255;
    const tone = lum > 0.5 ? "light" : (mid[0] > mid[1] + 35 ? "wine" : "dark");
    header.dataset.tone = tone;
     const logoKey = (tone === "light" && mid[0] - mid[2] > 32) ? "blush" : tone;
    swapLogo(LOGOS[logoKey]);

    if (hero && document.body.classList.contains("home")) {
      document.body.classList.toggle("past-hero", window.scrollY > hero.offsetHeight * 0.55);
    }
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

  function readDate(item) {
    const parts = item.dataset.date.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  const allEvents = Array.from(nextEventSection.querySelectorAll(".featured-event"));

  allEvents.forEach(function (item) {
    const label = item.querySelector(".featured-date");
    if (label && item.dataset.date) {
      label.textContent = readDate(item).toLocaleDateString("en-AU", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      });
    }
  });

  const upcomingEvents = allEvents
    .filter(function (item) { return readDate(item) >= today; })
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
    album.querySelector(".album-open").addEventListener("click", function () {
      albumPhotos = Array.from(album.querySelectorAll(".album-photos img"));
      lightboxTitle.textContent = album.querySelector("h3").textContent;
      showPhoto(0);
      lightbox.showModal();
      document.body.classList.add("lightbox-open");
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

function useBackupPhoto(img) {
  if (img.dataset.backupUsed) return;
  img.dataset.backupUsed = "true";
  img.src = "https://picsum.photos/seed/" + encodeURIComponent(img.alt || "stables") + "/1200/1200";
}

document.querySelectorAll("img").forEach(function (img) {
  if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
    useBackupPhoto(img);
  }
  img.addEventListener("error", function () {
    useBackupPhoto(img);
  });
});
