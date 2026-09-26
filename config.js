window.DW_CONFIG = {
  /*
   * DW APP v4
   *
   * integrationMode:
   *   "local" = veilig lokaal testen, geen Supabase-writes
   *   "check" = productieverbinding/login/tabellen controleren, geen writes
   *   "live"  = echte dossiers opslaan in DW Business Platform
   *
   * Begin met "local". Zet pas op "check" nadat je dezelfde publieke
   * Supabase URL + anon/publishable key gebruikt als je huidige Werkapp.
   * Zet pas op "live" na onze systeemcheck + testlead.
   */
  integrationMode: "live",
  requireFieldLogin: true,
  loginUrl: "field-login.html",

  // Gebruik hier later DEZELFDE publieke waarden als in je huidige Werkapp.
  // Nooit de service_role key in deze browserapp zetten.
  supabaseUrl: "https://bsqfobdjzszompyvgxxk.supabase.co",
  supabaseAnonKey: "sb_publishable_gUwTR3jYnxaWgx8czMJ2QQ_zyyve8PP",
  demoMode: false,

  // Bestaande productiecomponenten.
  processFieldReportsFunction: "process-field-reports",
  photoBucket: "",

  sourceLabel: "Buitendienst",
  platformLabel: "DW APP",
  defaultCampaign: "FIELD-APP-PRODUCTIE",
  APP_VERSION: "5.1.0-visual"
};
