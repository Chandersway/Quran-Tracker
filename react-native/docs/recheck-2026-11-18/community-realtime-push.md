# Recheck groepen, community, chat, typing en push

Datum: 18 november 2026. Onderdeel van de volledige Kotlin→React Native-recheck. Bronpaden beginnen bij `react-native/`; `../app` is de oorspronkelijke Android-app en `../supabase` het gedeelde servercontract. Deployment en winkelbuilds worden door het hoofdrapport behandeld.

De groepsfunctionaliteit is in React Native aanwezig; de eerdere ontbrekende overzichtsmetingen, leesdetails, lange-postuitklap en HTTPS-uitnodigingslinks zijn opnieuw naar bereikbare componenten getraceerd. Deze recheck vond één afwijkende servicestandaard en twee problemen in de reproduceerbaarheid van QA. Ze zijn hieronder gerepareerd. **Hosted livechat is nog niet bewezen ingeschakeld:** vijf uitsluitend-lezen abonnementprobes geven ieder `RealtimeDisabledForConfiguration`. De concrete beheerprocedure staat in [LIVE_CHAT_SETUP](../LIVE_CHAT_SETUP.md).

## Inspectiebereik en betekenis van de telling

De exacte lijst staat in [community-source-inventory.json](community-source-inventory.json), met per bestand categorie, regelaantal, SHA-256, gedeclareerde class/functie/type-symbolen en aangetroffen RPC-namen. Totaal **167 bestanden**: **24 Kotlin-bronbestanden, 66 RN-bronbestanden, 26 SQL-migraties, 3 Edge Function-bestanden, 17 SQL-testbestanden, 17 QA-/diagnosescripts en 14 RN-testbestanden**.

Dit is een structurele broninventaris plus gerichte semantische tracing, geen claim dat iedere geïnventariseerde functie op een fysiek toestel is uitgevoerd. De kernstromen hieronder zijn gevolgd van bereikbare UI naar service/RPC/RLS en waar vermeld door echte lokale Supabase getest. In gedeelde grote bestanden (`HamburgerMenu`, `MainActivity`, `SupabaseService`, notification coordinator) betreft de semantische review alleen groepen/push/routing. De volledige appinventaris hoort bij het hoofdrapport. Configuratiebestanden `.env.example`, `app.config.ts`, `package.json`, `supabase/config.toml` en officiële Supabase-documentatie zijn daarnaast als setupcontext gelezen; privé-envwaarden zijn niet in dit rapport opgenomen.

### De 24 oorspronkelijke Kotlin-bestanden

Alle onderstaande paden vallen onder `../app/src/main/java/com/Ameender/qurantracker/`. De JSON bevat ook de volledige declaratie-index van de grote bestanden; onderstaande tabel identificeert de relevante classes en helpers.

| Bestand | Gevolgde classes/functies/contracten |
|---|---|
| `data/GroupV2Repository.kt` | `GroupV2Repository`; create/join/load/update/delete; leden/rollen/invites/verzoeken; media/profielen/logo; taken/events; regels/meldingen/moderatie/audit; voortgang/feed/comment/reacties/ranking; DTO's en RPC-parameterclasses |
| `data/SupabaseService.kt` | `SupabaseService`, `SupabaseConfig`, `ReadingGroup*`-modellen; groepsservicefacade, huidige actor, pushdevice/target/preferences |
| `data/GroupMemberPermissions.kt` | Vier serverrechten, inclusief `canInviteMembers=false` |
| `data/GroupAuthorName.kt` | `resolveGroupAuthorName`: actuele naam vóór snapshot |
| `data/PendingNavigationStore.kt` | Ontvangen/consumeren van groeps- en notificatienavigatie |
| `ui/HamburgerMenu.kt` | `AuthenticatedGroupsSettingsPage`, `GroupCommunityContent`, `GroupCreateWizard`, `GroupHomeScreen`, `GroupFeedTab`, `FeedComposer`, `FeedPostCard`, `GroupMembersTab`, `GroupProgressTab`, `GroupDashboardTab`, `GroupLeaderboardTab`, `GroupMediaTab`, `GroupTasksTab`, `GroupEventsTab`, instellingen en bijbehorende dialogs/callbacks |
| `ui/GroupsOverviewScreen.kt` | `GroupsOverviewScreen`, groep/invitation/empty/loading cards en tabselectie |
| `ui/GroupCommentsSheet.kt` | `GroupCommentsSheet`: thread, invoer, verwijderen |
| `ui/GroupFeedPresentation.kt` | `feedCommentLabel`, `feedTimestamp` |
| `ui/GroupErrors.kt` | `localizedGroupError`, veilige code→vertaling |
| `ui/GroupJoinRouting.kt` | `requiresGroupAccessRequest`, uitnodiging houdt eigen foutpad |
| `ui/GroupLogo.kt` | `GroupLogo`, afbeelding/fallback |
| `ui/GroupMemberReadingSheet.kt` | `GroupMemberReadingSheet`, datum/eenheid/ayahbereikhelpers |
| `ui/NotificationsScreen.kt` | Systeemstatus, globale groepscategorieën, per-groepvoorkeuren |
| `notifications/GroupPushRegistration.kt` | `GroupPushRegistration`, `GroupPushRegistrationWorker`, tokenrotatie, sign-outcleanup |
| `notifications/GroupPushPreferences.kt` | Globale categorieën en enabled |
| `notifications/GroupPushGate.kt` | `GroupPushGate`: geordende voorkeur/display/dismiss-operaties |
| `notifications/QuranMessagingService.kt` | `QuranMessagingService`, `GroupPushDisplayWorker`, `validPushUuid`; data-only `group_reply`, targetcheck, deduplicatie |
| `notifications/NotificationText.kt` | Replycopy en categorietekst |
| `notifications/NotificationsViewModel.kt` | `NotificationsState`, `NotificationsViewModel`; opslaan/herladen globale en groepsvoorkeuren |
| `notifications/NotificationPreferencesRepository.kt` | Lokale stille-ureninstellingen |
| `notifications/NotificationPolicy.kt` | `QuietHours`, `GroupNotificationMode`, `GroupEventType`, `NotificationPolicy.groupAllowed` |
| `notifications/NotificationCoordinator.kt` | Gedeelde kanalen/lifecycle; lokale planning valt buiten dit deelonderzoek |
| `MainActivity.kt` | Intent/deeplink ontvangen, pending groeps-/notificationtarget, `Screen.Groups` |

## Functie-, scherm- en instellingenmapping

| Kotlin-gebruikerspad / regel | Huidige RN-implementatie | Beoordeling |
|---|---|---|
| Groepslijst, zoeken, Mijn groepen/Uitnodigingen, refresh, login-gate (`GroupsOverviewScreen`, `AuthenticatedGroupsSettingsPage`) | `features/groups/screens/GroupsScreen.tsx`, account-keyed `GroupsContent`, `GroupJoinFlow` | Aanwezig; geen anon automatisch lidmaatschap |
| 3-staps create wizard; naam/beschrijving | `GroupCreateWizard`, `GroupFormFields` → `groups.create` → `create_group_v3_full` | Aanwezig; naamtrim, max80, beschrijvingmax1000; server blijft eindvalidatie |
| Groepstypes free reading/khatma/daily/memorization/murajaah/study/custom | `GroupFormFields`: `free_reading`, `complete_together`, `daily_tilawah`, `memorization`, `murajaah`, `tafsir_study`, `custom` | Alle zeven aanwezig |
| Voortgangseenheid page/ayah/hizb/juz/surah/lesson/custom | Zelfde waarden in `GroupFormFields` en `GroupProgressPanel` | Aanwezig |
| Doel none/daily/weekly/monthly/total + waarde | `GroupFormFields`, `groupMetrics.groupGoalProgress`, `GroupProgressSummary` | Aanwezig; RN respecteert periode en ruwe custom-eenheden; bekende verbetering t.o.v. Kotlin all-timeberekening |
| Privacy public/code-only/invite-only | `public`/`restricted`/`private`, zelfde servercontract, `GroupSettingsPanel` | Aanwezig; privacy staat ook zichtbaar voor gewone leden |
| Vier gewone-ledenrechten | `canPostMessages`→`post.create`, `canShareProgress`→`progress.create`, `canComment`→`comment.create`, `canInviteMembers`→`invitation.create` | UI/server aanwezig; CR02 corrigeert alleen optionele servicefallback |
| Groepsinstellingen/soft delete, admin-gate | `GroupSettingsPanel`, `GroupScreen` tools; `update_group_v3_full`, `soft_delete_group_v2` | Aanwezig; geen fysieke datadelete toegevoegd |
| Groepscode delen/kopiëren, veilige invite met token/taal | `groupJoin.groupShareUrl`, `GroupScreen`, `GroupMembersPanel`, `GroupJoinLinkHandler`, `pendingGroup` | HTTPS-host + gecodeerde query behouden; app/HTTPS parsing, login-overbrugging en expliciete acceptatie aanwezig |
| Invite creëren/verlopen/maxuses/revoken, verkeerde account/ongeldige invite | `GroupMembersPanel` → `createInvitation`/`revokeInvitation`/`acceptInvitation`; `groupErrors` | Zelfde RPC's en specifieke fouten; idempotente acceptatiemigratie behouden |
| Toegangsverzoek met toelichting, goed-/afkeuren | `GroupJoinFlow`, `GroupMembersPanel`, `requiresGroupAccessRequest`, membership-RPC's | Aanwezig; geen automatische access-request na iedere willekeurige fout |
| Leden, owner/admin/moderator/memberrollen, verwijderen/blokkeren | `GroupMembersPanel`, `listRoles`, `setMemberRole`, `removeMember` | Serverrank/eigenaarsgrenzen blijven leidend |
| Groepsnaam/avataralias en logo | `GroupProfilePanel`, `GroupSettingsPanel`, `GroupImage`, `groupOperations` | Aanwezig; actuele geautoriseerde naam boven post/comment-snapshot; private media-URL's via signing |
| Feedschrijven, trim/max500, literal tekst, 6-regels fold | `GroupFeedPanel`, `ExpandablePostText`, `createTextPost`, `GroupDraftStore` | Aanwezig; concepten account/groepgebonden in geheugen |
| Posts wijzigen/verwijderen/pinnen/melden; eigen/managerrechten | `GroupFeedPanel` → `groupOperations.updatePost/pinPost/deletePost/reportPost` | Aanwezig; originele RPC-authorisatie behouden |
| Likes/reacties, threadcomments, commentverwijdering | `GroupFeedPanel`, backend reactions/comments; dezelfde v2-RPC's | Aanwezig; geredigeerde verwijderde parents behouden threadintegriteit |
| Kotlin feedlimiet60 + refresh | `groupFeedReader`, `GroupFeedController` | Uitgebreid: keysetpaginering, oude pins apart, realtime-invalidation en polling |
| Groepschat | `GroupChatScreen`, `GroupChatComposer`, `useGroupChat`, `groupChat` | Aanvulling boven Kotlinfeed: dezelfde tekstposts, chronologisch, max500, historyscroll en lokale unread-indicatie |
| Typing | `useGroupTyping`, `GroupTypingController`, `createSupabaseGroupTyping` | RN-aanvulling; private server-origin identiteit, geen conceptinhoud/onlinepresence |
| Media upload/preview/delete | `GroupMediaPanel`, `groupOperations.uploadMedia/deleteMedia`, private Storagepolicy | Aanwezig; metadata-/opslagconsistentie, orphancleanup, getekende toegang |
| Taken lijst/filter/type/doel/datum/voortgang/status/toekenning | `GroupTasksPanel`, `backend` task-v3-RPC's | Aanwezig; punten worden via serveruitkomsten verwerkt |
| Events creëren/RSVP/status | `GroupEventsPanel`, event-RPC's | Aanwezig; datumvalidatie en bevoegdheden |
| Dashboard totaalpunten/readings/active today/eenheden/week-/maandleider/recent | `GroupOverviewPanel`, `groupMetrics`, `GroupProgressSummary` | Eerdere CA04-aanvulling aanwezig en bereikbaar via tools/overview |
| Ranglijst total/week/month, streaks, persoonlijke totals | `GroupProgressPanel`, `groupMetrics`, `groupProgressReader` | Aanwezig; pagineert alle zichtbare entries, geen 1000-rowafkapping |
| Lid selecteren → gedateerde lezingen → ayahrange reader | `GroupMemberReadingSheet`, `groupReading` | Aanwezig; lezen-van-lid wijzigt niet stilzwijgend persoonlijke voortgang |
| Voortgang delen | `groupOperations.recordProgress`, `GroupProgressPanel` | Privé bewaren én expliciet delen; delen vereist beide rechten; één atomische RPC, geen stille private fallback |
| Regels, moderatierapportreview, audit, groepsnotificaties | `GroupGovernancePanels`, `GroupNoticesPanel`, `groupOperations` | Services bestonden in Kotlin; geen overeenkomstige actieve Kotlin-HamburgerMenu-caller gevonden. RN maakt ze bereikbaar; niet als Kotlinverlies aangemerkt |
| Groeptaal | `GroupScreen` metadataweergave | Opgeslagen taal zichtbaar. Geen bewerkbare groeptaalselector in actieve Kotlinform; dus geen ontbrekende overzetting |
| Globale push enabled/mention/reaction/announcement/invitation/join_request/update | `features/account/screens/NotificationsScreen`, `backend.notifications` | Opslag/UI aanwezig; providerpad ondersteunt uitsluitend replycategorie |
| Per groep all/mentions/muted, push enabled, muted-until serviceveld | Dezelfde preference-RPC via notificatiescherm | Aanwezig; geen ontbrekende mute-durationpicker geclaimd: actieve Kotlin-UI biedt deze ook niet |
| FCM-register/rotate/unregister, accountgate/dismiss | `pushDevice`, `PushNotificationHandler`, `groupPushState` | Androidcontract behouden; RN registreert pas na expliciete device-opt-in; iOS v2 toegevoegd |
| Reply ontvangen/tap target controleren | `groupPushPolicy`, `groupPushRuntime`, `PushNotificationHandler`, `get_group_push_target_v1` | Aanwezig; serverresolve, accountrecheck, event-ID-dedup; tap naar feeddiscussie |

De UI-defaults voor een nieuwe groep zijn free_reading/page/none/restricted; de eerste drie ledenschakelaars staan aan, uitnodigen uit. Bestaande groepsinstellingen worden geladen uit SQL; dit onderzoek heeft geen bestaande rollen/instellingen herschreven. Persoonlijke taal, theming, audio en lokale planning zijn gedeelde andere auditonderdelen.

## Concrete reparaties in deze recheck

### CR01 — Lokale acceptatietests weigerden een nieuwe checkout

`prepare.mjs` genereert standaard `qurantracker-qa-<hash-van-checkoutpad>`, maar zes community/typing/progressscripts eisten exact de oude lokale ID `wirdna-isolated-qa-20261113`. Daardoor stopte de setup op een nieuwe machine vóór de test, ondanks een correct geïsoleerde database.

Nieuw: `scripts/local-backend-qa/scope.mjs::assertLocalQaScope` valideert een veilige project-ID, de onveranderde vaste loopbackorigin `http://127.0.0.1:55431`, en gelijkheid tussen metadata en lokale `supabase/config.toml`. Aangesloten in `chat-runtime.mts`, `community-runtime.mts`, `typing-runtime.mts`, `typing-native.mts`, `typing-sql.mjs`, `progress-parity.mjs`. Geen volumes of credentials verwijderd. Test dekt nieuw correct checkout-ID, verkeerde lokale config, ontbrekende config en hostedorigin.

### CR02 — Servicefallback gaf gewone leden onbedoeld invitebevoegdheid

Kotlin `GroupMemberPermissions.kt` en de RN createwizard gebruiken `canInviteMembers=false`. `backend.ts::groups.create` gebruikte echter `true` wanneer een aanroeper `memberPermissions` wegliet. De wizard zelf was al correct; de optionele service-invoer gaf een andere standaard.

Eerst de echte lokale runtime aangescherpt: creëer via de ongewijzigde appadapter zonder optionele permissions en lees `get_group_member_permissions_v1` terug. Dit faalde aantoonbaar: `canInviteMembers:true`, verwacht `false`. Daarna uitsluitend de fallbackregel in `backend.ts` aangepast. Dezelfde geïntegreerde chatrun slaagt nu **8/8**, inclusief defaultpermissionsread, echte auth/RLS en sockets. Expliciet gekozen instellingen en bestaande groepen veranderen niet.

### CR03 — Typingtest gebruikte een strengere klokgrens dan de implementatie

Bij de recheck ontvingen beide werkelijke private adapters typingverkeer, maar de oude runtimeassertie eiste `expiresAt <= clientNow+8.1s`. Herhaald instrumenteren gaf bijvoorbeeld **8401,5ms** gecorrigeerde resttijd, **4166ms** ruwe serverresttijd en **−4235,5ms** geschatte klokoffset. De Docker-/clientklokmeting was dus niet exact genoeg voor 100ms marge; dit was niet een stilstaande chat of ongeautoriseerd signaal.

De server-TTL wordt nu rechtstreeks gecontroleerd tussen twee geautoriseerde servertimestamps rond de publicatie: eventexpiry ligt tussen `serverBefore+8000` en `serverAfter+8000`. Separaat geldt de werkelijk aanwezige 2s clienttolerantie; de UI-controller begrenst weergegeven duur tot 8s en negeert oudere/verlopen signalen. Geen product-TTL, privacyregel of UIlimiet verruimd. Rerun: **7/7 typing-integratiescenario's**. Tijdelijke diagnostische delta-uitvoer is verwijderd.

### CR04 — Duurzame read-only readinessdiagnose en setup ontbraken

Nieuw `scripts/check-realtime-readiness.mjs` vervangt de noodzaak om een genegeerd `.tooling`-probe-script te zoeken. Vijf tabellen afzonderlijk, alleen INSERT/UPDATE op nul-UUID-groep, `wait:true`, geen login/RPC/contentquery/mutatie, publieke keyvalidatie, foutredactie en channelcleanup. Nieuwe tests controleren privileged-key- en endpointweigering, redactie, exacte lege-groupfilter/events en cleanup.

[LIVE_CHAT_SETUP](../LIVE_CHAT_SETUP.md) documenteert alle envkeys, servergeheimen, 26 migraties, twee verschillende Realtime-autorisatiepaden, read-only SQL, lokale/hosted verificatie, FCM/APNs, herstel- en DELETE-semantiek en een launchchecklist. Het document beweert niet dat de hosted configuratie al is uitgevoerd.

## Realtime/auth/privacy: expliciet nagekeken

- `createBackend` gebruikt de bestaande geauthenticeerde hoofdclient met sessierefresh. `GroupScreen` en `GroupChatScreen` remounten de inhoud met account-ID + groep; cleanup stopt oude controllers. `createGroupFeedSubscription` opent geen late socket na een geannuleerde lookup. `GroupFeedController` heeft generatiewachten zodat oude callbacks/fetches geen nieuwe lifecycle overschrijven.
- Feedkanalen leveren uitsluitend invalidaties. Nieuwe inhoud komt via een nieuwe geautoriseerde read; payloadinhoud gaat niet direct naar UIstate. Alle vijf tabellen hebben groepsfilters; alleen INSERT/UPDATE worden geconsumeerd. Polling blijft **altijd** 5s chat/30s feed, ook live.
- SELECT-RLS gebruikt het bestaande `can_view_group`, dat publieke groepen zichtbaar maakt voor geauthenticeerde niet-leden. Dit is geen nieuwe openstelling; restricted/private groepen behouden lid-/eigenaargrenzen. De chat-UI verlangt bovendien een niet-guestrol.
- Typing heeft een aparte authenticated socket met `accessToken`-provider die de oorspronkelijke actor eist. Geen hergebruik van oude accountchannels; eigen recipienttopic, namen via geautoriseerde ledenlijst, server-origin afzender/expiry, serverchecks op iedere publicatie. Accountwissel sluit de socket.
- De actuele ontvangerselectie in `publish_group_typing_v1` voorkomt dat een verwijderd lid via gecachte channelauthorization nieuwe typing krijgt. Geïntegreerde negatieve test houdt de oude socket expres open en krijgt na removalcommit geen nieuwe events. De restrictive policytests bewaken ook tegen bredere toekomstige permissive policies.
- Schrijvende chat-RPC's pinnen de access token van de gekozen auteur vóór latere awaits. Lokale integratie wisselt een account tijdens een lopend send en controleert dat de oorspronkelijke auteur behouden blijft en een later stale-accountsend wordt geweigerd.
- Geen end-to-end-encryptieclaim, garantie van iedere Realtime-eventdelivery, duurzaam offline-outboxcontract of idempotency-key voor tekstposts. Dubbele tap tijdens één pending send is voorkomen; bij verloren antwoord na servercommit kan handmatige retry wel dupliceren. Dat is een bestaande expliciet beschreven grens.

## Push: original parity en resterende productgrens

Kotlin `NotificationsScreen.kt` gebruikt `repliesReady/repliesHelp`; `QuranMessagingService` accepteert `kind=group_reply`. De laatste SQL-commenttrigger selecteert uitsluitend actieve leden die postauthor of eerdere commentauthor zijn, sluit de nieuwe commentauthor uit en maakt `source_key='comment:<comment-id>'`. `claim_group_push_v1/v2` filtert dezelfde replyevents; Edge Function `group-push` stuurt uitsluitend dat type naar FCM/APNs.

Daarom is **algemene push voor iedere nieuwe chattekst niet aanwezig in Kotlin of RN**. Dit is geen nog vergeten Kotlin-overzetting en is tijdens deze audit niet als nieuwe bezorgfunctie toegevoegd. Als die productfunctie wordt gewenst, zijn eigen expliciete event/recipient/mute/dedup-contracten nodig; alleen een frontendtoggle of Realtime-publicatie volstaat niet. De huidige globale categorieinstellingen leveren op zichzelf geen providerpad op voor alle categorieën.

Android gebruikt data-only FCM met generieke melding ná clientgate. iOS gebruikt een native APNs alert; de OS-backgroundweergave kan vóór JavaScript plaatsvinden. Serverauthorization vóór iedere verzending en toestelacceptatie zijn daarom essentieel. SQL houdt Android v1 compatible en voegt register/claim v2 voor iOS toe. De dispatcherfunctie bevat een bestaande vaste projecthost, waardoor een clone naar een ander project een gerichte endpointmigratie nodig heeft.

## Uitgevoerde verificatie en niet-geclaimde checks

| Controle | Resultaat |
|---|---|
| Scoped unit/service-run `realtime-readiness`, `group-chat`, `group-typing`, `community-feed`, `group-operations`, `group-push-policy` | **64/64 groen**, inclusief vier nieuwe diagnose-/QA-scopegevallen |
| CR02 vóór fix: echte appadapter create zonder permissions → RPC-read | Rood met precies `canInviteMembers:true` tegenover false |
| `chat-runtime.mts` na fix | **8/8 groen**, lokale twee-actor realtime, actorwisseling, 73 gelijktijdige cursorrows, geen toegang voor buitenstaander/anon, revokedrechten |
| `typing-runtime.mts` na tijdmetingfix | **7/7 groen**, private bidirectioneel, spoofingverbod, buitenstaander, post/readrechtewijziging, verwijderd lid met oude socket, accountwissel, geen chatposts |
| `typing-sql.mjs --test` | Groen, echte lokale policies/execute-/scopeasserties |
| Scoped ESLint en Prettier voor nieuwe readiness/scope/tests en aangepaste QA-scripts | Groen |
| TypeScript `tsc --noEmit` na de wijzigingen | Groen |
| Alle SQL-blokken uit LIVE_CHAT_SETUP in één `BEGIN READ ONLY`-transactie op de lokale QA-database | Groen; functiesignatures/policies/grants daadwerkelijk gecontroleerd, rollback; alle relatieve documentlinks bestaan |
| Hosted read-only, 2026-11-18T00:30:59.911Z | Vijf maal `CHANNEL_ERROR`, reden `RealtimeDisabledForConfiguration`, iedere `payloadCount=0`, `memberDeliveryVerified=false` |
| Hosted wijzigingen, echte cloudchat, echte FCM/APNs-bezorging | Niet uitgevoerd |
| Fysieke Android/iOS rendering, push lifecycle, keyboard, echte Google-auth | Niet opnieuw uitgevoerd in deze scope; hoofdrapport/deploymentacceptatie vermeldt afzonderlijke bewijzen |

De eerste mislukte typingrun is niet verborgen als groen; oorzaak en correctie staan bij CR03. Een kale `SUBSCRIBED` zou evenmin als volledige tweepartijendelivery worden gerapporteerd. Het hoofdrapport voert de uiteindelijke brede TypeScript/lint/tests/buildchecks uit na samenvoeging van alle parallelle scopes.

Er zijn in dit deelonderzoek geen Kotlinbestanden, oorspronkelijke SQL-migraties, Edge Function-bron, assets, hosted data of cloudconfiguratie gewijzigd. De lokale acceptatietests gebruiken bestaande geïsoleerde QA-fixtures en ruimen uitsluitend hun eigen testrecords op. Branch/commit/push wordt door de hoofdagent volgens de bijgewerkte gebruikersopdracht afgehandeld.

## Aanvullende opdracht: native Apple-aanmelding en intrekking

Na afronding van bovenstaande communityscope is afzonderlijk Apple-aanmelding toegevoegd voor de iOS-release. De eerdere inventaris van 167 bestanden en de uitspraak over ongewijzigde Edge Functions horen bij de communityscope; deze aanvullende opdracht voegt **wel** een nieuwe Edge Function toe. Kotlin, bestaande migraties en bestaande `group-push` zijn daarvoor niet gewijzigd.

Native iOS krijgt Apple's eigen knop, CSPRNG-nonce/state, SHA-256 binding en Supabase ID-tokenaanmelding. Annulering is neutraal. Een andere account die tijdens de native prompt inlogt verhindert de tokenuitwisseling. Eerste profielnamen gebruiken conditionele writes en de bestaande per-accountcache; eigen namen/avatars winnen. Een native revocation-listener controleert de actuele Apple-identiteit vóór cleanup. Oude sessiehydratatie mag een nieuwer auth-event niet overschrijven; accountwissels sluiten oude beheerformulieren.

De nieuwe `apple-account-delete` valideert Supabase actor/e-mail en beide Apple ID-tokens, controleert dependencies, verkrijgt een tijdelijke verse Supabase-sessie voor dezelfde actor, trekt de Apple-grant in en roept de bestaande guarded delete-RPC aan. Geen admin-delete, service-role bypass, opgeslagen providerrefresh-token of SQL-verruiming. Een handmatige route bestaat uitsluitend bij ontbrekende bruikbare native credentials, volgens Apple TN3194, en houdt de bestaande recente-auth-eis. Beveiligings-/provider-/configuratiefouten vallen niet terug. Een ontbrekende code bij een andere native Apple-identiteit wordt expliciet geweigerd.

Gericht gewijzigde/toegevoegde app- en testbestanden in deze extra scope (**18**):

1. `src/services/auth/appleIdentity.ts`
2. `src/services/auth/appleOAuth.ts`
3. `src/services/auth/appleOAuth.ios.ts`
4. `src/services/auth/appleAccountDeletion.ts`
5. `src/services/auth/auth.ts` — gedeeld met de onafhankelijke actor-mutationfix; die eigenaarschapgrens is behouden.
6. `src/services/auth/types.ts`
7. `src/services/profiles/initializeProviderName.ts`
8. `src/features/account/components/AppleSignInButton.tsx`
9. `src/features/account/components/AppleSignInButton.ios.tsx`
10. `src/features/account/model/accountCopy.ts`
11. `src/features/account/screens/AccountScreen.tsx`
12. `tests/apple-auth.test.ts`
13. `tests/apple-deletion.test.ts`
14. `tests/apple-revocation.test.ts`
15. `tests/apple-button.test.ts`
16. `tests/account-forms.test.ts`
17. `docs/APPLE_SIGN_IN_SETUP.md`
18. Dit auditappendix.

Serverzijde (**5**): `supabase/functions/apple-account-delete/handler.ts`, `appleProvider.ts`, `index.ts`, `appleProvider_test.ts`, plus de nieuwe `functions.apple-account-delete`-sectie in `supabase/config.toml`. De accountagent heeft `profiles.ts`/`profiles/types.ts` aangesloten; de hoofdagent heeft de dependency, lockfile, `usesAppleSignIn` en configplugin toegevoegd. Dit zijn afzonderlijk gecoördineerde bijdragen, geen impliciete wijzigingen aan de oorspronkelijke community-inventaris.

Bewijs: gerichte Node-service/UI-tests groen, ESLint/Prettier groen en TypeScriptcheck groen. Deno 2.9.6 controleerde de echte function-entrypoint en voerde **3/3** tests met lokaal gegenereerde ondertekende JWT's uit. De Node-tests omvatten verkeerde actor, native/code-subjectmismatch, gewijzigde sessie, dependencyblokkering, provider- en SQL-fouten, fallbackgrenzen, native knop/loading en revocation. De complete uiteindelijke projectrun wordt door de hoofdagent vastgelegd.

Resterende acceptatie is concreet: Apple Developer/provider/secrets/deployment, fysieke native login en intrekking, plus de gedocumenteerde cross-platform recente-authbeperking. Er zijn geen echte Apple-accounts gebruikt of verwijderd, geen secrets geplaatst en geen cloudfuncties gedeployed. Zie [APPLE_SIGN_IN_SETUP.md](../APPLE_SIGN_IN_SETUP.md) voor alle codepaden, instellingen, beheercommando's en grensgevallen.
