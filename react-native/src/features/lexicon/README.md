# Lexicon

`screens/LexiconSearchScreen.tsx` doorzoekt alle 1.642 QAC-wortels en 4.832 lemma's. Een lege zoekopdracht bladert door de volledige bron. `screens/LexiconScreen.tsx` opent een exacte wortel/lemma of controleert eerst de gekozen woordtekst bij de exacte canonieke positie. De lezer en de woord-voor-woordstudie openen deze route; het menu opent zoeken.

`LexiconDetail` houdt QAC-morfologie, contextuele glossen en originele Lane-wortelartikelen apart. Wortels openen woordfamilies, lemma's openen hun eigen concordantie, en alle vindplaatsen openen de exacte canonieke Hafs-aya. De volledige Engelse/Arabische bronartikelen zijn per trefwoord uitklapbaar en selecteerbaar; bron, paginanummer, node-ID, versie en licentie blijven zichtbaar. De volledige GPL-licentie is in de UI bereikbaar.

Database, normalisatie en repository staan in `services/lexicon`. De componenten beheren geen databases. Er wordt geen Warsh-woordkoppeling afgeleid: alleen de daadwerkelijke gekozen tekst met een gecontroleerde QAC-positie krijgt een lexiconresultaat.
