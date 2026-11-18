# iOS-push: van broncode naar een gecontroleerde bezorging

Gecontroleerd tegen de broncode en officiële documentatie op **18 november 2026**. Dit document beschrijft de resterende inrichting. Er is tijdens de recheck geen Apple-account gewijzigd, provisioningprofiel gemaakt, productiegeheim geplaatst, Edge Function gedeployed of echte push verzonden. Een geslaagde TypeScript-test of iOS-JavaScript-export bewijst geen ondertekende iOS-build of APNs-bezorging.

Voor IPA/TestFlight/App Store-stappen: [releasehandleiding](RELEASE_HANDLEIDING.md). Voor migraties, dispatcher, groepsrechten en Realtime: [live chat en backend](LIVE_CHAT_SETUP.md). Realtime en push hebben verschillende infrastructuur: een werkende chatsocket bewijst niets over APNs, en omgekeerd.

## 1. Wat de huidige app al uitvoert

De app gebruikt **native APNs-tokens en een eigen Supabase Edge Function**. Zij vraagt geen ExpoPushToken op en verzendt niet via Expo's Push Service. Een APNs-key die alleen bij EAS is opgeslagen, vult de Supabase-functionsecrets niet automatisch in. Expo ondersteunt deze directe providerroute via `getDevicePushTokenAsync`. [Expo: aangepaste pushprovider](https://docs.expo.dev/push-notifications/sending-notifications-custom/).

| Stap                          | Bestaande code en gedrag                                                                                                                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Native capabilities genereren | `app.config.ts` bevat bundle-ID `com.Ameender.qurantracker`, `expo-notifications` en `enableBackgroundRemoteNotifications: true`. De geïnstalleerde plugin voegt `aps-environment` en `remote-notification` toe; de bestaande audio-backgroundmode blijft bestaan. |
| Ontvangst definiëren          | `index.ts` laadt `groupPushTasks.native.ts` vóór React. Een taak definiëren vraagt geen toestemming en registreert geen ontvanger.                                                                                                                                 |
| Toestel aanmelden             | De expliciete knop in Meldingen → `enablePushDevice`: ingelogde actor controleren, toestemming controleren/vragen, native token ophalen, `register_push_device_v2`, achtergrondtaak registreren, lokale accountgebonden opt-in bewaren.                            |
| Autorisatie                   | Zowel volledige als iOS-provisional toestemming is bruikbaar. Provisional kan stil in het meldingencentrum bezorgen. Lokale leesherinneringen hebben een eigen schakelaar; deze overschrijft de globale groepspushkeuze niet.                                      |
| Registratie vernieuwen        | Tokenlistener, accountlevenscyclus, taalwijziging en terugkeer naar de app synchroniseren een bestaande opt-in. Een andere account wordt niet stilzwijgend aangemeld.                                                                                              |
| Afmelden                      | Lokale accountgate wordt eerst ingetrokken; native meldingen/taak en remote registratie worden opgeruimd. Bij offline remote cleanup blijft serververificatie noodzakelijk.                                                                                        |
| Serververzending              | Commenttrigger → `notification_deliveries` → dispatcher → `group-push` → `claim_group_push_v2` → actuele ontvangercontrole → APNs → `finish_group_push_v1`.                                                                                                        |
| Payload                       | Generieke, gelokaliseerde melding; `kind=group_reply`, event/recipient/group/post-identificatie. De zichtbare tekst bevat geen discussie-inhoud.                                                                                                                   |
| Tikken                        | De app vraagt de bestemming opnieuw op via de geauthenticeerde `get_group_push_target_v1`; een willekeurige URL in een payload wordt niet vertrouwd.                                                                                                               |

**De huidige producer stuurt antwoorden op een discussie.** De postauthor en eerdere commentauthors kunnen een melding krijgen; de nieuwe commentauthor zelf niet. Een nieuwe losse chattekst of ieder ander feedbericht heeft geen algemene pushproducer. Dat is ook de oorspronkelijke Kotlin-grens. Alleen een toggle aanzetten maakt zo'n producer niet aan.

## 2. Apple App ID en ondertekening

1. Gebruik het juiste Apple Developer-team en een fysieke iPhone/iPad voor de uiteindelijke acceptatietest.
2. Controleer in **Certificates, Identifiers & Profiles → Identifiers** de expliciete App ID met bundle-ID `com.Ameender.qurantracker`. Dezelfde waarde moet in de Expo-configuratie, ondertekende app en `APNS_TOPIC` staan.
3. Schakel **Push Notifications** in voor deze App ID. Met Xcode hoort de app-target onder **Signing & Capabilities** dezelfde capability te hebben. De APNs-entitlement is vereist om een native token te krijgen. [Apple: registratie bij APNs](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns).
4. Maak/vernieuw het provisioningprofiel nadat de capability is toegevoegd. Gebruik een developmentprofiel voor een development-ondertekening, een passende distributie/ad-hocconfiguratie voor interne distributie en distributieondertekening voor TestFlight/App Store. EAS kan ondersteunde capabilities synchroniseren; controleer de buildoutput en het uiteindelijke profiel. [Expo: iOS capabilities](https://docs.expo.dev/build-reference/ios-capabilities/).
5. Bouw opnieuw. Een wijziging van native entitlements wordt niet door een gewone Metro-refresh of een JavaScript-update aan een reeds geïnstalleerde binary toegevoegd.

De huidige notificatieplugin zet als brondefault `aps-environment=development`. Dat is geen bewijs voor de entitlement van de uiteindelijk **ondertekende** distributie-app. Inspecteer de archive/export op macOS, bijvoorbeeld met `codesign -d --entitlements :- <pad-naar-app.app>` en, indien aanwezig, `security cms -D -i <pad-naar-app.app>/embedded.mobileprovision`. Controleer `application-identifier`, team-ID en `aps-environment`. Bewaar geen volledige profielen of identificatoren in openbare testlogs.

## 3. Sandbox en productie exact laten overeenkomen

| Ondertekende `aps-environment` | APNs-server                          | Function secret               |
| ------------------------------ | ------------------------------------ | ----------------------------- |
| `development`                  | `https://api.sandbox.push.apple.com` | `APNS_ENVIRONMENT=sandbox`    |
| `production`                   | `https://api.push.apple.com`         | `APNS_ENVIRONMENT=production` |

De Apple-entitlement gebruikt het woord `development`; deze functionsecret gebruikt `sandbox`. TestFlight/App Store gebruikt de productieroute. Leid de omgeving van een EAS-build **niet alleen af uit de naam** `development` of `preview`: controleer de ondertekende entitlement. De serverhost moet bij het native token horen. [Apple: APNs-entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment), [Apple: APNs-endpoints](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns).

**Huidige codegrens:** `APNS_ENVIRONMENT` is één globale instelling van `group-push`. `user_devices` en `register_push_device_v2` slaan geen APNs-omgeving per toestel op. Er bestaat geen `EXPO_PUBLIC_APNS_ENVIRONMENT`-instelling. Deze deployment kan daarom niet automatisch sandbox- en productietokens door elkaar routeren. Gebruik voor sandboxtests een afzonderlijke testbackend/functiondeployment met bijpassende appconfiguratie, of test productieondertekende builds tegen de productieroute. Wissel een productiefunction niet naar sandbox terwijl er productietoestellen op geregistreerd staan.

## 4. APNs-signing key maken

Een Account Holder/Admin maakt via **Certificates, Identifiers & Profiles → Keys → +** een key met **Apple Push Notification service**. Kies bij Configure de juiste omgeving en scope. Bij een topicspecifieke key moet de app-topic opgenomen zijn. Bewaar de `.p8` privé; Apple laat deze niet onbeperkt opnieuw downloaden. Noteer de Key ID en Team ID. [Apple: private key maken](https://developer.apple.com/help/account/keys/create-a-private-key/).

De huidige Apple-documentatie onderscheidt omgevingsspecifieke teamkeys en topicspecifieke keys; ga niet uit van de oude aanname dat iedere nieuwe key automatisch beide omgevingen ondersteunt. De function maakt een ES256-JWT met Key ID, Team ID en tijdstip, en vernieuwt zijn cache binnen een uur. Een key moet de gekozen omgeving en topic toestaan. [Apple: tokengebaseerde verbinding](https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns).

## 5. Supabase-secrets en deployment

| Naam                                        | Exacte inhoud / herkomst                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `APNS_TEAM_ID`                              | Het Apple-team dat de app/key bezit.                                                                                     |
| `APNS_KEY_ID`                               | Key ID van de gekozen APNs `.p8`.                                                                                        |
| `APNS_TOPIC`                                | `com.Ameender.qurantracker`, tenzij de app bewust met een andere geregistreerde bundle-ID wordt uitgebracht.             |
| `APNS_PRIVATE_KEY`                          | Volledige PEM-inhoud van de `.p8`, inclusief begin-/eindregels. De code accepteert ook letterlijke `\n` als regeleinden. |
| `APNS_ENVIRONMENT`                          | Expliciet `sandbox` of `production`. De code-default is productie; stel de waarde bewust in.                             |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Door Supabase aan de function geleverde serveromgeving; nooit publieke Expo-variabelen.                                  |
| `group_push_dispatcher`                     | Vault-secret dat de bestaande SQL-migratie intern genereert. Geen Expo- of APNs-key.                                     |

Plaats de vijf `APNS_*`-waarden in **Supabase → Edge Functions → Secrets** van het bedoelde project. Een alternatief is een beschermd, niet ingecheckt secretsbestand buiten deze repository en `supabase secrets set --env-file <bestand> --project-ref <project-ref>`. Zet keymateriaal niet op de commandoregel, in `.env.example`, EAS `EXPO_PUBLIC_*`, screenshots of logs. Supabase bewaart functionsecrets server-side. [Supabase: functionsecrets](https://supabase.com/docs/guides/functions/secrets).

Voer de deploymentcommando's vanuit de bovenliggende `Quran-Tracker`-repository uit, waar `supabase/config.toml` staat. Controleer eerst `supabase migration list --project-ref <project-ref>` en de migratievolgorde uit de [backendhandleiding](LIVE_CHAT_SETUP.md). De iOS-aanvulling is `20261113090000_group_push_ios.sql`; deze vereist de eerdere groeps-, device-, queue- en dispatchermigraties.

Daarna: `supabase functions deploy group-push --project-ref <project-ref>`. De repositoryconfiguratie gebruikt voor deze function `verify_jwt=false`: de function controleert haar bearer zelf via het Vault-backed dispatchercontract. Zij is geen publiek endpoint waar de app een eigen token/ontvanger/bericht kan aanleveren. [Supabase: functiondeployments](https://supabase.com/docs/guides/functions/quickstart).

Controleer ook het endpoint in de **actuele** databasefunctie `dispatch_group_push_v1`. De historische migraties bevatten de oorspronkelijke vaste projecthost. Voor een ander project hoort een nieuwe, gerichte migratie dit doel aan te passen; het wijzigen van de publieke app-URL doet dat niet. Herschrijf geen reeds toegepaste migratiegeschiedenis.

## 6. Backend uitsluitend-lezen controleren

Deze queries tonen geen keys, tokens, e-mails of berichtinhoud. Voer ze als beheerder in het bedoelde project uit; het zijn geen migraties.

```sql
select to_regprocedure('public.register_push_device_v2(uuid,text,text,boolean,text,boolean,integer,integer,text)') as register_ios,
       to_regprocedure('public.claim_group_push_v2()') as claim_ios,
       to_regprocedure('public.dispatch_group_push_v1()') as dispatcher;

select jobname, schedule, active
from cron.job where jobname = 'group-push-dispatch-v1';

select exists(select 1 from vault.secrets where name = 'group_push_dispatcher')
  as dispatcher_secret_exists;

select platform, active, enabled, count(*) as devices
from public.user_devices
group by platform, active, enabled;

select status, count(*) as deliveries
from public.notification_deliveries
group by status;
```

Ontbrekende RPC's betekenen dat de juiste servermigratie nog niet aanwezig is. Een aanwezige RPC, actieve cron of rij met `platform=ios` bewijst nog geen Apple-bezorging. Controleer de dispatcher-URL zonder Vault-secretwaarden op te vragen. De function gebruikt claimleases, ontvangercontrole vlak vóór iedere verzending en begrensde retries.

## 7. Een echt toestel aanmelden

1. Installeer de passende ondertekende build via de [releasehandleiding](RELEASE_HANDLEIDING.md). Gebruik deze eigen binary voor de test; een webexport of een generieke Expo Go-sessie is niet de acceptatieomgeving.
2. Start de app en log in met een afgesproken testaccount A. Ga naar **Instellingen → Meldingen**.
3. Controleer de systeemstatus. Sta meldingen toe of controleer iOS Instellingen → Apps → Quran Tracker → Meldingen. Stil/provisional toegestaan verschilt van een blokkering; de app toont dat onderscheid.
4. Zet globale groepsmeldingen en de relevante reactie-/antwoordcategorie aan. Kies bij de testgroep een niet-gedempte modus die reacties toestaat. Controleer stille uren en de tijdzone van het toestel.
5. Gebruik **Push op dit apparaat inschakelen**. De app haalt het native APNs-token zelf op en verstuurt dit geauthenticeerd. Handmatig tokens kopiëren is niet nodig voor de gewone end-to-endtest.
6. Controleer dat registratie zonder fout eindigt en dat de backend een actieve/enabled iOS-registratie heeft. Bewaar het resultaat en buildnummer in het acceptatierapport, niet het token.

De APNs-token hoort bij app, toestel en omgeving. Registreer na installatie-/tokenwijzigingen opnieuw via de bestaande appflow; hergebruik geen willekeurig oud token. [Apple: native registratie](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns).

## 8. Een echte antwoordmelding testen

Gebruik twee afgesproken testaccounts en een eigen testgroep. De volgende handelingen plaatsen echte testinhoud en kunnen echte push bezorgen; voer ze alleen uit in de gekozen acceptatieomgeving.

1. Laat account A een post plaatsen of een bestaande testdiscussie beantwoorden. A is actief groepslid en heeft push aangezet.
2. Laat account B op **diezelfde post een comment/antwoord** plaatsen. B krijgt zijn eigen antwoord niet als push. Een losse nieuwe chatpost is hiervoor geen geschikte test.
3. Test A eerst met de app in de achtergrond. Controleer één generieke iOS-melding en tik daarop. De juiste geautoriseerde discussie moet openen.
4. Herhaal met A op de voorgrond. De foregroundhandler onderdrukt de ruwe groepspayload meteen en laat pas na actuele autorisatie één lokale weergave toe. Er hoort geen dubbele banner te verschijnen.
5. Herhaal met de app normaal gesloten, en controleer de route na koude start. Neem iOS force-quit/beperkingen afzonderlijk op; beloof geen onbeperkte achtergrond-JavaScriptuitvoering.
6. Test uitgelogd, andere account, gedempte groep, globale push uit, reactiecategorie uit, stille uren en ingetrokken lidmaatschap. Geen melding mag een ongeautoriseerde discussie openen. Reeds onderweg zijnde OS-alerts en later intrekken van rechten zijn afzonderlijke races; servercontrole verkleint deze, de tikroute controleert opnieuw.
7. Controleer bij de eigen testevent(s) queue-uitkomst en functionresultaat. `sent` betekent dat APNs het verzoek accepteerde; het bewijst niet dat de gebruiker de melding zag. Leg build, signed environment, tijdzone, scenario, zichtbare uitkomst en eventuele foutcode vast.

Apple's [Push Notification Console](https://developer.apple.com/documentation/usernotifications/testing-notifications-using-the-push-notification-console) kan provider/key/deviceproblemen helpen isoleren. Een console-alert slaat de Supabase-recipientpolicy over en is daarom geen vervanging voor de bovenstaande antwoordtest. Gebruik geen echte discussie-inhoud of tokenwaarden in gedeelde bewijzen.

## 9. Fouten gericht oplossen

| Waarneming                                      | Controle                                                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Geen native token / entitlementfout             | Ondertekende `aps-environment`, juiste App ID/team en vernieuwd profiel; maak opnieuw een native build.                            |
| `APNS_CONFIGURATION`                            | Exacte vijf secretwaarden; geldige PEM en omgeving.                                                                                |
| `BadDeviceToken` / `DeviceTokenNotForTopic`     | Tokenomgeving, ondertekende bundle-ID en `APNS_TOPIC`; daarna opnieuw aanmelden met de bedoelde build.                             |
| `InvalidProviderToken` / `ExpiredProviderToken` | Team/Key ID/keyscope, `.p8`-inhoud en serverklok. De function reset haar JWT-cache bij 403.                                        |
| `Unregistered`                                  | Token is ongeldig geworden. De function markeert dit als invalid token; geen oude queue blind opnieuw afspelen.                    |
| Geen queue-item                                 | Test een antwoord, geen losse chattekst; controleer post/commentauthor, actief lidmaatschap, categorie en mutevoorkeuren.          |
| Queue blijft pending                            | Stille uren/tijdzone, cron, dispatcherhost, functiondeployment en retries.                                                         |
| Function geeft `Unauthorized`                   | Dispatcher/Vault-contract controleren; geen anon-key of willekeurig Bearer-token gebruiken om de function handmatig aan te roepen. |
| `sent`, maar geen zichtbare banner              | OS-autorisatie, provisional/stille bezorging, Focus-modus, appstatus, toestelverbinding en Apple-console.                          |

De huidige function slaat niet ieder APNs-redendetail duurzaam op; interpreteer een generieke `failed` niet als een specifieke Applefout zonder providerdiagnostiek. Log geen device-token, Authorization-header, `.p8` of volledige notificatiepayload om dit te onderzoeken.

## 10. Wat vóór een release nog moet worden bevestigd

- Apple App ID/capability, geschikt profiel en ondertekende IPA zijn gecontroleerd.
- De APNs-keyscope, topic, signed environment en functionomgeving komen overeen.
- Migraties, actuele dispatcherhost, Vault, cron en functionsecrets zijn op de bedoelde backend ingericht.
- Een fysieke iOS-test doorloopt registratie, foreground/background/koude start, taprouting en account-/mute-/quiet-hourgevallen.
- De test bewijst zowel provideracceptatie als de zichtbare toesteluitkomst; lokale unit tests en een bundel-export worden apart vermeld.
- Algemene chatpush wordt niet als bestaande functie beloofd. iOS-gesture/PDF/achtergrondaudioacceptatie blijft onderdeel van de bredere native releasecheck.
