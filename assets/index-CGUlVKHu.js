(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function c(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(n){if(n.ep)return;n.ep=!0;const r=c(n);fetch(n.href,r)}})();const y={arc_suit_fair:"Arc Suit Fair",ex_master_fair:"EX Master Fair",master_fair:"Master Fair",ex_fair:"EX Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",special_costume:"Special Costume",variety:"Variety",spotlight:"Spotlight",trainer_lodge:"Trainer Lodge",battle_points:"Battle Points",ticket_exchange:"Ticket Exchange",gym_scout:"Gym Scout",event_reward:"Event Reward",main_story:"Main Story",legendary_adventures:"Legendary Adventures",general_pool:"General Pool"},a={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",acquisitionFilters:[],roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:""};function i(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function R(e){const t=(e==null?void 0:e.acquisition)??"";return t?t.includes("Arc Suit Fair")?"arc_suit_fair":t.includes("EX Master Fair")?"ex_master_fair":t.includes("Master Fair")?"master_fair":t.includes("EX Fair")?"ex_fair":t.includes("Poké Fair")||t.includes("Poke Fair")?"poke_fair":t.includes("Seasonal")?"seasonal":t.includes("Special Costume")?"special_costume":t.includes("Variety")?"variety":t.includes("Spotlight")?"spotlight":t.includes("Trainer Lodge")?"trainer_lodge":t.includes("Battle Points")?"battle_points":t.includes("Training Ticket")?"ticket_exchange":t.includes("Gym Scout")?"gym_scout":t.includes("Event Reward")?"event_reward":t.includes("Legendary Adventures")?"legendary_adventures":t.includes("Main Story")?"main_story":"general_pool":"general_pool"}function v(e){return(e==null?void 0:e.acquisitionCategory)||R(e)}function A(e,t,c){const o=!a.query||`${e.label} ${t} ${e.type} ${e.roleLabel} ${e.trainerName} ${e.pokemonName}`.toLowerCase().includes(a.query.toLowerCase()),n=a.typeFilter==="all"||e.type===a.typeFilter,r=a.acquisitionFilters.length===0||a.acquisitionFilters.includes(v(e)),s=a.roleFilter==="all"||e.roleCategory===a.roleFilter,d=!a.challengeOnly||c.has(e.pairId);return o&&n&&r&&s&&d}function O(e){const t=a.acquisitionFilters.includes(e);a.acquisitionFilters=t?a.acquisitionFilters.filter(c=>c!==e):[...a.acquisitionFilters,e],m()}function j(e){var o,n;const t=new Set(((o=e.currentChallenge)==null?void 0:o.significantPairIds)??[]);return(a.selectedMemberId==="all"?e.members.flatMap(r=>r.pairs.map(s=>({...s,ownerName:r.displayName}))):(((n=e.members.find(r=>r.id===a.selectedMemberId))==null?void 0:n.pairs)??[]).map(r=>{var s;return{...r,ownerName:((s=e.members.find(d=>d.id===a.selectedMemberId))==null?void 0:s.displayName)??""}})).filter(r=>A(r,r.ownerName,t)).sort((r,s)=>{if(a.sortKey==="owner"){const d=r.ownerName.localeCompare(s.ownerName);return d!==0?d:r.label.localeCompare(s.label)}if(a.sortKey==="type"){const d=(r.type||"").localeCompare(s.type||"");return d!==0?d:r.label.localeCompare(s.label)}if(a.sortKey==="premium"){const d=(y[r.acquisitionCategory]||r.acquisitionCategory).localeCompare(y[s.acquisitionCategory]||s.acquisitionCategory);return d!==0?d:r.label.localeCompare(s.label)}return r.label.localeCompare(s.label)})}function H(e){var c;const t=new Set(((c=e.currentChallenge)==null?void 0:c.significantPairIds)??[]);return e.members.map(o=>{const n=o.pairs.filter(r=>A(r,o.displayName,t)).sort((r,s)=>r.label.localeCompare(s.label));return{memberId:o.id,memberName:o.displayName,pairCount:n.length,pairs:n}}).filter(o=>o.pairCount>0).sort((o,n)=>n.pairCount!==o.pairCount?n.pairCount-o.pairCount:o.memberName.localeCompare(n.memberName))}function U(e){var o;const t=((o=e.currentChallenge)==null?void 0:o.significantPairs)??[],c=new Map;return t.forEach(n=>{const r=c.get(n.pairId);if(!r){c.set(n.pairId,{pairId:n.pairId,label:n.label,categories:new Set(n.category?[n.category]:[]),leaders:new Set(n.leaderName?[n.leaderName]:[])});return}n.category&&r.categories.add(n.category),n.leaderName&&r.leaders.add(n.leaderName)}),Array.from(c.values()).map(n=>({pairId:n.pairId,label:n.label,categories:Array.from(n.categories).sort(),leaders:Array.from(n.leaders).sort()})).sort((n,r)=>n.label.localeCompare(r.label))}function K(e){const t=[`${e.syncLevel}/5`],c=String(e.rawValue??"").split("|"),o=Number.parseInt(c[4]??"0",10)>0,n={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return e.isEx&&t.push("EX"),o&&e.exRoleLabel&&t.push(n[e.exRoleLabel]??e.exRoleLabel.toUpperCase()),t.join(" | ")}function V(e){const t=a.selectedChallengePairIds.includes(e);a.selectedChallengePairIds=t?a.selectedChallengePairIds.filter(c=>c!==e):[...a.selectedChallengePairIds,e],b()}function X(e){a.challengeModalOpen=!0,a.challengePairQuery="",a.selectedChallengePairIds.length||(a.selectedChallengePairIds=a.challengePairs.slice(0,6).map(t=>t.pairId)),m()}function _(){a.challengeModalOpen=!1,m()}function B(){const e=a.snapshot,t=e==null?void 0:e.currentChallenge;if(!a.challengeModalOpen||!e||!t)return"";const c=a.challengePairQuery.trim().toLowerCase(),o=c?a.challengePairs.filter(s=>`${s.label} ${s.categories.join(" ")} ${s.leaders.join(" ")}`.toLowerCase().includes(c)):a.challengePairs,n=a.challengePairs.filter(s=>a.selectedChallengePairIds.includes(s.pairId)),r=a.selectedChallengePairIds.length?e.members.map(s=>{const d=n.map(h=>{const g=s.pairs.find(u=>u.pairId===h.pairId);return g?{pairId:h.pairId,label:h.label,investment:K({syncLevel:g.syncLevel,isEx:g.isEx,rawValue:g.rawValue,exRoleLabel:g.exRoleLabel})}:null}).filter(Boolean);return{memberId:s.id,memberName:s.displayName,ownedPairs:d}}).filter(s=>s.ownedPairs.length===a.selectedChallengePairIds.length).sort((s,d)=>s.memberName.localeCompare(d.memberName)):[];return`
    <div class="modal-backdrop" data-role="modal-backdrop">
      <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
        <div class="challenge-modal-header">
          <div>
            <p class="eyebrow">Current challenge modal</p>
            <h2>${i(t.name)}</h2>
            <p>Select challenge-relevant pairs to see which members own them and at what investment.</p>
          </div>
          <button class="modal-close" data-role="close-challenge-modal" type="button">Close</button>
        </div>

        <section class="modal-panel challenge-pair-panel">
          <div class="modal-panel-header">
            <h3>Challenge pairs</h3>
            <span>${o.length} shown</span>
          </div>
          <label class="modal-search">
            <span>Search challenge pairs</span>
            <input
              data-role="challenge-pair-query"
              type="search"
              value="${i(a.challengePairQuery)}"
              placeholder="Search pair, category, or leader..."
            />
          </label>
          <div class="challenge-pair-list">
            ${o.map(s=>`
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${i(s.pairId)}"
                    ${a.selectedChallengePairIds.includes(s.pairId)?"checked":""}
                  />
                  <div>
                    <strong>${i(s.label)}</strong>
                    <p>${i(s.categories.join(", ")||"challenge")} ${s.leaders.length?`| ${i(s.leaders.join(", "))}`:""}</p>
                  </div>
                </label>`).join("")}
          </div>
        </section>

        <section class="modal-panel pair-owner-panel">
          <div class="modal-panel-header">
            <h3>Members with all selected pairs</h3>
            <span>${r.length} member${r.length===1?"":"s"}</span>
          </div>
          ${n.length?r.length?r.map(s=>`
                      <article class="pair-owner-card">
                        <div class="pair-owner-header">
                          <div>
                            <strong>${i(s.memberName)}</strong>
                            <p>Owns all ${n.length} selected pair${n.length===1?"":"s"}</p>
                          </div>
                        </div>
                        <div class="owner-list">
                          ${s.ownedPairs.map(d=>`
                              <div class="owner-row">
                                <strong>${i(d.label)}</strong>
                                <span>${i(d.investment)}</span>
                              </div>`).join("")}
                        </div>
                      </article>`).join(""):'<div class="empty-state modal-empty">No imported members own all selected pairs.</div>':'<div class="empty-state modal-empty">Select one or more challenge pairs to see matching members.</div>'}
        </section>
      </section>
    </div>`}function G(e){var t,c,o;(t=e.querySelector('[data-role="challenge-pair-query"]'))==null||t.addEventListener("input",n=>{a.challengePairQuery=n.target.value,b()}),(c=e.querySelector('[data-role="close-challenge-modal"]'))==null||c.addEventListener("click",()=>{_()}),(o=e.querySelector('[data-role="modal-backdrop"]'))==null||o.addEventListener("click",n=>{var r,s;((s=(r=n.target)==null?void 0:r.dataset)==null?void 0:s.role)==="modal-backdrop"&&_()}),e.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(n=>{n.addEventListener("change",()=>{V(n.value)})})}function b(){var s;const e=document.querySelector("#modalRoot");if(!e)return;const t=document.activeElement,c=((s=t==null?void 0:t.dataset)==null?void 0:s.role)??"",o=(t==null?void 0:t.value)??"",n=typeof(t==null?void 0:t.selectionStart)=="number"?t.selectionStart:null,r=typeof(t==null?void 0:t.selectionEnd)=="number"?t.selectionEnd:null;if(e.innerHTML=B(),G(e),c&&t instanceof HTMLInputElement&&t.type!=="checkbox"){const d=e.querySelector(`[data-role="${c}"]${o?`[value="${CSS.escape(o)}"]`:""}`);d instanceof HTMLInputElement&&(d.focus(),n!==null&&r!==null&&d.setSelectionRange(n,r))}}function m(){var w,q,L,M,F,N,x,E,k;const e=document.querySelector("#app");if(!e)return;if(!a.snapshot){e.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const t=a.snapshot,c=j(t),o=t.members,n=Array.from(new Set(t.members.flatMap(l=>l.pairs.map(p=>p.type)).filter(Boolean))).sort(),r=Array.from(new Set(t.members.flatMap(l=>l.pairs.map(p=>p.roleCategory)).filter(Boolean))).sort(),s=t.currentChallenge,d=H(t),h=a.selectedMemberId==="all"&&a.typeFilter!=="all",g=a.selectedMemberId==="all"?`${t.gymName} gym`:((w=o.find(l=>l.id===a.selectedMemberId))==null?void 0:w.displayName)??"Unknown member",u=document.activeElement,$=((q=u==null?void 0:u.dataset)==null?void 0:q.role)??"",S=(u==null?void 0:u.value)??"",C=typeof(u==null?void 0:u.selectionStart)=="number"?u.selectionStart:null,I=typeof(u==null?void 0:u.selectionEnd)=="number"?u.selectionEnd:null,f=document.querySelector("#leftSide"),T=(f==null?void 0:f.scrollTop)??0;e.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${i(t.gymName)}.</p>
          ${s?`<p class="challenge-note">Current challenge: <strong>${i(s.name)}</strong> (${s.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${t.memberCount}</strong><span>Members</span></div>
          <div><strong>${t.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${c.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${a.selectedMemberId==="all"?" selected":""}>All members</option>
              ${o.map(l=>`<option value="${i(l.id)}"${l.id===a.selectedMemberId?" selected":""}>${i(l.displayName)} (${l.pairCount})</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${i(a.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${a.typeFilter==="all"?" selected":""}>All types</option>
              ${n.map(l=>`<option value="${i(l)}"${l===a.typeFilter?" selected":""}>${i(l)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${a.roleFilter==="all"?" selected":""}>All roles</option>
              ${r.map(l=>`<option value="${i(l)}"${l===a.roleFilter?" selected":""}>${i(l)}</option>`).join("")}
            </select>
          </label>
          <div class="premium-filter-block">
            <span>Acquisition</span>
            <div class="premium-filter-list">
              ${Object.entries(y).map(([l,p])=>`
                    <label class="premium-filter-row${a.acquisitionFilters.includes(l)?" active":""}">
                      <input
                        data-role="acquisition-checkbox"
                        type="checkbox"
                        value="${i(l)}"
                        ${a.acquisitionFilters.includes(l)?"checked":""}
                      />
                      <span class="premium-filter-name">${i(p)}</span>
                      <span class="premium-filter-state">${a.acquisitionFilters.includes(l)?"On":"Off"}</span>
                    </label>`).join("")}
            </div>
          </div>
          <label>
            <span>Sort</span>
            <select data-role="sort-select">
              <option value="label"${a.sortKey==="label"?" selected":""}>Pair name</option>
              <option value="owner"${a.sortKey==="owner"?" selected":""}>Member</option>
              <option value="type"${a.sortKey==="type"?" selected":""}>Type</option>
              <option value="premium"${a.sortKey==="premium"?" selected":""}>Premium</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input data-role="challenge-only" type="checkbox"${a.challengeOnly?" checked":""}${s?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${o.map(l=>`
                <button class="member-item${l.id===a.selectedMemberId?" active":""}" data-member-id="${i(l.id)}" type="button">
                  <strong>${i(l.displayName)}</strong>
                  <span>${l.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${i(g)}</p>
            <p>${h?`${d.length} member section${d.length===1?"":"s"}`:`${c.length} result${c.length===1?"":"s"}`}</p>
          </div>
          <div id="filtersUsed">
            ${a.query?`<span>${i(a.query)}</span>`:""}
            ${a.typeFilter!=="all"?`<span>${i(a.typeFilter)}</span>`:""}
            ${a.roleFilter!=="all"?`<span>${i(a.roleFilter)}</span>`:""}
            ${a.acquisitionFilters.map(l=>`<span>${i(y[l])}</span>`).join("")}
            ${a.challengeOnly?`<span>${i((s==null?void 0:s.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${t.generatedAt?new Date(t.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        ${h?`<div id="memberCoverageSections">
                ${d.length?d.map(l=>`
                          <section class="member-coverage-section">
                            <div class="member-coverage-header">
                              <div>
                                <h3>${i(l.memberName)}</h3>
                                <p>${l.pairCount} ${i(a.typeFilter)} pair${l.pairCount===1?"":"s"}</p>
                              </div>
                            </div>
                            <div class="member-coverage-grid">
                              ${l.pairs.map(p=>`
                                  <article class="syncPair selected">
                                    <div class="syncImageFrame">
                                      ${p.isEx&&p.exImagePath||p.primaryImagePath?`<img class="syncImage" src="${i(p.isEx&&p.exImagePath||p.primaryImagePath)}" alt="${i(p.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${i((p.trainerName||p.label).slice(0,2).toUpperCase())}</div>`}
                                    </div>
                                    ${p.isEx&&!p.exImagePath?'<div class="syncFav">EX</div>':""}
                                    <div class="syncLevelBadge">${i(p.syncLevel)}</div>
                                    <div class="syncInfos">
                                      <p class="infoName">${i(p.label)}</p>
                                      <p>${i(l.memberName)}</p>
                                      <p>${i(p.type||"Unknown")} | ${i(p.roleLabel||"Unknown")}</p>
                                      <p>${i(y[v(p)]||p.acquisition)}</p>
                                      <p>EX Role: ${i(p.exRoleLabel||"None")}</p>
                                    </div>
                                  </article>`).join("")}
                            </div>
                          </section>`).join(""):'<div class="empty-state">No members match the current type coverage filters.</div>'}
              </div>`:`<div id="syncPairs">
                ${c.length?c.map(l=>`
                          <article class="syncPair selected">
                            <div class="syncImageFrame">
                              ${l.isEx&&l.exImagePath||l.primaryImagePath?`<img class="syncImage" src="${i(l.isEx&&l.exImagePath||l.primaryImagePath)}" alt="${i(l.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${i((l.trainerName||l.label).slice(0,2).toUpperCase())}</div>`}
                            </div>
                            ${l.isEx&&!l.exImagePath?'<div class="syncFav">EX</div>':""}
                            <div class="syncLevelBadge">${i(l.syncLevel)}</div>
                            <div class="syncInfos">
                              <p class="infoName">${i(l.label)}</p>
                              <p>${i(l.ownerName)}</p>
                              <p>${i(l.type||"Unknown")} | ${i(l.roleLabel||"Unknown")}</p>
                              <p>${i(y[v(l)]||l.acquisition)}</p>
                              <p>EX Role: ${i(l.exRoleLabel||"None")}</p>
                            </div>
                          </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
              </div>`}
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(L=e.querySelector('[data-role="member-select"]'))==null||L.addEventListener("change",l=>{a.selectedMemberId=l.target.value,m()}),(M=e.querySelector('[data-role="query-input"]'))==null||M.addEventListener("input",l=>{a.query=l.target.value,m()}),(F=e.querySelector('[data-role="type-select"]'))==null||F.addEventListener("change",l=>{a.typeFilter=l.target.value,m()}),e.querySelectorAll('[data-role="acquisition-checkbox"]').forEach(l=>{l.addEventListener("change",()=>{O(l.value)})}),(N=e.querySelector('[data-role="role-select"]'))==null||N.addEventListener("change",l=>{a.roleFilter=l.target.value,m()}),(x=e.querySelector('[data-role="sort-select"]'))==null||x.addEventListener("change",l=>{a.sortKey=l.target.value,m()}),(E=e.querySelector('[data-role="challenge-only"]'))==null||E.addEventListener("change",l=>{a.challengeOnly=l.target.checked,m()}),(k=e.querySelector('[data-role="open-challenge-modal"]'))==null||k.addEventListener("click",()=>{X()}),e.querySelectorAll("[data-member-id]").forEach(l=>{l.addEventListener("click",()=>{a.selectedMemberId=l.dataset.memberId??"all",m()})}),b();const P=e.querySelector("#leftSide");if(P&&(P.scrollTop=T),$&&(u instanceof HTMLInputElement&&u.type!=="checkbox"||u instanceof HTMLSelectElement)){const l=e.querySelector(`[data-role="${$}"]${S?`[value="${CSS.escape(S)}"]`:""}`);(l instanceof HTMLInputElement||l instanceof HTMLSelectElement)&&(l.focus(),l instanceof HTMLInputElement&&C!==null&&I!==null&&l.setSelectionRange(C,I))}}async function Q(){const e=await fetch("./data/rosters.json");a.snapshot=await e.json(),a.challengePairs=U(a.snapshot),m()}Q().catch(e=>{const t=document.querySelector("#app");t&&(t.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${i(e.message)}</section></main>`)});
