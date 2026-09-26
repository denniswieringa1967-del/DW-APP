(() => {
  "use strict";

  const cfg = window.DW_CONFIG || {};
  const NO_LEAD_STATUSES = new Set(["Niemand thuis", "Geen interesse"]);

  const mode = () => String(cfg.integrationMode || "local").toLowerCase();
  const dw = () => window.DW_DATA || null;
  const client = () => dw()?.client || null;

  function now() { return new Date().toISOString(); }
  function clean(value) { return String(value ?? "").trim(); }
  function value(visit, key) { return visit?.answers?.[key] ?? ""; }
  function list(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
  function addressLine(visit) {
    const c = visit.contact || {};
    return [c.street, c.house_number, c.postcode, c.city].filter(Boolean).join(" ").trim();
  }

  function normalizedAiData(visit) {
    const a = visit.answers || {};
    return {
      sector: a.sector || "",
      admin_hours: a.admin_hours || "",
      manual_tasks: list(a.manual_tasks),
      duplicate_entry: a.duplicate_entry || "",
      lead_followup: a.lead_followup || "",
      ai_marketing_share: a.ai_marketing_share || "",
      lead_response_time: a.lead_response_time || "",
      ai_customer_templates: a.ai_customer_templates || "",
      document_search_time: a.document_search_time || "",
      main_ai_goal: a.main_ai_goal || "",
      name: visit.contact?.name || "",
      company: visit.contact?.company || "",
      kvk: visit.contact?.kvk || "",
      address: [visit.contact?.street, visit.contact?.house_number].filter(Boolean).join(" "),
      postal_city: [visit.contact?.postcode, visit.contact?.city].filter(Boolean).join(" "),
      phone: visit.contact?.phone || "",
      fte: Number(a.fte || 0) || null,
      hourly_rate: Number(a.hourly_rate || 0) || null,
      email: visit.contact?.email || "",
      field_visit_id: visit.id,
      source: cfg.sourceLabel || "Buitendienst",
      field_worker: visit.employee || "",
      captured_at: visit.created_at || now()
    };
  }

  function aiReadableNotes(visit) {
    const d = normalizedAiData(visit);
    return [
      "[AI_SCAN_ANTWOORDEN_START]",
      `Sector: ${d.sector}`,
      `Handmatige administratie: ${d.admin_hours}`,
      `Handmatige taken: ${d.manual_tasks.join("; ")}`,
      `Dubbele invoer: ${d.duplicate_entry}`,
      `Leadopvolging: ${d.lead_followup}`,
      `AI-marketing: ${d.ai_marketing_share}`,
      `Reactiesnelheid nieuwe lead: ${d.lead_response_time}`,
      `AI-templates klantvragen: ${d.ai_customer_templates}`,
      `Zoektijd documenten/informatie: ${d.document_search_time}`,
      `Belangrijkste AI-doel: ${d.main_ai_goal}`,
      `Aantal medewerkers (FTE): ${d.fte ?? ""}`,
      `Gemiddeld uurtarief: ${d.hourly_rate ?? ""}`,
      `Privacy-informatie besproken: ${visit.consent?.privacy ? "Ja" : "Nee"}`,
      `Contacttoestemming: ${visit.consent?.contact ? "Ja" : "Nee"}`,
      `Privacyversie: ${visit.consent?.privacy_version || ""}`,
      `Toestemming vastgelegd op: ${visit.consent?.captured_at || ""}`,
      "[AI_SCAN_ANTWOORDEN_EINDE]",
      visit.notes ? `Notities medewerker: ${visit.notes}` : ""
    ].filter(Boolean).join("\n");
  }

  function energyReadableNotes(visit) {
    const labels = visit.answer_labels || {};
    const answers = visit.answers || {};
    const rows = Object.keys(labels).map((key) => {
      const answer = Array.isArray(answers[key]) ? answers[key].join(", ") : answers[key];
      return `${labels[key]}: ${answer ?? ""}`;
    });
    return [
      `[FIELD_ENERGY_SCAN_START]`,
      `Route: ${visit.energy_route || ""}`,
      ...rows,
      `Privacy-informatie besproken: ${visit.consent?.privacy ? "Ja" : "Nee"}`,
      `Contacttoestemming: ${visit.consent?.contact ? "Ja" : "Nee"}`,
      `Privacyversie: ${visit.consent?.privacy_version || ""}`,
      `Algemene voorwaarden akkoord: ${visit.consent?.terms ? "Ja" : "Nee"}`,
      `Voorwaardenversie: ${visit.consent?.terms_version || ""}`,
      `Opdracht/vervolg akkoord: ${visit.consent?.assignment ? "Ja" : "Nee"}`,
      `Toestemming vastgelegd op: ${visit.consent?.captured_at || ""}`,
      visit.notes ? `Notities medewerker: ${visit.notes}` : "",
      `[FIELD_ENERGY_SCAN_EINDE]`
    ].filter(Boolean).join("\n");
  }

  function woningReadableNotes(visit) {
    const labels = visit.answer_labels || {};
    const answers = visit.answers || {};
    const rows = Object.keys(labels).map((key) => {
      const answer = Array.isArray(answers[key]) ? answers[key].join(", ") : answers[key];
      return `${labels[key]}: ${answer ?? ""}`;
    });
    return [
      "[FIELD_WONINGCHECK_START]",
      `Maatregelen: ${(visit.products || []).join(", ")}`,
      ...rows,
      `Privacy-informatie besproken: ${visit.consent?.privacy ? "Ja" : "Nee"}`,
      `Contacttoestemming: ${visit.consent?.contact ? "Ja" : "Nee"}`,
      `Fototoestemming: ${visit.consent?.photos ? "Ja" : "Nee"}`,
      `Rapport per e-mail akkoord: ${visit.consent?.report_email ? "Ja" : "Nee"}`,
      `Delen met partner akkoord: ${visit.consent?.share_partner ? "Ja" : "Nee"}`,
      `Privacyversie: ${visit.consent?.privacy_version || ""}`,
      `Toestemming vastgelegd op: ${visit.consent?.captured_at || ""}`,
      visit.notes ? `Notities medewerker: ${visit.notes}` : "",
      "[FIELD_WONINGCHECK_EINDE]"
    ].filter(Boolean).join("\n");
  }

  function productKeyMap(visit) {
    const products = visit.products || [];
    const keys = [];
    if (products.some(x => /isolatie/i.test(x))) keys.push("isolatie");
    if (products.some(x => /glas|kozijn/i.test(x))) keys.push("kunststof_kozijnen");
    if (products.some(x => /warmtepomp/i.test(x))) keys.push("warmtepomp");
    if (products.includes("Thuisbatterij")) keys.push("thuisbatterij");
    if (products.includes("Laadpaal")) keys.push("laadpaal");
    if (products.includes("Airco")) keys.push("airco");
    if (products.includes("Vloerverwarming")) keys.push("vloerverwarming");
    if (products.includes("Elektrisch koken")) keys.push("elektra");
    return [...new Set(keys)];
  }

  function productIntakes(visit) {
    const result = [];
    for (const product of productKeyMap(visit)) {
      const answers = {};
      const prefix = `${product}.`;
      for (const [key, answer] of Object.entries(visit.answers || {})) {
        if (key.startsWith(prefix)) answers[key.slice(prefix.length)] = answer;
      }
      if (Object.keys(answers).length) {
        result.push({
          product_type: product,
          questionnaire_version: "v1",
          answers
        });
      }
    }
    return result;
  }

  function woningSnapshot(visit) {
    const a = visit.answers || {};
    const wantsReport = !!visit.consent?.report_email;
    const wantsExtended = !!visit.consent?.extended_report_email;
    const intakes = productIntakes(visit);
    return {
      name: visit.contact?.name || "",
      address: [visit.contact?.street, visit.contact?.house_number].filter(Boolean).join(" "),
      postal_city: [visit.contact?.postcode, visit.contact?.city].filter(Boolean).join(" "),
      housing_type: a.housing_type || "",
      owner_status: a.owner_status || "",
      solar_panels: a.solar_panels_quick || "",
      feed_in_costs: a.feed_in_costs || "",
      crawlspace_present: a.crawlspace || "",
      crawlspace_height: a.crawlspace_height || "",
      crawlspace_water: a.crawlspace_water || "",
      floor_material: a.floor_material || "",
      electric_driving: a.electric_driving || "",
      woz_status: a.woz_status || "",
      construction_period: a.construction_period || "",
      specific_year: a.exact_construction_year || "",
      main_interest: (visit.products || []).length > 1 ? "Complete verduurzaming" : ((visit.products || [])[0] || ""),
      requested_measures: visit.products || [],
      existing_insulation: a.existing_insulation_quick || "",
      heating: a.heating || "",
      report_preference: wantsReport ? "Rapport gewenst" : "Geen rapport",
      report_email_consent: wantsReport,
      expanded_report_interest: intakes.length ? "Ja" : "Nee",
      extended_report_email_consent: wantsExtended,
      partner_share_consent: !!visit.consent?.share_partner,
      photo_consent: !!visit.consent?.photos,
      product_intakes: intakes,
      report_checked: true,
      field_visit_id: visit.id,
      field_worker: visit.employee || ""
    };
  }

  function scanType(visit) {
    if (visit.product === "ai") return "AI Efficiency Scan";
    if (visit.product === "energie") return visit.energy_route || "Energie & Compliance Pre-Scan";
    if (visit.product === "woningcheck") {
      return (visit.products || []).length ? visit.products.join(", ") : "Woningcheck";
    }
    return visit.visit_status || "Buitendienst";
  }

  function leadPayload(visit) {
    const hasAppointment =
      visit.visit_status === "Afspraak gemaakt" ||
      value(visit, "follow_up") === "Direct afspraak" ||
      Boolean(value(visit, "preferred_date"));

    const isBusiness = visit.route === "zakelijk";
    return {
      company: isBusiness ? (visit.contact?.company || "") : "Particulier",
      contact_name: visit.contact?.name || "",
      email: visit.contact?.email || "",
      phone: visit.contact?.phone || "",
      scan_type: scanType(visit),
      status: hasAppointment ? "Afspraak gepland" : (visit.product ? "Scan ingevuld" : "Nieuwe lead"),
      revenue: 0,
      source: cfg.sourceLabel || "Buitendienst"
    };
  }

  function leadMeta(visit) {
    const hasAppointment =
      visit.visit_status === "Afspraak gemaakt" ||
      value(visit, "follow_up") === "Direct afspraak" ||
      Boolean(value(visit, "preferred_date"));

    const date = value(visit, "preferred_date") || null;
    return {
      externalId: visit.id,
      formId:
        visit.product === "ai" ? "RGZxGl-field" :
        visit.product === "energie" ? "J94oM4-field" :
        "verduurzamenthuis-field-v4",
      partner: null,
      customerType: visit.route === "zakelijk" ? "Zakelijk" : "Particulier",
      address: addressLine(visit),
      appointmentStatus: hasAppointment ? "Afspraak gepland" : "Geen afspraak",
      appointmentDate: date,
      expectedCommission: hasAppointment && visit.route === "particulier" ? 50 : 0,
      campaign: visit.campaign || cfg.defaultCampaign || "Buitendienst",
      interests: (visit.products || []).join(", "),
      platform: cfg.platformLabel || "DW Field App",
      video: null,
      qualification: hasAppointment ? "Gekwalificeerd" : "Nog beoordelen",
      utmSource: "buitendienst",
      utmMedium: "field-app",
      utmCampaign: visit.campaign || "field-app",
      utmContent: visit.product || null,
      automationSource: "field-app-v4",
      automationStatus: "Ontvangen",
      capturedAt: visit.created_at || now()
    };
  }

  async function getProfile() {
    const c = client();
    if (!c) return null;
    const session = await dw().getSession();
    if (!session?.user?.id) return null;
    const { data, error } = await c
      .from("field_users")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  function loginTarget(){
    try{
      return sessionStorage.getItem("vt-rc2-entry")==="admin" ? "beheer-login.html" : (cfg.loginUrl || "field-login.html");
    }catch{
      return cfg.loginUrl || "field-login.html";
    }
  }

  async function bootstrap({redirect=true} = {}) {
    if (mode() === "local") {
      return { ok: true, mode: "local", ready: false, profile: null, message: "Lokale veilige testmodus" };
    }
    if (!dw()?.client) {
      return { ok: false, mode: mode(), ready: false, message: "Supabase-client niet beschikbaar" };
    }
    let session = null;
    try { session = await dw().getSession(); }
    catch (error) { return { ok:false, mode:mode(), ready:false, message:error.message || "Sessiefout" }; }

    if (!session) {
      if (cfg.requireFieldLogin && redirect) {
        location.replace(loginTarget()+"?login=required");
      }
      return { ok:false, mode:mode(), ready:false, message:"Geen actieve medewerkerssessie" };
    }

    try {
      const profile = await getProfile();
      if (!profile || profile.is_active === false) {
        if (cfg.requireFieldLogin && redirect) location.replace(loginTarget());
        return { ok:false, mode:mode(), ready:false, message:"Medewerkersprofiel niet actief" };
      }
      try { await client().rpc("touch_field_login"); } catch {}
      return {
        ok:true, mode:mode(), ready:true, profile,
        user: session.user,
        message: mode() === "live" ? "Productiekoppeling actief" : mode() === "pilot" ? "Gecontroleerde Woningcheck-pilottest actief" : "Productiecontrole actief"
      };
    } catch (error) {
      return { ok:false, mode:mode(), ready:false, message:error.message || "Profielcontrole mislukt" };
    }
  }

  async function systemCheck() {
    const checks = [];
    const add = (label, status, detail) => checks.push({label,status,detail});

    add("Integratiemodus", mode() === "local" ? "warn" : "pass",
      mode() === "local" ? "Veilige lokale testmodus." : `Modus: ${mode()}.`);

    if (!dw()?.client) {
      add("Supabase-client", "fail", "Geen online client. Vul eerst de publieke Supabase-config in.");
      return checks;
    }
    add("Supabase-client", "pass", "Client is gestart.");

    try {
      const session = await dw().getSession();
      add("Medewerkerssessie", session ? "pass" : "fail",
        session ? `Actieve sessie: ${session.user?.email || "gebruiker"}.` : "Geen actieve sessie.");
    } catch (error) {
      add("Medewerkerssessie", "fail", error.message || "Sessiecontrole mislukt.");
    }

    for (const [table, label] of [
      ["field_users","Medewerkers & rollen"],
      ["leads","Centrale leads"],
      ["lead_meta","Lead metadata"],
      ["product_intakes","Productvragen"]
    ]) {
      try {
        const { error } = await client().from(table).select("*",{head:true,count:"exact"}).limit(1);
        if (error) throw error;
        add(label, "pass", `${table} is bereikbaar binnen de huidige rechten.`);
      } catch (error) {
        add(label, "fail", `${table}: ${error.message || "niet bereikbaar"}`);
      }
    }

    return checks;
  }

  async function findExistingLeadId(visit) {
    if (visit.production_lead_id) return visit.production_lead_id;
    const c = client();
    if (!c) return null;
    try {
      const { data, error } = await c
        .from("lead_meta")
        .select("lead_id")
        .eq("external_id", visit.id)
        .maybeSingle();
      if (error) throw error;
      return data?.lead_id || null;
    } catch {
      return null;
    }
  }

  async function ensureLead(visit) {
    const existingId = await findExistingLeadId(visit);
    if (existingId) {
      visit.production_lead_id = existingId;
      return { id: existingId, reused: true };
    }
    const lead = await dw().createLead(leadPayload(visit));
    visit.production_lead_id = lead.id;
    return lead;
  }

  async function patchExtendedMeta(leadId, visit, profile) {
    const c = client();
    if (!c) return;
    const patch = {
      field_worker: profile?.email || profile?.display_name || visit.employee || null,
      updated_at: now()
    };
    if (visit.product === "ai") patch.ai_scan_data = normalizedAiData(visit);
    const { error } = await c.from("lead_meta").update(patch).eq("lead_id", leadId);
    if (error) throw error;
  }

  async function processWoningcheck(leadId, visit) {
    const fn = cfg.processFieldReportsFunction || "process-field-reports";
    const { data, error } = await client().functions.invoke(fn, {
      body: { lead_id: leadId, woningcheck: woningSnapshot(visit) }
    });
    if (error) throw error;
    if (data?.ok !== true) throw new Error(data?.error || "Rapportverwerking niet bevestigd.");
    return data;
  }

  async function uploadPhotos(leadId, visit) {
    const bucket = clean(cfg.photoBucket);
    if (!bucket || !visit.photos?.length || !visit.consent?.photos) return [];
    const c = client();
    const uploaded = [];
    for (let i=0; i<visit.photos.length; i++) {
      const item = visit.photos[i];
      if (!item?.data) continue;
      const match = /^data:(image\/[^;]+);base64,(.+)$/.exec(item.data);
      if (!match) continue;
      const mime = match[1];
      const bytes = Uint8Array.from(atob(match[2]), ch => ch.charCodeAt(0));
      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
      const path = `${leadId}/${visit.id}-${i+1}.${ext}`;
      const { error } = await c.storage.from(bucket).upload(path, bytes, {
        contentType: mime, upsert: true
      });
      if (error) throw error;
      uploaded.push({bucket,path,name:item.name || `foto-${i+1}.${ext}`});
    }
    return uploaded;
  }

  function deterministicNotes(visit) {
    if (visit.product === "ai") return aiReadableNotes(visit);
    if (visit.product === "energie") return energyReadableNotes(visit);
    if (visit.product === "woningcheck") return woningReadableNotes(visit);
    return [
      `Bezoekstatus: ${visit.visit_status || ""}`,
      visit.notes ? `Notities medewerker: ${visit.notes}` : ""
    ].filter(Boolean).join("\n");
  }


  function assertProductionGuard(visit, profile) {
    const currentMode = mode();

    if (currentMode === "pilot") {
      const role = String(profile?.role || "").toLowerCase();
      const email = String(visit.contact?.email || "").trim().toLowerCase();
      const isAdmin = ["admin", "beheerder"].includes(role);
      const isPilotEmail = /\+fieldtest[^@]*@gmail\.com$/i.test(email);

      if (visit.product !== "woningcheck") {
        throw new Error("Pilotbeveiliging: alleen de Woningcheck-test is in pilotmodus toegestaan.");
      }
      if (!isAdmin) {
        throw new Error("Pilotbeveiliging: alleen een beheerder mag de Woningcheck-productietest uitvoeren.");
      }
      if (!isPilotEmail) {
        throw new Error("Pilotbeveiliging: gebruik uitsluitend een Gmail-testalias met +fieldtest in het e-mailadres.");
      }
      if (!visit.consent?.privacy) {
        throw new Error("Pilotbeveiliging: privacybevestiging ontbreekt.");
      }
      if (visit.photos?.length && !visit.consent?.photos) {
        throw new Error("Pilotbeveiliging: foto aanwezig zonder fototoestemming.");
      }
      if (!visit.consent?.report_email) {
        throw new Error("Pilotbeveiliging: zet voor deze productietest toestemming voor het persoonlijke rapport per e-mail aan.");
      }
      return;
    }

    if (currentMode !== "live") return;

    if (visit.product !== "ai") {
      throw new Error(
        "Productiebeveiliging: deze release is nu vrijgegeven voor Zakelijk → AI Efficiency Scan. " +
        "Woningcheck en Energie & Compliance worden nog afzonderlijk gevalideerd."
      );
    }
  }

  async function saveVisit(visit) {
    const currentMode = mode();

    if (!["live", "pilot"].includes(currentMode)) {
      return {
        ok: true,
        dryRun: true,
        skipped: false,
        message: currentMode === "check"
          ? "Controlemodus: payload gecontroleerd, niets naar productie geschreven."
          : "Lokale modus: niets naar productie geschreven."
      };
    }

    if (NO_LEAD_STATUSES.has(visit.visit_status)) {
      return {
        ok: true,
        skipped: true,
        message: `${visit.visit_status} is lokaal geregistreerd en niet als echte lead naar DW Business Platform gestuurd.`
      };
    }

    if (!navigator.onLine) throw new Error("Geen internetverbinding. Het dossier blijft lokaal in de wachtrij.");

    const state = await bootstrap({redirect:false});
    if (!state.ready) throw new Error(state.message || "Productieverbinding niet gereed.");

    assertProductionGuard(visit, state.profile);

    const lead = await ensureLead(visit);
    await dw().upsertLeadMeta(lead.id, leadMeta(visit));
    await patchExtendedMeta(lead.id, visit, state.profile);

    const notes = deterministicNotes(visit);
    if (notes) {
      try { await dw().updateLead(lead.id, { notes }); }
      catch (error) { console.warn("Lead opgeslagen, notities konden niet op leads worden bijgewerkt.", error); }
    }

    const photos = await uploadPhotos(lead.id, visit);
    if (photos.length) {
      try {
        const { error } = await client()
          .from("lead_meta")
          .update({ photo_files: photos, updated_at: now() })
          .eq("lead_id", lead.id);
        if (error) console.warn("Foto-metadata niet in lead_meta opgeslagen:", error);
      } catch {}
    }

    let reportResult = null;
    if (visit.product === "woningcheck") {
      reportResult = await processWoningcheck(lead.id, visit);
    }

    visit.production_lead_id = lead.id;
    return {
      ok:true,
      dryRun:false,
      skipped:false,
      leadId:lead.id,
      reportResult,
      message: currentMode === "pilot"
        ? "PILOTTEST geslaagd: testdossier is naar DW Business Platform geschreven en de bestaande Woningcheck-rapportverwerking is gestart."
        : "Dossier staat in DW Business Platform."
    };
  }

  window.DW_PRODUCTION = {
    mode,
    bootstrap,
    systemCheck,
    saveVisit,
    mapLeadPayload: leadPayload,
    mapLeadMeta: leadMeta,
    mapAiData: normalizedAiData,
    mapWoningSnapshot: woningSnapshot,
    mapProductIntakes: productIntakes,
    mapEnergyNotes: energyReadableNotes
  };
})();
