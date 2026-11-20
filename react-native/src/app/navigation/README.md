# Navigatie

`AppNavigator.tsx` stelt de stack samen; `MainTabs.tsx` bevat de hoofdtabbladen. `types.ts` beschrijft routes en parameters, `linking.ts` de deep links en `NavigationDock.tsx` de dock. Houd route-identifiers en linkcontracten stabiel: `Today` is het zichtbare dashboard, `Main` de tabnavigator.

`dockDestinations.ts` is de catalogus voor dock, gegroepeerd Meer en de kiezer. Dezelfde catalogus houdt alle oorspronkelijke bestemmingen en de toegevoegde Lexicon-/Studiebronnen-/Boekenroutes bereikbaar. Maximaal drie voorkeuren, lege keuze en standaardherstel blijven in `domain/dockPreferences.ts`; Meer herhaalt vastgezette bestemmingen niet. `navigationCopy.ts` bevat alleen expliciet nieuwe NL/EN/AR-labels. Een lexiconvindplaats opent altijd zijn gecontroleerde canonieke Hafs-referentie; hij erft geen Warsh-editie.

Er is één Mushaf-ingang met boek/tekstkeuze in de lezer. De oude opgeslagen dock-ID `quran` wordt vóór deduplicatie en de limiet van drie naar `mushaf` omgezet. `surah` blijft de inhoudsopgave op tab `Quran`; `library` blijft de afzonderlijke Mushafbibliotheek. Bestaande Reader-deeplinks blijven geldig.
