# Studiebronnen

`studyProviders.ts` definieert de aanbieders voor studiebronnen. Presentatie staat in `features/study`; gebundelde studiegegevens en hun herkomst staan in `content`.

`studyRequest.ts` beheert bron-/referentiesleutels, betrouwbare vaste verwijzingen, beschikbaarheid en annulering/generatiecontrole. Het verwerpt late successen én fouten nadat de gebruiker van bron of referentie verandert, ook als een transport het AbortSignal negeert. Een ontbrekende Asbāb-verwijzing blijft ontbreken. Quranpedia-boektekst, auteur en deel-/paginametadata blijven brongegevens; de service genereert geen vervangende uitleg.
