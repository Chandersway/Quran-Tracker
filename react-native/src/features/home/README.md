# Vandaag en overzicht

`screens/MainScreen.tsx` is het dashboard achter de route `Today`. `components/TodayReadingCard`, `ResumeReadingCard` en `TodayPlanning` verzorgen dagdoel, hervatten en afspraken; `HizbOverviewCard` en `PracticeOverview` behouden leesfrequentie, motivatie en onafhankelijke Hifz. Statistieken en zelfstandig leesplanoverzicht worden uit hun eigen features samengesteld.

`model/resumeReference.ts` voorkomt dat een ongekarteerde PDF-/editiepagina als een specifieke laatste aya wordt gepresenteerd. Binnen een geverifieerde pagina behoudt het de precieze opgeslagen aya. Het verandert de opgeslagen route of editie niet. De [componentgids](components/README.md) beschrijft de verdere verdeling; berekeningen blijven in `domain` en I/O in `services`.
