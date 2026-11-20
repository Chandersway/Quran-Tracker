# Gedeelde lokale appstatus

Deze map bewaart de gegevens die meerdere functies gebruiken en die een herstart moeten overleven. Tijdelijke schermstatus blijft bij de betreffende functie.

- `models.ts` beschrijft de opgeslagen gegevens en de beginwaarden. Verander bestaande velden alleen met behoud van opgeslagen versie-1-gegevens en de Android-migratie.
- `reducer.ts` verwerkt acties zonder opslag-, netwerk- of React-effecten. De reducer is de plek voor wijzigingen aan de gezamenlijke status; pure berekeningen staan in `domain`.
- `store.tsx` verbindt React met de reducer, hydrateert vóór de schrijfbare store wordt gemount en koppelt geschiedenis aan de huidige eigenaar. `dispatch(action)` werkt de interface direct bij; `commit(action)` doet hetzelfde en geeft daarnaast een promise die pas na duurzame opslag slaagt. Formulieren wachten op `commit` voordat ze sluiten. Bij een fout blijven de wijziging in het geheugen en het concept behouden; opnieuw proberen gebruikt dezelfde notitie-/check-in-identiteit.
- `persistence/snapshotWriter.ts` schrijft snapshots op volgorde en bundelt tussentijdse wijzigingen. Een latere write kan een eerdere nooit overschrijven met oudere gegevens. Mislukte writes worden aan de wachtende formulieren én de globale herstelmelding doorgegeven.
- `persistence/` leest en controleert opgeslagen gegevens en rondt onderbroken migraties af. De opslagkeys blijven gelijk.

Bij een leesfout toont de provider een herstelbare fout en blijft de oorspronkelijke opslagwaarde behouden. Er wordt geen gedeeltelijke status geladen en geen nieuwe migratie gestart zolang er al een opgeslagen waarde bestaat. `retryStorage` leest de opslag opnieuw.

Gedragscontroles staan in `tests/reducer.test.ts`, `tests/state-hydration.test.ts` en `tests/legacy-room-migration.test.ts`. Voer na wijzigingen `npm run verify` uit. Authentificatie, persoonlijke gegevens en importcontracten mogen niet door een mapverplaatsing veranderen.
