const ADMIN_USER = "admin";
const ADMIN_PASSWORD_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
const DISCORD_URL = "https://discord.gg/8njFKqkyhJ";
const PODIUM_STORAGE_KEY = "slovinTierMcPodium";
const CATEGORY_STORAGE_KEY = "slovinTierMcCategoriesV2";
const ABOUT_STORAGE_KEY = "slovinTierMcAboutRules";
const SETTINGS_STORAGE_KEY = "slovinTierMcSettings";
const PLAYERS_PER_PAGE = 20;

const DEFAULT_ABOUT_RULES = `1. Tester decyduje o trybie i czasie testu.
2. Gracz musi używać nicku, który ma być wpisany na listę.
3. Wynik może zostać zmieniony po re-teście.
4. Cheaty, ghost clienty i celowe bugowanie oznaczają brak wpisu.
5. Rank, punkty i miejsce mogą być aktualizowane przez panel admina.`;

const categories = {
  general: {
    kicker: "General Tierlist",
    title: "General Tierlist",
    subtitle: "Ranking General od 1 do 100, z twarzą gracza, punktami i tierem.",
    badge: "GEN",
    badgeLabel: "General",
    tierLabel: "Tier General",
  },
  sword: {
    kicker: "Sword Tierlist",
    title: "Sword Tierlist",
    subtitle: "Ranking Sword od 1 do 100, przygotowany pod walki mieczem.",
    badge: "SWD",
    badgeLabel: "Sword",
    tierLabel: "Tier Sword",
  },
  axe: {
    kicker: "Axe Tierlist",
    title: "Axe Tierlist",
    subtitle: "Ranking Axe od 1 do 100, przygotowany pod topór i presję.",
    badge: "AXE",
    badgeLabel: "Axe",
    tierLabel: "Tier Axe",
  },
  mace: {
    kicker: "Mace Tierlist",
    title: "Mace Tierlist",
    subtitle: "Ranking Mace od 1 do 100, przygotowany pod mace PvP.",
    badge: "MCE",
    badgeLabel: "Mace",
    tierLabel: "Tier Mace",
  },
  crystal: {
    kicker: "Crystal Tierlist",
    title: "Crystal Tierlist",
    subtitle: "Ranking Crystal od 1 do 100, przygotowany pod crystal PvP.",
    badge: "CRY",
    badgeLabel: "Crystal",
    tierLabel: "Tier Crystal",
  },
  potion: {
    kicker: "Potion Tierlist",
    title: "Potion Tierlist",
    subtitle: "Ranking Potion od 1 do 100, przygotowany pod potion PvP.",
    badge: "POT",
    badgeLabel: "Potion",
    tierLabel: "Tier Potion",
  },
};

const categoryOrder = Object.keys(categories);
const defaultPodium = [
  { place: 1, nick: "Notch", rank: "S+", points: 2450 },
  { place: 2, nick: "Dream", rank: "S", points: 2310 },
  { place: 3, nick: "Technoblade", rank: "S", points: 2200 },
];

const viewMeta = {
  home: {
    kicker: "MC List PvP",
    title: "SlovinTierMC List",
    subtitle: "Najlepsza trójka graczy na podium z automatycznie ładowanymi skinami Minecraft.",
  },
  settings: {
    kicker: "Panel strony",
    title: "Ustawienia",
    subtitle: "Zmieniaj styl strony, podświetlenia i animacje bez wysuwanego okna.",
  },
  admin: {
    kicker: "Panel admina",
    title: "Admin",
    subtitle: "Zaloguj się i ręcznie ustaw podium albo pozycję gracza w dowolnej kategorii.",
  },
  about: {
    kicker: "About Tiertesting",
    title: "About Tiertesting",
    subtitle: "Dział gotowy pod zasady testowania i wymagania dla graczy.",
  },
  discord: {
    kicker: "Discord",
    title: "Discord",
    subtitle: "Miejsce na zaproszenie, ogłoszenia i kontakt z testerami.",
  },
  ...categories,
};

const tierMenu = document.querySelector("#tierMenu");
const menuToggle = document.querySelector(".menu-toggle");
const viewTitle = document.querySelector("#viewTitle");
const viewKicker = document.querySelector("#viewKicker");
const viewSubtitle = document.querySelector("#viewSubtitle");
const viewContent = document.querySelector("#viewContent");

let currentView = "home";
let adminUnlocked = sessionStorage.getItem("slovinTierAdminUnlocked") === "true";
let podiumData = loadPodium();
let categoryLists = loadCategoryLists();
let settings = loadSettings();
let aboutRules = loadAboutRules();
let categoryPages = categoryOrder.reduce((pages, categoryName) => {
  pages[categoryName] = 1;
  return pages;
}, {});

function createDefaultCategoryLists() {
  return categoryOrder.reduce((lists, categoryName) => {
    lists[categoryName] = Array.from({ length: 100 }, (_, index) => {
      const place = index + 1;

      return {
        place,
        nick: "None",
        rank: "None",
        points: 0,
      };
    });

    return lists;
  }, {});
}

function loadPodium() {
  try {
    const saved = JSON.parse(localStorage.getItem(PODIUM_STORAGE_KEY));
    if (Array.isArray(saved) && saved.length === 3) {
      return defaultPodium.map((defaultPlayer) => {
        const savedPlayer = saved.find((player) => Number(player.place) === defaultPlayer.place);
        return savedPlayer ? normalizePlayer(savedPlayer, defaultPlayer) : defaultPlayer;
      });
    }
  } catch {
    localStorage.removeItem(PODIUM_STORAGE_KEY);
  }

  return defaultPodium.map((player) => ({ ...player }));
}

function loadCategoryLists() {
  const defaults = createDefaultCategoryLists();

  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY));
    if (!saved || typeof saved !== "object") {
      return defaults;
    }

    categoryOrder.forEach((categoryName) => {
      const savedRows = Array.isArray(saved[categoryName]) ? saved[categoryName] : [];
      defaults[categoryName] = defaults[categoryName].map((defaultPlayer) => {
        const savedPlayer = savedRows.find((player) => Number(player.place) === defaultPlayer.place);
        return savedPlayer ? normalizePlayer(savedPlayer, defaultPlayer) : defaultPlayer;
      });
    });
  } catch {
    localStorage.removeItem(CATEGORY_STORAGE_KEY);
  }

  return defaults;
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
    return {
      glow: saved?.glow !== false,
      motion: saved?.motion !== false,
      theme: ["blue", "green", "violet", "red"].includes(saved?.theme) ? saved.theme : "blue",
    };
  } catch {
    return { glow: true, motion: true, theme: "blue" };
  }
}

function loadAboutRules() {
  const saved = localStorage.getItem(ABOUT_STORAGE_KEY);
  return saved?.trim() ? saved : DEFAULT_ABOUT_RULES;
}

function savePodium() {
  localStorage.setItem(PODIUM_STORAGE_KEY, JSON.stringify(podiumData));
}

function saveCategoryLists() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoryLists));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function saveAboutRules() {
  localStorage.setItem(ABOUT_STORAGE_KEY, aboutRules);
}

function normalizePlayer(player, fallback) {
  return {
    place: Number(player.place) || fallback.place,
    nick: cleanNick(player.nick) || fallback.nick,
    rank: String(player.rank || fallback.rank).trim().slice(0, 12),
    points: Math.max(0, Number.parseInt(player.points, 10) || fallback.points),
  };
}

function cleanNick(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .slice(0, 24);
}

function isEmptyPlayer(player) {
  return !player || cleanNick(player.nick).toLowerCase() === "none";
}

function skinUrl(nick, size = 220, type = "body") {
  const safeNick = encodeURIComponent(cleanNick(nick) || "MHF_Steve");
  return `https://mc-heads.net/${type}/${safeNick}/${size}.png`;
}

function applySettings() {
  document.body.dataset.theme = settings.theme;
  document.body.classList.toggle("no-glow", !settings.glow);
  document.body.classList.toggle("no-motion", !settings.motion);
}

function closeMenu() {
  tierMenu.hidden = true;
  menuToggle.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const willOpen = tierMenu.hidden;
  tierMenu.hidden = !willOpen;
  menuToggle.classList.toggle("is-open", willOpen);
  menuToggle.setAttribute("aria-expanded", String(willOpen));
}

function setActiveButtons(viewName) {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

function setHeading(viewName) {
  const meta = viewMeta[viewName] || viewMeta.home;
  viewKicker.textContent = meta.kicker;
  viewTitle.textContent = meta.title;
  viewSubtitle.textContent = meta.subtitle;
}

function setView(viewName, message = "") {
  currentView = viewMeta[viewName] ? viewName : "home";
  setHeading(currentView);
  setActiveButtons(currentView);
  closeMenu();

  if (currentView === "home") {
    renderHome();
  } else if (currentView === "settings") {
    renderSettings();
  } else if (currentView === "admin") {
    renderAdmin(message);
  } else if (currentView === "discord") {
    renderDiscord();
  } else if (currentView === "about") {
    renderAbout();
  } else if (categories[currentView]) {
    renderCategoryList(currentView);
  }
}

function renderHome() {
  viewContent.innerHTML = "";

  const arena = document.createElement("div");
  arena.className = "podium-arena";

  const grid = document.createElement("div");
  grid.className = "podium-grid";

  [2, 1, 3].forEach((place) => {
    const player = podiumData.find((item) => item.place === place);
    grid.appendChild(createPodiumCard(player));
  });

  arena.appendChild(grid);
  viewContent.appendChild(arena);
}

function createPodiumCard(player) {
  const card = document.createElement("article");
  card.className = `podium-card place-${player.place}`;

  const medal = document.createElement("div");
  medal.className = "place-medal";
  medal.textContent = `${player.place}`;

  const skinStage = document.createElement("div");
  skinStage.className = "skin-stage";

  const skin = document.createElement("img");
  skin.src = skinUrl(player.nick, player.place === 1 ? 280 : 220);
  skin.alt = `Skin gracza ${player.nick}`;
  skin.loading = "lazy";
  skin.addEventListener("error", handleBodySkinError);
  skinStage.appendChild(skin);

  const rank = document.createElement("span");
  rank.className = "player-rank";
  rank.textContent = player.rank;

  const nick = document.createElement("h2");
  nick.className = "player-nick";
  nick.textContent = player.nick;

  const points = document.createElement("p");
  points.className = "player-points";
  points.textContent = `${player.points} punktów`;

  card.append(medal, skinStage, rank, nick, points);
  return card;
}

function renderCategoryList(categoryName) {
  const config = categories[categoryName];
  const players = categoryLists[categoryName];
  const totalPages = Math.ceil(players.length / PLAYERS_PER_PAGE);
  const activePage = Math.min(totalPages, Math.max(1, categoryPages[categoryName] || 1));
  const start = (activePage - 1) * PLAYERS_PER_PAGE;
  const visiblePlayers = players.slice(start, start + PLAYERS_PER_PAGE);
  categoryPages[categoryName] = activePage;

  viewContent.innerHTML = `
    <section class="ranking-shell">
      <div class="ranking-toolbar">
        <div>
          <h2>${escapeHtml(config.title)}</h2>
          <p>Lista pokazuje 20 miejsc na stronę. Zmieniaj strony na dole rankingu.</p>
        </div>
        <span class="ranking-count">Strona ${activePage}/${totalPages}</span>
      </div>
      <div class="ranking-list">
        ${visiblePlayers.map((player) => createRankingRow(player, config)).join("")}
      </div>
      ${createPagination(categoryName, activePage, totalPages)}
    </section>
  `;

  document.querySelectorAll(".rank-avatar").forEach((avatar) => {
    avatar.addEventListener("error", handleAvatarError);
  });
}

function createRankingRow(player, config) {
  const empty = isEmptyPlayer(player);

  return `
    <article class="rank-row${empty ? " is-empty" : ""}">
      <div class="rank-place">${player.place}</div>
      ${empty ? createEmptyAvatar() : `<img class="rank-avatar" src="${skinUrl(player.nick, 48, "avatar")}" alt="Twarz gracza ${escapeHtml(player.nick)}" loading="lazy" />`}
      <div class="rank-profile">
        <strong>${escapeHtml(player.nick)}</strong>
        <span>${empty ? "Brak profilu" : "Profil gracza"}</span>
      </div>
      <div class="rank-points">
        <strong>${player.points}</strong>
        <span>punkty</span>
      </div>
      <div class="rank-category">
        <strong>${escapeHtml(config.badge)}</strong>
        <span>${escapeHtml(config.badgeLabel)}</span>
      </div>
      <div class="rank-tier">
        <strong>${escapeHtml(player.rank)}</strong>
        <span>${escapeHtml(config.tierLabel)}</span>
      </div>
    </article>
  `;
}

function createPagination(categoryName, activePage, totalPages) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return `
    <div class="pagination" aria-label="Strony rankingu">
      <button class="page-button" type="button" data-category-page="${categoryName}" data-page-target="${Math.max(1, activePage - 1)}" ${activePage === 1 ? "disabled" : ""}>Poprzednia</button>
      <div class="page-numbers">
        ${pages
          .map(
            (page) => `
              <button class="page-button number${page === activePage ? " active" : ""}" type="button" data-category-page="${categoryName}" data-page-target="${page}">
                ${page}
              </button>
            `,
          )
          .join("")}
      </div>
      <button class="page-button" type="button" data-category-page="${categoryName}" data-page-target="${Math.min(totalPages, activePage + 1)}" ${activePage === totalPages ? "disabled" : ""}>Następna</button>
    </div>
  `;
}

function createEmptyAvatar() {
  return `
    <div class="rank-avatar empty-avatar" aria-hidden="true">
      <span class="empty-head"></span>
      <span class="empty-body"></span>
    </div>
  `;
}

function createAdminCategoryPreview(player, config) {
  const empty = isEmptyPlayer(player);
  const avatar = empty
    ? createEmptyAvatar()
    : `<img src="${skinUrl(player.nick, 48, "avatar")}" alt="Podgląd twarzy" />`;

  return `
    ${avatar}
    <div>
      <strong>${player.place}. ${escapeHtml(player.nick)}</strong>
      <span>${player.points} punktów · ${escapeHtml(config.badge)} · ${escapeHtml(player.rank)}</span>
    </div>
  `;
}

function handleBodySkinError(event) {
  const image = event.currentTarget;
  if (image.dataset.fallback === "true") {
    return;
  }

  image.dataset.fallback = "true";
  image.src = skinUrl("MHF_Steve", 220);
}

function handleAvatarError(event) {
  const image = event.currentTarget;
  if (image.dataset.fallback === "true") {
    return;
  }

  image.dataset.fallback = "true";
  image.src = skinUrl("MHF_Steve", 48, "avatar");
}

function renderEmpty(title, label) {
  viewContent.innerHTML = "";

  const state = document.createElement("div");
  state.className = "empty-state";
  state.innerHTML = `
    <div class="empty-inner">
      <div class="empty-mark" aria-hidden="true"></div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(label)}</p>
    </div>
  `;

  viewContent.appendChild(state);
}

function renderAbout() {
  const rules = aboutRules
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  viewContent.innerHTML = `
    <section class="rules-card">
      <div class="rules-head">
        <h2>Zasady tiertestingu</h2>
      </div>
      <div class="rules-list">
        ${rules.map((rule, index) => createRuleItem(rule, index + 1)).join("")}
      </div>
    </section>
  `;
}

function createRuleItem(rule, index) {
  return `
    <article class="rule-item">
      <span>${index}</span>
      <p>${escapeHtml(rule.replace(/^\d+\.\s*/, ""))}</p>
    </article>
  `;
}

function renderDiscord() {
  viewContent.innerHTML = `
    <div class="discord-card">
      <div class="discord-big" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M19.2 5.1A15.7 15.7 0 0 0 15.4 4l-.2.4c1.3.3 2.5.9 3.5 1.6a11.7 11.7 0 0 0-4.2-1.3 12 12 0 0 0-5 0 11.7 11.7 0 0 0-4.2 1.3c1-.7 2.2-1.3 3.5-1.6L8.6 4a15.7 15.7 0 0 0-3.8 1.1C2.4 8.6 1.7 12 2 15.3A15.2 15.2 0 0 0 6.7 18l.6-.8a9.5 9.5 0 0 1-1.5-.7l.4-.3c2.8 1.3 5.8 1.3 8.6 0l.4.3c-.5.3-1 .5-1.5.7l.6.8a15.2 15.2 0 0 0 4.7-2.7c.4-3.8-.6-7.1-2.8-10.2ZM8.8 13.2c-.8 0-1.4-.7-1.4-1.5s.6-1.5 1.4-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5Zm6.4 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.4.7 1.4 1.5-.6 1.5-1.4 1.5Z"></path>
        </svg>
      </div>
      <div>
        <h2>Discord</h2>
        <p>Dołącz do serwera testów i ogłoszeń.</p>
        <a class="discord-join" href="${DISCORD_URL}" target="_blank" rel="noreferrer">discord.gg/8njFKqkyhJ</a>
      </div>
    </div>
  `;
}

function renderSettings() {
  viewContent.innerHTML = `
    <div class="settings-grid">
      <section class="settings-card">
        <h2>Efekty</h2>
        <label class="toggle-row" for="glowToggle">
          <span>
            <strong>Podświetlenia</strong>
            <small>Neonowe obramowania i cienie</small>
          </span>
          <input id="glowToggle" type="checkbox" ${settings.glow ? "checked" : ""} />
          <i aria-hidden="true"></i>
        </label>

        <label class="toggle-row" for="motionToggle">
          <span>
            <strong>Animacje</strong>
            <small>Delikatny ruch tła i skinów</small>
          </span>
          <input id="motionToggle" type="checkbox" ${settings.motion ? "checked" : ""} />
          <i aria-hidden="true"></i>
        </label>
      </section>

      <section class="settings-card">
        <h2>Kolorystyka</h2>
        <p>Każdy motyw zmienia całe tło, panele i podświetlenia.</p>
        <div class="theme-grid">
          ${createThemeButton("blue", "Niebieski", "linear-gradient(135deg, #041327, #0a3268, #54d6ff)")}
          ${createThemeButton("green", "Zielony", "linear-gradient(135deg, #031910, #0b472e, #55f0b2)")}
          ${createThemeButton("violet", "Fiolet", "linear-gradient(135deg, #0e0a24, #2b195f, #9fb7ff)")}
          ${createThemeButton("red", "Czerwony", "linear-gradient(135deg, #21050a, #5e1023, #ff6b9d)")}
        </div>
      </section>
    </div>
  `;
}

function createThemeButton(theme, label, swatch) {
  const active = settings.theme === theme ? " active" : "";
  return `
    <button class="theme-button${active}" type="button" data-theme-choice="${theme}">
      <span class="theme-swatch" style="--swatch: ${swatch}"></span>
      <span>${label}</span>
    </button>
  `;
}

function renderAdmin(message = "") {
  if (!adminUnlocked) {
    renderAdminLogin(message);
    return;
  }

  const selectedPodium = podiumData.find((player) => player.place === 1) || podiumData[0];
  const selectedCategory = categoryOrder[0];
  const selectedCategoryPlayer = categoryLists[selectedCategory][0];

  viewContent.innerHTML = `
    <div class="admin-layout">
      <section class="admin-card">
        <h2>Edycja podium</h2>
        <p>Ta część zmienia trzy duże postacie na stronie głównej.</p>
        <form class="form-grid" id="adminEditForm">
          <label class="field">
            <span>Miejsce</span>
            <select name="place" id="podiumPlaceSelect">
              ${podiumData
                .map((player) => `<option value="${player.place}" ${player.place === selectedPodium.place ? "selected" : ""}>${player.place} miejsce</option>`)
                .join("")}
            </select>
          </label>

          <label class="field">
            <span>Nick</span>
            <input name="nick" id="podiumNickInput" type="text" value="${escapeHtml(selectedPodium.nick)}" autocomplete="off" required />
          </label>

          <label class="field">
            <span>Rank</span>
            <input name="rank" id="podiumRankInput" type="text" value="${escapeHtml(selectedPodium.rank)}" maxlength="12" required />
          </label>

          <label class="field">
            <span>Punkty</span>
            <input name="points" id="podiumPointsInput" type="number" min="0" step="1" value="${selectedPodium.points}" required />
          </label>

          <div class="field full">
            <span>Podgląd skina</span>
            <div class="preview-player" id="skinPreview">
              <img src="${skinUrl(selectedPodium.nick, 140)}" alt="Podgląd skina" />
              <div>
                <strong>${escapeHtml(selectedPodium.nick)}</strong>
                <span>${escapeHtml(selectedPodium.rank)} · ${selectedPodium.points} punktów</span>
              </div>
            </div>
          </div>

          <div class="field full">
            <div class="action-row">
              <button class="primary-button" type="submit">Zapisz podium</button>
              <button class="ghost-button" type="button" id="resetPodiumButton">Przywróć podium</button>
            </div>
          </div>
        </form>
      </section>

      <section class="admin-card">
        <h2>Edycja kategorii</h2>
        <p>Wybierz listę, miejsce od 1 do 100 i wpisz dane jednej linijki rankingu.</p>
        <form class="form-grid" id="categoryEditForm">
          <label class="field">
            <span>Kategoria</span>
            <select name="category" id="categorySelect">
              ${categoryOrder
                .map((name) => `<option value="${name}">${categories[name].title}</option>`)
                .join("")}
            </select>
          </label>

          <label class="field">
            <span>Miejsce 1-100</span>
            <input name="place" id="categoryPlaceInput" type="number" min="1" max="100" step="1" value="${selectedCategoryPlayer.place}" required />
          </label>

          <label class="field">
            <span>Nick</span>
            <input name="nick" id="categoryNickInput" type="text" value="${escapeHtml(selectedCategoryPlayer.nick)}" autocomplete="off" />
          </label>

          <label class="field">
            <span>Rank w kategorii</span>
            <input name="rank" id="categoryRankInput" type="text" value="${escapeHtml(selectedCategoryPlayer.rank)}" maxlength="12" />
          </label>

          <label class="field">
            <span>Punkty</span>
            <input name="points" id="categoryPointsInput" type="number" min="0" step="1" value="${selectedCategoryPlayer.points}" required />
          </label>

          <div class="field">
            <span>Znaczek</span>
            <div class="admin-badge-preview" id="categoryBadgePreview">${categories[selectedCategory].badge}</div>
          </div>

          <div class="field full">
            <span>Podgląd linijki</span>
            <div class="preview-player wide" id="categoryPreview">
              ${createAdminCategoryPreview(selectedCategoryPlayer, categories[selectedCategory])}
            </div>
          </div>

          <div class="field full">
            <div class="action-row">
              <button class="primary-button" type="submit">Zapisz kategorię</button>
              <button class="ghost-button" type="button" id="resetCategoriesButton">Przywróć kategorie</button>
              <button class="ghost-button" type="button" id="logoutAdminButton">Wyloguj</button>
            </div>
          </div>
        </form>
      </section>

      <section class="admin-card full">
        <h2>About Tiertesting</h2>
        <p>Te zasady pokażą się w zakładce About Tiertesting.</p>
        <form id="aboutRulesForm">
          <label class="field full">
            <span>Zasady</span>
            <textarea name="rules" id="aboutRulesInput" rows="8">${escapeHtml(aboutRules)}</textarea>
          </label>
          <div class="action-row">
            <button class="primary-button" type="submit">Zapisz zasady</button>
            <button class="ghost-button" type="button" id="resetAboutButton">Przywróć zasady</button>
          </div>
        </form>
      </section>

      <section class="admin-card full">
        <h2>Podgląd podium</h2>
        <div class="admin-preview compact">
          ${podiumData
            .slice()
            .sort((a, b) => a.place - b.place)
            .map(
              (player) => `
                <div class="preview-player">
                  <img src="${skinUrl(player.nick, 120)}" alt="Skin gracza ${escapeHtml(player.nick)}" />
                  <div>
                    <strong>${player.place}. ${escapeHtml(player.nick)}</strong>
                    <span>${escapeHtml(player.rank)} · ${player.points} punktów</span>
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
        ${message ? `<p class="message">${escapeHtml(message)}</p>` : ""}
      </section>
    </div>
  `;

  bindPodiumEditor();
  bindCategoryEditor();
}

function renderAdminLogin(message = "") {
  viewContent.innerHTML = `
    <div class="admin-layout">
      <section class="admin-card">
        <h2>Logowanie</h2>
        <p>Hasło jest sprawdzane przez hash, więc nie leży jawnie w pliku JS.</p>
        <form class="form-grid" id="adminLoginForm">
          <label class="field full">
            <span>Nazwa</span>
            <input name="user" type="text" value="admin" autocomplete="username" required />
          </label>
          <label class="field full">
            <span>Hasło</span>
            <input name="password" type="password" autocomplete="current-password" required />
          </label>
          <div class="field full">
            <button class="primary-button" type="submit">Wejdź do panelu</button>
          </div>
        </form>
        ${message ? `<p class="message error">${escapeHtml(message)}</p>` : ""}
      </section>
    </div>
  `;
}

function bindPodiumEditor() {
  const placeSelect = document.querySelector("#podiumPlaceSelect");
  const nickInput = document.querySelector("#podiumNickInput");
  const rankInput = document.querySelector("#podiumRankInput");
  const pointsInput = document.querySelector("#podiumPointsInput");
  const preview = document.querySelector("#skinPreview");

  placeSelect.addEventListener("change", () => {
    const player = podiumData.find((item) => item.place === Number(placeSelect.value));
    nickInput.value = player.nick;
    rankInput.value = player.rank;
    pointsInput.value = player.points;
    updateSkinPreview();
  });

  [nickInput, rankInput, pointsInput].forEach((input) => {
    input.addEventListener("input", updateSkinPreview);
  });

  function updateSkinPreview() {
    const nick = cleanNick(nickInput.value) || "MHF_Steve";
    const rank = rankInput.value.trim() || "Brak";
    const points = Math.max(0, Number.parseInt(pointsInput.value, 10) || 0);

    preview.innerHTML = `
      <img src="${skinUrl(nick, 140)}" alt="Podgląd skina" />
      <div>
        <strong>${escapeHtml(nick)}</strong>
        <span>${escapeHtml(rank)} · ${points} punktów</span>
      </div>
    `;
  }
}

function bindCategoryEditor() {
  const categorySelect = document.querySelector("#categorySelect");
  const placeInput = document.querySelector("#categoryPlaceInput");
  const nickInput = document.querySelector("#categoryNickInput");
  const rankInput = document.querySelector("#categoryRankInput");
  const pointsInput = document.querySelector("#categoryPointsInput");
  const badgePreview = document.querySelector("#categoryBadgePreview");
  const preview = document.querySelector("#categoryPreview");

  [categorySelect, placeInput].forEach((input) => {
    input.addEventListener("change", syncCategoryFields);
  });

  [nickInput, rankInput, pointsInput].forEach((input) => {
    input.addEventListener("input", updateCategoryPreview);
  });

  function syncCategoryFields() {
    const categoryName = categorySelect.value;
    const place = clampPlace(placeInput.value);
    const player = categoryLists[categoryName][place - 1];

    placeInput.value = place;
    nickInput.value = player.nick;
    rankInput.value = player.rank;
    pointsInput.value = player.points;
    badgePreview.textContent = categories[categoryName].badge;
    updateCategoryPreview();
  }

  function updateCategoryPreview() {
    const categoryName = categorySelect.value;
    const config = categories[categoryName];
    const place = clampPlace(placeInput.value);
    const nick = cleanNick(nickInput.value) || "None";
    const empty = nick.toLowerCase() === "none";
    const rank = empty ? "None" : rankInput.value.trim() || "None";
    const points = empty ? 0 : Math.max(0, Number.parseInt(pointsInput.value, 10) || 0);
    const player = { place, nick, rank, points };

    badgePreview.textContent = config.badge;
    preview.innerHTML = createAdminCategoryPreview(player, config);
  }
}

async function hashText(value) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function handleAdminLogin(form) {
  const formData = new FormData(form);
  const user = String(formData.get("user") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordHash = await hashText(password);

  if (user === ADMIN_USER && passwordHash === ADMIN_PASSWORD_HASH) {
    adminUnlocked = true;
    sessionStorage.setItem("slovinTierAdminUnlocked", "true");
    setView("admin", "Zalogowano do panelu admina.");
    return;
  }

  setView("admin", "Niepoprawna nazwa lub hasło.");
}

function handlePodiumSave(form) {
  const formData = new FormData(form);
  const place = Number(formData.get("place"));
  const nick = cleanNick(formData.get("nick"));
  const rank = String(formData.get("rank") || "").trim().slice(0, 12);
  const points = Math.max(0, Number.parseInt(formData.get("points"), 10) || 0);

  if (!place || !nick || !rank) {
    setView("admin", "Uzupełnij miejsce, nick i rank.");
    return;
  }

  podiumData = podiumData.map((player) =>
    player.place === place ? { place, nick, rank, points } : player,
  );
  savePodium();
  setView("admin", `Zapisano ${nick} na ${place} miejscu podium.`);
}

function handleCategorySave(form) {
  const formData = new FormData(form);
  const categoryName = String(formData.get("category") || "general");
  const place = clampPlace(formData.get("place"));
  const nick = cleanNick(formData.get("nick")) || "None";
  const empty = nick.toLowerCase() === "none";
  const rank = empty ? "None" : String(formData.get("rank") || "None").trim().slice(0, 12) || "None";
  const points = empty ? 0 : Math.max(0, Number.parseInt(formData.get("points"), 10) || 0);

  if (!categories[categoryName]) {
    setView("admin", "Wybierz poprawną kategorię.");
    return;
  }

  categoryLists[categoryName][place - 1] = { place, nick, rank, points };
  saveCategoryLists();
  setView("admin", `Zapisano ${nick} na ${place} miejscu w ${categories[categoryName].title}.`);
}

function clampPlace(value) {
  return Math.min(100, Math.max(1, Number.parseInt(value, 10) || 1));
}

function resetPodium() {
  podiumData = defaultPodium.map((player) => ({ ...player }));
  savePodium();
  setView("admin", "Przywrócono domyślne podium.");
}

function resetCategories() {
  categoryLists = createDefaultCategoryLists();
  saveCategoryLists();
  setView("admin", "Przywrócono domyślne kategorie.");
}

function handleAboutSave(form) {
  const formData = new FormData(form);
  aboutRules = String(formData.get("rules") || "").trim() || DEFAULT_ABOUT_RULES;
  saveAboutRules();
  setView("admin", "Zapisano zasady About Tiertesting.");
}

function resetAboutRules() {
  aboutRules = DEFAULT_ABOUT_RULES;
  saveAboutRules();
  setView("admin", "Przywrócono domyślne zasady.");
}

function logoutAdmin() {
  adminUnlocked = false;
  sessionStorage.removeItem("slovinTierAdminUnlocked");
  setView("admin");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

menuToggle.addEventListener("click", toggleMenu);

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.addEventListener("click", (event) => {
  const clickedInsideMenu = tierMenu.contains(event.target) || menuToggle.contains(event.target);
  if (!clickedInsideMenu) {
    closeMenu();
  }

  const pageButton = event.target.closest("[data-category-page]");
  if (pageButton && !pageButton.disabled) {
    categoryPages[pageButton.dataset.categoryPage] = Number(pageButton.dataset.pageTarget) || 1;
    setView(pageButton.dataset.categoryPage);
  }

  const themeButton = event.target.closest("[data-theme-choice]");
  if (themeButton) {
    settings.theme = themeButton.dataset.themeChoice;
    applySettings();
    saveSettings();
    renderSettings();
  }

  if (event.target.closest("#resetPodiumButton")) {
    resetPodium();
  }

  if (event.target.closest("#resetCategoriesButton")) {
    resetCategories();
  }

  if (event.target.closest("#resetAboutButton")) {
    resetAboutRules();
  }

  if (event.target.closest("#logoutAdminButton")) {
    logoutAdmin();
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.matches("#adminLoginForm")) {
    event.preventDefault();
    await handleAdminLogin(event.target);
  }

  if (event.target.matches("#adminEditForm")) {
    event.preventDefault();
    handlePodiumSave(event.target);
  }

  if (event.target.matches("#categoryEditForm")) {
    event.preventDefault();
    handleCategorySave(event.target);
  }

  if (event.target.matches("#aboutRulesForm")) {
    event.preventDefault();
    handleAboutSave(event.target);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("#glowToggle")) {
    settings.glow = event.target.checked;
    applySettings();
    saveSettings();
  }

  if (event.target.matches("#motionToggle")) {
    settings.motion = event.target.checked;
    applySettings();
    saveSettings();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

applySettings();
setView("home");
