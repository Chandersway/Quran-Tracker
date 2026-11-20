# Opgeslagen status lezen en herstellen

`decodeState.ts` is de zuivere leesmodule voor het bestaande versie-1-formaat. De module controleert ook afzonderlijke records en geneste waarden: bijvoorbeeld `notes: [null]` wordt geweigerd voordat een scherm de notitie gebruikt. Een beschadigd record laat de hele leesactie mislukken; persoonlijke records worden niet stilzwijgend weggefilterd. Onbekende extra velden blijven bewaard.

Ontbrekende optionele versie-1-velden krijgen de bestaande beginwaarden. De bestaande normalisatie van dockkeuzes en boekpresentatie blijft gelden. Vrije Android-tekstvelden, nulwaarden en lege datums worden niet opnieuw getoetst aan strengere huidige invoerregels. De migratie uit Room16 tot en met Room20 blijft eigenaar van de oorspronkelijke gegevensomzettingen.

`preferences.cardPatterns` is een optionele toevoeging aan opgeslagen versie-1-gegevens: ontbrekende of ongeldige waarden krijgen `true`; een expliciete `false` blijft behouden. De instelling staat in hetzelfde lokale voorkeurenrecord als thema en taal.

`preferences.hifzColorsEnabled` herstelt waar nodig de oorspronkelijke `hifz_tint_enabled`-voorkeur; een expliciete RN-keuze heeft voorrang. `readerPositions.ts` herstelt geldige ayahposities per soera uit de al geïmporteerde `last_read_ayah_N`-waarden, zonder de importbestanden of oorspronkelijke snapshot te veranderen. `Plan.reminderDueAt` bewaart een optioneel exact tijdstip voor snelle agendaherinneringen.

`theme` accepteert alle twaalf oorspronkelijke identifiers plus `system`; onbekende ontbrekende waarden vallen veilig terug op `system`. `importedPresentation.ts` activeert direct na een geslaagde nieuwe import de originele themakeuze en het oudere voorkeuren-zonder-stageflag-geval voor onboarding. Expliciete onafgeronde Android-stadia blijven bewaard. Opnieuw openen normaliseert het actuele RN-thema, zonder een oude snapshotwaarde over een latere RN-keuze heen te schrijven. De oorspronkelijke Room-importer blijft ongewijzigd.

`snapshotWriter.ts` verzorgt seriële, gebundelde writes. `save(snapshot)` bevestigt pas wanneer die volledige snapshot of een nieuwere volledige snapshot daadwerkelijk is geschreven. Een mislukte batch wijst alle bijbehorende promises af; volgende writes en opnieuw proberen blijven mogelijk. De store blijft eigenaar van de actuele snapshot en de gebruikersmelding. Test: `tests/snapshot-writer.test.ts`.

`hydrateState.ts` ontvangt opslag en de Android-importfunctie als afhankelijkheden. Bestaande data wordt eerst volledig gedecodeerd; bij een fout volgen geen opslagwrites. Ook een lege opgeslagen string geldt als aanwezige, onleesbare data. Een import mag alleen starten wanneer de statuskey ontbreekt.

De migratie schrijft in deze volgorde: duurzame appstatus, eventuele checklist, voltooiingsmarker. Een herstart na een onderbroken write hervat de ontbrekende zijbestanden vanuit de duurzame status en leest Room niet opnieuw. Een bestaande checklist wordt behouden. De React-provider mount de schrijfbare store pas nadat hydratie slaagt.

`tests/state-hydration.test.ts` controleert corruptie, behoud van de ruwe opslagwaarde, opnieuw proberen, oude beginwaarden en de herstelvolgorde. `tests/legacy-room-migration.test.ts` controleert of de gemigreerde Room16–20-gegevens opnieuw geopend kunnen worden.
