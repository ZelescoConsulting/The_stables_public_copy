const HOST = "github";

const CONTENT_FOLDER = "content/";

const isLiveSite =
  location.protocol.indexOf("http") === 0 &&
  location.hostname !== "localhost" &&
  location.hostname !== "127.0.0.1";

function photoUrl(src, width) {
  if (!src) return "";

  if (src.indexOf("images.pexels.com") !== -1) {
    return src.replace(/([?&])w=\d+/, "$1w=" + width);
  }

  if (/^https?:\/\//.test(src)) return src;

  const path = "/" + src.replace(/^\/+/, "");
  if (isLiveSite && HOST === "netlify") {
    return "/.netlify/images?url=" + encodeURIComponent(path) + "&w=" + width;
  }
  if (isLiveSite && HOST === "cloudflare") {
    return "/cdn-cgi/image/width=" + width + ",format=auto" + path;
  }

  return path.slice(1);
}

function imgTag(src, width, alt, extra) {
  const original = /^https?:\/\//.test(src || "") ? src : (src || "").replace(/^\/+/, "");
  return '<img src="' + esc(photoUrl(src, width)) + '"' +
    ' data-original="' + esc(original) + '"' +
    ' alt="' + esc(alt || "") + '"' +

    (/space-screen-image/.test(extra || "") ? "" : ' loading="lazy"') +
    (extra || "") + ">";
}

function setPhoto(img, src, width, alt) {
  if (!img || !src) return;
  img.dataset.original = /^https?:\/\//.test(src) ? src : src.replace(/^\/+/, "");
  img.src = photoUrl(src, width);
  if (alt !== undefined) img.alt = alt || "";
}

document.addEventListener("error", function (event) {
  const img = event.target;
  if (img.tagName !== "IMG" || !img.dataset.original) return;
  if (img.getAttribute("src") !== img.dataset.original) {
    img.src = img.dataset.original;
    event.stopImmediatePropagation();
  }
}, true);

function esc(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map(function (p) { return p.trim(); })
    .filter(Boolean)
    .map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; })
    .join("");
}

function slug(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "event";
}

function readDate(text) {
  const parts = String(text || "").slice(0, 10).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function longDate(text) {
  return readDate(text).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

function shortDate(text) {
  return readDate(text).toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short"
  }).replace(",", "");
}

function shown(list) {
  return (list || []).filter(function (item) { return item && item.show !== false; });
}

function upcoming(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return shown(events)
    .filter(function (e) { return e.date && readDate(e.date) >= today; })
    .sort(function (a, b) { return readDate(a.date) - readDate(b.date); });
}

function delay(i) {
  const d = (i % 3) * 0.12;
  return d ? ' style="--delay: ' + d + 's"' : "";
}

function registerLink(title) {
  return "connect.html?event=" +
    encodeURIComponent(String(title).replace(/^\[|\]$/g, "")) + "#enquire";
}

function load(name) {
  return fetch(CONTENT_FOLDER + name + ".json", { cache: "no-cache" })
    .then(function (response) { return response.ok ? response.json() : null; })
    .catch(function () { return null; });
}

function fillHomePhotos(home) {
  if (!home) return;

  const video = document.querySelector(".hero video");
  if (video) {
    if (home.opening_photo) video.poster = photoUrl(home.opening_photo, 1920);
    if (home.play_video === false) {
      video.querySelectorAll("source").forEach(function (s) { s.remove(); });
      video.removeAttribute("autoplay");
      video.load();
    }
  }

  const collage = document.querySelectorAll(".collage-photos img");
  (home.collage || []).forEach(function (item, n) {
    if (item && collage[n]) setPhoto(collage[n], item.photo, 1000, item.photo_description);
  });

  setPhoto(document.querySelector(".closing-bg"), home.closing_photo, 1920, "");
}

function fillHomeEvents(events) {
  const box = document.querySelector(".next-event .scroll-fade");
  if (!box || !events) return;

  box.innerHTML = upcoming(events).map(function (e, i) {
    const facts = [e.time, e.where, e.cost].filter(Boolean).map(esc).join(" &middot; ");
    return (
      '<article class="featured-event' + (i === 0 ? " is-current" : "") + '" data-date="' + esc(e.date) + '">' +
        imgTag(e.photo, 1200, e.photo_description) +
        "<div>" +
          '<span class="featured-date">' + esc(e.date) + "</span>" +
          "<h3>" + esc(e.title) + "</h3>" +
          "<p>" + esc(e.description) + "</p>" +
          (facts ? "<p>" + facts + "</p>" : "") +
          '<div class="featured-actions">' +
            '<a href="' + registerLink(e.title) + '" class="button button-dark">Register interest &rarr;</a>' +
            '<a href="events.html#' + slug(e.title) + '" class="text-link">Event details &rarr;</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }).join("");
}

function fillHomeSpaces(spaces) {
  if (!spaces) return;
  ["house", "stables", "garden"].forEach(function (key) {
    const panel = document.querySelector('.space-panel[href="spaces.html#' + key + '"]');
    const s = spaces[key];
    if (!panel || !s) return;
    if (s.photo) panel.querySelector("img").outerHTML = imgTag(s.photo, 1200, s.photo_description);
    if (s.tagline) panel.querySelector(".eyebrow").textContent = s.tagline;
  });
}

function eventShortDate(text) {
  return readDate(text).toLocaleDateString("en-AU", {
    weekday: "short", day: "numeric", month: "short"
  }).replace(",", "");
}

const PHOTO_FOCUS = { left: "25%", centre: "50%", center: "50%", right: "75%" };

function fillEventList(events) {
  const list = document.querySelector(".event-list");
  if (!list || !events) return;

  const items = upcoming(events);
  if (items.length === 0) {
    list.innerHTML = '<p class="content-empty">New events are on their way. Check back soon.</p>';
    return;
  }

  list.classList.add("ev-list");

  function card(e) {
    const id = slug(e.title);
    const title = esc(e.title);
    const date = eventShortDate(e.date);
    const focus = PHOTO_FOCUS[String(e.photo_focus || "").toLowerCase()] || "50%";

    return (
      '<article class="ev-card" id="' + id + '" style="--focus: ' + focus + '">' +

        '<div class="ev-media reveal">' +
          '<button type="button" class="ev-photo" aria-expanded="false"' +
            ' aria-controls="' + id + '-details" aria-label="See more about ' + title + '">' +
            imgTag(e.photo, 1200, e.photo_description) +
            '<span class="ev-tone" aria-hidden="true"></span>' +
            '<span class="ev-veil" aria-hidden="true"></span>' +
            '<span class="ev-spine" aria-hidden="true">' + title + "</span>" +
            '<span class="ev-more" aria-hidden="true"><span class="ev-line"></span>See more</span>' +
          "</button>" +
          '<div class="ev-caption">' +
            "<h3>" + title + "</h3>" +
            '<p class="ev-date">' + esc(date) + "</p>" +
          "</div>" +
        "</div>" +

        '<div class="ev-details" id="' + id + '-details" inert>' +
          '<div class="ev-details-inner">' +
            '<div class="ev-head">' +
              "<h3>" + title + "</h3>" +
              '<button type="button" class="ev-close"><span class="ev-line"></span>Close</button>' +
            "</div>" +
            (e.description ? '<p class="ev-about">' + esc(e.description) + "</p>" : "") +
            '<ul class="ev-facts">' +
              "<li><strong>When</strong> " + esc(date) + (e.time ? " &middot; " + esc(e.time) : "") + "</li>" +
              (e.where ? "<li><strong>Where</strong> " + esc(e.where) + "</li>" : "") +
              (e.host ? "<li><strong>Host</strong> " + esc(e.host) + "</li>" : "") +
              (e.cost ? "<li><strong>Cost</strong> " + esc(e.cost) + "</li>" : "") +
            "</ul>" +
            '<a href="' + registerLink(e.title) + '" class="button button-dark">Register interest &rarr;</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  let html = "";
  for (let i = 0; i < items.length; i += 3) {
    const row = items.slice(i, i + 3);
    html += '<div class="ev-row">' + row.map(card).join("");
    for (let n = row.length; n < 3; n++) html += '<div class="ev-spacer" aria-hidden="true"></div>';
    html += "</div>";
  }
  list.innerHTML = html;
}

function fillAlbums(albums) {
  const grid = document.querySelector(".album-grid");
  if (!grid || !albums) return;

  grid.innerHTML = shown(albums).map(function (a, i) {

    const photos = [].concat(a.photos || []).filter(Boolean);
    const cover = a.cover || photos[0];
    const meta = [a.when, a.space].filter(Boolean).map(esc).join(" &middot; ");
    return (
      '<article class="album reveal"' + delay(i) + ">" +
        '<button class="album-open" type="button">' +
          '<span class="album-cover">' +
            imgTag(cover, 900, a.title) +
            '<span class="album-count">' + photos.length + (photos.length === 1 ? " photo" : " photos") + "</span>" +
          "</span>" +
          "<h3>" + esc(a.title) + "</h3>" +
          (meta ? '<span class="event-meta">' + meta + "</span>" : "") +
        "</button>" +
        '<div class="album-photos" hidden>' +
          photos.map(function (p, n) {
            return '<img data-src="' + esc(photoUrl(p, 1600)) + '" alt="' + esc(a.title + ", photo " + (n + 1)) + '">';
          }).join("") +
        "</div>" +
      "</article>"
    );
  }).join("");
}

function fillGallery(projects) {
  const grid = document.querySelector(".project-grid");
  if (!grid || !projects) return;

  const labels = { portrait: "Portrait", fashion: "Fashion", product: "Product", bridal: "Bridal" };

  grid.innerHTML = shown(projects).map(function (p, i) {
    const eyebrow = [labels[p.category] || "", p.space].filter(Boolean).map(esc).join(" &middot; ");

    const extras = [].concat(p.photos || []).filter(Boolean);
    const all = extras.length ? [p.photo].concat(extras).filter(Boolean) : [];

    const picture = all.length
      ? '<button class="album-open project-open" type="button" aria-label="See all ' + all.length + ' photos">' +
          '<span class="project-media">' +
            imgTag(p.photo, 900, p.photo_description) +
            '<span class="album-count">' + all.length + " photos</span>" +
          "</span>" +
        "</button>" +
        '<div class="album-photos" hidden>' +
          all.map(function (src, n) {
            return '<img data-src="' + esc(photoUrl(src, 1600)) + '" alt="' + esc(p.title + ", photo " + (n + 1)) + '">';
          }).join("") +
        "</div>"
      : '<div class="project-media">' + imgTag(p.photo, 900, p.photo_description) + "</div>";

    return (
      '<article class="project reveal' + (all.length ? " album" : "") + '" data-category="' + esc(p.category) + '"' + delay(i) + ">" +
        picture +
        (eyebrow ? '<p class="eyebrow eyebrow-dark">' + eyebrow + "</p>" : "") +
        "<h3>" + esc(p.title) + "</h3>" +
        (p.photographer ? '<p class="project-credit">Photographed by ' + esc(p.photographer) + "</p>" : "") +
        (p.link ? '<a href="' + esc(p.link) + '" class="text-link" target="_blank" rel="noopener">View their work &rarr;</a>' : "") +
      "</article>"
    );
  }).join("");
}

function fillSpaces(spaces) {
  if (!spaces) return;
  ["house", "stables", "garden"].forEach(function (key) {
    const section = document.getElementById(key);
    const s = spaces[key];
    if (!section || !s || !section.classList.contains("space-screen")) return;

    if (s.photo) {
      const img = section.querySelector(".space-screen-image");
      img.outerHTML = imgTag(s.photo, 1920, s.photo_description, ' class="space-screen-image"');
    }
    if (s.description) section.querySelector(".space-overview p").textContent = s.description;
    if (s.hourly) {
      section.querySelector(".from-price").innerHTML = "From " + esc(s.hourly) + " <span>per hour</span>";
    }
    const prices = section.querySelectorAll(".rate-price");
    [s.hourly, s.half_day, s.full_day].forEach(function (price, n) {
      if (price && prices[n]) prices[n].textContent = price;
    });
    const note = section.querySelector(".rate-note");
    if (note) {
      note.textContent = s.note || "";
      note.hidden = !s.note;
    }
  });
}

function fillFaq(faq) {
  const section = document.querySelector(".faq");
  if (!section || !faq) return;

  section.querySelectorAll("details").forEach(function (d) { d.remove(); });
  section.insertAdjacentHTML("beforeend", shown(faq).map(function (item) {
    return (
      "<details>" +
        "<summary>" + esc(item.question) + "</summary>" +
        paragraphs(item.answer) +
      "</details>"
    );
  }).join(""));
}

function fillStories(stories) {
  if (!stories || !document.querySelector(".highlights")) return;

  const cards = document.querySelectorAll(".highlight");
  [["golden_child", "Golden Child of the Month"], ["misfit_spotlight", "Misfit Spotlight"]]
    .forEach(function (pair, n) {
      const h = stories[pair[0]];
      const card = cards[n];
      if (!h || !card) return;
      card.hidden = h.show === false;
      if (h.photo) card.querySelector("img").outerHTML = imgTag(h.photo, 900, h.photo_description || h.name);
      card.querySelector(".eyebrow").innerHTML = esc(pair[1]) + (h.month ? " &middot; " + esc(h.month) : "");
      card.querySelector("h3").textContent = h.name || "";
      const paras = card.querySelectorAll("p");
      paras[paras.length - 1].outerHTML = paragraphs(h.story) || "<p></p>";
    });

  const quotes = document.querySelector(".testimonial-list");
  if (quotes && stories.testimonials) {
    const list = shown(stories.testimonials);
    quotes.innerHTML = list.map(function (t, i) {
      return (
        '<blockquote class="reveal"' + delay(i) + ">" +
          "<p>&ldquo;" + esc(t.quote) + "&rdquo;</p>" +
          (t.credit ? "<cite>" + esc(t.credit) + "</cite>" : "") +
        "</blockquote>"
      );
    }).join("");
    document.querySelector(".testimonials").hidden = list.length === 0;
  }

  const section = document.querySelector(".community-stories");
  const grid = document.querySelector(".story-grid");
  if (section && grid) {
    const list = shown(stories.community_stories);
    grid.innerHTML = list.map(function (s, i) {
      return (
        '<article class="story-card reveal"' + delay(i) + ">" +
          (s.photo ? '<div class="story-card-media">' + imgTag(s.photo, 800, s.title) + "</div>" : "") +
          '<p class="eyebrow eyebrow-dark">' + esc(s.name || "Anonymous") + "</p>" +
          "<h3>" + esc(s.title) + "</h3>" +
          '<div class="story-card-text">' + paragraphs(s.story) + "</div>" +
          '<button class="text-link story-more" type="button" aria-expanded="false">Read more &rarr;</button>' +
        "</article>"
      );
    }).join("");
    section.hidden = list.length === 0;

    grid.querySelectorAll(".story-card").forEach(function (card, n) {
      const button = card.querySelector(".story-more");
      if (String(list[n].story || "").length < 320) {
        button.remove();
        return;
      }
      card.classList.add("is-long");
      button.addEventListener("click", function () {
        const open = card.classList.toggle("is-open");
        button.setAttribute("aria-expanded", open ? "true" : "false");
        button.innerHTML = open ? "Show less &uarr;" : "Read more &rarr;";
      });
    });
  }
}

(function () {
  const thisScript = document.currentScript;
  const thenLoad = ((thisScript && thisScript.dataset.then) || "").split(/\s+/).filter(Boolean);

  const needs = {
    home: !!document.querySelector(".hero"),
    events: !!document.querySelector(".next-event, .event-list"),
    albums: !!document.querySelector(".album-grid"),
    gallery: !!document.querySelector(".project-grid"),
    spaces: !!document.querySelector(".space-panel, .space-screen"),
    stories: !!document.querySelector(".highlights"),
    faq: !!document.querySelector(".faq")
  };

  const names = Object.keys(needs).filter(function (n) { return needs[n]; });

  Promise.all(names.map(load)).then(function (results) {
    const data = {};
    names.forEach(function (n, i) { data[n] = results[i]; });

    [
      function () { fillHomePhotos(data.home); },
      function () { fillHomeEvents(data.events); },
      function () { fillHomeSpaces(data.spaces); },
      function () { fillEventList(data.events); },
      function () { fillAlbums(data.albums); },
      function () { fillGallery(data.gallery); },
      function () { fillSpaces(data.spaces); },
      function () { fillFaq(data.faq); },
      function () { fillStories(data.stories); }
    ].forEach(function (fill) {
      try { fill(); } catch (error) { console.warn("Content not loaded:", error); }
    });
  }).then(loadNext);

  function loadNext() {
    const file = thenLoad.shift();
    if (!file) return;
    const script = document.createElement("script");
    script.src = file;
    script.onload = loadNext;
    script.onerror = loadNext;
    document.body.appendChild(script);
  }
})();
