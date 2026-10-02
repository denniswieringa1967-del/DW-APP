/* DW APP v5.7 — juridische liveganglaag + snelle buitendienst */
(() => {
  "use strict";

  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const main=$("#main"), cfg=window.DW_CONFIG||{}, scans=window.DW_SCANS||{};
  const STORE="dw_field_visits_v4", EMP="dw_field_employee_v1", CLIENT="dw_field_client_mode_v1";
  const LEGAL_VERSION="2026-09-23";
  const icon=(name)=>({
    home:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
    business:'<svg viewBox="0 0 24 24"><path d="M4 21V7h16v14M8 7V3h8v4M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-3h4v3"/></svg>',
    ai:'<svg viewBox="0 0 24 24"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/></svg>',
    bolt:'<svg viewBox="0 0 24 24"><path d="m13 2-8 12h7l-1 8 8-12h-7z"/></svg>'
  }[name]||'');

  let currentView="home", visit=null, queue=[], qIndex=0;
  const MEM_STORE={};
  function storageGet(k){try{return localStorage.getItem(k)}catch{return Object.prototype.hasOwnProperty.call(MEM_STORE,k)?MEM_STORE[k]:null}}
  function storageSet(k,v){try{localStorage.setItem(k,v)}catch{MEM_STORE[k]=String(v)}}
  function storageRemove(k){try{localStorage.removeItem(k)}catch{delete MEM_STORE[k]}}

  function uuid(){return crypto?.randomUUID?.()||`dw-${Date.now()}-${Math.random().toString(16).slice(2)}`}
  function employee(){return storageGet(EMP)||"Dennis"}
  function newVisit(route=""){return {id:uuid(),created_at:new Date().toISOString(),updated_at:new Date().toISOString(),status:"concept",sync_status:"local",source:"buitendienst",campaign:cfg.DEFAULT_CAMPAIGN||"",employee:employee(),route,product:"",visit_status:"Gesprek gevoerd",contact:{name:"",company:"",kvk:"",role:"",email:"",phone:"",street:"",house_number:"",postcode:"",city:""},products:[],answers:{},answer_labels:{},notes:"",consent:{contact:false,privacy:false,photos:false,share_partner:false,report_email:false,extended_report_email:false,terms:false,assignment:false,privacy_version:LEGAL_VERSION,terms_version:LEGAL_VERSION,captured_at:""},photos:[],energy_route:""}}
  function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
  function fmt(d){try{return new Intl.DateTimeFormat("nl-NL",{dateStyle:"medium",timeStyle:"short"}).format(new Date(d))}catch{return d}}
  function load(){try{return JSON.parse(storageGet(STORE)||"[]")}catch{return []}}
  function saveAll(rows){storageSet(STORE,JSON.stringify(rows))}
  function persist(){if(!visit)return;visit.updated_at=new Date().toISOString();const rows=load();const i=rows.findIndex(v=>v.id===visit.id);if(i>=0)rows[i]=visit;else rows.unshift(visit);saveAll(rows);updateBadge()}
  function updateBadge(){
    const pending=load().filter(v=>v.status==="afgerond"&&v.sync_status!=="synced"&&v.sync_status!=="not-a-lead").length;
    const b=$("#syncBadge"); if(!b)return;
    const mode=window.DW_PRODUCTION?.mode?.()||"local";
    if(mode==="live"){
      b.textContent=pending?`${pending} wacht op sync`:"LIVE PRODUCTIE";
      b.className="status-chip "+(pending?"status-warn":"status-safe");
    }else if(mode==="pilot"){
      b.textContent="PILOTTEST"; b.className="status-chip status-warn";
    }else if(mode==="check"){
      b.textContent="Controlemodus"; b.className="status-chip status-warn";
    }else{
      b.textContent="Testmodus"; b.className="status-chip status-safe";
    }
  }
  function val(id){return ($(`#${id}`)?.value||"").trim()}
  function bind(sel,ev,fn){$$(sel).forEach(x=>x.addEventListener(ev,fn))}
  function setNav(view){currentView=view;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));$("#bottomNav").classList.remove("hidden")}
  function focusMain(){main.setAttribute("tabindex","-1");main.focus({preventScroll:true});window.scrollTo({top:0,behavior:"smooth"})}
  function focusQuestion(){main.setAttribute("tabindex","-1");main.focus({preventScroll:true});requestAnimationFrame(()=>{const target=main.querySelector(".question-wrap");if(!target)return;const top=target.getBoundingClientRect().top+window.scrollY-130;window.scrollTo({top:Math.max(0,top),behavior:"auto"})})}
  function hideNav(h=true){$("#bottomNav").classList.toggle("hidden",h)}
  function clientMode(on){document.body.classList.toggle("client-mode",on);storageSet(CLIENT,on?"1":"0");$("#clientModeButton").classList.toggle("active",on);$("#clientModeButton").textContent=on?"Medewerkerweergave":"Klantweergave"}

  function stepsFor(){
    if(!visit)return[];
    if(visit.product==="quicklead")return["Interesselead"];
    if(visit.route==="particulier")return["Contact","Maatregelen","Woningcheck","Dossier","Controle"];
    return["Contact",visit.product==="ai"?"AI-scan":visit.product==="energie"?"Energiescan":"Scan","Dossier","Controle"];
  }
  function flowShell(content,stage,sideText="Antwoorden worden tijdens het gesprek automatisch lokaal als concept bewaard."){
    const steps=stepsFor();const idx=Math.max(0,Math.min(stage,steps.length-1));const pct=steps.length>1?Math.round((idx/(steps.length-1))*100):0;
    return `<div class="flow-shell"><div class="flow-main">${content}</div><aside class="flow-side"><div class="progress-card"><div class="progress-head"><strong>Voortgang bezoek</strong><span>${pct}%</span></div><div class="progress-track"><i style="width:${pct}%"></i></div><div class="progress-list">${steps.map((s,i)=>`<div class="progress-step ${i<idx?'done':''} ${i===idx?'active':''}"><b>${i<idx?'✓':i+1}</b><span>${esc(s)}</span></div>`).join('')}</div></div><div class="side-note"><small>Werkwijze</small><p>${esc(sideText)}</p></div></aside></div>`
  }
  function actions({back="Terug",next="Verder",save=true,onBack,onNext,disabled=false,status=""}){
    return `<div class="flow-actions">${onBack?`<button id="flowBack" class="secondary" type="button">${esc(back)}</button>`:''}${save?'<button id="flowSave" class="ghost" type="button">Concept opslaan</button>':''}<span class="spacer"></span>${status?`<span class="mini-status">${esc(status)}</span>`:''}${onNext?`<button id="flowNext" class="primary" type="button" ${disabled?'disabled':''}>${esc(next)}</button>`:''}</div>`
  }
  function wireActions({onBack,onNext,onSave}){$("#flowBack")?.addEventListener("click",onBack);$("#flowNext")?.addEventListener("click",onNext);$("#flowSave")?.addEventListener("click",()=>{onSave?.();persist();toast("Concept opgeslagen op dit apparaat.")})}
  function toast(msg){let el=document.createElement("div");el.textContent=msg;Object.assign(el.style,{position:"fixed",left:"50%",bottom:"100px",transform:"translateX(-50%)",zIndex:99,background:"#0d1b32",color:"white",padding:"12px 16px",borderRadius:"12px",boxShadow:"0 12px 30px rgba(0,0,0,.2)",fontWeight:"750",fontSize:"13px"});document.body.appendChild(el);setTimeout(()=>el.remove(),1700)}

  function renderHome(){setNav("home");hideNav(false);const rows=load(),done=rows.filter(v=>v.status==="afgerond").length,drafts=rows.filter(v=>v.status==="concept").length;main.innerHTML=`
    <section class="hero"><span class="eyebrow">DW Marketing · buitendienst</span><h1>Goed voorbereid op ieder gesprek.</h1><p>Kies uw klant, doorloop de scan en leg de afspraken vast. Alles voor uw bezoek op één plek.</p><div class="hero-actions"><button id="newVisit" class="primary">Nieuw bezoek starten</button><button id="openDrafts" class="secondary">Concept hervatten</button></div></section>
    <section class="section"><div class="stats"><div class="stat-card"><small>Afgerond lokaal</small><strong>${done}</strong></div><div class="stat-card"><small>Open concepten</small><strong>${drafts}</strong></div><div class="stat-card"><small>Productiekoppeling</small><strong style="font-size:18px">${window.DW_PRODUCTION?.mode?.()==='live'?'AI-scan live':window.DW_PRODUCTION?.mode?.()==='pilot'?'Woningcheck pilot':'Controlemodus'}</strong></div></div></section>
    <section class="section"><div class="section-head"><div><span class="kicker">Start een gesprek</span><h2>Met wie gaat u in gesprek?</h2><p>Kies een woningbezoek of een zakelijk gesprek.</p></div></div><div class="grid">
      <article class="card route-card route-card-home"><div><div class="route-art route-art-home" aria-hidden="true"></div><span class="route-label">Woningbezoek</span><h3>Verduurzamingsscan</h3><p>Breng de woning, wensen en mogelijkheden voor verduurzaming in kaart.</p></div><button class="primary startRoute route-cta route-cta-home" data-route="particulier">Start particulier</button></article>
      <article class="card route-card route-card-business"><div><div class="route-art route-art-business" aria-hidden="true"></div><span class="route-label">Bedrijfsbezoek</span><h3>Zakelijke scans</h3><p>Kies de AI-scan of Energieplichtscan en bespreek de kansen voor het bedrijf.</p></div><button class="primary startRoute route-cta route-cta-business" data-route="zakelijk">Start zakelijk</button></article>
    </div></section>`;
    $("#newVisit").onclick=renderRoute;$("#openDrafts").onclick=()=>renderVisits(true);bind(".startRoute","click",e=>start(e.currentTarget.dataset.route));focusMain()
  }
  function renderRoute(){hideNav(true);main.innerHTML=`<div class="screen-card"><div class="screen-head"><div class="screen-number">1</div><div><span class="kicker">Nieuw bezoek</span><h2>Wie staat er voor je?</h2><p>Één keuze. De rest van de app past zich automatisch aan.</p></div></div><div class="screen-body"><div class="grid"><article class="card route-card route-card-home"><div><div class="route-art route-art-home" aria-hidden="true"></div><span class="route-label">Woningbezoek</span><h3>Verduurzamingsscan</h3><p>VerduurzamenThuis · Woningcheck</p></div><button class="primary startRoute route-cta route-cta-home" data-route="particulier">Particulier</button></article><article class="card route-card route-card-business"><div><div class="route-art route-art-business" aria-hidden="true"></div><span class="route-label">Bedrijfsbezoek</span><h3>Zakelijke scans</h3><p>AI of Energie & Compliance</p></div><button class="primary startRoute route-cta route-cta-business" data-route="zakelijk">Zakelijk</button></article></div></div></div>${actions({onBack:true,back:"Annuleren",save:false})}`;bind(".startRoute","click",e=>start(e.currentTarget.dataset.route));wireActions({onBack:renderHome});focusMain()}
  function start(route){visit=newVisit(route);qIndex=0;queue=[];if(route==="particulier")return renderParticulierChoice();renderContact()}

  function renderParticulierChoice(){
    hideNav(true);
    main.innerHTML=`<div class="screen-card"><div class="screen-head"><div class="screen-number">1</div><div><span class="kicker">Particulier · verduurzaming</span><h2>Wat wilt u vastleggen?</h2><p>Kies de korte interesselead voor deze opdracht of de bestaande volledige Woningcheck.</p></div></div><div class="screen-body"><div class="grid">
      <article class="card route-card route-card-home"><div><div class="route-art route-art-home" aria-hidden="true"></div><span class="route-label">Snel · ±30 sec.</span><h3>Snelle interesselead</h3><p>Alleen naam, telefoon en adres. Geen afspraak en geen scan nodig.</p></div><button id="startQuickLead" class="primary">Snelle interesselead</button></article>
      <article class="card route-card route-card-home"><div><div class="route-art route-art-home" aria-hidden="true"></div><span class="route-label">Uitgebreid</span><h3>Volledige Woningcheck</h3><p>De bestaande particuliere scan met maatregelen, vragen, dossier en rapportflow.</p></div><button id="startFullWoningcheck" class="secondary">Volledige Woningcheck</button></article>
    </div></div></div>${actions({onBack:true,back:"Terug",save:false})}`;
    $("#startQuickLead")?.addEventListener("click",renderIntegratedQuickLead);
    $("#startFullWoningcheck")?.addEventListener("click",renderContact);
    wireActions({onBack:renderRoute});
    focusMain();
  }

  function renderIntegratedQuickLead(){
    visit.product="quicklead";
    visit.visit_status="Interesse";
    visit.campaign=visit.campaign||"VERDUURZAMING-OPDRACHTGEVER-60";
    const c=visit.contact||{};
    const content=`<div class="screen-card"><div class="screen-head"><div class="screen-number">✓</div><div><span class="kicker">Snelle verduurzamingslead</span><h2>Interesse vastleggen</h2><p>Geen afspraak. Geen volledige Woningcheck. Alleen de gegevens voor terugbelinformatie.</p></div></div><div class="screen-body">
      <div class="form-grid">
        <div class="field full"><label>Naam bewoner *</label><input id="quickName" value="${esc(c.name)}" autocomplete="name"></div>
        <div class="field"><label>Mobiel nummer *</label><input id="quickPhone" type="tel" value="${esc(c.phone)}" autocomplete="tel"></div>
        <div class="field"><label>E-mail <span class="field-hint">optioneel</span></label><input id="quickEmail" type="email" value="${esc(c.email)}" autocomplete="email"></div>
        <div class="field"><label>Straat *</label><input id="quickStreet" value="${esc(c.street)}" autocomplete="street-address"></div>
        <div class="field"><label>Huisnummer *</label><input id="quickHouse" value="${esc(c.house_number)}"></div>
        <div class="field"><label>Postcode *</label><input id="quickPostcode" value="${esc(c.postcode)}" autocomplete="postal-code"></div>
        <div class="field"><label>Plaats <span class="field-hint">optioneel</span></label><input id="quickCity" value="${esc(c.city)}" autocomplete="address-level2"></div>
      </div>
      <label class="consent-card" style="margin-top:16px"><input id="quickConsent" type="checkbox" ${visit.consent.contact?'checked':''}><span><strong>Bewoner wil vrijblijvend informatie ontvangen *</strong><p>De bewoner vraagt om teruggebeld te worden over verduurzaming/subsidies en is geïnformeerd over de verwerking van deze contactgegevens. <a class="legal-link" href="privacy.html" target="_blank" rel="noopener">Privacyverklaring</a></p></span></label>
      <div id="validation"></div>
    </div></div>`;
    main.innerHTML=flowShell(content,0,"Deze route is bewust kort. De lead gaat naar uw eigen DW-database. Salesdock voegen we later als tweede bestemming toe.")+actions({onBack:true,onNext:true,next:"Lead opslaan",save:false});
    bind(".legal-link","click",e=>e.stopPropagation());
    wireActions({onBack:renderParticulierChoice,onNext:saveIntegratedQuickLead});
    focusMain();
  }

  function captureIntegratedQuickLead(){
    Object.assign(visit.contact,{
      name:val("quickName"),
      phone:val("quickPhone"),
      email:val("quickEmail"),
      street:val("quickStreet"),
      house_number:val("quickHouse"),
      postcode:val("quickPostcode").toUpperCase(),
      city:val("quickCity")
    });
    visit.campaign=visit.campaign||"VERDUURZAMING-OPDRACHTGEVER-60";
    visit.consent.contact=!!$("#quickConsent")?.checked;
    visit.consent.privacy=visit.consent.contact;
    visit.consent.privacy_version=LEGAL_VERSION;
    visit.consent.captured_at=visit.consent.contact?new Date().toISOString():"";
    visit.notes="Interesselead verduurzaming · geen afspraak gemaakt · terugbelinformatie gevraagd.";
  }

  async function saveIntegratedQuickLead(){
    captureIntegratedQuickLead();
    const errs=[];
    if(!visit.contact.name)errs.push("naam");
    if(!visit.contact.phone)errs.push("telefoonnummer");
    if(!visit.contact.street)errs.push("straat");
    if(!visit.contact.house_number)errs.push("huisnummer");
    if(!visit.contact.postcode)errs.push("postcode");
    if(visit.contact.email&&!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(visit.contact.email))errs.push("geldig e-mailadres");
    if(!visit.consent.contact)errs.push("toestemming voor contact");
    if(errs.length)return showValidation(`Controleer: ${errs.join(", ")}.`);

    const next=$("#flowNext");
    if(next){next.disabled=true;next.textContent="Opslaan…"}
    visit.status="afgerond";
    visit.sync_status="pending";
    persist();

    try{
      const lead=await window.DW_DATA.createLead({
        company:"Particulier",
        contact_name:visit.contact.name,
        email:visit.contact.email||"",
        phone:visit.contact.phone,
        scan_type:"Verduurzaming interesselead",
        status:"Nieuwe lead",
        revenue:0,
        source:"Buitendienst"
      });
      await window.DW_DATA.upsertLeadMeta(lead.id,{
        externalId:visit.id,
        formId:"dw-quick-lead-v1",
        partner:null,
        appointmentStatus:"Geen afspraak",
        appointmentDate:null,
        expectedCommission:60,
        campaign:visit.campaign,
        interests:"Interesse verduurzaming / terugbelinformatie",
        platform:cfg.platformLabel||"DW APP",
        video:null,
        qualification:"Interesselead",
        utmSource:"buitendienst",
        utmMedium:"field-app",
        utmCampaign:visit.campaign,
        utmContent:"quick-lead",
        automationSource:"dw-quick-lead-v1",
        automationStatus:"Ontvangen",
        capturedAt:visit.created_at
      });
      const address=[visit.contact.street,visit.contact.house_number,visit.contact.postcode,visit.contact.city].filter(Boolean).join(" ");
      try{
        const db=window.DW_DATA?.client;
        if(db){
          await db.from("lead_meta").update({address,updated_at:new Date().toISOString()}).eq("lead_id",lead.id);
        }
        await window.DW_DATA.updateLead(lead.id,{notes:[
          "[QUICK_LEAD_START]",
          "Type: Verduurzaming interesselead",
          `Naam: ${visit.contact.name}`,
          `Telefoon: ${visit.contact.phone}`,
          `E-mail: ${visit.contact.email||""}`,
          `Adres: ${address}`,
          `Campagne: ${visit.campaign}`,
          "Geen afspraak gemaakt",
          "Contacttoestemming: Ja",
          "[QUICK_LEAD_EINDE]"
        ].join("\\n")});
      }catch(metaErr){console.warn("Aanvullende quick-lead metadata kon niet volledig worden bijgewerkt.",metaErr)}
      visit.production_lead_id=lead.id;
      visit.sync_status="synced";
      persist();
      renderQuickLeadSuccess();
    }catch(err){
      console.error("QUICK LEAD OPSLAAN FOUT:",err);
      visit.sync_status="pending";
      persist();
      if(next){next.disabled=false;next.textContent="Lead opslaan"}
      showValidation("Opslaan niet gelukt: "+(err?.message||String(err)));
    }
  }

  function renderQuickLeadSuccess(){
    const c=visit.contact||{};
    const address=[c.street,c.house_number,c.postcode,c.city].filter(Boolean).join(" ");
    main.innerHTML=`<div class="screen-card"><div class="screen-head"><div class="screen-number">✓</div><div><span class="kicker">Snelle lead opgeslagen</span><h2>Klaar voor de volgende deur</h2><p>De interesselead staat in uw DW-database. Salesdock kan later als tweede bestemming worden gekoppeld.</p></div></div><div class="screen-body"><div class="callout success"><strong>${esc(c.name)}</strong><br>${esc(c.phone)}<br>${esc(address)}${visit.production_lead_id?`<br><small>DW lead-ID: ${esc(visit.production_lead_id)}</small>`:""}</div><div class="form-grid" style="margin-top:14px"><button id="quickNext" class="primary">Volgende snelle lead</button><button id="quickCopy" class="secondary">Kopieer voor Salesdock</button><button id="quickHome" class="secondary">Terug naar start</button></div></div></div>`;
    hideNav(false);
    $("#quickNext")?.addEventListener("click",()=>{visit=newVisit("particulier");visit.campaign="VERDUURZAMING-OPDRACHTGEVER-60";renderIntegratedQuickLead()});
    $("#quickHome")?.addEventListener("click",renderHome);
    $("#quickCopy")?.addEventListener("click",async()=>{
      const text=[`Naam: ${c.name||""}`,`Telefoon: ${c.phone||""}`,`E-mail: ${c.email||""}`,`Adres: ${address}`,`Campagne: ${visit.campaign||""}`].join("\\n");
      try{await navigator.clipboard.writeText(text);toast("Lead gekopieerd voor Salesdock.")}catch{toast("Kopiëren is niet gelukt.")}
    });
    focusMain();
  }

  function renderContact(){hideNav(true);const b=visit.route==="zakelijk";const noTalk=["Niemand thuis","Geen interesse"].includes(visit.visit_status);const content=`<div class="screen-card"><div class="screen-head"><div class="screen-number">1</div><div><span class="kicker">${b?'Zakelijk bezoek':'Particulier bezoek'}</span><h2>Contact en bezoekstatus</h2><p>Eerst de basis. Bij niemand thuis of geen interesse kun je het bezoek direct afronden.</p></div></div><div class="screen-body">
      <div class="field full"><span class="field-label">Uitkomst aan de deur</span><div class="choice-grid" id="visitStatusChoices">${["Gesprek gevoerd","Afspraak gemaakt","Terugkomen","Niemand thuis","Geen interesse"].map(x=>`<button class="choice ${visit.visit_status===x?'selected':''}" type="button" data-status="${esc(x)}"><span>${esc(x)}</span></button>`).join('')}</div></div>
      <div id="contactFields" class="form-grid" style="margin-top:18px;${noTalk?'opacity:.45;pointer-events:none':''}">
        ${b?`<div class="field full"><label>Bedrijfsnaam *</label><input id="company" value="${esc(visit.contact.company)}" autocomplete="organization"></div><div class="field"><label>KvK-nummer</label><input id="kvk" value="${esc(visit.contact.kvk)}" inputmode="numeric"></div><div class="field"><label>Functie contactpersoon</label><input id="role" value="${esc(visit.contact.role)}"></div>`:''}
        <div class="field ${b?'full':''}"><label>${b?'Naam contactpersoon':'Naam bewoner'} *</label><input id="name" value="${esc(visit.contact.name)}" autocomplete="name"></div>
        <div class="field"><label>E-mailadres *</label><input id="email" type="email" value="${esc(visit.contact.email)}" autocomplete="email"></div><div class="field"><label>Telefoonnummer *</label><input id="phone" type="tel" value="${esc(visit.contact.phone)}" autocomplete="tel"></div>
        <div class="field"><label>Straat</label><input id="street" value="${esc(visit.contact.street)}"></div><div class="field"><label>Huisnummer</label><input id="house" value="${esc(visit.contact.house_number)}"></div><div class="field"><label>Postcode</label><input id="postcode" value="${esc(visit.contact.postcode)}"></div><div class="field"><label>Plaats</label><input id="city" value="${esc(visit.contact.city)}"></div>
        <div class="field full"><label>Campagne / actie <span class="field-hint">optioneel</span></label><input id="campaign" value="${esc(visit.campaign)}" placeholder="Bijv. wijkactie, flyer of campagnecode"></div>
      </div><div id="validation"></div></div></div>`;
    main.innerHTML=flowShell(content,0,"De buitendienst hoeft geen formulieren te zoeken: bron, medewerker en dossier-ID worden automatisch vastgelegd.")+actions({onBack:true,onNext:true,next:noTalk?"Bezoek afronden":"Verder"});
    bind("[data-status]","click",e=>{captureContact();visit.visit_status=e.currentTarget.dataset.status;renderContact()});wireActions({onBack:renderRoute,onSave:captureContact,onNext:()=>{captureContact();if(["Niemand thuis","Geen interesse"].includes(visit.visit_status))return renderQuickClose();const errs=[];if(b&&!visit.contact.company)errs.push("bedrijfsnaam");if(!visit.contact.name)errs.push("naam");if(!visit.contact.email||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(visit.contact.email))errs.push("geldig e-mailadres");if(!visit.contact.phone)errs.push("telefoonnummer");if(errs.length)return showValidation(`Controleer: ${errs.join(', ')}.`);b?renderBusinessProduct():renderHomeProducts()}});focusMain()
  }
  function captureContact(){if(!visit)return;Object.assign(visit.contact,{company:val("company"),kvk:val("kvk"),role:val("role"),name:val("name"),email:val("email"),phone:val("phone"),street:val("street"),house_number:val("house"),postcode:val("postcode").toUpperCase(),city:val("city")});visit.campaign=val("campaign")||visit.campaign}
  function showValidation(msg){const x=$("#validation");if(x){x.className="validation";x.textContent=msg}}

  function renderQuickClose(){visit.notes=visit.notes||"";const content=`<div class="screen-card"><div class="screen-head"><div class="screen-number">✓</div><div><span class="kicker">Snelle registratie</span><h2>${esc(visit.visit_status)}</h2><p>Geen scan nodig. Voeg eventueel een korte notitie toe en sla het bezoek op.</p></div></div><div class="screen-body"><div class="field"><label>Notitie</label><textarea id="quickNote" placeholder="Bijv. later terugkomen, sticker op deur, geen interesse in verduurzaming...">${esc(visit.notes)}</textarea></div></div></div>`;main.innerHTML=flowShell(content,0)+actions({onBack:true,onNext:true,next:"Bezoek opslaan",save:false});wireActions({onBack:renderContact,onNext:()=>{visit.notes=val("quickNote");finish()}})}

  function renderBusinessProduct(){const content=`<div class="screen-card business-scan-choice"><div class="screen-head"><div class="screen-number">2</div><div><span class="kicker">Zakelijke route</span><h2>Welke scan wilt u starten?</h2><p>Kies de route die aansluit op de vraag van het bedrijf.</p></div></div><div class="screen-body"><div class="business-scan-grid"><article class="biz-scan-card biz-scan-ai"><div class="biz-scan-band" aria-hidden="true"></div><div class="biz-scan-content"><span class="biz-scan-label">AI & automatisering</span><h3>AI Efficiency Scan</h3><p>Breng tijdverlies, terugkerend werk en kansen voor slimme automatisering overzichtelijk in kaart.</p><div class="biz-scan-tags"><span>12 gerichte vragen</span><span>Persoonlijke analyse</span></div></div><button class="primary bizProduct biz-scan-button" data-product="ai">Start AI Efficiency Scan</button></article><article class="biz-scan-card biz-scan-energy"><div class="biz-scan-band" aria-hidden="true"></div><div class="biz-scan-content"><span class="biz-scan-label">Energie & compliance</span><h3>Energieplichtscan</h3><p>Breng energiegebruik, relevante grenswaarden en mogelijke vervolgstappen voor het bedrijf gestructureerd in kaart.</p><div class="biz-scan-tags"><span>Bedrijfscheck</span><span>Route op basis van antwoorden</span></div></div><button class="primary bizProduct biz-scan-button" data-product="energie">Start Energieplichtscan</button></article></div></div></div>`;main.innerHTML=flowShell(content,1)+actions({onBack:true,onNext:false});bind(".bizProduct","click",e=>{visit.product=e.currentTarget.dataset.product;prepareBusinessQueue();renderQuestion()});wireActions({onBack:renderContact});focusMain()}
  function prepareBusinessQueue(){queue=(visit.product==="ai"?scans.ai:scans.energy).map((q,i)=>({...q,section:visit.product==="ai"?"AI Efficiency Scan":"Energie & Compliance",index:i}));qIndex=0}

  const homeProducts=[
    ["Isolatie & schil",["Vloerisolatie","Bodemisolatie","Spouwmuurisolatie","Dakisolatie","Gevelisolatie","HR++ glas","Triple glas","Kunststof kozijnen"]],
    ["Elektrisch verduurzamen",["Zonnepanelen","Thuisbatterij","Warmtepomp","Hybride warmtepomp","Vloerverwarming","Laadpaal","Airco","Zonneboiler","Elektrisch koken"]]
  ];
  function renderHomeProducts(){visit.product="woningcheck";const content=`<div class="screen-card"><div class="screen-head"><div class="screen-number">2</div><div><span class="kicker">Woningcheck</span><h2>Wat wil de bewoner bekijken?</h2><p>Je kunt meerdere maatregelen aantikken. Alleen de bijbehorende bestaande vervolgvragen komen daarna in beeld.</p></div></div><div class="screen-body"><div class="product-grid">${homeProducts.map(([g,items])=>`<div class="product-group-title">${esc(g)}</div>${items.map(p=>`<button type="button" class="product-choice ${visit.products.includes(p)?'selected':''}" data-product="${esc(p)}"><strong>${esc(p)}</strong><small>${productHint(p)}</small></button>`).join('')}`).join('')}</div><div id="validation"></div></div></div>`;main.innerHTML=flowShell(content,1,"Tik alleen aan wat de klant echt wil bespreken. De app bouwt daarna automatisch de juiste vragenlijst.")+actions({onBack:true,onNext:true,next:"Woningcheck starten",status:`${visit.products.length} gekozen`});bind("[data-product]","click",e=>{
      const p=e.currentTarget.dataset.product;
      const button=e.currentTarget;
      visit.products=visit.products.includes(p)?visit.products.filter(x=>x!==p):[...visit.products,p];
      button.classList.toggle("selected",visit.products.includes(p));
      const status=document.querySelector(".mini-status");
      if(status)status.textContent=`${visit.products.length} gekozen`;
      persist();
    });wireActions({onBack:renderContact,onSave:()=>{},onNext:()=>{if(!visit.products.length)return showValidation("Kies minimaal één maatregel.");prepareHomeQueue();renderQuestion()}});focusMain()}
  function productHint(p){if(/isolatie|glas|kozijn/i.test(p))return"Woning & bouwkundige situatie";if(/warmtepomp|vloerverwarming|airco/i.test(p))return"Comfort & verwarming";if(/batterij|zonne|laad|elektrisch/i.test(p))return"Elektrisch & energie";return"Productvragen"}

  function mapProductKeys(){const s=visit.products||[],keys=[];if(s.some(x=>/isolatie/i.test(x)))keys.push("isolatie");if(s.some(x=>/glas|kozijn/i.test(x)))keys.push("kunststof_kozijnen");if(s.some(x=>/warmtepomp/i.test(x)))keys.push("warmtepomp");if(s.includes("Thuisbatterij"))keys.push("thuisbatterij");if(s.includes("Laadpaal"))keys.push("laadpaal");if(s.includes("Airco"))keys.push("airco");if(s.includes("Vloerverwarming"))keys.push("vloerverwarming");if(s.includes("Elektrisch koken"))keys.push("elektra");return[...new Set(keys)]}
  function legacyHomeTechnical(){const s=visit.products||[],q=[];if(s.some(x=>/isolatie/i.test(x)))q.push({id:"existing_insulation_quick",label:"Wat is al geïsoleerd?",type:"single",required:false,options:["Nog niets / onbekend","Vloer","Spouw / muren","Dak","HR++ of triple glas","Meerdere onderdelen"],section:"Snelle woningopname"});if(s.some(x=>/Vloerisolatie|Bodemisolatie/.test(x)))q.push(
      {id:"crawlspace",label:"Is er een kruipruimte aanwezig?",type:"single",required:false,options:["Ja","Nee","Moet nog gecontroleerd worden"],section:"Snelle woningopname"},
      {id:"crawlspace_height",label:"Wat is de hoogte / diepte van de kruipruimte?",type:"single",required:false,options:["Minder dan 30 cm","30–50 cm","50–80 cm","Meer dan 80 cm","Onbekend"],section:"Snelle woningopname"},
      {id:"crawlspace_water",label:"Staat er water in de kruipruimte?",type:"single",required:false,options:["Ja, regelmatig","Soms / na veel regen","Nee","Onbekend"],section:"Snelle woningopname"},
      {id:"crawlspace_access",label:"Is het kruipluik bereikbaar?",type:"single",required:false,options:["Ja","Nee","Onbekend"],section:"Snelle woningopname"},
      {id:"floor_material",label:"Wat is het materiaal van de vloer?",type:"single",required:false,options:["Hout","Beton","Onbekend"],section:"Snelle woningopname"}
    );if(s.some(x=>/HR\+\+|Triple|Kunststof kozijnen/.test(x)))q.push({id:"windows_quick",label:"Welk glas is nu aanwezig?",type:"single",required:false,options:["Enkel glas","Dubbel glas","HR++ glas","Triple glas","Onbekend"],section:"Snelle woningopname"});if(s.some(x=>/Zonnepanelen|Thuisbatterij/.test(x)))q.push({id:"solar_panels_quick",label:"Hoeveel zonnepanelen zijn er ongeveer?",type:"single",required:false,options:["Geen","1–8","9–15","Meer dan 15","Onbekend"],section:"Snelle elektrische check"},{id:"feed_in_costs",label:"Zijn er terugleverkosten?",type:"single",required:false,options:["Ja","Nee","Onbekend"],section:"Snelle elektrische check"});if(s.includes("Laadpaal"))q.push({id:"electric_driving",label:"Hoe zit het met elektrisch rijden?",type:"single",required:false,options:["Ja, laadpaal nodig","Ja, laadpaal aanwezig","Binnen 12 maanden van plan","Nee"],section:"Snelle elektrische check"});if(s.some(x=>/Zonnepanelen|Thuisbatterij|Warmtepomp|Laadpaal|Airco|Elektrisch koken/.test(x)))q.push({id:"meter_box_quick",label:"Is de groepenkast / aansluiting bekend?",type:"single",required:false,options:["1-fase","3-fase","Onbekend"],section:"Snelle elektrische check"});return q}
  function prepareHomeQueue(){const arr=scans.woningBase.map(q=>({...q,section:"Woning"}));arr.push(...legacyHomeTechnical());for(const key of mapProductKeys()){const title={isolatie:"Isolatie",kunststof_kozijnen:"Glas & kozijnen",warmtepomp:"Warmtepomp",thuisbatterij:"Thuisbatterij",laadpaal:"Laadpaal",airco:"Airco",vloerverwarming:"Vloerverwarming",elektra:"Elektra"}[key]||key;for(const q of (scans.productQuestions[key]||[])){arr.push({id:`${key}.${q.question_key}`,label:q.question_text,type:q.answer_type==="select"?"single":q.answer_type==="multiselect"?"multi":q.answer_type,required:!!q.required,options:q.options||[],section:title,placeholder:""})}}arr.push(...scans.woningQualification.map(q=>({...q,section:"Kwalificatie"})),...scans.woningFollowup.map(q=>({...q,section:"Vervolg"})));queue=arr;qIndex=0}
  function questionRelevant(q){if(!q||visit.product!=="woningcheck")return true;const follow=visit.answers.follow_up;if(q.id==="appointment_type")return follow==="Direct afspraak";if(q.id==="preferred_date"||q.id==="preferred_time")return follow==="Direct afspraak"||follow==="Telefonisch terugbellen";return true}

  function renderQuestion(){hideNav(true);while(queue[qIndex]&&!questionRelevant(queue[qIndex]))qIndex++;const q=queue[qIndex];if(!q)return renderDossier();const stage=visit.route==="particulier"?2:1;const answered=visit.answers[q.id];const req=q.required?'<span class="required">Verplicht</span>':'<span>Optioneel · mag worden overgeslagen</span>';const input=questionInput(q,answered);const quickSkip=!q.required?`<button type="button" id="skipQuestion" class="secondary" style="margin-top:14px;width:auto;min-height:44px">Weet ik niet / later aanvullen</button>`:"";const scanClass=visit.product==="ai"?"scan-ai":visit.product==="energie"?"scan-energy":"scan-home";const content=`<div class="screen-card scan-screen ${scanClass}"><div class="screen-head"><div class="screen-number">${qIndex+1}</div><div><span class="kicker">${esc(q.section||'Scan')}</span><h2>${esc(visit.product==="woningcheck"?'Woningcheck':visit.product==="ai"?'AI Efficiency Scan':'Energie & Compliance')}</h2><p>Bespreek de vraag samen met de klant en leg het antwoord direct vast.</p></div></div><div class="screen-body"><div class="question-wrap"><div class="question-meta"><span>Vraag ${qIndex+1} van ${queue.length}</span>${req}</div><h3 class="question-title">${esc(q.label)}</h3>${q.hint?`<p class="question-hint">${esc(q.hint)}</p>`:''}${input}${quickSkip}<div id="validation"></div><div class="help-row"><span class="help-dot"></span><span>Je kunt met Terug altijd een antwoord corrigeren.</span></div></div></div></div>`;main.innerHTML=flowShell(content,stage,`${q.section||'Scan'} · alleen relevante vragen worden getoond.`)+actions({onBack:true,onNext:true,next:qIndex===queue.length-1?"Naar dossier":"Volgende",status:`${qIndex+1}/${queue.length}`});bindChoices(q);$("#skipQuestion")?.addEventListener("click",()=>{delete visit.answers[q.id];delete visit.answer_labels[q.id];persist();if(qIndex<queue.length-1){do{qIndex++}while(qIndex<queue.length&&!questionRelevant(queue[qIndex]));if(qIndex<queue.length)renderQuestion();else renderDossier()}else renderDossier()});wireActions({onBack:()=>{captureQuestion(q);if(qIndex===0)return visit.route==="particulier"?renderHomeProducts():renderBusinessProduct();do{qIndex--}while(qIndex>0&&!questionRelevant(queue[qIndex]));renderQuestion()},onSave:()=>captureQuestion(q),onNext:()=>{captureQuestion(q);const ans=visit.answers[q.id];if(q.required&&(ans===undefined||ans===null||ans===""||(Array.isArray(ans)&&!ans.length)))return showValidation("Kies of vul een antwoord in om verder te gaan.");if(qIndex<queue.length-1){do{qIndex++}while(qIndex<queue.length&&!questionRelevant(queue[qIndex]));if(qIndex<queue.length)renderQuestion();else renderDossier()}else renderDossier()}});focusQuestion()}
  function questionInput(q,a){if(q.type==="single"||q.type==="multi")return `<div class="choice-grid">${(q.options||[]).map(o=>{const sel=q.type==="multi"?Array.isArray(a)&&a.includes(o):a===o;return `<button type="button" class="choice ${q.type==='multi'?'multi':''} ${sel?'selected':''}" data-value="${esc(o)}"><span>${esc(o)}</span></button>`}).join('')}</div>`;if(q.type==="textarea")return `<div class="question-input"><textarea id="questionValue" placeholder="${esc(q.placeholder||'Typ het antwoord')}">${esc(a||'')}</textarea></div>`;if(q.type==="date")return `<div class="question-input"><input id="questionValue" type="date" value="${esc(a||'')}"></div>`;const type=q.type==="number"?"number":"text";return `<div class="question-input ${q.prefix?'input-prefix':''}">${q.prefix?`<span>${esc(q.prefix)}</span>`:''}<input id="questionValue" type="${type}" value="${esc(a??'')}" placeholder="${esc(q.placeholder||(type==='number'?'Alleen invullen als bekend':'Typ het antwoord'))}" ${type==='number'?'inputmode="decimal"':''}></div>`}
  function bindChoices(q){
    if(q.type==="single")bind("[data-value]","click",e=>{
      visit.answers[q.id]=e.currentTarget.dataset.value;
      visit.answer_labels[q.id]=q.label;
      persist();
      document.querySelectorAll("[data-value]").forEach(b=>b.classList.toggle("selected",b===e.currentTarget));
    });
    if(q.type==="multi")bind("[data-value]","click",e=>{
      const v=e.currentTarget.dataset.value,arr=Array.isArray(visit.answers[q.id])?[...visit.answers[q.id]]:[];
      visit.answers[q.id]=arr.includes(v)?arr.filter(x=>x!==v):[...arr,v];
      visit.answer_labels[q.id]=q.label;
      persist();
      e.currentTarget.classList.toggle("selected",visit.answers[q.id].includes(v));
    })
  }
  function captureQuestion(q){if(["single","multi"].includes(q.type))return;const x=$("#questionValue");if(!x)return;visit.answers[q.id]=x.value;visit.answer_labels[q.id]=q.label;persist()}

  function energyRoute(){if(visit.product!=="energie")return"";const band=visit.answers.annual_energy_band,high=visit.answers.very_high_use;if(high==="Ja"||high==="Onbekend")return"Aanvullende beoordeling grootverbruik";if(band?.startsWith("Minder dan")&&high==="Nee")return"Energie-Efficiëntie Pre-Scan €450";if((band?.startsWith("Vanaf")||band?.startsWith("Onbekend"))&&high==="Nee")return"Compliance Pre-Scan €950";return"Nog te bepalen"}
  function renderDossier(){visit.energy_route=energyRoute();const p=visit.route==="particulier";const e=visit.product==="energie";const ai=visit.product==="ai";const route=e?`<div class="route-result"><div class="result-icon">→</div><div><h3>${esc(visit.energy_route)}</h3><p>${energyRouteText()}</p></div></div>`:'';const content=`<div class="screen-card"><div class="screen-head"><div class="screen-number">${p?'4':'3'}</div><div><span class="kicker">Dossier</span><h2>Foto's, notities en toestemming</h2><p>Alles op één plek. Geen losse stukken meer onder elkaar geplakt.</p></div></div><div class="screen-body">${route}<div class="form-grid" style="margin-top:${route?'18px':'0'}"><div class="field full"><label>Notities medewerker</label><textarea id="notes" placeholder="Bijzonderheden, terugbelmoment, technische aandachtspunten...">${esc(visit.notes)}</textarea></div><div class="field full"><label>Foto's <span class="field-hint">maximaal 4 per dossier</span></label><div class="upload-zone"><input id="photos" type="file" accept="image/*" multiple><label for="photos">Foto toevoegen</label><p>Foto's worden automatisch verkleind voor een vlot dossier.</p></div><div id="photoGrid" class="photo-grid">${photoHtml()}</div></div></div>
      <div class="section"><span class="field-label">Toestemming</span><label class="consent-card"><input id="consentPrivacy" type="checkbox" ${visit.consent.privacy?'checked':''}><span><strong>Privacyverklaring</strong><p>De klant heeft kennisgenomen van de privacy-informatie voor het behandelen van deze aanvraag. <a class="legal-link" href="privacy.html" target="_blank" rel="noopener" style="color:#1764c0;text-decoration:underline;text-underline-offset:3px;font-weight:800">Lees privacyverklaring</a></p></span></label><label class="consent-card"><input id="consentContact" type="checkbox" ${visit.consent.contact?'checked':''}><span><strong>Contact over deze aanvraag</strong><p>De klant geeft toestemming om contact op te nemen over het gekozen vervolg.</p></span></label><label class="consent-card"><input id="consentPhotos" type="checkbox" ${visit.consent.photos?'checked':''}><span><strong>Foto's voor het dossier</strong><p>De klant geeft toestemming om tijdens dit bezoek foto's te maken en deze beveiligd bij het dossier op te slaan. Foto's worden alleen gedeeld als daarvoor apart toestemming is gegeven.</p></span></label><div style="margin:10px 0 4px;padding:12px 14px;border:1px solid #dce5ee;border-radius:12px;background:#f8fbfe;color:#536582;font-size:13px"><strong style="color:#18304f">Juridische informatie:</strong> <a class="legal-link" href="privacy.html" target="_blank" rel="noopener" style="color:#1764c0;font-weight:800">Privacyverklaring</a> · <a class="legal-link" href="voorwaarden.html" target="_blank" rel="noopener" style="color:#1764c0;font-weight:800">Algemene Voorwaarden</a></div>
      ${p?`<label class="consent-card"><input id="consentReport" type="checkbox" ${visit.consent.report_email?'checked':''}><span><strong>Persoonlijk rapport per e-mail</strong><p>De bewoner wil het persoonlijke Woningcheckrapport per e-mail ontvangen.</p></span></label><label class="consent-card"><input id="consentExtendedReport" type="checkbox" ${visit.consent.extended_report_email?'checked':''}><span><strong>Uitgebreide productrapporten per e-mail</strong><p>De bewoner wil voor gekozen producten ook de uitgebreide rapporten ontvangen.</p></span></label><label class="consent-card"><input id="consentPartner" type="checkbox" ${visit.consent.share_partner?'checked':''}><span><strong>Gegevens delen met partner</strong><p>Aparte toestemming om relevante gegevens met geselecteerde verduurzamingsspecialisten te delen.</p></span></label>`:''}
      ${ai?`<div class="callout" style="margin-top:12px">De AI-scan wordt gebruikt als basis voor het persoonlijke rapport en eventuele bespreking met een AI-expert. Uitkomsten blijven een eerste analyse en geen gegarandeerde besparing.</div>`:''}
      ${e?energyConsentHtml():''}</div><div id="validation"></div></div></div>`;main.innerHTML=flowShell(content,p?3:2,"Controleer toestemming en dossier vóór afronding.")+actions({onBack:true,onNext:true,next:"Dossier controleren"});$("#photos")?.addEventListener("change",handlePhotos);bind(".legal-link","click",e=>e.stopPropagation());bind("[data-remove-photo]","click",e=>{visit.photos.splice(Number(e.currentTarget.dataset.removePhoto),1);renderDossier()});wireActions({onBack:()=>{captureDossier();qIndex=Math.max(0,queue.length-1);while(qIndex>0&&!questionRelevant(queue[qIndex]))qIndex--;renderQuestion()},onSave:captureDossier,onNext:()=>{captureDossier();if(!visit.consent.privacy)return showValidation("Leg eerst vast dat de privacy-informatie is besproken.");if(visit.photos.length&&!visit.consent.photos)return showValidation("Leg eerst toestemming vast voor het maken en opslaan van de dossierfoto's.");if(e&&!visit.consent.terms)return showValidation("Voor de Energie & Compliance-route moet akkoord met de voorwaarden worden vastgelegd.");if(e&&!visit.consent.assignment)return showValidation("Leg ook het akkoord voor de gekozen vervolgroute vast.");renderReview()}});focusMain()}
  function energyRouteText(){if(visit.energy_route.includes("€450"))return"Route onder beide grenswaarden. Gericht op praktische energiebesparing, quick wins, gebouw en installaties.";if(visit.energy_route.includes("€950"))return"Route vanaf de relevante grenswaarden of bij onbekend jaarverbruik. Gericht op mogelijke verplichtingen, aandachtspunten en besparingsmogelijkheden.";if(visit.energy_route.includes("grootverbruik"))return"Bij zeer hoog of onzeker grootverbruik volgt eerst een inhoudelijke beoordeling voordat een standaardroute of prijs wordt bevestigd.";return"De route wordt na controle definitief bepaald."}
  function energyConsentHtml(){const r=visit.energy_route;let text=r.includes("€450")?"Ja, ik geef opdracht voor de Energie-Efficiëntie Pre-Scan voor €450 excl. btw.":r.includes("€950")?"Ja, ik geef opdracht voor de Compliance Pre-Scan voor €950 excl. btw.":"Ja, ik wil dat DW Marketing de aanvraag beoordeelt en contact opneemt over de passende vervolgstap.";return `<label class="consent-card"><input id="consentTerms" type="checkbox" ${visit.consent.terms?'checked':''}><span><strong>Algemene voorwaarden</strong><p>De klant heeft de Algemene Voorwaarden gelezen en gaat hiermee akkoord. <a class="legal-link" href="voorwaarden.html" target="_blank" rel="noopener" style="color:#1764c0;text-decoration:underline;text-underline-offset:3px;font-weight:800">Lees voorwaarden</a></p></span></label><label class="consent-card"><input id="consentAssignment" type="checkbox" ${visit.consent.assignment?'checked':''}><span><strong>Akkoord vervolgroute</strong><p>${esc(text)}</p></span></label><div class="callout warn" style="margin-top:12px"><strong>Disclaimer</strong><br>Deze pre-scan is een onafhankelijke commerciële inventarisatie en vervangt geen beschikking, juridisch advies of formele rapportage van een bevoegd gezag.</div>`}
  function captureDossier(){visit.notes=val("notes");visit.consent.privacy=!!$("#consentPrivacy")?.checked;visit.consent.contact=!!$("#consentContact")?.checked;visit.consent.photos=!!$("#consentPhotos")?.checked;visit.consent.report_email=!!$("#consentReport")?.checked;visit.consent.extended_report_email=!!$("#consentExtendedReport")?.checked;visit.consent.share_partner=!!$("#consentPartner")?.checked;visit.consent.terms=!!$("#consentTerms")?.checked;visit.consent.assignment=!!$("#consentAssignment")?.checked;visit.consent.privacy_version=LEGAL_VERSION;visit.consent.terms_version=LEGAL_VERSION;if(visit.consent.privacy||visit.consent.contact||visit.consent.photos||visit.consent.terms||visit.consent.assignment||visit.consent.report_email||visit.consent.share_partner)visit.consent.captured_at=new Date().toISOString()}
  function photoHtml(){return (visit.photos||[]).map((p,i)=>`<div class="photo-card"><img src="${p.data}" alt="Bezoekfoto ${i+1}"><button type="button" data-remove-photo="${i}">×</button></div>`).join('')}
  async function handlePhotos(e){const files=Array.from(e.target.files||[]).filter(f=>f.type.startsWith("image/")).slice(0,Math.max(0,4-visit.photos.length));for(const f of files){try{visit.photos.push({name:f.name,data:await compressImage(f)})}catch{}}persist();renderDossier()}
  function compressImage(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const max=1100,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext("2d").drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL("image/jpeg",.72))};img.src=reader.result};reader.readAsDataURL(file)})}

  function renderReview(){const p=visit.route==="particulier";const who=p?visit.contact.name:(visit.contact.company||visit.contact.name);const answers=Object.entries(visit.answer_labels).map(([id,label])=>answerRow(label,visit.answers[id])).join('');const content=`<div class="review-hero"><small>Controle vóór opslaan</small><h2>${esc(who||'Nieuw dossier')}</h2><p>${esc(productLabel())} · ${esc(visit.employee)} · bron: buitendienst</p></div><div class="summary-grid"><div class="summary-card"><span>Contact</span><strong>${esc(visit.contact.email)}<br>${esc(visit.contact.phone)}</strong></div><div class="summary-card"><span>Adres</span><strong>${esc([visit.contact.street,visit.contact.house_number,visit.contact.postcode,visit.contact.city].filter(Boolean).join(' '))||'—'}</strong></div>${p?`<div class="summary-card"><span>Maatregelen</span><strong>${esc(visit.products.join(', '))}</strong></div>`:''}${visit.product==="energie"?`<div class="summary-card"><span>Route</span><strong>${esc(visit.energy_route)}</strong></div>`:''}<div class="summary-card"><span>Dossier</span><strong>${visit.photos.length} foto('s) · ${visit.photos.length?(visit.consent.photos?'fototoestemming vastgelegd':'fototoestemming ontbreekt'):"geen foto\'s"} · ${visit.consent.privacy?'privacy besproken':'privacy ontbreekt'}</strong></div></div>${p?installerPreviewHtml():''}<section class="review-section"><h3>Scanantwoorden</h3><div class="answer-list">${answers||'<p class="field-hint">Geen scanantwoorden.</p>'}</div></section>${visit.notes?`<section class="review-section"><h3>Notities</h3><p>${esc(visit.notes)}</p></section>`:''}<div class="callout success" style="margin-top:16px"><strong>Klaar voor opslaan.</strong><br>${window.DW_PRODUCTION?.mode?.()==="live"?"Dit dossier wordt na bevestiging naar DW Business Platform geschreven.":window.DW_PRODUCTION?.mode?.()==="pilot"?"PILOTTEST: alleen een beheerder met een Gmail-testalias met +fieldtest kan deze Woningcheck echt naar productie schrijven.":window.DW_PRODUCTION?.mode?.()==="check"?"Controlemodus: de productieverbinding wordt getest, maar er worden geen leads geschreven.":"Veilige testmodus: er wordt niets naar productie verstuurd."}</div>`;main.innerHTML=flowShell(content,p?4:3,"Dit controlescherm is bewust compact: medewerker en klant zien in één oogopslag wat wordt opgeslagen.")+actions({onBack:true,onNext:true,next:"Bezoek afronden",status:"Controle voltooid"});wireActions({onBack:renderDossier,onSave:()=>{},onNext:finish});focusMain()}
  function installerPreviewHtml(){
    if(!visit || visit.route!=="particulier")return "";
    const allowed=!!visit.consent?.share_partner;
    const photoCount=visit.consent?.photos?(visit.photos||[]).length:0;
    return `<section class="review-section installer-preview"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><span class="kicker">Installateurdossier</span><h3 style="margin:.35rem 0">${allowed?'Voorbereid voor beheerder':'Nog niet vrijgegeven'}</h3></div><span class="pill ${allowed?'success':'warn'}">${allowed?'DEELTOESTEMMING':'GEEN DEELTOESTEMMING'}</span></div><p>${allowed?'Relevante klantgegevens, gekozen maatregelen en productantwoorden mogen door de beheerder worden gebruikt voor een geselecteerde verduurzamingsspecialist.':'Er worden geen klantgegevens met een installateur gedeeld zolang de bewoner geen aparte deeltoestemming geeft.'}</p><div class="answer-list"><div class="answer-row"><span>Klant & adres</span><span>${allowed?'Opnemen':'Niet delen'}</span></div><div class="answer-row"><span>Gekozen maatregelen</span><span>${allowed?esc((visit.products||[]).join(', ')||'—'):'Niet delen'}</span></div><div class="answer-row"><span>Dossierfoto's</span><span>${allowed&&photoCount?`${photoCount} foto('s) beschikbaar`:'Niet delen'}</span></div><div class="answer-row"><span>Interne medewerkersnotities</span><span>Nooit opnemen</span></div></div></section>`;
  }

  function answerRow(label,value){const v=Array.isArray(value)?value.join(", "):value;return `<div class="answer-row"><span>${esc(label)}</span><span>${esc(v||'—')}</span></div>`}
  function productLabel(){if(visit.product==="woningcheck")return"Woningcheck";if(visit.product==="ai")return"AI Efficiency Scan";if(visit.product==="energie")return"Energie & Compliance Pre-Scan";return"Dossier"}

  async function finish(){
    visit.status="afgerond";
    visit.sync_status="local";
    persist();

    let msg="Lokaal opgeslagen.";
    try{
      const result=await window.DW_PRODUCTION.saveVisit(visit);
      if(result.skipped){
        visit.sync_status="not-a-lead";
        msg=result.message;
      }else if(result.dryRun){
        visit.sync_status="checked";
        msg=result.message;
      }else{
        visit.sync_status="synced";
        visit.production_lead_id=result.leadId||visit.production_lead_id;
        msg=result.message||"Dossier staat in DW Business Platform.";
      }
    }catch(err){
  console.error("DW PRODUCTIE SYNC FOUT:", err);
  visit.sync_status="pending";
  msg=`SYNC FOUT: ${err?.message || String(err)}`;
}
    persist();

    main.innerHTML=`<div class="screen-card"><div class="screen-head"><div class="screen-number">✓</div><div><span class="kicker">Bezoek afgerond</span><h2>Dossier veilig opgeslagen</h2><p>${esc(msg)}</p></div></div><div class="screen-body"><div class="callout success"><strong>${esc(visit.route==='zakelijk'?(visit.contact.company||visit.contact.name):visit.contact.name)}</strong><br>${esc(productLabel())}${visit.production_lead_id?`<br><small>DW lead-ID: ${esc(visit.production_lead_id)}</small>`:""}</div><div class="form-grid" style="margin-top:14px"><button id="newAgain" class="primary">Nieuw bezoek</button><button id="allVisits" class="secondary">Alle bezoeken</button>${visit.sync_status==="pending"?'<button id="retrySync" class="secondary">Opnieuw synchroniseren</button>':""}<button id="exportVisit" class="secondary">Dossier exporteren</button></div></div></div>`;
    hideNav(false);
    $("#newAgain").onclick=renderRoute;
    $("#allVisits").onclick=()=>renderVisits(false);
    $("#retrySync")?.addEventListener("click",async()=>{visit.status="afgerond";await finish()});
    $("#exportVisit").onclick=()=>download(visit,`dw-dossier-${visit.id}.json`);
    focusMain();
  }

  function renderVisits(draftsOnly=false){setNav(draftsOnly?"drafts":"visits");const rows=load().filter(v=>draftsOnly?v.status==="concept":true);main.innerHTML=`<section class="section"><div class="section-head"><div><span class="kicker">${draftsOnly?'Concepten':'Dossiers'}</span><h2>${draftsOnly?'Openstaande bezoeken':'Alle lokale bezoeken'}</h2><p>${draftsOnly?'Hervat een dossier zonder opnieuw te beginnen.':'Lokale bezoekhistorie op dit apparaat.'}</p></div><button id="newFromList" class="primary">Nieuw bezoek</button></div>${rows.length?rows.map(rowHtml).join(''):`<div class="empty">Nog geen ${draftsOnly?'concepten':'bezoeken'}.</div>`}</section>`;$("#newFromList").onclick=renderRoute;bind("[data-open]","click",e=>openVisit(e.currentTarget.dataset.open));bind("[data-delete]","click",e=>{if(confirm("Dit lokale dossier verwijderen?")){saveAll(load().filter(v=>v.id!==e.currentTarget.dataset.delete));renderVisits(draftsOnly)}});focusMain()}
  function rowHtml(v){
    const who=v.route==="zakelijk"?(v.contact.company||v.contact.name):v.contact.name;
    const sync=v.sync_status==="synced"?" · ✓ DW Platform":v.sync_status==="pending"?" · ⟳ wacht op sync":v.sync_status==="checked"?" · controlemodus":v.sync_status==="not-a-lead"?" · geen lead":"";
    return `<article class="visit-row"><div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h4>${esc(who||'Onbekend')}</h4><span class="pill ${v.status==='afgerond'?'success':'warn'}">${v.status==='afgerond'?'Afgerond':'Concept'}</span></div><p>${esc(v.product==='ai'?'AI Efficiency Scan':v.product==='energie'?'Energie & Compliance':v.product==='woningcheck'?'Woningcheck':v.visit_status)} · ${esc(fmt(v.updated_at))} · ${esc(v.employee||'')}${esc(sync)}</p></div><div style="display:flex;gap:7px"><button class="secondary" data-open="${esc(v.id)}">Open</button><button class="danger" data-delete="${esc(v.id)}">×</button></div></article>`;
  }
  function openVisit(id){const v=load().find(x=>x.id===id);if(!v)return;visit=v;if(v.status==="concept"){if(!v.product)return renderContact();rebuildQueue();return renderReview()}const who=v.route==="zakelijk"?(v.contact.company||v.contact.name):v.contact.name;main.innerHTML=`<div class="screen-card"><div class="screen-head"><div class="screen-number">✓</div><div><span class="kicker">Opgeslagen dossier</span><h2>${esc(who)}</h2><p>${esc(v.product==='woningcheck'?'Woningcheck':v.product==='ai'?'AI Efficiency Scan':'Energie & Compliance')}</p></div></div><div class="screen-body"><div class="summary-grid"><div class="summary-card"><span>Status</span><strong>${esc(v.status)}</strong></div><div class="summary-card"><span>Datum</span><strong>${esc(fmt(v.updated_at))}</strong></div><div class="summary-card"><span>Medewerker</span><strong>${esc(v.employee)}</strong></div><div class="summary-card"><span>Bron</span><strong>${esc(v.source)}</strong></div></div><div class="flow-actions" style="position:static"><button id="backList" class="secondary">Terug</button><span class="spacer"></span><button id="exportOne" class="primary">Exporteren</button></div></div></div>`;$("#backList").onclick=()=>renderVisits(false);$("#exportOne").onclick=()=>download(v,`dw-dossier-${v.id}.json`)}
  function rebuildQueue(){if(visit.product==="woningcheck")prepareHomeQueue();else prepareBusinessQueue()}

  function renderSettings(){
    setNav("settings");
    const mode=window.DW_PRODUCTION?.mode?.()||"local";
    main.innerHTML=`<div class="screen-card"><div class="screen-head"><div class="screen-number">⚙</div><div><span class="kicker">Instellingen</span><h2>Field App</h2><p>Versie ${esc(cfg.APP_VERSION||'4.0.0')} · integratiemodus: ${esc(mode)}</p></div></div><div class="screen-body">
      <div class="form-grid">
        <div class="field"><label>Naam medewerker</label><input id="employeeName" value="${esc(employee())}"></div>
        <div class="field"><label>Integratiemodus</label><input value="${esc(mode)}" disabled></div>
        <div class="field full"><div class="callout ${mode==="live"?"success":"warn"}"><strong>Productielaag</strong><br>${mode==="live"?"Live schrijven is ingeschakeld. Gebruik dit alleen na succesvolle systeemcheck.":mode==="pilot"?"Gecontroleerde Woningcheck-pilottest: alleen beheerder + Gmail-alias met +fieldtest mag schrijven.":mode==="check"?"Controlemodus: wel verbinden, niets schrijven.":"Lokale testmodus: Supabase blijft onaangeraakt."}</div></div>
      </div>
      <div class="flow-actions" style="position:static"><button id="runSystemCheck" class="secondary">Systeemcheck uitvoeren</button><span class="spacer"></span><button id="saveSettings" class="primary">Lokale naam opslaan</button></div>
      <div id="systemCheckResults" class="system-check-list"></div>
    </div></div>`;
    $("#saveSettings").onclick=()=>{storageSet(EMP,val("employeeName")||"Medewerker");$("#menuEmployee").textContent=employee();toast("Instellingen opgeslagen.")};
    $("#runSystemCheck").onclick=async()=>{
      const host=$("#systemCheckResults");
      host.innerHTML='<div class="callout">Systeemcheck wordt uitgevoerd…</div>';
      const checks=await window.DW_PRODUCTION.systemCheck();
      host.innerHTML=checks.map(c=>`<div class="system-check-row ${esc(c.status)}"><b>${c.status==="pass"?"✓":c.status==="warn"?"!":"×"}</b><div><strong>${esc(c.label)}</strong><p>${esc(c.detail)}</p></div></div>`).join("");
    };
    focusMain();
  }
  function download(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

  $("#brandButton").onclick=renderHome;$$('.nav-item').forEach(b=>b.addEventListener('click',()=>b.dataset.nav==='home'?renderHome():b.dataset.nav==='visits'?renderVisits(false):b.dataset.nav==='drafts'?renderVisits(true):renderSettings()));
  const menu=$("#menuDialog");$("#menuButton").onclick=()=>menu.showModal();$("#closeMenuButton").onclick=()=>menu.close();$("#menuEmployee").textContent=employee();$("#exportAllButton").onclick=()=>download(load(),`dw-field-export-${new Date().toISOString().slice(0,10)}.json`);$("#resetDemoButton").onclick=()=>{if(confirm("Alle lokale testgegevens wissen?")){storageRemove(STORE);menu.close();renderHome()}};$("#clientModeButton").onclick=()=>clientMode(!document.body.classList.contains("client-mode"));clientMode(storageGet(CLIENT)==="1");
  if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./service-worker.js").catch(()=>{});

  async function startApp(){
    const state=await window.DW_PRODUCTION.bootstrap();
    if(state?.profile?.display_name){
      storageSet(EMP,state.profile.display_name);
      $("#menuEmployee").textContent=state.profile.display_name;
    }
    const menuText=$("#menuModeText");
    if(menuText){
      const m=window.DW_PRODUCTION.mode();
      menuText.innerHTML=m==="live"
        ? "<strong>Productiemodus.</strong><br>Afgeronde echte leads worden naar DW Business Platform geschreven."
        : m==="pilot"
          ? "<strong>Pilotmodus.</strong><br>Alleen een beheerder kan één Woningcheck met een +fieldtest Gmail-adres gecontroleerd naar productie schrijven."
          : m==="check"
            ? "<strong>Controlemodus.</strong><br>We controleren login en database zonder leads te schrijven."
            : "<strong>Veilige testmodus.</strong><br>Er wordt niets naar productie verstuurd.";
    }
    updateBadge();
    renderHome();
  }
  startApp();
})();

/* ======================================================================
   DW APP v5.8 — operationele werklaag teruggebracht
   - Adressen & route
   - Eigen acquisitie
   - Mijn inschrijvingen
   - Rapportopvolging
   Deze laag gebruikt de bestaande Supabase-client en laat de geteste
   scan-, dossier- en productieflow in de hoofdapp ongemoeid.
   In local/check-modus is deze laag alleen-lezen.
   ====================================================================== */
(() => {
  "use strict";

  const cfg = window.DW_CONFIG || {};
  const main = document.getElementById("main");
  const nav = document.getElementById("bottomNav");
  if (!main || !nav || !window.DW_DATA) return;

  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
  }[c]));
  const clean = (value) => String(value ?? "").trim();
  const lower = (value) => clean(value).toLowerCase();
  const mode = () => String(cfg.integrationMode || "local").toLowerCase();
  // Live rechten: medewerkers mogen eigen operationele klant/adresgegevens corrigeren;
  // beheerder mag alle toegestane operationele dossiers beheren. Rapportbeheer blijft admin-only.
  const canWrite = () => mode() === "live";
  const client = () => window.DW_DATA?.client || null;
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

  let profile = null;
  let session = null;
  let areas = [];
  let addresses = [];
  let leads = [];
  let metaByLead = new Map();
  let activeOpsView = "dashboard";
  let addressFilter = "open";

  function setOpsNavActive(){
    $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.nav === "operations"));
    nav.classList.remove("hidden");
  }

  function focusTop(){
    main.setAttribute("tabindex", "-1");
    main.focus({preventScroll:true});
    window.scrollTo({top:0, behavior:"auto"});
  }

  function toast(message, type="info"){
    let box = document.getElementById("opsToast");
    if (!box) {
      box = document.createElement("div");
      box.id = "opsToast";
      box.className = "ops-toast";
      document.body.appendChild(box);
    }
    box.className = `ops-toast ${type}`;
    box.textContent = message;
    box.classList.add("show");
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.remove("show"), 3000);
  }

  function normalizedIdentities(){
    return [
      session?.user?.id,
      session?.user?.email,
      profile?.user_id,
      profile?.email,
      profile?.display_name
    ].filter(Boolean).map(lower);
  }

  function isAdmin(){
    return lower(profile?.role) === "admin" || lower(profile?.role) === "beheerder";
  }

  function canManageReports(){
    return canWrite() && isAdmin();
  }

  function mineAssigned(value){
    const assigned = lower(value);
    if (!assigned) return false;
    return normalizedIdentities().some((id) => id && (assigned === id || assigned.includes(id) || id.includes(assigned)));
  }

  function metaFor(leadId){ return metaByLead.get(String(leadId)) || {}; }

  function isOwnLead(lead){
    const meta = metaFor(lead.id);
    const worker = lower(meta.field_worker || meta.fieldWorker || "");
    const workerMatch = worker && normalizedIdentities().some((id) => worker === id || worker.includes(id) || id.includes(worker));
    const source = lower(lead.source);
    const platform = lower(meta.platform);
    const fieldOrigin = source.includes("buitendienst") || platform.includes("field app") || platform.includes("dw field");
    if (isAdmin()) return Boolean(workerMatch || fieldOrigin);
    return Boolean(workerMatch);
  }

  async function ensureIdentity(){
    const c = client();
    if (!c) return;
    try {
      session = await window.DW_DATA.getSession();
      if (session?.user?.id) {
        const {data, error} = await c.from("field_users").select("*").eq("user_id", session.user.id).maybeSingle();
        if (!error) profile = data || null;
      }
    } catch (error) {
      console.warn("DW APP operationele sessiecontrole mislukt", error);
    }
  }

  function opsHeader(title, intro, kicker="Buitendienst"){
    return `<section class="ops-head"><div><span class="kicker">${esc(kicker)}</span><h2>${esc(title)}</h2><p>${esc(intro)}</p></div><span class="ops-mode ${canWrite()?"live":"safe"}">${canWrite()?"LIVE":mode()==="pilot"?"PILOTTEST":mode()==="check"?"CONTROLEMODUS":"LOKALE TEST"}</span></section>`;
  }

  function safeNotice(){
    if (canWrite()) return "";
    return `<div class="callout warn ops-notice"><strong>Controlemodus actief.</strong><br>Dit is alleen de veilige teststand. In de live Field App mogen medewerkers hun eigen klant- en adresgegevens direct corrigeren en mag de beheerder alle toegestane dossiers corrigeren. Rapportbeheer en rapportverwerking blijven uitsluitend voor de beheerder.</div>`;
  }

  function skeleton(label="Gegevens laden…"){
    main.innerHTML = `<section class="ops-page">${opsHeader("Werkoverzicht", label)}<div class="ops-loading"><span></span><p>${esc(label)}</p></div></section>`;
    setOpsNavActive();
    focusTop();
  }

  async function loadCore({needAddresses=false, needLeads=false}={}){
    await ensureIdentity();
    const c = client();
    if (!c) throw new Error("De Supabase-verbinding is niet beschikbaar.");

    const jobs = [];
    if (needAddresses) {
      jobs.push(c.from("field_areas").select("*").order("name").then(({data,error}) => {
        if (error) throw error;
        areas = data || [];
      }));
      jobs.push(c.from("field_addresses").select("*").order("created_at", {ascending:false}).then(({data,error}) => {
        if (error) throw error;
        addresses = data || [];
        if (!isAdmin()) addresses = addresses.filter((row) => mineAssigned(row.assigned_to));
      }));
    }
    let rawLeads = null;
    if (needLeads) {
      jobs.push(window.DW_DATA.listLeads().then((data) => { rawLeads = data || []; }));
      jobs.push(c.from("lead_meta").select("*").then(({data,error}) => {
        if (error) throw error;
        metaByLead = new Map((data || []).map((row) => [String(row.lead_id), row]));
      }));
    }
    await Promise.all(jobs);
    if (needLeads) leads = (rawLeads || []).filter(isOwnLead);
  }

  function renderDashboard(){
    activeOpsView = "dashboard";
    setOpsNavActive();
    const localDone = (() => {
      try { return JSON.parse(localStorage.getItem("dw_field_visits_v4") || "[]").filter((x) => x.status === "afgerond").length; }
      catch { return 0; }
    })();
    main.innerHTML = `<section class="ops-page">
      ${opsHeader("Mijn werk", "Uw buitendienstfuncties weer bij elkaar, zonder de nieuwe scanflow te veranderen.", "Operationeel")}
      ${safeNotice()}
      <div class="ops-dashboard-grid">
        <button class="ops-tile" data-ops-view="addresses"><span class="ops-icon">⌖</span><strong>Adressen & route</strong><small>Toegewezen adressen, status en navigatie.</small></button>
        <button class="ops-tile" data-ops-view="acquisition"><span class="ops-icon">↗</span><strong>Eigen acquisitie</strong><small>Bekijk uw buitendienstleads en opvolging.</small></button>
        <button class="ops-tile" data-ops-view="registrations"><span class="ops-icon">✓</span><strong>Inschrijvingen</strong><small>Controleer en corrigeer klantgegevens.</small></button>
        ${isAdmin()?`<button class="ops-tile" data-ops-view="reports"><span class="ops-icon">▤</span><strong>Rapporten</strong><small>Status bekijken en beschikbare rapportverwerking starten.</small></button>`:''}
        ${isAdmin()?`<button class="ops-tile" data-ops-view="installers"><span class="ops-icon">⌂</span><strong>Installateurdossiers</strong><small>Alleen dossiers met aparte deeltoestemming voorbereiden.</small></button>`:''}
        ${isAdmin()?`<button class="ops-tile" data-ops-view="employees"><span class="ops-icon">◎</span><strong>Medewerkers</strong><small>Uitnodigen, activeren en wachtwoordherstel versturen.</small></button>`:''}
      </div>
      <div class="ops-summary-strip"><div><span>Afgerond op dit apparaat</span><strong>${localDone}</strong></div><div><span>Account</span><strong>${esc(profile?.display_name || session?.user?.email || "Medewerker")}</strong></div><div><span>Modus</span><strong>${canWrite()?"Productie":"Controle"}</strong></div></div>
      <button class="primary ops-new-visit" id="opsNewVisit">Nieuwe acquisitie / bezoek starten</button>
    </section>`;
    bindOpsNavigation();
    $("#opsNewVisit")?.addEventListener("click", () => {
      document.getElementById("brandButton")?.click();
      setTimeout(() => document.getElementById("newVisit")?.click(), 0);
    });
    focusTop();
  }

  function bindOpsNavigation(){
    $$('[data-ops-view]').forEach((button) => button.addEventListener("click", () => openOpsView(button.dataset.opsView)));
  }

  async function openOpsView(view){
    activeOpsView = view;
    if (view === "dashboard") return renderDashboard();
    skeleton("Operationele gegevens worden opgehaald…");
    try {
      if (view === "addresses") { await loadCore({needAddresses:true}); renderAddresses(); return; }
      if (view === "employees") { await ensureIdentity(); await renderEmployees(); return; }
      await loadCore({needLeads:true});
      if (view === "acquisition") renderAcquisition();
      else if (view === "registrations") renderRegistrations();
      else if (view === "reports") renderReports();
      else if (view === "installers") renderInstallers();
    } catch (error) {
      renderOpsError(error);
    }
  }

  function renderOpsError(error){
    setOpsNavActive();
    main.innerHTML = `<section class="ops-page">${opsHeader("Werkoverzicht", "De gegevens konden niet worden geladen.", "Operationeel")}
      <div class="callout warn"><strong>Niet gelukt.</strong><br>${esc(error?.message || error || "Onbekende fout")}</div>
      <button class="secondary ops-back" data-ops-view="dashboard">Terug naar werkoverzicht</button></section>`;
    bindOpsNavigation();
    focusTop();
  }

  function areaName(id){ return areas.find((area) => String(area.id) === String(id))?.name || "Geen wijk"; }
  function isOpenStatus(status){ return ["", "Nog bezoeken", "Niemand thuis", "Terugkomen"].includes(clean(status)); }
  function statusOptions(current){
    return ["Nog bezoeken","Gesprek gevoerd","Afspraak gemaakt","Terugkomen","Niemand thuis","Geen interesse"].map((status) => `<option ${status===current?"selected":""}>${esc(status)}</option>`).join("");
  }

  function filteredAddresses(){
    const q = lower($("#opsAddressSearch")?.value);
    return addresses.filter((row) => {
      const open = isOpenStatus(row.status);
      if (addressFilter === "open" && !open) return false;
      if (addressFilter === "done" && open) return false;
      if (q) {
        const hay = [row.resident_name,row.street,row.postal_code,row.city,row.status,areaName(row.area_id),row.note].map(lower).join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderAddresses(){
    setOpsNavActive();
    const openCount = addresses.filter((row) => isOpenStatus(row.status)).length;
    const doneCount = addresses.length - openCount;
    main.innerHTML = `<section class="ops-page">
      ${opsHeader("Adressen & route", "Uw toegewezen adressen, bezoekstatus en navigatie.")}
      ${safeNotice()}
      <div class="ops-toolbar"><button class="secondary ops-back" data-ops-view="dashboard">← Overzicht</button><button class="primary" id="opsOpenRoute" ${!addresses.length?"disabled":""}>Route openen</button></div>
      <div class="ops-metrics"><div><span>Totaal</span><strong>${addresses.length}</strong></div><div><span>Nog open</span><strong>${openCount}</strong></div><div><span>Afgehandeld</span><strong>${doneCount}</strong></div></div>
      <div class="ops-filterbar"><input id="opsAddressSearch" type="search" placeholder="Zoek adres, postcode of bewoner"><div class="ops-segments"><button data-address-filter="open" class="active">Open</button><button data-address-filter="done">Afgerond</button><button data-address-filter="all">Alles</button></div></div>
      <div id="opsAddressList" class="ops-list"></div>
    </section>`;
    bindOpsNavigation();
    $("#opsAddressSearch")?.addEventListener("input", drawAddresses);
    $$('[data-address-filter]').forEach((button) => button.addEventListener("click", () => {
      addressFilter = button.dataset.addressFilter;
      $$('[data-address-filter]').forEach((b) => b.classList.toggle("active", b === button));
      drawAddresses();
    }));
    $("#opsOpenRoute")?.addEventListener("click", openRoute);
    drawAddresses();
    focusTop();
  }

  function drawAddresses(){
    const host = $("#opsAddressList");
    if (!host) return;
    const rows = filteredAddresses();
    host.innerHTML = rows.length ? rows.map((row) => {
      const destination = [row.street,row.postal_code,row.city].filter(Boolean).join(", ");
      return `<article class="ops-row" data-address-id="${esc(row.id)}"><div class="ops-row-main"><strong>${esc(row.street || "Adres onbekend")}</strong><span>${esc([row.postal_code,row.city].filter(Boolean).join(" "))}</span><small>${esc(row.resident_name || "Geen bewonersnaam")} · ${esc(areaName(row.area_id))}</small></div><div class="ops-row-actions"><a class="secondary ops-link-button" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}" target="_blank" rel="noopener">Navigeren</a><select class="ops-status" ${canWrite()?"":"disabled"}>${statusOptions(row.status || "Nog bezoeken")}</select><button class="primary ops-save-status" ${canWrite()?"":"disabled"}>Opslaan</button></div></article>`;
    }).join("") : `<div class="empty">Geen adressen in deze selectie.</div>`;

    $$(".ops-save-status", host).forEach((button) => button.addEventListener("click", async () => {
      const card = button.closest("[data-address-id]");
      const id = card?.dataset.addressId;
      const status = $(".ops-status", card)?.value;
      if (!id || !status || !canWrite()) return;
      button.disabled = true; button.textContent = "Opslaan…";
      try {
        const {error} = await client().from("field_addresses").update({status, last_visited_at:new Date().toISOString(), updated_at:new Date().toISOString()}).eq("id", id);
        if (error) throw error;
        const row = addresses.find((item) => String(item.id) === String(id));
        if (row) row.status = status;
        toast("Adresstatus bijgewerkt.", "success");
        drawAddresses();
      } catch (error) {
        button.disabled = false; button.textContent = "Opslaan";
        toast(error.message || "Adresstatus kon niet worden opgeslagen.", "error");
      }
    }));
  }

  function routeDistance(a,b){
    const toRad=(x)=>x*Math.PI/180, R=6371;
    const dLat=toRad(Number(b.latitude)-Number(a.latitude));
    const dLng=toRad(Number(b.longitude)-Number(a.longitude));
    const s=Math.sin(dLat/2)**2+Math.cos(toRad(Number(a.latitude)))*Math.cos(toRad(Number(b.latitude)))*Math.sin(dLng/2)**2;
    return 2*R*Math.asin(Math.sqrt(s));
  }

  function optimizedOpenAddresses(){
    const rows = filteredAddresses().filter((row) => isOpenStatus(row.status));
    const geo = rows.filter((row) => Number.isFinite(Number(row.latitude)) && Number.isFinite(Number(row.longitude))).map((row)=>({...row,latitude:Number(row.latitude),longitude:Number(row.longitude)}));
    if (geo.length < 2) return rows;
    const remaining = [...geo];
    const route = [remaining.shift()];
    while (remaining.length) {
      const last = route[route.length-1];
      let bestIndex = 0, best = Infinity;
      remaining.forEach((row,index) => { const distance=routeDistance(last,row); if(distance<best){best=distance;bestIndex=index;} });
      route.push(remaining.splice(bestIndex,1)[0]);
    }
    const geoIds = new Set(route.map((row)=>String(row.id)));
    return [...route, ...rows.filter((row)=>!geoIds.has(String(row.id)))];
  }

  function openRoute(){
    const rows = optimizedOpenAddresses();
    if (!rows.length) return toast("Geen open adressen om te navigeren.", "info");
    const fmt = (row) => [row.street,row.postal_code,row.city].filter(Boolean).join(", ");
    if (rows.length === 1) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fmt(rows[0]))}`, "_blank");
      return;
    }
    const first=rows[0], last=rows[rows.length-1];
    const params = new URLSearchParams({api:"1", origin:fmt(first), destination:fmt(last), travelmode:"walking"});
    const waypoints = rows.slice(1,-1).slice(0,8).map(fmt).filter(Boolean).join("|");
    if (waypoints) params.set("waypoints", waypoints);
    window.open(`https://www.google.com/maps/dir/?${params.toString()}`, "_blank");
  }

  function leadStatus(lead){ return clean(metaFor(lead.id).sales_status || lead.status || "Nieuwe lead"); }
  function leadDate(lead){
    const meta=metaFor(lead.id); const raw=meta.captured_at || lead.created_at;
    try { return new Intl.DateTimeFormat("nl-NL",{dateStyle:"medium"}).format(new Date(raw)); } catch { return clean(raw); }
  }
  function leadWho(lead){ return clean(lead.company && lead.company !== "Particulier" ? lead.company : lead.contact_name) || "Onbekende klant"; }

  function renderAcquisition(){
    setOpsNavActive();
    const appointment = leads.filter((lead)=>/afspraak/i.test(leadStatus(lead))).length;
    const sold = leads.filter((lead)=>/verkocht|klant/i.test(leadStatus(lead))).length;
    main.innerHTML = `<section class="ops-page">
      ${opsHeader("Eigen acquisitie", "Uw Field App-leads en actuele opvolgstatus.")}
      ${safeNotice()}
      <div class="ops-toolbar"><button class="secondary" data-ops-view="dashboard">← Overzicht</button><button class="primary" id="opsAcqNew">Nieuwe acquisitie</button></div>
      <div class="ops-metrics"><div><span>Leads zichtbaar</span><strong>${leads.length}</strong></div><div><span>Afspraken</span><strong>${appointment}</strong></div><div><span>Klant / verkocht</span><strong>${sold}</strong></div></div>
      <div class="ops-filterbar"><input id="opsLeadSearch" type="search" placeholder="Zoek klant, bedrijf of scan"></div>
      <div id="opsLeadList" class="ops-list"></div>
    </section>`;
    bindOpsNavigation();
    $("#opsAcqNew")?.addEventListener("click",()=>{document.getElementById("brandButton")?.click();setTimeout(()=>document.getElementById("newVisit")?.click(),0);});
    $("#opsLeadSearch")?.addEventListener("input",drawLeadList);
    drawLeadList();
    focusTop();
  }

  function drawLeadList(){
    const host=$("#opsLeadList"); if(!host)return;
    const q=lower($("#opsLeadSearch")?.value);
    const rows=leads.filter((lead)=>!q || [leadWho(lead),lead.email,lead.phone,lead.scan_type,leadStatus(lead),metaFor(lead.id).campaign].map(lower).join(" ").includes(q));
    host.innerHTML=rows.length?rows.map((lead)=>`<article class="ops-row"><div class="ops-row-main"><strong>${esc(leadWho(lead))}</strong><span>${esc(lead.scan_type || "Lead")}</span><small>${esc(leadDate(lead))} · ${esc(metaFor(lead.id).campaign || lead.source || "Buitendienst")}</small></div><div class="ops-status-pill">${esc(leadStatus(lead))}</div></article>`).join(""):`<div class="empty">Geen leads gevonden.</div>`;
  }

  function registrationAddress(lead){
    const meta=metaFor(lead.id); const w=meta.woningcheck_data || meta.woningcheckData || {};
    return clean(w.address || meta.address || lead.address || "");
  }

  function renderRegistrations(){
    setOpsNavActive();
    main.innerHTML = `<section class="ops-page">
      ${opsHeader("Mijn inschrijvingen", "Controleer klantgegevens en corrigeer ze vóór verdere opvolging.")}
      ${safeNotice()}
      <div class="ops-toolbar"><button class="secondary" data-ops-view="dashboard">← Overzicht</button><button class="secondary" id="opsRefreshRegistrations">Vernieuwen</button></div>
      <div id="opsRegistrationList" class="ops-list ops-registration-list"></div>
    </section>`;
    bindOpsNavigation();
    $("#opsRefreshRegistrations")?.addEventListener("click",()=>openOpsView("registrations"));
    drawRegistrations();
    focusTop();
  }

  function drawRegistrations(){
    const host=$("#opsRegistrationList"); if(!host)return;
    host.innerHTML=leads.length?leads.map((lead)=>{
      const id=String(lead.id), address=registrationAddress(lead);
      return `<article class="ops-registration" data-reg-id="${esc(id)}"><div class="ops-registration-head"><div><strong>${esc(leadWho(lead))}</strong><small>${esc(lead.scan_type || "Inschrijving")} · ${esc(leadDate(lead))}</small></div><button class="secondary ops-edit-reg">Bewerken</button></div><form class="ops-reg-form hidden"><div class="form-grid"><label class="field"><span>Naam</span><input name="contact_name" value="${esc(lead.contact_name || "")}" required></label><label class="field"><span>Telefoon</span><input name="phone" value="${esc(lead.phone || "")}"></label><label class="field"><span>E-mail</span><input name="email" type="email" value="${esc(lead.email || "")}"></label><label class="field"><span>Adres</span><input name="address" value="${esc(address)}"></label></div><div class="ops-form-actions"><button type="button" class="ghost ops-cancel-reg">Annuleren</button><button type="submit" class="primary" ${canWrite()?"":"disabled"}>Wijzigingen opslaan</button></div></form></article>`;
    }).join(""):`<div class="empty">Nog geen inschrijvingen gevonden.</div>`;

    $$(".ops-edit-reg",host).forEach((button)=>button.addEventListener("click",()=>{
      const card=button.closest(".ops-registration"); $(".ops-reg-form",card)?.classList.toggle("hidden");
    }));
    $$(".ops-cancel-reg",host).forEach((button)=>button.addEventListener("click",()=>button.closest(".ops-reg-form")?.classList.add("hidden")));
    $$(".ops-reg-form",host).forEach((form)=>form.addEventListener("submit",saveRegistration));
  }

  async function saveRegistration(event){
    event.preventDefault();
    if(!canWrite())return;
    const form=event.currentTarget, card=form.closest("[data-reg-id]"), id=card?.dataset.regId;
    const submit=form.querySelector('button[type="submit"]');
    if(!id||!submit)return;
    const contact_name=clean(form.elements.contact_name.value), phone=clean(form.elements.phone.value), email=clean(form.elements.email.value), address=clean(form.elements.address.value);
    if(!contact_name)return toast("Vul eerst de naam in.","error");
    if(email&&!form.elements.email.checkValidity()){form.elements.email.reportValidity();return;}
    submit.disabled=true;submit.textContent="Opslaan…";
    try{
      await window.DW_DATA.updateLead(id,{contact_name,phone,email});
      const c=client();
      if(c){
        const {error}=await c.from("lead_meta").update({address:address||null,updated_at:new Date().toISOString()}).eq("lead_id",id);
        if(error)throw error;
      }
      const lead=leads.find((row)=>String(row.id)===String(id));
      if(lead)Object.assign(lead,{contact_name,phone,email});
      const meta=metaFor(id);meta.address=address;metaByLead.set(String(id),meta);
      toast("Klantgegevens bijgewerkt.","success");
      drawRegistrations();
    }catch(error){
      submit.disabled=false;submit.textContent="Wijzigingen opslaan";
      toast(error.message||"Wijzigen is niet gelukt.","error");
    }
  }

  function renderInstallers(){
    setOpsNavActive();
    if(!isAdmin()){
      main.innerHTML=`<section class="ops-page">${opsHeader("Installateurdossiers", "Installateurdossiers zijn afgeschermd.")}<div class="callout warn"><strong>Alleen beheerder.</strong><br>Een medewerker kan toestemming vastleggen, maar selectie en eventuele verstrekking aan een installateur blijft een beheerderstaak.</div><button class="secondary" data-ops-view="dashboard">← Terug</button></section>`;
      bindOpsNavigation();focusTop();return;
    }
    const eligible=leads.filter((lead)=>{
      const snap=reportSnapshot(lead);
      return !!snap?.partner_share_consent;
    });
    main.innerHTML=`<section class="ops-page">${opsHeader("Installateurdossiers", "Alleen dossiers waarvoor de bewoner apart toestemming heeft gegeven om relevante gegevens met een geselecteerde specialist te delen.", "Beheer")}${safeNotice()}<div class="ops-toolbar"><button class="secondary" data-ops-view="dashboard">← Overzicht</button><button class="secondary" id="opsRefreshInstallers">Vernieuwen</button></div><div class="ops-list">${eligible.length?eligible.map((lead)=>{
      const snap=reportSnapshot(lead)||{}, meta=metaFor(lead.id), photos=Array.isArray(meta.photo_files)?meta.photo_files:[];
      const measures=Array.isArray(snap.requested_measures)?snap.requested_measures.join(', '):(meta.interests||lead.scan_type||'—');
      return `<article class="ops-row"><div class="ops-row-main"><strong>${esc(leadWho(lead))}</strong><span>${esc(measures)}</span><small>${esc(snap.address||meta.address||'Adres niet vastgelegd')} · ${photos.length} beveiligde foto('s)</small><small>Interne medewerkersnotities worden niet opgenomen.</small></div><span class="pill success">Toestemming vastgelegd</span></article>`;
    }).join(''):`<div class="empty">Nog geen dossiers met aparte deeltoestemming.</div>`}</div><p class="ops-footnote">Deze lijst bereidt dossiers voor. Verstrekking aan een concrete installateur gebeurt niet automatisch en blijft een bewuste beheerderactie.</p></section>`;
    bindOpsNavigation();$("#opsRefreshInstallers")?.addEventListener("click",()=>openOpsView("installers"));focusTop();
  }

  async function renderEmployees(){
    setOpsNavActive();
    if(!isAdmin()){
      main.innerHTML=`<section class="ops-page">${opsHeader("Medewerkers", "Medewerkersbeheer is afgeschermd.")}<div class="callout warn"><strong>Alleen beheerder.</strong></div><button class="secondary" data-ops-view="dashboard">← Terug</button></section>`;bindOpsNavigation();focusTop();return;
    }
    const c=client();
    const {data,error}=await c.from("field_users").select("*").order("display_name");
    if(error)throw error;
    const rows=data||[];
    main.innerHTML=`<section class="ops-page">${opsHeader("Medewerkers", "Nodig een medewerker uit. De medewerker ontvangt een beveiligde e-mail, kiest zelf een wachtwoord en komt daarna direct in de Field App.", "Beheer")}<div class="ops-toolbar"><button class="secondary" data-ops-view="dashboard">← Overzicht</button></div><div class="screen-card"><div class="screen-body"><h3>Nieuwe medewerker uitnodigen</h3><div id="employeeInviteFeedback" hidden></div><form id="employeeInviteForm"><div class="form-grid"><label class="field"><span>Naam</span><input name="display_name" required placeholder="Voor- en achternaam"></label><label class="field"><span>E-mailadres</span><input name="email" type="email" required placeholder="naam@bedrijf.nl"></label><label class="field"><span>Telefoon</span><input name="phone" placeholder="Optioneel"></label><label class="field"><span>Werkgebied</span><input name="work_area" placeholder="Bijv. Amsterdam Zuid"></label><label class="field"><span>Rol</span><select name="role"><option value="walker">Medewerker</option><option value="admin">Beheerder</option></select></label></div><div class="flow-actions" style="position:static"><span id="employeeInviteMessage" class="mini-status"></span><span class="spacer"></span><button class="primary" type="submit">Uitnodiging versturen</button></div></form></div></div><div class="ops-list" style="margin-top:16px">${rows.length?rows.map((row)=>`<article class="ops-row" data-user-id="${esc(row.user_id)}"><div class="ops-row-main"><strong>${esc(row.display_name||row.email||'Medewerker')}</strong><span>${esc(row.email||'')} · ${lower(row.role)==='admin'?'Beheerder':'Medewerker'}</span><small>${row.is_active===false?'Geblokkeerd':'Actief'}${row.work_area?` · ${esc(row.work_area)}`:''}</small></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="secondary employee-reset" data-email="${esc(row.email||'')}">Wachtwoord reset</button>${String(row.user_id)!==String(session?.user?.id)?`<button class="secondary employee-toggle" data-user-id="${esc(row.user_id)}" data-active="${row.is_active===false?'0':'1'}">${row.is_active===false?'Activeren':'Blokkeren'}</button>`:''}</div></article>`).join(''):`<div class="empty">Nog geen medewerkers gevonden.</div>`}</div></section>`;
    bindOpsNavigation();
    $("#employeeInviteForm")?.addEventListener("submit",inviteEmployee);
    $$(".employee-reset").forEach((b)=>b.addEventListener("click",resetEmployeePassword));
    $$(".employee-toggle").forEach((b)=>b.addEventListener("click",toggleEmployee));
    const inviteFlash=sessionStorage.getItem("dw_employee_invite_feedback_v2");
    if(inviteFlash){
      try{
        const feedback=JSON.parse(inviteFlash);
        const box=$("#employeeInviteFeedback");
        if(box){
          box.hidden=false;
          box.className=`callout ${feedback.ok?"success":"warn"}`;
          box.style.marginBottom="14px";
          box.innerHTML=`<strong>${feedback.ok?"✓ Uitnodiging verstuurd":"⚠ Uitnodiging niet verstuurd"}</strong><br>${esc(feedback.message||"")}`;
        }
      }catch{}
      sessionStorage.removeItem("dw_employee_invite_feedback_v2");
    }
    focusTop();
  }

  async function inviteEmployee(event){
    event.preventDefault();
    const form=event.currentTarget, button=form.querySelector('button[type="submit"]'), msg=$("#employeeInviteMessage"), feedback=$("#employeeInviteFeedback");
    const payload={display_name:clean(form.elements.display_name.value),email:lower(form.elements.email.value),phone:clean(form.elements.phone.value),work_area:clean(form.elements.work_area.value),role:form.elements.role.value,is_active:true,redirectTo:new URL('field-activate.html?mode=invite',location.href).href};
    if(!payload.display_name||!payload.email)return;
    button.disabled=true;button.textContent="Versturen…";msg.textContent="";
    if(feedback){feedback.hidden=true;feedback.textContent="";feedback.className="";}
    try{
      const {data,error}=await client().functions.invoke("invite-field-user",{body:payload});
      if(error){
        let detail=error?.message||"Uitnodiging kon niet worden verstuurd.";
        try{
          const response=error?.context;
          if(response && typeof response.clone==="function"){
            const body=await response.clone().json();
            detail=body?.error||body?.message||detail;
          }
        }catch{}
        if(/already been registered|already registered|already exists|user.*exists/i.test(detail)){
          detail="Dit e-mailadres bestaat al in Supabase. Gebruik bij deze gebruiker ‘Wachtwoord reset’ of kies een nog niet gebruikt e-mailadres.";
        }
        throw new Error(detail);
      }
      if(data?.ok===false){
        let detail=data?.error||data?.message||"Uitnodiging kon niet worden verstuurd.";
        if(/already been registered|already registered|already exists|user.*exists/i.test(detail)){
          detail="Dit e-mailadres bestaat al in Supabase. Gebruik bij deze gebruiker ‘Wachtwoord reset’ of kies een nog niet gebruikt e-mailadres.";
        }
        throw new Error(detail);
      }
      sessionStorage.setItem("dw_employee_invite_feedback_v2",JSON.stringify({
        ok:true,
        message:`De uitnodigingsmail is verzonden naar ${payload.email}. De medewerker kan via die e-mail zelf een wachtwoord instellen.`
      }));
      toast("Uitnodiging verstuurd.","success");
      await renderEmployees();
    }catch(error){
      const message=error?.message||"Uitnodiging niet gelukt.";
      msg.textContent="";
      if(feedback){
        feedback.hidden=false;
        feedback.className="callout warn";
        feedback.style.marginBottom="14px";
        feedback.innerHTML=`<strong>⚠ Uitnodiging niet verstuurd</strong><br>${esc(message)}`;
      }
      button.disabled=false;button.textContent="Uitnodiging versturen";
    }
  }

  async function resetEmployeePassword(event){
    const email=clean(event.currentTarget.dataset.email);if(!email)return;
    if(!confirm(`Verstuur een wachtwoordherstel-link naar ${email}?`))return;
    try{
      const redirectTo=new URL('field-activate.html?mode=recovery',location.href).href;
      const {error}=await client().auth.resetPasswordForEmail(email,{redirectTo});
      if(error)throw error;toast("Herstel-link verstuurd.","success");
    }catch(error){toast(error.message||"Herstel-link kon niet worden verstuurd.","error");}
  }

  async function toggleEmployee(event){
    const b=event.currentTarget,id=b.dataset.userId,next=b.dataset.active!=="1";
    if(!id)return;
    if(!confirm(`${next?'Activeer':'Blokkeer'} deze medewerker?`))return;
    try{const {error}=await client().from("field_users").update({is_active:next,updated_at:new Date().toISOString()}).eq("user_id",id);if(error)throw error;toast("Medewerkersstatus bijgewerkt.","success");setTimeout(()=>renderEmployees(),400);}catch(error){toast(error.message||"Wijzigen niet gelukt.","error");}
  }

  function reportSnapshot(lead){
    const meta=metaFor(lead.id);
    return meta.woningcheck_data || meta.woningcheckData || null;
  }
  function reportStatus(lead){
    const meta=metaFor(lead.id);
    return clean(meta.report_status || meta.rapportstatus || lead.rapportstatus || meta.automation_status || lead.status || "Nog te beoordelen");
  }

  function renderReports(){
    setOpsNavActive();
    if(!isAdmin()){
      main.innerHTML=`<section class="ops-page">${opsHeader("Rapporten", "Rapportbeheer is afgeschermd.")}<div class="callout warn"><strong>Alleen beheerder.</strong><br>Medewerkers kunnen klant- en bezoekgegevens corrigeren, maar rapporten, rapportstatussen en rapportverwerking zijn alleen beschikbaar voor de beheerder.</div><button class="secondary" data-ops-view="dashboard">← Terug naar werkoverzicht</button></section>`;
      bindOpsNavigation();focusTop();return;
    }
    const reportLeads=leads.filter((lead)=>/woning|isolatie|warmtepomp|batterij|kozijn|glas|laadpaal|airco|vloer|elektra/i.test(clean(lead.scan_type)) || reportSnapshot(lead));
    main.innerHTML=`<section class="ops-page">
      ${opsHeader("Rapporten", "Rapportstatus bekijken en alleen beschikbare Woningcheck-rapportverwerking opnieuw starten.")}
      ${safeNotice()}
      <div class="ops-toolbar"><button class="secondary" data-ops-view="dashboard">← Overzicht</button><button class="secondary" id="opsRefreshReports">Vernieuwen</button></div>
      <div id="opsReportList" class="ops-list">${reportLeads.length?reportLeads.map((lead)=>{
        const snapshot=reportSnapshot(lead), consent=!!(snapshot?.report_email_consent || snapshot?.extended_report_email_consent);
        const liveMode=(window.DW_PRODUCTION?.mode?.()==="live");
        const allowed=liveMode&&canManageReports()&&!!snapshot&&consent;
        const label=liveMode?"Rapport verwerken":"Alleen in live-productie";
        return `<article class="ops-row" data-report-id="${esc(lead.id)}"><div class="ops-row-main"><strong>${esc(leadWho(lead))}</strong><span>${esc(lead.scan_type || "Woningcheck")}</span><small>Status: ${esc(reportStatus(lead))}${snapshot?" · rapportdata aanwezig":" · geen rapportdata"}</small></div><button class="primary ops-process-report" ${allowed?"":"disabled"}>${label}</button></article>`;
      }).join(""):`<div class="empty">Geen Woningcheck-rapporten gevonden.</div>`}</div>
      <p class="ops-footnote">In Controlemodus is rapportverwerking technisch geblokkeerd. In live-productie wordt de knop alleen actief als rapportdata én toestemming aanwezig zijn. Daarna wordt de bestaande <strong>process-field-reports</strong>-route gebruikt; er wordt geen nieuwe rapportlogica geïntroduceerd.</p>
    </section>`;
    bindOpsNavigation();
    $("#opsRefreshReports")?.addEventListener("click",()=>openOpsView("reports"));
    $$(".ops-process-report").forEach((button)=>button.addEventListener("click",processReport));
    focusTop();
  }

  async function processReport(event){
    if(window.DW_PRODUCTION?.mode?.()!=="live"){
      return toast("Rapportverwerking is geblokkeerd zolang de Field App in Controlemodus staat.","error");
    }
    if(!canManageReports())return;
    const button=event.currentTarget, card=button.closest("[data-report-id]"), id=card?.dataset.reportId;
    const lead=leads.find((row)=>String(row.id)===String(id));
    const snapshot=lead?reportSnapshot(lead):null;
    if(!id||!snapshot)return toast("Rapportdata ontbreken.","error");
    button.disabled=true;button.textContent="Verwerken…";
    try{
      const {data,error}=await client().functions.invoke("process-field-reports",{body:{lead_id:id,woningcheck:snapshot}});
      if(error||data?.ok!==true)throw new Error(data?.error||error?.message||"Rapportverwerking is niet bevestigd.");
      toast("Rapportverwerking bevestigd.","success");
      setTimeout(()=>openOpsView("reports"),500);
    }catch(error){
      button.disabled=false;button.textContent="Rapport verwerken";
      toast(error.message||"Rapportverwerking is niet gelukt.","error");
    }
  }

  function installNav(){
    if (nav.querySelector('[data-nav="operations"]')) return;
    const button=document.createElement("button");
    button.type="button";button.className="nav-item";button.dataset.nav="operations";
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 4v6m10-6v6M5 11h14v9H5zM8 14h3m2 0h3m-8 3h3m2 0h3"/></svg><small>Werk</small>';
    nav.insertBefore(button, nav.querySelector('[data-nav="settings"]'));
    button.addEventListener("click", async () => {
      await ensureIdentity();
      renderDashboard();
    });
  }

  function installMenuShortcut(){
    const card=document.querySelector("#menuDialog .sheet-card");
    if(!card||document.getElementById("opsMenuButton"))return;
    const button=document.createElement("button");
    button.id="opsMenuButton";button.className="secondary wide";button.type="button";button.textContent="Werkoverzicht openen";
    const exportButton=document.getElementById("exportAllButton");
    card.insertBefore(button,exportButton||null);
    button.addEventListener("click",async()=>{
      document.getElementById("menuDialog")?.close();
      await ensureIdentity();
      renderDashboard();
    });
  }

  function installLogoutButton(){
    const card=document.querySelector("#menuDialog .sheet-card");
    if(!card||document.getElementById("fieldLogoutButton"))return;
    const button=document.createElement("button");
    button.id="fieldLogoutButton";
    button.className="secondary wide";
    button.type="button";
    button.textContent="Uitloggen";
    card.appendChild(button);
    button.addEventListener("click",async()=>{
      const logoutTarget="field-login.html";
      button.disabled=true;
      button.textContent="Uitloggen…";
      try{
        await window.DW_DATA?.signOut?.();
      }catch(error){
        console.warn("Uitloggen gaf een melding:",error);
      }finally{
        try{
          sessionStorage.removeItem("vt-rc2-authenticated");
          sessionStorage.removeItem("vt-rc2-role");
          sessionStorage.removeItem("vt-rc2-entry");
        }catch{}
        location.replace(logoutTarget+"?loggedout=1");
      }
    });
  }

  installNav();
  installMenuShortcut();
  installLogoutButton();
  ensureIdentity();
  window.DW_FIELD_OPERATIONS={open:openOpsView,refresh:()=>openOpsView(activeOpsView)};
})();
