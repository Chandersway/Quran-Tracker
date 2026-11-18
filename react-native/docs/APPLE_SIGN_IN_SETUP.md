# Log in met Apple: configuratie, verificatie en accountverwijdering

Gecontroleerd op **18 november 2026**. De repository bevat native Apple-aanmelding voor iOS, Supabase ID-tokenuitwisseling, veilige eerste profielnaam, een intrekkingslistener en een serverroute voor accountverwijdering met Apple-tokenintrekking. De Apple Developer- en Supabase-instellingen zijn tijdens deze werkzaamheden **niet gewijzigd**. Er is geen echte Apple-aanmelding, providerintrekking, accountverwijdering of fysieke iOS-build uitgevoerd. De lokale tests gebruiken eigen testtokens en nagebootste providers.

Deze handleiding hoort bij [de releasehandleiding](RELEASE_HANDLEIDING.md). De bestaande Google- en e-mailaanmelding blijven beschikbaar. Android en web krijgen geen Apple-knop: deze implementatie gebruikt Apple's native framework via Expo, geen browser-OAuth voor Apple.

## 1. Welke stroom is geïmplementeerd?

| Stroom | Client | Apple-configuratie | Server |
|---|---|---|---|
| Native Apple-aanmelding | `expo-apple-authentication` op ondersteunde iPhone/iPad | App ID met Sign in with Apple; juiste provisioning | Apple-provider in Supabase; native bundle-ID als toegestane Client ID |
| Native Apple-accountverwijdering | Nieuwe Apple-bevestiging op expliciet verwijderverzoek | Dezelfde App ID plus Sign in with Apple `.p8`-sleutel | Nieuwe `apple-account-delete` Edge Function met vier Apple-instellingen |
| Handmatige intrekking bij ontbrekende native credential | Bestaande beveiligde accountverwijdering, daarna uitleg/link | Gebruiker verwijdert toegang bij Apple | Bestaande SQL blijft recente authenticatie eisen |
| Browser-OAuth met Apple | **Niet geïmplementeerd** | Services ID, domein, return-URL en client secret | Aanvullende Supabase OAuth-configuratie nodig |

Voor native ID-tokenaanmelding alleen zijn een web-Services ID en periodiek vernieuwde OAuth-clientsecret niet nodig. Die webinstellingen mogen niet worden verward met de aparte serversleutel voor tokenintrekking. Supabase raadt voor Expo op iOS de native stroom aan. Zie [Supabase: Sign in with Apple](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple).

## 2. Apple Developer en iOS-build

1. Gebruik het Apple Developer-team dat de productieapp ondertekent. Open **Certificates, Identifiers & Profiles → Identifiers**.
2. Selecteer of registreer een expliciete **App ID** met exact het bundle-ID uit `app.config.ts`: **`com.Ameender.qurantracker`**. Hoofdletters en punten horen bij de identifier; verander deze niet alleen om een configuratiefout te verhelpen.
3. Activeer **Sign in with Apple** voor die App ID en sla op. Gebruik voor deze zelfstandige app de primaire App ID; stel geen groepering met een andere app in zonder de bestaande accountkoppeling te onderzoeken.
4. Laat EAS/Xcode de gewijzigde capability verwerken in het provisioning profile. Een eerder profiel zonder capability moet worden vernieuwd. Maak vervolgens een nieuwe native build; een JavaScript-update kan de entitlement niet toevoegen.
5. Controleer het getekende iOS-product op entitlement `com.apple.developer.applesignin` met waarde `Default`. Bij handmatige Xcode-configuratie moet de capability ook onder **Signing & Capabilities** aanwezig zijn.
6. Gebruik een fysiek iOS-toestel met een Apple-account voor de definitieve acceptatie. Een simulator of Expo Go bewijst niet dat het productie-bundle-ID en productieprofiel correct zijn.

De repository bevat al:

```ts
ios: {
  bundleIdentifier: 'com.Ameender.qurantracker',
  usesAppleSignIn: true,
},
plugins: [
  // Andere bestaande plugins blijven staan.
  'expo-apple-authentication',
],
```

Dit is een relevant fragment, geen vervanging van de volledige configuratie. De geïnstalleerde Expo-plugin schrijft ook `CFBundleAllowMixedLocalizations=true` indien niet eerder ingesteld. De native Apple-knop gebruikt daardoor de ondersteunde toestelvertaling. De eigen accountmeldingen gebruiken de gekozen app-taal: Nederlands, Engels of Arabisch. De Expo-documentatie beschrijft de capability, beschikbaarheidscontrole en vereiste native knopmaten: [Expo AppleAuthentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/).

`expo-apple-authentication ~58.0.3` en `expo-crypto ~58.0.8` staan in de dependencies. Laat Expo de bij de gebruikte SDK passende versies beheren. Buildcommando's en Apple-signing staan in [RELEASE_HANDLEIDING.md](RELEASE_HANDLEIDING.md); `npm run build:ios` gebruikt EAS. Een lokale iOS-compile vereist macOS/Xcode.

## 3. Supabase Apple-provider

1. Open het bedoelde Supabase-project en vervolgens **Authentication → Sign In / Providers → Apple**; de dashboardindeling kan wijzigen.
2. Schakel de Apple-provider in.
3. Voeg **`com.Ameender.qurantracker`** toe aan **Client IDs**. Dit is de `aud` die Supabase voor de native identiteit moet accepteren. Gebruik hier niet het Team ID, EAS-project-ID, Android applicationId of de website-URL.
4. Wanneer dezelfde provider óók een bestaande web-OAuth-stroom bedient, behoud diens Services ID en bijbehorende instellingen. De native App ID wordt als extra toegestane audience toegevoegd. Voor web-OAuth blijft de Services ID de daarvoor bedoelde eerste Client ID.
5. Sla de providerinstellingen op. Laat nonceverificatie aan; deze app levert de vereiste nonce.
6. Controleer bij een testbuild met afwijkend bundle-ID afzonderlijk de App ID, ondertekening en toegestane Client ID. Voeg een testidentifier niet ongemerkt aan productie toe.

Expo Go kan een ander audience gebruiken, zoals `host.exp.Exponent`. Een login in Expo Go is daarom geen bewijs voor Wirdna's eigen build. Voeg die identifier niet uitsluitend voor een gemakkelijke productietest toe.

Deze native stroom gebruikt geen `qurantracker://auth`-browsercallback. De bestaande callbackroute blijft nodig voor Google/e-mail en mag behouden blijven. Vul evenmin een zelfbedacht Apple server-to-server notification endpoint in: deze wijziging bevat geen receiver daarvoor.

Bij gebruik van Apple's afgeschermde e-mailadres moet de getoonde relay-adreswaarde geaccepteerd blijven. Vraag geen echt e-mailadres als extra voorwaarde om de Apple-aanmelding af te maken. Als eigen mails naar Apple's relay worden verstuurd, configureer de gebruikte afzenderdomeinen/adressen in Apple Developer's email-relayinstellingen en test de bezorging afzonderlijk. Zie [Apple: Configure private email relay](https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/).

## 4. Omgevingsvariabelen en geheimen

Er is **geen nieuwe `EXPO_PUBLIC_APPLE_*`-variabele** nodig.

| Sleutel | Waar | Gebruik / gevoeligheid |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Client-buildomgeving | Bestaande project-URL; zichtbaar in de app |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Client-buildomgeving | Bestaande publieke Supabase-clientsleutel; nooit service-role invullen |
| `SUPABASE_URL` | Edge Function-runtime | Project-URL van het platform |
| `SUPABASE_ANON_KEY` | Edge Function-runtime | Platformsleutel voor Auth/PostgREST; de functie gebruikt daarnaast steeds een gecontroleerde user bearer voor actorhandelingen |
| `APPLE_CLIENT_ID` | Alleen Edge Function secrets | Exact de native App ID: `com.Ameender.qurantracker` |
| `APPLE_TEAM_ID` | Alleen Edge Function secrets | Team dat de Apple App ID en de sleutel bezit |
| `APPLE_KEY_ID` | Alleen Edge Function secrets | Key ID van de Sign in with Apple-sleutel |
| `APPLE_PRIVATE_KEY` | Alleen Edge Function secrets | Volledige PKCS#8 `.p8` private key; strikt geheim |

De Apple-verwijderfunctie gebruikt **geen service-role sleutel** en geen Supabase Admin delete. Een APNs-sleutel is niet automatisch de juiste Sign in with Apple-sleutel. Zet `.p8`, providerrefresh-tokens en client secrets nooit in `app.config.ts`, `EXPO_PUBLIC_*`, Git, buildlogs, screenshots of de mobiele bundel.

De functie verwacht concreet `SUPABASE_ANON_KEY`; een andere omgevingsvariabelenaam wordt niet automatisch als alias gelezen. Bij een aangepaste/self-hosted runtime moeten deze twee Supabase-runtimewaarden beschikbaar zijn. Het mobiele veld met `ANON_KEY` in de naam verandert de vereiste serversecret-namen niet.

## 5. Serversleutel en verwijderfunctie configureren

Accountverwijdering met Sign in with Apple hoort providerintrekking te behandelen. De app vraagt daarvoor bij het verwijderen een nieuwe native authorization code op; er worden geen langdurige Apple-refresh-tokens opgeslagen. Apple beschrijft zowel de geautomatiseerde route als de handmatige uitweg bij ontbrekende tokens in [TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple).

1. Open Apple Developer → **Keys** en maak/selecteer een sleutel met **Sign in with Apple** voor de juiste primaire App ID.
2. Noteer het Key ID en Team ID. Download de `.p8`-sleutel eenmalig en bewaar deze in de gekozen secretsvoorziening. Dit bestand is niet de APNs-certificaatdownload.
3. Voeg de vier `APPLE_*`-waarden uit de tabel toe aan de secrets van het juiste Supabase-project. `APPLE_PRIVATE_KEY` accepteert echte regeleinden of letterlijke `\n` tussen de PEM-regels.
4. Controleer dat de bestaande databasebasis en migratie `20261007010000_account_management.sql` al zijn toegepast. Die levert `account_deletion_status_v1` en `delete_my_account_v1`; de laatste controleert bevestigingsmail, bestaande sessie, authenticatie van maximaal vijf minuten geleden en restrictieve relaties. Bestaande tabellen/RLS/profielen blijven vereist.
5. Deploy de nieuwe functie `apple-account-delete`. Voor Apple is geen nieuwe database-migratie toegevoegd en geen bestaande migratie herschreven.

Voorbeeldcommando's **vanuit de repositoryroot** (`Quran-Tracker`, één niveau boven `react-native`). Dit zijn beheeracties voor de beheerder; ze zijn tijdens deze audit niet uitgevoerd:

```powershell
npx supabase secrets set --project-ref "<jouw-projectref>" --env-file ".\react-native\.tooling\apple-function.env"
npx supabase functions deploy apple-account-delete --project-ref "<jouw-projectref>"
```

Maak het lokale secretsbestand buiten versiebeheer, of in de genegeerde `.tooling`-directory. Het bevat precies de vier `APPLE_*`-regels met echte waarden; print het bestand niet. Controleer de projectref vóór uitvoering. Gebruik de officiële dashboard-secretseditor als je multiline-PEM liever rechtstreeks invoert. De exacte CLI-installatie/projectkoppeling staat in [LIVE_CHAT_SETUP.md](LIVE_CHAT_SETUP.md).

De functie maakt per Apple-verzoek een ES256-clientsecret met maximaal vijf minuten geldigheid. Daardoor is voor deze **revocation-route** geen handmatig opgeslagen zesmaanden-JWT nodig. De onderliggende `.p8`-sleutel moet wel geldig blijven. Een afzonderlijke web-OAuth-clientsecret in Supabase heeft zijn eigen lifecycle en moet, wanneer die webstroom wordt gebruikt, op tijd worden vervangen.

`supabase/config.toml` bevat:

```toml
[functions.apple-account-delete]
verify_jwt = true
```

Laat dit aan. De huidige Supabase-documentatie vermeldt ondersteuning voor zowel HS256 als asymmetrische signing keys. De functie doet bovendien zelf `/auth/v1/user`-verificatie; een API key alleen bewijst geen gebruikersidentiteit. De app verstuurt de gebruikers-JWT in `Authorization`, de SDK gebruikt de projectkey als `apikey`. Zie [Supabase: Authorization headers](https://supabase.com/docs/guides/functions/auth-headers). Bij een oude self-hosted gateway moet diens JWT-ondersteuning afzonderlijk worden onderzocht; verander dit vlaggetje niet blind om een 401 te laten verdwijnen.

## 6. Codepad en veiligheidscontroles

| Bestand / functie | Verantwoordelijkheid |
|---|---|
| `src/features/account/components/AppleSignInButton.ios.tsx` | Apple's eigen native knop, pas na `isAvailableAsync`, 50pt hoog, loading/disabled en toegankelijkheidsstatus |
| `AppleSignInButton.tsx` | Geen knop op Android/web |
| `src/services/auth/appleIdentity.ts` / `createAppleOAuth` | Twee onafhankelijke 32-byte uitdagingen, SHA-256 nonce, statecontrole, annulering en dubbele-aanvraagblokkering |
| `appleOAuth.ios.ts` | Native `getRandomValues`, Expo `signInAsync`, naamformatter en revocation-listener/credential-state |
| `appleOAuth.ts` | Onbeschikbare niet-iOS-adapter |
| `auth.ts` / `signInWithApple` | Controle dat geen andere sessie is begonnen, Supabase `signInWithIdToken`, providerneutrale return zonder credentials |
| `src/services/profiles/initializeProviderName.ts` | Alleen een ontbrekende/lege profielnaam initialiseren; eigenaarcontrole en conditionele write |
| `profiles.ts` / `rememberProviderName` | Succesvol opgeslagen naam in de bestaande per-accountcache bewaren, met revisiebewaking |
| `AccountScreen.tsx` | Annulering stil behandelen, vertaalde fout, providerlabel, profielherladen en negeren van oude accountresultaten |
| `appleAccountDeletion.ts` | Nieuwe Apple-bevestiging, gepinde user bearer, serverroute of expliciete handmatige route |
| `supabase/functions/apple-account-delete/handler.ts` | Verwijdervolgorde, actor/naam/subjectvergelijkingen, dependencychecks en geschoonde fouten |
| `appleProvider.ts` | `jose@6.2.17` JWT-verificatie, clientsecret, Apple code-uitwisseling en tokenintrekking |
| `index.ts` | Alleen user-scoped Supabase HTTP-calls en runtimeconfiguratie; geen adminverwijdering |

De nonce voor Apple is de SHA-256-hexhash; Supabase krijgt de oorspronkelijke willekeurige nonce. Expo's native request geeft de aangeleverde nonce ongewijzigd aan Apple door. De willekeur komt uit `getRandomValues`, niet uit `Math.random` of een ontwikkelfallback. Het ID-token, authorization code en nonce verlaten de auth-adapters niet richting UI/analytics/storage. Zie [Expo Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/).

Apple geeft de volledige naam mogelijk alleen bij de eerste toestemming. De app schrijft die niet over bestaande authmetadata. Een eigen profielnaam wint altijd. Bij lege namen gebruikt de helper een vergelijking met de gelezen waarde; een tussentijdse eigen wijziging wint. Bij een ontbrekende rij gebruikt hij insert-with-ignore-duplicates. Avatarvelden worden niet meegestuurd. Leesfouten stoppen de optionele initialisatie. Als bewaren niet lukt blijft aanmelden mogelijk; de gebruiker kan de naam later zelf invullen, omdat Apple hem bij een volgende login mogelijk niet opnieuw levert.

## 7. Exacte verwijdervolgorde en grenzen

Bij een Apple-gekoppelde account met bruikbare native authorization code:

1. Client controleert de huidige actor, bevestigingsmail en bestaande dependency-preflight.
2. Apple toont een nieuwe native bevestiging. Annuleren stopt het verzoek zonder verwijdering.
3. De client controleert opnieuw de actor en pint zijn bearer in de functierequest.
4. De server haalt de actuele Supabase-user op en vergelijkt account-ID en bevestigingsmail. Apple-subjects komen uit diens servergeleverde identities.
5. `jose` controleert Apple's handtekening via Apple JWKS, algoritme RS256, issuer, native audience, vervaltijd, recente uitgifte en nonce. Het subject moet bij deze actor horen.
6. De server herhaalt de dependency-preflight vóór uitwisseling/intrekking.
7. De code wordt éénmalig bij Apple ingewisseld. Ook het geretourneerde ID-token moet hetzelfde gecontroleerde subject en nonce hebben. Native requests krijgen geen verzonnen browser-redirect-URI.
8. Een geïsoleerde Supabase ID-tokenaanmelding levert een verse sessie voor **dezelfde** actor. Daarmee blijft de bestaande SQL-eis van recente authenticatie intact; de mobiele sessie wordt niet vervangen.
9. Apple trekt het tijdelijke refreshtoken in. Pas bij succes roept de functie de bestaande guarded delete-RPC aan.
10. De tijdelijke Supabase-sessie wordt best-effort gesloten, ook na fouten. Succes retourneert alleen `{deleted:true, accountId}`. De app ruimt het betreffende profiel op en controleert vóór pushcleanup/sign-out opnieuw of nog dezelfde account actief is.

Apple beschrijft de endpoints en de native `redirect_uri`-regel bij [Token validation](https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens), en het intrekken bij [Token revocation](https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens).

Apple en PostgreSQL vormen samen geen atomaire transactie. Als na intrekking een nieuwe beperkende relatie ontstaat, kan SQL de verwijdering alsnog weigeren. De account blijft dan bestaan terwijl de Apple-grant al ingetrokken kan zijn. De app claimt geen succesvolle verwijdering; een nieuwe poging vraagt een nieuwe Apple-bevestiging. De dependency-preflight verkleint deze kans, maar kan haar niet elimineren.

Als native Apple-auth aantoonbaar niet beschikbaar is, of een geldige native credential geen authorization code bevat, wordt de bestaande beveiligde delete-RPC gebruikt. Een teruggegeven native Apple-user-ID moet ook in dit laatste geval overeenkomen met de geauthenticeerde Supabase-identiteit. Na succesvolle verwijdering verschijnt uitleg om Apple-toegang zelf in te trekken plus een knop naar [Apple's instructies](https://support.apple.com/102571).

Deze handmatige route **behoudt de vijfminutengrens** van de SQL. Een oude Apple-only sessie op Android/web kan dus `recent_login_required` krijgen. Daar is geen browser-Apple-herauth geïmplementeerd: gebruik een al gekoppelde aanmeldmethode of meld opnieuw aan op ondersteund iOS. Een geweigerde/mismatched identiteit, onjuiste nonce/state, netwerkfout, ontbrekende serverconfiguratie of providerfout schakelt **niet** stil over naar directe SQL-verwijdering.

Bij een native revocation-event controleert de app de actuele primaire Apple-account en diens Apple-subject via `getCredentialStateAsync`. Alleen bewezen `REVOKED`/`NOT_FOUND` leidt tot sign-out; fouten of een nieuwe actieve account worden niet als intrekking behandeld. Dit is geen server-to-server webhookservice en geen periodieke intrekkingscontrole voor iedere mogelijke gekoppelde provider.

## 8. Lokale verificatie zonder echte accounts

Vanuit `react-native`:

```powershell
npx tsx --test tests/apple-auth.test.ts tests/apple-deletion.test.ts tests/apple-revocation.test.ts tests/apple-button.test.ts tests/account-forms.test.ts tests/account-profile.test.ts tests/auth-service.test.ts tests/auth-actor.test.ts
npm run typecheck
```

De handler-tests roepen echte handlercode aan met nagebootste Apple/Supabase-poorten. Ze dekken onder andere verkeerde actor/e-mail/nonce/subject, geblokkeerde relaties, providerfouten, SQL-races, handmatige fallbackgrenzen, bearerbinding en accountwisseling tijdens cleanup. UI-tests gebruiken de echte componentcallbacks zonder native renderer.

Vanuit `supabase/functions/apple-account-delete`:

```powershell
npx --yes deno@2.9.6 check --node-modules-dir=none --no-lock index.ts
npx --yes deno@2.9.6 test --node-modules-dir=none --no-lock appleProvider_test.ts
```

Deze drie Deno-tests gebruiken lokaal gegenereerde RSA/EC-sleutels en echte JOSE-verificatie: juiste/verkeerde handtekening, issuer, audience, tijd en nonce; ES256-clientsecret; form-encoded exchange/revoke; geschoonde providerfouten. Ze doen geen echte Apple-verzoeken en hebben geen runtime-netwerkrechten nodig. De eerste installatie kan packages uit de registry downloaden. De functiebron pint `jose` op dezelfde versie als de test.

Lokaal uitgevoerd: relevante Node-tests groen, Deno-typecheck groen en **3/3** cryptografie/transporttests groen. De hoofdaudit voert na samenvoeging de volledige projectchecks uit. Dit is geen bewijs voor werkende Apple Developer-provisioning of een geactiveerde hosted provider.

## 9. Fouten gericht oplossen

| Symptoom/code | Controle |
|---|---|
| Geen Apple-knop | Alleen iOS; `isAvailableAsync`; native dependency/plugin in de geïnstalleerde build |
| `ERR_REQUEST_CANCELED` | Gebruiker annuleerde; geen foutmelding, geen backendlogin/verwijdering |
| Provider disabled / invalid audience bij login | Apple-provider ingeschakeld; native bundle-ID in Client IDs; werkelijk ondertekende bundle-ID controleren |
| `APPLE_STATE_MISMATCH` / `APPLE_NONCE_HASH_INVALID` | Niet omzeilen; native state, nonce-hash en raw nonce onderzoeken zonder tokens te loggen |
| `APPLE_DELETE_NOT_CONFIGURED` | Vier `APPLE_*`-serverinstellingen en twee Supabase-runtimewaarden controleren |
| Functie 401 vóór handler | Sessiebearer en project/keycombinatie controleren; user JWT hoort in Authorization, API key in apikey |
| `APPLE_DELETE_IDENTITY_MISMATCH` | Andere Apple-account, verkeerde App ID/audience, verkeerde signature/nonce of actorwisseling; opnieuw met juiste account beginnen |
| `APPLE_CODE_EXCHANGE_FAILED` | Verbruikte/verlopen code, native client-ID, juiste Sign in with Apple-key/team; nieuwe bevestiging starten |
| `APPLE_REVOKE_FAILED` | Providerconfiguratie/beschikbaarheid; account wordt niet door deze route verwijderd |
| `owns_groups` | Eerst groepseigendom overdragen; SQL blijft blokkeren |
| `linked_data` | Restrictieve relaties of storageobjecten volgens bestaande accountbeheerprocedure afhandelen; geen cascade/reset toevoegen |
| `recent_login_required` | Opnieuw authenticeren; tokenrefresh alleen telt niet als verse aanmelding |
| Naam ontbreekt bij volgende login | Verwacht Apple-gedrag; eigen profielnaam instellen, geen providernaam afdwingen |

De app toont vertaalde, korte meldingen. Providerresponsebodies, JWT's, codes en privésleutels worden niet teruggekaatst naar de gebruiker. Inspecteer beheerconfiguratie zonder geheime waarden in rapporten op te nemen.

## 10. Productieacceptatie

- [ ] App ID, Team ID, entitlement, provisioning profile en productie-bundle-ID komen overeen.
- [ ] Supabase Apple-provider is werkelijk ingeschakeld met het juiste native audience.
- [ ] `apple-account-delete` is deployed; serversecrets zijn aanwezig; bestaande accountbeheer-SQL is toegepast.
- [ ] Fysieke iOS-test: eerste login, terugkerende login, Hide My Email, annulering, foutpad, netwerkonderbreking, snelle dubbele tap.
- [ ] Eigen profielnaam/avatar blijven staan; eerste Apple-naam wordt alleen bij lege naam gebruikt; herstart laadt de opgeslagen naam.
- [ ] Testaccount zonder dependencies: expliciete bevestiging → Apple-grant ingetrokken → account echt verwijderd → uitgelogd. Test dit alleen met daarvoor bedoelde accounts.
- [ ] Testaccount met groepseigendom/restrictieve data: geen verwijdering/intrekking vóór succesvolle preflight.
- [ ] Verkeerde Apple-account en accountwisseling worden geweigerd; geen handmatige fallback na beveiligingsfouten.
- [ ] Handmatige route toont de Apple-instructie na succes en bewaart de recente-auth-eis.
- [ ] Native intrekking en terugkeer naar de app geven de bedoelde signed-out toestand zonder een andere account uit te loggen.
- [ ] App Store privacy-/accountbeschrijving, relaymailbezorging en de releasehandleiding zijn gecontroleerd.

Zonder deze toestel- en hosted controles is de implementatie lokaal voorbereid en getest, maar nog niet als productie-aanmelding of App Store-acceptatie bewezen.
