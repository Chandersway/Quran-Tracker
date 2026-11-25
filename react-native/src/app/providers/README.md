# App-providers

`AppProviders.tsx` laadt lettertypen en stelt veilige schermranden, foutafhandeling, store, thema, focus en audio samen. `AppChromeContext.ts` deelt de toestand van de appbalken met onder andere de schermvullende lezer. Feature-specifieke providerimplementaties blijven bij hun feature.

Boek- en tekstlezer melden alleen hun gefocuste fullscreen-/korte-landscapetoestand aan AppChrome. Hierdoor kunnen globale speler-, focus- en downloadoverlays wijken tijdens lezen; blur en ontkoppelen herstellen de globale bediening. Dit verandert geen opgeslagen leesgeschiedenis of bronlettertype.

Elke gemounte reader heeft een eigen token in `readerChromeOwners`. Een late blur/cleanup van een bewaarde oorspronkelijke boekroute kan daardoor de schermvullende tijdelijke selectie of teruggekeerde originele reader niet overschrijven.
