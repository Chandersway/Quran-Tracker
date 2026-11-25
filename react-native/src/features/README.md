# Features

Elke map groepeert een gebruikersfunctie. `screens` bevat routegerichte schermen, `components` bijbehorende onderdelen en eventuele `hooks`, `providers` of `model` de coördinatie en gegevens van die functie. Niet elke feature heeft alle mappen nodig.

Sommige functies hebben extra mappen met een concrete verantwoordelijkheid: `notes/editor` bevat bewerkingen voor de notitie-editor, `quran/gestures` verwerkt leesgebaren en `quran/layout` berekent de indeling van de lezer. Plaats zulke onderdelen bij hun eigen functie; verplaats ze pas naar een gedeelde map als meerdere functies ze werkelijk nodig hebben.

Een scherm kan een bewust herbruikbaar component van een andere feature gebruiken, zoals `home` de statistieken uit `practice/components`; importeer geen ander scherm als herbruikbaar onderdeel. Algemene knoppen en themawaarden horen in `shared`; opslag en netwerk in `services`; testbare regels in `domain`.
