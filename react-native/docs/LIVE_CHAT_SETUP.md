# Live chat, private typing en groepspush instellen

Bijgewerkt voor nieuwe-postpush op 19 november 2026. De historische hosted controle hieronder blijft een uitsluitend-lezen momentopname; de nieuwe code is daarmee niet als gedeployed of bezorgd aangetoond. Voor het complete nieuwe pushpad: [Groepspush instellen](GROUP_PUSH_SETUP.md).

Gecontroleerd op 18 november 2026. Dit document beschrijft de **werkelijk aanwezige code** en de afzonderlijke stappen voor lokale verificatie en productieconfiguratie. Paden beginnen in `react-native/`; `../supabase/` en `../app/` zijn de gedeelde backend en de oorspronkelijke Kotlin-app. Voor Android/iOS-builds en winkels: [releasehandleiding](RELEASE_HANDLEIDING.md).

**Huidige status:** de appcode en lokale Supabase-integratie voor chat zijn aanwezig. De uitsluitend-lezen hosted controle van 18 november 2026, 00:30:59 UTC, gaf voor **alle vijf feedtabellen** `CHANNEL_ERROR / RealtimeDisabledForConfiguration`; er zijn nul berichten ontvangen. Dat is geen bewijs dat productie live is. Tijdens deze recheck zijn geen hosted migraties, instellingen, secrets, gebruikers of berichten gewijzigd. Private typing en echte FCM/APNs-bezorging zijn evenmin als werkend in productie aangetoond.

## 1. Drie functies met verschillende vereisten

| Functie                                       | Opslag/transport                                                          | Nodig                                                                                     | Werkt zonder Realtime?                                                |
| --------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Groepschat en feed lezen/versturen            | Bestaande `group_posts`, `post_comments`, RPC's en PostgREST              | Publieke appconfiguratie, geldige gebruikerssessie, bestaande groepsdatabase en rechten   | Ja: actieve chat leest elke 5 seconden opnieuw; feed elke 30 seconden |
| Direct nieuwe inhoud zien                     | Supabase `postgres_changes` als signaal om geautoriseerd opnieuw te lezen | Realtime aan, vijf tabellen in `supabase_realtime`, SELECT-grants/RLS, werkende WebSocket | Dezelfde lees-/schrijfacties blijven via polling beschikbaar          |
| “... typt”                                    | Private Broadcast via server-RPC en persoonlijke ontvangsttopic           | Typingmigratie, private channel authorization en actuele groepsrechten                    | Nee; indicator verdwijnt zonder chat te blokkeren                     |
| Push bij nieuwe post of antwoord in discussie | SQL-trigger → bezorgqueue → Edge Function → FCM/APNs                      | Pushmigraties, dispatcher, providercredentials, device-registratie en instellingen        | Ja; push staat los van de chatsocket                                  |

Er bestaat geen aparte `messages`-tabel, publiek chat-Broadcast-kanaal, leesbevestiging, aanwezigheidslijst, online-status of `EXPO_PUBLIC_ENABLE_CHAT`-schakelaar. Chat is een extra chronologische weergave van **tekstposts** uit dezelfde groepenfeed als Kotlin. Systeem-, voortgangs- en mediaposts worden vóór paginering uit de chatquery gefilterd; ze blijven beschikbaar in de feed.

De pushcode ondersteunt **nieuwe gepubliceerde groepsposts** en **reacties op discussies waaraan de ontvanger deelneemt**. Nieuwe posts vereisen migratie `20261120090000_group_post_push.sql`, de bijpassende function en clientbuild, categorie Updates en groepsmodus Alles. Belangrijk, Alleen vermeldingen en Gedempt ontvangen geen gewone nieuwe-postpush. De oorspronkelijke replyfunctionaliteit blijft onafhankelijk via Reacties. Realtime activeren deployt deze uitbreiding niet. Zie [de volledige groepspushinrichting](GROUP_PUSH_SETUP.md) voor Firebase, Vault, deployvolgorde en toesteltests. Hosted bezorging is geen bewezen resultaat van de lokale controles.

## 2. Configuratie: publieke waarden en servergeheimen

### App en builds

Maak lokaal `.env.local` vanuit [.env.example](../.env.example). Zet de waarden van hetzelfde Supabase-project bij elkaar. Expo neemt `EXPO_PUBLIC_*` op in de clientbundle; deze waarden zijn publiek. Gebruik uitsluitend de publishable key (`sb_publishable_...`) of de legacy `anon`-JWT, nooit `service_role` of `sb_secret_...`. Dit onderscheid volgt de [Supabase API-key-documentatie](https://supabase.com/docs/guides/api/api-keys).

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable-of-anon-key>
EXPO_PUBLIC_AUDIO_BASE_URL=<optionele-audio-origin>
EXPO_PROJECT_ID=<expo-project-uuid-voor-builds>
GOOGLE_SERVICES_JSON=<pad-naar-Android-clientconfiguratie>
```

| Exacte naam                     | Waar gebruikt                                 | Voor live chat vereist?                                                                                          |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | `src/config/runtime.ts` → `createBackend`     | Ja; HTTPS-projectorigin in productie                                                                             |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Dezelfde client en geïsoleerde typingsocket   | Ja; de naam blijft zo, ook met een publishable key                                                               |
| `EXPO_PUBLIC_AUDIO_BASE_URL`    | Audio/downloads                               | Nee                                                                                                              |
| `EXPO_PROJECT_ID`               | `app.config.ts`, `extra.eas.projectId`        | Nee voor chat; wel onderdeel van de releaseconfiguratie                                                          |
| `GOOGLE_SERVICES_JSON`          | `app.config.ts`, Android `googleServicesFile` | Nee voor chat; Android Firebase-pushconfiguratie. Lokale fallback: `../app/google-services.json` indien aanwezig |

`getBackend()` retourneert `null` wanneer de URL/key ontbreken; de groepsschermen tonen dan ontbrekende configuratie. Er is geen automatische backendkeuze of chatserver-URL naast Supabase. Herstart Metro na wijzigingen aan de appomgeving; maak voor een uitgebrachte app een nieuwe passende bundle/build. Een gewijzigde lokale `.env.local` verandert een reeds geïnstalleerde productiebuild niet.

De normale client bewaart de authsessie via `services/storage/sessionStorage`, gebruikt PKCE, `persistSession:true`, `autoRefreshToken:true` en `detectSessionInUrl:false`. Groepsacties gebruiken het ingelogde account. Auth redirect-/Google-instellingen horen bij accountconfiguratie; ze zijn geen Realtime-schakelaars.

### Alleen voor de server, uitsluitend voor push

| Exacte naam                 | Bestemming                                  | Betekenis                                                                  |
| --------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Edge Function-omgeving                      | Backendorigin; standaard beschikbaar bij gehoste Supabase Functions        |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function-omgeving                      | Server-RPC's voor claim/finish/dispatchercontrole; nooit in de mobiele app |
| `FCM_PROJECT_ID`            | Function secret                             | Moet gelijk zijn aan `project_id` in de FCM-serviceaccount                 |
| `FCM_SERVICE_ACCOUNT_JSON`  | Function secret                             | JSON met serveraccount, private key en client email voor FCM HTTP v1       |
| `APNS_TEAM_ID`              | Function secret                             | Apple Developer-team                                                       |
| `APNS_KEY_ID`               | Function secret                             | ID van de APNs signing key                                                 |
| `APNS_TOPIC`                | Function secret                             | Bundle-ID, hier `com.Ameender.qurantracker`                                |
| `APNS_PRIVATE_KEY`          | Function secret                             | APNs `.p8`-sleutel; code verwerkt ook letterlijke `\\n`                    |
| `APNS_ENVIRONMENT`          | Function secret                             | `sandbox` of `production`; code-default is `production`                    |
| `group_push_dispatcher`     | **Supabase Vault secretnaam**, geen app-env | Door SQL intern gegenereerd token voor database → Function                 |
| `group_push_base_url`       | **Supabase Vault**, geen app-env            | HTTPS-projectorigin zonder pad voor de actuele dispatcher                  |

De dispatcher haalt het Vault-token zelf op. Kopieer het niet naar clientconfiguratie of logs. Een Supabase CLI-accounttoken (`SUPABASE_ACCESS_TOKEN`) en databasewachtwoord (`SUPABASE_DB_PASSWORD`) zijn eventuele operatorcredentials voor deployment, geen appinstellingen. Zet productieprovidergeheimen niet in de lokale QA-omgeving.

## 3. Exacte koppeling in de code

| Bestand/symbool                                                                     | Verantwoordelijkheid                                                                                                 |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/config/runtime.ts` / `getBackend`                                              | Lazy backendinstantie uit de twee publieke envwaarden                                                                |
| `src/services/backend/backend.ts` / `createBackend`                                 | Auth, RPC-adapters, geautoriseerde feedquery en Realtime-abonnement                                                  |
| `backend.ts` / `feedPort.read`, `hydrateFeed`                                       | `status=published`, groepsfilter, tekstfilter voor chat, sortering, namen/reacties/reacties-op-post/media hydrateren |
| `src/services/groups/groupChat.ts` / `createGroupChatService`                       | `listChatPage`, `sendChatMessage`, maximaal 500 tekens, geen pins bovenaan                                           |
| `groupFeedReader.ts` / `createGroupFeedReader`, `feedCursorFilter`                  | Keysetcursor `(created_at,id)`, standaard 30 en maximaal 60 posts per pagina; aparte pins voor feed                  |
| `groupFeedSubscription.ts` / `createGroupFeedSubscription`                          | Asynchrone groepslookup veilig annuleren bij verlaten scherm                                                         |
| `groupFeedController.ts` / `GroupFeedController`                                    | Start/stop, refresh, oudere pagina's, deduplicatie, reconnectcatch-up, altijd polling                                |
| `features/groups/components/useGroupFeed.ts`                                        | Start alleen op actief gefocust scherm; stop socket/timer bij blur, background en inactive                           |
| `features/groups/hooks/useGroupChat.ts`                                             | Chat gebruikt dezelfde controller met `5_000` ms; behoudt concept en ontvangen bevestiging                           |
| `features/groups/screens/GroupChatScreen.tsx`                                       | Account-/groepsgrens, status, geschiedenis, ongelezen-teller, composer, typing                                       |
| `groupDrafts.ts`, `draftActor.ts`                                                   | Concepten per account + groep + oppervlak; vastgelegde afzender voor een lopende verzending                          |
| `groupTypingSupabase.ts` / `createSupabaseGroupTyping`                              | RPC voor topic/klok/leden, aparte geauthenticeerde private socket, RPC om typen te publiceren                        |
| `groupTyping.ts` / `createGroupTypingService`                                       | Autorisatie opnieuw lezen elke 30s, accountwissel afsluiten, writes ordenen, ontvangen identiteit valideren          |
| `groupTypingController.ts` / `GroupTypingController`                                | Alleen echte gefocuste invoer, 2s inactief, max één start per 3s, maximaal 8s zichtbaar                              |
| `features/groups/hooks/useGroupTyping.ts`                                           | Typinglifecycle volgt focus/AppState; herstelde focus publiceert pas na nieuwe toetsaanslag                          |
| `features/groups/components/GroupTypingStatus.tsx`                                  | Complete NL/EN/AR-zinnen, letterlijke namen, gereserveerde regelhoogte                                               |
| `services/notifications/groupPushRuntime.ts`, `groupPushPolicy.ts`, `pushDevice.ts` | Device-opt-in, ontvanger/rechten/voorkeuren opnieuw toetsen, deduplicatie, generieke melding                         |
| `features/account/components/PushNotificationHandler.tsx`                           | Notificatietap opnieuw autoriseren en naar groepsdiscussie navigeren                                                 |

**Datapad bij verzenden:** composer → accountgebonden draft → `sendChatMessage` → `createTextPost` → RPC `create_group_text_post_v2` → databasecontrole `post.create` → bevestigde post direct in lokale lijst → geautoriseerde refresh. De sessietoken wordt vóór de mutatie vastgelegd; een andere later aangemelde gebruiker wordt niet stilzwijgend de auteur.

**Datapad bij ontvangst:** `subscribeFeed` maakt `group-feed:<groupUuid>:<unieknummer>` en registreert tien listeners: `INSERT` en `UPDATE` op ieder van de vijf tabellen, met `group_id=eq.<uuid>`. `postgres_changes_options: { wait:true }` wacht op backendgereedheid. De callback controleert de groeps-ID en gebruikt de payload uitsluitend als ververssignaal; de daadwerkelijke inhoud wordt met actuele auth/RLS opgehaald.

**Typingpad:** `get_group_typing_channel_v1(p_code)` geeft `group-typing:v1:<groupUuid>:<recipientUuid>` en servertijd; `list_group_members_v3` levert geautoriseerde namen. De isolated client gebruikt `accessToken` dat het oorspronkelijke account controleert, `persistSession:false` en `private:true`. `publish_group_typing_v1(p_group_id,p_typing)` bepaalt zelf `auth.uid()`, ontvangers en `expires_at`. De client stuurt geen naam, concepttekst, vervaltijd of gekozen afzender naar peers.

## 4. Database en migratievolgorde

De onderstaande reeks bevat **26 historische migraties plus de nieuwe groepspostpushmigratie**. Gebruik de migratiegeschiedenis van het doelproject om te bepalen wat ontbreekt. De vroegste migraties verwachten een bestaande historische database met onder andere `profiles` en `reading_*`-tabellen. Ze zijn geen volledige installatie van een lege productieomgeving. `scripts/local-backend-qa/bootstrap.sql` maakt bewust minimale **QA-only** afhankelijkheden en is geen productiebootstrap.

| Volgorde | Bestand in `../supabase/migrations/`                         | Onderdeel                                                                                      |
| -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 1        | `20260904_add_reading_group_owner_delete_policy.sql`         | Historische eigenaarpolicy op `reading_groups`                                                 |
| 2        | `20260904210000_group_detail_v2_foundation.sql`              | Groepen, rollen, leden, posts, comments, media, taken, events, regels, meldingen, audit en RLS |
| 3        | `20260904211000_fix_post_comment_parent_integrity.sql`       | Reactie/parent-integriteit                                                                     |
| 4        | `20260904220000_group_detail_v2_legacy_compat.sql`           | Legacycompatibiliteit                                                                          |
| 5        | `20260904221000_migrate_reading_groups_to_v2.sql`            | Bestaande groepgegevens naar v2                                                                |
| 6        | `20260904230000_group_detail_v2_app_api.sql`                 | App-RPC's, tekstpost, comment, voortgang                                                       |
| 7        | `20260904233000_group_feed_v2_actions.sql`                   | Edit, pin, verwijderen, reacties, melden                                                       |
| 8        | `20260905010000_group_membership_v2_actions.sql`             | Rollen, uitnodigingen, toegangsverzoeken                                                       |
| 9        | `20260905020000_group_media_v2_actions.sql`                  | Private Storage en mediametadata                                                               |
| 10       | `20260905030000_group_tasks_v2_actions.sql`                  | Taken en voortgang                                                                             |
| 11       | `20260905040000_group_events_profiles_points_v3.sql`         | Events, groepsprofiel en taakpunten                                                            |
| 12       | `20260906010000_group_management_api_v2.sql`                 | Groepsdetails en volledige instellingen                                                        |
| 13       | `20260907010000_group_logos.sql`                             | Groepslogo                                                                                     |
| 14       | `20260916010000_notification_delivery_foundation.sql`        | Devices, voorkeuren en bezorgqueue                                                             |
| 15       | `20260916020000_notification_grants_and_legacy_lockdown.sql` | Grants en oude notificatiepaden afsluiten                                                      |
| 16       | `20261007010000_account_management.sql`                      | Gedeelde accountbeheerafhankelijkheden                                                         |
| 17       | `20261009070000_idempotent_group_invitation_acceptance.sql`  | Uitnodiging veilig opnieuw accepteren                                                          |
| 18       | `20261009120000_group_member_permissions.sql`                | Vier ledenschakelaars en create/update v3                                                      |
| 19       | `20261009140000_live_group_profile_names.sql`                | Actuele groepsnamen boven historische snapshots                                                |
| 20       | `20261009160000_allow_redacted_deleted_comments.sql`         | Verwijderde reacties als geredigeerde records                                                  |
| 21       | `20261009180000_group_reply_push.sql`                        | Replyqueue, Android v1, claim/finish/target                                                    |
| 22       | `20261009181000_group_push_dispatcher.sql`                   | `pg_net`, `pg_cron`, Vault en dispatcher                                                       |
| 23       | `20261009190000_immediate_group_push_and_mute.sql`           | Direct dispatch na commit en muteannulering                                                    |
| 24       | `20261113090000_group_push_ios.sql`                          | Platformregistratie v2, platformbewuste claim; Android v1 blijft bestaan                       |
| 25       | `20261114120000_group_feed_realtime.sql`                     | Vijf tabellen toevoegen aan `supabase_realtime`                                                |
| 26       | `20261115090000_group_typing_private.sql`                    | Drie typing-RPC's en drie private topicpolicies                                                |
| 27       | `20261120090000_group_post_push.sql`                         | Nieuwe-postpush, claim v3/target v2 en Vault-configureerbare dispatcherorigin                  |

De korte historische versie `20260904` is bewust vermeld. Hernoem geen reeds toegepaste versies en laat `migration list`/dry-run leidend zijn bij verschillen met de remote administratie. Publicatie- en typingmigraties zijn additief; de publicatiemigratie maakt een ontbrekende publicatie aan en voegt uitsluitend ontbrekende tabellen toe. Ze verwijdert geen bestaande publicatietabellen en wijzigt geen bestaande groeps-RLS. Typing veronderstelt dat Supabase Realtime's schema, `realtime.messages`, `realtime.send` en `realtime.topic` beschikbaar zijn.

### Deploymentprocedure voor de beheerder

Onderstaande `db push` en `functions deploy` zijn **muterende deploymentstappen**, geen uitgevoerde recheck. Werk vanuit de repositoryroot, één map boven `react-native`, waar `supabase/config.toml` staat. Controleer het doelproject en maak vooraf een databasebackup via de normale beheerprocedure.

```powershell
Set-Location C:\pad\naar\Quran-Tracker
npx.cmd --yes supabase@3.1.0 login
npx.cmd --yes supabase@3.1.0 link --project-ref <project-ref>
npx.cmd --yes supabase@3.1.0 migration list --linked
npx.cmd --yes supabase@3.1.0 db push --linked --dry-run
```

Controleer dat de dry-run alleen verwachte ontbrekende migraties bevat en dat historische dependencies bestaan. Bij bestaande schemaobjecten zonder overeenkomende migratiegeschiedenis: stop het deploymentpad en vergelijk de bestaande schema's; voer geen willekeurige history repair, `--include-all`, reset of herhaling van legacydatamigraties uit. Na gecontroleerde afstemming:

```powershell
npx.cmd --yes supabase@3.1.0 db push --linked
```

Voor een project dat al tot en met 24 is bijgewerkt, zijn voor Realtime/typing 25 en 26 nieuw; nieuwe-postpush voegt 27 toe en vereist bovendien Vault, de bijpassende function en nieuwe clientbuild volgens [Groepspush instellen](GROUP_PUSH_SETUP.md). De CLI beschrijft `--dry-run`, linked deployment en migratieadministratie in de [officiële CLI-reference](https://supabase.com/docs/reference/cli/supabase-db-push).

## 5. Supabase Dashboard: exacte onderdelen

### Realtime en de vijf tabellen

1. Open het juiste project; de projectreferentie moet horen bij de app-URL.
2. Open **Project Settings → Realtime** en controleer dat Realtime op projectniveau ingeschakeld is.
3. Open **Database → Publications**. Kies `supabase_realtime` en controleer deze tabellen in schema `public`: `group_posts`, `post_comments`, `post_reactions`, `group_media`, `post_attachments`.
4. Controleer dat de publicatie `INSERT` en `UPDATE` publiceert. Migratie 25 voegt tabellen toe maar repareert geen al afwijkend ingestelde publicatie-eventlijst.
5. Laat RLS en de bestaande grants/policies intact. Een tabel toevoegen aan een publicatie vervangt geen autorisatie.
6. Sluit en heropen de groepschat, of breng de app opnieuw naar de voorgrond. Instellingenwijzigingen kunnen bestaande sockets verbreken.

De officiële pagina's wijzen op **Publications**, niet op een verzonnen aparte “chat enabled”-optie: [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Realtime Settings](https://supabase.com/docs/guides/realtime/settings).

**Let op de huidige kanaalconfiguratie:** feed/chat gebruiken Postgres Changes op een kanaal zonder `private:true`. Daarom moet de globale optie **Allow public access to channels** voor deze implementatie ingeschakeld blijven. Anders kan `PrivateOnly` ontstaan. Dit betekent niet dat private groepsrijen openbaar worden: Postgres Changes gebruikt de tabelgrants en SELECT-RLS. De app verstuurt geen chatinhoud als publieke Broadcast. Typing gebruikt altijd een **afzonderlijk private channel**, ook wanneer de globale publieke optie aanstaat. Alles globaal private maken vereist eerst een expliciete feedkanaalaanpassing met passende authorization; alleen de dashboardschakelaar omzetten past niet bij deze code.

### Bestaande groeps-RLS en rechten

| Actie/tabel               | Bestaand contract                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `groups` lezen            | `can_view_group`: niet verwijderd; eigenaar, actief lid, of ingelogde lezer bij een publieke groep    |
| `group_posts` SELECT      | `can_view_group(group_id)` en gepubliceerd óf `post.moderate`; de appquery vraagt alleen gepubliceerd |
| `post_comments` SELECT    | Zichtbare groep en gepubliceerd óf `comment.moderate`                                                 |
| `post_reactions` SELECT   | `can_view_group(group_id)`                                                                            |
| `group_media` SELECT      | Zichtbare groep en `status='visible'`                                                                 |
| `post_attachments` SELECT | Zichtbare groep en `status='ready'`                                                                   |
| Tekstpost schrijven       | `post.create`, actuele actor, actieve groep, bestaande RPC-validatie                                  |
| Reactie schrijven         | `comment.create`; server koppelt post/groep/parent                                                    |
| Voortgang privé bewaren   | `progress.create`                                                                                     |
| Voortgang expliciet delen | Zowel `progress.create` als `post.create`, één atomische RPC                                          |
| UI-groepschat openen      | Geldige sessie en een rol anders dan `guest`                                                          |

De bestaande server laat geauthenticeerde niet-leden publieke groepsinhoud lezen via `can_view_group`; een publicatiemigratie verandert die bestaande privacykeuze niet. Typing is strenger en vereist altijd actief lidmaatschap. Verwijder geen RLS en voeg geen `USING (true)`-policy toe om een fout te maskeren.

### De vier echte ledenschakelaars

Deze instellingen worden als rechten van de rol **member** opgeslagen, niet als losse lokale voorkeur:

| Formulierwaarde    | SQL-recht           | Standaard nieuwe groep |
| ------------------ | ------------------- | ---------------------- |
| `canPostMessages`  | `post.create`       | Aan                    |
| `canShareProgress` | `progress.create`   | Aan                    |
| `canComment`       | `comment.create`    | Aan                    |
| `canInviteMembers` | `invitation.create` | Uit                    |

`get_group_member_permissions_v1` leest ze; `create_group_v3_full` en `update_group_v3_full` schrijven ze. Alleen een actor met `group.update` kan ze aanpassen. De RN-servicefallback is tijdens deze recheck gelijkgetrokken met de al juiste wizard en Kotlin-default: uitnodigen staat standaard uit. Bestaande groepen zijn niet gewijzigd. Typing verzenden volgt `post.create`; ontvangen volgt `member.read`.

### Private typing: policies op `realtime.messages`

Migratie 26 maakt:

- `can_receive_group_typing_v1(text)`: parseert exact topicformaat; ontvanger is `auth.uid()`; actief lid en `member.read` vereist.
- `get_group_typing_channel_v1(text)`: controleert actieve, niet-verwijderde groep en geeft alleen de eigen topic terug.
- `publish_group_typing_v1(uuid,boolean)`: vereist actief lid en `post.create`; verzendt alleen naar **nu** actieve andere leden met `member.read`, via `realtime.send(...,true)`.
- `group_typing_receive_v1`: permissive SELECT voor de eigen geautoriseerde broadcasttopic.
- `group_typing_read_guard_v1`: restrictive SELECT, zodat een bredere toekomstige policy geen andermans typingtopic openzet.
- `group_typing_write_guard_v1`: restrictive INSERT; clients mogen nooit zelf op `group-typing:%` schrijven.

Er is bewust **geen client INSERT-toestemming nodig**: publiceren gaat via de gecontroleerde serverfunctie, niet `channel.send()`. Voeg geen algemene schrijfpolicy of publieke fallback toe. Verander geen eigendom/RLS van de door Realtime beheerde tabel. Supabase beschrijft private channels en policycontrole in [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization).

Realtime kan kanaalautorisatie cachen. Daarom kiest deze implementatie persoonlijke ontvangerstopics en controleert iedere serverpublicatie de huidige ontvangers opnieuw; een verwijderd lid met een oude socket ontvangt geen nieuw typingverkeer. De client ververst daarnaast iedere 30 seconden zijn scope/leden en sluit bij accountwissel of mislukte scopecontrole. Een eerder al ontvangen indicator kan maximaal zijn korte TTL uitdoven.

## 6. Uitsluitend-lezen databasecontroles

Voer deze controles als beheerder uit in de SQL Editor van het bedoelde project. Ze wijzigen geen schema of data en selecteren geen berichtinhoud, tokens, e-mails of secrets. Een SQL Editor-sessie heeft normaal geen ingelogde appgebruiker: `auth.uid() IS NULL` daar bewijst geen defecte appauthenticatie. Controleer clientrechten apart met een echte testsessie.

### Migratie- en schemastructuur

```sql
select to_regclass('supabase_migrations.schema_migrations') as migration_history;
-- Alleen wanneer bovenstaande tabel bestaat:
select version from supabase_migrations.schema_migrations order by version;

select name, to_regclass('public.' || name) is not null as present
from (values
  ('groups'), ('group_members'), ('group_roles'), ('group_role_permissions'),
  ('group_posts'), ('post_comments'), ('post_reactions'), ('group_media'), ('post_attachments')
) as expected(name);

select pubname, pubinsert, pubupdate, pubdelete, pubtruncate
from pg_publication where pubname = 'supabase_realtime';

select expected.name,
       exists (select 1 from pg_publication_tables p
               where p.pubname = 'supabase_realtime' and p.schemaname = 'public'
                 and p.tablename = expected.name) as published
from (values ('group_posts'), ('post_comments'), ('post_reactions'),
             ('group_media'), ('post_attachments')) as expected(name);

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('group_posts','post_comments','post_reactions','group_media','post_attachments')
  and column_name in ('id','group_id','status','created_at')
order by table_name, column_name;
```

Verwacht vijf keer `published=true`, `pubinsert=true`, `pubupdate=true`, en een `group_id` UUID-kolom per tabel. Zet niet blind `REPLICA IDENTITY FULL` aan: deze client gebruikt geen DELETE-payload en heeft die instelling niet nodig.

### RLS, grants en RPC's

```sql
select n.nspname, c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('group_posts','post_comments','post_reactions','group_media','post_attachments');

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in
       ('group_posts','post_comments','post_reactions','group_media','post_attachments'))
   or (schemaname = 'realtime' and tablename = 'messages')
order by schemaname, tablename, policyname;

select name, has_table_privilege('authenticated', 'public.' || name, 'SELECT') as can_select
from (values ('group_posts'), ('post_comments'), ('post_reactions'),
             ('group_media'), ('post_attachments')) as expected(name);

select signature, to_regprocedure(signature) is not null as present
from (values
 ('public.get_group_detail_v3(text)'),
 ('public.list_group_members_v3(uuid)'),
 ('public.create_group_text_post_v2(uuid,text,text)'),
 ('public.can_receive_group_typing_v1(text)'),
 ('public.get_group_typing_channel_v1(text)'),
 ('public.publish_group_typing_v1(uuid,boolean)'),
 ('realtime.send(jsonb,text,text,boolean)'),
 ('realtime.topic()')
) as expected(signature);

-- Uitvoeren nadat de functies bestaan:
select
 has_function_privilege('authenticated','public.get_group_typing_channel_v1(text)','EXECUTE') as member_resolve,
 has_function_privilege('authenticated','public.publish_group_typing_v1(uuid,boolean)','EXECUTE') as member_publish,
 has_function_privilege('anon','public.get_group_typing_channel_v1(text)','EXECUTE') as anon_resolve,
 has_function_privilege('anon','public.publish_group_typing_v1(uuid,boolean)','EXECUTE') as anon_publish;
```

Verwacht member-execute `true`, anon-execute `false`. Execute-toestemming alleen betekent niet dat iedere ingelogde gebruiker toegang heeft: de functies controleren zelf groepslidmaatschap/rechten. Onderzoek ook eventuele bestaande brede `realtime.messages`-policies; de twee restrictive guards moeten aanwezig blijven.

### Groepslidmaatschap en rechten, zonder inhoud

Vervang uitsluitend de voorbeeldcode door de gekozen testgroepcode:

```sql
select g.id as group_id, g.code, g.privacy, g.status, g.deleted_at is null as not_deleted,
       gm.user_id, gm.status as member_status, gr.key as role,
       gm.user_id = g.owner_id as is_owner,
       coalesce(bool_or(rp.allowed) filter (where rp.permission_key='member.read'), false) as role_member_read,
       coalesce(bool_or(rp.allowed) filter (where rp.permission_key='post.create'), false) as role_post_create,
       coalesce(bool_or(rp.allowed) filter (where rp.permission_key='comment.create'), false) as role_comment_create
from public.groups g
join public.group_members gm on gm.group_id = g.id
join public.group_roles gr on gr.id = gm.role_id and gr.group_id = g.id
left join public.group_role_permissions rp on rp.role_id = gr.id
where g.code = 'AAA-1234'
group by g.id, g.code, g.privacy, g.status, g.deleted_at, gm.user_id, gm.status, gr.key
order by gm.user_id;
```

De eigenaar heeft in `has_group_permission` een expliciete uitzondering; beoordeel `is_owner` dus mee. Een oude sessie op een ander account, `left`/`blocked`/`suspended` lidmaatschap, verwijderde groep of ontbrekend recht wordt niet gerepareerd door Realtime aan te zetten.

## 7. Lokale verificatie, zonder clouddata

Gebruik Node, npm en Docker Desktop met Linux-containers. De scripts pinnen Supabase CLI `3.1.0`. Vanuit `react-native/`:

```powershell
npm ci
npx.cmd tsx --test tests/realtime-readiness.test.ts tests/group-chat.test.ts tests/group-typing.test.ts tests/community-feed.test.ts tests/group-push-policy.test.ts tests/group-operations.test.ts
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-backend-qa/start.ps1 -Realtime
```

De lokale projectmap staat in `.tooling/supabase-qa/`, API op `http://127.0.0.1:55431`, PostgreSQL op `55432`. De initializer maakt een van dit checkoutpad afgeleide project-ID, of behoudt de bestaande ID. De runtimes controleren die nu tegen de lokale `supabase/config.toml`, met dezelfde vaste loopbackgrens. Ze accepteren geen hosted endpoint.

`prepare.mjs` kopieert de originele migraties, registreert hashes, vervangt de twee dispatcher-HTTPdoelen in de **QA-kopie** door een lokale discardorigin en schakelt de cronroute uit. Originele SQL blijft intact. Credentials en gefabriceerde fixtureaccounts blijven in genegeerde `.tooling`-bestanden. De QA-bootstrap importeert geen productiegebruikers of -data.

Voor een **nieuwe** QA-omgeving maakt `groups.mts` gefabriceerde accounts/groepen. Hergebruik bij een bestaande fixtureomgeving de aanwezige `fixtures.credentials.json`; onnodig opnieuw seeden is niet nodig. Voer de muterende lokale runtimes na elkaar uit:

```powershell
npx.cmd tsx scripts/local-backend-qa/groups.mts
node scripts/local-backend-qa/source-sql.mjs
npx.cmd tsx scripts/local-backend-qa/community-runtime.mts
npx.cmd tsx scripts/local-backend-qa/chat-runtime.mts
node scripts/local-backend-qa/typing-sql.mjs --test
npx.cmd tsx scripts/local-backend-qa/typing-runtime.mts
```

`source-sql.mjs` slaat de twee provider-push-SQLtests bewust over omdat outbound dispatch lokaal is uitgeschakeld; een groene run bewijst dus geen FCM/APNs-delivery. De community/chat/typingtests gebruiken echte lokale Supabase-queries, auth, RLS, sockets en de appadapters. Alleen native platformgrenzen worden vervangen.

Als de bestaande lokale stack eerst zonder Realtime liep, stop hem met `stop.ps1` en start opnieuw met `-Realtime`; volumes blijven bewaard:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-backend-qa/stop.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-backend-qa/start.ps1 -Realtime
```

Gebruik geen `db reset`, `stop --no-backup`, container-volume-delete of productiebootstrap om een lokale mismatch op te lossen. Een hashconflict betekent dat de bestaande fixture-installatie en huidige bronmigraties eerst vergeleken moeten worden. Het stopcommando is optioneel na de tests; het verwijdert geen data.

## 8. Hosted gereedheid en acceptatie

### Veilige controle zonder account

```powershell
node scripts/check-realtime-readiness.mjs
node scripts/check-realtime-readiness.mjs --table group_posts
```

De nieuwe versie leest `.env`, daarna `.env.local`, daarna procesvariabelen. Ze accepteert uitsluitend publieke keys, weigert serverkeys, gebruikt een niet-bestaande nul-UUID-groep en verstuurt geen RPC, contentquery of mutation. Elk van de vijf tabellen wordt afzonderlijk gecontroleerd. URL/key/tokens worden uit foutmeldingen geredigeerd. `--help` toont de opties; `--local` accepteert uitsluitend de vaste QA-origin en verwacht daarvoor de bijbehorende publieke lokale config.

Procesexitcode `0` = alle gevraagde subscriptions `SUBSCRIBED`; `2` = geen volledige gereedheid; `1` = ongeldige configuratie/uitvoerfout. **`SUBSCRIBED` bewijst alleen deze configuratiecontrole**, niet dat een bepaalde gebruiker juiste rechten heeft of dat berichten end-to-end aankomen. `memberDeliveryVerified` blijft daarom altijd `false`. De anonieme probe kan private typing niet bewijzen.

### Twee echte testaccounts, gecontroleerde testgroep

Doe dit op staging of een expliciet gekozen testgroep met bevoegde accounts; dit deel schrijft testberichten. Leg de verwachte groepsrechten vast. Gebruik twee onafhankelijke sessies/apparaten, en een derde niet-lid voor negatieve tests.

1. Beide leden openen dezelfde chat. Status wordt `live`; onafhankelijk laat Logs → Realtime geen authorization-/publicationfout zien.
2. A typt en B ziet uitsluitend A's naam + typingtekst. Geen conceptinhoud. Stoppen/blur/send maakt de indicator weg; zonder stop vervalt hij binnen de TTL.
3. A verzendt één herkenbaar testbericht. B ontvangt het vóór de 5s-poll. Herhaal B → A. Controleer dat dezelfde tekstpost in de feed staat.
4. Nieuwe berichten, edits en pins wijzigen de oude geschiedenispositie niet. Oudere pagina's laden geen duplicaten en pins verplaatsen de chat niet.
5. Zet een client offline. Het concept blijft exact; een mislukte verzending heeft een handmatige retry. Na terugkeer wordt actuele serverinhoud herlezen.
6. Breng de app naar background/ander scherm en terug. Er blijft één actieve socket/poller per zichtbare levenscyclus; het scherm haalt gemiste veranderingen opnieuw op.
7. Ontneem `post.create`: lezen blijft volgens rechten mogelijk, schrijven/typing publiceren wordt server-side geweigerd. Ontneem lidmaatschap: private groep en typing blijven niet toegankelijk. Test ook een eerder geopende oude recipienttopic.
8. Wissel account terwijl een request loopt; concepten/afzender/typing mogen niet naar het andere account overgaan. Een niet-lid kan niet op een andermans typingtopic luisteren of typingidentiteit vervalsen.
9. Verwijder/hide een testpost, verwijder een reactie of media. Controleer herstel via refresh/poll; dit is niet in alle gevallen een direct Realtime-event.
10. Test NL/EN/AR, lange namen, grotere systeemtekst, toetsenbord en back/return op echte Android- en iOS-builds.

## 9. Herstel, status, verwijderingen en exacte grenzen

| Situatie                | Werkelijk gedrag                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connecting`            | Groepslookup/socket gereedheid nog bezig                                                                                                                  |
| `live`                  | Subscribe-bevestiging; polling blijft actief                                                                                                              |
| `polling`               | Socketfout/timeout/gesloten of lookup voor transport mislukt; geautoriseerde reads gaan door                                                              |
| `offline`               | Leesactie faalde; eerder geladen data/concept blijft, retry beschikbaar                                                                                   |
| Chatpolling             | Elke 5s zolang gefocust én foreground, ook met live socket                                                                                                |
| Feedpolling             | Elke 30s onder dezelfde lifecyclevoorwaarden, ook met live socket                                                                                         |
| Reconnect               | Extra geautoriseerde catch-upread; meerdere invalideringen worden samengevoegd                                                                            |
| Duplicaten              | Post-ID deduplicatie; keysetcursor met datum én UUID; serverbevestiging mag niet door oudere lopende fetch verdwijnen                                     |
| Background/blur         | Timer en abonnement stoppen; late callbacks uit oude generatie tellen niet mee                                                                            |
| Hard DELETE             | Geen DELETE-listener: groepsfiltering/RLS ondersteunt dit niet als betrouwbare inhoudsroute                                                               |
| Soft delete/hide        | UPDATE kan door nieuwe SELECT-RLS onzichtbaar zijn; opnieuw lezen/poll verwijdert de verdwenen rij                                                        |
| Reactie intrekken       | Kan hard DELETE zijn; UI van andere leden reconcilieert uiterlijk na de volgende succesvolle poll                                                         |
| Concepten               | Alleen sessiegeheugen, per account/groep/feed-of-chat; niet naar schijf geschreven. Een volledige appkill garandeert geen conceptbehoud                   |
| Verzending              | Dubbele taps tijdens één request geblokkeerd; alleen exact bevestigde conceptversie gewist; latere edits blijven                                          |
| Onzeker netwerkantwoord | Er is geen client-idempotency-key voor tekstposts. Een servercommit waarvan het antwoord verloren gaat kan bij handmatige retry een tweede post opleveren |
| Typing start/stop       | Alleen gefocuste nieuwe invoer; stopt bij 2s inactiviteit, leeg veld, send, blur, achtergrond of verloren verzendrecht                                    |
| Typingbeperking         | Startsignalen maximaal elke 3s per client, één lopende + één gewenste pending RPC; dit is geen server-rate-limit                                          |
| Typingexpiry            | Server zet `expires_at=clock_timestamp()+8s`; client corrigeert klokverschil, tolereert beperkte meetonzekerheid en kapt zichtbaarheid op 8s              |
| Typingvolgorde          | Serverexpiry fungeert als ordering key voor start én stop; oude starts kunnen nieuwere stops niet terugdraaien                                            |
| Typingfout              | Fail closed; indicator weg, geen publiek alternatief. Na gesloten resolver heropent hij bij nieuwe scherm-/foregroundlifecycle                            |

Realtime is geen gegarandeerd afleverkanaal. De autoritatieve bron blijft de database; refetch/reconnect/polling zijn daarom onderdeel van het ontwerp. Supabase bespreekt de levering en de configuratiecontrole in [Postgres Changes troubleshooting](https://supabase.com/kb/troubleshooting/realtime-postgres-changes-troubleshooting). De vijf seconden zijn een pollinterval, geen latencygarantie bij netwerkfouten of een langzaam backendantwoord.

Typing maakt geen eigen historietabel of onlineprofiel aan. Database Broadcast gebruikt wel Supabase's interne `realtime.messages`-transportopslag; volgens de actuele documentatie worden partitions daar na drie dagen verwijderd. De app replayt die berichten niet. Public/private flags van `realtime.send` en de client moeten overeenkomen. Een clientverbinding maakt de benodigde dagpartition aan; bij `WarnSendingBroadcastMessage`/ontbrekende partition moeten Realtime en zijn logs onderzocht worden. Zie [Broadcast](https://supabase.com/docs/guides/realtime/broadcast).

## 10. Groepspush apart activeren en controleren

### Server en provider

1. Controleer migraties 14–15, 21–24 en 27; `user_devices`, `notification_preferences`, `group_notification_preferences`, `group_notifications` en `notification_deliveries` moeten bestaan. De nieuwe categorie heet in de app **Groepsberichten en updates** (`update`).
2. Controleer `pg_net`, `pg_cron` en Vault. Migratie 22 maakt het dispatcher-Vault-token indien nodig; cron `group-push-dispatch-v1` hoort iedere minuut de dispatcher te roepen. Migratie 23 probeert daarnaast direct na een commentcommit te dispatchen.
3. Stel na migratie 27 **Vault `group_push_base_url`** in op de HTTPS-projectorigin zonder pad. De actuele dispatcher voegt `/functions/v1/group-push` toe. Ontbrekende/ongeldige origin blokkeert outboundverzoeken met behoud van de queue. De oude vaste host is geen fallback; herschrijf historische migraties niet. Volg [de volledige deploymentprocedure](GROUP_PUSH_SETUP.md).
4. Zet uitsluitend benodigde providersecrets in Supabase **Edge Functions → Secrets**, of via een beschermd secretsbestand met `supabase secrets set --env-file <bestand> --project-ref <ref>`. Deel het bestand/de waarden niet in terminaluitvoer of Git. De [secretsdocumentatie](https://supabase.com/docs/guides/functions/secrets) beschrijft de serveromgeving.
5. Deploy de aanwezige functie vanuit de repositoryroot:

```powershell
npx.cmd --yes supabase@3.1.0 functions deploy group-push --project-ref <project-ref>
```

`../supabase/config.toml` bevat `[functions.group-push] verify_jwt=false`. Dit is bewust: de functie verifieert haar bearer-token via `verify_group_push_dispatcher_v1` tegen Vault. Ze accepteert geen clientgekozen ontvanger, device-token of berichtbody. Zet JWT-verificatie niet willekeurig aan/uit zonder het dispatchercontract te beoordelen.

6. Android: Firebase-clientconfiguratie, pakket `com.Ameender.qurantracker`, FCM HTTP v1-serviceaccountproject en de uitgebrachte build moeten overeenkomen. De app gebruikt een **native FCM-token**, geen Expo Push Token/proxy.
7. iOS: juiste APNs entitlement/provisioning, native APNs-token, bundle-topic en sandbox/productioncombinatie. De function code gebruikt directe APNs alert requests. OS-backgroundalerts kunnen worden weergegeven voordat JavaScript lokale controles uitvoert; serverchecks en echte toesteltests blijven noodzakelijk.

### Gebruiker en bezorgregels

De RN-gebruiker meldt zich aan en kiest expliciet de knop om push op dit toestel te activeren. `enablePushDevice` vraagt OS-toestemming, maakt Android-channel `firebase_messages_v1`, haalt het native token op, roept `register_push_device_v2` aan en registreert taak `wirdna:group-reply:v1`. Alleen de pushinstelling bekijken registreert geen toestel. Bestaande opt-in wordt via `syncRegisteredPushDevice` bijgewerkt; uitloggen trekt de lokale accountpoort meteen in en probeert ook serverregistratie/token/task op te ruimen.

Voor replypush moeten tegelijk kloppen: actueel account = ontvanger, geactiveerd toestel, OS-toestemming, globale `enabled` en `reaction`, per-groep `pushEnabled`, niveau niet `muted`/`mentions`, geen actieve `mutedUntil`, actieve groepsdeelname en zichtbare discussie. Stille uren gebruiken lokale toestelzone; gelijke begin/eindtijd betekent geen stil interval. De server bewaart zone/minuten en stelt levering tijdens stille uren uit. Een titel/body is generiek; providerpayloads bevatten geen discussie-inhoud.

Alleen de auteur van de post en eerdere auteurs van gepubliceerde comments krijgen een nieuw commentevent; de commentauteur zelf wordt uitgesloten. `source_key='comment:<id>'` dedupliceert per ontvanger. Claim werkt in batches van vijf, lease twee minuten, maximaal vijf pogingen en 24 uur ouderdom. De immediate dispatcher begrenst fan-out; cron vangt resterend werk/retries op. Muting cancelt pending/processing en later inschakelen wekt oude gecancelde meldingen niet opnieuw tot leven.

Nieuwe-postevents gebruiken `source_key='post:<id>'`, globale `update` en uitsluitend groepsniveau `all`; iedere andere actuele actieve deelnemer kan ontvanger zijn. Er is geen auteursmelding en een postedit maakt geen nieuw INSERT-event. De nieuwe worker claimt via `claim_group_push_v3`; de payload onderscheidt `group_post` en `group_reply`. De client dedupliceert op event-ID, toetst identiteit na async calls opnieuw en haalt de tapbestemming via `get_group_push_target_v2` op. Vertrouw geen groeps-/postvelden uit een willekeurige pushpayload. De tap opent de betreffende **feeddiscussie**. Bestaande v1/v2-RPC's blijven voor oudere clients beschikbaar, maar een oude clientbuild ondersteunt de nieuwe `group_post`-payload niet.

### Read-only pushdiagnose

```sql
select extname from pg_extension where extname in ('pg_net','pg_cron','supabase_vault');
select jobname, schedule, active from cron.job where jobname='group-push-dispatch-v1';
select exists(select 1 from vault.secrets where name='group_push_dispatcher') as dispatcher_secret_exists;
select status, count(*) from public.notification_deliveries group by status;
select platform, active, enabled, count(*) from public.user_devices group by platform,active,enabled;
select signature, to_regprocedure(signature) is not null as present
from (values
 ('public.claim_group_push_v3()'),
 ('public.verify_group_push_dispatcher_v1(text)'),
 ('public.group_push_claim_allowed_v1(uuid,uuid)'),
 ('public.finish_group_push_v1(uuid,uuid,text)'),
 ('public.get_group_push_target_v2(uuid)')
) as expected(signature);
```

Voer extensie-afhankelijke queries alleen uit wanneer hun schema bestaat. Selecteer geen `push_token`, `decrypted_secret`, requestheaders of volledige provideraccount-JSON. Counts bewijzen wachtrijstatus; daadwerkelijke lockscreenweergave en tapping moeten op een testtoestel worden gecontroleerd.

## 11. Fouten herkennen en gericht oplossen

| Waarneming/code                                   | Controle / oplossing                                                                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RealtimeDisabledForConfiguration`                | Controleer project-Realtime, precieze vijf tabellen, schema, INSERT/UPDATE-publicatie en `group_id`-filters. Huidige hosted bevinding; niet bewezen welk dashboardonderdeel ontbreekt |
| `RealtimeDisabledForTenant`                       | Project-/tenant-Realtime uit; controleer Settings en providerstatus                                                                                                                   |
| `PrivateOnly`                                     | Globale public access uit terwijl huidige feed zonder private config joined; zie sectie 5                                                                                             |
| `CHANNEL_ERROR`                                   | Algemeen subscribe-resultaat; lees de onderliggende reden in Realtime logs/probe                                                                                                      |
| `TIMED_OUT` / `PROBE_TIMEOUT`                     | WebSocketbereikbaarheid, proxy/firewall/VPN, projectpauze, belasting en limieten; REST kan ondertussen nog werken                                                                     |
| `SUBSCRIBED` maar geen wijziging                  | Test echte ingelogde sessie/rechten, juiste groep, gepubliceerde rij, juiste tabel/event. Een nul-UUID-probe verwacht geen inhoud                                                     |
| Post verdwijnt pas na enkele seconden             | Hard delete of nieuwe RLS-zichtbaarheid wordt via polling hersteld; geen DELETE-listener toevoegen zonder autorisatiemodel te herzien                                                 |
| `PGRST202` / ontbrekende typing-RPC               | Migratie 26/schema cache controleren. Gewone chat blijft bruikbaar. Na reparatie scherm heropenen                                                                                     |
| `AUTH_REQUIRED`, verlopen JWT                     | Sessiestatus/account/refresh controleren, opnieuw aanmelden indien nodig; geen service key in app gebruiken                                                                           |
| `GROUP_ACCESS_DENIED` / `GROUP_ACCESS_FORBIDDEN`  | Groep, lidstatus, `member.read`, `post.create` en eigenaarsexceptie controleren                                                                                                       |
| `GROUP_POST_FORBIDDEN`                            | Ledenschakelaar/rolrecht voor posten uit; dat is een geldige weigering                                                                                                                |
| `INVALID_CONTENT`                                 | Lege of >500 tekens lange chattekst; app truncatie is niet de oplossing                                                                                                               |
| Typing bij één richting ontbreekt                 | Eigen topic + recipient UUID, private flag, actuele ledenlijst, `member.read`, RPC `post.create`; geen self-typing verwacht                                                           |
| Typing blijft kort na verbreking                  | Stop kan wegvallen; TTL verwijdert de indicator. Het is geen online-status                                                                                                            |
| `WarnSendingBroadcastMessage`, `MissingPartition` | Private clientconnectie en Realtime-managed messagespartitions/logs controleren                                                                                                       |
| `Unauthorized` bij `group-push`                   | POST, Vault-backed dispatchertoken en function-config controleren; geen anonieme app-aanroep gebruiken                                                                                |
| `FCM_CONFIGURATION` / `APNS_CONFIGURATION`        | Exacte serversecretnamen, project/topic/omgeving en sleutelinhoud controleren                                                                                                         |
| `FCM_AUTH_*`, provider 401/403                    | Providercredential/signature/configuratie; geen tokens in logs opnemen                                                                                                                |
| `invalid_token` / APNs `Unregistered`             | Toesteltoken ongeldig; nieuwe native registratie, geen blinde queue-replay                                                                                                            |
| Push voor nieuw chatbericht ontbreekt             | Controleer nieuwe migratie/function/clientbuild, Vaultorigin, Updates, groepsmodus Alles en device-opt-in; zie GROUP_PUSH_SETUP.md                                                    |
| Lokale QA-project-ID mismatch                     | Metadata/config horen niet bij elkaar; de gedeelde scopecheck weigert terecht. Geen hardcoded oud project-ID terugzetten                                                              |

Supabase onderhoudt de betekenissen van Realtimefoutcodes in [Operational Error Codes](https://supabase.com/docs/guides/realtime/error_codes). Gebruik de code plus de concrete projectcontrole; de algemene `CHANNEL_ERROR` zegt niet op zichzelf dat RLS moet worden versoepeld.

## 12. Launchchecklist

- [ ] App-URL en publieke key horen bij exact hetzelfde bedoelde project; geen serverkey in bundle.
- [ ] Migratiegeschiedenis/legacydependencies afgestemd; alleen ontbrekende goedgekeurde migraties toegepast.
- [ ] Alle vijf tabellen gepubliceerd met INSERT/UPDATE; bestaande RLS en grants gecontroleerd.
- [ ] Project-Realtime aan; kanaalinstelling passend bij huidige feed én private typing.
- [ ] Typing-RPC's en alle drie policies aanwezig, anon execute geweigerd.
- [ ] Hosted probe gereed, daarna echte bidirectionele ontvangst vóór de poll bevestigd.
- [ ] Niet-lid, verwijderd lid, verloren verzendrecht en accountwissel negatief getest.
- [ ] Offline/concept/retry/paginering/deletions/background/foreground getest.
- [ ] Typing stopt en expireert; geen tekstinhoud/aanwezigheidsprofiel opgeslagen door de app.
- [ ] Indien push gewenst: function + providersecrets + correct dispatcherendpoint + cron/Vault + device-opt-in bevestigd.
- [ ] Replypush werkelijk ontvangen/getapt op Android én iOS, inclusief stille uren/mute/accountwissel.
- [ ] Nieuwe-postpush afzonderlijk met twee accounts/toestel getest na deployment; leesbevestigingen zijn geen huidige functie.
- [ ] Logs/screenshots/testrapport bevatten geen geheimen of echte privéberichten.

De [scoped recheck](recheck-2026-11-18/community-realtime-push.md) geeft de Kotlin→RN-mapping, concrete reparaties en het exacte inspectiebereik. Configuratiegereedheid, lokale integratietests en productieacceptatie zijn afzonderlijke bewijzen; een vinkje bij de ene vervangt de andere niet.
