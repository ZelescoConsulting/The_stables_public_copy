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
