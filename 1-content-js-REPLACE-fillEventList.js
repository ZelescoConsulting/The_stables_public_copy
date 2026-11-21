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
