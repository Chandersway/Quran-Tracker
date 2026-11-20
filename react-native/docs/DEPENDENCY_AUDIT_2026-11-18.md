# Dependencycontrole — 18 november 2026

Na installatie van de bij Expo SDK 58 passende `expo-apple-authentication` is `npm audit --json` uitgevoerd. Het resultaat bevat **32 high-meldingen**, allemaal afgeleid van **één advisory in picomatch**: [GHSA-fc5q-39xc-vjpf / CVE-2026-112366](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).

De advisory betreft vastlopende reguliere expressies bij speciaal gevormde, door een aanvaller aangeleverde herhaalde extglobpatronen. Hij noemt versies tot en met 4.0.7 en vermeldt bij deze controle **geen gepatchte versie**. `npm view picomatch version` gaf eveneens 4.0.7. Dit is dus geen situatie waarin alleen een beschikbare patchversie moet worden geïnstalleerd.

## Waar de dependency voorkomt

De daadwerkelijk geïnstalleerde boom bevat:

- Expo CLI en Metro-configuratie → picomatch 4.0.7.
- Metro/jest-util/micromatch → picomatch 2.3.2.
- React Native-tooling → tinyglobby/fdir → picomatch 4.0.7.

De app importeert picomatch niet rechtstreeks en biedt gebruikers geen globpatroonveld voor deze tools. Dit plaatst het aangetroffen pad bij de ontwikkel-/buildketen; het is geen bewijs dat de volledige dependencyboom onkwetsbaar is of dat de advisory genegeerd mag worden.

## Beslissing en opvolging

`npm audit fix --force` stelt in deze boom een wijziging van Expo 58 naar Expo 54 voor. Die opdracht is niet uitgevoerd: een frameworkdowngrade zonder gepatchte picomatchversie is geen onderbouwde reparatie en kan de native app breken.

Gebruik de buildtools met de gecontroleerde repositoryconfiguratie en laat geen onbekende invoer als globpatroon verwerken. Herhaal de audit vóór een store-release; zodra een gerepareerde upstreamversie beschikbaar is, update de passende afhankelijkheid en controleer tests, bundels en native build opnieuw.

De dependency-audit is **niet groen verklaard**. Hij staat los van het resultaat van TypeScript, functionele tests, de APK-build en de secretscan. De exacte pakketboom is reproduceerbaar met:

```powershell
npm ls picomatch --all
npm view picomatch version
npm audit
```
