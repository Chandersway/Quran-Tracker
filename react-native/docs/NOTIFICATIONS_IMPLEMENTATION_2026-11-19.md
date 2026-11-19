# Doelafhankelijke herinneringen en groepspush

## Wat veranderd is

Nieuwe lokale voorkeuren hebben twee leesherinneringen: 08:00 en 21:00. Een voltooid leesdagdoel annuleert de resterende tijden van vandaag. Een ongedaan gemaakte registratie herstelt nog toekomstige tijden wanneer het doel weer openstaat. Hifz, herhalen en het losse leesplan worden niet met het leesdagdoel verward. Bestaande expliciete opt-outs blijven behouden.

De planner gebruikt nu afzonderlijke native datumverzoeken. Hij kijkt maximaal veertien kalenderdagen vooruit en deelt maximaal dertig plaatsen met agendameldingen; een volle agenda verkort het leesvenster. Appstart, voorgrond, relevante statewijzigingen en actieve middernachtcontrole vullen het venster aan. Dit is geen onbeperkt achtergrondproces. De [dagelijkse handleiding](DAILY_REMINDERS_SETUP.md) beschrijft de capaciteit, instellingen, bestandslinks en toestelproeven.

Een nieuwe forwardmigratie voegt events voor nieuw gepubliceerde groepsposts toe. Andere actieve leden ontvangen de nieuwe categorie; de auteur niet. De providerworker verwerkt zowel `group_post` als bestaande `group_reply`. Nieuwe posts vereisen de globale updatecategorie en groepsmodus `all`; ontbrekende groepsvoorkeuren volgen dezelfde `all`-standaard als de instellingen-RPC. Gedempte groepen, alleen-vermeldingen, tijdelijk dempen en uitgeschakelde categorieën blijven gerespecteerd. Claims controleren lidmaatschap en voorkeuren opnieuw vlak voor verzending, met leases, begrensde retries en deduplicatie.

De app gebruikt het serverevent om ontvanger, groep, bericht en categorie te bepalen. Een payload kan geen alternatieve bestemming of minder strenge categorie kiezen. Voorgrond- en achtergrondafhandeling delen de autorisatie. De melding bevat een generieke tekst, geen privéberichtinhoud. Android gebruikt FCM, iOS het bestaande directe APNs-pad. De dispatcherorigin komt uit Vault in plaats van een vast productieadres.

## Inrichten en later onderhouden

Begin bij [de volledige groepspushhandleiding](GROUP_PUSH_SETUP.md). Daar staan de actuele klikbare Firebase-, Supabase- en GitHub-projectlinks, de secretbestemmingen, migratievolgorde, deployment, relevante bronbestanden, appopt-in en testmatrix. De hoofd-README en documentatie-index verwijzen hiernaar.

De vereiste uitrolvolgorde is: juiste servercredentials, gecontroleerde migratiegeschiedenis en nieuwe migratie, Vaultorigin, bijpassende Edge Function, bijgewerkte native app, expliciete toestelregistratie en tweeaccounttest. Alleen een APK installeren of een secret in GitHub zetten activeert de server niet. De buildworkflow configureert de native client, maar deployt niet automatisch de pushworker of database.

`npm run test:push-server` test ook de echte Edge-handler met volledig nagebootste netwerkantwoorden. Deze opdracht maakt deel uit van `npm run verify`. `npm run build:apk` gebruikt een eigen tijdelijke Metro-map, zodat een releasebundel de cache van een draaiende devserver of andere export niet wist. De bestaande Android- en iOS-bouwopdrachten en winkelstappen blijven beschreven in [de releasehandleiding](RELEASE_HANDLEIDING.md).

## Bewezen controles en grenzen

- TypeScript, ESLint en formatter slagen.
- 877 app-tests slagen, inclusief nieuwe-postontvangst, deduplicatie, mute/categoriebeleid, koude-start-taprouting, geauthenticeerde target-RPC en dagelijkse doel-/undo-/middernachtregels.
- Vier servertests slagen. De echte FCM-handler verwerkt toegestane posts, weigert ongeldige of geblokkeerde events en plant tijdelijke providerfouten opnieuw; alle netwerkantwoorden zijn nagebootst. Er zijn geen echte Firebase-berichten verstuurd.
- De Android-release is op QA gestart; de nieuwe uitleg en tweede tijd 21:00 zijn native zichtbaar. Op jouw verzoek is de bestaande tweede tijd op QA aangezet naast 08:00. De OS-controle bevestigt toestemming en kanaalbelangrijkheid 3; alarmreferenties nemen toe van 26 naar 56. Dat zijn diagnostische referenties, geen exact aantal meldingen of ontvangstbewijs. De actuele app meldde geen AndroidRuntime-/ReactNativeJS-foutregels.
- De iOS- en webbundels zijn afzonderlijk succesvol geëxporteerd. Dit bewijst JavaScript-bundeling, geen ondertekende IPA of fysieke pushbezorging.
- De eerste daadwerkelijke lokale SQL-proef voor nieuwe posts en de bestaande iOS-SQL-proef slaagden. De laatste correcties voor ontbrekende groepsvoorkeuren en een lege `source_key` konden niet opnieuw tegen PostgreSQL worden uitgevoerd: Docker Desktop herstelde na een volle schijf niet en ook de lokale databasepoort was gesloten. De bijbehorende SQL-regressies staan klaar; dit laatste databasebewijs ontbreekt nog.
- De inventaris controleert alle 198 oorspronkelijke Kotlin-bestanden, 47.640 regels en 56 featuregroepen zonder ontbrekende bestandsdekking of onopgeloste ankers. Dit is geen bewijs van volledige native of hosted acceptatie.
- Hosted migraties, providercredentials en functiondeployment zijn tijdens deze wijziging niet uitgevoerd. Zichtbare aflevering op jouw telefoon, fysieke iOS-acceptatie en de tweerekeningmatrix blijven vereiste installatiecontroles.

De screenshots, buildlogs en tijdelijke testbestanden blijven lokaal onder het genegeerde `.tooling/`. Persoonlijke notities, groepsinhoud en credentials horen niet in deze documentatie of commits.

## Lokale Android-build

De nieuwe release-APK is gebouwd voor arm64 en de x86_64-emulator, zonder nieuwe native dependency. De build met eigen Metro-cache slaagde met 810 taken. De bestaande QA-installatie is bijgewerkt met behoud van gegevens; de hash van de daadwerkelijk geïnstalleerde `base.apk` is gelijk aan de lokale build.

- Bestand: `android/app/build/outputs/apk/release/app-release.apk`.
- Kopie: `output/builds/quran-tracker-local.apk`.
- Grootte: 253.091.919 bytes.
- SHA-256: `e46080060109711898fa627219c7a69026a151cb82e0057e6114570d3234f7f0`.

Dit is de lokaal ondertekende testrelease, geen Play Store-upload of iOS-IPA. Voor een storebuild gebruik je de bestaande releasehandleiding en juiste ondertekening.
