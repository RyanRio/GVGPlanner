(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))c(o);new MutationObserver(o=>{for(const l of o)if(l.type==="childList")for(const r of l.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&c(r)}).observe(document,{childList:!0,subtree:!0});function d(o){const l={};return o.integrity&&(l.integrity=o.integrity),o.referrerPolicy&&(l.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?l.credentials="include":o.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function c(o){if(o.ep)return;o.ep=!0;const l=d(o);fetch(o.href,l)}})();const u={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},t={snapshot:null,selectedMemberId:"all",query:"",typeFilter:"all",premiumFilter:"all",roleFilter:"all",challengeOnly:!1,sortKey:"label"};function a(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function F(s){var c,o;const n=new Set(((c=s.currentChallenge)==null?void 0:c.significantPairIds)??[]);return(t.selectedMemberId==="all"?s.members.flatMap(l=>l.pairs.map(r=>({...r,ownerName:l.displayName}))):(((o=s.members.find(l=>l.id===t.selectedMemberId))==null?void 0:o.pairs)??[]).map(l=>{var r;return{...l,ownerName:((r=s.members.find(i=>i.id===t.selectedMemberId))==null?void 0:r.displayName)??""}})).filter(l=>{const r=!t.query||`${l.label} ${l.ownerName} ${l.type} ${l.roleLabel} ${l.trainerName} ${l.pokemonName}`.toLowerCase().includes(t.query.toLowerCase()),i=t.typeFilter==="all"||l.type===t.typeFilter,y=t.premiumFilter==="all"||l.premiumCategory===t.premiumFilter,g=t.roleFilter==="all"||l.roleCategory===t.roleFilter,$=!t.challengeOnly||n.has(l.pairId);return r&&i&&y&&g&&$}).sort((l,r)=>{if(t.sortKey==="owner"){const i=l.ownerName.localeCompare(r.ownerName);return i!==0?i:l.label.localeCompare(r.label)}if(t.sortKey==="type"){const i=(l.type||"").localeCompare(r.type||"");return i!==0?i:l.label.localeCompare(r.label)}if(t.sortKey==="premium"){const i=(u[l.premiumCategory]||l.premiumCategory).localeCompare(u[r.premiumCategory]||r.premiumCategory);return i!==0?i:l.label.localeCompare(r.label)}return l.label.localeCompare(r.label)})}function p(){var y,g,$,b,h,v,f,C;const s=document.querySelector("#app");if(!s)return;if(!t.snapshot){s.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const n=t.snapshot,d=F(n),c=n.members,o=Array.from(new Set(n.members.flatMap(e=>e.pairs.map(m=>m.type)).filter(Boolean))).sort(),l=Array.from(new Set(n.members.flatMap(e=>e.pairs.map(m=>m.roleCategory)).filter(Boolean))).sort(),r=n.currentChallenge,i=t.selectedMemberId==="all"?`${n.gymName} gym`:((y=c.find(e=>e.id===t.selectedMemberId))==null?void 0:y.displayName)??"Unknown member";s.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${a(n.gymName)}.</p>
          ${r?`<p class="challenge-note">Current challenge: <strong>${a(r.name)}</strong> (${r.significantPairIds.length} significant pairs)</p>`:'<p class="challenge-note">No current challenge snapshot loaded.</p>'}
        </div>

        <div class="counter-block">
          <div><strong>${n.memberCount}</strong><span>Members</span></div>
          <div><strong>${n.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${d.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${t.selectedMemberId==="all"?" selected":""}>All members</option>
              ${c.map(e=>`<option value="${a(e.id)}"${e.id===t.selectedMemberId?" selected":""}>${a(e.displayName)} (${e.pairCount})</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Search</span>
            <input data-role="query-input" type="search" value="${a(t.query)}" placeholder="Search trainer, pair, member..." />
          </label>
          <label>
            <span>Type</span>
            <select data-role="type-select">
              <option value="all"${t.typeFilter==="all"?" selected":""}>All types</option>
              ${o.map(e=>`<option value="${a(e)}"${e===t.typeFilter?" selected":""}>${a(e)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${t.roleFilter==="all"?" selected":""}>All roles</option>
              ${l.map(e=>`<option value="${a(e)}"${e===t.roleFilter?" selected":""}>${a(e)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Premium</span>
            <select data-role="premium-select">
              <option value="all"${t.premiumFilter==="all"?" selected":""}>All premium tiers</option>
              ${Object.entries(u).map(([e,m])=>`<option value="${a(e)}"${e===t.premiumFilter?" selected":""}>${a(m)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select data-role="sort-select">
              <option value="label"${t.sortKey==="label"?" selected":""}>Pair name</option>
              <option value="owner"${t.sortKey==="owner"?" selected":""}>Member</option>
              <option value="type"${t.sortKey==="type"?" selected":""}>Type</option>
              <option value="premium"${t.sortKey==="premium"?" selected":""}>Premium</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input data-role="challenge-only" type="checkbox"${t.challengeOnly?" checked":""}${r?"":" disabled"} />
            <span>Only current challenge pairs</span>
          </label>
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${c.map(e=>`
                <button class="member-item${e.id===t.selectedMemberId?" active":""}" data-member-id="${a(e.id)}" type="button">
                  <strong>${a(e.displayName)}</strong>
                  <span>${e.pairCount} pairs</span>
                </button>`).join("")}
          </div>
        </section>
      </aside>

      <section id="rightSide">
        <div class="results-header">
          <div id="pairsCounter" class="counter-banner">
            <p>${a(i)}</p>
            <p>${d.length} result${d.length===1?"":"s"}</p>
          </div>
          <div id="filtersUsed">
            ${t.query?`<span>${a(t.query)}</span>`:""}
            ${t.typeFilter!=="all"?`<span>${a(t.typeFilter)}</span>`:""}
            ${t.roleFilter!=="all"?`<span>${a(t.roleFilter)}</span>`:""}
            ${t.premiumFilter!=="all"?`<span>${a(u[t.premiumFilter])}</span>`:""}
            ${t.challengeOnly?`<span>${a((r==null?void 0:r.name)??"Current challenge")}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${n.generatedAt?new Date(n.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        <div id="syncPairs">
            ${d.length?d.map(e=>`
                      <article class="syncPair selected">
                        <div class="syncFav">${e.isEx?"EX":""}</div>
                        <div class="syncImageFrame">
                          ${e.primaryImagePath?`<img class="syncImage" src="${a(e.primaryImagePath)}" alt="${a(e.label)}" loading="lazy" />`:`<div class="syncImagePlaceholder">${a((e.trainerName||e.label).slice(0,2).toUpperCase())}</div>`}
                        </div>
                        <div class="syncLevelBadge">${a(e.syncLevel)}</div>
                        <div class="syncInfos">
                          <p class="infoName">${a(e.label)}</p>
                          <p>${a(e.ownerName)}</p>
                          <p>${a(e.type||"Unknown")} | ${a(e.roleLabel||"Unknown")}</p>
                          <p>${a(u[e.premiumCategory]||e.premiumCategory)}</p>
                          <p>EX Role: ${a(e.exRoleLabel||"None")}</p>
                        </div>
                      </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
          </div>
        </div>
      </section>
    </main>
  `,(g=s.querySelector('[data-role="member-select"]'))==null||g.addEventListener("change",e=>{t.selectedMemberId=e.target.value,p()}),($=s.querySelector('[data-role="query-input"]'))==null||$.addEventListener("input",e=>{t.query=e.target.value,p()}),(b=s.querySelector('[data-role="type-select"]'))==null||b.addEventListener("change",e=>{t.typeFilter=e.target.value,p()}),(h=s.querySelector('[data-role="premium-select"]'))==null||h.addEventListener("change",e=>{t.premiumFilter=e.target.value,p()}),(v=s.querySelector('[data-role="role-select"]'))==null||v.addEventListener("change",e=>{t.roleFilter=e.target.value,p()}),(f=s.querySelector('[data-role="sort-select"]'))==null||f.addEventListener("change",e=>{t.sortKey=e.target.value,p()}),(C=s.querySelector('[data-role="challenge-only"]'))==null||C.addEventListener("change",e=>{t.challengeOnly=e.target.checked,p()}),s.querySelectorAll("[data-member-id]").forEach(e=>{e.addEventListener("click",()=>{t.selectedMemberId=e.dataset.memberId??"all",p()})})}async function w(){const s=await fetch("./data/rosters.json");t.snapshot=await s.json(),p()}w().catch(s=>{const n=document.querySelector("#app");n&&(n.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${a(s.message)}</section></main>`)});
