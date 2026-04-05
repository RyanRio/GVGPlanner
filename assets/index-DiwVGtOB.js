(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))r(l);new MutationObserver(l=>{for(const s of l)if(s.type==="childList")for(const p of s.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&r(p)}).observe(document,{childList:!0,subtree:!0});function i(l){const s={};return l.integrity&&(s.integrity=l.integrity),l.referrerPolicy&&(s.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?s.credentials="include":l.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(l){if(l.ep)return;l.ep=!0;const s=i(l);fetch(l.href,s)}})();const d={master_fair:"Master Fair",arc_fair:"Arc Fair",poke_fair:"Poke Fair",seasonal:"Seasonal",variety:"Variety",special_costume:"Special Costume",general:"General"},t={snapshot:null,selectedMemberId:"all",query:"",typeFilter:"all",premiumFilter:"all",roleFilter:"all",sortKey:"label"};function a(o){return String(o).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function h(o){var i;return(t.selectedMemberId==="all"?o.members.flatMap(r=>r.pairs.map(l=>({...l,ownerName:r.displayName}))):(((i=o.members.find(r=>r.id===t.selectedMemberId))==null?void 0:i.pairs)??[]).map(r=>{var l;return{...r,ownerName:((l=o.members.find(s=>s.id===t.selectedMemberId))==null?void 0:l.displayName)??""}})).filter(r=>{const l=!t.query||`${r.label} ${r.ownerName} ${r.type} ${r.roleLabel} ${r.trainerName} ${r.pokemonName}`.toLowerCase().includes(t.query.toLowerCase()),s=t.typeFilter==="all"||r.type===t.typeFilter,p=t.premiumFilter==="all"||r.premiumCategory===t.premiumFilter,u=t.roleFilter==="all"||r.roleCategory===t.roleFilter;return l&&s&&p&&u}).sort((r,l)=>{if(t.sortKey==="owner"){const s=r.ownerName.localeCompare(l.ownerName);return s!==0?s:r.label.localeCompare(l.label)}if(t.sortKey==="type"){const s=(r.type||"").localeCompare(l.type||"");return s!==0?s:r.label.localeCompare(l.label)}if(t.sortKey==="premium"){const s=(d[r.premiumCategory]||r.premiumCategory).localeCompare(d[l.premiumCategory]||l.premiumCategory);return s!==0?s:r.label.localeCompare(l.label)}return r.label.localeCompare(l.label)})}function c(){var u,y,$,v,b,g,f;const o=document.querySelector("#app");if(!o)return;if(!t.snapshot){o.innerHTML='<main class="shell"><section class="panel">Loading roster snapshot...</section></main>';return}const n=t.snapshot,i=h(n),r=n.members,l=Array.from(new Set(n.members.flatMap(e=>e.pairs.map(m=>m.type)).filter(Boolean))).sort(),s=Array.from(new Set(n.members.flatMap(e=>e.pairs.map(m=>m.roleCategory)).filter(Boolean))).sort(),p=t.selectedMemberId==="all"?`${n.gymName} gym`:((u=r.find(e=>e.id===t.selectedMemberId))==null?void 0:u.displayName)??"Unknown member";o.innerHTML=`
    <main id="main">
      <aside id="leftSide">
        <div id="leftSideHead">
          <p class="eyebrow">Static companion tool</p>
          <h1>GVG Roster Browser</h1>
          <p class="lede">Tracker-style browser for ${a(n.gymName)}.</p>
        </div>

        <div class="counter-block">
          <div><strong>${n.memberCount}</strong><span>Members</span></div>
          <div><strong>${n.pairCount}</strong><span>Total owned pairs</span></div>
          <div><strong>${i.length}</strong><span>Shown</span></div>
        </div>

        <section class="panel-group">
          <label>
            <span>Member</span>
            <select data-role="member-select">
              <option value="all"${t.selectedMemberId==="all"?" selected":""}>All members</option>
              ${r.map(e=>`<option value="${a(e.id)}"${e.id===t.selectedMemberId?" selected":""}>${a(e.displayName)} (${e.pairCount})</option>`).join("")}
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
              ${l.map(e=>`<option value="${a(e)}"${e===t.typeFilter?" selected":""}>${a(e)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select data-role="role-select">
              <option value="all"${t.roleFilter==="all"?" selected":""}>All roles</option>
              ${s.map(e=>`<option value="${a(e)}"${e===t.roleFilter?" selected":""}>${a(e)}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>Premium</span>
            <select data-role="premium-select">
              <option value="all"${t.premiumFilter==="all"?" selected":""}>All premium tiers</option>
              ${Object.entries(d).map(([e,m])=>`<option value="${a(e)}"${e===t.premiumFilter?" selected":""}>${a(m)}</option>`).join("")}
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
        </section>

        <section class="panel-group">
          <p class="section-title">Members</p>
          <div class="member-list">
            ${r.map(e=>`
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
            <p>${a(p)}</p>
            <p>${i.length} result${i.length===1?"":"s"}</p>
          </div>
          <div id="filtersUsed">
            ${t.query?`<span>${a(t.query)}</span>`:""}
            ${t.typeFilter!=="all"?`<span>${a(t.typeFilter)}</span>`:""}
            ${t.roleFilter!=="all"?`<span>${a(t.roleFilter)}</span>`:""}
            ${t.premiumFilter!=="all"?`<span>${a(d[t.premiumFilter])}</span>`:""}
          </div>
          <span class="timestamp">Snapshot ${n.generatedAt?new Date(n.generatedAt).toLocaleString():"not generated yet"}</span>
        </div>

        <div id="syncPairs">
            ${i.length?i.map(e=>`
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
                          <p>${a(d[e.premiumCategory]||e.premiumCategory)}</p>
                          <p>EX Role: ${a(e.exRoleLabel||"None")}</p>
                        </div>
                      </article>`).join(""):'<div class="empty-state">No pairs match the current filters.</div>'}
          </div>
        </div>
      </section>
    </main>
  `,(y=o.querySelector('[data-role="member-select"]'))==null||y.addEventListener("change",e=>{t.selectedMemberId=e.target.value,c()}),($=o.querySelector('[data-role="query-input"]'))==null||$.addEventListener("input",e=>{t.query=e.target.value,c()}),(v=o.querySelector('[data-role="type-select"]'))==null||v.addEventListener("change",e=>{t.typeFilter=e.target.value,c()}),(b=o.querySelector('[data-role="premium-select"]'))==null||b.addEventListener("change",e=>{t.premiumFilter=e.target.value,c()}),(g=o.querySelector('[data-role="role-select"]'))==null||g.addEventListener("change",e=>{t.roleFilter=e.target.value,c()}),(f=o.querySelector('[data-role="sort-select"]'))==null||f.addEventListener("change",e=>{t.sortKey=e.target.value,c()}),o.querySelectorAll("[data-member-id]").forEach(e=>{e.addEventListener("click",()=>{t.selectedMemberId=e.dataset.memberId??"all",c()})})}async function F(){const o=await fetch("./data/rosters.json");t.snapshot=await o.json(),c()}F().catch(o=>{const n=document.querySelector("#app");n&&(n.innerHTML=`<main class="shell"><section class="panel">Failed to load roster snapshot: ${a(o.message)}</section></main>`)});
