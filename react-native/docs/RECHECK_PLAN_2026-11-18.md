# Tweede volledige controle — 18 november 2026

De gebruiker vraagt na de gebruikershandleiding opnieuw om controle van alle oorspronkelijke Kotlin-functionaliteit, implementatie van concrete ontbrekende onderdelen en een gedetailleerde handleiding om live chat in te richten. Werk blijft lokaal; cloudwijzigingen en publicatie worden niet uitgevoerd.

Aanvulling: de gebruiker heeft vervolgens expliciet opdracht gegeven tot APK-/IPA-bouwscripts, stapsgewijze storehandleidingen en een nieuwe branch met alle wijzigingen naar GitHub pushen. De werkbranch is `work/react-native-complete-audit-20261118`. Dit autoriseert de branchpush, niet een merge naar `main`, backenddeployment of storepublicatie.

## Uitvoering

| Werkpakket                                                             | Verantwoordelijke            | Resultaat                                                               | Status                                                    |
| ---------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Mushaf, tekst, selectie, studie, lexicon en audio                      | `recheck_reader_audio`       | Bronbestand-/regel-/schermmapping, concrete fixes en regressiecontroles | Afgerond: 147 gerichte tests                              |
| Stats, check-ins, hifz, doelen, planning, checklist, focus en notities | `recheck_tracking_planning`  | Bronbestand-/regel-/schermmapping, concrete fixes en regressiecontroles | Afgerond: 105 gerichte tests                              |
| Groepen, chat, realtime, typing en server/push                         | `recheck_community_realtime` | Bronmapping, fixes en `LIVE_CHAT_SETUP.md`                              | Afgerond; chat en Apple-code, tests en handleidingen      |
| Account, onboarding, instellingen, migratie en platforms               | `recheck_accounts_platform`  | Aanvullende bronmapping en implementatie van concrete hiaten            | Afgerond; zie het resultaatverslag                        |
| Onafhankelijke controle op volledigheid en integratie                  | `recheck_independent_review` | Controle van broninventaris, claims, tests en overgebleven hiaten       | Afgerond; bevindingen hersteld en brondekking vastgesteld |
| Gebruikershandleiding, centrale inventaris en eindverificatie          | Hoofdagent                   | `GEBRUIKERSHANDLEIDING.md`, geconsolideerde resultaten en verificatie   | Afgerond; zie het resultaatverslag                        |

Er kunnen technisch drie subagents tegelijk werken naast de hoofdagent. De vijf werkpakketten worden daarom in twee overlappende rondes uitgevoerd.

## Controleafspraken

- De werkelijke Kotlin- en React Native-broncode is leidend. Eerdere rapporten zijn een index, geen bewijs van volledige dekking.
- Ieder pakket noemt de gecontroleerde bestanden, schermen, instellingen en gedragsregels met de corresponderende implementatie.
- Een echte ontbrekende functie of fout krijgt een lokale implementatie en passende controle. Onzekere bronkoppelingen worden niet verzonnen.
- Originele inhoud, import-/exportcontracten en gebruikersgegevens blijven behouden.
- Codecontrole, tests, native waarneming en externe inrichting worden afzonderlijk gerapporteerd. Een geslaagde unit-test bewijst geen pushaflevering of iOS-interactie.
- Elke resterende beperking krijgt een concrete reden, eigenaar of vervolgstap. Geen algemeen percentage zonder onderliggende inventaris.
- De hoofdagent beoordeelt wijzigingen en voert de gezamenlijke controles uit voordat het eindresultaat wordt gemeld.

## Documenten

- [Gebruikershandleiding](GEBRUIKERSHANDLEIDING.md)
- `LIVE_CHAT_SETUP.md` — exacte lokale code, serverconfiguratie, migraties, rechten, verificatie en foutdiagnose.
- `recheck-2026-11-18/` — onderbouwde controles per werkpakket.

Status en resultaten worden tijdens de uitvoering bijgewerkt.
