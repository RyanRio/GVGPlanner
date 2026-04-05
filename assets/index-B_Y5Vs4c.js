(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const l of t)if(l.type==="childList")for(const o of l.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function c(t){const l={};return t.integrity&&(l.integrity=t.integrity),t.referrerPolicy&&(l.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?l.credentials="include":t.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function i(t){if(t.ep)return;t.ep=!0;const l=c(t);fetch(t.href,l)}})();const u={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},e={snapshot:null,pairOwners:new Map,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",premiumFilter:"all",roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:""};function n(r){return String(r).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function L(r){var i,t;const s=new Set(((i=r.currentChallenge)==null?void 0:i.significantPairIds)??[]);return(e.selectedMemberId==="all"?r.members.flatMap(l=>l.pairs.map(o=>({...o,ownerName:l.displayName}))):(((t=r.members.find(l=>l.id===e.selectedMemberId))==null?void 0:t.pairs)??[]).map(l=>{var o;return{...l,ownerName:((o=r.members.find(d=>d.id===e.selectedMemberId))==null?void 0:o.displayName)??""}})).filter(l=>{const o=!e.query||`${l.label} ${l.ownerName} ${l.type} ${l.roleLabel} ${l.trainerName} ${l.pokemonName}`.toLowerCase().includes(e.query.toLowerCase()),d=e.typeFilter==="all"||l.type===e.typeFilter,g=e.premiumFilter==="all"||l.premiumCategory===e.premiumFilter,h=e.roleFilter==="all"||l.roleCategory===e.roleFilter,y=!e.challengeOnly||s.has(l.pairId);return o&&d&&g&&h&&y}).sort((l,o)=>{if(e.sortKey==="owner"){const d=l.ownerName.localeCompare(o.ownerName);return d!==0?d:l.label.localeCompare(o.label)}if(e.sortKey==="type"){const d=(l.type||"").localeCompare(o.type||"");return d!==0?d:l.label.localeCompare(o.label)}if(e.sortKey==="premium"){const d=(u[l.premiumCategory]||l.premiumCategory).localeCompare(u[o.premiumCategory]||o.premiumCategory);return d!==0?d:l.label.localeCompare(o.label)}return l.label.localeCompare(o.label)})}function S(r){const s=new Map;return r.members.forEach(c=>{c.pairs.forEach(i=>{s.has(i.pairId)||s.set(i.pairId,[]),s.get(i.pairId).push({memberId:c.id,memberName:c.displayName,syncLevel:i.syncLevel,isEx:i.isEx,rawValue:i.rawValue,premiumCategory:i.premiumCategory,roleLabel:i.roleLabel,exRoleLabel:i.exRoleLabel})})}),s.forEach(c=>{c.sort((i,t)=>t.syncLevel!==i.syncLevel?t.syncLevel-i.syncLevel:i.isEx!==t.isEx?Number(t.isEx)-Number(i.isEx):i.memberName.localeCompare(t.memberName))}),s}function M(r){var i;const s=((i=r.currentChallenge)==null?void 0:i.significantPairs)??[],c=new Map;return s.forEach(t=>{const l=c.get(t.pairId);if(!l){c.set(t.pairId,{pairId:t.pairId,label:t.label,categories:new Set(t.category?[t.category]:[]),leaders:new Set(t.leaderName?[t.leaderName]:[])});return}t.category&&l.categories.add(t.category),t.leaderName&&l.leaders.add(t.leaderName)}),Array.from(c.values()).map(t=>({pairId:t.pairId,label:t.label,categories:Array.from(t.categories).sort(),leaders:Array.from(t.leaders).sort()})).sort((t,l)=>t.label.localeCompare(l.label))}function N(r){const s=[`${r.syncLevel}/5`];return r.isEx&&s.push("EX"),r.rawValue&&s.push(r.rawValue),s.join(" | ")}function E(r){const s=e.selectedChallengePairIds.includes(r);e.selectedChallengePairIds=s?e.selectedChallengePairIds.filter(c=>c!==r):[...e.selectedChallengePairIds,r],v()}function F(r){e.challengeModalOpen=!0,e.challengePairQuery="",e.selectedChallengePairIds.length||(e.selectedChallengePairIds=e.challengePairs.slice(0,6).map(s=>s.pairId)),p()}function I(){e.challengeModalOpen=!1,p()}function q(){const r=e.snapshot,s=r==null?void 0:r.currentChallenge;if(!e.challengeModalOpen||!r||!s)return"";const c=e.challengePairQuery.trim().toLowerCase(),i=c?e.challengePairs.filter(l=>`${l.label} ${l.categories.join(" ")} ${l.leaders.join(" ")}`.toLowerCase().includes(c)):e.challengePairs,t=e.challengePairs.filter(l=>e.selectedChallengePairIds.includes(l.pairId));return`
    <div class="modal-backdrop" data-role="modal-backdrop">
      <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
        <div class="challenge-modal-header">
          <div>
            <p class="eyebrow">Current challenge modal</p>
            <h2>${n(s.name)}</h2>
            <p>Select challenge-relevant pairs to see which members own them and at what investment.</p>
          </div>
          <button class="modal-close" data-role="close-challenge-modal" type="button">Close</button>
        </div>

        <section class="modal-panel challenge-pair-panel">
          <div class="modal-panel-header">
            <h3>Challenge pairs</h3>
            <span>${i.length} shown</span>
          </div>
          <label class="modal-search">
            <span>Search challenge pairs</span>
            <input
              data-role="challenge-pair-query"
              type="search"
              value="${n(e.challengePairQuery)}"
              placeholder="Search pair, category, or leader..."
            />
          </label>
          <div class="challenge-pair-list">
            ${i.map(l=>`
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${n(l.pairId)}"
                    ${e.selectedChallengePairIds.includes(l.pairId)?"checked":""}
                  />
                  <div>
                    <strong>${n(l.label)}</strong>
                    <p>${n(l.categories.join(", ")||"challenge")} ${l.leaders.length?`| ${n(l.leaders.join(", "))}`:""}</p>
                  </div>
                </label>`).join("")}
          </div>
        </section>

        <section class="modal-panel pair-owner-panel">
          <div class="modal-panel-header">
            <h3>Owners and investment</h3>
            <span>${t.length} selected</span>
          </div>
          ${t.length?t.map(l=>{const o=e.pairOwners.get(l.pairId)??[];return`
                      <article class="pair-owner-card">
                        <div class="pair-owner-header">
                          <div>
                            <strong>${n(l.label)}</strong>
                            <p>${n(l.categories.join(", ")||"challenge")} ${l.leaders.length?`| ${n(l.leaders.join(", "))}`:""}</p>
                          </div>
                          <span>${o.length} owner${o.length===1?"":"s"}</span>
                        </div>
                        ${o.length?`<div class="owner-list">
                                ${o.map(d=>`
                                    <div class="owner-row">
                                      <strong>${n(d.memberName)}</strong>
                                      <span>${n(N(d))}</span>
                                    </div>`).join("")}
                              </div>`:'<div class="empty-state modal-empty">No imported members own this pair yet.</div>'}
                      </article>`}).join(""):'<div class="empty-state modal-empty">Select one or more challenge pairs to see owners and investment.</div>'}
        </section>
      </section>
    </div>`}function O(r){var s,c,i;(s=r.querySelector('[data-role="challenge-pair-query"]'))==null||s.addEventListener("input",t=>{e.challengePairQuery=t.target.value,v()}),(c=r.querySelector('[data-role="close-challenge-modal"]'))==null||c.addEventListener("click",()=>{I()}),(i=r.querySelector('[data-role="modal-backdrop"]'))==null||i.addEventListener("click",t=>{var l,o;((o=(l=t.target)==null?void 0:l.dataset)==null?void 0:o.role)==="modal-backdrop"&&I()}),r.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(t=>{t.addEventListener("change",()=>{E(t.value)})})}function v(){const r=document.querySelector("#modalRoot");r&&(r.innerHTML=q(),O(r))}function p(){var g,h,y,b,f,$,C,w,P;const r=document.querySelector("#app");if(!r)return;if(!e.snapshot){r.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const s=e.snapshot,c=L(s),i=s.members,t=Array.from(new Set(s.members.flatMap(a=>a.pairs.map(m=>m.type)).filter(Boolean))).sort(),l=Array.from(new Set(s.members.flatMap(a=>a.pairs.map(m=>m.roleCategory)).filter(Boolean))).sort(),o=s.currentChallenge,d=e.selectedMemberId==="all"?`${s.gymName} gym`:((g=i.find(a=>a.id===e.selectedMemberId))==null?void 0:g.displayName)??"Unknown member";r.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${n(s.gymName)}.</p>
          ${o?`<p class="challenge-note">Current challenge: <strong>${n(o.name)}</strong> (${o.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${s.memberCount}</strong><span>Members</span></div>
          <div><strong>${s.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${c.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${e.selectedMemberId==="all"?" selected":""}>All members</option>
              ${i.map(a=>`<option value="${n(a.id)}"${a.id===e.selectedMemberId?" selected":""}>${n(a.displayName)} (${a.pairCount})</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${n(e.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${e.typeFilter==="all"?" selected":""}>All types</option>
              ${t.map(a=>`<option value="${n(a)}"${a===e.typeFilter?" selected":""}>${n(a)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${e.roleFilter==="all"?" selected":""}>All roles</option>
              ${l.map(a=>`<option value="${n(a)}"${a===e.roleFilter?" selected":""}>${n(a)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Premium</span>
            <select data-role="premium-select">
              <option value="all"${e.premiumFilter==="all"?" selected":""}>All premium tiers</option>
              ${Object.entries(u).map(([a,m])=>`<option value="${n(a)}"${a===e.premiumFilter?" selected":""}>${n(m)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select data-role="sort-select">
              <option value="label"${e.sortKey==="label"?" selected":""}>Pair name</option>
              <option value="owner"${e.sortKey==="owner"?" selected":""}>Member</option>
              <option value="type"${e.sortKey==="type"?" selected":""}>Type</option>
              <option value="premium"${e.sortKey==="premium"?" selected":""}>Premium</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input data-role="challenge-only" type="checkbox"${e.challengeOnly?" checked":""}${o?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${i.map(a=>`
                <button class="member-item${a.id===e.selectedMemberId?" active":""}" data-member-id="${n(a.id)}" type="button">
                  <strong>${n(a.displayName)}</strong>
                  <span>${a.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${n(d)}</p>
            <p>${c.length} result${c.length===1?"":"s"}</p>
          </div>
          <div id="filtersUsed">
            ${e.query?`<span>${n(e.query)}</span>`:""}
            ${e.typeFilter!=="all"?`<span>${n(e.typeFilter)}</span>`:""}
            ${e.roleFilter!=="all"?`<span>${n(e.roleFilter)}</span>`:""}
            ${e.premiumFilter!=="all"?`<span>${n(u[e.premiumFilter])}</span>`:""}
            ${e.challengeOnly?`<span>${n((o==null?void 0:o.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${s.generatedAt?new Date(s.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        <div id="syncPairs">
            ${c.length?c.map(a=>`
                      <article class="syncPair selected">
                        <div class="syncFav">${a.isEx?"EX":""}</div>
                        <div class="syncImageFrame">
                          ${a.primaryImagePath?`<img class="syncImage" src="${n(a.primaryImagePath)}" alt="${n(a.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${n((a.trainerName||a.label).slice(0,2).toUpperCase())}</div>`}
                        </div>
                        <div class="syncLevelBadge">${n(a.syncLevel)}</div>
                        <div class="syncInfos">
                          <p class="infoName">${n(a.label)}</p>
                          <p>${n(a.ownerName)}</p>
                          <p>${n(a.type||"Unknown")} | ${n(a.roleLabel||"Unknown")}</p>
                          <p>${n(u[a.premiumCategory]||a.premiumCategory)}</p>
                          <p>EX Role: ${n(a.exRoleLabel||"None")}</p>
                        </div>
                      </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
          </div>
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(h=r.querySelector('[data-role="member-select"]'))==null||h.addEventListener("change",a=>{e.selectedMemberId=a.target.value,p()}),(y=r.querySelector('[data-role="query-input"]'))==null||y.addEventListener("input",a=>{e.query=a.target.value,p()}),(b=r.querySelector('[data-role="type-select"]'))==null||b.addEventListener("change",a=>{e.typeFilter=a.target.value,p()}),(f=r.querySelector('[data-role="premium-select"]'))==null||f.addEventListener("change",a=>{e.premiumFilter=a.target.value,p()}),($=r.querySelector('[data-role="role-select"]'))==null||$.addEventListener("change",a=>{e.roleFilter=a.target.value,p()}),(C=r.querySelector('[data-role="sort-select"]'))==null||C.addEventListener("change",a=>{e.sortKey=a.target.value,p()}),(w=r.querySelector('[data-role="challenge-only"]'))==null||w.addEventListener("change",a=>{e.challengeOnly=a.target.checked,p()}),(P=r.querySelector('[data-role="open-challenge-modal"]'))==null||P.addEventListener("click",()=>{F()}),r.querySelectorAll("[data-member-id]").forEach(a=>{a.addEventListener("click",()=>{e.selectedMemberId=a.dataset.memberId??"all",p()})}),v()}async function k(){const r=await fetch("./data/rosters.json");e.snapshot=await r.json(),e.pairOwners=S(e.snapshot),e.challengePairs=M(e.snapshot),p()}k().catch(r=>{const s=document.querySelector("#app");s&&(s.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${n(r.message)}</section></main>`)});
