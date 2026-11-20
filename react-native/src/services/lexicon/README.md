# Lexiconservices

`lexiconDatabase.ts` opent de lokale database, `lexiconRepository.ts` biedt toegang tot gegevens en `lexiconNormalization.ts` normaliseert zoekinvoer. `lexicon.ts` en `lexiconTypes.ts` verbinden de service en zijn gegevensvormen.

`laneDictionary.ts` is de standaard lokale woordenboekprovider. Alle 20.354 oorspronkelijke Lane-artikelen onder 1.296 exact gekoppelde QAC-wortelkoppen zijn gebundeld. De 346 overige wortels hebben expliciet geen geverifieerde koppeling; er bestaat geen spelling-, hamza-, zwakke-letter- of verdubbelingsheuristiek. De gepubliceerde canonieke QAC-koppen zijn afzonderlijk bewaard; de QAC-corpusdatabase blijft ongewijzigd.

Native importeert QAC en het 57MB-Lane-woordenboek via `services/storage/readOnlyAssetDatabase.ts` naar hashgebonden bestanden in de eigen map `read-only-content`. Er gaat geen volledige woordenboekbuffer door JavaScript. Web deserialiseert de bundel. Beide verbindingen staan op `query_only`; schema- en provenancecontrole gaat aan lookup vooraf, en een mislukte initialisatie kan opnieuw worden geprobeerd. Alleen de eigen contentkopie kan voor herstel worden verwijderd; gebruikersdata wordt niet overschreven.

Reproductie: plaats de gehashte upstream `lexicon.sqlite`, `lexicon.sqlite.zip` en `LICENSE` uit [LexiconDatabase](https://github.com/laneslexicon/LexiconDatabase) in `.tooling/lane`, en voer `python scripts/prepare-lane-lexicon.py` uit. De vastgezette rootmapping en primaire QAC-kopcatalogus staan in `data/lexicon`; bronhashes, versiemetadata, oorspronkelijke XML, citaties en de volledige GPL-3.0-licentie staan in `assets/lexicon`. Displaytekst wordt uitsluitend uit de oorspronkelijke XML gehaald. Er worden geen betekenissen gegenereerd.
