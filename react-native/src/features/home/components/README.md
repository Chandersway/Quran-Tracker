# Dashboardblokken

Deze componenten worden samengesteld door `../screens/MainScreen.tsx`:

- `TodayReadingCard`: voortgang van het dagdoel en snel registreren; de berekening blijft in `domain/goals`.
- `ResumeReadingCard`: hervatten op de exacte opgeslagen boekeditie en pagina; de keuze blijft in `domain/mushafResume`.
- `TodayPlanning`: afspraken van vandaag en afvinken, via bestaande state-acties.
- `HizbOverviewCard`: leesfrequentie per hizb, inclusief eigen datumbereik.
- `PracticeOverview`: motivatiepunten, onafhankelijke Hifz-beoordelingen en herhaaladvies.

Algemene knoppen, tekst, oppervlaktes en kleuren staan in `shared`. De drie leesverdelingen horen bij `features/practice/components`; het dashboard gebruikt diezelfde component en detailgegevens. Voeg hier geen tweede statistiekberekening of directe backendaanroep toe.
