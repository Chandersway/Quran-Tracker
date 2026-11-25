# Backend

`backend.ts` maakt de Supabase-client en stelt auth, profielen, groepen, notificaties en audio samen; `types.ts` bevat gedeelde servicecontracten. Behoud bestaande RPC-, tabel-, opslag- en foutcontracten bij wijzigingen. `config/runtime.ts` levert de optionele geconfigureerde instantie.

`notificationTargets.ts` resolveert een push-event via de geauthenticeerde `get_group_push_target_v2`-RPC. Alleen een ontbrekende RPC staat terugval naar de oude antwoordroute toe; autorisatie- en netwerkfouten worden niet verborgen. De server levert ook het vertrouwde type melding, zodat een payload niet zelf een minder strenge notificatiecategorie kan kiezen. Zie [groepspush instellen](../../../docs/GROUP_PUSH_SETUP.md).
