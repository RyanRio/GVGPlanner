(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function c(t){const n={};return t.integrity&&(n.integrity=t.integrity),t.referrerPolicy&&(n.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?n.credentials="include":t.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(t){if(t.ep)return;t.ep=!0;const n=c(t);fetch(t.href,n)}})();const y={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},e={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",premiumFilter:"all",roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:""};function o(a){return String(a).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function x(a,s,c){const i=!e.query||`${a.label} ${s} ${a.type} ${a.roleLabel} ${a.trainerName} ${a.pokemonName}`.toLowerCase().includes(e.query.toLowerCase()),t=e.typeFilter==="all"||a.type===e.typeFilter,n=e.premiumFilter==="all"||a.premiumCategory===e.premiumFilter,r=e.roleFilter==="all"||a.roleCategory===e.roleFilter,d=!e.challengeOnly||c.has(a.pairId);return i&&t&&n&&r&&d}function k(a){var i,t;const s=new Set(((i=a.currentChallenge)==null?void 0:i.significantPairIds)??[]);return(e.selectedMemberId==="all"?a.members.flatMap(n=>n.pairs.map(r=>({...r,ownerName:n.displayName}))):(((t=a.members.find(n=>n.id===e.selectedMemberId))==null?void 0:t.pairs)??[]).map(n=>{var r;return{...n,ownerName:((r=a.members.find(d=>d.id===e.selectedMemberId))==null?void 0:r.displayName)??""}})).filter(n=>x(n,n.ownerName,s)).sort((n,r)=>{if(e.sortKey==="owner"){const d=n.ownerName.localeCompare(r.ownerName);return d!==0?d:n.label.localeCompare(r.label)}if(e.sortKey==="type"){const d=(n.type||"").localeCompare(r.type||"");return d!==0?d:n.label.localeCompare(r.label)}if(e.sortKey==="premium"){const d=(y[n.premiumCategory]||n.premiumCategory).localeCompare(y[r.premiumCategory]||r.premiumCategory);return d!==0?d:n.label.localeCompare(r.label)}return n.label.localeCompare(r.label)})}function R(a){var c;const s=new Set(((c=a.currentChallenge)==null?void 0:c.significantPairIds)??[]);return a.members.map(i=>{const t=i.pairs.filter(n=>x(n,i.displayName,s)).sort((n,r)=>n.label.localeCompare(r.label));return{memberId:i.id,memberName:i.displayName,pairCount:t.length,pairs:t}}).filter(i=>i.pairCount>0).sort((i,t)=>t.pairCount!==i.pairCount?t.pairCount-i.pairCount:i.memberName.localeCompare(t.memberName))}function A(a){var i;const s=((i=a.currentChallenge)==null?void 0:i.significantPairs)??[],c=new Map;return s.forEach(t=>{const n=c.get(t.pairId);if(!n){c.set(t.pairId,{pairId:t.pairId,label:t.label,categories:new Set(t.category?[t.category]:[]),leaders:new Set(t.leaderName?[t.leaderName]:[])});return}t.category&&n.categories.add(t.category),t.leaderName&&n.leaders.add(t.leaderName)}),Array.from(c.values()).map(t=>({pairId:t.pairId,label:t.label,categories:Array.from(t.categories).sort(),leaders:Array.from(t.leaders).sort()})).sort((t,n)=>t.label.localeCompare(n.label))}function j(a){const s=[`${a.syncLevel}/5`],c=String(a.rawValue??"").split("|"),i=Number.parseInt(c[4]??"0",10)>0,t={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return a.isEx&&s.push("EX"),i&&a.exRoleLabel&&s.push(t[a.exRoleLabel]??a.exRoleLabel.toUpperCase()),s.join(" | ")}function O(a){const s=e.selectedChallengePairIds.includes(a);e.selectedChallengePairIds=s?e.selectedChallengePairIds.filter(c=>c!==a):[...e.selectedChallengePairIds,a],v()}function T(a){e.challengeModalOpen=!0,e.challengePairQuery="",e.selectedChallengePairIds.length||(e.selectedChallengePairIds=e.challengePairs.slice(0,6).map(s=>s.pairId)),u()}function q(){e.challengeModalOpen=!1,u()}function U(){const a=e.snapshot,s=a==null?void 0:a.currentChallenge;if(!e.challengeModalOpen||!a||!s)return"";const c=e.challengePairQuery.trim().toLowerCase(),i=c?e.challengePairs.filter(r=>`${r.label} ${r.categories.join(" ")} ${r.leaders.join(" ")}`.toLowerCase().includes(c)):e.challengePairs,t=e.challengePairs.filter(r=>e.selectedChallengePairIds.includes(r.pairId)),n=e.selectedChallengePairIds.length?a.members.map(r=>{const d=t.map(h=>{const g=r.pairs.find(m=>m.pairId===h.pairId);return g?{pairId:h.pairId,label:h.label,investment:j({syncLevel:g.syncLevel,isEx:g.isEx,rawValue:g.rawValue,exRoleLabel:g.exRoleLabel})}:null}).filter(Boolean);return{memberId:r.id,memberName:r.displayName,ownedPairs:d}}).filter(r=>r.ownedPairs.length===e.selectedChallengePairIds.length).sort((r,d)=>r.memberName.localeCompare(d.memberName)):[];return`
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
              value="${o(e.challengePairQuery)}"
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
                    ${e.selectedChallengePairIds.includes(r.pairId)?"checked":""}
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
    </div>`}function H(a){var s,c,i;(s=a.querySelector('[data-role="challenge-pair-query"]'))==null||s.addEventListener("input",t=>{e.challengePairQuery=t.target.value,v()}),(c=a.querySelector('[data-role="close-challenge-modal"]'))==null||c.addEventListener("click",()=>{q()}),(i=a.querySelector('[data-role="modal-backdrop"]'))==null||i.addEventListener("click",t=>{var n,r;((r=(n=t.target)==null?void 0:n.dataset)==null?void 0:r.role)==="modal-backdrop"&&q()}),a.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(t=>{t.addEventListener("change",()=>{O(t.value)})})}function v(){var n;const a=document.querySelector("#modalRoot");if(!a)return;const s=document.activeElement,c=((n=s==null?void 0:s.dataset)==null?void 0:n.role)??"",i=typeof(s==null?void 0:s.selectionStart)=="number"?s.selectionStart:null,t=typeof(s==null?void 0:s.selectionEnd)=="number"?s.selectionEnd:null;if(a.innerHTML=U(),H(a),c){const r=a.querySelector(`[data-role="${c}"]`);r instanceof HTMLInputElement&&(r.focus(),i!==null&&t!==null&&r.setSelectionRange(i,t))}}function u(){var C,I,P,S,w,L,M,N,F,E;const a=document.querySelector("#app");if(!a)return;if(!e.snapshot){a.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const s=e.snapshot,c=k(s),i=s.members,t=Array.from(new Set(s.members.flatMap(l=>l.pairs.map(p=>p.type)).filter(Boolean))).sort(),n=Array.from(new Set(s.members.flatMap(l=>l.pairs.map(p=>p.roleCategory)).filter(Boolean))).sort(),r=s.currentChallenge,d=R(s),h=e.selectedMemberId==="all"&&e.typeFilter!=="all",g=e.selectedMemberId==="all"?`${s.gymName} gym`:((C=i.find(l=>l.id===e.selectedMemberId))==null?void 0:C.displayName)??"Unknown member",m=document.activeElement,b=((I=m==null?void 0:m.dataset)==null?void 0:I.role)??"",f=typeof(m==null?void 0:m.selectionStart)=="number"?m.selectionStart:null,$=typeof(m==null?void 0:m.selectionEnd)=="number"?m.selectionEnd:null;if(a.innerHTML=`
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
              <option value="all"${e.selectedMemberId==="all"?" selected":""}>All members</option>
              ${i.map(l=>`<option value="${o(l.id)}"${l.id===e.selectedMemberId?" selected":""}>${o(l.displayName)} (${l.pairCount})</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${o(e.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${e.typeFilter==="all"?" selected":""}>All types</option>
              ${t.map(l=>`<option value="${o(l)}"${l===e.typeFilter?" selected":""}>${o(l)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${e.roleFilter==="all"?" selected":""}>All roles</option>
              ${n.map(l=>`<option value="${o(l)}"${l===e.roleFilter?" selected":""}>${o(l)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Premium</span>
            <select data-role="premium-select">
              <option value="all"${e.premiumFilter==="all"?" selected":""}>All premium tiers</option>
              ${Object.entries(y).map(([l,p])=>`<option value="${o(l)}"${l===e.premiumFilter?" selected":""}>${o(p)}</option>`).join("")}
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
            ${i.map(l=>`
                <button class="member-item${l.id===e.selectedMemberId?" active":""}" data-member-id="${o(l.id)}" type="button">
                  <strong>${o(l.displayName)}</strong>
                  <span>${l.pairCount} pairs</span>
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
            ${e.query?`<span>${o(e.query)}</span>`:""}
            ${e.typeFilter!=="all"?`<span>${o(e.typeFilter)}</span>`:""}
            ${e.roleFilter!=="all"?`<span>${o(e.roleFilter)}</span>`:""}
            ${e.premiumFilter!=="all"?`<span>${o(y[e.premiumFilter])}</span>`:""}
            ${e.challengeOnly?`<span>${o((r==null?void 0:r.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${s.generatedAt?new Date(s.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        ${h?`<div id="memberCoverageSections">
                ${d.length?d.map(l=>`
                          <section class="member-coverage-section">
                            <div class="member-coverage-header">
                              <div>
                                <h3>${o(l.memberName)}</h3>
                                <p>${l.pairCount} ${o(e.typeFilter)} pair${l.pairCount===1?"":"s"}</p>
                              </div>
                            </div>
                            <div class="member-coverage-grid">
                              ${l.pairs.map(p=>`
                                  <article class="syncPair selected">
                                    <div class="syncImageFrame">
                                      ${p.isEx&&p.exImagePath||p.primaryImagePath?`<img class="syncImage" src="${o(p.isEx&&p.exImagePath||p.primaryImagePath)}" alt="${o(p.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${o((p.trainerName||p.label).slice(0,2).toUpperCase())}</div>`}
                                    </div>
                                    ${p.isEx&&!p.exImagePath?'<div class="syncFav">EX</div>':""}
                                    <div class="syncLevelBadge">${o(p.syncLevel)}</div>
                                    <div class="syncInfos">
                                      <p class="infoName">${o(p.label)}</p>
                                      <p>${o(l.memberName)}</p>
                                      <p>${o(p.type||"Unknown")} | ${o(p.roleLabel||"Unknown")}</p>
                                      <p>${o(y[p.premiumCategory]||p.premiumCategory)}</p>
                                      <p>EX Role: ${o(p.exRoleLabel||"None")}</p>
                                    </div>
                                  </article>`).join("")}
                            </div>
                          </section>`).join(""):'<div class="empty-state">No members match the current type coverage filters.</div>'}
              </div>`:`<div id="syncPairs">
                ${c.length?c.map(l=>`
                          <article class="syncPair selected">
                            <div class="syncImageFrame">
                              ${l.isEx&&l.exImagePath||l.primaryImagePath?`<img class="syncImage" src="${o(l.isEx&&l.exImagePath||l.primaryImagePath)}" alt="${o(l.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${o((l.trainerName||l.label).slice(0,2).toUpperCase())}</div>`}
                            </div>
                            ${l.isEx&&!l.exImagePath?'<div class="syncFav">EX</div>':""}
                            <div class="syncLevelBadge">${o(l.syncLevel)}</div>
                            <div class="syncInfos">
                              <p class="infoName">${o(l.label)}</p>
                              <p>${o(l.ownerName)}</p>
                              <p>${o(l.type||"Unknown")} | ${o(l.roleLabel||"Unknown")}</p>
                              <p>${o(y[l.premiumCategory]||l.premiumCategory)}</p>
                              <p>EX Role: ${o(l.exRoleLabel||"None")}</p>
                            </div>
                          </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
              </div>`}
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(P=a.querySelector('[data-role="member-select"]'))==null||P.addEventListener("change",l=>{e.selectedMemberId=l.target.value,u()}),(S=a.querySelector('[data-role="query-input"]'))==null||S.addEventListener("input",l=>{e.query=l.target.value,u()}),(w=a.querySelector('[data-role="type-select"]'))==null||w.addEventListener("change",l=>{e.typeFilter=l.target.value,u()}),(L=a.querySelector('[data-role="premium-select"]'))==null||L.addEventListener("change",l=>{e.premiumFilter=l.target.value,u()}),(M=a.querySelector('[data-role="role-select"]'))==null||M.addEventListener("change",l=>{e.roleFilter=l.target.value,u()}),(N=a.querySelector('[data-role="sort-select"]'))==null||N.addEventListener("change",l=>{e.sortKey=l.target.value,u()}),(F=a.querySelector('[data-role="challenge-only"]'))==null||F.addEventListener("change",l=>{e.challengeOnly=l.target.checked,u()}),(E=a.querySelector('[data-role="open-challenge-modal"]'))==null||E.addEventListener("click",()=>{T()}),a.querySelectorAll("[data-member-id]").forEach(l=>{l.addEventListener("click",()=>{e.selectedMemberId=l.dataset.memberId??"all",u()})}),v(),b){const l=a.querySelector(`[data-role="${b}"]`);(l instanceof HTMLInputElement||l instanceof HTMLSelectElement)&&(l.focus(),l instanceof HTMLInputElement&&f!==null&&$!==null&&l.setSelectionRange(f,$))}}async function K(){const a=await fetch("./data/rosters.json");e.snapshot=await a.json(),e.challengePairs=A(e.snapshot),u()}K().catch(a=>{const s=document.querySelector("#app");s&&(s.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${o(a.message)}</section></main>`)});
