// ─── Main Content ────────────────────────────────────────────────────────────

const projectsWrap = document.getElementById("projectsWrap");
const projectList = document.getElementById("projectList");
const imageStripWrap = document.getElementById("imageStripWrap");
const imageStripTrack = document.getElementById("imageStripTrack");
const gtBn = document.getElementById("gtBn");

// Disable hover until load animation finishes
projectList.style.pointerEvents = "none";

// Build project name spans
projects.forEach((project, i) => {
  const span = document.createElement("span");
  span.className = "project-name";
  span.textContent = project.name;
  span.addEventListener("mouseenter", () => handleEnter(i));
  span.addEventListener("mouseleave", handleLeave);
  projectList.appendChild(span);
});

const nameEls = document.querySelectorAll(".project-name");

// ─── Drag State ──────────────────────────────────────────────────────────────

let trackOffset = 0;
let maxOffset = 0;
let rafId = null;

// ─── Drag Helpers ────────────────────────────────────────────────────────────

function rubberBand(offset) {
  if (offset < 0) return offset * 0.18;
  if (offset > maxOffset) return maxOffset + (offset - maxOffset) * 0.18;
  return offset;
}

function snapBack() {
  const target = Math.max(0, Math.min(trackOffset, maxOffset));
  if (Math.abs(trackOffset - target) < 0.5) {
    trackOffset = target;
    imageStripTrack.style.transform = `translateX(${-trackOffset}px)`;
    return;
  }
  trackOffset += (target - trackOffset) * 0.12;
  imageStripTrack.style.transform = `translateX(${-trackOffset}px)`;
  rafId = requestAnimationFrame(snapBack);
}

function applyMomentum(velocity) {
  let momentum = velocity * 2.5;
  function step() {
    if (Math.abs(momentum) < 0.3) {
      snapBack();
      return;
    }
    trackOffset -= momentum;
    trackOffset = rubberBand(trackOffset);
    imageStripTrack.style.transform = `translateX(${-trackOffset}px)`;
    momentum *= 0.92;
    rafId = requestAnimationFrame(step);
  }
  step();
}

// ─── Drag Factory (mouse + touch) ────────────────────────────────────────────

function makeDraggable(el) {
  let startX = 0;
  let lastX = 0;
  let vel = 0;
  let offsetAtStart = 0;
  let active = false;

  // Mouse
  el.addEventListener("mousedown", (e) => {
    if (!el.classList.contains("shown")) return;
    active = true;
    startX = lastX = e.clientX;
    vel = 0;
    offsetAtStart = trackOffset;
    cancelAnimationFrame(rafId);
    imageStripTrack.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!active) return;
    vel = e.clientX - lastX;
    lastX = e.clientX;
    trackOffset = rubberBand(offsetAtStart - (e.clientX - startX));
    imageStripTrack.style.transform = `translateX(${-trackOffset}px)`;
  });

  document.addEventListener("mouseup", () => {
    if (!active) return;
    active = false;
    imageStripTrack.style.transition = "none";
    if (trackOffset < 0 || trackOffset > maxOffset) {
      snapBack();
      return;
    }
    applyMomentum(vel);
  });

  // Touch
  el.addEventListener(
    "touchstart",
    (e) => {
      startX = lastX = e.touches[0].clientX;
      vel = 0;
      offsetAtStart = trackOffset;
      cancelAnimationFrame(rafId);
      imageStripTrack.style.transition = "none";
    },
    { passive: true },
  );

  el.addEventListener(
    "touchmove",
    (e) => {
      vel = e.touches[0].clientX - lastX;
      lastX = e.touches[0].clientX;
      trackOffset = rubberBand(offsetAtStart - (e.touches[0].clientX - startX));
      imageStripTrack.style.transform = `translateX(${-trackOffset}px)`;
    },
    { passive: true },
  );

  el.addEventListener("touchend", () => {
    imageStripTrack.style.transition = "none";
    if (trackOffset < 0 || trackOffset > maxOffset) {
      snapBack();
      return;
    }
    applyMomentum(vel);
  });
}

makeDraggable(imageStripWrap);

// ─── Hover Handlers ──────────────────────────────────────────────────────────

let hoveredIndex = null;
let swapTimeout = null;

function handleEnter(i) {
  clearTimeout(swapTimeout);

  const project = projects[i];
  const wasHovering = hoveredIndex !== null;

  nameEls.forEach((el, idx) => el.classList.toggle("faded", idx !== i));

  if (project.isIndex) {
    imageStripWrap.classList.remove("shown");
    gtBn.classList.remove("dimmed");
    gtBn.classList.add("index-shown");
    hoveredIndex = i;
    return;
  }

  gtBn.classList.remove("index-shown");
  gtBn.classList.add("dimmed");

  if (wasHovering && hoveredIndex !== i && !projects[hoveredIndex]?.isIndex) {
    hoveredIndex = i;
    imageStripWrap.classList.remove("shown");
    swapTimeout = setTimeout(() => {
      populateStrip(project.images);
      imageStripWrap.classList.add("shown");
    }, 420);
  } else {
    hoveredIndex = i;
    populateStrip(project.images);
    imageStripWrap.classList.add("shown");
  }
}

function handleLeave() {
  // Intentional no-op — strip stays visible until next project is entered
}

// ─── Image Strip ─────────────────────────────────────────────────────────────

function populateStrip(images) {
  imageStripTrack.innerHTML = "";
  trackOffset = 0;
  imageStripTrack.style.transform = "translateX(0px)";

  images.forEach((imgData) => {
    const img = document.createElement("img");
    img.className = `strip-img ${imgData.aspect}`;
    img.src = imgData.src;
    img.draggable = false;
    imageStripTrack.appendChild(img);
  });

  requestAnimationFrame(() => {
    maxOffset = Math.max(
      0,
      imageStripTrack.scrollWidth - imageStripWrap.offsetWidth + 26,
    );
  });
}

// ─── Load Animation ──────────────────────────────────────────────────────────

setTimeout(() => {
  projectsWrap.classList.add("visible");
  gtBn.classList.add("visible");

  nameEls.forEach((el, i) => {
    setTimeout(() => el.classList.add("visible"), i * 80);
  });

  // Re-enable hover only after all names have staggered in
  setTimeout(() => {
    projectList.style.pointerEvents = "auto";
  }, nameEls.length * 80);
}, 2200);
