(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function c(t){const n={};return t.integrity&&(n.integrity=t.integrity),t.referrerPolicy&&(n.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?n.credentials="include":t.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(t){if(t.ep)return;t.ep=!0;const n=c(t);fetch(t.href,n)}})();const y={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},l={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",premiumFilters:[],roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:""};function o(a){return String(a).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function x(a,s,c){const i=!l.query||`${a.label} ${s} ${a.type} ${a.roleLabel} ${a.trainerName} ${a.pokemonName}`.toLowerCase().includes(l.query.toLowerCase()),t=l.typeFilter==="all"||a.type===l.typeFilter,n=l.premiumFilters.length===0||l.premiumFilters.includes(a.premiumCategory),r=l.roleFilter==="all"||a.roleCategory===l.roleFilter,d=!l.challengeOnly||c.has(a.pairId);return i&&t&&n&&r&&d}function q(a){const s=l.premiumFilters.includes(a);l.premiumFilters=s?l.premiumFilters.filter(c=>c!==a):[...l.premiumFilters,a],u()}function k(a){var i,t;const s=new Set(((i=a.currentChallenge)==null?void 0:i.significantPairIds)??[]);return(l.selectedMemberId==="all"?a.members.flatMap(n=>n.pairs.map(r=>({...r,ownerName:n.displayName}))):(((t=a.members.find(n=>n.id===l.selectedMemberId))==null?void 0:t.pairs)??[]).map(n=>{var r;return{...n,ownerName:((r=a.members.find(d=>d.id===l.selectedMemberId))==null?void 0:r.displayName)??""}})).filter(n=>x(n,n.ownerName,s)).sort((n,r)=>{if(l.sortKey==="owner"){const d=n.ownerName.localeCompare(r.ownerName);return d!==0?d:n.label.localeCompare(r.label)}if(l.sortKey==="type"){const d=(n.type||"").localeCompare(r.type||"");return d!==0?d:n.label.localeCompare(r.label)}if(l.sortKey==="premium"){const d=(y[n.premiumCategory]||n.premiumCategory).localeCompare(y[r.premiumCategory]||r.premiumCategory);return d!==0?d:n.label.localeCompare(r.label)}return n.label.localeCompare(r.label)})}function R(a){var c;const s=new Set(((c=a.currentChallenge)==null?void 0:c.significantPairIds)??[]);return a.members.map(i=>{const t=i.pairs.filter(n=>x(n,i.displayName,s)).sort((n,r)=>n.label.localeCompare(r.label));return{memberId:i.id,memberName:i.displayName,pairCount:t.length,pairs:t}}).filter(i=>i.pairCount>0).sort((i,t)=>t.pairCount!==i.pairCount?t.pairCount-i.pairCount:i.memberName.localeCompare(t.memberName))}function A(a){var i;const s=((i=a.currentChallenge)==null?void 0:i.significantPairs)??[],c=new Map;return s.forEach(t=>{const n=c.get(t.pairId);if(!n){c.set(t.pairId,{pairId:t.pairId,label:t.label,categories:new Set(t.category?[t.category]:[]),leaders:new Set(t.leaderName?[t.leaderName]:[])});return}t.category&&n.categories.add(t.category),t.leaderName&&n.leaders.add(t.leaderName)}),Array.from(c.values()).map(t=>({pairId:t.pairId,label:t.label,categories:Array.from(t.categories).sort(),leaders:Array.from(t.leaders).sort()})).sort((t,n)=>t.label.localeCompare(n.label))}function O(a){const s=[`${a.syncLevel}/5`],c=String(a.rawValue??"").split("|"),i=Number.parseInt(c[4]??"0",10)>0,t={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return a.isEx&&s.push("EX"),i&&a.exRoleLabel&&s.push(t[a.exRoleLabel]??a.exRoleLabel.toUpperCase()),s.join(" | ")}function j(a){const s=l.selectedChallengePairIds.includes(a);l.selectedChallengePairIds=s?l.selectedChallengePairIds.filter(c=>c!==a):[...l.selectedChallengePairIds,a],v()}function T(a){l.challengeModalOpen=!0,l.challengePairQuery="",l.selectedChallengePairIds.length||(l.selectedChallengePairIds=l.challengePairs.slice(0,6).map(s=>s.pairId)),u()}function E(){l.challengeModalOpen=!1,u()}function U(){const a=l.snapshot,s=a==null?void 0:a.currentChallenge;if(!l.challengeModalOpen||!a||!s)return"";const c=l.challengePairQuery.trim().toLowerCase(),i=c?l.challengePairs.filter(r=>`${r.label} ${r.categories.join(" ")} ${r.leaders.join(" ")}`.toLowerCase().includes(c)):l.challengePairs,t=l.challengePairs.filter(r=>l.selectedChallengePairIds.includes(r.pairId)),n=l.selectedChallengePairIds.length?a.members.map(r=>{const d=t.map(h=>{const g=r.pairs.find(m=>m.pairId===h.pairId);return g?{pairId:h.pairId,label:h.label,investment:O({syncLevel:g.syncLevel,isEx:g.isEx,rawValue:g.rawValue,exRoleLabel:g.exRoleLabel})}:null}).filter(Boolean);return{memberId:r.id,memberName:r.displayName,ownedPairs:d}}).filter(r=>r.ownedPairs.length===l.selectedChallengePairIds.length).sort((r,d)=>r.memberName.localeCompare(d.memberName)):[];return`
    <div class="modal-backdrop" data-role="modal-backdrop">
      <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
        <div class="challenge-modal-header">
          <div>
            <p class="eyebrow">Current challenge modal</p>
            <h2>${o(s.name)}</h2>
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
              value="${o(l.challengePairQuery)}"
              placeholder="Search pair, category, or leader..."
            />
          </label>
          <div class="challenge-pair-list">
            ${i.map(r=>`
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${o(r.pairId)}"
                    ${l.selectedChallengePairIds.includes(r.pairId)?"checked":""}
                  />
                  <div>
                    <strong>${o(r.label)}</strong>
                    <p>${o(r.categories.join(", ")||"challenge")} ${r.leaders.length?`| ${o(r.leaders.join(", "))}`:""}</p>
                  </div>
                </label>`).join("")}
          </div>
        </section>

        <section class="modal-panel pair-owner-panel">
          <div class="modal-panel-header">
            <h3>Members with all selected pairs</h3>
            <span>${n.length} member${n.length===1?"":"s"}</span>
          </div>
          ${t.length?n.length?n.map(r=>`
                      <article class="pair-owner-card">
                        <div class="pair-owner-header">
                          <div>
                            <strong>${o(r.memberName)}</strong>
                            <p>Owns all ${t.length} selected pair${t.length===1?"":"s"}</p>
                          </div>
                        </div>
                        <div class="owner-list">
                          ${r.ownedPairs.map(d=>`
                              <div class="owner-row">
                                <strong>${o(d.label)}</strong>
                                <span>${o(d.investment)}</span>
                              </div>`).join("")}
                        </div>
                      </article>`).join(""):'<div class="empty-state modal-empty">No imported members own all selected pairs.</div>':'<div class="empty-state modal-empty">Select one or more challenge pairs to see matching members.</div>'}
        </section>
      </section>
    </div>`}function H(a){var s,c,i;(s=a.querySelector('[data-role="challenge-pair-query"]'))==null||s.addEventListener("input",t=>{l.challengePairQuery=t.target.value,v()}),(c=a.querySelector('[data-role="close-challenge-modal"]'))==null||c.addEventListener("click",()=>{E()}),(i=a.querySelector('[data-role="modal-backdrop"]'))==null||i.addEventListener("click",t=>{var n,r;((r=(n=t.target)==null?void 0:n.dataset)==null?void 0:r.role)==="modal-backdrop"&&E()}),a.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(t=>{t.addEventListener("change",()=>{j(t.value)})})}function v(){var n;const a=document.querySelector("#modalRoot");if(!a)return;const s=document.activeElement,c=((n=s==null?void 0:s.dataset)==null?void 0:n.role)??"",i=typeof(s==null?void 0:s.selectionStart)=="number"?s.selectionStart:null,t=typeof(s==null?void 0:s.selectionEnd)=="number"?s.selectionEnd:null;if(a.innerHTML=U(),H(a),c){const r=a.querySelector(`[data-role="${c}"]`);r instanceof HTMLInputElement&&(r.focus(),i!==null&&t!==null&&r.setSelectionRange(i,t))}}function u(){var C,I,P,S,w,L,M,N,F;const a=document.querySelector("#app");if(!a)return;if(!l.snapshot){a.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const s=l.snapshot,c=k(s),i=s.members,t=Array.from(new Set(s.members.flatMap(e=>e.pairs.map(p=>p.type)).filter(Boolean))).sort(),n=Array.from(new Set(s.members.flatMap(e=>e.pairs.map(p=>p.roleCategory)).filter(Boolean))).sort(),r=s.currentChallenge,d=R(s),h=l.selectedMemberId==="all"&&l.typeFilter!=="all",g=l.selectedMemberId==="all"?`${s.gymName} gym`:((C=i.find(e=>e.id===l.selectedMemberId))==null?void 0:C.displayName)??"Unknown member",m=document.activeElement,f=((I=m==null?void 0:m.dataset)==null?void 0:I.role)??"",b=typeof(m==null?void 0:m.selectionStart)=="number"?m.selectionStart:null,$=typeof(m==null?void 0:m.selectionEnd)=="number"?m.selectionEnd:null;if(a.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${o(s.gymName)}.</p>
          ${r?`<p class="challenge-note">Current challenge: <strong>${o(r.name)}</strong> (${r.significantPairIds.length} significant pairs)</p>
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
              <option value="all"${l.selectedMemberId==="all"?" selected":""}>All members</option>
              ${i.map(e=>`<option value="${o(e.id)}"${e.id===l.selectedMemberId?" selected":""}>${o(e.displayName)} (${e.pairCount})</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${o(l.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${l.typeFilter==="all"?" selected":""}>All types</option>
              ${t.map(e=>`<option value="${o(e)}"${e===l.typeFilter?" selected":""}>${o(e)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${l.roleFilter==="all"?" selected":""}>All roles</option>
              ${n.map(e=>`<option value="${o(e)}"${e===l.roleFilter?" selected":""}>${o(e)}</option>`).join("")}
            </select>
          </label>
          <div class="premium-filter-block">
            <span>Premium tiers</span>
            <div class="premium-filter-list">
              ${Object.entries(y).filter(([e])=>e!=="general").map(([e,p])=>`
                    <label class="premium-filter-row${l.premiumFilters.includes(e)?" active":""}">
                      <input
                        data-role="premium-checkbox"
                        type="checkbox"
                        value="${o(e)}"
                        ${l.premiumFilters.includes(e)?"checked":""}
                      />
                      <span class="premium-filter-name">${o(p)}</span>
                      <span class="premium-filter-state">${l.premiumFilters.includes(e)?"On":"Off"}</span>
                    </label>`).join("")}
            </div>
          </div>
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
            <input data-role="challenge-only" type="checkbox"${l.challengeOnly?" checked":""}${r?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${i.map(e=>`
                <button class="member-item${e.id===l.selectedMemberId?" active":""}" data-member-id="${o(e.id)}" type="button">
                  <strong>${o(e.displayName)}</strong>
                  <span>${e.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${o(g)}</p>
            <p>${h?`${d.length} member section${d.length===1?"":"s"}`:`${c.length} result${c.length===1?"":"s"}`}</p>
          </div>
          <div id="filtersUsed">
            ${l.query?`<span>${o(l.query)}</span>`:""}
            ${l.typeFilter!=="all"?`<span>${o(l.typeFilter)}</span>`:""}
            ${l.roleFilter!=="all"?`<span>${o(l.roleFilter)}</span>`:""}
            ${l.premiumFilters.map(e=>`<span>${o(y[e])}</span>`).join("")}
            ${l.challengeOnly?`<span>${o((r==null?void 0:r.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${s.generatedAt?new Date(s.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        ${h?`<div id="memberCoverageSections">
                ${d.length?d.map(e=>`
                          <section class="member-coverage-section">
                            <div class="member-coverage-header">
                              <div>
                                <h3>${o(e.memberName)}</h3>
                                <p>${e.pairCount} ${o(l.typeFilter)} pair${e.pairCount===1?"":"s"}</p>
                              </div>
                            </div>
                            <div class="member-coverage-grid">
                              ${e.pairs.map(p=>`
                                  <article class="syncPair selected">
                                    <div class="syncImageFrame">
                                      ${p.isEx&&p.exImagePath||p.primaryImagePath?`<img class="syncImage" src="${o(p.isEx&&p.exImagePath||p.primaryImagePath)}" alt="${o(p.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${o((p.trainerName||p.label).slice(0,2).toUpperCase())}</div>`}
                                    </div>
                                    ${p.isEx&&!p.exImagePath?'<div class="syncFav">EX</div>':""}
                                    <div class="syncLevelBadge">${o(p.syncLevel)}</div>
                                    <div class="syncInfos">
                                      <p class="infoName">${o(p.label)}</p>
                                      <p>${o(e.memberName)}</p>
                                      <p>${o(p.type||"Unknown")} | ${o(p.roleLabel||"Unknown")}</p>
                                      <p>${o(y[p.premiumCategory]||p.premiumCategory)}</p>
                                      <p>EX Role: ${o(p.exRoleLabel||"None")}</p>
                                    </div>
                                  </article>`).join("")}
                            </div>
                          </section>`).join(""):'<div class="empty-state">No members match the current type coverage filters.</div>'}
              </div>`:`<div id="syncPairs">
                ${c.length?c.map(e=>`
                          <article class="syncPair selected">
                            <div class="syncImageFrame">
                              ${e.isEx&&e.exImagePath||e.primaryImagePath?`<img class="syncImage" src="${o(e.isEx&&e.exImagePath||e.primaryImagePath)}" alt="${o(e.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${o((e.trainerName||e.label).slice(0,2).toUpperCase())}</div>`}
                            </div>
                            ${e.isEx&&!e.exImagePath?'<div class="syncFav">EX</div>':""}
                            <div class="syncLevelBadge">${o(e.syncLevel)}</div>
                            <div class="syncInfos">
                              <p class="infoName">${o(e.label)}</p>
                              <p>${o(e.ownerName)}</p>
                              <p>${o(e.type||"Unknown")} | ${o(e.roleLabel||"Unknown")}</p>
                              <p>${o(y[e.premiumCategory]||e.premiumCategory)}</p>
                              <p>EX Role: ${o(e.exRoleLabel||"None")}</p>
                            </div>
                          </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
              </div>`}
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(P=a.querySelector('[data-role="member-select"]'))==null||P.addEventListener("change",e=>{l.selectedMemberId=e.target.value,u()}),(S=a.querySelector('[data-role="query-input"]'))==null||S.addEventListener("input",e=>{l.query=e.target.value,u()}),(w=a.querySelector('[data-role="type-select"]'))==null||w.addEventListener("change",e=>{l.typeFilter=e.target.value,u()}),a.querySelectorAll('[data-role="premium-checkbox"]').forEach(e=>{e.addEventListener("change",()=>{q(e.value)})}),(L=a.querySelector('[data-role="role-select"]'))==null||L.addEventListener("change",e=>{l.roleFilter=e.target.value,u()}),(M=a.querySelector('[data-role="sort-select"]'))==null||M.addEventListener("change",e=>{l.sortKey=e.target.value,u()}),(N=a.querySelector('[data-role="challenge-only"]'))==null||N.addEventListener("change",e=>{l.challengeOnly=e.target.checked,u()}),(F=a.querySelector('[data-role="open-challenge-modal"]'))==null||F.addEventListener("click",()=>{T()}),a.querySelectorAll("[data-member-id]").forEach(e=>{e.addEventListener("click",()=>{l.selectedMemberId=e.dataset.memberId??"all",u()})}),v(),f){const e=a.querySelector(`[data-role="${f}"]`);(e instanceof HTMLInputElement||e instanceof HTMLSelectElement)&&(e.focus(),e instanceof HTMLInputElement&&b!==null&&$!==null&&e.setSelectionRange(b,$))}}async function K(){const a=await fetch("./data/rosters.json");l.snapshot=await a.json(),l.challengePairs=A(l.snapshot),u()}K().catch(a=>{const s=document.querySelector("#app");s&&(s.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${o(a.message)}</section></main>`)});
