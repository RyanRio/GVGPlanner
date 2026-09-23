(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))c(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&c(s)}).observe(document,{childList:!0,subtree:!0});function i(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function c(n){if(n.ep)return;n.ep=!0;const r=i(n);fetch(n.href,r)}})();function y(e){const a=String(e.rawValue??"").split("|")[0];return/^[0-9]$/.test(a)?Number(a)+1:e.syncLevel}const v={arc_suit_fair:"Arc Suit Fair",ex_master_fair:"EX Master Fair",master_fair:"Master Fair",ex_fair:"EX Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",special_costume:"Special Costume",variety:"Variety",spotlight:"Spotlight",trainer_lodge:"Trainer Lodge",battle_points:"Battle Points",ticket_exchange:"Ticket Exchange",gym_scout:"Gym Scout",event_reward:"Event Reward",main_story:"Main Story",legendary_adventures:"Legendary Adventures",general_pool:"General Pool"},l={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",acquisitionFilters:[],roleFilter:"all",challengeOnly:!1,superawakenedOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:"",selectedChallengeRound:4};function o(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function K(e){const a=(e==null?void 0:e.acquisition)??"";return a?a.includes("Arc Suit Fair")?"arc_suit_fair":a.includes("EX Master Fair")?"ex_master_fair":a.includes("Master Fair")?"master_fair":a.includes("EX Fair")?"ex_fair":a.includes("Poké Fair")||a.includes("Poke Fair")?"poke_fair":a.includes("Seasonal")?"seasonal":a.includes("Special Costume")?"special_costume":a.includes("Variety")?"variety":a.includes("Spotlight")?"spotlight":a.includes("Trainer Lodge")?"trainer_lodge":a.includes("Battle Points")?"battle_points":a.includes("Training Ticket")?"ticket_exchange":a.includes("Gym Scout")?"gym_scout":a.includes("Event Reward")?"event_reward":a.includes("Legendary Adventures")?"legendary_adventures":a.includes("Main Story")?"main_story":"general_pool":"general_pool"}function $(e){return(e==null?void 0:e.acquisitionCategory)||K(e)}function A(e,a,i){const c=!l.query||`${e.label} ${a} ${e.type} ${e.roleLabel} ${e.trainerName} ${e.pokemonName}`.toLowerCase().includes(l.query.toLowerCase()),n=l.typeFilter==="all"||e.type===l.typeFilter,r=l.acquisitionFilters.length===0||l.acquisitionFilters.includes($(e)),s=l.roleFilter==="all"||e.roleCategory===l.roleFilter,d=!l.challengeOnly||i.has(e.pairId),g=!l.superawakenedOnly||y(e)>5;return c&&n&&r&&s&&d&&g}function V(e){const a=l.acquisitionFilters.includes(e);l.acquisitionFilters=a?l.acquisitionFilters.filter(i=>i!==e):[...l.acquisitionFilters,e],m()}function B(e){var c,n;const a=new Set(((c=e.currentChallenge)==null?void 0:c.significantPairIds)??[]);return(l.selectedMemberId==="all"?e.members.flatMap(r=>r.pairs.map(s=>({...s,ownerName:r.displayName}))):(((n=e.members.find(r=>r.id===l.selectedMemberId))==null?void 0:n.pairs)??[]).map(r=>{var s;return{...r,ownerName:((s=e.members.find(d=>d.id===l.selectedMemberId))==null?void 0:s.displayName)??""}})).filter(r=>A(r,r.ownerName,a)).sort((r,s)=>{if(l.sortKey==="owner"){const d=r.ownerName.localeCompare(s.ownerName);return d!==0?d:r.label.localeCompare(s.label)}if(l.sortKey==="type"){const d=(r.type||"").localeCompare(s.type||"");return d!==0?d:r.label.localeCompare(s.label)}if(l.sortKey==="premium"){const d=(v[r.acquisitionCategory]||r.acquisitionCategory).localeCompare(v[s.acquisitionCategory]||s.acquisitionCategory);return d!==0?d:r.label.localeCompare(s.label)}return r.label.localeCompare(s.label)})}function X(e){var i;const a=new Set(((i=e.currentChallenge)==null?void 0:i.significantPairIds)??[]);return e.members.map(c=>{const n=c.pairs.filter(r=>A(r,c.displayName,a)).sort((r,s)=>r.label.localeCompare(s.label));return{memberId:c.id,memberName:c.displayName,pairCount:n.length,pairs:n}}).filter(c=>c.pairCount>0).sort((c,n)=>n.pairCount!==c.pairCount?n.pairCount-c.pairCount:c.memberName.localeCompare(n.memberName))}function G(e){var c;const a=((c=e.currentChallenge)==null?void 0:c.significantPairs)??[],i=new Map;return a.forEach(n=>{const r=i.get(n.pairId);if(!r){i.set(n.pairId,{pairId:n.pairId,label:n.label,categories:new Set(n.category?[n.category]:[]),leaders:new Set(n.leaderName?[n.leaderName]:[])});return}n.category&&r.categories.add(n.category),n.leaderName&&r.leaders.add(n.leaderName)}),Array.from(i.values()).map(n=>({pairId:n.pairId,label:n.label,categories:Array.from(n.categories).sort(),leaders:Array.from(n.leaders).sort()})).sort((n,r)=>n.label.localeCompare(r.label))}function Q(e,a,i){if(!e||!a)return"";if(i===1)return e.battle1Effect||"";if(i===2)return e.battle2Effect||"";if(i===3)return e.battle3Effect||"";const c=["modifier1","modifier2","modifier3"].map(s=>{var d;return((d=a.modifiers)==null?void 0:d[s])||""}).filter(Boolean);if(c.length<3)return"";const r=((i-4)%3+e.slotNumber-1)%3;return c[r]||""}function z(e,a){const i=(e==null?void 0:e.roundStats)??[],c=i.find(r=>r.roundNumber===a);return c||i.filter(r=>r.roundNumber<=a).sort((r,s)=>s.roundNumber-r.roundNumber)[0]||i[i.length-1]||null}function f(e){return Number(e||0).toLocaleString()}function j(e){if(!e)return"";const a=z(e,l.selectedChallengeRound);return`<section class="challenge-overview-panel">
      <div class="challenge-overview-header">
        <div>
          <p class="eyebrow">Current challenge</p>
          <h2>${o(e.name)}</h2>
          <p class="challenge-note">${o(e.notes||"No challenge notes.")}</p>
        </div>
        <div class="challenge-round-picker">
          <label>
            <span>Round</span>
            <select data-role="challenge-round-select">
              ${Array.from({length:30},(i,c)=>c+1).map(i=>`<option value="${i}"${i===l.selectedChallengeRound?" selected":""}>Round ${i}</option>`).join("")}
            </select>
          </label>
        </div>
      </div>
      ${a?`<div class="challenge-stats-grid">
              <div><strong>${f(a.points)}</strong><span>Round points</span></div>
              <div><strong>${f(a.cumulativePoints)}</strong><span>Total points</span></div>
              <div><strong>${f(a.middleHp)}</strong><span>Middle HP</span></div>
              <div><strong>${f(a.sideHp)}</strong><span>Side HP</span></div>
              <div><strong>${f(a.middleOffenses)}</strong><span>Middle offenses</span></div>
              <div><strong>${f(a.sideOffenses)}</strong><span>Side offenses</span></div>
            </div>`:""}
      <div class="challenge-leader-grid">
        ${(e.leaders??[]).map(i=>`
              <article class="challenge-leader-card">
                <p class="section-title">Leader ${o(i.slotNumber)}</p>
                <h3>${o(i.leaderName)}</h3>
                <p>${o(i.bossType||"Unknown")} | weak to ${o(i.weaknessType||"Unknown")}</p>
                <p class="challenge-effect">${o(Q(i,e,l.selectedChallengeRound)||"No effect configured")}</p>
              </article>`).join("")}
      </div>
    </section>`}function D(e,a){var i;!e||!a||(i=e.querySelector('[data-role="challenge-round-select"]'))==null||i.addEventListener("change",c=>{l.selectedChallengeRound=Number(c.target.value)||4,H()})}function H(){var i;const e=(i=l.snapshot)==null?void 0:i.currentChallenge,a=document.querySelector("#challengeOverviewRoot");!a||!e||(a.innerHTML=j(e),D(a,e))}function J(e){const a=[`${y(e)}/5`],i=String(e.rawValue??"").split("|"),c=Number.parseInt(i[4]??"0",10)>0,n={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return e.isEx&&a.push("EX"),c&&e.exRoleLabel&&a.push(n[e.exRoleLabel]??e.exRoleLabel.toUpperCase()),a.join(" | ")}function W(e){const a=l.selectedChallengePairIds.includes(e);l.selectedChallengePairIds=a?l.selectedChallengePairIds.filter(i=>i!==e):[...l.selectedChallengePairIds,e],S()}function Y(e){l.challengeModalOpen=!0,l.challengePairQuery="",l.selectedChallengePairIds.length||(l.selectedChallengePairIds=l.challengePairs.slice(0,6).map(a=>a.pairId)),m()}function T(){l.challengeModalOpen=!1,m()}function Z(){const e=l.snapshot,a=e==null?void 0:e.currentChallenge;if(!l.challengeModalOpen||!e||!a)return"";const i=l.challengePairQuery.trim().toLowerCase(),c=i?l.challengePairs.filter(s=>`${s.label} ${s.categories.join(" ")} ${s.leaders.join(" ")}`.toLowerCase().includes(i)):l.challengePairs,n=l.challengePairs.filter(s=>l.selectedChallengePairIds.includes(s.pairId)),r=l.selectedChallengePairIds.length?e.members.map(s=>{const d=n.map(g=>{const h=s.pairs.find(u=>u.pairId===g.pairId);return h?{pairId:g.pairId,label:g.label,investment:J({syncLevel:h.syncLevel,isEx:h.isEx,rawValue:h.rawValue,exRoleLabel:h.exRoleLabel})}:null}).filter(Boolean);return{memberId:s.id,memberName:s.displayName,ownedPairs:d}}).filter(s=>s.ownedPairs.length===l.selectedChallengePairIds.length).sort((s,d)=>s.memberName.localeCompare(d.memberName)):[];return`
    <div class="modal-backdrop" data-role="modal-backdrop">
      <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
        <div class="challenge-modal-header">
          <div>
            <p class="eyebrow">Current challenge modal</p>
            <h2>${o(a.name)}</h2>
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
              value="${o(l.challengePairQuery)}"
              placeholder="Search pair, category, or leader..."
            />
          </label>
          <div class="challenge-pair-list">
            ${c.map(s=>`
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${o(s.pairId)}"
                    ${l.selectedChallengePairIds.includes(s.pairId)?"checked":""}
                  />
                  <div>
                    <strong>${o(s.label)}</strong>
                    <p>${o(s.categories.join(", ")||"challenge")} ${s.leaders.length?`| ${o(s.leaders.join(", "))}`:""}</p>
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
                            <strong>${o(s.memberName)}</strong>
                            <p>Owns all ${n.length} selected pair${n.length===1?"":"s"}</p>
                          </div>
                        </div>
                        <div class="owner-list">
                          ${s.ownedPairs.map(d=>`
                              <div class="owner-row">
                                <strong>${o(d.label)}</strong>
                                <span>${o(d.investment)}</span>
                              </div>`).join("")}
                        </div>
                      </article>`).join(""):'<div class="empty-state modal-empty">No imported members own all selected pairs.</div>':'<div class="empty-state modal-empty">Select one or more challenge pairs to see matching members.</div>'}
        </section>
      </section>
    </div>`}function ee(e){var a,i,c;(a=e.querySelector('[data-role="challenge-pair-query"]'))==null||a.addEventListener("input",n=>{l.challengePairQuery=n.target.value,S()}),(i=e.querySelector('[data-role="close-challenge-modal"]'))==null||i.addEventListener("click",()=>{T()}),(c=e.querySelector('[data-role="modal-backdrop"]'))==null||c.addEventListener("click",n=>{var r,s;((s=(r=n.target)==null?void 0:r.dataset)==null?void 0:s.role)==="modal-backdrop"&&T()}),e.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(n=>{n.addEventListener("change",()=>{W(n.value)})})}function S(){var s;const e=document.querySelector("#modalRoot");if(!e)return;const a=document.activeElement,i=((s=a==null?void 0:a.dataset)==null?void 0:s.role)??"",c=(a==null?void 0:a.value)??"",n=typeof(a==null?void 0:a.selectionStart)=="number"?a.selectionStart:null,r=typeof(a==null?void 0:a.selectionEnd)=="number"?a.selectionEnd:null;if(e.innerHTML=Z(),ee(e),i&&a instanceof HTMLInputElement&&a.type!=="checkbox"){const d=e.querySelector(`[data-role="${i}"]${c?`[value="${CSS.escape(c)}"]`:""}`);d instanceof HTMLInputElement&&(d.focus(),n!==null&&r!==null&&d.setSelectionRange(n,r))}}function m(){var q,k,M,N,F,E,x,R,O,_;const e=document.querySelector("#app");if(!e)return;if(!l.snapshot){e.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const a=l.snapshot,i=B(a),c=a.members,n=Array.from(new Set(a.members.flatMap(t=>t.pairs.map(p=>p.type)).filter(Boolean))).sort(),r=Array.from(new Set(a.members.flatMap(t=>t.pairs.map(p=>p.roleCategory)).filter(Boolean))).sort(),s=a.currentChallenge,d=X(a),g=l.selectedMemberId==="all"&&l.typeFilter!=="all",h=l.selectedMemberId==="all"?`${a.gymName} gym`:((q=c.find(t=>t.id===l.selectedMemberId))==null?void 0:q.displayName)??"Unknown member",u=document.activeElement,w=((k=u==null?void 0:u.dataset)==null?void 0:k.role)??"",C=(u==null?void 0:u.value)??"",P=typeof(u==null?void 0:u.selectionStart)=="number"?u.selectionStart:null,I=typeof(u==null?void 0:u.selectionEnd)=="number"?u.selectionEnd:null,b=document.querySelector("#leftSide"),U=(b==null?void 0:b.scrollTop)??0;e.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${o(a.gymName)}.</p>
          ${s?`<p class="challenge-note">Current challenge: <strong>${o(s.name)}</strong> (${s.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${a.memberCount}</strong><span>Members</span></div>
          <div><strong>${a.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${i.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${l.selectedMemberId==="all"?" selected":""}>All members</option>
              ${c.map(t=>`<option value="${o(t.id)}"${t.id===l.selectedMemberId?" selected":""}>${o(t.displayName)} (${t.pairCount})</option>`).join("")}
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
              ${n.map(t=>`<option value="${o(t)}"${t===l.typeFilter?" selected":""}>${o(t)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${l.roleFilter==="all"?" selected":""}>All roles</option>
              ${r.map(t=>`<option value="${o(t)}"${t===l.roleFilter?" selected":""}>${o(t)}</option>`).join("")}
            </select>
          </label>
          <div class="premium-filter-block">
            <span>Acquisition</span>
            <div class="premium-filter-list">
              ${Object.entries(v).map(([t,p])=>`
                    <label class="premium-filter-row${l.acquisitionFilters.includes(t)?" active":""}">
                      <input
                        data-role="acquisition-checkbox"
                        type="checkbox"
                        value="${o(t)}"
                        ${l.acquisitionFilters.includes(t)?"checked":""}
                      />
                      <span class="premium-filter-name">${o(p)}</span>
                      <span class="premium-filter-state">${l.acquisitionFilters.includes(t)?"On":"Off"}</span>
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
            <input data-role="superawakened-only" type="checkbox"${l.superawakenedOnly?" checked":""} />
            <span>Only superawakened pairs (6/5–10/5)</span>
          </label>
          <label class="checkbox-row">
            <input data-role="challenge-only" type="checkbox"${l.challengeOnly?" checked":""}${s?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${c.map(t=>`
                <button class="member-item${t.id===l.selectedMemberId?" active":""}" data-member-id="${o(t.id)}" type="button">
                  <strong>${o(t.displayName)}</strong>
                  <span>${t.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${o(h)}</p>
            <p>${g?`${d.length} member section${d.length===1?"":"s"}`:`${i.length} result${i.length===1?"":"s"}`}</p>
          </div>
          <div id="filtersUsed">
            ${l.query?`<span>${o(l.query)}</span>`:""}
            ${l.typeFilter!=="all"?`<span>${o(l.typeFilter)}</span>`:""}
            ${l.roleFilter!=="all"?`<span>${o(l.roleFilter)}</span>`:""}
            ${l.acquisitionFilters.map(t=>`<span>${o(v[t])}</span>`).join("")}
            ${l.challengeOnly?`<span>${o((s==null?void 0:s.name)??"Current challenge")}</span>`:""}
            ${l.superawakenedOnly?"<span>Superawakened</span>":""}
          </div>
          <span class="timestamp">Snapshot ${a.generatedAt?new Date(a.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        ${s?`<div id="challengeOverviewRoot">${j(s)}</div>`:""}

        ${g?`<div id="memberCoverageSections">
                ${d.length?d.map(t=>`
                          <section class="member-coverage-section">
                            <div class="member-coverage-header">
                              <div>
                                <h3>${o(t.memberName)}</h3>
                                <p>${t.pairCount} ${o(l.typeFilter)} pair${t.pairCount===1?"":"s"}</p>
                              </div>
                            </div>
                            <div class="member-coverage-grid">
                              ${t.pairs.map(p=>`
                                  <article class="syncPair selected">
                                    <div class="syncImageFrame">
                                      ${p.isEx&&p.exImagePath||p.primaryImagePath?`<img class="syncImage" src="${o(p.isEx&&p.exImagePath||p.primaryImagePath)}" alt="${o(p.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${o((p.trainerName||p.label).slice(0,2).toUpperCase())}</div>`}
                                    </div>
                                    ${p.isEx&&!p.exImagePath?'<div class="syncFav">EX</div>':""}
                                    <div class="syncLevelBadge">${o(y(p))}</div>
                                    <div class="syncInfos">
                                      <p class="infoName">${o(p.label)}</p>
                                      <p>${o(t.memberName)}</p>
                                      <p>${o(p.type||"Unknown")} | ${o(p.roleLabel||"Unknown")}</p>
                                      <p>${o(v[$(p)]||p.acquisition)}</p>
                                      <p>EX Role: ${o(p.exRoleLabel||"None")}</p>
                                    </div>
                                  </article>`).join("")}
                            </div>
                          </section>`).join(""):'<div class="empty-state">No members match the current type coverage filters.</div>'}
              </div>`:`<div id="syncPairs">
                ${i.length?i.map(t=>`
                          <article class="syncPair selected">
                            <div class="syncImageFrame">
                              ${t.isEx&&t.exImagePath||t.primaryImagePath?`<img class="syncImage" src="${o(t.isEx&&t.exImagePath||t.primaryImagePath)}" alt="${o(t.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${o((t.trainerName||t.label).slice(0,2).toUpperCase())}</div>`}
                            </div>
                            ${t.isEx&&!t.exImagePath?'<div class="syncFav">EX</div>':""}
                            <div class="syncLevelBadge">${o(y(t))}</div>
                            <div class="syncInfos">
                              <p class="infoName">${o(t.label)}</p>
                              <p>${o(t.ownerName)}</p>
                              <p>${o(t.type||"Unknown")} | ${o(t.roleLabel||"Unknown")}</p>
                              <p>${o(v[$(t)]||t.acquisition)}</p>
                              <p>EX Role: ${o(t.exRoleLabel||"None")}</p>
                            </div>
                          </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
              </div>`}
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(M=e.querySelector('[data-role="member-select"]'))==null||M.addEventListener("change",t=>{l.selectedMemberId=t.target.value,m()}),(N=e.querySelector('[data-role="query-input"]'))==null||N.addEventListener("input",t=>{l.query=t.target.value,m()}),(F=e.querySelector('[data-role="type-select"]'))==null||F.addEventListener("change",t=>{l.typeFilter=t.target.value,m()}),e.querySelectorAll('[data-role="acquisition-checkbox"]').forEach(t=>{t.addEventListener("change",()=>{V(t.value)})}),(E=e.querySelector('[data-role="role-select"]'))==null||E.addEventListener("change",t=>{l.roleFilter=t.target.value,m()}),(x=e.querySelector('[data-role="sort-select"]'))==null||x.addEventListener("change",t=>{l.sortKey=t.target.value,m()}),(R=e.querySelector('[data-role="challenge-only"]'))==null||R.addEventListener("change",t=>{l.challengeOnly=t.target.checked,m()}),(O=e.querySelector('[data-role="superawakened-only"]'))==null||O.addEventListener("change",t=>{l.superawakenedOnly=t.target.checked,m()}),(_=e.querySelector('[data-role="open-challenge-modal"]'))==null||_.addEventListener("click",()=>{Y()}),e.querySelectorAll("[data-member-id]").forEach(t=>{t.addEventListener("click",()=>{l.selectedMemberId=t.dataset.memberId??"all",m()})}),S(),H();const L=e.querySelector("#leftSide");if(L&&(L.scrollTop=U),w&&(u instanceof HTMLInputElement&&u.type!=="checkbox"||u instanceof HTMLSelectElement)){const t=e.querySelector(`[data-role="${w}"]${C?`[value="${CSS.escape(C)}"]`:""}`);(t instanceof HTMLInputElement||t instanceof HTMLSelectElement)&&(t.focus(),t instanceof HTMLInputElement&&P!==null&&I!==null&&t.setSelectionRange(P,I))}}async function ae(){const e=await fetch("./data/rosters.json");l.snapshot=await e.json(),l.challengePairs=G(l.snapshot),m()}ae().catch(e=>{const a=document.querySelector("#app");a&&(a.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${o(e.message)}</section></main>`)});
