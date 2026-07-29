import "./style.css";

const acquisitionLabels = {
  arc_suit_fair: "Arc Suit Fair",
  ex_master_fair: "EX Master Fair",
  master_fair: "Master Fair",
  ex_fair: "EX Fair",
  poke_fair: "Poke Fair",
  seasonal: "Seasonal",
  special_costume: "Special Costume",
  variety: "Variety",
  spotlight: "Spotlight",
  trainer_lodge: "Trainer Lodge",
  battle_points: "Battle Points",
  ticket_exchange: "Ticket Exchange",
  gym_scout: "Gym Scout",
  event_reward: "Event Reward",
  main_story: "Main Story",
  legendary_adventures: "Legendary Adventures",
  general_pool: "General Pool"
};

const state = {
  snapshot: null,
  challengePairs: [],
  selectedMemberId: "all",
  query: "",
  typeFilter: "all",
  acquisitionFilters: [],
  roleFilter: "all",
  challengeOnly: false,
  sortKey: "label",
  challengeModalOpen: false,
  selectedChallengePairIds: [],
  challengePairQuery: "",
  selectedChallengeRound: 4
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fallbackAcquisitionCategory(pair) {
  const acquisition = pair?.acquisition ?? "";
  if (!acquisition) return "general_pool";
  if (acquisition.includes("Arc Suit Fair")) return "arc_suit_fair";
  if (acquisition.includes("EX Master Fair")) return "ex_master_fair";
  if (acquisition.includes("Master Fair")) return "master_fair";
  if (acquisition.includes("EX Fair")) return "ex_fair";
  if (acquisition.includes("Poké Fair") || acquisition.includes("Poke Fair")) return "poke_fair";
  if (acquisition.includes("Seasonal")) return "seasonal";
  if (acquisition.includes("Special Costume")) return "special_costume";
  if (acquisition.includes("Variety")) return "variety";
  if (acquisition.includes("Spotlight")) return "spotlight";
  if (acquisition.includes("Trainer Lodge")) return "trainer_lodge";
  if (acquisition.includes("Battle Points")) return "battle_points";
  if (acquisition.includes("Training Ticket")) return "ticket_exchange";
  if (acquisition.includes("Gym Scout")) return "gym_scout";
  if (acquisition.includes("Event Reward")) return "event_reward";
  if (acquisition.includes("Legendary Adventures")) return "legendary_adventures";
  if (acquisition.includes("Main Story")) return "main_story";
  return "general_pool";
}

function getPairAcquisitionCategory(pair) {
  return pair?.acquisitionCategory || fallbackAcquisitionCategory(pair);
}

function pairMatchesFilters(pair, ownerName, significantPairIds) {
  const matchesQuery =
    !state.query ||
    `${pair.label} ${ownerName} ${pair.type} ${pair.roleLabel} ${pair.trainerName} ${pair.pokemonName}`
      .toLowerCase()
      .includes(state.query.toLowerCase());
  const matchesType = state.typeFilter === "all" || pair.type === state.typeFilter;
  const matchesPremium =
    state.acquisitionFilters.length === 0 || state.acquisitionFilters.includes(getPairAcquisitionCategory(pair));
  const matchesRole = state.roleFilter === "all" || pair.roleCategory === state.roleFilter;
  const matchesChallenge = !state.challengeOnly || significantPairIds.has(pair.pairId);

  return matchesQuery && matchesType && matchesPremium && matchesRole && matchesChallenge;
}

function toggleAcquisitionFilter(acquisitionCategory) {
  const hasFilter = state.acquisitionFilters.includes(acquisitionCategory);
  state.acquisitionFilters = hasFilter
    ? state.acquisitionFilters.filter((value) => value !== acquisitionCategory)
    : [...state.acquisitionFilters, acquisitionCategory];
  render();
}

function getVisiblePairs(snapshot) {
  const significantPairIds = new Set(snapshot.currentChallenge?.significantPairIds ?? []);
  const sourcePairs =
    state.selectedMemberId === "all"
      ? snapshot.members.flatMap((member) =>
          member.pairs.map((pair) => ({
            ...pair,
            ownerName: member.displayName
          }))
        )
      : (snapshot.members.find((member) => member.id === state.selectedMemberId)?.pairs ?? []).map((pair) => ({
          ...pair,
          ownerName: snapshot.members.find((member) => member.id === state.selectedMemberId)?.displayName ?? ""
        }));

  return sourcePairs.filter((pair) => pairMatchesFilters(pair, pair.ownerName, significantPairIds)).sort((a, b) => {
    if (state.sortKey === "owner") {
      const ownerCompare = a.ownerName.localeCompare(b.ownerName);
      if (ownerCompare !== 0) return ownerCompare;
      return a.label.localeCompare(b.label);
    }
    if (state.sortKey === "type") {
      const typeCompare = (a.type || "").localeCompare(b.type || "");
      if (typeCompare !== 0) return typeCompare;
      return a.label.localeCompare(b.label);
    }
    if (state.sortKey === "premium") {
      const acquisitionCompare = (acquisitionLabels[a.acquisitionCategory] || a.acquisitionCategory).localeCompare(
        acquisitionLabels[b.acquisitionCategory] || b.acquisitionCategory
      );
      if (acquisitionCompare !== 0) return acquisitionCompare;
      return a.label.localeCompare(b.label);
    }
    return a.label.localeCompare(b.label);
  });
}

function getGroupedMemberCoverage(snapshot) {
  const significantPairIds = new Set(snapshot.currentChallenge?.significantPairIds ?? []);

  return snapshot.members
    .map((member) => {
      const pairs = member.pairs
        .filter((pair) => pairMatchesFilters(pair, member.displayName, significantPairIds))
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        memberId: member.id,
        memberName: member.displayName,
        pairCount: pairs.length,
        pairs
      };
    })
    .filter((member) => member.pairCount > 0)
    .sort((a, b) => {
      if (b.pairCount !== a.pairCount) return b.pairCount - a.pairCount;
      return a.memberName.localeCompare(b.memberName);
    });
}

function getChallengePairCatalog(snapshot) {
  const entries = snapshot.currentChallenge?.significantPairs ?? [];
  const byId = new Map();

  entries.forEach((entry) => {
    const existing = byId.get(entry.pairId);
    if (!existing) {
      byId.set(entry.pairId, {
        pairId: entry.pairId,
        label: entry.label,
        categories: new Set(entry.category ? [entry.category] : []),
        leaders: new Set(entry.leaderName ? [entry.leaderName] : [])
      });
      return;
    }
    if (entry.category) existing.categories.add(entry.category);
    if (entry.leaderName) existing.leaders.add(entry.leaderName);
  });

  return Array.from(byId.values())
    .map((entry) => ({
      pairId: entry.pairId,
      label: entry.label,
      categories: Array.from(entry.categories).sort(),
      leaders: Array.from(entry.leaders).sort()
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getLeaderRoundEffect(leader, currentChallenge, roundNumber) {
  if (!leader || !currentChallenge) return "";
  if (roundNumber === 1) return leader.battle1Effect || "";
  if (roundNumber === 2) return leader.battle2Effect || "";
  if (roundNumber === 3) return leader.battle3Effect || "";

  const modifiers = ["modifier1", "modifier2", "modifier3"]
    .map((key) => currentChallenge.modifiers?.[key] || "")
    .filter(Boolean);
  if (modifiers.length < 3) return "";
  const baseOffset = (roundNumber - 4) % 3;
  const modifierIndex = (baseOffset + leader.slotNumber - 1) % 3;
  return modifiers[modifierIndex] || "";
}

function getRoundStats(currentChallenge, roundNumber) {
  const rows = currentChallenge?.roundStats ?? [];
  const exact = rows.find((row) => row.roundNumber === roundNumber);
  if (exact) return exact;
  const eligible = rows
    .filter((row) => row.roundNumber <= roundNumber)
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];
  return eligible || rows[rows.length - 1] || null;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function renderChallengeOverviewMarkup(currentChallenge) {
  if (!currentChallenge) return "";

  const selectedChallengeStats = getRoundStats(currentChallenge, state.selectedChallengeRound);

  return `<section class="challenge-overview-panel">
      <div class="challenge-overview-header">
        <div>
          <p class="eyebrow">Current challenge</p>
          <h2>${escapeHtml(currentChallenge.name)}</h2>
          <p class="challenge-note">${escapeHtml(currentChallenge.notes || "No challenge notes.")}</p>
        </div>
        <div class="challenge-round-picker">
          <label>
            <span>Round</span>
            <select data-role="challenge-round-select">
              ${Array.from({ length: 30 }, (_, index) => index + 1)
                .map(
                  (roundNumber) =>
                    `<option value="${roundNumber}"${roundNumber === state.selectedChallengeRound ? " selected" : ""}>Round ${roundNumber}</option>`
                )
                .join("")}
            </select>
          </label>
        </div>
      </div>
      ${
        selectedChallengeStats
          ? `<div class="challenge-stats-grid">
              <div><strong>${formatNumber(selectedChallengeStats.points)}</strong><span>Round points</span></div>
              <div><strong>${formatNumber(selectedChallengeStats.cumulativePoints)}</strong><span>Total points</span></div>
              <div><strong>${formatNumber(selectedChallengeStats.middleHp)}</strong><span>Middle HP</span></div>
              <div><strong>${formatNumber(selectedChallengeStats.sideHp)}</strong><span>Side HP</span></div>
              <div><strong>${formatNumber(selectedChallengeStats.middleOffenses)}</strong><span>Middle offenses</span></div>
              <div><strong>${formatNumber(selectedChallengeStats.sideOffenses)}</strong><span>Side offenses</span></div>
            </div>`
          : ""
      }
      <div class="challenge-leader-grid">
        ${(currentChallenge.leaders ?? [])
          .map(
            (leader) => `
              <article class="challenge-leader-card">
                <p class="section-title">Leader ${escapeHtml(leader.slotNumber)}</p>
                <h3>${escapeHtml(leader.leaderName)}</h3>
                <p>${escapeHtml(leader.bossType || "Unknown")} | weak to ${escapeHtml(leader.weaknessType || "Unknown")}</p>
                <p class="challenge-effect">${escapeHtml(getLeaderRoundEffect(leader, currentChallenge, state.selectedChallengeRound) || "No effect configured")}</p>
              </article>`
          )
          .join("")}
      </div>
    </section>`;
}

function bindChallengeOverviewEvents(root, currentChallenge) {
  if (!root || !currentChallenge) return;

  root.querySelector('[data-role="challenge-round-select"]')?.addEventListener("change", (event) => {
    state.selectedChallengeRound = Number(event.target.value) || 4;
    updateChallengeOverview();
  });
}

function updateChallengeOverview() {
  const currentChallenge = state.snapshot?.currentChallenge;
  const overviewRoot = document.querySelector("#challengeOverviewRoot");
  if (!overviewRoot || !currentChallenge) return;

  overviewRoot.innerHTML = renderChallengeOverviewMarkup(currentChallenge);
  bindChallengeOverviewEvents(overviewRoot, currentChallenge);
}

function formatInvestment(owner) {
  const bits = [`${owner.syncLevel}/5`];
  const rawParts = String(owner.rawValue ?? "").split("|");
  const hasExRoleUnlock = Number.parseInt(rawParts[4] ?? "0", 10) > 0;
  const exRoleShort = {
    Strike: "STR",
    Tech: "TEC",
    Support: "SUP",
    Sprint: "SPR",
    Field: "FLD",
    Multi: "MLT"
  };

  if (owner.isEx) bits.push("EX");
  if (hasExRoleUnlock && owner.exRoleLabel) {
    bits.push(exRoleShort[owner.exRoleLabel] ?? owner.exRoleLabel.toUpperCase());
  }
  return bits.join(" | ");
}

function toggleChallengePair(pairId) {
  const hasPair = state.selectedChallengePairIds.includes(pairId);
  state.selectedChallengePairIds = hasPair
    ? state.selectedChallengePairIds.filter((id) => id !== pairId)
    : [...state.selectedChallengePairIds, pairId];
  renderChallengeModal();
}

function openChallengeModal(snapshot) {
  state.challengeModalOpen = true;
  state.challengePairQuery = "";
  if (!state.selectedChallengePairIds.length) {
    state.selectedChallengePairIds = state.challengePairs.slice(0, 6).map((pair) => pair.pairId);
  }
  render();
}

function closeChallengeModal() {
  state.challengeModalOpen = false;
  render();
}

function renderChallengeModalMarkup() {
  const snapshot = state.snapshot;
  const currentChallenge = snapshot?.currentChallenge;
  if (!state.challengeModalOpen || !snapshot || !currentChallenge) {
    return "";
  }

  const normalizedQuery = state.challengePairQuery.trim().toLowerCase();
  const filteredChallengePairs = normalizedQuery
    ? state.challengePairs.filter((pair) =>
        `${pair.label} ${pair.categories.join(" ")} ${pair.leaders.join(" ")}`.toLowerCase().includes(normalizedQuery)
      )
    : state.challengePairs;
  const selectedChallengePairs = state.challengePairs.filter((pair) =>
    state.selectedChallengePairIds.includes(pair.pairId)
  );
  const commonOwners = state.selectedChallengePairIds.length
    ? snapshot.members
        .map((member) => {
          const ownedPairs = selectedChallengePairs
            .map((selectedPair) => {
              const ownedPair = member.pairs.find((pair) => pair.pairId === selectedPair.pairId);
              if (!ownedPair) return null;
              return {
                pairId: selectedPair.pairId,
                label: selectedPair.label,
                investment: formatInvestment({
                  syncLevel: ownedPair.syncLevel,
                  isEx: ownedPair.isEx,
                  rawValue: ownedPair.rawValue,
                  exRoleLabel: ownedPair.exRoleLabel
                })
              };
            })
            .filter(Boolean);

          return {
            memberId: member.id,
            memberName: member.displayName,
            ownedPairs
          };
        })
        .filter((member) => member.ownedPairs.length === state.selectedChallengePairIds.length)
        .sort((a, b) => a.memberName.localeCompare(b.memberName))
    : [];

  return `
    <div class="modal-backdrop" data-role="modal-backdrop">
      <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
        <div class="challenge-modal-header">
          <div>
            <p class="eyebrow">Current challenge modal</p>
            <h2>${escapeHtml(currentChallenge.name)}</h2>
            <p>Select challenge-relevant pairs to see which members own them and at what investment.</p>
          </div>
          <button class="modal-close" data-role="close-challenge-modal" type="button">Close</button>
        </div>

        <section class="modal-panel challenge-pair-panel">
          <div class="modal-panel-header">
            <h3>Challenge pairs</h3>
            <span>${filteredChallengePairs.length} shown</span>
          </div>
          <label class="modal-search">
            <span>Search challenge pairs</span>
            <input
              data-role="challenge-pair-query"
              type="search"
              value="${escapeHtml(state.challengePairQuery)}"
              placeholder="Search pair, category, or leader..."
            />
          </label>
          <div class="challenge-pair-list">
            ${filteredChallengePairs
              .map(
                (pair) => `
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${escapeHtml(pair.pairId)}"
                    ${state.selectedChallengePairIds.includes(pair.pairId) ? "checked" : ""}
                  />
                  <div>
                    <strong>${escapeHtml(pair.label)}</strong>
                    <p>${escapeHtml(pair.categories.join(", ") || "challenge")} ${pair.leaders.length ? `| ${escapeHtml(pair.leaders.join(", "))}` : ""}</p>
                  </div>
                </label>`
              )
              .join("")}
          </div>
        </section>

        <section class="modal-panel pair-owner-panel">
          <div class="modal-panel-header">
            <h3>Members with all selected pairs</h3>
            <span>${commonOwners.length} member${commonOwners.length === 1 ? "" : "s"}</span>
          </div>
          ${
            selectedChallengePairs.length
              ? commonOwners.length
                ? commonOwners
                    .map(
                      (member) => `
                      <article class="pair-owner-card">
                        <div class="pair-owner-header">
                          <div>
                            <strong>${escapeHtml(member.memberName)}</strong>
                            <p>Owns all ${selectedChallengePairs.length} selected pair${selectedChallengePairs.length === 1 ? "" : "s"}</p>
                          </div>
                        </div>
                        <div class="owner-list">
                          ${member.ownedPairs
                            .map(
                              (pair) => `
                              <div class="owner-row">
                                <strong>${escapeHtml(pair.label)}</strong>
                                <span>${escapeHtml(pair.investment)}</span>
                              </div>`
                            )
                            .join("")}
                        </div>
                      </article>`
                    )
                    .join("")
                : `<div class="empty-state modal-empty">No imported members own all selected pairs.</div>`
              : `<div class="empty-state modal-empty">Select one or more challenge pairs to see matching members.</div>`
          }
        </section>
      </section>
    </div>`;
}

function bindChallengeModalEvents(root) {
  root.querySelector('[data-role="challenge-pair-query"]')?.addEventListener("input", (event) => {
    state.challengePairQuery = event.target.value;
    renderChallengeModal();
  });
  root.querySelector('[data-role="close-challenge-modal"]')?.addEventListener("click", () => {
    closeChallengeModal();
  });
  root.querySelector('[data-role="modal-backdrop"]')?.addEventListener("click", (event) => {
    if (event.target?.dataset?.role === "modal-backdrop") {
      closeChallengeModal();
    }
  });
  root.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      toggleChallengePair(checkbox.value);
    });
  });
}

function renderChallengeModal() {
  const modalRoot = document.querySelector("#modalRoot");
  if (!modalRoot) return;
  const activeElement = document.activeElement;
  const activeRole = activeElement?.dataset?.role ?? "";
  const activeValue = activeElement?.value ?? "";
  const activeSelectionStart =
    typeof activeElement?.selectionStart === "number" ? activeElement.selectionStart : null;
  const activeSelectionEnd =
    typeof activeElement?.selectionEnd === "number" ? activeElement.selectionEnd : null;
  modalRoot.innerHTML = renderChallengeModalMarkup();
  bindChallengeModalEvents(modalRoot);

  if (activeRole && activeElement instanceof HTMLInputElement && activeElement.type !== "checkbox") {
    const nextActive = modalRoot.querySelector(
      `[data-role="${activeRole}"]${activeValue ? `[value="${CSS.escape(activeValue)}"]` : ""}`
    );
    if (nextActive instanceof HTMLInputElement) {
      nextActive.focus();
      if (activeSelectionStart !== null && activeSelectionEnd !== null) {
        nextActive.setSelectionRange(activeSelectionStart, activeSelectionEnd);
      }
    }
  }
}

function render() {
  const app = document.querySelector("#app");
  if (!app) return;

  if (!state.snapshot) {
    app.innerHTML = `<main class="shell"><section class="panel">Loading roster snapshot...</section></main>`;
    return;
  }

  const snapshot = state.snapshot;
  const visiblePairs = getVisiblePairs(snapshot);
  const members = snapshot.members;
  const types = Array.from(new Set(snapshot.members.flatMap((member) => member.pairs.map((pair) => pair.type)).filter(Boolean))).sort();
  const roles = Array.from(new Set(snapshot.members.flatMap((member) => member.pairs.map((pair) => pair.roleCategory)).filter(Boolean))).sort();
  const currentChallenge = snapshot.currentChallenge;
  const groupedCoverage = getGroupedMemberCoverage(snapshot);
  const showGroupedCoverage = state.selectedMemberId === "all" && state.typeFilter !== "all";
  const selectedMemberName =
    state.selectedMemberId === "all"
      ? `${snapshot.gymName} gym`
      : members.find((member) => member.id === state.selectedMemberId)?.displayName ?? "Unknown member";
  const activeElement = document.activeElement;
  const activeRole = activeElement?.dataset?.role ?? "";
  const activeValue = activeElement?.value ?? "";
  const activeSelectionStart =
    typeof activeElement?.selectionStart === "number" ? activeElement.selectionStart : null;
  const activeSelectionEnd =
    typeof activeElement?.selectionEnd === "number" ? activeElement.selectionEnd : null;
  const sidebar = document.querySelector("#leftSide");
  const sidebarScrollTop = sidebar?.scrollTop ?? 0;

  app.innerHTML = `
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${escapeHtml(snapshot.gymName)}.</p>
          ${
            currentChallenge
              ? `<p class="challenge-note">Current challenge: <strong>${escapeHtml(currentChallenge.name)}</strong> (${currentChallenge.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`
              : `<p class="challenge-note">No current challenge snapshot loaded.</p>`
          }
        </div>

        <div class="counter-block">
          <div><strong>${snapshot.memberCount}</strong><span>Members</span></div>
          <div><strong>${snapshot.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${visiblePairs.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${state.selectedMemberId === "all" ? " selected" : ""}>All members</option>
              ${members
                .map(
                  (member) =>
                    `<option value="${escapeHtml(member.id)}"${member.id === state.selectedMemberId ? " selected" : ""}>${escapeHtml(member.displayName)} (${member.pairCount})</option>`
                )
                .join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${escapeHtml(state.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${state.typeFilter === "all" ? " selected" : ""}>All types</option>
              ${types
                .map((type) => `<option value="${escapeHtml(type)}"${type === state.typeFilter ? " selected" : ""}>${escapeHtml(type)}</option>`)
                .join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${state.roleFilter === "all" ? " selected" : ""}>All roles</option>
              ${roles
                .map((role) => `<option value="${escapeHtml(role)}"${role === state.roleFilter ? " selected" : ""}>${escapeHtml(role)}</option>`)
                .join("")}
            </select>
          </label>
          <div class="premium-filter-block">
            <span>Acquisition</span>
            <div class="premium-filter-list">
              ${Object.entries(acquisitionLabels)
                .map(
                  ([value, label]) => `
                    <label class="premium-filter-row${state.acquisitionFilters.includes(value) ? " active" : ""}">
                      <input
                        data-role="acquisition-checkbox"
                        type="checkbox"
                        value="${escapeHtml(value)}"
                        ${state.acquisitionFilters.includes(value) ? "checked" : ""}
                      />
                      <span class="premium-filter-name">${escapeHtml(label)}</span>
                      <span class="premium-filter-state">${state.acquisitionFilters.includes(value) ? "On" : "Off"}</span>
                    </label>`
                )
                .join("")}
            </div>
          </div>
          <label>
            <span>Sort</span>
            <select data-role="sort-select">
              <option value="label"${state.sortKey === "label" ? " selected" : ""}>Pair name</option>
              <option value="owner"${state.sortKey === "owner" ? " selected" : ""}>Member</option>
              <option value="type"${state.sortKey === "type" ? " selected" : ""}>Type</option>
              <option value="premium"${state.sortKey === "premium" ? " selected" : ""}>Premium</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input data-role="challenge-only" type="checkbox"${state.challengeOnly ? " checked" : ""}${currentChallenge ? "" : " disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${members
              .map(
                (member) => `
                <button class="member-item${member.id === state.selectedMemberId ? " active" : ""}" data-member-id="${escapeHtml(member.id)}" type="button">
                  <strong>${escapeHtml(member.displayName)}</strong>
                  <span>${member.pairCount} pairs</span>
                </button>`
              )
              .join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${escapeHtml(selectedMemberName)}</p>
            <p>${
              showGroupedCoverage
                ? `${groupedCoverage.length} member section${groupedCoverage.length === 1 ? "" : "s"}`
                : `${visiblePairs.length} result${visiblePairs.length === 1 ? "" : "s"}`
            }</p>
          </div>
          <div id="filtersUsed">
            ${state.query ? `<span>${escapeHtml(state.query)}</span>` : ""}
            ${state.typeFilter !== "all" ? `<span>${escapeHtml(state.typeFilter)}</span>` : ""}
            ${state.roleFilter !== "all" ? `<span>${escapeHtml(state.roleFilter)}</span>` : ""}
            ${state.acquisitionFilters
              .map((acquisitionCategory) => `<span>${escapeHtml(acquisitionLabels[acquisitionCategory])}</span>`)
              .join("")}
            ${state.challengeOnly ? `<span>${escapeHtml(currentChallenge?.name ?? "Current challenge")}</span>` : ""}
          </div>
          <span class="timestamp">Snapshot ${snapshot.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : "not generated yet"}</span>
        </div>

        ${currentChallenge ? `<div id="challengeOverviewRoot">${renderChallengeOverviewMarkup(currentChallenge)}</div>` : ""}

        ${
          showGroupedCoverage
            ? `<div id="memberCoverageSections">
                ${
                  groupedCoverage.length
                    ? groupedCoverage
                        .map(
                          (member) => `
                          <section class="member-coverage-section">
                            <div class="member-coverage-header">
                              <div>
                                <h3>${escapeHtml(member.memberName)}</h3>
                                <p>${member.pairCount} ${escapeHtml(state.typeFilter)} pair${member.pairCount === 1 ? "" : "s"}</p>
                              </div>
                            </div>
                            <div class="member-coverage-grid">
                              ${member.pairs
                                .map(
                                  (pair) => `
                                  <article class="syncPair selected">
                                    <div class="syncImageFrame">
                                      ${
                                        (pair.isEx && pair.exImagePath) || pair.primaryImagePath
                                          ? `<img class="syncImage" src="${escapeHtml((pair.isEx && pair.exImagePath) || pair.primaryImagePath)}" alt="${escapeHtml(pair.label)}" loading="lazy" />`
                                          : `<div class="syncImagePlaceholder">${escapeHtml((pair.trainerName || pair.label).slice(0, 2).toUpperCase())}</div>`
                                      }
                                    </div>
                                    ${pair.isEx && !pair.exImagePath ? `<div class="syncFav">EX</div>` : ""}
                                    <div class="syncLevelBadge">${escapeHtml(pair.syncLevel)}</div>
                                    <div class="syncInfos">
                                      <p class="infoName">${escapeHtml(pair.label)}</p>
                                      <p>${escapeHtml(member.memberName)}</p>
                                      <p>${escapeHtml(pair.type || "Unknown")} | ${escapeHtml(pair.roleLabel || "Unknown")}</p>
                                      <p>${escapeHtml(acquisitionLabels[getPairAcquisitionCategory(pair)] || pair.acquisition)}</p>
                                      <p>EX Role: ${escapeHtml(pair.exRoleLabel || "None")}</p>
                                    </div>
                                  </article>`
                                )
                                .join("")}
                            </div>
                          </section>`
                        )
                        .join("")
                    : `<div class="empty-state">No members match the current type coverage filters.</div>`
                }
              </div>`
            : `<div id="syncPairs">
                ${
                  visiblePairs.length
                    ? visiblePairs
                        .map(
                          (pair) => `
                          <article class="syncPair selected">
                            <div class="syncImageFrame">
                              ${
                                (pair.isEx && pair.exImagePath) || pair.primaryImagePath
                                  ? `<img class="syncImage" src="${escapeHtml((pair.isEx && pair.exImagePath) || pair.primaryImagePath)}" alt="${escapeHtml(pair.label)}" loading="lazy" />`
                                  : `<div class="syncImagePlaceholder">${escapeHtml((pair.trainerName || pair.label).slice(0, 2).toUpperCase())}</div>`
                              }
                            </div>
                            ${pair.isEx && !pair.exImagePath ? `<div class="syncFav">EX</div>` : ""}
                            <div class="syncLevelBadge">${escapeHtml(pair.syncLevel)}</div>
                            <div class="syncInfos">
                              <p class="infoName">${escapeHtml(pair.label)}</p>
                              <p>${escapeHtml(pair.ownerName)}</p>
                              <p>${escapeHtml(pair.type || "Unknown")} | ${escapeHtml(pair.roleLabel || "Unknown")}</p>
                              <p>${escapeHtml(acquisitionLabels[getPairAcquisitionCategory(pair)] || pair.acquisition)}</p>
                              <p>EX Role: ${escapeHtml(pair.exRoleLabel || "None")}</p>
                            </div>
                          </article>`
                        )
                        .join("")
                    : `<div class="empty-state">No pairs match the current filters.</div>`
                }
              </div>`
        }
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `;

  app.querySelector('[data-role="member-select"]')?.addEventListener("change", (event) => {
    state.selectedMemberId = event.target.value;
    render();
  });
  app.querySelector('[data-role="query-input"]')?.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });
  app.querySelector('[data-role="type-select"]')?.addEventListener("change", (event) => {
    state.typeFilter = event.target.value;
    render();
  });
  app.querySelectorAll('[data-role="acquisition-checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      toggleAcquisitionFilter(checkbox.value);
    });
  });
  app.querySelector('[data-role="role-select"]')?.addEventListener("change", (event) => {
    state.roleFilter = event.target.value;
    render();
  });
  app.querySelector('[data-role="sort-select"]')?.addEventListener("change", (event) => {
    state.sortKey = event.target.value;
    render();
  });
  app.querySelector('[data-role="challenge-only"]')?.addEventListener("change", (event) => {
    state.challengeOnly = event.target.checked;
    render();
  });
  app.querySelector('[data-role="open-challenge-modal"]')?.addEventListener("click", () => {
    openChallengeModal(snapshot);
  });
  app.querySelectorAll("[data-member-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMemberId = button.dataset.memberId ?? "all";
      render();
    });
  });

  renderChallengeModal();
  updateChallengeOverview();

  const nextSidebar = app.querySelector("#leftSide");
  if (nextSidebar) {
    nextSidebar.scrollTop = sidebarScrollTop;
  }

  if (
    activeRole &&
    ((activeElement instanceof HTMLInputElement && activeElement.type !== "checkbox") ||
      activeElement instanceof HTMLSelectElement)
  ) {
    const nextActive = app.querySelector(
      `[data-role="${activeRole}"]${activeValue ? `[value="${CSS.escape(activeValue)}"]` : ""}`
    );
    if (nextActive instanceof HTMLInputElement || nextActive instanceof HTMLSelectElement) {
      nextActive.focus();
      if (
        nextActive instanceof HTMLInputElement &&
        activeSelectionStart !== null &&
        activeSelectionEnd !== null
      ) {
        nextActive.setSelectionRange(activeSelectionStart, activeSelectionEnd);
      }
    }
  }
}

async function bootstrap() {
  const response = await fetch("./data/rosters.json");
  state.snapshot = await response.json();
  state.challengePairs = getChallengePairCatalog(state.snapshot);
  render();
}

bootstrap().catch((error) => {
  const app = document.querySelector("#app");
  if (!app) return;
  app.innerHTML = `<main class="shell"><section class="panel">Failed to load roster snapshot: ${escapeHtml(error.message)}</section></main>`;
});
