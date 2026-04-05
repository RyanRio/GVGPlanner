(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))c(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&c(a)}).observe(document,{childList:!0,subtree:!0});function i(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function c(t){if(t.ep)return;t.ep=!0;const r=i(t);fetch(t.href,r)}})();const y={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},e={snapshot:null,challengePairs:[],selectedMemberId:"all",query:"",typeFilter:"all",premiumFilter:"all",roleFilter:"all",challengeOnly:!1,sortKey:"label",challengeModalOpen:!1,selectedChallengePairIds:[],challengePairQuery:""};function o(n){return String(n).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function q(n){var c,t;const s=new Set(((c=n.currentChallenge)==null?void 0:c.significantPairIds)??[]);return(e.selectedMemberId==="all"?n.members.flatMap(r=>r.pairs.map(a=>({...a,ownerName:r.displayName}))):(((t=n.members.find(r=>r.id===e.selectedMemberId))==null?void 0:t.pairs)??[]).map(r=>{var a;return{...r,ownerName:((a=n.members.find(d=>d.id===e.selectedMemberId))==null?void 0:a.displayName)??""}})).filter(r=>{const a=!e.query||`${r.label} ${r.ownerName} ${r.type} ${r.roleLabel} ${r.trainerName} ${r.pokemonName}`.toLowerCase().includes(e.query.toLowerCase()),d=e.typeFilter==="all"||r.type===e.typeFilter,p=e.premiumFilter==="all"||r.premiumCategory===e.premiumFilter,u=e.roleFilter==="all"||r.roleCategory===e.roleFilter,g=!e.challengeOnly||s.has(r.pairId);return a&&d&&p&&u&&g}).sort((r,a)=>{if(e.sortKey==="owner"){const d=r.ownerName.localeCompare(a.ownerName);return d!==0?d:r.label.localeCompare(a.label)}if(e.sortKey==="type"){const d=(r.type||"").localeCompare(a.type||"");return d!==0?d:r.label.localeCompare(a.label)}if(e.sortKey==="premium"){const d=(y[r.premiumCategory]||r.premiumCategory).localeCompare(y[a.premiumCategory]||a.premiumCategory);return d!==0?d:r.label.localeCompare(a.label)}return r.label.localeCompare(a.label)})}function E(n){var c;const s=((c=n.currentChallenge)==null?void 0:c.significantPairs)??[],i=new Map;return s.forEach(t=>{const r=i.get(t.pairId);if(!r){i.set(t.pairId,{pairId:t.pairId,label:t.label,categories:new Set(t.category?[t.category]:[]),leaders:new Set(t.leaderName?[t.leaderName]:[])});return}t.category&&r.categories.add(t.category),t.leaderName&&r.leaders.add(t.leaderName)}),Array.from(i.values()).map(t=>({pairId:t.pairId,label:t.label,categories:Array.from(t.categories).sort(),leaders:Array.from(t.leaders).sort()})).sort((t,r)=>t.label.localeCompare(r.label))}function x(n){const s=[`${n.syncLevel}/5`],i=String(n.rawValue??"").split("|"),c=Number.parseInt(i[4]??"0",10)>0,t={Strike:"STR",Tech:"TEC",Support:"SUP",Sprint:"SPR",Field:"FLD",Multi:"MLT"};return n.isEx&&s.push("EX"),c&&n.exRoleLabel&&s.push(t[n.exRoleLabel]??n.exRoleLabel.toUpperCase()),s.join(" | ")}function k(n){const s=e.selectedChallengePairIds.includes(n);e.selectedChallengePairIds=s?e.selectedChallengePairIds.filter(i=>i!==n):[...e.selectedChallengePairIds,n],b()}function A(n){e.challengeModalOpen=!0,e.challengePairQuery="",e.selectedChallengePairIds.length||(e.selectedChallengePairIds=e.challengePairs.slice(0,6).map(s=>s.pairId)),m()}function F(){e.challengeModalOpen=!1,m()}function R(){const n=e.snapshot,s=n==null?void 0:n.currentChallenge;if(!e.challengeModalOpen||!n||!s)return"";const i=e.challengePairQuery.trim().toLowerCase(),c=i?e.challengePairs.filter(a=>`${a.label} ${a.categories.join(" ")} ${a.leaders.join(" ")}`.toLowerCase().includes(i)):e.challengePairs,t=e.challengePairs.filter(a=>e.selectedChallengePairIds.includes(a.pairId)),r=e.selectedChallengePairIds.length?n.members.map(a=>{const d=t.map(p=>{const u=a.pairs.find(g=>g.pairId===p.pairId);return u?{pairId:p.pairId,label:p.label,investment:x({syncLevel:u.syncLevel,isEx:u.isEx,rawValue:u.rawValue,exRoleLabel:u.exRoleLabel})}:null}).filter(Boolean);return{memberId:a.id,memberName:a.displayName,ownedPairs:d}}).filter(a=>a.ownedPairs.length===e.selectedChallengePairIds.length).sort((a,d)=>a.memberName.localeCompare(d.memberName)):[];return`
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
            <span>${c.length} shown</span>
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
            ${c.map(a=>`
                <label class="challenge-pair-option">
                  <input
                    type="checkbox"
                    data-role="challenge-pair-checkbox"
                    value="${o(a.pairId)}"
                    ${e.selectedChallengePairIds.includes(a.pairId)?"checked":""}
                  />
                  <div>
                    <strong>${o(a.label)}</strong>
                    <p>${o(a.categories.join(", ")||"challenge")} ${a.leaders.length?`| ${o(a.leaders.join(", "))}`:""}</p>
                  </div>
                </label>`).join("")}
          </div>
        </section>

        <section class="modal-panel pair-owner-panel">
          <div class="modal-panel-header">
            <h3>Members with all selected pairs</h3>
            <span>${r.length} member${r.length===1?"":"s"}</span>
          </div>
          ${t.length?r.length?r.map(a=>`
                      <article class="pair-owner-card">
                        <div class="pair-owner-header">
                          <div>
                            <strong>${o(a.memberName)}</strong>
                            <p>Owns all ${t.length} selected pair${t.length===1?"":"s"}</p>
                          </div>
                        </div>
                        <div class="owner-list">
                          ${a.ownedPairs.map(d=>`
                              <div class="owner-row">
                                <strong>${o(d.label)}</strong>
                                <span>${o(d.investment)}</span>
                              </div>`).join("")}
                        </div>
                      </article>`).join(""):'<div class="empty-state modal-empty">No imported members own all selected pairs.</div>':'<div class="empty-state modal-empty">Select one or more challenge pairs to see matching members.</div>'}
        </section>
      </section>
    </div>`}function O(n){var s,i,c;(s=n.querySelector('[data-role="challenge-pair-query"]'))==null||s.addEventListener("input",t=>{e.challengePairQuery=t.target.value,b()}),(i=n.querySelector('[data-role="close-challenge-modal"]'))==null||i.addEventListener("click",()=>{F()}),(c=n.querySelector('[data-role="modal-backdrop"]'))==null||c.addEventListener("click",t=>{var r,a;((a=(r=t.target)==null?void 0:r.dataset)==null?void 0:a.role)==="modal-backdrop"&&F()}),n.querySelectorAll('[data-role="challenge-pair-checkbox"]').forEach(t=>{t.addEventListener("change",()=>{k(t.value)})})}function b(){var r;const n=document.querySelector("#modalRoot");if(!n)return;const s=document.activeElement,i=((r=s==null?void 0:s.dataset)==null?void 0:r.role)??"",c=typeof(s==null?void 0:s.selectionStart)=="number"?s.selectionStart:null,t=typeof(s==null?void 0:s.selectionEnd)=="number"?s.selectionEnd:null;if(n.innerHTML=R(),O(n),i){const a=n.querySelector(`[data-role="${i}"]`);a instanceof HTMLInputElement&&(a.focus(),c!==null&&t!==null&&a.setSelectionRange(c,t))}}function m(){var v,$,C,S,P,I,w,L,M,N;const n=document.querySelector("#app");if(!n)return;if(!e.snapshot){n.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const s=e.snapshot,i=q(s),c=s.members,t=Array.from(new Set(s.members.flatMap(l=>l.pairs.map(h=>h.type)).filter(Boolean))).sort(),r=Array.from(new Set(s.members.flatMap(l=>l.pairs.map(h=>h.roleCategory)).filter(Boolean))).sort(),a=s.currentChallenge,d=e.selectedMemberId==="all"?`${s.gymName} gym`:((v=c.find(l=>l.id===e.selectedMemberId))==null?void 0:v.displayName)??"Unknown member",p=document.activeElement,u=(($=p==null?void 0:p.dataset)==null?void 0:$.role)??"",g=typeof(p==null?void 0:p.selectionStart)=="number"?p.selectionStart:null,f=typeof(p==null?void 0:p.selectionEnd)=="number"?p.selectionEnd:null;if(n.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${o(s.gymName)}.</p>
          ${a?`<p class="challenge-note">Current challenge: <strong>${o(a.name)}</strong> (${a.significantPairIds.length} significant pairs)</p>
                 <button class="challenge-modal-button" data-role="open-challenge-modal" type="button">Challenge pair lookup</button>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${s.memberCount}</strong><span>Members</span></div>
          <div><strong>${s.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${i.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${e.selectedMemberId==="all"?" selected":""}>All members</option>
              ${c.map(l=>`<option value="${o(l.id)}"${l.id===e.selectedMemberId?" selected":""}>${o(l.displayName)} (${l.pairCount})</option>`).join("")}
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
              ${r.map(l=>`<option value="${o(l)}"${l===e.roleFilter?" selected":""}>${o(l)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Premium</span>
            <select data-role="premium-select">
              <option value="all"${e.premiumFilter==="all"?" selected":""}>All premium tiers</option>
              ${Object.entries(y).map(([l,h])=>`<option value="${o(l)}"${l===e.premiumFilter?" selected":""}>${o(h)}</option>`).join("")}
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
            <input data-role="challenge-only" type="checkbox"${e.challengeOnly?" checked":""}${a?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${c.map(l=>`
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
            <p>${o(d)}</p>
            <p>${i.length} result${i.length===1?"":"s"}</p>
          </div>
          <div id="filtersUsed">
            ${e.query?`<span>${o(e.query)}</span>`:""}
            ${e.typeFilter!=="all"?`<span>${o(e.typeFilter)}</span>`:""}
            ${e.roleFilter!=="all"?`<span>${o(e.roleFilter)}</span>`:""}
            ${e.premiumFilter!=="all"?`<span>${o(y[e.premiumFilter])}</span>`:""}
            ${e.challengeOnly?`<span>${o((a==null?void 0:a.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${s.generatedAt?new Date(s.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        <div id="syncPairs">
            ${i.length?i.map(l=>`
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
          </div>
        </div>
      </section>
    </main>
    <div id="modalRoot"></div>
  `,(C=n.querySelector('[data-role="member-select"]'))==null||C.addEventListener("change",l=>{e.selectedMemberId=l.target.value,m()}),(S=n.querySelector('[data-role="query-input"]'))==null||S.addEventListener("input",l=>{e.query=l.target.value,m()}),(P=n.querySelector('[data-role="type-select"]'))==null||P.addEventListener("change",l=>{e.typeFilter=l.target.value,m()}),(I=n.querySelector('[data-role="premium-select"]'))==null||I.addEventListener("change",l=>{e.premiumFilter=l.target.value,m()}),(w=n.querySelector('[data-role="role-select"]'))==null||w.addEventListener("change",l=>{e.roleFilter=l.target.value,m()}),(L=n.querySelector('[data-role="sort-select"]'))==null||L.addEventListener("change",l=>{e.sortKey=l.target.value,m()}),(M=n.querySelector('[data-role="challenge-only"]'))==null||M.addEventListener("change",l=>{e.challengeOnly=l.target.checked,m()}),(N=n.querySelector('[data-role="open-challenge-modal"]'))==null||N.addEventListener("click",()=>{A()}),n.querySelectorAll("[data-member-id]").forEach(l=>{l.addEventListener("click",()=>{e.selectedMemberId=l.dataset.memberId??"all",m()})}),b(),u){const l=n.querySelector(`[data-role="${u}"]`);(l instanceof HTMLInputElement||l instanceof HTMLSelectElement)&&(l.focus(),l instanceof HTMLInputElement&&g!==null&&f!==null&&l.setSelectionRange(g,f))}}async function j(){const n=await fetch("./data/rosters.json");e.snapshot=await n.json(),e.challengePairs=E(e.snapshot),m()}j().catch(n=>{const s=document.querySelector("#app");s&&(s.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${o(n.message)}</section></main>`)});
