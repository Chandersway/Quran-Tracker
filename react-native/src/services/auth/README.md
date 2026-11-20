# Authenticatie

`auth.ts` is de Supabase-adapter voor aanmelden, accountbeheer en het afronden van aanmeldlinks. `types.ts` beschrijft het publieke contract: `AuthUser` en `AuthSession` bevatten uitsluitend de accountgegevens die de app nodig heeft, zonder SDK-metadata of sessietokens. `services/backend/backend.ts` maakt de adapter en levert het intrekken van de pushregistratie aan.

- `authCallback.ts` controleert de exacte callback-autoriteit, conflicterende credentials en OAuth-URL's. PKCE-herstel vertrouwt het geverifieerde resultaat van de opgeslagen verifier.
- `googleOAuth.ts` bouwt de Google-aanmeldflow; `authCrypto.ts` en `authCrypto.native.ts` verzorgen de platformafhankelijke cryptografie.
- `completeCallback` behoudt OTP-, PKCE- en sessiecallbacks, inclusief de flow-identiteit. `onLifecycle` en `setRefreshActive` geven de app expliciete herstel- en verversingsbediening.
- Wachtwoordcontrole en accountverwijdering controleren de huidige identiteit; de pushontvanger wordt bij afmelden ingetrokken voordat de sessie wordt afgesloten.

Deze map importeert geen features, navigatie, gedeelde UI of app-state. Schermen gebruiken het publieke auth-contract; Supabase-objecten en tokenvelden horen uitsluitend in de adapter. De native sessieopslag blijft in `services/storage`.

Controles: `tests/auth-service.test.ts`, `tests/auth-confirmation-service.test.ts`, `tests/auth-callback.test.ts` en `tests/secure-session.test.ts`. Deze tests gebruiken vervangende clients of blokkeren netwerkverkeer; zij verzenden geen e-mail en wijzigen geen echte accounts. Native aanmelding vereist daarnaast afzonderlijke apparaatscontrole.

`accountMutation.ts` voert wachtwoordwijziging, wachtwoordherstel en e-mailwijziging uit voor de vastgelegde actor. `auth.ts` controleert na eventuele wachtwoordverificatie opnieuw het account-ID. Daarna gebruikt een kortlevende SDK-client uitsluitend de vastgelegde bearer en een privésessie in geheugen. Een later aangemeld account wordt daardoor niet gewijzigd of vervangen. Deze client mag geen refresh-token roteren; bij een verlopen sessie stopt het verzoek. Alleen de PKCE-verifierrecords van een e-mailwijziging worden onder de normale sessieopslagsleutel bewaard, zodat `completeCallback` de bevestigingslink met `sb_flow_id` kan afronden. Wachtwoordfouten kunnen geen lopende OAuth-verifiers verwijderen.

Regressies: `tests/auth-actor.test.ts` wisselt de actor tijdens verificatie en controleert ook herstel; `tests/account-mutation.test.ts` gebruikt de echte geïnstalleerde `AuthClient` met een lokale fetchstub en controleert bearerbinding, intacte actieve sessie, PKCE-opslag/-cleanup en het verbod op afzonderlijke tokenrefresh. De SDK-storageverifiernamen zijn hiermee bewust getest en moeten bij een SDK-upgrade opnieuw worden gecontroleerd.
