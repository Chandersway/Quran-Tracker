# Schermfeedback en laatste controles — 19 november 2026

Dit verslag beschrijft de wijzigingen naar aanleiding van de schermafbeeldingen. Het is geen bewijs dat alle externe diensten zijn ingericht of dat elke interactie op een fysieke iPhone is uitgevoerd.

## Lezen

- Alle ingangen gebruiken dezelfde reader-policy. De mushaf opent fullscreen; de originele pagina's staan verticaal onder elkaar. De kleine sluit- en audioknop zijn doorzichtig en vrij verplaatsbaar. Slepen activeert de knop niet.
- Selectiestroken op ondersteunde scans gebruiken de geometrie van precies die afbeelding. Afbeelding, uitsnede, highlight en aanraakgebied delen dezelfde transformatie. De bestaande ayahacties bieden kopiëren, delen, notities en bladwijzers.
- Medina-scans en de selecteerbare QPC-tekst hebben niet overal dezelfde paginering. Bij 5:77 is de originele pagina 120, de selecteerbare pagina 121. Vertalingen, audioherhaling, paginadichtheid, leesmarkeringen, bladwijzers en hervatten dragen daarom de weergave mee. Oude leesregistraties worden niet stilzwijgend herschreven.
- De nieuwe scanbestanden worden reproduceerbaar afgeleid met `scripts/prepare-printed-scan-geometry.py`. De oorspronkelijke afbeeldingen, Quran-tekst en bestaande bronbestanden blijven behouden. Een willekeurig PDF-bestand krijgt geen verzonnen ayahcoördinaten of leesdekking.
- De focustimer staat als klein doorzichtig klokje onder de systeemstatusbalk en blijft ook bij fullscreen lezen zichtbaar.

## Navigatie, plannen en uiterlijk

- Meer toont Audio en reciteur direct, naast een eigen ingang voor bladwijzers. Ayah- en paginabladwijzers kunnen worden gesorteerd. Instellingen begint met Account; Uiterlijk staat onderaan.
- De afzonderlijke Hizb- en Juz-schermen tonen hun eigen indeling. De categorieën op het Soera-scherm kunnen naar een nieuwe regel lopen.
- Khatma-planning toont de werkelijke soera-/ayahgrenzen en kan het juiste begin openen, met behoud van de planningskoppeling.
- Mijn leesplan en het dagelijkse doel blijven afzonderlijke gegevens. Opslaan of corrigeren van het plan verandert het dagelijkse doel niet.
- De statistieken tonen eerst de onderdeelgrafieken, daarna de geschiedenis en daarna het hifz-overzicht. Het misleidende overzicht Sterk is verwijderd; hifz-scores behouden hun eigen kleuren en herhaaladvies. De dubbele planning van vandaag is verwijderd.
- Er zijn extra matte kleurvarianten. Kaartpatronen blijven een instelbare optie. De checklistheader scrollt mee en de notitie-editor geeft meer ruimte aan de inhoud.

## Notities

De import leest het bestaande Kotlin/RN-formaat `notes_export`, schemaVersion 2, zonder dat contract te veranderen. Alle vijf koppelingen blijven behouden: juz, hizb, rub, soera en ayah. Een ongeldig bestand wordt als geheel afgewezen. Bestaande notities worden niet overschreven; conflicterende ID's krijgen een vrije waarde. Ook de grens van veilige JavaScript-gehele getallen is afgevangen.

Algemene mappen blijven bestaan wanneer ze leeg zijn. Via de sleephandgreep kan een notitie naar een zichtbare map worden verplaatst. Dezelfde actie is bereikbaar via de mapkiezer voor toetsenbord en schermlezer. Een nieuwe map maken en de notitie verplaatsen wordt als één wijziging bewaard.

## Herinneringen en externe afhankelijkheden

De dagelijkse herinneringen uit Kotlin zijn lokale apparaatmeldingen. Firebase is bedoeld voor servergestuurde groepspush en is geen voorwaarde voor een dagelijkse leesherinnering.

Na onboarding wordt toestemming eenmalig aangeboden. Een geweigerde toestemming wordt niet steeds opnieuw gevraagd. Toestemming, Android-kanalen, instellen van de tijd, stille uren en opslaan worden samen afgehandeld. Bij de eerste bewezen toestemming na het tijdstip van vandaag kan één lokale inhaalmelding worden ingepland; latere dagen gebruiken de herhalende systeemmelding. De registratie voorkomt opnieuw afspelen van een mogelijk al getoonde of weggeveegde melding. Voltooien van het leesdoel schakelt de dagelijkse herinnering niet uit.

Zie [de notificatiecontrole](LOCAL_REMINDER_PARITY_2026-11-19.md) voor toestelproeven en grenzen. De werkelijke dagelijkse aflevering, herstart en energiebesparing moeten op de doeltelefoon worden beoordeeld. Supabase Realtime, FCM/APNs, Apple-providerconfiguratie en een ondertekende native iOS-build vereisen de afzonderlijke stappen uit de betreffende handleidingen. Het OTA-document blijft een uitvoeringsplan.

## Afleveringsstatus

Drie onafhankelijke reviewers draaiden op GPT-6.2 Astra met maximale redeneerkracht. De gezamenlijke eindcontrole slaagt: **828/828 tests**, TypeScript, ESLint en de volledige formattingcontrole. De vernieuwde inventaris resolveert alle bronverwijzingen voor 198 Kotlin-bestanden en 56 featuregroepen. De oorspronkelijke Kotlin-broncode is niet aangepast. Inventarisdekking is geen claim van volledige native of externe acceptatie.

De Android-, iOS- en webexports slagen. De lokale Android-release voor arm64 en x86_64 bouwde in 1 minuut en 36 seconden. De iOS-export is een JavaScript-/assetbundel, geen ondertekende IPA of fysieke iPhone-proef.

APK, **253.059.991 bytes**:

```text
android/app/build/outputs/apk/release/app-release.apk
output/builds/quran-tracker-local.apk
SHA-256: 4666866353db19a3a8a376443330a653c982883e82ec397db4f1f7273f2854f8
```

De APK is met `install -r` geïnstalleerd op `wirdna-qa` (`emulator-5554`). De geïnstalleerde `base.apk` is teruggelezen en heeft exact dezelfde hash als beide lokale APK's. Bestaande appgegevens zijn niet gewist.

De native controle bevestigde:

- Vanaf de dock opent de oorspronkelijke Warsh Maknoon direct fullscreen met doorlopende pagina's, kleine sluitknop en audioknop.
- Tikken op de gedrukte tekst van Malik yawm ad-din highlight de juiste strook en opent de volledige canonieke ayah met vertaling en acties voor kopiëren, delen, notitie, bladwijzer, woorden en herhalen.
- De sluitknop verplaatst diagonaal zonder fullscreen te verlaten; een volgende tik op de verplaatste knop opent de gewone bediening.
- Een echte focussessie toont de kleine transparante timer rechtsboven op het fullscreenboek. De proefsessie is daarna gereset.
- De tijdkiezer vroeg daadwerkelijk de Android-notificatietoestemming. Na toestaan en bewaren van de bestaande tijd 08:00 verscheen de inhaalherinnering in het Android-notificatiescherm. Toestemming was vervolgens `true`, kanaalbelangrijkheid `3`. Dit is ontvangstbewijs voor deze emulatorproef, geen meerdaagse of rebootproef.

De uitvoeringslogs en schermafbeeldingen staan lokaal onder de genegeerde `.tooling/`; persoonlijke groepsbeelden worden niet meegecommit. De developmentserver gebruikt poort 8081 met Fast Refresh. De code is gepusht op `work/react-native-complete-audit-20261118`. Ook de [nieuwe CI-run voor commit 5318904](https://github.com/Chandersway/Quran-Tracker/actions/runs/44607731889) is vóór de eerste stap geblokkeerd: het GitHub-account is wegens een billingprobleem vergrendeld. De native Android-job is daardoor overgeslagen. De lokale controles hierboven zijn groen; remote CI is niet groen.

Nog afzonderlijk nodig: ontvangst op de doeltelefoon, dagelijkse herhaling en herstart, native iOS-build/toestelacceptatie, hosted Realtime- en serverpushconfiguratie en de overige expliciet externe stappen uit de handleidingen. De gewone configuratiecheck voor cloudbuilds meldt terecht het ontbrekende `EXPO_PROJECT_ID`; `check-config.mjs --local` slaagt. Er is geen verzonnen project-ID ingevuld en geen storepublicatie uitgevoerd.
