# Kaartpatronen instellen — 15 november 2026

Het grote achtergrondpatroon achter **Hifz-overzicht** en **Te herhalen** is verwijderd. De dekkende achtergrond van `StatisticsSurface` blijft aanwezig, zodat de scrollanimatie geen tekst van achterliggende blokken laat doorschijnen. De overige kaartpatronen blijven standaard aan.

Onder **Instellingen → Uiterlijk → Kaartpatronen** staat een native schakelaar. Uitzetten maakt kaarten effen en verbergt ook de decoratieve Arabische watermerken op statistiekkaarten. De wijziging geldt direct voor gewone kaarten, statistiekoppervlakken en de speciale snelkoppelingen. De keuze blijft lokaal opgeslagen; bestaande gebruikersgegevens krijgen standaard `true` als de nieuwe voorkeur ontbreekt. Een opgeslagen `false` blijft behouden.

## Verantwoordelijkheden

- `state/models.ts` en `state/persistence/decodeState.ts`: voorkeur, beginwaarde en achterwaarts compatibele normalisatie.
- `features/account/screens/SettingsScreen.tsx`: schakelaar met volledige Nederlandse, Engelse en Arabische labels.
- `shared/theme/index.tsx`: aparte boolean-context, beschikbaar via `useCardPatterns()`.
- `shared/components/CardOrnament.tsx` en `features/practice/components/ArabicWatermark.tsx`: centrale controle vóór het tekenen van de decoratie.
- `features/home/screens/MainScreen.tsx`: het Hifz-/herhaaloverzicht gebruikt altijd `ornament={false}`.

Zie ook de [componentgids](../src/shared/components/README.md), [themagids](../src/shared/theme/README.md) en [opslagdocumentatie](../src/state/persistence/README.md).

## Controle

- [Volledige verificatie](../.tooling/f28-patterns-verify.log): TypeScript, ESLint en **535 tests groen**. De nieuwe controles dekken oude/ongeldige voorkeuren, behoud van `false` bij opslagherstel en het uitschakelen van alle decoratieve families en watermerken met behoud van dekkende kaartinhoud.
- Onafhankelijke agentreview van de echte Settings-/themacode, NL/EN/AR, RTL en de centrale decoratiecontrole: geen blocker gevonden.
- [Android-releasebuild](../.tooling/f28-patterns-release-build.log): x86_64 voor de lokale emulators. Dit is geen ARM64-telefoonbuild of native iOS-controle.
- [Native controle](../.tooling/f28-patterns-native-results.json): aan/uit, herstart, opgeslagen keuze bij installatie-update en opnieuw aanzetten. Lichte en donkere effen kaarten zijn visueel gecontroleerd; Hifz blijft effen met patronen ingeschakeld.
- Installatiebewijs met teruggelezen APK-hash en behouden package-UID: [QA 5556](../.tooling/f28-patterns-install-release-emulator-5556.json) en [release 5554](../.tooling/f28-patterns-install-release-emulator-5554.json).

De eerdere [F27-controles](IMPLEMENTATION_F27.md) blijven historische controles van die aflevering. Deze wijziging betreft alleen kaartdecoratie en de lokale weergavevoorkeur.
