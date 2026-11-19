# Dagelijkse leesherinneringen

Actueel gedrag vanaf 19 november 2026. Dit document beschrijft lokale leesherinneringen; groepspush via Firebase/APNs staat daar los van.

## Instellen

Open **Meer → Instellingen → Notificaties**. Bij nieuwe voorkeuren staan beide leesherinneringen aan: **08:00 en 21:00**, volgens de lokale tijd van het toestel. Je kunt beide tijden wijzigen, één tijd uitzetten, alles uitzetten en stille uren instellen. Geef de app systeemtoestemming voor meldingen. Een bestaande expliciete uitgeschakelde voorkeur blijft uitgeschakeld, ook na import of een upgrade. Een oudere installatie zonder opgeslagen tweede voorkeur krijgt de nieuwe standaardwaarde; de app kan niet raden of een ontbrekende waarde een bewuste keuze was.

De herinneringen gelden zolang het **dagelijkse leesdoel** niet is behaald. Hifz, herhalen en het onafhankelijke hoeveelheid-leesplan veranderen deze regel niet. Er moet een actief leesdoel met een positieve hoeveelheid bestaan. Het doel gebruikt zijn bestaande eenheid en eventuele overgedragen hoeveelheid; een bewust afgehandelde dag krijgt geen nieuwe leesherinnering.

Wanneer een leesregistratie het doel voltooit, annuleert de app de nog geplande leesherinneringen van vandaag. De volgende dagen blijven gepland. Verwijder je een registratie of maak je een leesmarkering ongedaan en valt de voortgang onder het doel, dan herstelt de app de resterende toekomstige tijden van vandaag. Een verstreken tijd wordt hierdoor niet opnieuw afgeleverd. Een eventuele eerste toestemmingsverlening kan wel een eenmalige inhaalherinnering voor een verstreken tijd aanbieden; het afleverregister voorkomt een blinde herhaling na herstart of een onzekere native indiening.

## Werking met een gesloten app

De app dient afzonderlijke **DATE-meldingen** bij het besturingssysteem in. Dat systeem kan deze al ingeplande meldingen afleveren terwijl de app gesloten en offline is. Hiervoor zijn geen Supabase-verbinding, Firebase-sleutels of servercron nodig. De gebruikte datumtrigger wordt beschreven in de [Expo Notifications-documentatie](https://docs.expo.dev/versions/latest/sdk/notifications/#datetriggerinput).

Het schema is een begrensde vooruitplanning, geen onbeperkt achtergrondproces:

- De berekening kijkt maximaal **14 kalenderdagen**, inclusief vandaag, vooruit.
- De app beheert maximaal **30** gelijktijdige lees- en agendameldingen. Eerst worden vervangers ingediend, daarna oude meldingen geannuleerd. Deze conservatieve begroting reserveert ruimte voor beide generaties binnen een limiet van 64 native verzoeken.
- Als leesmeldingen bestaan, krijgen maximaal **14** nabije agendameldingen voorrang, tot de helft van de beschikbare capaciteit. Bij 14 agendameldingen blijven 16 plekken voor lezen over: ongeveer acht dagen met twee tijden per dag. Zonder agenda passen maximaal 28 leestijden binnen het venster van 14 dagen.
- Native verzoeken die niet van deze planner zijn, verkleinen de begroting: `min(30, floor((64 - overigeVerzoeken) / 2))`, met een minimum van nul. Zonder leesmeldingen kan de agenda de volledige beschikbare begroting gebruiken.
- Latere agendameldingen en leestijden buiten de beschikbare begroting worden pas bij de volgende aanvulling ingediend. De instellingen vermelden dat regelmatig openen nodig is.

Aanvullen gebeurt bij openen, terugkeer naar de voorgrond, relevante wijzigingen in geschiedenis/doelen/instellingen en lokale middernacht zolang de app actief is. Bij een gesloten app draait die JavaScript-controle niet. Na uitputting van het venster komen er dus geen nieuwe lokale leesmeldingen totdat de app opnieuw draait. Een wijziging die buiten deze app op een ander toestel plaatsvindt, wordt niet direct op dit toestel geëvalueerd.

Stille uren kunnen een tijd verschuiven. Twee tijden die op hetzelfde aflevermoment uitkomen worden samengevoegd. Na een wijziging van tijdzone worden datums opnieuw volgens lokale tijd berekend bij de volgende aanvulling; reeds ingediende DATE-verzoeken houden tot die tijd hun absolute tijdstip. Android force-stop, systeemblokkades, stille modus en batterijbeleid kunnen aflevering tegenhouden of vertragen. De app claimt geen exacte aflevering in zulke omstandigheden.

## Code en opslag

| Onderdeel                                                                                                                               | Verantwoordelijkheid                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [src/domain/dailyReadingGoal.ts](../src/domain/dailyReadingGoal.ts)                                                                     | Bepaalt of het leesdoel op een datum nog openstaat.                      |
| [src/domain/notificationPreferences.ts](../src/domain/notificationPreferences.ts)                                                       | Standaardtijden, bestaande voorkeuren decoderen en stille uren.          |
| [src/services/notifications/dailyReadingReminders.ts](../src/services/notifications/dailyReadingReminders.ts)                           | Datumschema, ontdubbelen en capaciteit verdelen.                         |
| [src/services/notifications/localReminders.ts](../src/services/notifications/localReminders.ts)                                         | Toestemming, duurzaam opslaan en schema afstemmen met de native planner. |
| [src/services/notifications/planningReminders.ts](../src/services/notifications/planningReminders.ts)                                   | Bestaande transactie en afleverregister voor indiening/annulering.       |
| [src/features/planning/components/PlanningReminderCoordinator.tsx](../src/features/planning/components/PlanningReminderCoordinator.tsx) | Reageren op state, voorgrond en middernacht.                             |
| [src/features/account/components/LocalRemindersPanel.tsx](../src/features/account/components/LocalRemindersPanel.tsx)                   | Instellingen en zichtbare foutmelding bij mislukt opslaan.               |
| [src/features/account/localReminderCopy.ts](../src/features/account/localReminderCopy.ts)                                               | Volledige Nederlandse, Engelse en Arabische uitleg.                      |

De bestaande sleutels voor voorkeuren en het afleverregister blijven behouden. Geen nieuw geheim of databasebeleid is nodig. De wijziging gebruikt de bestaande Expo Notifications-module en vraagt geen nieuwe native dependency, permissie of plugin. Een nieuwe APK/IPA met deze JavaScript-code is wel nodig voor een reeds geïnstalleerde release zonder actieve OTA-route.

Bij een oude installatie waarvan de native wachtrij al bijna vol is, kan de eerste vervanging worden geweigerd. De transactie behoudt dan de vorige meldingen en meldt de fout; hij verwijdert niet eerst alle bestaande meldingen om ruimte te maken.

## Verificatie

Gerichte regressietests:

```powershell
npx tsx --test tests/daily-reading-reminders.test.ts tests/reading-reminder-coordinator.test.ts tests/local-reminder-reconciliation.test.ts tests/local-reminders-panel.test.ts tests/local-notification-preferences.test.ts
```

Deze suite controleert onder andere standaardtijden, expliciete opt-outs, lezen tegenover hifz/herhalen, overgedragen hoeveelheden, completion en undo, toekomstbehoud, capaciteit/agenda, eerste toestemming en inhalen, herstart zonder dubbel afleveren, opslagfouten en de echte coordinator bij middernacht/voorgrond. Het zijn deterministische tests van logica en componentbesturing; ze bewijzen geen fysieke OS-aflevering.

Voer op een testtoestel met de actuele build aanvullend uit:

1. Stel een positief leesdoel in, geef toestemming en zet beide herinneringstijden kort in de toekomst. Controleer dat het OS twee afzonderlijke datummeldingen bewaart en ook volgende dagen bevat.
2. Sluit de app normaal en zet netwerk uit. Controleer aflevering op het ingestelde moment. Herhaal afzonderlijk op Android en een fysieke iPhone; de laatste fysieke iOS-controle is nog vereist.
3. Open de app en voltooi het leesdoel vóór de tweede tijd. Controleer dat die melding vandaag weg is, terwijl morgen behouden blijft.
4. Verwijder die leesregistratie vóór de tweede tijd. Controleer dat die toekomstige tijd terugkomt en niet dubbel is ingepland.
5. Zet één herinnering en daarna alle herinneringen uit. Herstart en controleer dat deze keuzes behouden blijven. Herhaal met geïmporteerde expliciet uitgeschakelde voorkeuren.
6. Test een geweigerde systeemtoestemming, terugkeer uit de systeeminstellingen en stille uren. Een mislukte wijziging moet zichtbaar blijven en mag geen opgeslagen succes suggereren.
7. Controleer op een geïsoleerde testomgeving de middernacht/voorgrond-aanvulling en een volle agenda. Verwacht een korter leesvenster bij capaciteitstekort; verander hiervoor niet de klok van een dagelijks gebruikt toestel of pc.

De eerdere vergelijking met Kotlin staat in [het historische pariteitsverslag](LOCAL_REMINDER_PARITY_2026-11-19.md). De oude vaste-herinneringenregel daarin is bewust vervangen door de hier beschreven doelafhankelijke regel.
