# Gebundelde inhoud

`quran.ts`, `hizb.ts`, `study.ts` en `translations.ts` ontsluiten gebundelde brongegevens. `generated` bevat gegenereerde gegevens en `provenance.json`; `audio` en `study-details` bevatten lokale assets. Wijzig broninhoud niet voor een UI-refactor. Genereer waar nodig met `npm run content:generate` en behoud bronvermelding en licenties.

De aanvullende `scripts/prepare-reader-assets.ts` verpakt de 114 oorspronkelijke Kotlin-soerakaarten en alle 604 Warsh-Unicodepagina’s; `generated/warsh-page-assets.ts` verwijst naar lazy `.quran`-assets onder `assets/warsh-unicode`. Bronhashes en rechten staan bij de assets. Codepoints worden niet genormaliseerd of vervangen; de Warsh-provider blijft onderscheiden van de oorspronkelijke scan en van Hafs. De QAC/Lane-databases staan onder `assets/lexicon` en worden gelezen via `services/lexicon`, buiten gebruikersopslag.
