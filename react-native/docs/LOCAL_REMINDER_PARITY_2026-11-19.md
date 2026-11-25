# Dagelijkse meldingen: controle tegen Kotlin

> **Actuele wijziging:** de dagelijkse leesherinneringen zijn inmiddels doelafhankelijk en gebruiken een begrensd datumschema met standaard 08:00 en 21:00. Zie [Dagelijkse leesherinneringen](DAILY_REMINDERS_SETUP.md) voor de huidige regels, bestaande opt-outs, gesloten-app-beperkingen en testprocedure. Onderstaand verslag blijft bewaard als historische vergelijking met Kotlin; de oorspronkelijke regel die vaste herinneringen onafhankelijk van het dagdoel maakte, geldt niet meer voor de nieuwe React Native-flow.

Gecontroleerd op 19 november 2026. Dit verslag gaat over lokale lees- en agendaherinneringen. Groepspush via Firebase/APNs is een afzonderlijke afleverroute.

## Wat de oorspronkelijke app doet

`app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt` gebruikt Android WorkManager voor vaste leesherinneringen en agendaherinneringen. De eerste herinnering staat standaard op 08:00 of op de eerder opgeslagen tijd uit het dagdoel. De optionele tweede tijd is 21:00. Stille uren staan standaard uit, met voorgestelde grenzen van 22:00 tot 07:00. De coördinator plant de volgende lokale controle en houdt daarnaast een periodieke controle van vijftien minuten bij. De aflevering gebruikt een Android-notificatiekanaal met normale belangrijkheid, systeemtoestemming, stille uren en een afleverregister tegen dubbele meldingen.

`MainActivity.kt` vraagt op Android 13 en hoger na de introductie om systeemtoestemming. Een bestaande gebruiker kan de vraag bij het openen van de app krijgen. Zo krijgt ook iemand die de standaardtijd behoudt de gelegenheid om de dagelijkse melding toe te staan.

`NotificationPolicy.kt` maakt de vaste dagelijkse melding onafhankelijk van een voltooid of niet ingesteld dagdoel. De tweede dagelijkse melding heeft een eigen tijd; twee gelijke tijden leveren geen dubbele melding. De agendaflow respecteert afgeronde items en kan nog niet afgeleverde meldingen binnen twaalf uur inhalen. `NotificationPreferencesRepository.kt` deelt de eerste herinneringstijd met het dagelijkse doel. Dit is een tijdinstelling, geen koppeling met het onafhankelijke hoeveelheid-leesplan.

## Gevonden en hersteld

1. **De standaardtijd instellen na de introductie.** De React Native-app had de dagelijkse herinnering standaard aan staan, maar vroeg pas om toestemming na het inschakelen van een schakelaar. De actieve app biedt op Android 13+ en iOS na de introductie nu eenmalig de systeemvraag aan als er een actieve dagelijkse of komende agendaherinnering is. Bij toestemming dient hij meteen het bijbehorende schema in. De app onthoudt de vraag op dit toestel, respecteert een eerdere weigering en laat uitgeschakelde herinneringen uit. Bij terugkeer uit de systeeminstellingen controleert hij de huidige toestemming opnieuw.
2. **Tijd wijzigen.** Vanuit Notificaties en de dagdoel-editor controleert de app de toestemming voor de gekozen tijd. Bij een weigering blijft de fout zichtbaar bij de bewerkbare tijd. In de dagdoel-editor moet de native planner de vervanging accepteren voordat het nieuwe tijdstip als opgeslagen verschijnt. Wie uitsluitend de leeshoeveelheid of eenheid wijzigt, kan het doel ook met geweigerde meldingen opslaan.
3. **Het Android-kanaal herstellen.** De planner maakt het kanaal aan vóór indiening en herstelt het ook als Android al een eigen herinnering met dezelfde sleutel bewaart. Die herinnering behoudt zijn bestaande ID. Een blokkade van het kanaal door de gebruiker blijft van kracht.
4. **Geluid instellen.** Lokale lees- en agendameldingen vragen het standaardgeluid aan. Android-kanaalinstellingen en iOS-systeeminstellingen bepalen de uiteindelijke weergave en het geluid.

## Huidig gedrag en bewijslimieten

De actieve adapter is `src/services/notifications/planningReminderPort.ts`. Hij gebruikt Expo's `DAILY`-trigger voor de vaste tijdstippen en `DATE` voor eenmalige meldingen. De native planner beheert de dagelijkse herhaling terwijl de app op de achtergrond staat. Een voltooid dagdoel behoudt zijn vaste herinnering. Voor nog niet ingediende agendameldingen geldt het bestaande inhaalvenster van twaalf uur.

De lokaal geïnstalleerde Expo SDK 58-bron herstelt opgeslagen schema’s bij `BOOT_COMPLETED`, `REBOOT`, `QUICKBOOT_POWERON` en `MY_PACKAGE_REPLACED`. Het met Android Build Tools uitgelezen APK-manifest bevat deze ontvanger, `RECEIVE_BOOT_COMPLETED` en `POST_NOTIFICATIONS`. Zonder toegang tot exacte alarmen gebruikt de scheduler een inexact alarm dat Android tijdens inactiviteit mag afleveren. Ook bij WorkManager kon de aflevering later vallen dan de gekozen minuut.

**Eerste toestemming na het ingestelde tijdstip.** Wie bijvoorbeeld om 12:00 voor het eerst toestemming geeft voor de herinnering van 08:00 krijgt voor vandaag ook een eenmalige melding. De app reserveert de lokale kalenderdatum en het ingestelde tijdstip vóór het indienen bij het OS. Daarmee blijven herstarten, andere schermtaal en het wegvegen van de melding zonder tweede indiening. Stille uren verschuiven de eenmalige melding naar het eerst toegestane moment op dezelfde dag. Als dat moment morgen valt, neemt de gewone dagherhaling het volgende tijdstip over.

De inhaalbeslissing vereist een vastgestelde eerste toestemming. Bij een bestaande OS-herhaling of onbekende afleverhistorie kan een melding van vandaag al getoond en weggeveegd zijn. De app houdt dan het reguliere schema aan. Als het OS voor de eenmalige melding een onzekere respons geeft, blijft de reservering bewaard en blijft de dagelijkse herhaling actief.

De tests voeren de echte schermacties en schedulerlogica uit met nagebootste OS-antwoorden. Ze controleren het standaardalarm om 08:00, een achtergrondstart, een weigering gevolgd door herstart, herstel via systeeminstellingen, Android-kanaalblokkade, iOS-voorlopige toestemming en fouten bij indiening. Voor daadwerkelijke ontvangst op de telefoon zijn proeven met de gekozen tijd, de tweede tijd, een herstart en stille uren nodig.

## Native ontvangstproef van 19 november

De definitieve lokale release is op `wirdna-qa` (`emulator-5554`) over de bestaande app geïnstalleerd. In Notificaties is de bestaande dagelijkse tijd 08:00 bewaard; de echte Android-toestemmingsvraag verscheen en is toegestaan. Daarna verscheen **Daily reminder — Time for your Quran reading moment.** zichtbaar in het Android-notificatiescherm. De leesbare diagnose bevestigde toestemming `true` en kanaalbelangrijkheid `3`. De instellingen zijn niet naar een testtijd omgezet.

Dit bewijst de eerste lokale inhaalaflevering op deze emulator. Het bewijst geen dagelijkse herhaling, herstart, fysieke telefoonaflevering of FCM/APNs-serverpush. De schermafbeelding en diagnose staan lokaal onder `.tooling/`; het [afleveringsverslag](FEEDBACK_IMPLEMENTATIE_2026-11-19.md) bevat de APK-hash. Het uitsluitend lezende controlescript zelf voert nog steeds geen ontvangstproef uit.

## Zo controleer je de installatie

1. Installeer de bijgewerkte APK met behoud van gegevens. Rond bij een nieuwe installatie de introductie af en kies **Toestaan** wanneer Android om toestemming vraagt. De standaardtijd is 08:00.
2. Open **Meer → Instellingen → Notificaties** om de opgeslagen tijd te zien of te veranderen. Zet lokale meldingen en de dagelijkse herinnering aan als je ze wilt gebruiken. Na een eerdere weigering kun je via dit scherm de systeeminstellingen openen.
3. Controleer in het systeemblok dat meldingen zijn toegestaan en het kanaal voor herinneringen niet geblokkeerd is. Alleen een actieve schakelaar binnen de app verleent geen OS-toestemming.
4. Kies eerst een tijdstip enkele minuten vooruit en bewaar het. Houd rekening met stille uren en systeembeleid voor batterijbesparing. Controleer zowel ontvangst met de app op de achtergrond als weergave met de app geopend.
5. Laat de instelling voor een tweede dag actief om herhaling te controleren. Test de tweede tijd apart; identieke tijden zijn bewust één melding. Herhaal daarna na een normale toestelherstart. Geforceerd stoppen van Android-apps kan hun alarmen blokkeren tot de app opnieuw wordt geopend.

Een optionele, uitsluitend lezende Android-controle is:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-android-reminders.ps1 -DeviceSerial emulator-5558
```

De uitvoer toont uitsluitend permissiestatus, kanaalbelangrijkheid en het aantal Android-alarmverwijzingen naar dit pakket. Het is geen exact aantal geplande herinneringen en geen ontvangstbewijs. Het script wijzigt geen toestemming of tijdstip, verstuurt geen testmelding en exporteert geen appopslag of berichtinhoud. `null` betekent dat Android het betreffende veld niet in de diagnostiek meegaf. De gebruikersinterface leest de actuele OS-status via `notificationSystemPort.ts`.

## Firebase en iOS

Voor lokale dagelijkse herinneringen zijn Firebase-serversleutels, Supabase, een account en een internetverbinding niet nodig. Android vraagt OS-toestemming; iOS vraagt lokale notificatietoestemming. Ook zonder werkende groepspush moeten lokale dagelijkse meldingen functioneren.

Groepspush vereist daarnaast de bij het Android-package passende Firebase-clientconfiguratie in de native build, FCM-serverconfiguratie, een geregistreerd apparaattoken en de geconfigureerde serverafleverroute. Voor iOS zijn Apple-pushrechten, het juiste provisioningprofiel, een geregistreerd APNs-token en APNs-servercredentials nodig. Zonder echte apparaatproef claimen we geen werkende aflevering. De concrete provisioning staat in [live chat en push](LIVE_CHAT_SETUP.md) en [iOS-push](IOS_PUSH_SETUP.md). Privésleutels en servicecredentials horen in de geheime server-/CI-configuratie, nooit in appcode.
