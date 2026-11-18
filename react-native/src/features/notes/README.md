# Notities

Deze functie beheert lokale Quran-notities met verwijzingen, mappen, labels, vastzetten en broncompatibele tekstopmaak. Notities worden niet naar nieuwe externe tabellen gesynchroniseerd.

- `screens/NotesScreen.tsx` verbindt routeparameters, de gedeelde store, contextfilters en de schermpresentatie. Een gewijzigde verwijzing na opslaan past de zichtbare context aan zoals voorheen.
- `hooks/useNoteEditor.ts` coördineert openen, bewerken, opslaan, verwijderen en exporteren. Bij onopgeslagen wijzigingen blijft de bevestiging voor verwerpen vereist. `useNoteFilters.ts` bewaart filterkeuzes en leidt de zichtbare selectie af.

Opslaan, vastzetten en verwijderen wachten op `store.commit`. Een opslagfout laat de editor met het concept open. Een nieuwe notitie behoudt dezelfde identiteit bij opnieuw proberen; dubbele tikken worden direct geblokkeerd. Tekst die tijdens een trage write wordt gewijzigd blijft als nieuwe onopgeslagen bewerking staan. De export gebruikt alle notities, eerst vastgezette en daarna nieuwste, zonder de lijst in de store te sorteren of het oorspronkelijke JSON-schema te wijzigen.

De editor gebruikt `Screen.avoidKeyboard`: de gedeelde focusmeting schuift het actieve veld boven het toetsenbord. Een tweede `KeyboardAvoidingView` binnen de scrollinhoud zou de beschikbare ruimte dubbel corrigeren en is daarom verwijderd.
- `editor/noteEditor.ts` bevat zuivere omzettingen tussen invoervelden en het bestaande notitiemodel, opslaanvalidatie en tekstwijzigingen met opmaakspans. `noteFilters.ts` combineert referentie, onderliggende secties, zoeken, labels, mappen en sortering. `noteFormat.ts` en `attributedEditorSync.ts` behouden het oorspronkelijke spanformaat en beschermen native invoer en selectie.
- `components/` bevat de notitierij, het volledige editorformulier, filters en de bestaande verwijzings- en rich-text-invoer. Het formulier blijft dezelfde `RichNoteInput` gebruiken; native selectie en invoersynchronisatie zijn niet herschreven.

De bestaande teksten staan ongewijzigd in `i18n/notes.ts`, met dezelfde bronherstelregels als voorheen. `exporting/notesExport.ts` blijft eigenaar van het draagbare JSON-formaat. De platformmodules `services/storage/shareNotesFile.*` schrijven/delen het bestand op native en downloaden het in de browser. De bestandsnaam, UTF-8-inhoud en JSON-envelope blijven gelijk.

`tests/notes-editor.test.ts` controleert nieuwe en gewijzigde notities, validatie, filters, bevestigingen, exportcallbacks en native/web-bestandsafhandeling. `tests/notes-format.test.ts`, `tests/attributed-editor-sync.test.ts` en `tests/import-compatibility.test.ts` controleren de opmaak- en exportcontracten. Voer `npm run verify` uit na wijzigingen; controleer native toetsenbord en selectie daarnaast op een emulator.
