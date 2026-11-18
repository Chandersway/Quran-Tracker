# Aanvullende controle: introductie, talen, uiterlijk en oorspronkelijke inhoud

Datum: 17 november 2026. Alleen broncontrole en geïsoleerde proeven; geen appgegevens of cloudinstellingen aangepast.

## Uitvoering na de audit: onderdeel 20

De bevindingen hieronder beschrijven de oorspronkelijke auditstand. De volgende lokale herstelwijzigingen zijn daarna uitgevoerd; ze wijzigen geen Kotlin-bron, oorspronkelijke importimplementatie, bron-snapshot of gecureerde catalogus.

| Bevinding | Herstelde bediening en bewijs |
|---|---|
| **O20-1** | Alle twaalf oorspronkelijke thema-identifiers plus `system` zijn actief in voorkeuren, decoder, ThemeProvider en de gelabelde ThemePicker. De extra kleuren volgen het bestaande papier/inkt-ontwerp. Statusbalk en navigatie bepalen licht/donker via luminantie in plaats van één vaste achtergrondkleur. Nieuwe imports activeren de bewaarde oorspronkelijke keuze; latere RN-keuzen blijven bij heropenen behouden. Tests controleren alle keuzes, import/opslaan/heropenen en minstens 4,5:1 tekstcontrast op de gebruikte oppervlakken. |
| **O20-2** | De app-, scherm- en modalroots krijgen richting vanuit de app-taal; React Navigation krijgt dezelfde `direction`. Gewone rijen/dock/segmenten spiegelen eenmaal via Yoga. Semantische pijlen spiegelen expliciet; fysieke mushaf-, swipe- en slidercoördinaten behouden hun eigen richting. E-mail/URL-velden blijven LTR. Er is geen `forceRTL`, appherstart of navigatieremount. Een echte React/RN Web-proef op een LTR-document controleert EN → AR → NL, dock, rijen, modal, formulieren, Quran-richting, actieve segmentkeuze, hifz-slider en behouden lokale status. |
| **O20-3** | Na een geslaagde nieuwe import geldt oudere bewaarde voorkeuren zonder stageflag als bestaande gebruiker. Expliciete `LANGUAGE` en `INTRO_PENDING` blijven hervatbaar; `COMPLETED`/`EXISTING_USER` blijven voltooid. Dit gebeurt buiten de ongewijzigde importer. Bij bestaande RN-opslag wordt de originele voorkeur niet opnieuw over een RN-keuze geschreven. |
| **O20-4** | Instellingen toont een aparte hifz-kleurenswitch naast kaartpatronen. De switch schrijft alleen `hifzColorsEnabled`; kleurloos weergeven verandert scores niet. De bestaande trackingkaarten volgen deze voorkeur en de originele `hifz_tint_enabled` wordt bij import geactiveerd. |

De replayhulptekst zegt nu dat de introductie direct opent en dat voorbeelden de opgeslagen voortgang niet veranderen. De zes demo's blijven lokaal; een componentproef doorloopt replay zonder store-acties. Settings opent de gedeelde audio-instellingen met naamzoeken, riwayafilter en kiezen-zonder-starten; audiogedrag wordt afzonderlijk door de audioreview verantwoord. Settings en Reader gebruiken gedeelde instelgrenzen 20–54 voor Arabische tekst; bestaande opgeslagen waarden worden bij laden niet aangepast.

Aanvullende controles: `tests/appearance-preferences.test.ts` en `tests/appearance-controls.test.ts` (**10 tests**), plus de bestaande onboarding-/hydratiecontroles. De browserproef staat lokaal in `.tooling/parity-appearance-layout.mjs`, met geïsoleerde store, native-adapters en iconen. Hij oefent echte React- en RN Web-layout; hij is geen Android/iOS-screenshotmatrix, font- of platformgesturebewijs. De native acceptatie van de gehele herstelronde wordt afzonderlijk bijgehouden door de hoofdreview.

## 20. Introductie, talen en uiterlijk

### Aanwezig

- De taalkeuze Nederlands/Engels/Arabisch en zes introductiestappen staan in `src/features/onboarding/components/OnboardingFlow.tsx:498`, `:555` en `src/domain/onboarding.ts:1`. De bronvolgorde uit Kotlin `ui/OnboardingShell.kt:31` is lezen, hifz, focus, planning, statistieken, groepen.
- Vorige/volgende, overslaan, voortgangsstippen en afronden zijn bereikbaar (`OnboardingFlow.tsx:530`, `:553`, `:608`, `:622`). De normale introductie bewaart stap/taal/afronding via preferences; replay gebruikt eigen componentstate (`:513-533`). `SettingsScreen.tsx:300-306` opent replay direct. De begeleidende tekst zegt nog dat dit bij een volgende start gebeurt; de knop zelf opent meteen.
- Demonstraties voor leesregistraties, scores, focus, agenda en groepen gebruiken lokale `useState` in dezelfde componentfile. Alleen de buitenste flow schrijft introductievoorkeuren, niet echte geschiedenis, scores, plannen of groepsberichten. De domeintests voor demo-tijd/planning en stapvolgorde zijn groen; tijdens deze audit is niet opnieuw elke demo op een toestel doorlopen.
- De expliciete oude stadia `LANGUAGE`, `INTRO_PENDING`, `EXISTING_USER`, `COMPLETED` en opgeslagen stap worden door de importer herkend (`src/migration/legacyRoom.ts:368`, `:470`).
- Licht/donker/systeemthema, mushafkeuze, tekstgrootte en NL/EN-vertalingen zijn beschikbaar in `src/features/account/screens/SettingsScreen.tsx:151-272`. De nieuwe kaartpatroonvoorkeur is een toevoeging; hij vervangt geen hifz-kleurvoorkeur.

### Afwijkingen

**O20-1 — tien oorspronkelijke kleurvarianten niet beschikbaar.** Kotlin biedt twaalf swatches (`ui/HamburgerMenu.kt:669-680`), waaronder pink, mint, lavender, ember, inferno, ocean, sand en drie matte varianten. RN heeft slechts light/dark/system (`src/state/models.ts:11`, `src/shared/theme/index.tsx:10-17`, `SettingsScreen.tsx:153-158`). `legacyRoom.ts:346-350,403` zet de tien extra kleuren om naar light. De originele instelling blijft in de legacy snapshot staan: dit is verlies van de actieve mogelijkheid, niet verwijdering van de oorspronkelijke opgeslagen waarde. Alle twaalf waarden afzonderlijk gereproduceerd met de echte importer; zie `parity-2026-11-17-migration-probes.json`.

**O20-2 — RTL slechts gedeeltelijk toegepast.** Kotlin zet de volledige compositie op RTL bij de in-app Arabische taalkeuze (`MainActivity.kt:156-157`). RN gebruikt Arabische tekstuitlijning en gespiegeld gedrag in enkele controls (`AppText.tsx:47`, `Segments.tsx:33`, `NavigationDock.tsx:148`), maar `Row.tsx:32-48` en `styles.tsx:13,38-44` houden vaste rijrichting en een rechterchevron. `Screen.tsx:27-49`, `AppProviders.tsx:29-64` en `AppNavigator.tsx:93` leggen geen appbrede richting op basis van de geselecteerde taal vast. Daarom is Arabisch kiezen op een LTR-toestel niet gelijkwaardig aan Kotlin's appbrede RTL. Dit is bronbewijs; geen nieuwe native RTL-screenshotmatrix uitgevoerd.

**O20-3 — oudere gebruiker met alleen voorkeuren kan introductie opnieuw krijgen.** Kotlin `data/LanguageEntry.kt:26-29` herkent bestaande voorkeuren/database/installatie als bestaande gebruiker wanneer de nieuwe stageflag ontbreekt. RN `legacyRoom.ts:470-474` kijkt zonder expliciete flag alleen naar vier soorten gegevensrijen of de bestaande RN-vlag. Proef: lege tabellen plus `settings.app_language='nl'` geeft `onboardingComplete=false`; expliciet `EXISTING_USER` geeft true. Het recente Kotlin schrijft normaal wel zo'n expliciete flag. Dit betreft dus oudere/onvolledige migratiestaten, geen fout voor iedere bestaande gebruiker. `legacyAndroid.native.ts:195-209` roept de importer ook aan bij alleen voorkeuren.

**O20-4 — hifz-kleuren aan/uit ontbreekt als actieve voorkeur.** Kotlin `HamburgerMenu.kt:489-494` en `MainActivity.kt:115-116,209-212` bieden een echte switch. RN houdt `hifz_tint_enabled` alleen in het importarchief (`legacyRoom.ts:109`). Zie de trackingreview voor de verdere gevolgen.

**Media-instellingen betekenen audio-instellingen.** Kotlin `HamburgerMenu.kt:328-341,9303` gaat over reciteur, riwaya-filter, naamzoeken en snelheid. Uit het woord media mag geen oude algemene schakelaar voor het verbergen van groepsafbeeldingen worden afgeleid. De audioreview behandelt deze menuverschillen.

## Exacte inhoudscontrole

Uitgevoerd met `parity-2026-11-17-content.py`; verslag `parity-2026-11-17-content.json`.

| Vergelijking met lokale Kotlin-bron | Uitkomst |
|---|---|
| Arabische ayahtekst | Alle 6.236 exact gelijk |
| Nederlandse Siregar-vertaling | Alle 6.236 exact gelijk |
| Engelse Sahih-vertaling | Alle 6.236 exact gelijk |
| Woordvelden en e3rab/grammaticatekst | Alle 6.236 ayahrecords gelijk |
| Audio-optiecatalogi | Alle 114 JSON-structuren gelijk; dit controleert metadata, niet gedownloade audiobestanden |
| Database-, indelings-, licentie- en illustratiekopieën | 1.365 bestanden bytegelijk, inclusief 1.242 mushafafbeeldingen en 114 soerakaarten |
| Bestaande tekstcatalogus | Alle 1.712 entries gelijk aan opnieuw in geheugen uitgevoerde bronextractie; nul extractiewaarschuwingen |
| Zeven boekbeschrijvingen en letterlijke UI-broninventaris | Gelijk aan verse bronextractie |
| Oorspronkelijke gevolgde `app/src/main` en `scripts` | Geen wijzigingen ten opzichte van git HEAD |

De catalogus bevat 1.671 volledige EN/NL/AR-records; de overige records omvatten onder meer oorspronkelijk niet in alle talen aanwezige identifiers/namen/resources. Dat getal is geen bewijs van 41 ontbrekende interfacevertalingen.

Deze uitkomst bewijst behoud van broninhoud. Zij bewijst niet dat elke actieve RN-pagina iedere oorspronkelijke zin op de juiste plek toont, of dat alle nieuwe RN-teksten redactioneel zijn goedgekeurd. De bestaande `docs/COPY_REVIEW.md` verwijst nog naar oude folderpaden en mag niet als actuele sluitende UI-audit worden gebruikt.

## Verificatiegrens

`npm run verify` is opnieuw geslaagd: TypeScript, ESLint en 546/546 bestaande tests. De migratieproeven gebruiken de echte pure importer met verzonnen gegevens. Geen native build, installatie, gegevensmigratie op een gebruikertoestel, clouddeployment, echte push of volledige visuele taaltest is tijdens deze audit uitgevoerd. Import-/exportimplementatie en oorspronkelijke acquisitiescripts zijn niet aangepast.
