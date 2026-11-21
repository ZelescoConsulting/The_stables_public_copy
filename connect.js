const CAL_LINKS = {
  tour:    "https://cal.com/meet-tha-founder/chat-with-lucia",
  house:   "https://cal.com/house-stables-of-melbourne/hire-the-house",
  stables: "https://cal.com/stables-melbs/hire-the-stables",
  garden:  "https://cal.com/garden-stablesofmelbs/hire-the-garden"
};

const BOOKING_STYLE = "own";

const CALENDLY_COLOURS = "background_color=2a292b&text_color=e2d8ca&primary_color=c9a26b";

const CAL_COLOURS = {
  "cal-brand": "#c9a26b",
  "cal-brand-emphasis": "#b48d55",
  "cal-brand-text": "#2a292b",
  "cal-text": "#e2d8ca",
  "cal-bg": "#2a292b",
  "cal-bg-booker": "#2a292b"
};

const STUDIO = {
  suburb: "Deepdene VIC 3103",
  address: "",
  opens: "10:00",
  closes: "21:00",

  closedDates: ["2026-12-25", "2026-12-26", "2027-01-01", "2027-01-26"]
};

const VIEWS = {
  tour:    { title: "Come and <em>see</em> us.", line: "place" },
  space:   { title: "Find your <em>setting</em>.", line: "place" },
  message: { title: "Say <em>hello</em>.", line: "reply" }
};

const viewBoxes = document.querySelectorAll(".cx-view");
const titleBox = document.getElementById("cx-title");
const infoBox = document.getElementById("cx-info");
const lessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let currentView = "tour";

function infoLine(kind) {
  if (kind === "reply") return "<span>We reply within two working days</span>";
  let place = "";
  if (STUDIO.address) {
    const maps = "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent("The Stables of Melbourne, " + STUDIO.address);
    place = "<span>" + STUDIO.address + "</span>" +
      '<a href="' + maps + '" target="_blank" rel="noopener">' +
      '<span class="cx-line" aria-hidden="true"></span>Get directions</a>';
  } else {
    place = "<span>" + STUDIO.suburb + "</span><span>Address sent with your booking</span>";
  }
  return place + openNowHtml();
}

function showView(name, animate) {
  if (!VIEWS[name]) name = "tour";
  currentView = name;

  viewBoxes.forEach(function (box) {
    box.hidden = box.dataset.view !== name;
  });

  document.querySelectorAll(".cx-option").forEach(function (option) {
    if (option.dataset.view === name) option.setAttribute("aria-current", "true");
    else option.removeAttribute("aria-current");
    const label = option.querySelector(".cx-go-label");
    if (label) label.textContent = option.dataset.view === name ? "You are here" : "Go";
  });

  document.querySelectorAll(".cx-switch a").forEach(function (link) {
    if (link.dataset.view === name) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });

  const swap = function () {
    titleBox.innerHTML = VIEWS[name].title;
    infoBox.innerHTML = infoLine(VIEWS[name].line);
    titleBox.classList.remove("is-changing");
    infoBox.classList.remove("is-changing");
  };

  if (animate && !lessMotion) {
    titleBox.classList.add("is-changing");
    infoBox.classList.add("is-changing");
    setTimeout(swap, 350);
  } else {
    swap();
  }

  startCalendars();
}

function melbourneNow() {
  const parts = {};
  new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
  return {
    date: parts.year + "-" + parts.month + "-" + parts.day,
    minutes: Number(parts.hour) * 60 + Number(parts.minute)
  };
}

function shortTime(text) {
  const parts = text.split(":").map(Number);
  const h = parts[0] % 12 || 12;
  return h + (parts[1] ? ":" + String(parts[1]).padStart(2, "0") : "") + (parts[0] < 12 ? "am" : "pm");
}

function openNowHtml() {
  const now = melbourneNow();
  const open = toMinutes(STUDIO.opens);
  const close = toMinutes(STUDIO.closes);
  const closedToday = STUDIO.closedDates.indexOf(now.date) !== -1;
  let text, isOpen = false;

  if (!closedToday && now.minutes >= open && now.minutes < close) {
    isOpen = true;
    text = "Open now &middot; until " + shortTime(STUDIO.closes);
  } else if (!closedToday && now.minutes < open) {
    text = "Closed &middot; opens " + shortTime(STUDIO.opens);
  } else {
    text = "Closed &middot; opens " + shortTime(STUDIO.opens) + " tomorrow";
  }
  return '<span class="cx-open' + (isOpen ? "" : " is-closed") + '">' +
    '<span class="cx-dot" aria-hidden="true"></span>' + text + "</span>";
}

setInterval(function () {
  if (VIEWS[currentView].line === "place") infoBox.innerHTML = infoLine("place");
}, 60000);

const moreButton = document.querySelector(".cx-more");
const panel = document.getElementById("cx-options");
const closeButton = panel ? panel.querySelector(".cx-close") : null;

function openPanel() {
  panel.hidden = false;
  panel.getBoundingClientRect();
  panel.classList.add("is-open");
  document.body.classList.add("cx-panel-open");
  moreButton.setAttribute("aria-expanded", "true");
  setTimeout(function () {
    const current = panel.querySelector('.cx-option[aria-current="true"]') ||
                    panel.querySelector(".cx-option");
    if (current) current.focus();
  }, lessMotion ? 0 : 300);
}

function closePanel() {
  panel.classList.remove("is-open");
  document.body.classList.remove("cx-panel-open");
  moreButton.setAttribute("aria-expanded", "false");
  setTimeout(function () {
    if (!panel.classList.contains("is-open")) panel.hidden = true;
  }, lessMotion ? 0 : 700);
  moreButton.focus({ preventScroll: true });
}

if (moreButton && panel) {
  moreButton.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);

  panel.querySelectorAll(".cx-option").forEach(function (option) {
    option.addEventListener("click", function () {
      const name = option.dataset.view;
      if (name !== currentView) {
        showView(name, true);
        history.replaceState(null, "", "#" + (name === "message" ? "enquire" : name));
      }
      closePanel();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (!panel.classList.contains("is-open")) return;
    if (event.key === "Escape") closePanel();

    if (event.key === "Tab") {
      const items = panel.querySelectorAll("button");
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
    }
  });
}

function openFromHash() {
  const hash = location.hash.replace("#", "");

  if (hash.indexOf("space") === 0) {
    showView("space", true);
    const space = hash.split("-")[1];
    if (space) chooseSpace(space);
  } else if (hash === "enquire" || hash === "message") {
    showView("message", true);
    fillFromEvent();
  } else if (hash === "tour") {
    showView("tour", true);
  } else if (hash === "subscribe") {
    const strip = document.getElementById("subscribe");
    if (strip) strip.scrollIntoView({ behavior: lessMotion ? "auto" : "smooth" });
  }
}

const TOPIC_STARTERS = {
  events:    { topic: "Events and workshops", subject: "Events enquiry",
               message: "I have a question about your events." },
  hosting:   { topic: "Events and workshops", subject: "Hosting an event",
               message: "I'd like to host an event at The Stables." },
  story:     { topic: "Sharing my story",     subject: "Sharing my story",
               message: "I'd like to share my story." },
  gallery:   { topic: "Collaborating with us", subject: "Gallery submission",
               message: "I'd like to share my work for the gallery." },
  privacy:   { topic: "Something else",       subject: "Privacy question",
               message: "I have a question about privacy." },
  terms:     { topic: "Something else",       subject: "Question about the terms",
               message: "I have a question about the terms of use." }
};

function fillFromEvent() {
  if (!enquiryForm) return;
  const params = new URLSearchParams(location.search);
  const eventName = params.get("event");
  let start = TOPIC_STARTERS[params.get("topic")];

  if (eventName) {
    start = {
      topic: "Events and workshops",
      subject: "Event interest: " + eventName,
      message: "I'd like to register my interest in: " + eventName + "."
    };
  }
  if (!start) return;

  const topic = enquiryForm.elements.topic;
  if (topic) topic.value = start.topic;

  const message = enquiryForm.elements.message;
  if (message && !message.value) message.value = start.message + "\n\n";

  const subject = enquiryForm.elements.subject;
  if (subject) subject.value = start.subject + " (The Stables website)";
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
  startCalendars();
}

spaceButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    chooseSpace(button.dataset.space);
    history.replaceState(null, "", "#space-" + button.dataset.space);
  });
});

const enquiryForm = document.getElementById("enquiry-form");
const enquiryDone = document.getElementById("enquiry-done");

function showEnquiryThanks() {
  enquiryForm.hidden = true;
  enquiryDone.hidden = false;
}

document.querySelectorAll("[data-new-message]").forEach(function (button) {
  button.addEventListener("click", function () {
    enquiryForm.reset();
    enquiryForm.hidden = false;
    enquiryDone.hidden = true;
  });
});

if (enquiryForm) {
  enquiryForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const errorMessage = enquiryForm.querySelector(".form-error");
    errorMessage.hidden = true;

    if (enquiryForm.dataset.demo === "true") {
      showEnquiryThanks();
      return;
    }

    const sendButton = enquiryForm.querySelector("[type=submit]");
    sendButton.disabled = true;
    fetch(enquiryForm.action, {
      method: "POST",
      body: new FormData(enquiryForm),
      headers: { "Accept": "application/json" }
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (result) {
          sendButton.disabled = false;
          if (response.ok && result.success !== false) showEnquiryThanks();
          else errorMessage.hidden = false;
        });
      })
      .catch(function () {
        sendButton.disabled = false;
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

function esc(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function makeBooker(box, cal) {

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

  const slots = {};
  let loading = false;

  function monthKey() {
    return length + "|" + viewMonth.getFullYear() + "-" + pad(viewMonth.getMonth() + 1);
  }

  function loadMonth() {
    const key = monthKey();
    if (slots[key] || loading) return;
    loading = true;

    const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const from = monthStart < firstDay ? firstDay : monthStart;
    const to = monthEnd > lastDay ? lastDay : monthEnd;

    const url = "https://api.cal.com/v2/slots" +
      "?username=" + encodeURIComponent(cal.username) +
      "&eventTypeSlug=" + encodeURIComponent(cal.slug) +
      "&start=" + dateKey(from) + "&end=" + dateKey(to) +
      "&timeZone=Australia/Melbourne" +
      (lengths.length > 1 ? "&duration=" + length : "");

    fetch(url, { headers: { "cal-api-version": "2024-09-04" } })
      .then(function (response) {
        if (!response.ok) throw new Error("Cal.com answered " + response.status);
        return response.json();
      })
      .then(function (result) {
        const days = {};
        Object.keys(result.data || {}).forEach(function (day) {
          days[day] = {};
          result.data[day].forEach(function (slot) {

            days[day][toMinutes(slot.start.slice(11, 16))] = slot.start;
          });
        });
        slots[key] = days;
        loading = false;
        render();
      })
      .catch(function (error) {
        console.warn("Cal.com free times not loaded:", error);
        loading = false;
        cal.onFail();
      });
  }

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
    if (cal) {
      const month = slots[monthKey()] || {};
      return Object.keys(month[dateKey(day)] || {}).map(Number).sort(function (a, b) { return a - b; });
    }
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
    if (cal && !slots[monthKey()]) {
      box.innerHTML = '<p class="booker-loading" role="status">Checking which times are free&hellip;</p>';
      loadMonth();
      return;
    }
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

    const form = box.querySelector("form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!cal) {
        bookingsFor(dateKey(chosenDay)).push([chosenStart, end]);
        renderDone(summary);
        return;
      }

      const button = form.querySelector("[type=submit]");
      button.disabled = true;
      button.textContent = "Sending...";
      const iso = slots[monthKey()][dateKey(chosenDay)][chosenStart];
      const booking = {
        start: new Date(iso).toISOString(),
        username: cal.username,
        eventTypeSlug: cal.slug,
        attendee: {
          name: form.elements.name.value,
          email: form.elements.email.value,
          timeZone: "Australia/Melbourne",
          language: "en"
        },
        bookingFieldsResponses: { notes: form.elements.notes.value }
      };
      if (lengths.length > 1) booking.lengthInMinutes = length;

      fetch("https://api.cal.com/v2/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "cal-api-version": "2024-08-13" },
        body: JSON.stringify(booking)
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Cal.com answered " + response.status);
          delete slots[monthKey()];
          renderDone(summary);
        })
        .catch(function (error) {
          console.warn("Booking not sent:", error);
          button.disabled = false;
          button.innerHTML = needsApproval ? "Send request &rarr;" : "Book tour &rarr;";
          let problem = form.querySelector(".form-error");
          if (!problem) {
            problem = document.createElement("p");
            problem.className = "form-error";
            form.appendChild(problem);
          }
          problem.innerHTML = "Sorry, that didn't go through. That time may have just been taken. " +
            'Please try another time, or <a href="https://cal.com/' + esc(cal.username + "/" + cal.slug) +
            '" target="_blank" rel="noopener">book on our Cal.com page</a>.';
        });
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
        (cal ? '<p class="connect-small">Check your inbox (and spam folder) for an email from Cal.com with the details.</p>' : "") +
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

function loadCalCom() {
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
}

function startCalendars() {
  document.querySelectorAll(".booker.is-live:not([data-started])").forEach(function (box) {
    if (box.offsetParent === null) return;
    box.dataset.started = "true";

    const name = box.dataset.demo;
    box.id = "cal-" + name;

    if (/calendly\.com/.test(CAL_LINKS[name])) {
      startCalendly(box, CAL_LINKS[name]);
      return;
    }

    loadCalCom();
    Cal("init", name, { origin: "https://cal.com" });
    Cal.ns[name]("inline", {
      elementOrSelector: "#cal-" + name,
      calLink: CAL_LINKS[name],
      config: { layout: "month_view", theme: "dark" }
    });
    Cal.ns[name]("ui", {
      theme: "dark",
      hideEventTypeDetails: false,
      layout: "month_view",
      cssVarsPerTheme: { dark: CAL_COLOURS }
    });
  });
}

function startCalendly(box, link) {
  box.classList.add("is-calendly");
  const url = (/^https?:\/\//.test(link) ? link : "https://" + link) +
    (link.indexOf("?") === -1 ? "?" : "&") + "hide_gdpr_banner=1&" + CALENDLY_COLOURS;
  const place = function () {
    window.Calendly.initInlineWidget({ url: url, parentElement: box });
  };
  if (window.Calendly) return place();

  let script = document.getElementById("calendly-script");
  if (!script) {
    script = document.createElement("script");
    script.id = "calendly-script";
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    document.head.appendChild(script);
  }
  script.addEventListener("load", place);
}

document.querySelectorAll(".booker[data-demo]").forEach(function (box) {
  let link = (CAL_LINKS[box.dataset.demo] || "").trim();
  if (!/calendly\.com/.test(link)) {
    link = link.replace(/^https?:\/\/(app\.)?cal\.com\//, "");
  }
  if (link && BOOKING_STYLE === "own" && !/calendly\.com/.test(link)) {

    CAL_LINKS[box.dataset.demo] = link;
    const parts = link.split("?")[0].split("/");
    box.classList.add("is-connected");
    makeBooker(box, {
      username: parts[0],
      slug: parts[1],
      onFail: function () {

        box.classList.remove("is-connected");
        box.classList.add("is-live");
        box.innerHTML = "";
        startCalendars();
      }
    });
  } else if (link) {

    CAL_LINKS[box.dataset.demo] = link;
    box.classList.add("is-live");
    box.innerHTML = "";
  } else {
    makeBooker(box);
  }
});

const stillPreview = document.querySelectorAll(".booker:not(.is-live):not(.is-connected), form[data-demo='true']").length;
const previewNotice = document.querySelector(".preview-notice");
if (previewNotice && stillPreview === 0) previewNotice.hidden = true;

showView(currentView, false);
openFromHash();
startCalendars();
