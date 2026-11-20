# Broncode

- [app](./app/README.md): opstarten, providers en navigatie.
- [features](./features/README.md): schermen en functiespecifieke onderdelen.
- [domain](./domain/README.md): regels en berekeningen; [content](./content/README.md): gebundelde brongegevens.
- [services](./services/README.md): opslag, netwerk en platformadapters; [state](./state/README.md): gedeelde toestand en persistentie.
- [shared](./shared/README.md): algemene interfacebouwstenen en thema; [i18n](./i18n/README.md): vertaalde teksten.
- [exporting](./exporting/README.md), [migration](./migration/README.md) en [config](./config/README.md): export, oude gegevens en runtimeconfiguratie.

Begin bij de betreffende feature; plaats herbruikbare regels in domain en I/O in services. Zie [architectuur](../docs/ARCHITECTURE.md) voor de actuele grenzen en beperkingen.
