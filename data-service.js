(function () {
  const LOCAL_LEADS_KEY = "dw-v3-leads";
  const LOCAL_NOTES_KEY = "dw-v5-notes";
  const LOCAL_REPORTS_KEY = "dw-v9-reports";
  const config = window.DW_CONFIG || {};
  const configured =
    Boolean(config.supabaseUrl) &&
    Boolean(config.supabaseAnonKey) &&
    config.demoMode !== true &&
    Boolean(window.supabase);

  const defaultLeads = [
    {
      id: "demo-1",
      company: "Voorbeeldbedrijf BV",
      contact_name: "Testcontact",
      email: "test@voorbeeld.nl",
      phone: "",
      scan_type: "AI Efficiency Scan",
      status: "Nieuwe lead",
      revenue: 0,
      created_at: new Date().toISOString()
    },
    {
      id: "demo-2",
      company: "Voorbeeld Vastgoed",
      contact_name: "Contactpersoon",
      email: "info@voorbeeldvastgoed.nl",
      phone: "",
      scan_type: "Energie Compliance",
      status: "Rapport verstuurd",
      revenue: 450,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  function readLocal(key, fallback) {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return [...fallback];
    }
    try {
      return JSON.parse(saved);
    } catch {
      return [...fallback];
    }
  }

  function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getLocalLeads() {
    return readLocal(LOCAL_LEADS_KEY, defaultLeads);
  }

  function setLocalLeads(leads) {
    writeLocal(LOCAL_LEADS_KEY, leads);
  }

  function getLocalNotes() {
    return readLocal(LOCAL_NOTES_KEY, []);
  }

  function setLocalNotes(notes) {
    writeLocal(LOCAL_NOTES_KEY, notes);
  }

  function getLocalReports() {
    return readLocal(LOCAL_REPORTS_KEY, []);
  }

  function setLocalReports(reports) {
    writeLocal(LOCAL_REPORTS_KEY, reports);
  }

  let client = null;
  if (configured) {
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  window.DW_DATA = {
    mode: configured ? "supabase" : "local",
    client,

    async getSession() {
      if (!client) {
        return sessionStorage.getItem("dw-auth") === "ok"
          ? { user: { email: "dennis@dw-marketing.nl" } }
          : null;
      }
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async signIn(email, password) {
      if (!client) {
        throw new Error("Online login is niet geconfigureerd.");
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },

    async signOut() {
      if (!client) {
        sessionStorage.removeItem("dw-auth");
        return;
      }
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    async listLeadMeta() {
      if (!client) return {};
      try {
        const { data, error } = await client.from("lead_meta").select("*");
        if (error) throw error;
        return Object.fromEntries((data || []).map((row) => [String(row.lead_id), row]));
      } catch (error) {
        console.warn("Lead-meta tabel nog niet actief; lokale cache blijft beschikbaar.", error);
        return {};
      }
    },

    async upsertLeadMeta(leadId, meta) {
      if (!client) return null;
      const row = {
        lead_id: leadId,
        external_id: meta.externalId || null,
        form_id: meta.formId || null,
        partner: meta.partner || null,
        appointment_status: meta.appointmentStatus || null,
        appointment_date: meta.appointmentDate || null,
        expected_commission: Number(meta.expectedCommission || 0),
        campaign: meta.campaign || null,
        interests: meta.interests || null,
        platform: meta.platform || null,
        video: meta.video || null,
        qualification: meta.qualification || null,
        utm_source: meta.utmSource || null,
        utm_medium: meta.utmMedium || null,
        utm_campaign: meta.utmCampaign || null,
        utm_content: meta.utmContent || null,
        automation_source: meta.automationSource || null,
        automation_status: meta.automationStatus || null,
        captured_at: meta.capturedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try {
        const { data, error } = await client.from("lead_meta").upsert(row, { onConflict: "lead_id" }).select().single();
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn("Lead-meta kon nog niet online worden opgeslagen. Voer V54-SUPABASE-LEADMACHINE.sql uit.", error);
        return null;
      }
    },

    async listLeads() {
      if (!client) return getLocalLeads();
      const { data, error } = await client
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async createLead(payload) {
      if (!client) {
        const leads = getLocalLeads();
        const lead = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          ...payload,
          created_at: new Date().toISOString()
        };
        leads.unshift(lead);
        setLocalLeads(leads);
        return lead;
      }
      const { data, error } = await client
        .from("leads")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updateLead(id, changes) {
      if (!client) {
        const leads = getLocalLeads();
        const idx = leads.findIndex((lead) => String(lead.id) === String(id));
        if (idx >= 0) leads[idx] = { ...leads[idx], ...changes };
        setLocalLeads(leads);
        return leads[idx];
      }
      const { data, error } = await client
        .from("leads")
        .update(changes)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async deleteLead(id) {
      if (!client) {
        setLocalLeads(getLocalLeads().filter((lead) => String(lead.id) !== String(id)));
        setLocalNotes(getLocalNotes().filter((note) => String(note.lead_id) !== String(id)));
        return;
      }
      const { error } = await client.from("leads").delete().eq("id", id);
      if (error) throw error;
    },

    async listNotes(leadId) {
      if (!client) {
        return getLocalNotes()
          .filter((note) => String(note.lead_id) === String(leadId))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      const { data, error } = await client
        .from("notes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async createNote(leadId, content) {
      const cleanContent = String(content || "").trim();
      if (!cleanContent) throw new Error("Vul eerst een notitie in.");

      if (!client) {
        const notes = getLocalNotes();
        const note = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          lead_id: leadId,
          content: cleanContent,
          created_by: "Dennis",
          created_at: new Date().toISOString()
        };
        notes.unshift(note);
        setLocalNotes(notes);
        return note;
      }

      const { data, error } = await client
        .from("notes")
        .insert({ lead_id: leadId, content: cleanContent })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async deleteNote(id) {
      if (!client) {
        setLocalNotes(getLocalNotes().filter((note) => String(note.id) !== String(id)));
        return;
      }
      const { error } = await client.from("notes").delete().eq("id", id);
      if (error) throw error;
    },

    async listReports() {
      return getLocalReports().sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    },

    async createReport(payload) {
      const reports = getLocalReports();
      const now = new Date().toISOString();
      const report = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        status: "Concept",
        created_at: now,
        updated_at: now,
        ...payload
      };
      reports.unshift(report);
      setLocalReports(reports);
      return report;
    },

    async updateReport(id, changes) {
      const reports = getLocalReports();
      const index = reports.findIndex((report) => String(report.id) === String(id));
      if (index < 0) throw new Error("Rapport niet gevonden.");
      reports[index] = { ...reports[index], ...changes, updated_at: new Date().toISOString() };
      setLocalReports(reports);
      return reports[index];
    },

    async deleteReport(id) {
      setLocalReports(getLocalReports().filter((report) => String(report.id) !== String(id)));
    }
  };
})();
