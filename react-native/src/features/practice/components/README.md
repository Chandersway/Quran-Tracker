# Onderdelen voor voortgang en oefening

Schermen staan in `../screens`. In deze map staan de samenstelbare interfaceonderdelen.

`ReadingStatisticsOverview` verbindt opgeslagen leesgeschiedenis met de domeinberekeningen, periodekeuze en details. Het dashboard gebruikt de compacte presentatie `ReadingStatisticsSummary`; de aparte statistiekpagina toont alle aantallen, verdelingen en geschiedenis. Beide gebruiken `ReadingDistributionRing`, met dezelfde segmentselectie en dezelfde registraties. Een lege ring betekent nul registraties, geen onbekende of verzonnen voortgang.

`StatisticsSurface` zorgt voor een dekkende achtergrond en subtiele geometrische decoratie. Dat voorkomt doorlopende tekst wanneer `RevealBlock` twee blokken tijdens het scrollen tijdelijk over elkaar heen tekent. `ArabicWatermark` is decoratief. Verplaats berekeningen naar `domain`, algemene herbruikbare bediening naar `shared/components`, en platformcommunicatie naar `services`.
