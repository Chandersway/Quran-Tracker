# Gemeenschapsprofielen

`types.ts` is het provideronafhankelijke contract voor `ProfileAccount`, `Profile`, `ProfilePhoto` en `ProfileService`. `profiles.ts` maakt de Supabase-adapter; `services/backend/backend.ts` publiceert deze als `backend.profiles`.

`load` combineert geldige eigen online profielvelden, de eigen cache en daarna de aangemelde identiteit. Kopieën van providernaam of providerfoto krijgen geen voorrang op een bewaarde eigen profielwaarde. `saveName` normaliseert namen tot maximaal veertig tekens en laat het fotoveld weg, zodat een nog niet geladen gemeenschapsfoto behouden blijft. Alleen `saveAvatar` wijzigt de foto. `saveAvatar` leest de gekozen foto, uploadt naar het bestaande accountpad in de avataropslag en bewaart pas daarna de publieke URL met cacheversie.

De optionele opslag bewaart naam en foto-URL onder `wirdna:profile-cache:v1:<account-id>`. Account-ID is stabiel wanneer het e-mailadres verandert en isoleert verschillende accounts. Revisies en een schrijfvolgorde per account voorkomen dat oude loads of lopende saves nieuwere gegevens of een gewiste cache terugdraaien. Uitloggen behoudt de cache; succesvolle accountverwijdering roept `clearCache` aan. Een cachefout maakt een geslaagde serversave niet fout, terwijl serverfouten gewoon doorgaan naar de aanroeper. Een bewaarde URL garandeert geen offline afbeeldingsbestand.

`rememberProviderName` gebruikt `initializeProviderName` om een eenmalig door Apple teruggegeven naam alleen in een nog leeg profiel te zetten. De helper controleert de actuele actor, doet een voorwaardelijke write en raakt de avatar en authmetadata niet aan. Bestaande eigen namen blijven behouden.

De adapter bezit tabelnamen, opslagpaden, MIME-extensies, byteconversie en de schrijfvolgorde. Het accountscherm en zijn hook kennen alleen het publieke profielcontract. De documentkiezer en gelokaliseerde feedback horen bij `features/account`; deze map importeert geen features, navigatie, UI of app-state. Nieuwe providers moeten hetzelfde contract invullen zonder dat schermen hun opslagprotocol leren kennen.

Controles: `tests/profiles-service.test.ts` behandelt terugvalwaarden, cacheherstart, accountisolatie, verwijder-/laadraces, naamnormalisatie, schrijffouten, JPEG/PNG/WebP en de volgorde bij lees- en uploadfouten. `tests/account-profile.test.ts` controleert de bewerkingslevensduur. Tests gebruiken lokale vervangende clients en voeren geen echte uploads uit.
