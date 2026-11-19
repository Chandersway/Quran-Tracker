# Notities

Deze functie beheert lokale Quran-notities met verwijzingen, mappen, labels, vastzetten en broncompatibele tekstopmaak. Notities worden niet naar nieuwe externe tabellen gesynchroniseerd.

- `screens/NotesScreen.tsx` verbindt routeparameters, de gedeelde store, contextfilters en de schermpresentatie. Een gewijzigde verwijzing na opslaan past de zichtbare context aan zoals voorheen.
- `hooks/useNoteEditor.ts` coördineert openen, bewerken, opslaan, verwijderen en exporteren. Bij onopgeslagen wijzigingen blijft de bevestiging voor verwerpen vereist. `useNoteFilters.ts` bewaart filterkeuzes en leidt de zichtbare selectie af.

Opslaan, vastzetten en verwijderen wachten op `store.commit`. Een opslagfout laat de editor met het concept open. Een nieuwe notitie behoudt dezelfde identiteit bij opnieuw proberen; dubbele tikken worden direct geblokkeerd. Tekst die tijdens een trage write wordt gewijzigd blijft als nieuwe onopgeslagen bewerking staan. De export gebruikt alle notities, eerst vastgezette en daarna nieuwste, zonder de lijst in de store te sorteren of het oorspronkelijke JSON-schema te wijzigen.

De editor gebruikt een vaste compacte werkbalk, een titelregel en een tekstveld dat de resterende hoogte vult. Verwijzing, map, labels, vastzetten en verwijderen staan in een aparte instellingensheet; opmaak heeft een eigen sheet. Een nieuwe notitie zonder verwijzing opent eerst de instellingen, zodat de bestaande opslagvalidatie bruikbaar blijft. Een notitie met bekende verwijzing opent direct op het schrijfvlak.

`Screen` staat hier zonder buitenste scrollcontainer. Alleen het tekstveld of de leespreview scrollt. Op iOS corrigeert een enkele `KeyboardAvoidingView` de beschikbare hoogte; Android gebruikt de bestaande venster-resize. Metadata gebruikt de toetsenbordondersteuning van `Sheet`. Dit voorkomt dubbele correctie en houdt opslaan bereikbaar tijdens typen. De editor blijft `RichNoteInput` gebruiken voor oorspronkelijke opmaak en native invoersynchronisatie.
- `editor/noteEditor.ts` bevat zuivere omzettingen tussen invoervelden en het bestaande notitiemodel, opslaanvalidatie en tekstwijzigingen met opmaakspans. `noteFilters.ts` combineert referentie, onderliggende secties, zoeken, labels, mappen en sortering. `noteFormat.ts` en `attributedEditorSync.ts` behouden het oorspronkelijke spanformaat en beschermen native invoer en selectie.
- `components/` bevat de notitierij, het volledige editorformulier, filters en de bestaande verwijzings- en rich-text-invoer. Het formulier blijft dezelfde `RichNoteInput` gebruiken; native selectie en invoersynchronisatie zijn niet herschreven.

De bestaande teksten staan ongewijzigd in `i18n/notes.ts`, met dezelfde bronherstelregels als voorheen. `exporting/notesExport.ts` blijft eigenaar van het draagbare JSON-formaat. De platformmodules `services/storage/shareNotesFile.*` schrijven/delen het bestand op native en downloaden het in de browser. De bestandsnaam, UTF-8-inhoud en JSON-envelope blijven gelijk.

`tests/notes-editor.test.ts` controleert nieuwe en gewijzigde notities, validatie, filters, bevestigingen, exportcallbacks en native/web-bestandsafhandeling. `tests/notes-format.test.ts`, `tests/attributed-editor-sync.test.ts` en `tests/import-compatibility.test.ts` controleren de opmaak- en exportcontracten. Voer `npm run verify` uit na wijzigingen; controleer native toetsenbord en selectie daarnaast op een emulator.


## Opslaan in de editor

Het vinkje in de editor blijft bedienbaar totdat een opslagactie loopt. Een ontbrekende of ongeldige verwijzing opent de metadata met een zichtbare uitleg; na de correctie kan daar direct **Notitie opslaan** worden gekozen. Een lege titel én lege tekst geeft een validatiemelding. Een bestaande ongewijzigde notitie sluit zonder overbodige opslagopdracht. Een mislukte schijfopslag behoudt het concept en de identiteit voor opnieuw proberen; ook het terugdraaien van een optimistische wijziging wordt alsnog duurzaam opgeslagen. `tests/notes-save-control.test.ts` doorloopt hiervoor de echte editorhook, de view en de headerknop, inclusief alle vijf verwijzingstypen.

## Importeren en algemene mappen

`NotesScreen` biedt **Notities importeren** naast exporteren. De platformbestandskiezer leest op native een cachekopie en op web het geselecteerde browserbestand. Beide controleren de bestandsgrootte vóór het inlezen van de tekst. De limieten zijn 10 MiB en 10.000 notities. `domain/notesLibrary.ts` leest de Kotlin/RN-export `notes_export` met schemaversie 2. De import bewaart alle vijf verwijzingstypen, tekst, opmaakspans, labels, map en tijdstempel. Een ongeldig record weigert het hele bestand, ook als het velden van verschillende verwijzingstypen combineert.

`notes/import` voegt de geldige notities in één reduceractie toe. Bij botsende ID’s krijgt elke nieuwe notitie een vrije lokale ID. Als de hoogste veilige gehele waarde al in gebruik is, zoekt de import een vrije lagere waarde. Ook de editor gebruikt deze toewijzing. Bij herimport slaat de app identieke inhoud met dezelfde oorspronkelijke metadata over.

Algemene mappen bestaan los van een Quran-verwijzing. `noteFolders` bewaart expliciet gemaakte lege mappen; de map van een notitie blijft het bestaande `folder`-veld. `note/folder-create` en `note/move` bewaren de veranderingen via `store.commit`. Verplaatsen verandert uitsluitend de map, niet de ayah, opmaak, leesteller of oorspronkelijke tijdstempel. De folderbalk combineert expliciete mappen en bestaande notitiemappen.

Onderaan staat de mapbalk met **Map maken**, **Alles** en **Zonder map**. Sleep de verplaatsgreep (vier pijlen) van een notitie naar een map. `NoteFoldersBar` meet de mapbalk en de afzonderlijke mappen in venstercoördinaten. Tijdens het scrollen worden de metingen vernieuwd. De doelmap licht op wanneer de greep zich boven het zichtbare gedeelte bevindt. Tikken op de greep, activeren met een schermlezer of indrukken van Enter of de spatiebalk op web opent de mapkiezer. Vanuit die kiezer kun je een nieuwe map maken en de notitie in één opslagactie daarin plaatsen. Bij het kiezen van een bestaande map blijft de volledige mapnaam behouden.

`tests/notes-import-library.test.ts` controleert schema-roundtrip, foutieve imports, ID-botsingen, herimport, lege mappen, verplaatsen en dropgrenzen. `tests/notes-library-adapters.test.ts` controleert de echte native/web-adapters en dragcallbacks. Native aanraking, schermlezer en bestandskiezer moeten daarnaast tijdens apparaat-QA worden doorlopen.
