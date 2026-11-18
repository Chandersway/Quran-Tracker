# Plan: OTA-updates en nieuwe mushafs

Datum: 18 november 2026. **Status: ontwerp voor latere uitvoering.** Dit document schakelt geen updates in, publiceert niets en verandert geen appcode. De genoemde nieuwe modules en npm-scripts bestaan nog niet.

## Wat we willen bereiken

Na een eerste nieuwe Android- en iOS-installatieversie kunnen we de interface en geschikte appcode bijwerken, en nieuwe mushafs aanbieden zonder daarvoor telkens een storeversie uit te brengen. We behouden bestaande gegevens, de oorspronkelijke importcontracten en de huidige leesfuncties.

We gebruiken twee afzonderlijke kanalen:

| Wijziging                                                   | Levering                                                         | Voorwaarde                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Teksten, vormgeving, menu-item of nieuw React Native-scherm | Ondertekende JavaScript-update via Expo Update                   | Werkt met de native onderdelen van de geïnstalleerde versie; past binnen de storevoorwaarden |
| Nieuwe mushaf, vertaling, audio of bijgewerkte inhoud       | Catalogus en downloadpakketten, aanvankelijk op Supabase Storage | De app ondersteunt het bestandstype, gegevensschema en de benodigde lezerfuncties al         |
| Een extra ingang naar bestaande inhoud                      | Catalogusgegevens voor een vooraf ondersteund type bestemming    | Geen willekeurige routenaam, script of nieuw scherm uit servergegevens uitvoeren             |
| Nieuwe native bibliotheek, permissie of leesengine          | Nieuwe APK/AAB en IPA                                            | Daarna kunnen passende OTA-updates deze native mogelijkheden gebruiken                       |

Een menu-item met een volledig nieuw scherm vraagt doorgaans een JavaScript-update. Een nieuw boek in een bestaande bibliotheek vraagt alleen een inhoudspublicatie. Een nieuwe PDF levert op zichzelf geen ayahselectie, woordbetekenissen, audiokoppeling of correcte leesstatistieken op: daarvoor zijn gecontroleerde aanvullende gegevens nodig.

OTA is een distributiewijze, geen algemene vrijstelling van appreview. Bij nieuwe functionaliteit controleren we of een storepublicatie nodig is volgens de dan geldende [Apple-regels](https://developer.apple.com/app-store/review/guidelines/#software-requirements) en [Google Play-regels](https://support.google.com/googleplay/android-developer/answer/16559646). Expo beschrijft de technische grens tussen updates van appcode en native wijzigingen in de [introductie](https://docs.expo.dev/eas-update/introduction/).

## Wat er nu in de code staat

| Onderdeel                                                                                                                                                                                                                   | Huidige situatie                                                | Benodigde verandering                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [package.json](../package.json), [app.config.ts](../app.config.ts), [eas.json](../eas.json)                                                                                                                                 | Geen `expo-updates`, update-URL, runtimebeleid of updatekanalen | Updater installeren en configureren; preview en productie scheiden                                   |
| [Mushafbibliotheek](../src/services/mushaf/library.ts)                                                                                                                                                                      | Vaste uitgaven en een gesloten `LibraryEdition`-type            | Bestaande catalogus behouden als offline basis; gevalideerde externe uitgaven toevoegen              |
| [Native catalogus](../plugins/backgroundMushafDownloads/catalog.json)                                                                                                                                                       | Wordt in Android en iOS ingebouwd                               | Een versieerbaar downloadcontract toevoegen dat nieuwe uitgaven veilig accepteert                    |
| [Native downloadplugin](../plugins/withBackgroundMushafDownloads.js), [Android](../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt), [iOS](../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.m) | Downloaders kennen de ingebouwde uitgaven en bronnen            | Gecontroleerde pakketbeschrijvingen verwerken en bewaren voor hervatting zonder JavaScriptproces     |
| [Downloadinterface](../src/services/mushaf/backgroundTypes.ts), [manager](../src/services/mushaf/backgroundManager.ts)                                                                                                      | Starten op bekende uitgave-ID, met één gedeelde voortgang       | Nieuw contract aansluiten, bestaande taken en globale voortgang behouden                             |
| [State](../src/state/models.ts), [reducer](../src/state/reducer.ts)                                                                                                                                                         | Uitgaven en sommige paginagrenzen staan vast                    | Uitgave-ID, pakketversie en paginakoppeling veilig ondersteunen zonder oude gegevens te herschrijven |
| [Navigatiecatalogus](../src/app/navigation/dockDestinations.ts), [routes](../src/app/navigation/types.ts), [menuregels](../src/domain/dockPreferences.ts)                                                                   | Bekende bestemmingen; maximaal drie vastgezette items           | Nieuwe bestemmingen expliciet toevoegen; opgeslagen keuzes en standaardmenu behouden                 |

Alleen `expo-updates` installeren is dus onvoldoende voor willekeurige nieuwe mushafs. De huidige APK mist zowel de OTA-configuratie als het uitbreidbare native downloadcontract. De aanpassing komt in de Expo-configuratie en plugins; handmatig wijzigen van gegenereerde `android/`- of `ios/`-bestanden is geen blijvende oplossing.

## Verdeling in de code

```text
src/
  services/
    updates/                 Nieuwe adapter voor controleren, ophalen en updatestatus
    mushaf/
      catalog/               Nieuwe validatie, cache en samenvoeging van catalogusbronnen
      backgroundManager.ts   Bestaande eigenaar van downloadvoortgang
  app/
    providers/               Eén updatecoördinator voor de hele app
    navigation/              Getypeerde bestemmingen, menu en vastzetten
  features/
    account/                 Updatestatus binnen de bestaande instellingen
    quran/                   Bestaande lezer en bibliotheek gebruiken de catalogus
  domain/                    Regels voor uitgaven, compatibiliteit en paginakoppeling
  state/                     Bewaren en herstellen van gebruikerskeuzes

plugins/backgroundMushafDownloads/  Android- en iOS-downloadcontract
scripts/                           Catalogus controleren/publiceren en OTA publiceren
```

`domain` bevat berekeningen en regels zonder netwerk- of schermcode. `services` verbergt communicatie, bestandstoegang en platformverschillen. Schermen vragen bijvoorbeeld om beschikbare uitgaven of een download; ze hoeven geen Supabase-bucket, handtekeningcontrole of native job te kennen. Gedeelde interfaceonderdelen blijven in `src/shared`.

We houden de openbare interfaces klein. De catalogus biedt beschikbare uitgaven, compatibiliteit en een gevalideerd pakket. De downloader beheert de overdracht. De updater beheert appupdates. Er komt geen tweede algemene downloadmanager of extra backendframework naast de bestaande onderdelen. Elke nieuwe map krijgt een README met verantwoordelijkheid, belangrijkste ingang en toegestane afhankelijkheden.

## 1. Contracten en uitgangssituatie vastleggen

Eerst leggen we de huidige installatie, gegevens en catalogus vast als terugvalbasis. We bewaren testgevallen voor Kotlin-imports, notities, leesgeschiedenis, hifz-scores, bladwijzers, menukeuzes en actieve downloads. Bestaande bronbestanden en uitgave-ID's blijven behouden.

We definiëren vier afzonderlijke versies:

- **Native runtime:** welke appcode met de geïnstalleerde Android- of iOS-binary kan werken.
- **Catalogusschema:** welke velden en pakkettypen de app begrijpt.
- **Pakketversie:** de onveranderlijke bestanden van één uitgave.
- **Gebruikersgegevensschema:** hoe leesposities, instellingen en andere persoonlijke gegevens worden opgeslagen.

Deze versies mogen elkaar niet stilzwijgend vervangen. Een nieuw boek verandert niet automatisch iemands opgeslagen paginanummer of de betekenis van een historische leesregistratie.

**Gereed wanneer:** er een contract met geldige en ongeldige voorbeelden ligt, bestaande importtests slagen en de compatibiliteitsregels voor oude installaties en gegevens expliciet zijn.

## 2. Een uitbreidbare inhoudscatalogus maken

De catalogus combineert de ingebouwde uitgaven met een gecontroleerde online lijst. Zonder netwerk blijft de laatst geldige lijst beschikbaar en werkt de gebundelde mushaf. Een foutieve nieuwe lijst vervangt de werkende cache niet.

Per uitgave beschrijven we minimaal:

- Stabiele ID, pakketversie, bronnaam, herkomst en recht om bestanden opnieuw aan te bieden.
- Volledige titels en beschrijvingen per taal; Nederlands, Engels en Arabisch zonder woord-voor-woordvertaling.
- Riwaya, nummeringsstelsel, bestandstype, fysiek paginatotaal en eventuele omslagpagina's.
- Bestandslocaties, verwachte groottes en SHA-256-controlesommen, inclusief eventuele losse pagina's.
- Ondersteunde functies: alleen lezen, ayahselectie, woordselectie, navigatie, paginastatistieken en audio.
- Versies en controlesommen van bijbehorende uitsneden, pagina-ayahkaarten, selectievakken, lettertypen en audiokoppelingen.
- Vereiste catalogus- en native downloadversie. Onbekende vereisten geven een duidelijke melding dat een appupdate nodig is.

De bestanden krijgen onveranderlijke, versiegebonden paden. We publiceren eerst alle bestanden, controleren ze en publiceren daarna pas de catalogusverwijzing. Grote mushafs en audio worden geen onderdeel van ieder OTA-pakket.

De catalogus wordt ondertekend met een eigen publicatiesleutel. Een controlesom detecteert beschadiging; de handtekening bewijst dat de beschrijving van onze uitgever komt. We leggen de exacte ondertekende bytes en het verificatieformaat vast, zodat JavaScript, Android en iOS hetzelfde controleren. De app bevat uitsluitend de openbare verificatiesleutel.

Een ingetrokken catalogusitem verdwijnt uit nieuwe downloads; het wist geen gedownload boek of persoonlijke gegevens. Een pakketvernieuwing vervangt evenmin stilzwijgend de uitgave die iemand op dat moment leest.

**Gereed wanneer:** een testcatalogus zonder codewijziging een nieuwe uitgave kan beschrijven, ongeldige gegevens worden geweigerd en de offline basis behouden blijft.

## 3. Native downloaden, lezer en opslag aansluiten

Android en iOS krijgen een versie van het downloadcontract die een ondertekende pakketbeschrijving zelfstandig controleert. De bridge wordt geen algemene interface om willekeurige URL's naar willekeurige bestandspaden te schrijven. De native laag bepaalt zelf de bestemming en begrenst bestandsgrootte, aantallen, uitgepakte gegevens en toegestane HTTPS-bronnen en redirects.

Het protocol bewaart de benodigde pakketmetadata voordat een OS-download begint. Een herstart mag niet afhankelijk zijn van een nog aanwezige JavaScriptvariabele of de nieuwste online catalogus. Oude downloadtaken worden herkenbaar behouden of gecontroleerd hervat; we vervangen de bestaande native persistentie niet door JavaScript-timers.

Downloaden schrijft naar tijdelijke bestanden. Pas na formaat-, grootte- en integriteitscontrole wordt het nieuwe pakket actief. Een mislukte poging beschadigt de bestaande versie niet. De subtiele voortgangsbalk, doorklikken naar voortgang en resterende tijd blijven werken. Bij onbekende grootte tonen we geen verzonnen percentage of tijd.

Ook buiten de bibliotheek zoeken we alle vaste uitgave-ID's en paginagrenzen op, waaronder `bookPresentation`, `mushafReading`, `readingContext`, `mushafPageMetrics`, statevalidatie en platformopslag. Die gebruiken voortaan gecontroleerde metadata en functies van de gekozen uitgave. Alle boeken als een standaardmushaf met 604 pagina's behandelen is geen geldige migratie.

Persoonlijke gegevens blijven gekoppeld aan de juiste uitgave en waar nodig pakketversie. Nieuwe gegevens worden toevoegend opgeslagen; onbekende uitgaven blijven bewaard als tijdelijk onbeschikbaar. We toetsen expliciet of een oudere OTA-versie deze gegevens kan lezen zonder ze weg te schrijven. Waar dat niet kan, gebruiken we gescheiden opslag of een herstelupdate in plaats van een onveilige terugzetting.

Selectiegebieden en de zichtbare pagina gebruiken dezelfde uitsnede en schaal. Zonder geverifieerde paginakoppeling blijft een boek leesbaar, met duidelijk beperkte studie- en registratiefuncties. We koppelen dan geen willekeurige ayahs, woordbetekenissen of audio aan de pagina.

**Gereed wanneer:** een onbekende maar ondersteunde testuitgave op beide platforms downloadt, herstart en offline opent, terwijl oude boeken, importgegevens en markeringen blijven werken. Schermwisseling stopt een download niet. Android force-stop en iOS geforceerd afsluiten blijven OS-beperkingen; hervatting wordt bij terugkeer gecontroleerd.

## 4. OTA en menu-uitbreiding toevoegen

We installeren de versie van `expo-updates` die bij de gebruikte Expo SDK past. Daarna configureren we project-ID, update-URL, runtimebeleid, ondertekening en afzonderlijke `preview`- en `production`-kanalen. Ook lokaal gebouwde APK's moeten expliciet het juiste kanaal krijgen; alleen een kanaal in `eas.json` zetten regelt niet iedere lokale Gradle-build. Zie de [Expo-inrichting](https://docs.expo.dev/eas-update/getting-started/).

Als uitgangspunt gebruiken we Expo's fingerprintbeleid voor de native runtime. We testen met onze eigen plugins dat een relevante native wijziging een andere runtime oplevert en een gewone JavaScriptwijziging compatibel blijft. De updater weigert updates die niet bij de runtime passen. Zie [runtimecompatibiliteit](https://docs.expo.dev/eas-update/runtime-versions/).

Privésleutels en publicatietokens gaan in GitHub Secrets of de daarvoor bedoelde geheime opslag bij de buildprovider. Openbare project-ID's, download-URL's, verificatiesleutels en Supabase-clientconfiguratie mogen wel in de app: ze verlenen geen beheerdersrechten. Een service-role-key of privésleutel komt nooit in `EXPO_PUBLIC_*`, de JavaScriptbundel of een downloadmanifest.

Voor ondertekende Expo-updates controleren we vooraf het abonnement. Volgens de documentatie op 18 november 2026 vereist Expo's hosted code signing een Production- of Enterprise-abonnement. We sluiten niets automatisch af. Certificaatrotatie wordt gepland als native runtimewijziging met een nieuwe installatieversie; een wijziging van alleen een GitHub Secret is onvoldoende. Zie [code signing](https://docs.expo.dev/eas-update/code-signing/).

De app start met de beschikbare werkende versie en controleert daarna op updates. Een opgehaalde versie wordt bij een volgende geschikte start actief, of via een bewuste actie wanneer de app veilig kan herstarten. We onderbreken geen leessessie, audio, niet-opgeslagen notitie of chatconcept. Instellingen toont appversie, runtime, update-ID, kanaal, catalogusversie en eenvoudige updatestatus.

Nieuwe schermen krijgen normale getypeerde routes in de appcode. Catalogusgestuurde ingangen mogen alleen bestaande, toegestane bestemmingstypen openen, bijvoorbeeld een collectie in de bibliotheek. De app interpreteert geen gedownloade JavaScripttekst of willekeurige routenamen.

Een nieuw menu-item verschijnt standaard onder **Meer**. De bestaande maximaal drie vastgezette bestemmingen worden niet overschreven. **Standaard herstellen** blijft Statistieken, Mushaf en Groepen herstellen. Tijdelijk onbeschikbare bestemmingen verwijderen niet ongemerkt de opgeslagen voorkeur.

**Gereed wanneer:** een echte preview-installatie een ondertekende interface-update ontvangt en een nieuw menu-item opent, zonder opnieuw te installeren. Dit bewijzen we afzonderlijk op Android en iOS; Metro/Fast Refresh is geen OTA-test.

## 5. Publicatie, terugzetten en acceptatietests

We voegen afzonderlijke publicatiestappen toe naast de bestaande native builds. Voorgestelde npm-scripts — nog te implementeren — zijn `update:preview`, `update:production`, `update:status`, `content:validate` en `content:publish:preview`. De productiepublicatie krijgt een expliciete omgeving en versie; een gewone push publiceert niet automatisch naar gebruikers.

De GitHub-workflow controleert types, lint, relevante tests, platformexports, runtime, ondertekening en doelaanwijzing. De gepubliceerde bundel moet bij de geteste commit en omgeving horen. Cataloguspublicatie controleert daarnaast alle bestanden, koppelingen en hashes. De bestaande APK/AAB/IPA-workflow blijft nodig.

Een productie-update begint met een kleine groep, bijvoorbeeld 10%, en breidt na controle uit. We registreren update-ID's, technische fouten en downloadresultaten zonder persoonlijke leesgeschiedenis of chatinhoud in logs op te nemen. Zie [gefaseerde Expo-uitrol](https://docs.expo.dev/eas-update/rollouts/).

Terugzetten van appcode en terugzetten van inhoud zijn aparte acties. Voor catalogusherstel publiceren we een nieuwe catalogusversie die weer naar een eerder geldig pakket wijst. We verwijderen geen gebruikersgegevens. Expo's automatische foutherstel is een laatste vangnet; na onomkeerbare wijzigingen aan opgeslagen gegevens kan een herstelupdate nodig zijn in plaats van oudere appcode. Zie [foutherstel en beperkingen](https://docs.expo.dev/eas-update/error-recovery/).

| Proef op Android én iOS                                           | Verwacht resultaat                                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Nieuw menu-item en nieuw JS-scherm via OTA                        | Zelfde native installatie; nieuw scherm opent; vastgezette items blijven behouden      |
| Nieuwe mushaf alleen via de catalogus                             | Zelfde native installatie én dezelfde JS-update; boek kan worden gedownload en gelezen |
| Nieuwe native eis in een pakket of appupdate                      | Incompatibele update wordt niet uitgevoerd; begrijpelijke melding waar nodig           |
| Geen netwerk of onbereikbare catalogus                            | Bestaande app en geïnstalleerde boeken blijven bruikbaar                               |
| Ongeldige handtekening, hash, redirect of bestandspad             | Pakket wordt geweigerd; bestaande inhoud blijft intact                                 |
| Onderbroken download, schermwisseling, procesherstart, annulering | Voortgang en bestandstoestand kloppen; geen half geïnstalleerd boek                    |
| Selectie, crop, zoom, fullscreen, pagina- en audioacties          | Juiste pagina en ayah voor deze uitgave; ontbrekende koppelingen zijn expliciet        |
| Update tijdens lezen, audio, notitie of chatconcept               | Geen gedwongen herstart of verlies van werk                                            |
| Terugzetten na gebruik van de nieuwe versie                       | Gegevens blijven behouden; anders vooraf bewezen herstelupdate gebruiken               |
| Oude Kotlin-import, hifz, leesplan en statistieken                | Bestaande betekenis en telregels ongewijzigd                                           |
| Nederlands, Engels, Arabisch en RTL                               | Volledige labels, goede navigatie en bruikbare toegankelijkheidslabels                 |
| Ondertekende catalogus uit een testmirror op andere hosting       | Zelfde pakketvalidatie en leesgedrag; geen Supabase-aanname in schermen                |

De eerste twee proeven zijn het belangrijkste bewijs: een schermafbeelding of geslaagde bundelbuild alleen toont niet aan dat distributie naar bestaande installaties werkt.

## 6. Eerste release en latere VPS

Na acceptatie publiceren we één nieuwe native versie voor Android en iOS met de updater, verificatiesleutels en het nieuwe downloadcontract. Gebruikers moeten deze versie eerst installeren. Oudere installaties krijgen geen mogelijkheid die ontbreekt in hun binary.

Daarna lopen geschikte interface-updates en inhoudspublicaties onafhankelijk. Native wijzigingen blijven via de stores gaan. We werken de [releasehandleiding](RELEASE_HANDLEIDING.md), [gebruikershandleiding](GEBRUIKERSHANDLEIDING.md), lokale ontwikkelhandleiding en module-README's bij met de werkelijk geteste opdrachten, herstelstappen en beperkingen.

Voor inhoud kiezen we een stabiele publicatie-URL en een hostingonafhankelijk manifest. Supabase levert aanvankelijk de bestanden. Een latere VPS moet dezelfde HTTPS-, integriteits-, range- en cacheafspraken ondersteunen. De vertrouwde bronnen en redirects worden binnen het ondertekende protocol beheerd; een willekeurige serverrespons kan geen nieuwe downloadhost vertrouwen laten krijgen.

Voor appcode gebruiken we aanvankelijk Expo Update. Zelf hosten vraagt een server die het [Expo Updates-protocol](https://docs.expo.dev/versions/latest/sdk/updates/) correct ondersteunt. Dit is een afzonderlijke migratie. Een ingebouwde update-URL, certificaat of platformconfiguratie veranderen kan een nieuwe native release vereisen; we beloven niet dat iedere hostingwissel volledig op afstand kan.

## Werkverdeling en benodigde inrichting

Na vaststelling van de contracten verdelen we de uitvoering over vijf werkpakketten: OTA en CI; catalogus en publicatiescripts; native downloads voor beide platforms; lezer/state/navigatie; onafhankelijke regressiecontrole en documentatie. De laatste rol controleert ook de wijzigingen van de andere vier. Parallel werk begint pas wanneer de gedeelde interfaces vastliggen; integratie en apparaatproeven blijven gezamenlijke afrondingsstappen.

Voor uitvoering zijn nodig:

- Een gekoppeld Expo-project, gekozen updatekanalen en passende servicecapaciteit voor ondertekende updates.
- Gescheiden preview-/productieconfiguratie en beheerde privésleutels, zonder geheime waarden in Git.
- Supabase Storage-inrichting voor de inhoud, gecontroleerde bronbestanden en een cataloguspublicatieproces.
- Werkende GitHub Actions. De huidige bekende blokkade is een account-billingblokkade waardoor runners niet starten; lokale checks lossen dat niet op.
- Android-signing en voor iOS Apple-provisioning plus EAS/macOS-buildcapaciteit en een testtoestel. JavaScript-export vervangt geen native iOS-acceptatie; zie de [releasehandleiding](RELEASE_HANDLEIDING.md).

**Startpunt voor later:** eerst contracten, gegevensbehoud en de uitbreidbare catalogus/downloaders; vervolgens OTA aansluiten; daarna beide bewijzen op preview-installaties; ten slotte de eerste native release. De huidige app wordt door dit plan niet gewijzigd.
