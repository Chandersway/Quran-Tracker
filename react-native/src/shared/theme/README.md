# Thema

`index.tsx` bevat `ThemeProvider`: die kiest een van de twaalf oorspronkelijke thema's, of licht/donker bij de systeemkeuze. `usePalette()` levert de actuele kleuren; gebruik deze in plaats van vaste achtergrond- of tekstkleuren. De identifiers staan in `domain/themePreferences.ts`; bestaande Android-waarden blijven geldige voorkeuren.

- `colors.ts`: de twaalf vaste paletten, `Palette`, contrastmeting en `isDarkPalette` voor navigatie/statusbalk. Bepaal de nachtweergave niet door één hexkleur te vergelijken.
- `ThemePicker.tsx`: de gelabelde, toegankelijke keuzeknoppen; alle keuzes blijven bereikbaar bij grote tekst.
- `typography.ts`: de gedeelde lettertypen (`fonts`).
- `spacing.ts`: de gedeelde afstanden (`space`).

Deze onderdelen zijn ook beschikbaar via `shared/theme`. Fontbestanden worden bij het opstarten geladen in `app/providers/AppProviders.tsx`.

`useCardPatterns()` levert de opgeslagen voorkeur voor kaartpatronen. `ThemeProvider` geeft die door via een aparte boolean-context, zodat decoratielagen niet de volledige appstatus hoeven te volgen. `CardOrnament` gebruikt deze voorkeur centraal; nieuwe kaartvarianten moeten dezelfde component gebruiken.

Hifz-kaarttinten gebruiken de afzonderlijke `preferences.hifzColorsEnabled`. Het uitschakelen van patronen verandert die voorkeur of beoordelingen niet. `tests/appearance-preferences.test.ts` controleert alle kleurkeuzen, opslag/import, systeemresolutie en minimaal 4,5:1 contrast voor tekst op de relevante oppervlakken.

```tsx
const palette = usePalette();
<View style={{ backgroundColor: palette.surface }} />;
```
