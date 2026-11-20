# Herstelplan Kotlin-pariteit — 17 november 2026

De gebruiker heeft opdracht gegeven alle concrete verschillen uit de [audit](KOTLIN_PARITY_AUDIT_2026-11-17.md) te implementeren binnen de bestaande React Native-app. De audit blijft historisch bewijs; dit document volgt de uitvoering.

## Werkverdeling

Alle vijf subagenttaken zijn uitgevoerd. De omgeving ondersteunde drie gelijktijdige subagents naast de hoofdagent; taken vier en vijf zijn gestart toen een slot vrijkwam. Na implementatie zijn agents opnieuw ingezet voor onafhankelijke controles en de native PDF-versnelling.

| Taak | Verantwoordelijkheid | Status |
|---|---|---|
| Lezer en studie | Edities, uitsnedes/selectie, Warsh-bestemmingen, zoeken, hervatten, contextacties, Asbab | Geïmplementeerd en geïntegreerd |
| Registraties en planning | Onafhankelijke doelen, tijden, hifz-datums, check-in, statistieken, agenda | Geïmplementeerd en geïntegreerd |
| Community en account | Dashboard, rechten, uitnodigingen, lange posts, notificatiestatus, registratie | Geïmplementeerd en geïntegreerd |
| Audio | Reciteurwissel, filters, media-instellingen, miniplayer en herhaalmodi | Geïmplementeerd en geïntegreerd |
| Uiterlijk en taal | Thema's, hifz-kleurinstelling, appbrede RTL, introductie/herstel | Geïmplementeerd en geïntegreerd |

De hoofdagent verzorgt bevestigde lokale opslag, notities, gedeelde modellen/navigatie, integratie, onafhankelijke review en oplevering. Geen gelijktijdige schrijvers aan dezelfde module zonder expliciete afstemming.

## Uitgangspunten

- Bestaande broninhoud, importcontracten en gebruikersgegevens blijven behouden.
- Eén Mushaf-ingang, selectietoggle, fullscreen, vrije pan/zoom en het omkeerbare paginavinkje blijven bestaan.
- Nieuwe bediening gebruikt de bestaande visuele componenten en volledige NL/EN/AR-zinnen. Gebruikersinhoud wordt letterlijk weergegeven.
- Externe diensten blijven achter services; geen nieuwe geheime sleutels in broncode of appbundels.
- Een broncodefix is pas afgerond na passende regressiecontrole. Toestel-, provider- en serverbewijs worden afzonderlijk vermeld.

## Verificatie en aflevering

1. Reproducties omzetten naar regressietests op de werkelijke codepaden.
2. Gezamenlijke TypeScript-, lint-, test- en formattingcontrole.
3. Android/iOS/web-bundels, Android-build en lokaal installeren zonder appdata te wissen.
4. Gerichte native controle van lezer, kaarten, notities, audio en formulieren; lokale community-integratie waar de backend beschikbaar is.
5. Per auditbevinding vastleggen wat is aangepast, getest en wat alleen een externe configuratie/toesteltest nog kan aantonen.

Live wijzigingen aan gehoste diensten en verzending van berichten of push naar echte gebruikers vallen niet onder deze lokale herstelronde. De benodigde servercode/configuratie en reproduceerbare lokale controles worden wel meegenomen.
