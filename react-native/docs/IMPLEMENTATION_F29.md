# Stille chat- en feedupdates — 15 november 2026

De gebruiker zag de chat herhaaldelijk verversen. De berichtendienst gebruikt Supabase, zoals het oorspronkelijke Kotlin `GroupV2Repository`; Firebase Messaging verzorgt pushmeldingen. De actieve chat controleert aanvullend iedere 5 seconden, de feed iedere 30 seconden. De 2 seconden in de typingcontroller zijn een idle-timeout, geen berichtenpoll. Het exact gemelde visuele interval van twee seconden is niet gemeten.

## Diagnose en correctie

De echte controller zette bij elke controle `busy=true` en publiceerde nieuwe lijsten, ook als de opgehaalde berichten gelijk waren. De eerste twee regressies faalden vóór de correctie op een laadflits bij een reeds geladen lege chat en drie onnodige snapshotupdates bij identieke gegevens.

`groupFeedController.ts` houdt achtergrondupdates nu stil. `feedSnapshots.ts` bewaart gelijke lijsten en berichtobjecten, met vergelijking van alle velden inclusief reacties, bijlagen en URL's. Eerste laden en handmatig verversen behouden feedback; echte wijzigingen en fouten blijven zichtbaar. Gelijktijdige leesacties worden achter elkaar uitgevoerd, oudere berichten blijven bereikbaar en een oude response kan een nieuwe serverbevestiging niet wegdrukken. Herverbinden haalt ook berichten op die tussen de eerste HTTP-read en de bevestigde liveverbinding ontstonden.

Onafhankelijke review vond twee concrete herstelgevallen die vóór oplevering zijn gereproduceerd en gecorrigeerd: een verouderde fout bij oudere berichten zodra er geen oudere cursor meer is, en hervatten vóór de eerste succesvolle laadactie. Root reproduceerde daarnaast de eerste-read/socket-readinessrace en sloot die met een afzonderlijke regressie. De [groepsservicegids](../src/services/groups/README.md) beschrijft de verantwoordelijkheden.

## Wat nog niet live is op de gehoste omgeving

De release-emulator stond tijdens de read-only controle in de groepsfeed met **Elke 30 seconden controleren op updates**. Een afzonderlijke gehoste readinessprobe met alleen publieke appconfiguratie, een anonieme verbinding en een niet-bestaand groepsfilter kreeg `CHANNEL_ERROR` / `RealtimeDisabledForConfiguration`: zowel gecombineerd als afzonderlijk voor `group_posts`, `post_comments`, `post_reactions`, `group_media` en `post_attachments`. Er zijn geen berichten opgehaald of serverwijzigingen uitgevoerd. Dit is geen geauthenticeerde twee-ledencontrole of administratieve inspectie van de gehoste database. [Geschoonde probe](../.tooling/f29-hosted-realtime-readiness.json), [diagnose](../.tooling/f29-diagnosis.md).

De voorbereide migratie `20261114120000_group_feed_realtime.sql` en de latere typingmigratie zijn nog steeds alleen lokaal toegepast. De appcorrectie activeert die serverconfiguratie niet. Periodieke controle blijft aanwezig om ontbrekende Realtime-configuratie, verwijderingen en gewijzigde zichtbaarheid op te vangen. Volledig gehost realtimegebruik vereist de inrichting en een geauthenticeerde twee-accountcontrole op die omgeving. Zie ook [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).

## Verificatie

- [Volledige controle](../.tooling/f29-verify.log): **546 tests**, TypeScript en ESLint groen; 34 gerichte community-/chattests inclusief 11 nieuwe regressies.
- [Werkelijke lokale chatadapter](../.tooling/f29-chat-runtime-results.json): **8/8 scenario's**, inclusief twee accounts die berichten via sockets vóór polling ontvangen, paginering, rechtenweigering, accountbinding en herstel na een mislukte verzending. Dit bewijst lokale Supabase-werking, geen gehoste of native iOS-acceptatie.
- [Android-build](../.tooling/f29-release-build.log) en [installatie op release-emulator 5554](../.tooling/f29-install-release-emulator-5554.json) zijn afzonderlijk vastgelegd. De APK blijft een x86_64-emulatorbuild.

De oorspronkelijke import, backendkeuze, pollingintervallen, databasecontracten en bestaande kaartpatrooninstelling blijven behouden.
