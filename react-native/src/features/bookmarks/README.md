# Bladwijzers

`screens/BookmarksScreen.tsx` toont alle bewaarde aya’s en mushafpagina’s uit de actuele appstate. `bookmarks.ts` bouwt en sorteert de lijst zonder de bestaande opslagformaten te wijzigen. Een paginabladwijzer behoudt zijn eigen uitgave en pagina; een ayabladwijzer opent de exacte soera/aya. De lezer opent fullscreen.

Quranvolgorde en soeranaam sorteren beide soorten samen. ‘Recent per type’ sorteert aya’s op de bestaande datum en pagina’s op toevoegvolgorde. Paginabladwijzers hebben geen datum; de interface verzint die niet. `bookmarkCopy.ts` bevat volledige Nederlandse, Engelse en Arabische zinnen.
