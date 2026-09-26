window.DW_SCANS = {
  "woningBase": [
    {
      "id": "owner_status",
      "label": "Eigenaar of huurder?",
      "type": "single",
      "required": true,
      "options": [
        "Eigenaar",
        "Huurder"
      ]
    },
    {
      "id": "construction_period",
      "label": "Bouwperiode",
      "type": "single",
      "required": true,
      "options": [
        "Voor 1970",
        "1970–1990",
        "1991–2014",
        "Na 2015",
        "Onbekend"
      ]
    },
    {
      "id": "housing_type",
      "label": "Woningtype",
      "type": "single",
      "required": true,
      "options": [
        "Vrijstaand",
        "Twee-onder-een-kap",
        "Hoekwoning",
        "Tussenwoning",
        "Appartement"
      ]
    },
    {
      "id": "heating",
      "label": "Huidige verwarming",
      "type": "single",
      "required": true,
      "options": [
        "Gasketel ouder dan 10 jaar",
        "Gasketel recent vernieuwd",
        "Hybride warmtepomp",
        "Volledig elektrische warmtepomp",
        "Airco-units",
        "Onbekend"
      ]
    },
    {
      "id": "exact_construction_year",
      "label": "Exact bouwjaar (indien bekend)",
      "type": "number",
      "required": false,
      "placeholder": "Bijvoorbeeld 1987"
    },
    {
      "id": "occupants",
      "label": "Aantal bewoners",
      "type": "single",
      "required": false,
      "options": [
        "1",
        "2",
        "3",
        "4",
        "5 of meer"
      ]
    },
    {
      "id": "energy_label",
      "label": "Huidig energielabel",
      "type": "single",
      "required": false,
      "options": [
        "A++++ / A+++",
        "A++ / A+",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "Onbekend"
      ]
    }
  ],
  "woningQualification": [
    {
      "id": "goals",
      "label": "Wat wil de bewoner vooral bereiken?",
      "type": "multi",
      "required": true,
      "options": [
        "Lagere energierekening",
        "Meer wooncomfort",
        "Minder gas gebruiken",
        "Subsidie benutten",
        "Woningwaarde verhogen",
        "Eerst alleen informatie"
      ]
    },
    {
      "id": "decision_term",
      "label": "Beslistermijn",
      "type": "single",
      "required": false,
      "options": [
        "Binnen 1 maand",
        "Binnen 3 maanden",
        "Binnen 6 maanden",
        "Later / oriënterend"
      ]
    },
    {
      "id": "financing_interest",
      "label": "Financiering gewenst?",
      "type": "single",
      "required": false,
      "options": [
        "Ja, graag informatie",
        "Misschien",
        "Nee",
        "Niet gevraagd / onbekend"
      ]
    },
    {
      "id": "subsidy_interest",
      "label": "Subsidiecheck gewenst?",
      "type": "single",
      "required": false,
      "options": [
        "Ja",
        "Misschien",
        "Nee",
        "Niet gevraagd / onbekend"
      ]
    },
    {
      "id": "decision_makers",
      "label": "Zijn alle beslissers betrokken?",
      "type": "single",
      "required": false,
      "options": [
        "Ja, alle beslissers aanwezig",
        "Nee, partner/eigenaar moet nog overleggen",
        "Onbekend"
      ]
    }
  ],
  "woningFollowup": [
    {
      "id": "follow_up",
      "label": "Wat is de gewenste vervolgstap?",
      "type": "single",
      "required": true,
      "options": [
        "Direct afspraak",
        "Telefonisch terugbellen",
        "Persoonlijk rapport sturen",
        "Geen vervolg"
      ]
    },
    {
      "id": "appointment_type",
      "label": "Type afspraak",
      "type": "single",
      "required": false,
      "options": [
        "Huisbezoek",
        "Online gesprek"
      ]
    },
    {
      "id": "preferred_date",
      "label": "Voorkeursdatum",
      "type": "date",
      "required": false
    },
    {
      "id": "preferred_time",
      "label": "Tijdsblok",
      "type": "single",
      "required": false,
      "options": [
        "Ochtend (09:00–12:00)",
        "Middag (13:00–16:00)",
        "Avond (18:00–21:00)",
        "Eerst telefonisch afstemmen"
      ]
    }
  ],
  "productQuestions": {
    "airco": [
      {
        "label": "Aantal ruimtes",
        "active": true,
        "options": [],
        "required": true,
        "sort_order": 10,
        "answer_type": "number",
        "question_key": "room_count",
        "question_text": "Hoeveel ruimtes wilt u koelen of verwarmen?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Ruimtes",
        "active": true,
        "options": [
          "Woonkamer",
          "Slaapkamer",
          "Werkkamer",
          "Zolder",
          "Keuken",
          "Anders"
        ],
        "required": true,
        "sort_order": 20,
        "answer_type": "multiselect",
        "question_key": "rooms",
        "question_text": "Welke ruimtes betreft het?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Oppervlakte",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 30,
        "answer_type": "number",
        "question_key": "approx_surface",
        "question_text": "Wat is ongeveer de totale oppervlakte van deze ruimtes in m²?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Verwarmen met airco",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Misschien"
        ],
        "required": false,
        "sort_order": 40,
        "answer_type": "select",
        "question_key": "heating_use",
        "question_text": "Wilt u de airco ook gebruiken voor verwarming?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Buitenunit",
        "active": true,
        "options": [
          "Ja",
          "Waarschijnlijk wel",
          "Waarschijnlijk niet",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 50,
        "answer_type": "select",
        "question_key": "outdoor_unit_possible",
        "question_text": "Is plaatsing van een buitenunit mogelijk?",
        "questionnaire_version": "v1"
      }
    ],
    "elektra": [
      {
        "label": "Hoofdaansluiting",
        "active": true,
        "options": [
          "1 x 25A",
          "1 x 35A",
          "1 x 40A",
          "3 x 25A",
          "Anders",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 10,
        "answer_type": "select",
        "question_key": "electrical_connection",
        "question_text": "Weet u welke elektrische hoofdaansluiting aanwezig is?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Meterkast",
        "active": true,
        "options": [
          "Jonger dan 10 jaar",
          "10 tot 20 jaar",
          "Ouder dan 20 jaar",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 20,
        "answer_type": "select",
        "question_key": "meter_box_age",
        "question_text": "Weet u ongeveer hoe oud de meterkast is?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Nieuwe installaties",
        "active": true,
        "options": [
          "Warmtepomp",
          "Thuisbatterij",
          "Laadpaal",
          "Inductiekookplaat",
          "Airco",
          "Zonnepanelen",
          "Anders"
        ],
        "required": true,
        "sort_order": 30,
        "answer_type": "multiselect",
        "question_key": "planned_installations",
        "question_text": "Voor welke nieuwe elektrische installaties moet rekening worden gehouden?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Meterkast aanpassen",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 40,
        "answer_type": "select",
        "question_key": "meter_box_upgrade",
        "question_text": "Is er al aangegeven dat de meterkast moet worden aangepast of uitgebreid?",
        "questionnaire_version": "v1"
      }
    ],
    "isolatie": [
      {
        "label": "Bestaande isolatie",
        "active": true,
        "options": [
          "Dakisolatie",
          "Spouwmuurisolatie",
          "Gevelisolatie",
          "Vloerisolatie",
          "Bodemisolatie",
          "HR++ glas",
          "Triple glas",
          "Geen",
          "Weet ik niet"
        ],
        "required": true,
        "sort_order": 10,
        "answer_type": "multiselect",
        "question_key": "existing_insulation",
        "question_text": "Welke isolatiemaatregelen zijn al aanwezig?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Dakisolatie",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Deels",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 20,
        "answer_type": "select",
        "question_key": "roof_insulation",
        "question_text": "Is het dak geïsoleerd?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Muurisolatie",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Deels",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 30,
        "answer_type": "select",
        "question_key": "wall_insulation",
        "question_text": "Zijn de muren of de spouw geïsoleerd?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Vloerisolatie",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Deels",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 40,
        "answer_type": "select",
        "question_key": "floor_insulation",
        "question_text": "Is de begane grondvloer geïsoleerd?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Kruipruimte",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 50,
        "answer_type": "select",
        "question_key": "crawl_space",
        "question_text": "Is er een toegankelijke kruipruimte aanwezig?",
        "questionnaire_version": "v1"
      }
    ],
    "kunststof_kozijnen": [
      {
        "label": "Huidige kozijnen",
        "active": true,
        "options": [
          "Hout",
          "Kunststof",
          "Aluminium",
          "Combinatie",
          "Weet ik niet"
        ],
        "required": true,
        "sort_order": 10,
        "answer_type": "select",
        "question_key": "current_frame_material",
        "question_text": "Van welk materiaal zijn uw huidige kozijnen?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Huidige beglazing",
        "active": true,
        "options": [
          "Enkel glas",
          "Dubbel glas",
          "HR glas",
          "HR++ glas",
          "Triple glas",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 20,
        "answer_type": "select",
        "question_key": "current_glazing",
        "question_text": "Welk type glas is momenteel aanwezig?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Aantal kozijnen",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 30,
        "answer_type": "number",
        "question_key": "frames_to_replace",
        "question_text": "Hoeveel kozijnen wilt u ongeveer vervangen?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Deuren meenemen",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Misschien"
        ],
        "required": false,
        "sort_order": 40,
        "answer_type": "select",
        "question_key": "doors_included",
        "question_text": "Wilt u ook één of meerdere buitendeuren vervangen?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Gewenst glas",
        "active": true,
        "options": [
          "HR++",
          "Triple glas",
          "Geen voorkeur",
          "Advies gewenst"
        ],
        "required": false,
        "sort_order": 50,
        "answer_type": "select",
        "question_key": "desired_glazing",
        "question_text": "Heeft u een voorkeur voor het nieuwe type glas?",
        "questionnaire_version": "v1"
      }
    ],
    "laadpaal": [
      {
        "label": "Elektrische auto",
        "active": true,
        "options": [
          "Volledig elektrisch",
          "Plug-in hybride",
          "Nog niet, wel gepland"
        ],
        "required": true,
        "sort_order": 10,
        "answer_type": "select",
        "question_key": "electric_vehicle",
        "question_text": "Heeft u al een elektrische of plug-in hybride auto?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Auto",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 20,
        "answer_type": "text",
        "question_key": "car_model",
        "question_text": "Welk merk en model auto betreft het?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Eigen parkeerplaats",
        "active": true,
        "options": [
          "Ja",
          "Nee"
        ],
        "required": true,
        "sort_order": 30,
        "answer_type": "select",
        "question_key": "private_parking",
        "question_text": "Heeft u een eigen oprit of privéparkeerplaats?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Elektrische aansluiting",
        "active": true,
        "options": [
          "1-fase",
          "3-fase",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 40,
        "answer_type": "select",
        "question_key": "electrical_connection",
        "question_text": "Weet u of de woning een 1-fase of 3-fase aansluiting heeft?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Slim laden",
        "active": true,
        "options": [
          "Ja",
          "Nee",
          "Advies gewenst"
        ],
        "required": false,
        "sort_order": 50,
        "answer_type": "select",
        "question_key": "smart_charging",
        "question_text": "Wilt u gebruik kunnen maken van slim laden?",
        "questionnaire_version": "v1"
      }
    ],
    "thuisbatterij": [
      {
        "label": "Zonnepanelen",
        "active": true,
        "options": [
          "Ja",
          "Nee"
        ],
        "required": true,
        "sort_order": 10,
        "answer_type": "select",
        "question_key": "has_solar_panels",
        "question_text": "Heeft u momenteel zonnepanelen?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Aantal zonnepanelen",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 20,
        "answer_type": "number",
        "question_key": "solar_panel_count",
        "question_text": "Hoeveel zonnepanelen heeft u ongeveer?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Jaaropbrengst zonnepanelen",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 30,
        "answer_type": "number",
        "question_key": "annual_solar_yield",
        "question_text": "Wat is ongeveer de jaarlijkse opbrengst van uw zonnepanelen in kWh?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Jaarlijks stroomverbruik",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 40,
        "answer_type": "number",
        "question_key": "annual_electricity_usage",
        "question_text": "Wat is ongeveer uw jaarlijkse elektriciteitsverbruik in kWh?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Teruglevering",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 50,
        "answer_type": "number",
        "question_key": "annual_return_to_grid",
        "question_text": "Hoeveel elektriciteit levert u ongeveer per jaar terug aan het net?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Energiecontract",
        "active": true,
        "options": [
          "Vast contract",
          "Variabel contract",
          "Dynamisch contract",
          "Weet ik niet"
        ],
        "required": false,
        "sort_order": 60,
        "answer_type": "select",
        "question_key": "energy_contract",
        "question_text": "Welk type energiecontract heeft u?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Doel thuisbatterij",
        "active": true,
        "options": [
          "Meer eigen zonnestroom gebruiken",
          "Besparen op energiekosten",
          "Slim laden en ontladen",
          "Minder terugleveren",
          "Noodstroommogelijkheid",
          "Anders"
        ],
        "required": true,
        "sort_order": 70,
        "answer_type": "multiselect",
        "question_key": "battery_goal",
        "question_text": "Wat wilt u vooral bereiken met een thuisbatterij?",
        "questionnaire_version": "v1"
      }
    ],
    "vloerverwarming": [
      {
        "label": "Vloeroppervlak",
        "active": true,
        "options": [],
        "required": true,
        "sort_order": 10,
        "answer_type": "number",
        "question_key": "floor_area",
        "question_text": "Wat is ongeveer het oppervlak waar vloerverwarming gewenst is in m²?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Verdieping",
        "active": true,
        "options": [
          "Begane grond",
          "Eerste verdieping",
          "Tweede verdieping",
          "Meerdere verdiepingen"
        ],
        "required": true,
        "sort_order": 20,
        "answer_type": "multiselect",
        "question_key": "floor_level",
        "question_text": "Op welke verdieping wilt u vloerverwarming?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Huidige vloer",
        "active": true,
        "options": [
          "Tegels",
          "Laminaat",
          "PVC",
          "Parket",
          "Tapijt",
          "Beton/dekvloer",
          "Anders"
        ],
        "required": false,
        "sort_order": 30,
        "answer_type": "select",
        "question_key": "current_floor",
        "question_text": "Welke vloerafwerking ligt er momenteel?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Gebruik vloerverwarming",
        "active": true,
        "options": [
          "Hoofdverwarming",
          "Bijverwarming",
          "Weet ik nog niet"
        ],
        "required": false,
        "sort_order": 40,
        "answer_type": "select",
        "question_key": "heating_role",
        "question_text": "Wilt u vloerverwarming als hoofdverwarming of bijverwarming?",
        "questionnaire_version": "v1"
      }
    ],
    "warmtepomp": [
      {
        "label": "Isolatieniveau",
        "active": true,
        "options": [
          "Goed geïsoleerd",
          "Redelijk geïsoleerd",
          "Matig geïsoleerd",
          "Nauwelijks geïsoleerd",
          "Weet ik niet"
        ],
        "required": true,
        "sort_order": 10,
        "answer_type": "select",
        "question_key": "insulation_level",
        "question_text": "Hoe is uw woning momenteel geïsoleerd?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Warmteafgifte",
        "active": true,
        "options": [
          "Radiatoren",
          "Lage temperatuur radiatoren",
          "Vloerverwarming",
          "Convectoren",
          "Anders",
          "Weet ik niet"
        ],
        "required": true,
        "sort_order": 20,
        "answer_type": "multiselect",
        "question_key": "heat_distribution",
        "question_text": "Hoe wordt de warmte momenteel in de woning afgegeven?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Jaarlijks gasverbruik",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 30,
        "answer_type": "number",
        "question_key": "annual_gas_usage",
        "question_text": "Wat is ongeveer uw jaarlijkse gasverbruik in m³?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Jaarlijks stroomverbruik",
        "active": true,
        "options": [],
        "required": false,
        "sort_order": 40,
        "answer_type": "number",
        "question_key": "annual_electricity_usage",
        "question_text": "Wat is ongeveer uw jaarlijkse elektriciteitsverbruik in kWh?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Ruimte voor buitenunit",
        "active": true,
        "options": [
          "Ja",
          "Waarschijnlijk wel",
          "Waarschijnlijk niet",
          "Nee",
          "Weet ik niet"
        ],
        "required": true,
        "sort_order": 50,
        "answer_type": "select",
        "question_key": "outdoor_unit_space",
        "question_text": "Is er buiten voldoende ruimte voor een eventuele buitenunit?",
        "questionnaire_version": "v1"
      },
      {
        "label": "Voorkeur type warmtepomp",
        "active": true,
        "options": [
          "Hybride",
          "Volledig elektrisch",
          "Geen voorkeur",
          "Weet ik nog niet"
        ],
        "required": false,
        "sort_order": 60,
        "answer_type": "select",
        "question_key": "heat_pump_preference",
        "question_text": "Heeft u een voorkeur voor een hybride of volledig elektrische warmtepomp?",
        "questionnaire_version": "v1"
      }
    ]
  },
  "ai": [
    {
      "id": "sector",
      "label": "In welke sector is uw bedrijf voornamelijk actief?",
      "type": "single",
      "required": true,
      "options": [
        "Bouw / retail",
        "Logistiek",
        "Zakelijke dienstverlening",
        "Overig"
      ]
    },
    {
      "id": "admin_hours",
      "label": "Hoeveel tijd besteedt uw team wekelijks aan handmatige administratie?",
      "type": "single",
      "required": true,
      "options": [
        "Minder dan 5 uur (lage prioriteit)",
        "5–15 uur (directe winst mogelijk)",
        "15–40 uur (grote kans op kostenbesparing)",
        "Meer dan 40 uur (kritieke noodzaak voor automatisering)"
      ]
    },
    {
      "id": "manual_tasks",
      "label": "Welke taken worden nu nog handmatig gedaan?",
      "hint": "Meerdere antwoorden mogelijk",
      "type": "multi",
      "required": true,
      "options": [
        "Facturen/bonnen verwerken",
        "Klantvragen beantwoorden",
        "Data overtypen tussen systemen",
        "Social media posts maken",
        "Rapporten opstellen"
      ]
    },
    {
      "id": "duplicate_entry",
      "label": "Hoe vaak moet dezelfde informatie in verschillende systemen worden ingevoerd?",
      "type": "single",
      "required": true,
      "options": [
        "Nooit, alles is gekoppeld",
        "Soms (handmatig overtypen)",
        "Vaak (kost veel tijd)"
      ]
    },
    {
      "id": "lead_followup",
      "label": "Worden potentiële klanten automatisch opgevolgd na een aanvraag?",
      "type": "single",
      "required": true,
      "options": [
        "Ja, direct via een systeem",
        "Soms, maar vaak handmatig",
        "Nee, dat doen we wanneer er tijd is"
      ]
    },
    {
      "id": "ai_marketing_share",
      "label": "Hoeveel van uw marketinginhoud wordt met behulp van AI gemaakt?",
      "type": "single",
      "required": true,
      "options": [
        "0% (alles is handmatig)",
        "25%–50%",
        "Meer dan 75%"
      ]
    },
    {
      "id": "lead_response_time",
      "label": "Hoe snel wordt er gemiddeld gereageerd op een nieuwe lead?",
      "type": "single",
      "required": true,
      "options": [
        "Binnen 5 minuten",
        "Binnen een dag",
        "Pas na enkele dagen"
      ]
    },
    {
      "id": "ai_customer_templates",
      "label": "Worden klantvragen via e-mail of chat beantwoord met behulp van AI-templates?",
      "type": "single",
      "required": true,
      "options": [
        "Ja, we werken al heel efficiënt",
        "Nee, we typen alles nog zelf",
        "We willen dit graag, maar weten niet hoe"
      ]
    },
    {
      "id": "document_search_time",
      "label": "Hoeveel tijd verliest u wekelijks aan het zoeken naar documenten of informatie?",
      "type": "single",
      "required": true,
      "options": [
        "Minder dan 1 uur",
        "2 tot 5 uur",
        "Meer dan 5 uur (grote frustratie)"
      ]
    },
    {
      "id": "main_ai_goal",
      "label": "Wat is uw belangrijkste doel met AI-automatisering?",
      "type": "single",
      "required": true,
      "options": [
        "Kosten besparen",
        "Foutmarges verkleinen",
        "Meer vrije tijd / focus op kernzaken"
      ]
    },
    {
      "id": "fte",
      "label": "Aantal medewerkers in uw team (FTE)",
      "type": "number",
      "required": true,
      "placeholder": "Bijvoorbeeld 10"
    },
    {
      "id": "hourly_rate",
      "label": "Gemiddeld uurtarief",
      "type": "number",
      "required": true,
      "prefix": "€",
      "placeholder": "Bijvoorbeeld 80"
    }
  ],
  "energy": [
    {
      "id": "activity",
      "label": "Wat is de hoofdactiviteit op deze bedrijfslocatie?",
      "type": "textarea",
      "required": true,
      "placeholder": "Beschrijf kort de hoofdactiviteit"
    },
    {
      "id": "annual_energy_band",
      "label": "Wat is het geschatte jaarlijkse energieverbruik op deze locatie?",
      "type": "single",
      "required": true,
      "options": [
        "Vanaf 50.000 kWh elektriciteit óf 25.000 m³ aardgas(equivalent) per jaar",
        "Minder dan 50.000 kWh elektriciteit én minder dan 25.000 m³ aardgas(equivalent) per jaar",
        "Onbekend / ik weet het jaarverbruik niet"
      ]
    },
    {
      "id": "very_high_use",
      "label": "Is het jaarlijkse energieverbruik 10 miljoen kWh elektriciteit of meer, of 170.000 m³ aardgas(equivalent) of meer?",
      "type": "single",
      "required": true,
      "options": [
        "Ja",
        "Nee",
        "Onbekend"
      ]
    },
    {
      "id": "energy_label",
      "label": "Wat is het huidige energielabel van het bedrijfspand?",
      "type": "single",
      "required": true,
      "options": [
        "A of hoger",
        "B",
        "C",
        "D of lager",
        "Onbekend"
      ]
    },
    {
      "id": "led",
      "label": "Is de verlichting op deze locatie volledig LED?",
      "type": "single",
      "required": true,
      "options": [
        "Ja, volledig",
        "Gedeeltelijk",
        "Nee",
        "Onbekend"
      ]
    },
    {
      "id": "heating_setback",
      "label": "Wordt de verwarming buiten gebruiks- of openingstijden automatisch verlaagd?",
      "type": "single",
      "required": true,
      "options": [
        "Ja, automatisch ingesteld",
        "Gedeeltelijk / handmatig",
        "Nee",
        "Onbekend"
      ]
    },
    {
      "id": "equipment_off",
      "label": "Worden apparaten buiten gebruikstijden uitgeschakeld?",
      "type": "single",
      "required": true,
      "options": [
        "Ja, grotendeels automatisch of centraal",
        "Gedeeltelijk, sommige apparaten blijven op stand-by",
        "Nee, hier is nog weinig aandacht voor",
        "Onbekend"
      ]
    },
    {
      "id": "insulation_draught",
      "label": "Hoe beoordeelt u de isolatie en tochtwering van het bedrijfspand?",
      "type": "single",
      "required": true,
      "options": [
        "Goed op orde",
        "Gedeeltelijk op orde",
        "Verbetering lijkt waarschijnlijk mogelijk",
        "Onbekend"
      ]
    }
  ]
};
