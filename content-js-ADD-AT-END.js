function videoPlayerFor(link) {
  let url;
  try { url = new URL(String(link || "").trim()); } catch (e) { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\.|^m\./, "");
  const path = url.pathname;
  let m;

  if (host === "youtu.be") {
    return { src: "https://www.youtube-nocookie.com/embed/" + path.slice(1).split("/")[0] + "?autoplay=1&rel=0" };
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.searchParams.get("v")) return { src: "https://www.youtube-nocookie.com/embed/" + url.searchParams.get("v") + "?autoplay=1&rel=0" };
    if ((m = path.match(/^\/(shorts|live|embed)\/([\w-]+)/))) {
      return { src: "https://www.youtube-nocookie.com/embed/" + m[2] + "?autoplay=1&rel=0", tall: m[1] === "shorts" };
    }
  }

  if (host === "vimeo.com" && (m = path.match(/^\/(\d+)(?:\/(\w+))?/))) {
    return { src: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1" + (m[2] ? "&h=" + m[2] : "") };
  }
  if (host === "player.vimeo.com") return { src: url.href };

  if (host === "drive.google.com" && (m = path.match(/\/file\/d\/([\w-]+)/))) {
    return { src: "https://drive.google.com/file/d/" + m[1] + "/preview" };
  }

  if (host === "instagram.com" && (m = path.match(/^\/(p|reel|reels|tv)\/([\w-]+)/))) {
    return { src: "https://www.instagram.com/" + (m[1] === "p" ? "p" : "reel") + "/" + m[2] + "/embed", tall: true };
  }

  if (host === "tiktok.com" && (m = path.match(/\/video\/(\d+)/))) {
    return { src: "https://www.tiktok.com/embed/v2/" + m[1], tall: true };
  }

  if (host === "facebook.com" && /\/(videos|watch|reel)/.test(path + url.search)) {
    return { src: "https://www.facebook.com/plugins/video.php?show_text=false&href=" + encodeURIComponent(url.href) };
  }

  if (host === "loom.com" && (m = path.match(/^\/(?:share|embed)\/(\w+)/))) {
    return { src: "https://www.loom.com/embed/" + m[1] + "?autoplay=1" };
  }
  if (host === "dailymotion.com" && (m = path.match(/^\/video\/(\w+)/))) {
    return { src: "https://www.dailymotion.com/embed/video/" + m[1] + "?autoplay=1" };
  }
  if (host === "dai.ly") return { src: "https://www.dailymotion.com/embed/video/" + path.slice(1) + "?autoplay=1" };
  if (host === "streamable.com" && (m = path.match(/^\/(?:e\/)?(\w+)/))) {
    return { src: "https://streamable.com/e/" + m[1] + "?autoplay=1" };
  }

  if (/\.(mp4|webm|mov|m4v)$/i.test(path)) return { src: url.href, file: true };

  return null;
}

function videoButton(link, title) {
  if (!link || !/^https?:\/\//i.test(String(link).trim())) return "";
  const label = '<span class="video-play" aria-hidden="true"></span>Watch the video';
  if (videoPlayerFor(link)) {
    return '<button class="video-open text-link" type="button" data-video="' + esc(String(link).trim()) +
      '" data-title="' + esc(title || "Video") + '">' + label + "</button>";
  }
  return '<a class="video-open text-link" href="' + esc(String(link).trim()) +
    '" target="_blank" rel="noopener">' + label + " &#8599;</a>";
}

(function () {
  let modal = null, lastFocus = null;

  function close() {
    if (!modal) return;
    modal.remove();
    modal = null;
    document.documentElement.classList.remove("video-modal-open");
    if (lastFocus) lastFocus.focus();
  }

  function open(link, title) {
    const player = videoPlayerFor(link);
    if (!player) { window.open(link, "_blank", "noopener"); return; }
    lastFocus = document.activeElement;

    modal = document.createElement("div");
    modal.className = "video-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", title);

    const frame = document.createElement("div");
    frame.className = "video-modal-frame" + (player.tall ? " is-tall" : "");

    let media;
    if (player.file) {
      media = document.createElement("video");
      media.src = player.src;
      media.controls = true;
      media.autoplay = true;
      media.playsInline = true;
    } else {
      media = document.createElement("iframe");
      media.src = player.src;
      media.title = title;
      media.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
      media.allowFullscreen = true;
      media.referrerPolicy = "strict-origin-when-cross-origin";
    }
    frame.appendChild(media);

    const shut = document.createElement("button");
    shut.className = "video-modal-close";
    shut.type = "button";
    shut.setAttribute("aria-label", "Close video");
    shut.innerHTML = "&times;";

    const source = document.createElement("a");
    source.className = "video-modal-source";
    source.href = link;
    source.target = "_blank";
    source.rel = "noopener";
    source.textContent = "Open on its own site ↗";

    modal.appendChild(frame);
    modal.appendChild(shut);
    modal.appendChild(source);
    document.body.appendChild(modal);
    document.documentElement.classList.add("video-modal-open");
    shut.focus();

    shut.addEventListener("click", close);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) close();
    });
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest && event.target.closest("button.video-open");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    open(button.dataset.video, button.dataset.title);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal) close();
  });
})();
