# Groepspush instellen: nieuwe berichten en discussie-antwoorden

Deze handleiding beschrijft het serverpad voor nieuwe groepsposts en antwoorden, de Android-configuratie en de toestelproef. Alle opdrachten hieronder zijn instructies voor de beheerder; het opschrijven ervan betekent niet dat de productieomgeving al is gewijzigd of dat Firebase-bezorging is aangetoond. Paden zijn relatief aan `react-native/`, behalve waar de repositoryroot expliciet wordt genoemd.

De app gebruikt Supabase voor accounts, groepen en de bezorgqueue. Android ontvangt via **Firebase Cloud Messaging HTTP v1**; iOS ontvangt rechtstreeks via **APNs**. De app gebruikt native device-tokens via `getDevicePushTokenAsync`, geen Expo-pushtokens of Firebase Realtime Database. Realtime chat en push zijn afzonderlijke verbindingen. Dagelijkse leesherinneringen worden lokaal op het toestel ingepland en hebben Firebase niet nodig.

Voor de chatverbinding zie [Live chat instellen](LIVE_CHAT_SETUP.md). Voor Apple-capabilities, `.p8`, signing en fysieke iOS-acceptatie zie [iOS-push instellen](IOS_PUSH_SETUP.md). Voor builds en winkels zie [de releasehandleiding](RELEASE_HANDLEIDING.md).

## 1. Kies de juiste projecten

Vervang `<supabase-ref>`, `<firebase-project-id>` en `<github-owner>/<repo>` hieronder door je eigen waarden. Een Firebase-project-ID en Supabase-projectreferentie zijn verschillende identificatoren.

Voor de huidige app zijn de publieke project-ID's gecontroleerd. Gebruik deze rechtstreekse links: [Supabase-project](https://supabase.com/dashboard/project/tboaaxcdnajgttdanfmb), [SQL Editor](https://supabase.com/dashboard/project/tboaaxcdnajgttdanfmb/sql/new), [Function-secrets](https://supabase.com/dashboard/project/tboaaxcdnajgttdanfmb/functions/secrets), [Firebase-appconfig](https://console.firebase.google.com/project/qurantracker-8f775/settings/general), [Cloud Messaging](https://console.firebase.google.com/project/qurantracker-8f775/settings/cloudmessaging), [Firebase-serviceaccounts](https://console.firebase.google.com/project/qurantracker-8f775/settings/serviceaccounts/adminsdk), [FCM API activeren](https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=qurantracker-8f775) en [GitHub buildomgevingen](https://github.com/Chandersway/Quran-Tracker/settings/environments). De placeholdertabel blijft bruikbaar voor een latere andere omgeving.

| Onderdeel                        | Rechtstreekse ingang                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Supabase-project                 | `https://supabase.com/dashboard/project/<supabase-ref>`                                               |
| SQL Editor                       | `https://supabase.com/dashboard/project/<supabase-ref>/sql/new`                                       |
| Edge Functions                   | `https://supabase.com/dashboard/project/<supabase-ref>/functions`                                     |
| Function-secrets                 | `https://supabase.com/dashboard/project/<supabase-ref>/functions/secrets`                             |
| Vault                            | Open het project en kies Database → Vault; gebruik de bestaande `group_push_dispatcher`-secret        |
| Firebase Android-appconfiguratie | `https://console.firebase.google.com/project/<firebase-project-id>/settings/general`                  |
| Firebase Cloud Messaging         | `https://console.firebase.google.com/project/<firebase-project-id>/settings/cloudmessaging`           |
| Firebase-serviceaccounts         | `https://console.firebase.google.com/project/<firebase-project-id>/settings/serviceaccounts/adminsdk` |
| FCM HTTP v1 API                  | `https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=<firebase-project-id>`      |
| Google IAM                       | `https://console.cloud.google.com/iam-admin/iam?project=<firebase-project-id>`                        |
| GitHub buildomgeving             | `https://github.com/<github-owner>/<repo>/settings/environments`                                      |

Dashboardmenu's kunnen veranderen; controleer steeds de project-ID in de adresbalk en de projectkop voordat je iets opslaat. De app-URL, de functiondeployment en de database moeten hetzelfde Supabase-project gebruiken.

## 2. Welke waarden waar thuishoren

| Exacte naam                     | Opslag                                                         | Inhoud                                                                                                                |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Lokaal genegeerde `.env.local`; GitHub buildenvironment-secret | `https://<supabase-ref>.supabase.co`; zichtbaar in de uiteindelijke app                                               |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Zelfde buildomgeving                                           | Supabase publishable key of legacy anon-JWT; nooit een serverkey                                                      |
| `EXPO_PROJECT_ID`               | GitHub buildenvironment-secret / lokale buildomgeving          | Werkelijke Expo-project-UUID                                                                                          |
| `GOOGLE_SERVICES_JSON`          | GitHub buildenvironment-secret; EAS **file**-secret            | In GitHub de volledige Android-client-JSON; lokaal/EAS een bestandspad, geen JSON-string                              |
| `FCM_PROJECT_ID`                | Supabase Edge Function secret                                  | Exact `project_id` van de Firebase-serverserviceaccount                                                               |
| `FCM_SERVICE_ACCOUNT_JSON`      | Supabase Edge Function secret                                  | Volledige serverserviceaccount-JSON, inclusief private key en client email                                            |
| `SUPABASE_URL`                  | Door hosted Supabase aan function geleverd                     | Serverorigin                                                                                                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Door hosted Supabase aan function geleverd                     | Alleen server-RPC's; nooit `EXPO_PUBLIC_*`                                                                            |
| `group_push_dispatcher`         | Supabase Vault                                                 | Automatisch gegenereerd gedeeld token voor database → function; niet handmatig naar de app kopiëren                   |
| `group_push_base_url`           | Supabase Vault                                                 | Alleen de HTTPS-projectorigin, bijvoorbeeld `https://<supabase-ref>.supabase.co`, zonder `/functions/v1` of ander pad |

`google-services.json` is de **clientconfiguratie** en is niet hetzelfde als `FCM_SERVICE_ACCOUNT_JSON`. Dat laatste bestand geeft serverbevoegdheden en mag nooit in een APK, Expo-public-env, Git-commit, screenshot of log terechtkomen. De publieke Supabase-key wordt tijdens de build wel in de app opgenomen; RLS en geauthenticeerde RPC's vormen de toegangscontrole. [Supabase API-keys](https://supabase.com/docs/guides/api/api-keys), [FCM serveromgeving](https://firebase.google.com/docs/cloud-messaging/server-environment).

De bestaande workflow `../.github/workflows/react-native-release.yml` leest de geselecteerde GitHub-omgeving. Hij schrijft `GOOGLE_SERVICES_JSON` tijdelijk naar een bestand en zet dit als EAS file-secret. De workflow deployt **niet** automatisch de database, function of FCM-servercredentials. Stel die serverwaarden apart in Supabase in. Een serversecret uitsluitend in GitHub toevoegen activeert deze worker niet.

## 3. Firebase en de native Android-app

1. Open Firebase → Project Settings → General en controleer de Android-app. Het releasepackage in `app.config.ts` is `com.Ameender.qurantracker`. De client-JSON moet een client bevatten voor het werkelijk gebouwde package. Als een devvariant een ander package gebruikt, registreer ook die Android-app in hetzelfde Firebase-project en download passende clientconfiguratie.
2. Download de passende `google-services.json`. Lokaal wijst `GOOGLE_SERVICES_JSON` naar dat bestand. `app.config.ts` gebruikt als historische fallback `../app/google-services.json` als dat bestaat. Vertrouw voor een andere pc of cloudbuild niet op die lokale fallback.
3. Open Cloud Messaging en schakel de **Firebase Cloud Messaging API (HTTP v1)** in als die nog niet actief is. Gebruik geen legacy serverkey. Voor externe servers beschrijft Firebase serviceaccountauthenticatie met een kortlevende OAuth-token. [Firebase HTTP v1](https://firebase.google.com/docs/cloud-messaging/send/v1-api).
4. Kies een serviceaccount met uitsluitend de benodigde FCM-verzendbevoegdheid in het doelproject. Bij de IAM-route geeft de officiële documentatie de rol **Firebase Cloud Messaging API Admin**. Maak/download de JSON-key alleen voor dit serverpad en bewaar die privé buiten de repository. Controleer `project_id` en accountproject. Alleen een key downloaden zonder juiste IAM-rechten of API-activering is onvoldoende.
5. Zet in het bedoelde Supabase-project `FCM_PROJECT_ID` en `FCM_SERVICE_ACCOUNT_JSON` via **Edge Functions → Secrets**. Plak de volledige JSON als secretwaarde, met de bestaande JSON-escaping van de private key. Verander het niet in Android-client-JSON. De worker controleert dat de twee project-ID's overeenkomen.
6. Gebruik voor de toestelproef een eigen native development- of releasebuild. Expo Go/web zijn geen geschikte acceptatieomgeving voor deze native registratie. Maak een nieuwe native build na wijziging van de Firebase-clientconfiguratie of notificationplugin. Alleen Metro herstarten vervangt het ingebouwde Android-Firebase-project niet. [Expo native notificationtokens](https://docs.expo.dev/versions/latest/sdk/notifications/), [Android FCM-configuratie](https://docs.expo.dev/push-notifications/fcm-credentials/).

De app maakt het Android-kanaal `firebase_messages_v1` aan voordat zij toestemming/token opvraagt. Controleer op Android 13+ de systeemtoestemming én dit kanaal. Het inschakelen van een lokale dagelijkse herinnering registreert niet automatisch een groepspushtoken.

Voor iOS zijn aanvullend `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_TOPIC`, `APNS_PRIVATE_KEY` en `APNS_ENVIRONMENT` als functionsecrets nodig. `APNS_TOPIC` moet overeenkomen met de ondertekende bundle-ID; `APNS_ENVIRONMENT` is `sandbox` of `production`. De server ondersteunt momenteel één APNs-omgeving per deployment, niet automatisch een mengsel van ontwikkel- en productietokens. Volg vóór iOS-testen de volledige [iOS-handleiding](IOS_PUSH_SETUP.md).

## 4. Backend bijwerken zonder oude migraties te herschrijven

Werk vanuit de repositoryroot, één map boven `react-native`, met het bestaande Supabase-project. De historische migraties veronderstellen een bestaande Kotlin-database; deze repository is geen zelfstandig productiebootstrapscript voor een lege database. Gebruik `scripts/local-backend-qa/bootstrap.sql` uitsluitend voor geïsoleerde QA. De volledige historische volgorde staat in [Live chat instellen](LIVE_CHAT_SETUP.md#4-database-en-migratievolgorde).

Controleer eerst backup en migratiegeschiedenis, zonder databasewijziging:

```powershell
Set-Location C:\pad\naar\Quran-Tracker
npx.cmd --yes supabase@3.1.0 login
npx.cmd --yes supabase@3.1.0 link --project-ref <supabase-ref>
npx.cmd --yes supabase@3.1.0 migration list --linked
npx.cmd --yes supabase@3.1.0 db push --linked --dry-run
```

De fundering omvat minstens `20260916010000_notification_delivery_foundation.sql`, `20260916020000_notification_grants_and_legacy_lockdown.sql`, `20261009180000_group_reply_push.sql`, `20261009181000_group_push_dispatcher.sql`, `20261009190000_immediate_group_push_and_mute.sql` en `20261113090000_group_push_ios.sql`, plus hun eerdere groepsafhankelijkheden. De nieuwe groepspostuitbreiding is **`20261120090000_group_post_push.sql`**; bestaande toegepaste bestanden worden niet vervangen.

Deze nieuwe migratie voegt `notify_group_post` / `public.notify_group_post()` toe voor nieuwe gepubliceerde posts. Per ander actief groepslid ontstaat een event met `source_key='post:<post-uuid>'` en categorie `update`. De auteur krijgt geen eigen melding. Antwoorden behouden `comment:<comment-uuid>` en categorie `reaction`. De providerworker gebruikt `claim_group_push_v3()`, dat naast de bestaande claimvelden `kind=group_post` of `group_reply` teruggeeft. `get_group_push_target_v2(p_event uuid)` retourneert de opnieuw geautoriseerde `group_code`, `post_id` en `kind`; oudere RPC's blijven beschikbaar voor oudere clients. Dit is geen uitbreiding die iedere oude notificatiecategorie automatisch een providerpad geeft.

Als de dry-run onverwachte historische wijzigingen toont, stem eerst geschiedenis en huidig schema af. Gebruik geen `db reset`, willekeurige migration repair of `--include-all` om een productiedatabase passend te maken. [Supabase migratiecommando's](https://supabase.com/docs/reference/cli/supabase-db-push).

Na review van de werkelijke dry-run: zet eerst de juiste providersecrets, pas vervolgens de verwachte ontbrekende migraties toe en deploy de bijpassende function. Stem een productie-uitrol van database en function af als één versie: de nieuwe function verwacht de nieuwe claim-RPC. De oudere worker verwerkt nog uitsluitend replies.

```powershell
npx.cmd --yes supabase@3.1.0 db push --linked
```

Open vervolgens in hetzelfde project **Database → Vault**. Maak de secret **`group_push_base_url`** met waarde **`https://<supabase-ref>.supabase.co`**. Als die naam al bestaat, werk de bestaande secret bij; maak geen dubbele secretnaam. Gebruik uitsluitend de origin, zonder afsluitend pad `/functions/v1/group-push`. De dispatcher voegt dit pad zelf toe. Laat de gegenereerde `group_push_dispatcher`-secret behouden. Ontbreekt de base-URL of is hij ongeldig, dan doet de dispatcher geen outboundverzoek en blijft de queue behouden. Er is geen automatische fallback naar de oude vaste projecthost.

Deploy daarna de nieuwe worker, vanuit dezelfde repositoryroot:

```powershell
npx.cmd --yes supabase@3.1.0 functions deploy group-push --project-ref <supabase-ref>
```

Zet de Vaultorigin en providersecrets vóór de worker live gaat. Test bij een andere omgeving eerst dat de origin werkelijk bij de gekozen database hoort. Stel geen willekeurige externe host in: de dispatcher verstuurt haar geheime bearer naar die host. De base-URL is geen clientconfiguratie en hoeft niet in GitHub/EAS te staan.

De function gebruikt `verify_jwt=false` uit `supabase/config.toml`, omdat zij zelf de bearer controleert met `verify_group_push_dispatcher_v1`. Dit endpoint is geen app-API om willekeurige ontvangers of berichtinhoud aan te leveren. De database haalt `group_push_dispatcher` intern uit Vault. Probeer geen anon-key, clientsession of gekopieerde servicekey als dispatcher-token. [Supabase functionsecrets](https://supabase.com/docs/guides/functions/secrets), [Vault](https://supabase.com/docs/guides/database/vault).

## 5. App bouwen en toestel expliciet aanmelden

Op een andere pc: volg eerst [Lokale ontwikkeling](LOCAL_DEVELOPMENT.md) voor Node, Java, Android Studio/SDK, omgevingsvariabelen en simulatoren. Voor Apple-signering, IPA-installatie en winkelpublicatie volg je [de releasehandleiding](RELEASE_HANDLEIDING.md). De servermigratie en providersecrets moeten ook bij een nieuw gebouwde app nog apart worden ingericht.

Voer uit vanuit `react-native/`:

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build:apk
```

Voor ontwikkeling: `npm.cmd run android:dev`; voor EAS Android-preview: `npm.cmd run build:apk:cloud`. Cloudbuilds vereisen de echte Expo-project-UUID en bijbehorende EAS/GitHub-inrichting uit de releasehandleiding. Lokaal bouwen bewijst geen serverdeployment of providerbezorging.

Voor een iPhone-testbuild en daarna de productie-IPA zijn de bestaande opdrachten:

```powershell
npm.cmd run build:ios:preview
npm.cmd run build:ios
```

Dit zijn twee afzonderlijke buildkeuzes; voor de preview moeten de testtoestellen bij Apple geregistreerd zijn. Volg ook de APNs-signering en omgevingskeuze in [iOS-push](IOS_PUSH_SETUP.md). Een JavaScript-export is geen installeerbare IPA en bewijst geen pushbezorging.

De gerichte providercontracttests kunnen zonder cloudverkeer vanuit `react-native/` worden uitgevoerd. De volledige verifyketen bevat deze servercontracttests nu ook:

```powershell
npm.cmd run test:push-server
npm.cmd run verify
```

De SQL-regressies horen **uitsluitend bij een geïsoleerde lokale QA-database**, met de nieuwe migratie en twee lokale testidentiteiten. Gebruik nooit een hosted database-URL voor deze bestanden. Met de PostgreSQL-client geïnstalleerd en de lokale QA-stack op de bestaande poort 55432:

```powershell
psql --host=127.0.0.1 --port=55432 --username=postgres --dbname=postgres --password -v ON_ERROR_STOP=1 -f ../supabase/tests/group_post_push.sql
psql --host=127.0.0.1 --port=55432 --username=postgres --dbname=postgres --password -v ON_ERROR_STOP=1 -f ../supabase/tests/group_reply_push.sql
psql --host=127.0.0.1 --port=55432 --username=postgres --dbname=postgres --password -v ON_ERROR_STOP=1 -f ../supabase/tests/group_reply_push_ios.sql
```

Het wachtwoord is dat van de **lokale QA-stack**, uit de genegeerde lokale credentials; plak geen productiegeheim in de opdracht. Deze tests gebruiken transacties en rollback; de dispatcherproeven zetten uitsluitend binnen die transactie een loopbackorigin om providerverkeer te voorkomen. Ze controleren onder andere ontvangers, categorie/demping, claim/lease, quiet hours, deduplicatie en autorisatie. Voor inrichting van de aparte QA-stack zie [de lokale backendprocedure](LIVE_CHAT_SETUP.md#7-lokale-verificatie-zonder-clouddata). De algemene source-SQL-runner sloeg de historische outboundpushtests bewust over; interpreteer die oude groene run niet als volledige pushacceptatie.

1. Installeer de nieuwe native build en log in met ontvangend account A.
2. Open **Meer → Instellingen → Meldingen**. Sta meldingen in Android/iOS toe. Zet de globale groepsmeldingen aan.
3. Zet voor nieuwe posts **Groepsberichten en updates** aan (`notification_preferences.update`). Het Engelse label is **Group posts and updates**, het Arabische **منشورات المجموعة والتحديثات**. Waar deze gids kortweg Updates noemt, wordt diezelfde categorie bedoeld. Voor discussie-antwoorden blijft **Reacties** (`reaction`) nodig.
4. Kies bij de testgroep **Alles** en zorg dat deze niet tijdelijk gedempt is. **Belangrijk**, **Alleen vermeldingen** en **Gedempt** ontvangen geen gewone nieuwe-postpush. Discussie-antwoorden behouden hun afzonderlijke reactiebeleid.
5. Kies **Push op dit apparaat inschakelen**. Dit vraagt systeemtoestemming, haalt het native FCM/APNs-token op en registreert de installatie bij het ingelogde account. Een succesvolle login alleen doet deze opt-in niet.
6. Controleer stille uren en de toestelzone. Voor de eerste positieve proef zet je stille uren tijdelijk uit binnen het afgesproken testaccount. Herstel de voorkeur erna.
7. Bij token-/accountwijziging opnieuw via de app aanmelden waar nodig. Kopieer nooit een token van een ander toestel of Firebase-project.

## 6. Beheercontrole zonder persoonsgegevens of secrets te tonen

Deze SQL is alleen-lezen en toont geen device-tokens, e-mails, berichtinhoud of geheime waarden:

```sql
select to_regprocedure('public.register_push_device_v2(uuid,text,text,boolean,text,boolean,integer,integer,text)') as register_device,
       to_regprocedure('public.claim_group_push_v3()') as claim_new_posts,
       to_regprocedure('public.dispatch_group_push_v1()') as dispatcher,
       to_regprocedure('public.get_group_push_target_v2(uuid)') as authorized_target;

select jobname, schedule, active
from cron.job where jobname = 'group-push-dispatch-v1';

select exists(select 1 from vault.secrets where name = 'group_push_dispatcher')
  as dispatcher_secret_exists,
       exists(select 1 from vault.secrets where name = 'group_push_base_url')
  as dispatcher_origin_exists;

select platform, active, enabled, count(*) as devices
from public.user_devices group by platform, active, enabled;

select n.type,
       case when n.source_key like 'post:%' then 'post'
            when n.source_key like 'comment:%' then 'reply'
            else 'other' end as source_kind,
       d.status, count(*) as deliveries
from public.notification_deliveries d
join public.group_notifications n on n.id = d.event_id
group by n.type, source_kind, d.status;
```

Controleer functionlogs in Edge Functions → `group-push` en de geaggregeerde queue-uitkomst. Toon geen Vault-secretwaarden of alle kolommen van `user_devices`. `sent` betekent provideracceptatie, geen bewijs van een zichtbare banner. Een bestaand queue-item en een werkende chat-WebSocket bewijzen evenmin dat FCM correct staat.

### Vindplaatsen bij onderhoud

| Bestand / contract                                                                                                            | Verantwoordelijkheid                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [../supabase/migrations/20261120090000_group_post_push.sql](../../supabase/migrations/20261120090000_group_post_push.sql)     | Nieuwe-postevents, forwardmigratie, claim v3, target v2 en configureerbare dispatcherorigin |
| [../supabase/functions/group-push/index.ts](../../supabase/functions/group-push/index.ts)                                     | Dispatcher-authenticatie, claim, actuele ontvangercontrole, FCM/APNs-verzending en finish   |
| [../supabase/functions/group-push/apns-contract.ts](../../supabase/functions/group-push/apns-contract.ts)                     | APNs-payload, provideruitkomst en generieke melding                                         |
| [../supabase/functions/group-push/notification-copy.ts](../../supabase/functions/group-push/notification-copy.ts)             | Generieke gelokaliseerde providertekst                                                      |
| [../supabase/config.toml](../../supabase/config.toml)                                                                         | Functionconfiguratie inclusief eigen dispatcher-auth                                        |
| [src/services/notifications/pushDevice.ts](../src/services/notifications/pushDevice.ts)                                       | Expliciete native opt-in, tokenregistratie, accountwissel en opruimen                       |
| [src/services/notifications/groupPushPolicy.ts](../src/services/notifications/groupPushPolicy.ts)                             | Native payload herkennen, ontvanger/categorie/demping/stille uren controleren               |
| [src/services/notifications/groupPushRuntime.ts](../src/services/notifications/groupPushRuntime.ts)                           | Foreground-/backgroundafhandeling en lokale presentatie                                     |
| [src/features/account/components/PushNotificationHandler.tsx](../src/features/account/components/PushNotificationHandler.tsx) | Geautoriseerde route na tikken op melding                                                   |
| [src/features/account/screens/NotificationsScreen.tsx](../src/features/account/screens/NotificationsScreen.tsx)               | Globale categorieën, device-opt-in en groepsdemping                                         |
| [app.config.ts](../app.config.ts)                                                                                             | Android-package/clientbestand en native notificationplugin                                  |
| [../.github/workflows/react-native-release.yml](../../.github/workflows/react-native-release.yml)                             | Publieke buildconfig en Android-clientbestand naar EAS; geen automatische serverdeployment  |

De ruwe push bevat geen vrije auteur-/berichtinhoud die een client zelf als vertrouwde notificatie kan aanbieden. De server bepaalt ontvangers uit de database; de app controleert de actuele account en haalt het doel opnieuw geautoriseerd op. De generieke tekst voorkomt dat inhoud van een privédiscussie op een lockscreen verschijnt.

## 7. Acceptatiematrix met twee eigen testaccounts

Gebruik een eigen testgroep met account A en B als actieve leden. A is de ontvanger op het doeltoestel; B plaatst de testinhoud. Leg build, backendversie, platform, datum/tijd, zone, scenario en uitkomst vast zonder persoonlijke inhoud/tokens. Tests maken echte testberichten en kunnen echte meldingen verzenden.

| Scenario                 | Handeling                                                        | Verwacht                                                                                  |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Nieuwe post              | B plaatst een nieuwe tekstpost terwijl A op de achtergrond staat | A krijgt één melding; B krijgt zijn eigen bericht niet                                    |
| Chat                     | B verstuurt via Chat een nieuw tekstbericht                      | Zelfde nieuwe-postpad: chat schrijft in `group_posts`                                     |
| Reactie                  | A is auteur/deelnemer van discussie; B reageert                  | Bestaande `group_reply`-melding bij A, geen duplicaat                                     |
| Voorgrond                | Herhaal nieuwe post terwijl A actief in de app is                | Eén geautoriseerde melding, geen dubbele ruwe/lokale banner                               |
| Normaal gesloten         | Sluit A normaal, B plaatst post, tik op ontvangen melding        | Koude start opent juiste geautoriseerde groep/post                                        |
| Updates uit              | A zet Updates uit; B maakt nieuwe post                           | Geen nieuwe-postpush; onafhankelijke reactievoorkeur blijft gelden                        |
| Reacties uit             | A zet Reacties uit; B antwoordt                                  | Geen replypush; Updates blijft onafhankelijk                                              |
| Groep gedempt            | A kiest Gedempt of tijdelijke demping; B plaatst post/reply      | Geen nieuwe bezorging; opnieuw inschakelen speelt oude gedempte meldingen niet opnieuw af |
| Alleen vermeldingen      | A kiest Alleen vermeldingen; B plaatst gewone post               | Geen gewone nieuwe-postmelding                                                            |
| Stille uren              | A test binnen ingestelde stille uren                             | Geen directe banner; server stelt nog geldige bezorging uit; geen onbeperkte backlog      |
| Globaal/app/device uit   | Zet iedere blokkade afzonderlijk uit                             | Betreffende blokkade verhindert bezorging/weergave                                        |
| Ander account/uitgelogd  | A logt uit of wisselt account vóór tap                           | Geen toegang namens oude ontvanger                                                        |
| Lidmaatschap ingetrokken | Verwijder A in eigen testgroep vóór bezorging/tap                | Geen ongeautoriseerde inhoud; actuele rechten opnieuw getoetst                            |
| Bewerken                 | B bewerkt bestaande post                                         | Geen onbedoelde nieuwe-postmelding voor iedere edit                                       |
| NL/EN/AR                 | Herhaal met de drie app-/device-registratietalen                 | Begrijpelijke generieke melding, correcte taproute                                        |

Force-stop op Android of force-quit op iOS is niet hetzelfde als normaal sluiten. Het OS kan achtergrond-JavaScript beperken. Test deze toestanden apart en beloof geen aflevering die het platform niet garandeert. Android gebruikt een data-push die de app na actuele autorisatie lokaal weergeeft; batterijbesparing en netwerk kunnen vertraging veroorzaken. Voor APNs gelden bovendien de signed environment-/topicvoorwaarden uit de iOS-handleiding.

## 8. Problemen gericht oplossen

| Waarneming                                       | Controle / herstel                                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Chat werkt, geen push                            | Chat heeft geen FCM nodig. Controleer afzonderlijk providersecrets, nieuwe migratie/function, device-opt-in en categorie             |
| Nieuwe posts geven geen queue maar replies wel   | Nieuwe forwardmigratie/trigger ontbreekt of de post is niet gepubliceerd; alleen oude replyworker is onvoldoende                     |
| `RPC_claim_group_push_v3_404` of ontbrekende RPC | Nieuwe function vóór database uitgerold of verkeerde projectdeployment; pas reviewed migratie toe en controleer project              |
| `FCM_CONFIGURATION`                              | `FCM_PROJECT_ID` gelijk aan JSON `project_id`; volledige geldige serviceaccount-JSON met private key/client email                    |
| `FCM_AUTH_400` / `FCM_AUTH_401`                  | Serviceaccountkey geldig/niet ingetrokken, juiste JSON en Google tokenauth; geen client-JSON gebruiken                               |
| `FCM_SEND_403`                                   | HTTP v1 API, IAM-verzendrol en tokenproject/clientpackage controleren; geen nieuwe sleutel blind in de app plakken                   |
| `UNREGISTERED`                                   | Token ongeldig; server deactiveert registratie. Registreer actuele installatie opnieuw via app                                       |
| Queue blijft pending/processing                  | Cron actief, dispatcher juiste projectorigin, function bereikbaar, Vault-tokencontract, lease/retries en stille uren controleren     |
| Function `Unauthorized`                          | Database/function niet dezelfde omgeving of verkeerde dispatcher-auth; bestaande Vaultsecret niet naar client kopiëren               |
| Geen native token                                | Werkelijke native build, juiste Firebase-clientconfig/package, Google Play services/toestelverbinding, permissie en kanaal           |
| Provider `sent`, geen banner                     | Toesteltoestemming/kanaal, achtergrondtaak, batterij-/OS-beperkingen, eigen opt-inaccount, demping/stille uren en echte toestelproef |
| Banner opent niets                               | Nieuwe clientbuild geïnstalleerd, gebruiker ingelogd als ontvanger, actieve groepsrechten en zichtbare gepubliceerde post            |
| iOS werkt niet                                   | APNs-key/team/topic/signed environment en native entitlement; Firebase Android-config is daarvoor onvoldoende                        |

De server probeert begrensd opnieuw bij tijdelijke fouten; een verlopen of ingetrokken notificatie wordt niet eeuwig herhaald. Verzend geen volledige payloads, authheaders of tokenlijsten naar publieke logs om fouten te onderzoeken.

## 9. Afrondingsbewijs en latere VPS

Afgerond betekent: migratiegeschiedenis klopt, function draait met juiste serversecrets, dispatcher en cron werken, eigen toestel is geregistreerd en de positieve én negatieve matrix is uitgevoerd. Unit-/SQL-tests bewijzen regels en autorisatie; een groene APK-build bewijst compilatie. Alleen de echte provider-/toestelproef bewijst zichtbare push in de bedoelde omgeving.

Bij een toekomstige VPS blijven FCM/APNs externe providers. Verhuis de worker, secretopslag en scheduler gecontroleerd, behoud queue/claim/recipientcontrole en stel de dispatcherorigin passend in. Alleen de app-URL veranderen verplaatst de serverworker niet. Houd tijdens de verhuizing één actieve bezorgworker per queue en behoud idempotentie om dubbele meldingen te vermijden.
