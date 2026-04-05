(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))d(a);new MutationObserver(a=>{for(const t of a)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&d(r)}).observe(document,{childList:!0,subtree:!0});function i(a){const t={};return a.integrity&&(t.integrity=a.integrity),a.referrerPolicy&&(t.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?t.credentials="include":a.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function d(a){if(a.ep)return;a.ep=!0;const t=i(a);fetch(a.href,t)}})();const y={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},e={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",premiumFilter:"all",roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:""};function n(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function S(s){var d,a;const o=new Set(((d=s.currentChallenge)==null?void 0:d.significantPairIds)??[]);return(e.selectedMemberId==="all"?s.members.flatMap(t=>t.pairs.map(r=>({...r,ownerName:t.displayName}))):(((a=s.members.find(t=>t.id===e.selectedMemberId))==null?void 0:a.pairs)??[]).map(t=>{var r;return{...t,ownerName:((r=s.members.find(c=>c.id===e.selectedMemberId))==null?void 0:r.displayName)??""}})).filter(t=>{const r=!e.query||`${t.label} ${t.ownerName} ${t.type} ${t.roleLabel} ${t.trainerName} ${t.pokemonName}`.toLowerCase().includes(e.query.toLowerCase()),c=e.typeFilter==="all"||t.type===e.typeFilter,u=e.premiumFilter==="all"||t.premiumCategory===e.premiumFilter,m=e.roleFilter==="all"||t.roleCategory===e.roleFilter,g=!e.challengeOnly||o.has(t.pairId);return r&&c&&u&&m&&g}).sort((t,r)=>{if(e.sortKey==="owner"){const c=t.ownerName.localeCompare(r.ownerName);return c!==0?c:t.label.localeCompare(r.label)}if(e.sortKey==="type"){const c=(t.type||"").localeCompare(r.type||"");return c!==0?c:t.label.localeCompare(r.label)}if(e.sortKey==="premium"){const c=(y[t.premiumCategory]||t.premiumCategory).localeCompare(y[r.premiumCategory]||r.premiumCategory);return c!==0?c:t.label.localeCompare(r.label)}return t.label.localeCompare(r.label)})}function L(s){var d;const o=((d=s.currentChallenge)==null?void 0:d.significantPairs)??[],i=new Map;return o.forEach(a=>{const t=i.get(a.pairId);if(!t){i.set(a.pairId,{pairId:a.pairId,label:a.label,categories:new Set(a.category?[a.category]:[]),leaders:new Set(a.leaderName?[a.leaderName]:[])});return}a.category&&t.categories.add(a.category),a.leaderName&&t.leaders.add(a.leaderName)}),Array.from(i.values()).map(a=>({pairId:a.pairId,label:a.label,categories:Array.from(a.categories).sort(),leaders:Array.from(a.leaders).sort()})).sort((a,t)=>a.label.localeCompare(t.label))}function M(s){const o=[`${s.syncLevel}/5`],i=String(s.rawValue??"").split("|"),d=Number.parseInt(i[4]??"0",10)>0,a={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return s.isEx&&o.push("EX"),d&&s.exRoleLabel&&o.push(a[s.exRoleLabel]??s.exRoleLabel.toUpperCase()),o.join(" | ")}function N(s){const o=e.selectedChallengePairIds.includes(s);e.selectedChallengePairIds=o?e.selectedChallengePairIds.filter(i=>i!==s):[...e.selectedChallengePairIds,s],b()}function F(s){e.challengeModalOpen=!0,e.challengePairQuery="",e.selectedChallengePairIds.length||(e.selectedChallengePairIds=e.challengePairs.slice(0,6).map(o=>o.pairId)),p()}function I(){e.challengeModalOpen=!1,p()}function q(){const s=e.snapshot,o=s==null?void 0:s.currentChallenge;if(!e.challengeModalOpen||!s||!o)return"";const i=e.challengePairQuery.trim().toLowerCase(),d=i?e.challengePairs.filter(r=>`${r.label} ${r.categories.join(" ")} ${r.leaders.join(" ")}`.toLowerCase().includes(i)):e.challengePairs,a=e.challengePairs.filter(r=>e.selectedChallengePairIds.includes(r.pairId)),t=e.selectedChallengePairIds.length?s.members.map(r=>{const c=a.map(u=>{const m=r.pairs.find(g=>g.pairId===u.pairId);return m?{pairId:u.pairId,label:u.label,investment:M({syncLevel:m.syncLevel,isEx:m.isEx,rawValue:m.rawValue,exRoleLabel:m.exRoleLabel})}:null}).filter(Boolean);return{memberId:r.id,memberName:r.displayName,ownedPairs:c}}).filter(r=>r.ownedPairs.length===e.selectedChallengePairIds.length).sort((r,c)=>r.memberName.localeCompare(c.memberName)):[];return`
    <div class="modal-backdrop" data-role="modal-backdrop">
      <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
        <div class="challenge-modal-header">
          <div>
            <p class="eyebrow">Current challenge modal</p>
            <h2>${n(o.name)}</h2>
            <p>Select challenge-relevant pairs to see which members own them and at what investment.</p>
          </div>
          <button class="modal-close" data-role="close-challenge-modal" type="button">Close</button>
        </div>

        <section class="modal-panel challenge-pair-panel">
          <div class="modal-panel-header">
            <h3>Challenge pairs</h3>
            <span>${d.length} shown</span>
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
            ${d.map(r=>`
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${n(r.pairId)}"
                    ${e.selectedChallengePairIds.includes(r.pairId)?"checked":""}
                  />
                  <div>
                    <strong>${n(r.label)}</strong>
                    <p>${n(r.categories.join(", ")||"challenge")} ${r.leaders.length?`| ${n(r.leaders.join(", "))}`:""}</p>
                  </div>
                </label>`).join("")}
          </div>
        </section>

        <section class="modal-panel pair-owner-panel">
          <div class="modal-panel-header">
            <h3>Members with all selected pairs</h3>
            <span>${t.length} member${t.length===1?"":"s"}</span>
          </div>
          ${a.length?t.length?t.map(r=>`
                      <article class="pair-owner-card">
                        <div class="pair-owner-header">
                          <div>
                            <strong>${n(r.memberName)}</strong>
                            <p>Owns all ${a.length} selected pair${a.length===1?"":"s"}</p>
                          </div>
                        </div>
                        <div class="owner-list">
                          ${r.ownedPairs.map(c=>`
                              <div class="owner-row">
                                <strong>${n(c.label)}</strong>
                                <span>${n(c.investment)}</span>
                              </div>`).join("")}
                        </div>
                      </article>`).join(""):'<div class="empty-state modal-empty">No imported members own all selected pairs.</div>':'<div class="empty-state modal-empty">Select one or more challenge pairs to see matching members.</div>'}
        </section>
      </section>
    </div>`}function E(s){var o,i,d;(o=s.querySelector('[data-role="challenge-pair-query"]'))==null||o.addEventListener("input",a=>{e.challengePairQuery=a.target.value,b()}),(i=s.querySelector('[data-role="close-challenge-modal"]'))==null||i.addEventListener("click",()=>{I()}),(d=s.querySelector('[data-role="modal-backdrop"]'))==null||d.addEventListener("click",a=>{var t,r;((r=(t=a.target)==null?void 0:t.dataset)==null?void 0:r.role)==="modal-backdrop"&&I()}),s.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(a=>{a.addEventListener("change",()=>{N(a.value)})})}function b(){const s=document.querySelector("#modalRoot");s&&(s.innerHTML=q(),E(s))}function p(){var u,m,g,v,f,$,C,P,w;const s=document.querySelector("#app");if(!s)return;if(!e.snapshot){s.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const o=e.snapshot,i=S(o),d=o.members,a=Array.from(new Set(o.members.flatMap(l=>l.pairs.map(h=>h.type)).filter(Boolean))).sort(),t=Array.from(new Set(o.members.flatMap(l=>l.pairs.map(h=>h.roleCategory)).filter(Boolean))).sort(),r=o.currentChallenge,c=e.selectedMemberId==="all"?`${o.gymName} gym`:((u=d.find(l=>l.id===e.selectedMemberId))==null?void 0:u.displayName)??"Unknown member";s.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${n(o.gymName)}.</p>
          ${r?`<p class="challenge-note">Current challenge: <strong>${n(r.name)}</strong> (${r.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${o.memberCount}</strong><span>Members</span></div>
          <div><strong>${o.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${i.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${e.selectedMemberId==="all"?" selected":""}>All members</option>
              ${d.map(l=>`<option value="${n(l.id)}"${l.id===e.selectedMemberId?" selected":""}>${n(l.displayName)} (${l.pairCount})</option>`).join("")}
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
              ${a.map(l=>`<option value="${n(l)}"${l===e.typeFilter?" selected":""}>${n(l)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${e.roleFilter==="all"?" selected":""}>All roles</option>
              ${t.map(l=>`<option value="${n(l)}"${l===e.roleFilter?" selected":""}>${n(l)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Premium</span>
            <select data-role="premium-select">
              <option value="all"${e.premiumFilter==="all"?" selected":""}>All premium tiers</option>
              ${Object.entries(y).map(([l,h])=>`<option value="${n(l)}"${l===e.premiumFilter?" selected":""}>${n(h)}</option>`).join("")}
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
            <input data-role="challenge-only" type="checkbox"${e.challengeOnly?" checked":""}${r?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${d.map(l=>`
                <button class="member-item${l.id===e.selectedMemberId?" active":""}" data-member-id="${n(l.id)}" type="button">
                  <strong>${n(l.displayName)}</strong>
                  <span>${l.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${n(c)}</p>
            <p>${i.length} result${i.length===1?"":"s"}</p>
          </div>
          <div id="filtersUsed">
            ${e.query?`<span>${n(e.query)}</span>`:""}
            ${e.typeFilter!=="all"?`<span>${n(e.typeFilter)}</span>`:""}
            ${e.roleFilter!=="all"?`<span>${n(e.roleFilter)}</span>`:""}
            ${e.premiumFilter!=="all"?`<span>${n(y[e.premiumFilter])}</span>`:""}
            ${e.challengeOnly?`<span>${n((r==null?void 0:r.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${o.generatedAt?new Date(o.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        <div id="syncPairs">
            ${i.length?i.map(l=>`
                      <article class="syncPair selected">
                        <div class="syncFav">${l.isEx?"EX":""}</div>
                        <div class="syncImageFrame">
                          ${l.primaryImagePath?`<img class="syncImage" src="${n(l.primaryImagePath)}" alt="${n(l.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${n((l.trainerName||l.label).slice(0,2).toUpperCase())}</div>`}
                        </div>
                        <div class="syncLevelBadge">${n(l.syncLevel)}</div>
                        <div class="syncInfos">
                          <p class="infoName">${n(l.label)}</p>
                          <p>${n(l.ownerName)}</p>
                          <p>${n(l.type||"Unknown")} | ${n(l.roleLabel||"Unknown")}</p>
                          <p>${n(y[l.premiumCategory]||l.premiumCategory)}</p>
                          <p>EX Role: ${n(l.exRoleLabel||"None")}</p>
                        </div>
                      </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
          </div>
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(m=s.querySelector('[data-role="member-select"]'))==null||m.addEventListener("change",l=>{e.selectedMemberId=l.target.value,p()}),(g=s.querySelector('[data-role="query-input"]'))==null||g.addEventListener("input",l=>{e.query=l.target.value,p()}),(v=s.querySelector('[data-role="type-select"]'))==null||v.addEventListener("change",l=>{e.typeFilter=l.target.value,p()}),(f=s.querySelector('[data-role="premium-select"]'))==null||f.addEventListener("change",l=>{e.premiumFilter=l.target.value,p()}),($=s.querySelector('[data-role="role-select"]'))==null||$.addEventListener("change",l=>{e.roleFilter=l.target.value,p()}),(C=s.querySelector('[data-role="sort-select"]'))==null||C.addEventListener("change",l=>{e.sortKey=l.target.value,p()}),(P=s.querySelector('[data-role="challenge-only"]'))==null||P.addEventListener("change",l=>{e.challengeOnly=l.target.checked,p()}),(w=s.querySelector('[data-role="open-challenge-modal"]'))==null||w.addEventListener("click",()=>{F()}),s.querySelectorAll("[data-member-id]").forEach(l=>{l.addEventListener("click",()=>{e.selectedMemberId=l.dataset.memberId??"all",p()})}),b()}async function k(){const s=await fetch("./data/rosters.json");e.snapshot=await s.json(),e.challengePairs=L(e.snapshot),p()}k().catch(s=>{const o=document.querySelector("#app");o&&(o.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${n(s.message)}</section></main>`)});
