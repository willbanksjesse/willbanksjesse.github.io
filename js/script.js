/* ==========================================================
   Jesse Willbanks — portfolio scripts
   Shared by every page. Each feature checks that its elements
   exist before running, so one file can serve all five pages.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initGreeting();
  initBackToTop();
  initFooterYear();
  initSkillsPanel();
  initCopyEmail();
  initProjects();
});

/* ---------- Dark / light mode ---------- */
const THEME_KEY = "jw-theme";

function readSavedTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
}
function saveTheme(value) {
  try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* storage unavailable: theme just won't persist */ }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const icon = btn.querySelector("i");
  const goingTo = theme === "dark" ? "light" : "dark";
  icon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
  btn.setAttribute("aria-label", `Switch to ${goingTo} mode`);
  btn.setAttribute("title", `Switch to ${goingTo} mode`);
}

function initTheme() {
  const saved = readSavedTheme();
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  });
}

/* ---------- Greeting based on the visitor's local time ---------- */
function initGreeting() {
  const el = document.getElementById("greeting");
  if (!el) return;
  const hour = new Date().getHours();
  let text = "Good evening, thanks for stopping by.";
  if (hour < 12) text = "Good morning, thanks for stopping by.";
  else if (hour < 17) text = "Good afternoon, thanks for stopping by.";
  el.textContent = text;
}

/* ---------- Back-to-top button ---------- */
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  const toggle = () => btn.classList.toggle("show", window.scrollY > 500);
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
  btn.addEventListener("click", () => window.scrollTo({ top: 0 }));
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  document.querySelectorAll(".js-year").forEach(el => { el.textContent = new Date().getFullYear(); });
}

/* ---------- Skills detail panel ---------- */
function initSkillsPanel() {
  const panel = document.getElementById("skillPanel");
  const chips = document.querySelectorAll(".skill-chip");
  if (!panel || chips.length === 0) return;

  const nameEl = panel.querySelector("[data-panel-name]");
  const groupEl = panel.querySelector("[data-panel-group]");
  const detailEl = panel.querySelector("[data-panel-detail]");

  chips.forEach(chip => {
    chip.setAttribute("aria-pressed", "false");
    chip.addEventListener("click", () => {
      chips.forEach(c => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");

      const group = chip.closest(".skill-group").querySelector("h3").textContent.trim();
      nameEl.textContent = chip.textContent.trim();
      groupEl.textContent = group;
      groupEl.hidden = false;
      detailEl.textContent = chip.dataset.detail;
      detailEl.classList.remove("panel-hint");

      // On small screens the panel sits below the list, so bring it into view
      if (window.innerWidth < 992) panel.scrollIntoView({ block: "nearest" });
    });
  });
}

/* ---------- Copy email to clipboard ---------- */
function initCopyEmail() {
  const btn = document.getElementById("copyEmail");
  if (!btn) return;
  const toastEl = document.getElementById("copyToast");
  const toast = toastEl ? bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2200 }) : null;

  btn.addEventListener("click", async () => {
    const email = btn.dataset.email;
    let copied = false;
    try {
      await navigator.clipboard.writeText(email);
      copied = true;
    } catch (e) {
      copied = false;
    }
    if (toastEl) {
      toastEl.querySelector(".toast-body").textContent = copied
        ? `Copied ${email}`
        : `Couldn't copy automatically. The address is ${email}`;
      toast.show();
    }
  });
}

/* ==========================================================
   Projects page
   1. fetch() projects.json
   2. response.json() turns it into JavaScript objects
   3. loop through the array and build a Bootstrap card for each
   4. filter by category buttons and keyword search
   5. open details in a Bootstrap modal
   ========================================================== */
let allProjects = [];
let activeCategory = "All";
let searchTerm = "";

async function initProjects() {
  const grid = document.getElementById("projectGrid");
  if (!grid) return;

  try {
    // Main path: load the JSON file with fetch() and convert it to JavaScript objects
    const response = await fetch("data/projects.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    allProjects = await response.json();
  } catch (err) {
    // Backup path: browsers block fetch() when a page is opened straight from the
    // computer (a file:// address). data/projects-backup.js holds the same project
    // list so the page still works when opened that way.
    if (Array.isArray(window.PROJECTS_BACKUP)) {
      allProjects = window.PROJECTS_BACKUP;
    } else {
      grid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning mb-0" role="alert">
            Projects couldn't load (${escapeHtml(err.message)}). Check that the data folder
            is next to projects.html, then reload the page.
          </div>
        </div>`;
      return;
    }
  }

  buildFilterButtons();
  renderProjects();

  const search = document.getElementById("projectSearch");
  if (search) {
    search.addEventListener("input", e => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderProjects();
    });
  }

  const clear = document.getElementById("clearFilters");
  if (clear) clear.addEventListener("click", resetFilters);
}

function buildFilterButtons() {
  const wrap = document.getElementById("filterButtons");
  if (!wrap) return;

  // Categories come from the JSON, so adding a project with a new category adds a button automatically
  const categories = ["All", ...new Set(allProjects.map(p => p.category))];

  wrap.innerHTML = "";
  categories.forEach(cat => {
    const count = cat === "All" ? allProjects.length : allProjects.filter(p => p.category === cat).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn" + (cat === activeCategory ? " active" : "");
    btn.dataset.category = cat;
    btn.setAttribute("aria-pressed", cat === activeCategory ? "true" : "false");
    btn.innerHTML = `${escapeHtml(cat)}<span class="count">${count}</span>`;
    btn.addEventListener("click", () => {
      activeCategory = cat;
      wrap.querySelectorAll(".filter-btn").forEach(b => {
        const on = b.dataset.category === cat;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderProjects();
    });
    wrap.appendChild(btn);
  });
}

function resetFilters() {
  activeCategory = "All";
  searchTerm = "";
  const search = document.getElementById("projectSearch");
  if (search) search.value = "";
  buildFilterButtons();
  renderProjects();
}

function matchesSearch(project) {
  if (!searchTerm) return true;
  const haystack = [
    project.title, project.subtitle, project.description, project.category, project.role,
    ...(project.technologies || [])
  ].join(" ").toLowerCase();
  return haystack.includes(searchTerm);
}

function renderProjects() {
  const grid = document.getElementById("projectGrid");
  const status = document.getElementById("projectStatus");
  const empty = document.getElementById("emptyState");

  const visible = allProjects.filter(p =>
    (activeCategory === "All" || p.category === activeCategory) && matchesSearch(p)
  );

  grid.innerHTML = "";
  for (const project of visible) {
    grid.appendChild(createProjectCard(project));
  }

  if (empty) empty.hidden = visible.length !== 0;
  if (status) {
    const where = activeCategory === "All" ? "" : ` in ${activeCategory}`;
    const query = searchTerm ? ` matching "${searchTerm}"` : "";
    status.textContent = `Showing ${visible.length} of ${allProjects.length} projects${where}${query}.`;
  }
}

function createProjectCard(project) {
  const col = document.createElement("div");
  col.className = "col-md-6 col-xl-4";

  const thumb = project.images && project.images.length
    ? `<div class="project-thumb"><img src="${escapeHtml(project.images[0])}" alt="${escapeHtml(project.title)} preview" loading="lazy"></div>`
    : `<div class="project-thumb placeholder-thumb" aria-hidden="true"><i class="bi bi-graph-up-arrow"></i></div>`;

  const techBadges = (project.technologies || [])
    .map(t => `<span class="badge tech-badge">${escapeHtml(t)}</span>`)
    .join("");

  col.innerHTML = `
    <article class="card project-card">
      ${thumb}
      <div class="card-body">
        <span class="category-badge">${escapeHtml(project.category)}</span>
        <h3 class="card-title">${escapeHtml(project.title)}</h3>
        <div class="subtitle">${escapeHtml(project.subtitle || "")}</div>
        <p class="desc">${escapeHtml(project.description)}</p>
        <div class="tech" aria-label="Technologies used">${techBadges}</div>
        <button type="button" class="btn btn-line">View details</button>
      </div>
    </article>`;

  col.querySelector("button").addEventListener("click", () => openProjectModal(project));
  return col;
}

function openProjectModal(project) {
  const modalEl = document.getElementById("projectModal");
  if (!modalEl) return;

  modalEl.querySelector(".modal-title").textContent = project.title;
  modalEl.querySelector("[data-modal-meta]").textContent =
    [project.role, project.date].filter(Boolean).join(", ");

  const body = modalEl.querySelector("[data-modal-body]");
  const images = project.images || [];

  let gallery = "";
  if (images.length === 1) {
    gallery = `<div class="carousel"><div class="carousel-item active"><img src="${escapeHtml(images[0])}" alt="${escapeHtml(project.title)}"></div></div>`;
  } else if (images.length > 1) {
    const slides = images.map((src, i) => `
      <div class="carousel-item${i === 0 ? " active" : ""}">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)}, image ${i + 1} of ${images.length}">
      </div>`).join("");
    gallery = `
      <div id="projectCarousel" class="carousel slide">
        <div class="carousel-inner">${slides}</div>
        <button class="carousel-control-prev" type="button" data-bs-target="#projectCarousel" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous image</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#projectCarousel" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next image</span>
        </button>
      </div>`;
  }

  const highlights = (project.highlights || []).map(h => `<li>${escapeHtml(h)}</li>`).join("");
  const tech = (project.technologies || []).map(t => `<span class="badge tech-badge">${escapeHtml(t)}</span>`).join("");

  body.innerHTML = `
    ${gallery}
    <p>${escapeHtml(project.description)}</p>
    ${project.impact ? `<div class="impact-line">${escapeHtml(project.impact)}</div>` : ""}
    ${highlights ? `<h3 class="h5">What I did</h3><ul>${highlights}</ul>` : ""}
    <h3 class="h5 mt-4">Tools and methods</h3>
    <div>${tech}</div>
    ${project.note ? `<p class="meta mt-3 mb-0">${escapeHtml(project.note)}</p>` : ""}`;

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* Prevent JSON text from being interpreted as HTML */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
