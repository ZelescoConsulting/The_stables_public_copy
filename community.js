document.querySelectorAll(".has-dropdown").forEach(function (item) {
  const toggle = item.querySelector(".dropdown-toggle");

  function setOpen(open) {
    item.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  toggle.addEventListener("click", function (event) {
    event.stopPropagation();
    setOpen(!item.classList.contains("is-open"));
  });

  document.addEventListener("click", function (event) {
    if (!item.contains(event.target)) setOpen(false);
  });

  item.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setOpen(false);
      toggle.focus();
    }
  });
});

document.querySelectorAll('form[action*="app.kit.com/forms"]').forEach(function (form) {
  if (form.dataset.demo === "true") return;

  function messageBox() {
    let box = document.getElementById("signup-done");
    if (!box || !form.parentNode.contains(box)) {
      box = form.parentNode.querySelector(".signup-message");
    }
    if (!box) {
      box = document.createElement("p");
      box.className = "signup-message";
      box.setAttribute("role", "status");
      form.parentNode.appendChild(box);
    }
    return box;
  }

  function showThanks() {
    const box = messageBox();
    box.textContent = "Thank you! Please check your inbox to confirm your subscription.";
    box.hidden = false;
    form.reset();
    const consent = document.querySelector('[form="' + form.id + '"]');
    if (consent) consent.checked = false;
  }

  function sendQuietly() {
    let frame = document.getElementById("signup-frame");
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = "signup-frame";
      frame.name = "signup-frame";
      frame.hidden = true;
      frame.title = "Newsletter sign-up";
      document.body.appendChild(frame);
    }
    form.target = "signup-frame";
    form.submit();
    showThanks();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const button = form.querySelector("[type=submit]");
    if (button) button.disabled = true;

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { "Accept": "application/json" }
    })
      .then(function (response) {
        if (button) button.disabled = false;
        if (response.ok) showThanks();
        else sendQuietly();
      })
      .catch(function () {
        if (button) button.disabled = false;
        sendQuietly();
      });
  });
});

(function () {
  const list = document.querySelector(".ev-list");
  if (!list) return;

  const small = window.matchMedia("(max-width: 900px)");

  function setOpen(card, isOpen) {
    card.classList.toggle("open", isOpen);
    const photo = card.querySelector(".ev-photo");
    const details = card.querySelector(".ev-details");
    if (photo) photo.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (details) {
      if (isOpen) details.removeAttribute("inert");
      else details.setAttribute("inert", "");
    }
  }

  function closeAll() {
    list.querySelectorAll(".ev-card.open").forEach(function (card) { setOpen(card, false); });
    list.querySelectorAll(".ev-row.has-open").forEach(function (row) { row.classList.remove("has-open"); });
  }

  function openEvent(card, scroll) {
    if (!card || card.classList.contains("open")) return;

    const row = card.closest(".ev-row");
    if (row.classList.contains("is-later") && !row.classList.contains("is-shown")) {
      showBatches(Number(row.dataset.batch));
    }
    closeAll();
    setOpen(card, true);
    card.closest(".ev-row").classList.add("has-open");
    history.replaceState(null, "", "#" + card.id);

    if (scroll || small.matches) {
      setTimeout(function () {
        const header = document.querySelector("header");
        const gap = (header ? header.offsetHeight : 0) + 16;
        const box = card.getBoundingClientRect();
        const top = small.matches
          ? box.top + window.scrollY - gap
          : box.top + window.scrollY - Math.max(gap, (window.innerHeight - box.height) / 2);
        window.scrollTo({ top: top, behavior: "smooth" });
      }, small.matches ? 350 : 0);
    }
  }

  function closeEvent() {
    const open = list.querySelector(".ev-card.open");
    closeAll();
    history.replaceState(null, "", location.pathname + location.search);
    if (open) open.querySelector(".ev-photo").focus({ preventScroll: true });
  }

  list.addEventListener("click", function (event) {
    if (event.target.closest(".ev-close")) {
      closeEvent();
      return;
    }
    const photo = event.target.closest(".ev-photo");
    if (photo) openEvent(photo.closest(".ev-card"), false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && list.querySelector(".ev-card.open")) closeEvent();
  });

  const more = list.querySelector(".ev-show-more");
  const showAll = list.querySelector(".ev-show-all");
  const later = Array.from(list.querySelectorAll(".ev-row.is-later"));
  let shownBatches = 0;
  const lastBatch = later.reduce(function (top, row) { return Math.max(top, Number(row.dataset.batch)); }, 0);

  function showBatches(count) {
    shownBatches = Math.max(0, Math.min(count, lastBatch));
    later.forEach(function (row) {
      const show = Number(row.dataset.batch) <= shownBatches;
      if (show && !row.classList.contains("is-shown")) row.classList.add("is-arriving");
      row.classList.toggle("is-shown", show);
    });
    window.setTimeout(function () {
      later.forEach(function (row) { row.classList.remove("is-arriving"); });
    }, 700);
    if (!more) return;
    const all = shownBatches >= lastBatch;
    more.classList.toggle("is-all", all);
    more.setAttribute("aria-expanded", shownBatches > 0 ? "true" : "false");
    more.querySelector(".ev-show-label").textContent = all ? "Fewer events" : "More events";
    if (showAll) showAll.hidden = shownBatches + 1 >= lastBatch;
    markWide();
  }

  function markWide() {
    const visible = Array.from(list.querySelectorAll(".ev-card")).filter(function (card) {
      const row = card.closest(".ev-row");
      return !row.classList.contains("is-later") || row.classList.contains("is-shown");
    });
    list.querySelectorAll(".ev-card.is-wide").forEach(function (card) { card.classList.remove("is-wide"); });
    if (visible.length % 2 === 1) visible[visible.length - 1].classList.add("is-wide");
  }
  markWide();
  if (showAll) showAll.hidden = lastBatch <= 1;

  if (showAll) {
    showAll.addEventListener("click", function () {
      showBatches(lastBatch);
      more.focus({ preventScroll: true });
    });
  }

  if (more) {
    more.addEventListener("click", function () {
      if (shownBatches >= lastBatch) {
        closeAll();
        showBatches(0);
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        showBatches(shownBatches + 1);
      }
    });
  }

  function openFromLink() {
    const id = decodeURIComponent(location.hash.slice(1));
    const card = id && document.getElementById(id);
    if (card && card.classList.contains("ev-card")) openEvent(card, true);
  }
  openFromLink();
  window.addEventListener("hashchange", openFromLink);
})();

(function () {
  const grid = document.querySelector(".album-grid.album-carousel");
  if (!grid) return;
  const albums = Array.from(grid.querySelectorAll(".album"));
  const counter = document.querySelector(".album-counter");
  const prev = document.querySelector(".album-prev");
  const next = document.querySelector(".album-next");

  let current = 0;
  function show(index) {
    current = (index + albums.length) % albums.length;
    albums.forEach(function (album, i) { album.classList.toggle("is-current", i === current); });
    if (counter) counter.textContent = (current + 1) + " / " + albums.length;
  }

  if (prev && next) {
    prev.addEventListener("click", function () { show(current - 1); });
    next.addEventListener("click", function () { show(current + 1); });
  }

  grid.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  let startX = null;
  grid.addEventListener("touchstart", function (event) { startX = event.touches[0].clientX; }, { passive: true });
  grid.addEventListener("touchend", function (event) {
    if (startX === null || albums.length < 2) return;
    const moved = event.changedTouches[0].clientX - startX;
    if (Math.abs(moved) > 50) show(current + (moved < 0 ? 1 : -1));
    startX = null;
  });

  const toggle = document.querySelector(".album-all-toggle");
  const index = document.getElementById("album-index");
  if (!toggle || !index) return;
  const count = toggle.querySelector(".album-all-count").outerHTML;

  function setIndex(open) {
    index.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.innerHTML = (open ? "Hide all past events " : "See all past events ") + count;
  }

  toggle.addEventListener("click", function () { setIndex(index.hidden); });

  index.addEventListener("click", function (event) {
    const tile = event.target.closest(".album-tile");
    if (!tile) return;
    show(Number(tile.dataset.index));
    setIndex(false);
    grid.scrollIntoView({ behavior: "smooth", block: "center" });

    const cover = albums[current].querySelector(".album-cover-button");
    if (cover) window.setTimeout(function () { cover.click(); }, 450);
  });
})();
