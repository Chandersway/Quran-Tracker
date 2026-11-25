# Studie

`screens/StudyScreen.tsx` toont studie-informatie bij een aya; `StudySourcesScreen.tsx`, `BooksScreen.tsx` en `MutashabihatScreen.tsx` verzorgen bronnen, boeken en vergelijkbare passages. `BookReaderScreen.tsx` opent een gekozen studieboek. De gedeelde boekcatalogus en oorspronkelijke schermteksten staan in `model/bookCatalog.ts`. Gebundelde inhoud komt uit `content/study.ts`; bronaanbieders staan in `services/study`.

`StudySourcesScreen` bindt het bronformulier aan de route-identiteit; `StudySourceContent` beheert formulier, vaste referenties en selecteerbare resultaten. `services/study/studyRequest.ts` legt een onveranderlijke aanvraag vast en weigert oude antwoorden na bron-/referentiewijziging. Een vaste Warsh/Hafs-selectie wordt niet vervangen wanneer een boek geen dekking heeft. Contextuele Iʿrāb gebruikt Quranpedia; gebundelde grammatica blijft een aparte functie.

Geselecteerde gecontroleerde woorden openen de routes uit `features/lexicon`; deze map beheert geen woordenboekdatabase. Quranpedia blijft online met expliciete ontbrekende bron-/retrytoestanden; een bronartikel wordt niet door gegenereerde tekst vervangen.

Een samengevoegde gedrukte Warsh-aya behoudt alle canonieke referenties bij kopiëren, delen en woordstudie. `StudyScreen` laadt elk gekoppeld vers en bewaart per woord de oorspronkelijke soera, aya en woordpositie voor de woordenboekroute. Een enkel vers behoudt de bestaande vorige-/volgende-ayabediening.

Asbab toont uitsluitend geïndexeerde boeken, soera's en aya's via `AvailableSourcePicker`; contextuele keuzes worden bovendien doorsneden met de vaste selectie. Een keuze voor een boek mag nooit naar een passage buiten die selectie springen. De aya-actiebalk toont Asbab alleen wanneer ten minste één gekoppeld canoniek vers gedekte inhoud heeft. De algemene bronpagina behoudt laden, foutmelding en retry voor de online beschikbaarheidsindex.
