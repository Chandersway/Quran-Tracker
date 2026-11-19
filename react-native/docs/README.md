# Documentatie

Begin bij de gids die bij je taak hoort. De handleidingen beschrijven de huidige applicatie; plannen benoemen wat nog moet worden uitgevoerd. Oudere implementatieverslagen bewaren het bewijs van eerdere versies.

| Ik wil…                                                    | Lees dit                                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| De app gebruiken en instellingen begrijpen                 | [Gebruikershandleiding](GEBRUIKERSHANDLEIDING.md)                                                                                   |
| De compacte groepsfeed, leesaudio en notitievinkje controleren | [Wijzigingen en controles](FEED_AUDIO_NOTES_2026-11-19.md) |
| De wijzigingen uit de laatste schermfeedback volgen       | [Schermfeedback en controles van 19 november](FEEDBACK_IMPLEMENTATIE_2026-11-19.md)                                                 |
| Een scherm, component, service of gedragsregel vinden      | [Technische appgids](TECHNISCHE_APPGIDS.md), [bronindex](recheck-2026-11-18/CODE_INDEX.md) en de README's onder `src/`              |
| Weten wat uit Kotlin is overgenomen en gerepareerd         | [Tweede controle en resultaten](RECHECK_RESULTS_2026-11-18.md) en [bestandsdekking](recheck-2026-11-18/kotlin-review-coverage.json) |
| Android lokaal starten of debuggen                         | [Lokale ontwikkeling](LOCAL_DEVELOPMENT.md)                                                                                         |
| Een APK/AAB/IPA bouwen of publiceren                       | [Releasehandleiding](RELEASE_HANDLEIDING.md)                                                                                        |
| OTA en nieuwe mushafs later mogelijk maken                 | [Uitvoeringsplan voor OTA en de inhoudscatalogus](OTA_EN_MUSHAF_CATALOGUS_PLAN.md) — nog niet geïmplementeerd                       |
| Supabase-chat, typing en rechten inrichten                 | [Live chat instellen](LIVE_CHAT_SETUP.md)                                                                                           |
| Dagelijkse herinneringen controleren en Kotlin vergelijken | [Lokale meldingen: instellingen, correcties en toestelproef](LOCAL_REMINDER_PARITY_2026-11-19.md)                                   |
| Push op iOS afronden                                       | [iOS-push](IOS_PUSH_SETUP.md)                                                                                                       |
| Apple-login en accountverwijdering inrichten               | [Sign in with Apple](APPLE_SIGN_IN_SETUP.md)                                                                                        |
| De oude gebruikersgegevens veilig overnemen                | [Importcompatibiliteit](import-compatibility.md)                                                                                    |
| De laatste dependencywaarschuwing beoordelen               | [Dependency-audit](DEPENDENCY_AUDIT_2026-11-18.md)                                                                                  |

`WORK_STATUS.md` is een chronologisch logboek, nieuwste status bovenaan. `IMPLEMENTATION_*`, oudere `PARITY_*`- en `UI_UX_*`-verslagen zijn historische controles; hun testenaantallen, APK-hashes en resterende punten horen bij de genoemde versie.

`recheck-2026-11-18/` bevat de nieuwe deelrapporten, reproduceerbare inhoudsproeven, bronbehoudcontrole en vindplaatsen. `CODE_INDEX.md` en `source-index.json` worden vernieuwd met `npm run docs:inventory`. Een structurele inventaris bewijst niet dat alle native interacties of externe diensten zijn getest; de resultaten noemen die grenzen afzonderlijk.

Geheime waarden, persoonlijke exports, lokale backendfixtures, tijdelijke buildlogs en APK's horen niet in deze map of Git. Buildbestanden staan lokaal onder het genegeerde `output/builds/`; credentials worden volgens de configuratiehandleidingen in de juiste geheime opslag ingericht.
