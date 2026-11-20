const tabs = document.querySelectorAll(".connect-tab");
const panels = document.querySelectorAll(".connect-panel");

function showTab(name) {
  tabs.forEach(function (tab) {
    tab.setAttribute("aria-selected", tab.dataset.tab === name ? "true" : "false");
  });
  panels.forEach(function (panel) {
    panel.hidden = panel.id !== "panel-" + name;
  });
}

tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    showTab(tab.dataset.tab);

    history.replaceState(null, "", "#" + tab.dataset.tab);
    if (tab.dataset.tab === "enquire") openEnquiry();
  });
});

function openFromHash() {
  const hash = location.hash.replace("#", "");
  if (!hash) return;

  if (hash.indexOf("space") === 0) {
    showTab("space");
    const space = hash.split("-")[1];
    if (space) chooseSpace(space);
  } else if (hash === "tour" || hash === "subscribe") {
    showTab(hash);
  } else if (hash === "enquire") {
    showTab("enquire");
    openEnquiry();
  }
}

window.addEventListener("hashchange", openFromHash);

const spaceButtons = document.querySelectorAll(".space-choice");
const spaceBookings = document.querySelectorAll(".space-booking");

function chooseSpace(name) {
  spaceButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", button.dataset.space === name ? "true" : "false");
  });
  spaceBookings.forEach(function (box) {
    box.hidden = box.dataset.space !== name;
  });
}

spaceButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    chooseSpace(button.dataset.space);
    history.replaceState(null, "", "#space-" + button.dataset.space);
  });
});

const enquiryDialog = document.getElementById("enquiry-dialog");
const enquiryForm = document.getElementById("enquiry-form");
const enquiryDone = document.getElementById("enquiry-done");

function openEnquiry() {
  if (enquiryDialog && !enquiryDialog.open) enquiryDialog.showModal();
}

document.querySelectorAll("[data-open-enquiry]").forEach(function (button) {
  button.addEventListener("click", openEnquiry);
});

document.querySelectorAll("[data-close-enquiry]").forEach(function (button) {
  button.addEventListener("click", function () {
    enquiryDialog.close();
  });
});

if (enquiryDialog) {
  enquiryDialog.addEventListener("click", function (event) {
    if (event.target === enquiryDialog) enquiryDialog.close();
  });

  enquiryDialog.addEventListener("close", function () {
    if (enquiryForm && enquiryForm.hidden) {
      enquiryForm.reset();
      enquiryForm.hidden = false;
      enquiryDone.hidden = true;
    }
  });
}

function showEnquiryThanks() {
  enquiryForm.hidden = true;
  enquiryDone.hidden = false;
}

if (enquiryForm) {
  enquiryForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const errorMessage = enquiryForm.querySelector(".form-error");
    errorMessage.hidden = true;

    if (enquiryForm.dataset.demo === "true") {
      showEnquiryThanks();
      return;
    }

    fetch(enquiryForm.action, {
      method: "POST",
      body: new FormData(enquiryForm),
      headers: { "Accept": "application/json" }
    })
      .then(function (response) {
        if (response.ok) showEnquiryThanks();
        else errorMessage.hidden = false;
      })
      .catch(function () {
        errorMessage.hidden = false;
      });
  });
}

const signupForm = document.getElementById("connect-signup");

if (signupForm) {
  signupForm.addEventListener("submit", function (event) {
    if (signupForm.dataset.demo === "true") {
      event.preventDefault();
      signupForm.reset();
      document.querySelector("[form='connect-signup']").checked = false;
      document.getElementById("signup-done").hidden = false;
    }
  });
}

function pad(number) {
  return String(number).padStart(2, "0");
}

function dateKey(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function toMinutes(text) {
  const parts = text.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const ampm = hours >= 12 ? "pm" : "am";
  return (hours % 12 || 12) + ":" + pad(minutes % 60) + " " + ampm;
}

function formatDate(date) {
  return date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
}

function scramble(text) {
  let number = 0;
  for (let i = 0; i < text.length; i++) {
    number = (number * 31 + text.charCodeAt(i)) >>> 0;
  }
  return number;
}

function makeBooker(box) {

  const id = box.dataset.demo;
  const name = box.dataset.name;
  const lengths = box.dataset.durations.split(",").map(Number);
  const labels = box.dataset.labels.split(",");
  const open = toMinutes(box.dataset.open);
  const close = toMinutes(box.dataset.close);
  const step = Number(box.dataset.step);
  const buffer = Number(box.dataset.buffer);
  const needsApproval = box.dataset.approval === "true";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() + 1);
  const lastDay = new Date(today);
  lastDay.setDate(today.getDate() + 60);

  let length = lengths[0];
  let viewMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
  let chosenDay = null;
  let chosenStart = null;

  const bookings = {};

  function bookingsFor(key) {
    if (!bookings[key]) {
      const n = scramble(id + key);
      const list = [];
      if (n % 3 === 0) {
        const start = open + (n % 4) * 60;
        list.push([start, start + 180]);
      }
      if (n % 5 === 1) {
        list.push([close - 240, close - 120]);
      }
      if (n % 11 === 0) {
        list.push([open, close]);
      }
      bookings[key] = list;
    }
    return bookings[key];
  }

  function freeTimes(day) {
    const taken = bookingsFor(dateKey(day));
    const times = [];
    for (let start = open; start + length <= close; start += step) {
      const end = start + length;
      const clash = taken.some(function (booking) {
        return start < booking[1] + buffer && end > booking[0] - buffer;
      });
      if (!clash) times.push(start);
    }
    return times;
  }

  function render() {
    box.innerHTML = "";

    const top = document.createElement("div");
    top.className = "booker-top";
    top.innerHTML = '<p class="booker-name">' + name + "</p>";

    const lengthRow = document.createElement("div");
    lengthRow.className = "booker-lengths";
    lengthRow.setAttribute("role", "group");
    lengthRow.setAttribute("aria-label", "Length");
    lengths.forEach(function (minutes, i) {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill";
      pill.textContent = labels[i];
      pill.setAttribute("aria-pressed", minutes === length ? "true" : "false");
      pill.addEventListener("click", function () {
        length = minutes;
        chosenStart = null;
        render();
      });
      lengthRow.appendChild(pill);
    });
    top.appendChild(lengthRow);
    box.appendChild(top);

    const body = document.createElement("div");
    body.className = "booker-body";
    body.appendChild(renderMonth());
    body.appendChild(renderTimes());
    box.appendChild(body);

    const note = document.createElement("p");
    note.className = "booker-footnote";
    note.textContent = "Times are in Melbourne time. " +
      (needsApproval
        ? "A " + buffer + "-minute gap is kept free between bookings for setting up and packing down."
        : "Tours start every " + step + " minutes.");
    box.appendChild(note);
  }

  function renderMonth() {
    const wrap = document.createElement("div");

    const head = document.createElement("div");
    head.className = "cal-head";

    const back = document.createElement("button");
    back.type = "button";
    back.className = "cal-nav";
    back.innerHTML = "&larr;";
    back.setAttribute("aria-label", "Previous month");
    back.disabled = viewMonth <= new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
    back.addEventListener("click", function () {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
      render();
    });

    const forward = document.createElement("button");
    forward.type = "button";
    forward.className = "cal-nav";
    forward.innerHTML = "&rarr;";
    forward.setAttribute("aria-label", "Next month");
    forward.disabled = viewMonth >= new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
    forward.addEventListener("click", function () {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
      render();
    });

    const title = document.createElement("p");
    title.className = "cal-month";
    title.textContent = viewMonth.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

    head.append(back, title, forward);
    wrap.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "cal-grid";
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (d) {
      const cell = document.createElement("span");
      cell.className = "cal-weekday";
      cell.textContent = d;
      grid.appendChild(cell);
    });

    const blanks = (viewMonth.getDay() + 6) % 7;
    for (let i = 0; i < blanks; i++) {
      grid.appendChild(document.createElement("span"));
    }

    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cal-day";
      button.textContent = d;

      const inRange = day >= firstDay && day <= lastDay;
      const hasTimes = inRange && freeTimes(day).length > 0;

      if (hasTimes) {
        button.classList.add("has-times");
        button.setAttribute("aria-label", formatDate(day) + ", times available");
      } else {
        button.disabled = true;
        if (inRange) {
          button.classList.add("is-full");
          button.setAttribute("aria-label", formatDate(day) + ", fully booked");
        }
      }

      const isChosen = chosenDay && dateKey(day) === dateKey(chosenDay);
      button.setAttribute("aria-pressed", isChosen ? "true" : "false");

      button.addEventListener("click", function () {
        chosenDay = day;
        chosenStart = null;
        render();
      });
      grid.appendChild(button);
    }

    wrap.appendChild(grid);
    return wrap;
  }

  function renderTimes() {
    const wrap = document.createElement("div");
    const heading = document.createElement("p");
    heading.className = "slots-heading";

    if (!chosenDay) {
      heading.textContent = "Choose a day";
      wrap.appendChild(heading);
      const hint = document.createElement("p");
      hint.className = "slot-empty";
      hint.textContent = "Days with a ring around them have times free.";
      wrap.appendChild(hint);
      return wrap;
    }

    heading.textContent = formatDate(chosenDay);
    wrap.appendChild(heading);

    const times = freeTimes(chosenDay);
    if (times.length === 0) {
      const none = document.createElement("p");
      none.className = "slot-empty";
      none.textContent = "Nothing free for this length. Try a shorter booking or another day.";
      wrap.appendChild(none);
      return wrap;
    }

    const list = document.createElement("div");
    list.className = "slot-list";
    times.forEach(function (start) {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill";
      pill.textContent = formatTime(start);
      pill.setAttribute("aria-pressed", "false");
      pill.addEventListener("click", function () {
        chosenStart = start;
        renderForm();
      });
      list.appendChild(pill);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderForm() {
    const end = chosenStart + length;
    const summary = name + ", " + formatDate(chosenDay) + ", " +
      formatTime(chosenStart) + " to " + formatTime(end);

    box.innerHTML =
      '<form class="booker-form">' +
        '<p class="eyebrow">' + (needsApproval ? "Request this booking" : "Confirm your tour") + "</p>" +
        '<p class="booker-summary">' + summary + "</p>" +
        '<label class="field"><span>Name</span><input type="text" name="name" autocomplete="name" required></label>' +
        '<label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>' +
        '<label class="field"><span>' + (needsApproval ? "About your shoot" : "Anything we should know?") +
          ' <em>(optional)</em></span><textarea name="notes" rows="3"></textarea></label>' +
        '<div class="booker-actions">' +
          '<button class="button button-cream" type="submit">' +
            (needsApproval ? "Send request &rarr;" : "Book tour &rarr;") + "</button>" +
          '<button class="button button-light" type="button" data-back>Back</button>' +
        "</div>" +
      "</form>";

    box.querySelector("[data-back]").addEventListener("click", render);

    box.querySelector("form").addEventListener("submit", function (event) {
      event.preventDefault();

      bookingsFor(dateKey(chosenDay)).push([chosenStart, end]);
      renderDone(summary);
    });

    box.querySelector("input").focus();
  }

  function renderDone(summary) {
    box.innerHTML =
      '<div class="booker-done" role="status">' +
        "<h3>" + (needsApproval ? "Request sent." : "Tour booked.") + "</h3>" +
        '<p class="booker-summary">' + summary + "</p>" +
        "<p>" + (needsApproval
          ? "Lucia will check the details and email you to confirm. The time is held for you until then. No payment is taken now."
          : "A confirmation is on its way to your inbox. We look forward to showing you around.") + "</p>" +
        '<div class="booker-actions">' +
          '<button class="button button-light" type="button" data-again>Make another booking</button>' +
        "</div>" +
      "</div>";

    box.querySelector("[data-again]").addEventListener("click", function () {
      chosenStart = null;
      render();
    });
  }

  render();
}

document.querySelectorAll(".booker[data-demo]").forEach(makeBooker);

openFromHash();
