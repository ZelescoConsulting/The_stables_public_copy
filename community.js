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

  function openFromLink() {
    const id = decodeURIComponent(location.hash.slice(1));
    const card = id && document.getElementById(id);
    if (card && card.classList.contains("ev-card")) openEvent(card, true);
  }
  openFromLink();
  window.addEventListener("hashchange", openFromLink);
})();
