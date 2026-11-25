# Interfacecomponenten

Importeer algemene bouwstenen uit deze map, bijvoorbeeld `import { Button, T } from '../../../shared/components'`. De componenten gebruiken het actieve thema en behouden hun toegankelijkheidslabels.

`T` (ook beschikbaar als `AppText`) toont tekst standaard letterlijk. Daardoor blijft een groepsnaam zoals `Settings` ook in het Nederlands ongewijzigd. Gebruik voor interfacekopij een expliciete vertaalsleutel:

```tsx
const { t } = useI18n();
<T>{group.name}</T>
<T>{t('common.loading')}</T>
```

`<T translate>common.loading</T>` is ook mogelijk. Andere bouwstenen zoals `Button`, `Row`, `Field` en `Sheet` vertalen hun interfacekopij zelf; voor dynamische titels bieden `Row` en `Sheet` een `translateTitle={false}`-optie. Gebruik die voor gegevens van gebruikers.

## Kaarten en achtergrondpatroon

`Card` is het algemene kaartoppervlak voor alle features. Het voegt automatisch `CardOrnament` toe en kiest uit drie afzonderlijke transparante stencils: `arabesque` met vrije kalligrafische krullen, `zellij` met hoekige ster-/ruitvlecht en `lattice` met open boogtralie. Een pure hash van React `useId` houdt die keuze stabiel zolang dezelfde kaart gemount blijft, ook bij hertekenen, themawissels en het tijdelijk uitschakelen van de decoratie. De keuze wordt niet als gebruikersvoorkeur opgeslagen; na unmount of een nieuwe sessie is dezelfde automatische variant niet gegarandeerd.

Gebruik `ornament="zellij"`, `ornament="arabesque"` of `ornament="lattice"` wanneer de compositie een vaste familie nodig heeft. De eerste drie homeblokken gebruiken expliciet zellij, arabesque en lattice. Zowel `Card` als `StatisticsSurface` accepteren deze families; `ornament={true}` gebruikt de automatische keuze en `ornament={false}` laat de decoratie weg. `StatisticsSurface` behoudt daarnaast de bestaande scrollanimatie en dekkende achtergrond.

In **Instellingen → Uiterlijk → Kaartpatronen** kan de gebruiker alle kaartpatronen uitschakelen. `CardOrnament` respecteert die opgeslagen voorkeur centraal, ook bij rechtstreeks gebruik binnen een `Pressable`. De decoratieve `ArabicWatermark` op statistiekkaarten volgt dezelfde voorkeur. De kaartkleur, inhoud en dekkende achtergrond blijven behouden. Standaard staan patronen aan; het grote Hifz-/herhaaloverzicht op Stats heeft altijd een effen achtergrond via `ornament={false}`.

Een afwijkend interactief kaartoppervlak, zoals een volledige `Pressable`, kan `CardOrnament` als eerste kind gebruiken met `surface`, `radius` en `variant`. De component heeft centrale familiepresets voor `strength` (`subtle`/`regular`) en `placement` (`full`/`start`/`end`); uitzonderingen kunnen die expliciet kiezen. De drie families gebruiken echt verschillende bestanden. Voeg de decoratie niet los aan iedere rij of invoerveld toe.

`color`, `style.backgroundColor` en een afwijkende `borderRadius` blijven leidend. De tint volgt de daadwerkelijke kaartkleur. Alleen de absolute decoratielaag heeft transparantie; het kaartoppervlak blijft dekkend. Die laag wordt op de kaartradius afgeknipt, verandert de layout niet, ontvangt geen aanrakingen en wordt niet voorgelezen. Er zijn drie gedeelde gebundelde afbeeldingen en geen netwerkaanvragen of SVG-patronen per kaart.

## Richting en gemengde tekst

`DirectionView` zet Yoga-richting op basis van de gekozen app-taal bij de app-root. `Screen`, `Sheet` en de introductie zetten dezelfde richting aan hun eigen root; native modals erven de richting niet betrouwbaar van de app-root. Gewone rijen gebruiken `flexDirection: 'row'`, zonder extra taalafhankelijke `row-reverse`. `start`/`end`-eigenschappen volgen de layoutrichting. `NavigationContainer` krijgt dezelfde `direction`; `I18nManager.forceRTL`, een herstart en een wisselende navigatiekey zijn niet nodig.

`Icon`, `IconButton` en `Button` hebben `mirrorInRtl` voor semantische terug-/volgendepijlen. Gebruik dit niet op fysieke mushafpijlen of media-afspeeliconen. Boekcoördinaten, swipes en sliders behouden hun expliciete fysieke richtingsgrens. `Field` houdt e-mail-, URL- en numerieke invoer LTR; `T textDirection="ltr"` is beschikbaar voor weergegeven e-mailadressen/URL's. Quran-tekst blijft intrinsiek Arabisch via `arabic`.

`Segments` laat lange lijsten horizontaal scrollen en brengt de geselecteerde keuze na layout of selectie in beeld. De scrollcoördinaten zijn expliciet LTR; de rij met keuzes volgt de app-taal. Daardoor hebben web en native dezelfde meetbare x-as, zonder dubbele spiegeling. Bij een taalwissel wordt de positie opnieuw gemeten; controles hoeven niet te remounten.

De assets en herkomst staan in [assets/ornaments](../../../assets/ornaments/README.md). Pas de familiepresets en kleurbehandeling centraal in `CardOrnament.tsx` aan, niet per scherm.
