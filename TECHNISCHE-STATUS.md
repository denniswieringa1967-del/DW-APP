# DW APP — technische status 13 november 2026

## Uitgevoerd

- Werkbranch bijgewerkt zonder merge naar main of openbare app-publicatie. Werkbranch bevat geen ingevulde API-keys, tokens, service-role keys, apparaatsleutels of privé klantgegevens. Hostingconfiguratie blijft buiten Git.
- Bestaande centrale bezoekroute behouden: bedrijfs-/adresselectie, aparte Energiecheck, Compliance en AI, gedeelde bezoekgegevens, corrigeerbare velden en afzonderlijke toestemming per scan.
- Aparte beveiligde `dw-field-visit`-ontvanger geplaatst, standaard geen productieaanvragen. Bestaande campagnes en review-ontvanger niet vervangen.
- In de echte afgeschermde DW Flow-keten 22 controles geslaagd: twee fictieve leads, herhaalde en gelijktijdige inzendingen, één lead bij verschillende telefoonnotaties, bestaande lead aan nieuw bezoek koppelen, correcte bronnen/campagne/UTM, extra scan bij dezelfde lead, aanvullen kort dossier, terugbelmoment, private documentopslag en weigering bij verkeerd dossier/bezoek.
- Fictieve leads, bestanden, uploadtoegang en bezoekregistraties verwijderd. Tijdelijke testtoegang gesloten; nieuwe aanvraag wordt geweigerd met 403. Controlewaarden van oorspronkelijke leads en metadata exact gelijk gebleven.
- Bestaande rasterizer hergebruikt; source van een beveiligde hostinggateway toegevoegd. Jaarafrekening heeft dossier- én bezoekkoppeling. Geen openbare documentlink.
- Native Samsung-testpakket is eerder gebouwd en ondertekend met een aparte testhandtekening. Caller-ID logica en apparaatbewijs zijn automatisch getest. Dit is geen afgeronde toesteltest.

## Nog nodig voor dagelijks gebruik

1. De echte app-hosting moet de veilige runtimeconfiguratie en documentgateway krijgen; daarna een beschermde test met de echte ingelogde eigenaar. De website-intake moet via de bestaande server met een private gatewayconfiguratie aangesloten worden. Die hostingtoegang/configuratie is hier niet beschikbaar en is niet verzonnen.
2. Bestaande dossiers buiten de nieuwe ZEB-registratie moeten vóór koppeling op identiteit worden gecontroleerd. De server valideert eigenaar, bedrijf, telefoon en adres; een ontbrekend of afwijkend adres wordt veilig geweigerd. Automatische reparatie van echte dossiers is niet uitgevoerd.
3. Voor caller-ID: Samsung installeren, de openbare apparaatsleutel eenmalig koppelen, de bevestigde HTTPS-dossierlink configureren en bellen met een bekend en onbekend nummer. Dit kan niet zonder het fysieke toestel worden afgetekend.
4. Betrouwbare bedrijfsnaam bij een onbekend adres blijft handmatige invoer zolang geen bestaande betrouwbare bedrijfsbron is aangesloten. PDOK vult uitsluitend adressen; geen KVK-abonnement gestart.

Geen betaalde dienst, advertentie, main-merge of openbare livegang geactiveerd.

DW APP BUITENDIENST GEREED VOOR DAGELIJKS GEBRUIK: NEE
CALLER-ID GEREED VOOR DAGELIJKS GEBRUIK: NEE
