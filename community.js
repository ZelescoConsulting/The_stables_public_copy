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
