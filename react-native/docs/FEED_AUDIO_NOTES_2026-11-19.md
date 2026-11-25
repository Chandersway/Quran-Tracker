# Groepsfeed, leesaudio en notities - 19 november 2026

## Resultaat

De groepsfeed gebruikt compacte, effen berichtkaarten met een kleine avatar, naam, korte tijd, berichtmenu en een gezamenlijke actieregel. Een tik wisselt de huidige waardering; lang indrukken of het pijltje opent alle vier waarderingen. Alleen aanwezige aantallen verschijnen. Bestaande rechten voor bewerken, vastzetten, rapporteren, verwijderen en delen blijven gelden.

Nieuwe berichten van anderen worden gebufferd achter een melding, zodat achtergrondverversing de leesvolgorde niet plots verandert. Bekende berichten krijgen wel hun actuele tekst en aantallen. Oudere pagina's sluiten onderaan aan. De gewone feed toont geen technische controlefrequentie.

De compacte uitnodiging opent de berichteditor. Het reactievenster gebruikt compacte rijen en een invoerbalk boven het toetsenbord. Concepten blijven tijdens deze app-/account-/groepssessie behouden bij sluiten of een verzendfout; dit is geen nieuwe opslaggarantie na een procesherstart. Reactieavatars gebruiken bestaande ledendata, zonder extra databasequery of schemawijziging.

In fullscreen Mushaf opent de duidelijkere, verplaatsbare audioknop een kleine onderbalk met reciteurkeuze, snelheid, afspelen/pauzeren en echte voortgang. De reciteurnaam opent direct het doorzoekbare reciteuroverzicht. Wegvegen of sluiten verbergt de balk en stopt de audio niet. De bestaande speler blijft de enige audio-eigenaar. Een geselecteerde herhaalreeks wordt niet ongemerkt door een hele soera vervangen.

Het notitievinkje was stil uitgeschakeld als de koppeling ontbrak. Het vinkje reageert nu: ongeldige koppelingen openen de metadata en tonen de ontbrekende keuze; lege tekst geeft uitleg. Alleen tijdens werkelijk opslaan is de actie geblokkeerd. Een onveranderde, al opgeslagen notitie sluit zonder nieuwe schrijfopdracht. Een opslagfout behoudt het concept en dezelfde identiteit voor opnieuw proberen. Importformaten blijven behouden.

## Controle

- `npm run verify`: 862/862 tests, TypeScript en ESLint geslaagd.
- Formatting: alle gecontroleerde bron- en testbestanden geslaagd.
- Android-, iOS- en webexports geslaagd. Dit vervangt geen ondertekende native iOS-toesteltest.
- Kotlin-inventaris: 198 bestanden, 47.640 regels, 56 featuregroepen; geen ontbrekende bestandsdekking of onopgeloste bronankers. Dit bewijst inventarisdekking, geen volledige functionele gelijkheid.
- De echte React Native-feed is met een geisoleerde lokale fixture bekeken: kort bericht, lang bericht, afbeelding, meerdere waarderingen/reacties en het reactievenster met het Android-toetsenbord. Geen echte groepsberichten verstuurd. Ook Engels, Arabisch/RTL, donkere modus en systeemlettergrootte 1,3 gecontroleerd. Lettergrootte hersteld naar 1,0; fixture gestopt.
- Bij het toetsenbord bleef de reactie-invoer 42 fysieke pixels boven de toetsenbordrand. De volledige Nederlandse actie 'Vind ik leuk' is native zichtbaar.
- De audiobalk, directe reciteurzoeker en wegvegen zijn op de dev-emulator waargenomen. De speler liep tot 0:29 van een opname van 54:46; na wegvegen bleef de pauzeknop zichtbaar. Testaudio vervolgens gepauzeerd. Dit is geen luistercontrole van alle opnames.
- Notities: het oorspronkelijke uitgeschakelde vinkje native gereproduceerd; na correctie opent het vinkje de ontbrekende koppeling en is de testnotitie daadwerkelijk opgeslagen. Ook ongewijzigd afsluiten via het vinkje en behoud na force-stop/herstart zijn native bevestigd. Daarna is uitsluitend de tijdelijke testnotitie verwijderd; het oorspronkelijke aantal nul is hersteld.

Lokale screenshots en logs staan genegeerd onder `.tooling/`; gebruikersgegevens worden niet meegecommit.

## Lokale APK

`android/app/build/outputs/apk/release/app-release.apk` en `output/builds/quran-tracker-local.apk`

- Grootte: 253.083.243 bytes.
- SHA-256: `fe5f308f84dc416002a3a5b587695f18b47e9ae231de165365d96e88c2d9479d`.
- Android-build geslaagd: 810 taken; kandidaat op QA geinstalleerd met behoud van appgegevens. De geinstalleerde base.apk is teruggelezen en heeft dezelfde SHA-256.

Hosted Supabase Realtime en serverpush zijn geen onderdeel van deze lokale vormgevingscontrole. Zie [livechatconfiguratie](LIVE_CHAT_SETUP.md) en [iOS-push](IOS_PUSH_SETUP.md). De eerder gecontroleerde GitHub Actions-run werd door GitHub vanwege een accountbillingblokkade niet gestart; lokale controles zijn wel uitgevoerd. Geen storepublicatie verricht.

De dev-emulator is opnieuw verbonden met de normale Metro op poort 8081: bundel HTTP 200, 21.619.664 bytes en Stats zichtbaar zonder laadbanner. QA staat eveneens op Stats. De actuele processen op beide emulators melden geen AndroidRuntime- of ReactNativeJS-foutregels.
