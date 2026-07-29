(function(){const l=document.createElement("link").relList;if(l&&l.supports&&l.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))c(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&c(s)}).observe(document,{childList:!0,subtree:!0});function i(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function c(n){if(n.ep)return;n.ep=!0;const r=i(n);fetch(n.href,r)}})();const v={arc_suit_fair:"Arc Suit Fair",ex_master_fair:"EX Master Fair",master_fair:"Master Fair",ex_fair:"EX Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",special_costume:"Special Costume",variety:"Variety",spotlight:"Spotlight",trainer_lodge:"Trainer Lodge",battle_points:"Battle Points",ticket_exchange:"Ticket Exchange",gym_scout:"Gym Scout",event_reward:"Event Reward",main_story:"Main Story",legendary_adventures:"Legendary Adventures",general_pool:"General Pool"},a={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",acquisitionFilters:[],roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:"",selectedChallengeRound:4};function o(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function H(e){const l=(e==null?void 0:e.acquisition)??"";return l?l.includes("Arc Suit Fair")?"arc_suit_fair":l.includes("EX Master Fair")?"ex_master_fair":l.includes("Master Fair")?"master_fair":l.includes("EX Fair")?"ex_fair":l.includes("Poké Fair")||l.includes("Poke Fair")?"poke_fair":l.includes("Seasonal")?"seasonal":l.includes("Special Costume")?"special_costume":l.includes("Variety")?"variety":l.includes("Spotlight")?"spotlight":l.includes("Trainer Lodge")?"trainer_lodge":l.includes("Battle Points")?"battle_points":l.includes("Training Ticket")?"ticket_exchange":l.includes("Gym Scout")?"gym_scout":l.includes("Event Reward")?"event_reward":l.includes("Legendary Adventures")?"legendary_adventures":l.includes("Main Story")?"main_story":"general_pool":"general_pool"}function b(e){return(e==null?void 0:e.acquisitionCategory)||H(e)}function T(e,l,i){const c=!a.query||`${e.label} ${l} ${e.type} ${e.roleLabel} ${e.trainerName} ${e.pokemonName}`.toLowerCase().includes(a.query.toLowerCase()),n=a.typeFilter==="all"||e.type===a.typeFilter,r=a.acquisitionFilters.length===0||a.acquisitionFilters.includes(b(e)),s=a.roleFilter==="all"||e.roleCategory===a.roleFilter,d=!a.challengeOnly||i.has(e.pairId);return c&&n&&r&&s&&d}function U(e){const l=a.acquisitionFilters.includes(e);a.acquisitionFilters=l?a.acquisitionFilters.filter(i=>i!==e):[...a.acquisitionFilters,e],m()}function K(e){var c,n;const l=new Set(((c=e.currentChallenge)==null?void 0:c.significantPairIds)??[]);return(a.selectedMemberId==="all"?e.members.flatMap(r=>r.pairs.map(s=>({...s,ownerName:r.displayName}))):(((n=e.members.find(r=>r.id===a.selectedMemberId))==null?void 0:n.pairs)??[]).map(r=>{var s;return{...r,ownerName:((s=e.members.find(d=>d.id===a.selectedMemberId))==null?void 0:s.displayName)??""}})).filter(r=>T(r,r.ownerName,l)).sort((r,s)=>{if(a.sortKey==="owner"){const d=r.ownerName.localeCompare(s.ownerName);return d!==0?d:r.label.localeCompare(s.label)}if(a.sortKey==="type"){const d=(r.type||"").localeCompare(s.type||"");return d!==0?d:r.label.localeCompare(s.label)}if(a.sortKey==="premium"){const d=(v[r.acquisitionCategory]||r.acquisitionCategory).localeCompare(v[s.acquisitionCategory]||s.acquisitionCategory);return d!==0?d:r.label.localeCompare(s.label)}return r.label.localeCompare(s.label)})}function B(e){var i;const l=new Set(((i=e.currentChallenge)==null?void 0:i.significantPairIds)??[]);return e.members.map(c=>{const n=c.pairs.filter(r=>T(r,c.displayName,l)).sort((r,s)=>r.label.localeCompare(s.label));return{memberId:c.id,memberName:c.displayName,pairCount:n.length,pairs:n}}).filter(c=>c.pairCount>0).sort((c,n)=>n.pairCount!==c.pairCount?n.pairCount-c.pairCount:c.memberName.localeCompare(n.memberName))}function V(e){var c;const l=((c=e.currentChallenge)==null?void 0:c.significantPairs)??[],i=new Map;return l.forEach(n=>{const r=i.get(n.pairId);if(!r){i.set(n.pairId,{pairId:n.pairId,label:n.label,categories:new Set(n.category?[n.category]:[]),leaders:new Set(n.leaderName?[n.leaderName]:[])});return}n.category&&r.categories.add(n.category),n.leaderName&&r.leaders.add(n.leaderName)}),Array.from(i.values()).map(n=>({pairId:n.pairId,label:n.label,categories:Array.from(n.categories).sort(),leaders:Array.from(n.leaders).sort()})).sort((n,r)=>n.label.localeCompare(r.label))}function X(e,l,i){if(!e||!l)return"";if(i===1)return e.battle1Effect||"";if(i===2)return e.battle2Effect||"";if(i===3)return e.battle3Effect||"";const c=["modifier1","modifier2","modifier3"].map(s=>{var d;return((d=l.modifiers)==null?void 0:d[s])||""}).filter(Boolean);if(c.length<3)return"";const r=((i-4)%3+e.slotNumber-1)%3;return c[r]||""}function G(e,l){const i=(e==null?void 0:e.roundStats)??[],c=i.find(r=>r.roundNumber===l);return c||i.filter(r=>r.roundNumber<=l).sort((r,s)=>s.roundNumber-r.roundNumber)[0]||i[i.length-1]||null}function f(e){return Number(e||0).toLocaleString()}function A(e){if(!e)return"";const l=G(e,a.selectedChallengeRound);return`<section class="challenge-overview-panel">
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
              ${Array.from({length:30},(i,c)=>c+1).map(i=>`<option value="${i}"${i===a.selectedChallengeRound?" selected":""}>Round ${i}</option>`).join("")}
            </select>
          </label>
        </div>
      </div>
      ${l?`<div class="challenge-stats-grid">
              <div><strong>${f(l.points)}</strong><span>Round points</span></div>
              <div><strong>${f(l.cumulativePoints)}</strong><span>Total points</span></div>
              <div><strong>${f(l.middleHp)}</strong><span>Middle HP</span></div>
              <div><strong>${f(l.sideHp)}</strong><span>Side HP</span></div>
              <div><strong>${f(l.middleOffenses)}</strong><span>Middle offenses</span></div>
              <div><strong>${f(l.sideOffenses)}</strong><span>Side offenses</span></div>
            </div>`:""}
      <div class="challenge-leader-grid">
        ${(e.leaders??[]).map(i=>`
              <article class="challenge-leader-card">
                <p class="section-title">Leader ${o(i.slotNumber)}</p>
                <h3>${o(i.leaderName)}</h3>
                <p>${o(i.bossType||"Unknown")} | weak to ${o(i.weaknessType||"Unknown")}</p>
                <p class="challenge-effect">${o(X(i,e,a.selectedChallengeRound)||"No effect configured")}</p>
              </article>`).join("")}
      </div>
    </section>`}function Q(e,l){var i;!e||!l||(i=e.querySelector('[data-role="challenge-round-select"]'))==null||i.addEventListener("change",c=>{a.selectedChallengeRound=Number(c.target.value)||4,O()})}function O(){var i;const e=(i=a.snapshot)==null?void 0:i.currentChallenge,l=document.querySelector("#challengeOverviewRoot");!l||!e||(l.innerHTML=A(e),Q(l,e))}function z(e){const l=[`${e.syncLevel}/5`],i=String(e.rawValue??"").split("|"),c=Number.parseInt(i[4]??"0",10)>0,n={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return e.isEx&&l.push("EX"),c&&e.exRoleLabel&&l.push(n[e.exRoleLabel]??e.exRoleLabel.toUpperCase()),l.join(" | ")}function D(e){const l=a.selectedChallengePairIds.includes(e);a.selectedChallengePairIds=l?a.selectedChallengePairIds.filter(i=>i!==e):[...a.selectedChallengePairIds,e],$()}function J(e){a.challengeModalOpen=!0,a.challengePairQuery="",a.selectedChallengePairIds.length||(a.selectedChallengePairIds=a.challengePairs.slice(0,6).map(l=>l.pairId)),m()}function _(){a.challengeModalOpen=!1,m()}function W(){const e=a.snapshot,l=e==null?void 0:e.currentChallenge;if(!a.challengeModalOpen||!e||!l)return"";const i=a.challengePairQuery.trim().toLowerCase(),c=i?a.challengePairs.filter(s=>`${s.label} ${s.categories.join(" ")} ${s.leaders.join(" ")}`.toLowerCase().includes(i)):a.challengePairs,n=a.challengePairs.filter(s=>a.selectedChallengePairIds.includes(s.pairId)),r=a.selectedChallengePairIds.length?e.members.map(s=>{const d=n.map(h=>{const g=s.pairs.find(u=>u.pairId===h.pairId);return g?{pairId:h.pairId,label:h.label,investment:z({syncLevel:g.syncLevel,isEx:g.isEx,rawValue:g.rawValue,exRoleLabel:g.exRoleLabel})}:null}).filter(Boolean);return{memberId:s.id,memberName:s.displayName,ownedPairs:d}}).filter(s=>s.ownedPairs.length===a.selectedChallengePairIds.length).sort((s,d)=>s.memberName.localeCompare(d.memberName)):[];return`
    <div class="modal-backdrop" data-role="modal-backdrop">
      <section class="challenge-modal" aria-modal="true" role="dialog" aria-label="Challenge pair lookup">
        <div class="challenge-modal-header">
          <div>
            <p class="eyebrow">Current challenge modal</p>
            <h2>${o(l.name)}</h2>
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
              value="${o(a.challengePairQuery)}"
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
                    ${a.selectedChallengePairIds.includes(s.pairId)?"checked":""}
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
    </div>`}function Y(e){var l,i,c;(l=e.querySelector('[data-role="challenge-pair-query"]'))==null||l.addEventListener("input",n=>{a.challengePairQuery=n.target.value,$()}),(i=e.querySelector('[data-role="close-challenge-modal"]'))==null||i.addEventListener("click",()=>{_()}),(c=e.querySelector('[data-role="modal-backdrop"]'))==null||c.addEventListener("click",n=>{var r,s;((s=(r=n.target)==null?void 0:r.dataset)==null?void 0:s.role)==="modal-backdrop"&&_()}),e.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(n=>{n.addEventListener("change",()=>{D(n.value)})})}function $(){var s;const e=document.querySelector("#modalRoot");if(!e)return;const l=document.activeElement,i=((s=l==null?void 0:l.dataset)==null?void 0:s.role)??"",c=(l==null?void 0:l.value)??"",n=typeof(l==null?void 0:l.selectionStart)=="number"?l.selectionStart:null,r=typeof(l==null?void 0:l.selectionEnd)=="number"?l.selectionEnd:null;if(e.innerHTML=W(),Y(e),i&&l instanceof HTMLInputElement&&l.type!=="checkbox"){const d=e.querySelector(`[data-role="${i}"]${c?`[value="${CSS.escape(c)}"]`:""}`);d instanceof HTMLInputElement&&(d.focus(),n!==null&&r!==null&&d.setSelectionRange(n,r))}}function m(){var L,q,M,N,F,E,k,x,R;const e=document.querySelector("#app");if(!e)return;if(!a.snapshot){e.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const l=a.snapshot,i=K(l),c=l.members,n=Array.from(new Set(l.members.flatMap(t=>t.pairs.map(p=>p.type)).filter(Boolean))).sort(),r=Array.from(new Set(l.members.flatMap(t=>t.pairs.map(p=>p.roleCategory)).filter(Boolean))).sort(),s=l.currentChallenge,d=B(l),h=a.selectedMemberId==="all"&&a.typeFilter!=="all",g=a.selectedMemberId==="all"?`${l.gymName} gym`:((L=c.find(t=>t.id===a.selectedMemberId))==null?void 0:L.displayName)??"Unknown member",u=document.activeElement,S=((q=u==null?void 0:u.dataset)==null?void 0:q.role)??"",C=(u==null?void 0:u.value)??"",w=typeof(u==null?void 0:u.selectionStart)=="number"?u.selectionStart:null,P=typeof(u==null?void 0:u.selectionEnd)=="number"?u.selectionEnd:null,y=document.querySelector("#leftSide"),j=(y==null?void 0:y.scrollTop)??0;e.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${o(l.gymName)}.</p>
          ${s?`<p class="challenge-note">Current challenge: <strong>${o(s.name)}</strong> (${s.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${l.memberCount}</strong><span>Members</span></div>
          <div><strong>${l.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${i.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${a.selectedMemberId==="all"?" selected":""}>All members</option>
              ${c.map(t=>`<option value="${o(t.id)}"${t.id===a.selectedMemberId?" selected":""}>${o(t.displayName)} (${t.pairCount})</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${o(a.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${a.typeFilter==="all"?" selected":""}>All types</option>
              ${n.map(t=>`<option value="${o(t)}"${t===a.typeFilter?" selected":""}>${o(t)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${a.roleFilter==="all"?" selected":""}>All roles</option>
              ${r.map(t=>`<option value="${o(t)}"${t===a.roleFilter?" selected":""}>${o(t)}</option>`).join("")}
            </select>
          </label>
          <div class="premium-filter-block">
            <span>Acquisition</span>
            <div class="premium-filter-list">
              ${Object.entries(v).map(([t,p])=>`
                    <label class="premium-filter-row${a.acquisitionFilters.includes(t)?" active":""}">
                      <input
                        data-role="acquisition-checkbox"
                        type="checkbox"
                        value="${o(t)}"
                        ${a.acquisitionFilters.includes(t)?"checked":""}
                      />
                      <span class="premium-filter-name">${o(p)}</span>
                      <span class="premium-filter-state">${a.acquisitionFilters.includes(t)?"On":"Off"}</span>
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
            ${c.map(t=>`
                <button class="member-item${t.id===a.selectedMemberId?" active":""}" data-member-id="${o(t.id)}" type="button">
                  <strong>${o(t.displayName)}</strong>
                  <span>${t.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${o(g)}</p>
            <p>${h?`${d.length} member section${d.length===1?"":"s"}`:`${i.length} result${i.length===1?"":"s"}`}</p>
          </div>
          <div id="filtersUsed">
            ${a.query?`<span>${o(a.query)}</span>`:""}
            ${a.typeFilter!=="all"?`<span>${o(a.typeFilter)}</span>`:""}
            ${a.roleFilter!=="all"?`<span>${o(a.roleFilter)}</span>`:""}
            ${a.acquisitionFilters.map(t=>`<span>${o(v[t])}</span>`).join("")}
            ${a.challengeOnly?`<span>${o((s==null?void 0:s.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${l.generatedAt?new Date(l.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        ${s?`<div id="challengeOverviewRoot">${A(s)}</div>`:""}

        ${h?`<div id="memberCoverageSections">
                ${d.length?d.map(t=>`
                          <section class="member-coverage-section">
                            <div class="member-coverage-header">
                              <div>
                                <h3>${o(t.memberName)}</h3>
                                <p>${t.pairCount} ${o(a.typeFilter)} pair${t.pairCount===1?"":"s"}</p>
                              </div>
                            </div>
                            <div class="member-coverage-grid">
                              ${t.pairs.map(p=>`
                                  <article class="syncPair selected">
                                    <div class="syncImageFrame">
                                      ${p.isEx&&p.exImagePath||p.primaryImagePath?`<img class="syncImage" src="${o(p.isEx&&p.exImagePath||p.primaryImagePath)}" alt="${o(p.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${o((p.trainerName||p.label).slice(0,2).toUpperCase())}</div>`}
                                    </div>
                                    ${p.isEx&&!p.exImagePath?'<div class="syncFav">EX</div>':""}
                                    <div class="syncLevelBadge">${o(p.syncLevel)}</div>
                                    <div class="syncInfos">
                                      <p class="infoName">${o(p.label)}</p>
                                      <p>${o(t.memberName)}</p>
                                      <p>${o(p.type||"Unknown")} | ${o(p.roleLabel||"Unknown")}</p>
                                      <p>${o(v[b(p)]||p.acquisition)}</p>
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
                            <div class="syncLevelBadge">${o(t.syncLevel)}</div>
                            <div class="syncInfos">
                              <p class="infoName">${o(t.label)}</p>
                              <p>${o(t.ownerName)}</p>
                              <p>${o(t.type||"Unknown")} | ${o(t.roleLabel||"Unknown")}</p>
                              <p>${o(v[b(t)]||t.acquisition)}</p>
                              <p>EX Role: ${o(t.exRoleLabel||"None")}</p>
                            </div>
                          </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
              </div>`}
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(M=e.querySelector('[data-role="member-select"]'))==null||M.addEventListener("change",t=>{a.selectedMemberId=t.target.value,m()}),(N=e.querySelector('[data-role="query-input"]'))==null||N.addEventListener("input",t=>{a.query=t.target.value,m()}),(F=e.querySelector('[data-role="type-select"]'))==null||F.addEventListener("change",t=>{a.typeFilter=t.target.value,m()}),e.querySelectorAll('[data-role="acquisition-checkbox"]').forEach(t=>{t.addEventListener("change",()=>{U(t.value)})}),(E=e.querySelector('[data-role="role-select"]'))==null||E.addEventListener("change",t=>{a.roleFilter=t.target.value,m()}),(k=e.querySelector('[data-role="sort-select"]'))==null||k.addEventListener("change",t=>{a.sortKey=t.target.value,m()}),(x=e.querySelector('[data-role="challenge-only"]'))==null||x.addEventListener("change",t=>{a.challengeOnly=t.target.checked,m()}),(R=e.querySelector('[data-role="open-challenge-modal"]'))==null||R.addEventListener("click",()=>{J()}),e.querySelectorAll("[data-member-id]").forEach(t=>{t.addEventListener("click",()=>{a.selectedMemberId=t.dataset.memberId??"all",m()})}),$(),O();const I=e.querySelector("#leftSide");if(I&&(I.scrollTop=j),S&&(u instanceof HTMLInputElement&&u.type!=="checkbox"||u instanceof HTMLSelectElement)){const t=e.querySelector(`[data-role="${S}"]${C?`[value="${CSS.escape(C)}"]`:""}`);(t instanceof HTMLInputElement||t instanceof HTMLSelectElement)&&(t.focus(),t instanceof HTMLInputElement&&w!==null&&P!==null&&t.setSelectionRange(w,P))}}async function Z(){const e=await fetch("./data/rosters.json");a.snapshot=await e.json(),a.challengePairs=V(a.snapshot),m()}Z().catch(e=>{const l=document.querySelector("#app");l&&(l.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${o(e.message)}</section></main>`)});
