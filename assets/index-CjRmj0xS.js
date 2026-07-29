(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))c(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&c(n)}).observe(document,{childList:!0,subtree:!0});function o(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function c(s){if(s.ep)return;s.ep=!0;const r=o(s);fetch(s.href,r)}})();const v={arc_suit_fair:"Arc Suit Fair",ex_master_fair:"EX Master Fair",master_fair:"Master Fair",ex_fair:"EX Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",special_costume:"Special Costume",variety:"Variety",spotlight:"Spotlight",trainer_lodge:"Trainer Lodge",battle_points:"Battle Points",ticket_exchange:"Ticket Exchange",gym_scout:"Gym Scout",event_reward:"Event Reward",main_story:"Main Story",legendary_adventures:"Legendary Adventures",general_pool:"General Pool"},a={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",acquisitionFilters:[],roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:"",selectedChallengeRound:4};function i(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function H(e){const t=(e==null?void 0:e.acquisition)??"";return t?t.includes("Arc Suit Fair")?"arc_suit_fair":t.includes("EX Master Fair")?"ex_master_fair":t.includes("Master Fair")?"master_fair":t.includes("EX Fair")?"ex_fair":t.includes("Poké Fair")||t.includes("Poke Fair")?"poke_fair":t.includes("Seasonal")?"seasonal":t.includes("Special Costume")?"special_costume":t.includes("Variety")?"variety":t.includes("Spotlight")?"spotlight":t.includes("Trainer Lodge")?"trainer_lodge":t.includes("Battle Points")?"battle_points":t.includes("Training Ticket")?"ticket_exchange":t.includes("Gym Scout")?"gym_scout":t.includes("Event Reward")?"event_reward":t.includes("Legendary Adventures")?"legendary_adventures":t.includes("Main Story")?"main_story":"general_pool":"general_pool"}function $(e){return(e==null?void 0:e.acquisitionCategory)||H(e)}function O(e,t,o){const c=!a.query||`${e.label} ${t} ${e.type} ${e.roleLabel} ${e.trainerName} ${e.pokemonName}`.toLowerCase().includes(a.query.toLowerCase()),s=a.typeFilter==="all"||e.type===a.typeFilter,r=a.acquisitionFilters.length===0||a.acquisitionFilters.includes($(e)),n=a.roleFilter==="all"||e.roleCategory===a.roleFilter,d=!a.challengeOnly||o.has(e.pairId);return c&&s&&r&&n&&d}function U(e){const t=a.acquisitionFilters.includes(e);a.acquisitionFilters=t?a.acquisitionFilters.filter(o=>o!==e):[...a.acquisitionFilters,e],g()}function K(e){var c,s;const t=new Set(((c=e.currentChallenge)==null?void 0:c.significantPairIds)??[]);return(a.selectedMemberId==="all"?e.members.flatMap(r=>r.pairs.map(n=>({...n,ownerName:r.displayName}))):(((s=e.members.find(r=>r.id===a.selectedMemberId))==null?void 0:s.pairs)??[]).map(r=>{var n;return{...r,ownerName:((n=e.members.find(d=>d.id===a.selectedMemberId))==null?void 0:n.displayName)??""}})).filter(r=>O(r,r.ownerName,t)).sort((r,n)=>{if(a.sortKey==="owner"){const d=r.ownerName.localeCompare(n.ownerName);return d!==0?d:r.label.localeCompare(n.label)}if(a.sortKey==="type"){const d=(r.type||"").localeCompare(n.type||"");return d!==0?d:r.label.localeCompare(n.label)}if(a.sortKey==="premium"){const d=(v[r.acquisitionCategory]||r.acquisitionCategory).localeCompare(v[n.acquisitionCategory]||n.acquisitionCategory);return d!==0?d:r.label.localeCompare(n.label)}return r.label.localeCompare(n.label)})}function B(e){var o;const t=new Set(((o=e.currentChallenge)==null?void 0:o.significantPairIds)??[]);return e.members.map(c=>{const s=c.pairs.filter(r=>O(r,c.displayName,t)).sort((r,n)=>r.label.localeCompare(n.label));return{memberId:c.id,memberName:c.displayName,pairCount:s.length,pairs:s}}).filter(c=>c.pairCount>0).sort((c,s)=>s.pairCount!==c.pairCount?s.pairCount-c.pairCount:c.memberName.localeCompare(s.memberName))}function V(e){var c;const t=((c=e.currentChallenge)==null?void 0:c.significantPairs)??[],o=new Map;return t.forEach(s=>{const r=o.get(s.pairId);if(!r){o.set(s.pairId,{pairId:s.pairId,label:s.label,categories:new Set(s.category?[s.category]:[]),leaders:new Set(s.leaderName?[s.leaderName]:[])});return}s.category&&r.categories.add(s.category),s.leaderName&&r.leaders.add(s.leaderName)}),Array.from(o.values()).map(s=>({pairId:s.pairId,label:s.label,categories:Array.from(s.categories).sort(),leaders:Array.from(s.leaders).sort()})).sort((s,r)=>s.label.localeCompare(r.label))}function X(e,t,o){if(!e||!t)return"";if(o===1)return e.battle1Effect||"";if(o===2)return e.battle2Effect||"";if(o===3)return e.battle3Effect||"";const c=["modifier1","modifier2","modifier3"].map(n=>{var d;return((d=t.modifiers)==null?void 0:d[n])||""}).filter(Boolean);if(c.length<3)return"";const r=((o-4)%3+e.slotNumber-1)%3;return c[r]||""}function G(e,t){const o=(e==null?void 0:e.roundStats)??[],c=o.find(r=>r.roundNumber===t);return c||o.filter(r=>r.roundNumber<=t).sort((r,n)=>n.roundNumber-r.roundNumber)[0]||o[o.length-1]||null}function f(e){return Number(e||0).toLocaleString()}function Q(e){const t=[`${e.syncLevel}/5`],o=String(e.rawValue??"").split("|"),c=Number.parseInt(o[4]??"0",10)>0,s={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return e.isEx&&t.push("EX"),c&&e.exRoleLabel&&t.push(s[e.exRoleLabel]??e.exRoleLabel.toUpperCase()),t.join(" | ")}function z(e){const t=a.selectedChallengePairIds.includes(e);a.selectedChallengePairIds=t?a.selectedChallengePairIds.filter(o=>o!==e):[...a.selectedChallengePairIds,e],S()}function D(e){a.challengeModalOpen=!0,a.challengePairQuery="",a.selectedChallengePairIds.length||(a.selectedChallengePairIds=a.challengePairs.slice(0,6).map(t=>t.pairId)),g()}function A(){a.challengeModalOpen=!1,g()}function J(){const e=a.snapshot,t=e==null?void 0:e.currentChallenge;if(!a.challengeModalOpen||!e||!t)return"";const o=a.challengePairQuery.trim().toLowerCase(),c=o?a.challengePairs.filter(n=>`${n.label} ${n.categories.join(" ")} ${n.leaders.join(" ")}`.toLowerCase().includes(o)):a.challengePairs,s=a.challengePairs.filter(n=>a.selectedChallengePairIds.includes(n.pairId)),r=a.selectedChallengePairIds.length?e.members.map(n=>{const d=s.map(h=>{const m=n.pairs.find(y=>y.pairId===h.pairId);return m?{pairId:h.pairId,label:h.label,investment:Q({syncLevel:m.syncLevel,isEx:m.isEx,rawValue:m.rawValue,exRoleLabel:m.exRoleLabel})}:null}).filter(Boolean);return{memberId:n.id,memberName:n.displayName,ownedPairs:d}}).filter(n=>n.ownedPairs.length===a.selectedChallengePairIds.length).sort((n,d)=>n.memberName.localeCompare(d.memberName)):[];return`
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
            <span>${c.length} shown</span>
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
            ${c.map(n=>`
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${i(n.pairId)}"
                    ${a.selectedChallengePairIds.includes(n.pairId)?"checked":""}
                  />
                  <div>
                    <strong>${i(n.label)}</strong>
                    <p>${i(n.categories.join(", ")||"challenge")} ${n.leaders.length?`| ${i(n.leaders.join(", "))}`:""}</p>
                  </div>
                </label>`).join("")}
          </div>
        </section>

        <section class="modal-panel pair-owner-panel">
          <div class="modal-panel-header">
            <h3>Members with all selected pairs</h3>
            <span>${r.length} member${r.length===1?"":"s"}</span>
          </div>
          ${s.length?r.length?r.map(n=>`
                      <article class="pair-owner-card">
                        <div class="pair-owner-header">
                          <div>
                            <strong>${i(n.memberName)}</strong>
                            <p>Owns all ${s.length} selected pair${s.length===1?"":"s"}</p>
                          </div>
                        </div>
                        <div class="owner-list">
                          ${n.ownedPairs.map(d=>`
                              <div class="owner-row">
                                <strong>${i(d.label)}</strong>
                                <span>${i(d.investment)}</span>
                              </div>`).join("")}
                        </div>
                      </article>`).join(""):'<div class="empty-state modal-empty">No imported members own all selected pairs.</div>':'<div class="empty-state modal-empty">Select one or more challenge pairs to see matching members.</div>'}
        </section>
      </section>
    </div>`}function W(e){var t,o,c;(t=e.querySelector('[data-role="challenge-pair-query"]'))==null||t.addEventListener("input",s=>{a.challengePairQuery=s.target.value,S()}),(o=e.querySelector('[data-role="close-challenge-modal"]'))==null||o.addEventListener("click",()=>{A()}),(c=e.querySelector('[data-role="modal-backdrop"]'))==null||c.addEventListener("click",s=>{var r,n;((n=(r=s.target)==null?void 0:r.dataset)==null?void 0:n.role)==="modal-backdrop"&&A()}),e.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(s=>{s.addEventListener("change",()=>{z(s.value)})})}function S(){var n;const e=document.querySelector("#modalRoot");if(!e)return;const t=document.activeElement,o=((n=t==null?void 0:t.dataset)==null?void 0:n.role)??"",c=(t==null?void 0:t.value)??"",s=typeof(t==null?void 0:t.selectionStart)=="number"?t.selectionStart:null,r=typeof(t==null?void 0:t.selectionEnd)=="number"?t.selectionEnd:null;if(e.innerHTML=J(),W(e),o&&t instanceof HTMLInputElement&&t.type!=="checkbox"){const d=e.querySelector(`[data-role="${o}"]${c?`[value="${CSS.escape(c)}"]`:""}`);d instanceof HTMLInputElement&&(d.focus(),s!==null&&r!==null&&d.setSelectionRange(s,r))}}function g(){var q,M,N,F,E,x,k,R,_,T;const e=document.querySelector("#app");if(!e)return;if(!a.snapshot){e.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const t=a.snapshot,o=K(t),c=t.members,s=Array.from(new Set(t.members.flatMap(l=>l.pairs.map(p=>p.type)).filter(Boolean))).sort(),r=Array.from(new Set(t.members.flatMap(l=>l.pairs.map(p=>p.roleCategory)).filter(Boolean))).sort(),n=t.currentChallenge,d=B(t),h=a.selectedMemberId==="all"&&a.typeFilter!=="all",m=G(n,a.selectedChallengeRound),y=a.selectedMemberId==="all"?`${t.gymName} gym`:((q=c.find(l=>l.id===a.selectedMemberId))==null?void 0:q.displayName)??"Unknown member",u=document.activeElement,C=((M=u==null?void 0:u.dataset)==null?void 0:M.role)??"",P=(u==null?void 0:u.value)??"",I=typeof(u==null?void 0:u.selectionStart)=="number"?u.selectionStart:null,w=typeof(u==null?void 0:u.selectionEnd)=="number"?u.selectionEnd:null,b=document.querySelector("#leftSide"),j=(b==null?void 0:b.scrollTop)??0;e.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${i(t.gymName)}.</p>
          ${n?`<p class="challenge-note">Current challenge: <strong>${i(n.name)}</strong> (${n.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${t.memberCount}</strong><span>Members</span></div>
          <div><strong>${t.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${o.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${a.selectedMemberId==="all"?" selected":""}>All members</option>
              ${c.map(l=>`<option value="${i(l.id)}"${l.id===a.selectedMemberId?" selected":""}>${i(l.displayName)} (${l.pairCount})</option>`).join("")}
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
              ${s.map(l=>`<option value="${i(l)}"${l===a.typeFilter?" selected":""}>${i(l)}</option>`).join("")}
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
              ${Object.entries(v).map(([l,p])=>`
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
            <input data-role="challenge-only" type="checkbox"${a.challengeOnly?" checked":""}${n?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${c.map(l=>`
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
            <p>${i(y)}</p>
            <p>${h?`${d.length} member section${d.length===1?"":"s"}`:`${o.length} result${o.length===1?"":"s"}`}</p>
          </div>
          <div id="filtersUsed">
            ${a.query?`<span>${i(a.query)}</span>`:""}
            ${a.typeFilter!=="all"?`<span>${i(a.typeFilter)}</span>`:""}
            ${a.roleFilter!=="all"?`<span>${i(a.roleFilter)}</span>`:""}
            ${a.acquisitionFilters.map(l=>`<span>${i(v[l])}</span>`).join("")}
            ${a.challengeOnly?`<span>${i((n==null?void 0:n.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${t.generatedAt?new Date(t.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        ${n?`<section class="challenge-overview-panel">
                <div class="challenge-overview-header">
                  <div>
                    <p class="eyebrow">Current challenge</p>
                    <h2>${i(n.name)}</h2>
                    <p class="challenge-note">${i(n.notes||"No challenge notes.")}</p>
                  </div>
                  <div class="challenge-round-picker">
                    <label>
                      <span>Round ${a.selectedChallengeRound}</span>
                      <input data-role="challenge-round" type="range" min="1" max="30" step="1" value="${a.selectedChallengeRound}" />
                    </label>
                  </div>
                </div>
                ${m?`<div class="challenge-stats-grid">
                        <div><strong>${f(m.points)}</strong><span>Round points</span></div>
                        <div><strong>${f(m.cumulativePoints)}</strong><span>Total points</span></div>
                        <div><strong>${f(m.middleHp)}</strong><span>Middle HP</span></div>
                        <div><strong>${f(m.sideHp)}</strong><span>Side HP</span></div>
                        <div><strong>${f(m.middleOffenses)}</strong><span>Middle offenses</span></div>
                        <div><strong>${f(m.sideOffenses)}</strong><span>Side offenses</span></div>
                      </div>`:""}
                <div class="challenge-leader-grid">
                  ${(n.leaders??[]).map(l=>`
                        <article class="challenge-leader-card">
                          <p class="section-title">Leader ${i(l.slotNumber)}</p>
                          <h3>${i(l.leaderName)}</h3>
                          <p>${i(l.bossType||"Unknown")} | weak to ${i(l.weaknessType||"Unknown")}</p>
                          <p class="challenge-effect">${i(X(l,n,a.selectedChallengeRound)||"No effect configured")}</p>
                        </article>`).join("")}
                </div>
              </section>`:""}

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
                                      <p>${i(v[$(p)]||p.acquisition)}</p>
                                      <p>EX Role: ${i(p.exRoleLabel||"None")}</p>
                                    </div>
                                  </article>`).join("")}
                            </div>
                          </section>`).join(""):'<div class="empty-state">No members match the current type coverage filters.</div>'}
              </div>`:`<div id="syncPairs">
                ${o.length?o.map(l=>`
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
                              <p>${i(v[$(l)]||l.acquisition)}</p>
                              <p>EX Role: ${i(l.exRoleLabel||"None")}</p>
                            </div>
                          </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
              </div>`}
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(N=e.querySelector('[data-role="member-select"]'))==null||N.addEventListener("change",l=>{a.selectedMemberId=l.target.value,g()}),(F=e.querySelector('[data-role="query-input"]'))==null||F.addEventListener("input",l=>{a.query=l.target.value,g()}),(E=e.querySelector('[data-role="type-select"]'))==null||E.addEventListener("change",l=>{a.typeFilter=l.target.value,g()}),e.querySelectorAll('[data-role="acquisition-checkbox"]').forEach(l=>{l.addEventListener("change",()=>{U(l.value)})}),(x=e.querySelector('[data-role="role-select"]'))==null||x.addEventListener("change",l=>{a.roleFilter=l.target.value,g()}),(k=e.querySelector('[data-role="sort-select"]'))==null||k.addEventListener("change",l=>{a.sortKey=l.target.value,g()}),(R=e.querySelector('[data-role="challenge-only"]'))==null||R.addEventListener("change",l=>{a.challengeOnly=l.target.checked,g()}),(_=e.querySelector('[data-role="challenge-round"]'))==null||_.addEventListener("input",l=>{a.selectedChallengeRound=Number(l.target.value)||4,g()}),(T=e.querySelector('[data-role="open-challenge-modal"]'))==null||T.addEventListener("click",()=>{D()}),e.querySelectorAll("[data-member-id]").forEach(l=>{l.addEventListener("click",()=>{a.selectedMemberId=l.dataset.memberId??"all",g()})}),S();const L=e.querySelector("#leftSide");if(L&&(L.scrollTop=j),C&&(u instanceof HTMLInputElement&&u.type!=="checkbox"||u instanceof HTMLSelectElement)){const l=e.querySelector(`[data-role="${C}"]${P?`[value="${CSS.escape(P)}"]`:""}`);(l instanceof HTMLInputElement||l instanceof HTMLSelectElement)&&(l.focus(),l instanceof HTMLInputElement&&I!==null&&w!==null&&l.setSelectionRange(I,w))}}async function Y(){const e=await fetch("./data/rosters.json");a.snapshot=await e.json(),a.challengePairs=V(a.snapshot),g()}Y().catch(e=>{const t=document.querySelector("#app");t&&(t.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${i(e.message)}</section></main>`)});
