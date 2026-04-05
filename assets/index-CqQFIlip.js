(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const t of a)if(t.type==="childList")for(const o of t.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function c(a){const t={};return a.integrity&&(t.integrity=a.integrity),a.referrerPolicy&&(t.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?t.credentials="include":a.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function i(a){if(a.ep)return;a.ep=!0;const t=c(a);fetch(a.href,t)}})();const v={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},l={snapshot:null,selectedMemberId:"all",query:"",typeFilter:"all",premiumFilter:"all",roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[]};function s(r){return String(r).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function k(r){var i,a;const n=new Set(((i=r.currentChallenge)==null?void 0:i.significantPairIds)??[]);return(l.selectedMemberId==="all"?r.members.flatMap(t=>t.pairs.map(o=>({...o,ownerName:t.displayName}))):(((a=r.members.find(t=>t.id===l.selectedMemberId))==null?void 0:a.pairs)??[]).map(t=>{var o;return{...t,ownerName:((o=r.members.find(p=>p.id===l.selectedMemberId))==null?void 0:o.displayName)??""}})).filter(t=>{const o=!l.query||`${t.label} ${t.ownerName} ${t.type} ${t.roleLabel} ${t.trainerName} ${t.pokemonName}`.toLowerCase().includes(l.query.toLowerCase()),p=l.typeFilter==="all"||t.type===l.typeFilter,g=l.premiumFilter==="all"||t.premiumCategory===l.premiumFilter,h=l.roleFilter==="all"||t.roleCategory===l.roleFilter,y=!l.challengeOnly||n.has(t.pairId);return o&&p&&g&&h&&y}).sort((t,o)=>{if(l.sortKey==="owner"){const p=t.ownerName.localeCompare(o.ownerName);return p!==0?p:t.label.localeCompare(o.label)}if(l.sortKey==="type"){const p=(t.type||"").localeCompare(o.type||"");return p!==0?p:t.label.localeCompare(o.label)}if(l.sortKey==="premium"){const p=(v[t.premiumCategory]||t.premiumCategory).localeCompare(v[o.premiumCategory]||o.premiumCategory);return p!==0?p:t.label.localeCompare(o.label)}return t.label.localeCompare(o.label)})}function A(r){const n=new Map;return r.members.forEach(c=>{c.pairs.forEach(i=>{n.has(i.pairId)||n.set(i.pairId,[]),n.get(i.pairId).push({memberId:c.id,memberName:c.displayName,syncLevel:i.syncLevel,isEx:i.isEx,rawValue:i.rawValue,premiumCategory:i.premiumCategory,roleLabel:i.roleLabel,exRoleLabel:i.exRoleLabel})})}),n.forEach(c=>{c.sort((i,a)=>a.syncLevel!==i.syncLevel?a.syncLevel-i.syncLevel:i.isEx!==a.isEx?Number(a.isEx)-Number(i.isEx):i.memberName.localeCompare(a.memberName))}),n}function E(r){var i;const n=((i=r.currentChallenge)==null?void 0:i.significantPairs)??[],c=new Map;return n.forEach(a=>{const t=c.get(a.pairId);if(!t){c.set(a.pairId,{pairId:a.pairId,label:a.label,categories:new Set(a.category?[a.category]:[]),leaders:new Set(a.leaderName?[a.leaderName]:[])});return}a.category&&t.categories.add(a.category),a.leaderName&&t.leaders.add(a.leaderName)}),Array.from(c.values()).map(a=>({pairId:a.pairId,label:a.label,categories:Array.from(a.categories).sort(),leaders:Array.from(a.leaders).sort()})).sort((a,t)=>a.label.localeCompare(t.label))}function O(r){const n=[`${r.syncLevel}/5`];return r.isEx&&n.push("EX"),r.rawValue&&n.push(r.rawValue),n.join(" | ")}function j(r){const n=l.selectedChallengePairIds.includes(r);l.selectedChallengePairIds=n?l.selectedChallengePairIds.filter(c=>c!==r):[...l.selectedChallengePairIds,r],m()}function x(r){const n=E(r);l.challengeModalOpen=!0,l.selectedChallengePairIds.length||(l.selectedChallengePairIds=n.slice(0,6).map(c=>c.pairId)),m()}function F(){l.challengeModalOpen=!1,m()}function m(){var b,$,f,w,C,I,P,S,N,L,M;const r=document.querySelector("#app");if(!r)return;if(!l.snapshot){r.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const n=l.snapshot,c=k(n),i=n.members,a=Array.from(new Set(n.members.flatMap(e=>e.pairs.map(d=>d.type)).filter(Boolean))).sort(),t=Array.from(new Set(n.members.flatMap(e=>e.pairs.map(d=>d.roleCategory)).filter(Boolean))).sort(),o=n.currentChallenge,p=A(n),g=E(n),h=g.filter(e=>l.selectedChallengePairIds.includes(e.pairId)),y=n.members.map(e=>{const d=e.pairs.filter(u=>l.selectedChallengePairIds.includes(u.pairId));return{memberId:e.id,memberName:e.displayName,ownedSelectedPairs:d}}).filter(e=>e.ownedSelectedPairs.length>0).sort((e,d)=>d.ownedSelectedPairs.length!==e.ownedSelectedPairs.length?d.ownedSelectedPairs.length-e.ownedSelectedPairs.length:e.memberName.localeCompare(d.memberName)),q=l.selectedMemberId==="all"?`${n.gymName} gym`:((b=i.find(e=>e.id===l.selectedMemberId))==null?void 0:b.displayName)??"Unknown member";r.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${s(n.gymName)}.</p>
          ${o?`<p class="challenge-note">Current challenge: <strong>${s(o.name)}</strong> (${o.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${n.memberCount}</strong><span>Members</span></div>
          <div><strong>${n.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${c.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${l.selectedMemberId==="all"?" selected":""}>All members</option>
              ${i.map(e=>`<option value="${s(e.id)}"${e.id===l.selectedMemberId?" selected":""}>${s(e.displayName)} (${e.pairCount})</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${s(l.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${l.typeFilter==="all"?" selected":""}>All types</option>
              ${a.map(e=>`<option value="${s(e)}"${e===l.typeFilter?" selected":""}>${s(e)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${l.roleFilter==="all"?" selected":""}>All roles</option>
              ${t.map(e=>`<option value="${s(e)}"${e===l.roleFilter?" selected":""}>${s(e)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Premium</span>
            <select data-role="premium-select">
              <option value="all"${l.premiumFilter==="all"?" selected":""}>All premium tiers</option>
              ${Object.entries(v).map(([e,d])=>`<option value="${s(e)}"${e===l.premiumFilter?" selected":""}>${s(d)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select data-role="sort-select">
              <option value="label"${l.sortKey==="label"?" selected":""}>Pair name</option>
              <option value="owner"${l.sortKey==="owner"?" selected":""}>Member</option>
              <option value="type"${l.sortKey==="type"?" selected":""}>Type</option>
              <option value="premium"${l.sortKey==="premium"?" selected":""}>Premium</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input data-role="challenge-only" type="checkbox"${l.challengeOnly?" checked":""}${o?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${i.map(e=>`
                <button class="member-item${e.id===l.selectedMemberId?" active":""}" data-member-id="${s(e.id)}" type="button">
                  <strong>${s(e.displayName)}</strong>
                  <span>${e.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${s(q)}</p>
            <p>${c.length} result${c.length===1?"":"s"}</p>
          </div>
          <div id="filtersUsed">
            ${l.query?`<span>${s(l.query)}</span>`:""}
            ${l.typeFilter!=="all"?`<span>${s(l.typeFilter)}</span>`:""}
            ${l.roleFilter!=="all"?`<span>${s(l.roleFilter)}</span>`:""}
            ${l.premiumFilter!=="all"?`<span>${s(v[l.premiumFilter])}</span>`:""}
            ${l.challengeOnly?`<span>${s((o==null?void 0:o.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${n.generatedAt?new Date(n.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        <div id="syncPairs">
            ${c.length?c.map(e=>`
                      <article class="syncPair selected">
                        <div class="syncFav">${e.isEx?"EX":""}</div>
                        <div class="syncImageFrame">
                          ${e.primaryImagePath?`<img class="syncImage" src="${s(e.primaryImagePath)}" alt="${s(e.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${s((e.trainerName||e.label).slice(0,2).toUpperCase())}</div>`}
                        </div>
                        <div class="syncLevelBadge">${s(e.syncLevel)}</div>
                        <div class="syncInfos">
                          <p class="infoName">${s(e.label)}</p>
                          <p>${s(e.ownerName)}</p>
                          <p>${s(e.type||"Unknown")} | ${s(e.roleLabel||"Unknown")}</p>
                          <p>${s(v[e.premiumCategory]||e.premiumCategory)}</p>
                          <p>EX Role: ${s(e.exRoleLabel||"None")}</p>
                        </div>
                      </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
          </div>
        </div>
      </section>
    </main>
    ${l.challengeModalOpen&&o?`
        <div class="modal-backdrop" data-role="modal-backdrop">
          <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
            <div class="challenge-modal-header">
              <div>
                <p class="eyebrow">Current challenge modal</p>
                <h2>${s(o.name)}</h2>
                <p>Select challenge-relevant pairs to see which members own them and at what investment.</p>
              </div>
              <button class="modal-close" data-role="close-challenge-modal" type="button">Close</button>
            </div>

            <div class="challenge-modal-grid">
              <section class="modal-panel">
                <div class="modal-panel-header">
                  <h3>Challenge pairs</h3>
                  <span>${g.length} pairs</span>
                </div>
                <div class="challenge-pair-list">
                  ${g.map(e=>`
                      <label class="challenge-pair-option">
                        <input
                          type="checkbox"
                          data-role="challenge-pair-checkbox"
                          value="${s(e.pairId)}"
                          ${l.selectedChallengePairIds.includes(e.pairId)?"checked":""}
                        />
                        <div>
                          <strong>${s(e.label)}</strong>
                          <p>${s(e.categories.join(", ")||"challenge")} ${e.leaders.length?`| ${s(e.leaders.join(", "))}`:""}</p>
                        </div>
                      </label>`).join("")}
                </div>
              </section>

              <section class="modal-panel">
                <div class="modal-panel-header">
                  <h3>Member coverage</h3>
                  <span>${y.length} members</span>
                </div>
                ${l.selectedChallengePairIds.length?`<div class="coverage-summary">
                        ${y.length?y.map(e=>`
                                <article class="coverage-card">
                                  <strong>${s(e.memberName)}</strong>
                                  <p>${e.ownedSelectedPairs.length} selected pair${e.ownedSelectedPairs.length===1?"":"s"}</p>
                                  <p>${s(e.ownedSelectedPairs.map(d=>d.label).join(", "))}</p>
                                </article>`).join(""):'<div class="empty-state modal-empty">No members own the selected pairs.</div>'}
                      </div>`:'<div class="empty-state modal-empty">Select one or more challenge pairs to view coverage.</div>'}
              </section>
            </div>

            <section class="modal-panel pair-owner-panel">
              <div class="modal-panel-header">
                <h3>Owners and investment</h3>
                <span>${h.length} selected</span>
              </div>
              ${h.length?h.map(e=>{const d=p.get(e.pairId)??[];return`
                          <article class="pair-owner-card">
                            <div class="pair-owner-header">
                              <div>
                                <strong>${s(e.label)}</strong>
                                <p>${s(e.categories.join(", ")||"challenge")} ${e.leaders.length?`| ${s(e.leaders.join(", "))}`:""}</p>
                              </div>
                              <span>${d.length} owner${d.length===1?"":"s"}</span>
                            </div>
                            ${d.length?`<div class="owner-list">
                                    ${d.map(u=>`
                                        <div class="owner-row">
                                          <strong>${s(u.memberName)}</strong>
                                          <span>${s(O(u))}</span>
                                        </div>`).join("")}
                                  </div>`:'<div class="empty-state modal-empty">No imported members own this pair yet.</div>'}
                          </article>`}).join(""):'<div class="empty-state modal-empty">Select one or more challenge pairs to see owners and investment.</div>'}
            </section>
          </section>
        </div>`:""}
  `,($=r.querySelector('[data-role="member-select"]'))==null||$.addEventListener("change",e=>{l.selectedMemberId=e.target.value,m()}),(f=r.querySelector('[data-role="query-input"]'))==null||f.addEventListener("input",e=>{l.query=e.target.value,m()}),(w=r.querySelector('[data-role="type-select"]'))==null||w.addEventListener("change",e=>{l.typeFilter=e.target.value,m()}),(C=r.querySelector('[data-role="premium-select"]'))==null||C.addEventListener("change",e=>{l.premiumFilter=e.target.value,m()}),(I=r.querySelector('[data-role="role-select"]'))==null||I.addEventListener("change",e=>{l.roleFilter=e.target.value,m()}),(P=r.querySelector('[data-role="sort-select"]'))==null||P.addEventListener("change",e=>{l.sortKey=e.target.value,m()}),(S=r.querySelector('[data-role="challenge-only"]'))==null||S.addEventListener("change",e=>{l.challengeOnly=e.target.checked,m()}),(N=r.querySelector('[data-role="open-challenge-modal"]'))==null||N.addEventListener("click",()=>{x(n)}),(L=r.querySelector('[data-role="close-challenge-modal"]'))==null||L.addEventListener("click",()=>{F()}),(M=r.querySelector('[data-role="modal-backdrop"]'))==null||M.addEventListener("click",e=>{var d,u;((u=(d=e.target)==null?void 0:d.dataset)==null?void 0:u.role)==="modal-backdrop"&&F()}),r.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(e=>{e.addEventListener("change",()=>{j(e.value)})}),r.querySelectorAll("[data-member-id]").forEach(e=>{e.addEventListener("click",()=>{l.selectedMemberId=e.dataset.memberId??"all",m()})})}async function K(){const r=await fetch("./data/rosters.json");l.snapshot=await r.json(),m()}K().catch(r=>{const n=document.querySelector("#app");n&&(n.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${s(r.message)}</section></main>`)});
