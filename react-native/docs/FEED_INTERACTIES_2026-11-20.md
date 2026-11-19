# Groepsfeed: directe waardering en reactiepaneel

## Gedrag

Een tik op Vind ik leuk verandert icoon en teller meteen. Eerst wachten op de toggle-RPC en vervolgens een volledige feedreload maakte de actie traag en blokkeerde alle kaarten. Nu wordt alleen het betreffende bericht tijdelijk vergrendeld zolang die niet-idempotente toggle loopt. Andere berichten en het reactievenster blijven bedienbaar. Een fout verwijdert de tijdelijke projectie; opnieuw controleren leest de feed en verstuurt niet blind nogmaals dezelfde toggle.

Lang indrukken of de kleine uitklapactie opent de vier bestaande waarderingen in een zwevende balk. Het openen voegt geen rij toe en verschuift andere berichten niet. Zowel Reageren als het reactieaantal opent een groot paneel met compacte ballonnen, avatar, naam, tekst en tijd. De invoerbalk blijft onderaan boven het toetsenbord. Concepten behouden hun bestaande account-/groep-/berichtscope gedurende de app-sessie.

Berichten en beheerbare reacties gebruiken drie puntjes. Er staat geen prullenbak naast de reactie. Verwijderen verschijnt pas als menuactie, gevolgd door de bestaande bevestiging en bevoegdhedencontrole. De iOS-dismissvolgorde blijft behouden. Er zijn geen nepacties, nieuwe rangschikking of ongeïmplementeerde geneste antwoorden toegevoegd.

De interactierichting sluit aan op [Meta's beschrijving van reacties](https://about.fb.com/news/2016/02/reactions-now-available-globally/): tikken voor Like en vasthouden voor alternatieven. Facebook-helppagina's stuurden tijdens deze controle naar een login/blokkade; dit verslag beweert daarom geen exacte inspectie van iedere actuele Facebook-native variant. De vormgeving houdt de eigen kleuren en bestaande iconenset van Quran Tracker.

## Verantwoordelijkheden

- [GroupFeedPostCard](../src/features/groups/components/GroupFeedPostCard.tsx): compacte kaart, zwevende waarderingskiezer en beide ingangen naar reacties.
- [useFeedReactions](../src/features/groups/hooks/useFeedReactions.ts): stabiele projectie, foutfeedback en koppeling aan de actieve account en feed.
- [FeedReactions](../src/services/groups/feedReactions.ts): lokale tellers, één toggle per bericht, rollback en verwerpen van late UI-acknowledgements na account-/schermwissel.
- [GroupDiscussionSheet](../src/features/groups/components/GroupDiscussionSheet.tsx): commentaarballonnen, contextmenu en toetsenbordveilige invoer.
- [Sheet](../src/shared/components/Sheet.tsx): optionele uitgebreide hoogte; andere aanroepers behouden hun inhoudsafhankelijke hoogte.

De projectie is gememoiseerd. Zonder stabiele objectidentiteit zou de snapshotafstemming van de feed tijdens een lopende waardering onnodig blijven renderen. Serverdata, andere lezers en actuele berichtinhoud blijven leidend; alleen de bijdrage van de huidige gebruiker wordt tijdelijk geprojecteerd.

## Controle

- `npm run verify`: 882 app-tests en vier servertests geslaagd, met TypeScript en ESLint.
- `npm run format:check` geslaagd.
- De echte feedcallback is eerst rood gereproduceerd met een onafgeronde serverpromise: de gekozen waardering bleef `null`. Na de wijziging verschijnen selectie en teller voordat die promise wordt voltooid. Tests gebruiken ook de echte feedwindow-hook, achtergrondsnapshots, INITIAL_SESSION, accountwissel, dubbele tikken en read-only foutcontrole.
- Native geïsoleerde fixture: korte/lange berichten, zwevende kiezer, groot reactiepaneel, driepuntjesmenu en echt Android-toetsenbord bekeken. Geen echte groepsmutaties verstuurd. Een tijdelijke testvertraging van drie seconden liet de gewijzigde waardering zien terwijl het verzoek nog liep; dit is geen exacte benchmark voor aanraking-tot-frame op een fysiek toestel.
- De invoer en verzendknop eindigden 42 fysieke pixels boven de toetsenbordrand. Screenshots en logs staan genegeerd onder `.tooling/feed-visual/revision2/`.
- Sluiten/heropenen behield het getypte concept. Arabisch/RTL met systeemletters op 130% is native bekeken; menu's, avatars en verzendactie spiegelen en de tekst past. De productie-APK is daarnaast alleen-lezen geopend in donkere modus met een leeg reactiepaneel. Er zijn geen echte waarderingen, reacties of verwijderingen verstuurd.
- De iOS-JavaScript-bundel is succesvol geëxporteerd. De geïnstalleerde Android-APK heeft dezelfde SHA-256 als de lokale build en de actieve QA-app meldt geen AndroidRuntime-/ReactNativeJS-foutregels.

## Android-build

De release is opnieuw gebouwd en op QA geïnstalleerd met behoud van gebruikersgegevens.

- APK: `android/app/build/outputs/apk/release/app-release.apk`.
- Kopie: `output/builds/quran-tracker-local.apk`.
- Grootte: 253.099.571 bytes.
- SHA-256: `af4bcc19109024a38acacc2e29f8fa76d7c7d29d9c7104dc9769d38cb26fdfc9`.

De nieuwe code verandert geen Kotlin-inhoud, importschema, Supabase-schema of hosted Realtime-/pushconfiguratie. Native iOS-acceptatie blijft apart van de componenttests en bundelcontrole.
