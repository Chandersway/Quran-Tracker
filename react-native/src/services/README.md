# Services

Deze mappen verzorgen I/O en platformintegraties: `backend`, `auth`, `profiles`, `groups`, `audio`, `mushaf`, `notifications`, `planning`, `storage`, `lexicon` en `study`. Ze bevatten geen schermen en importeren geen feature-UI. Regels zonder I/O horen in `domain`.

`backend/backend.ts` bouwt de huidige Supabase-adapter en stelt onder meer auth-, profiel- en groepsoperaties samen. Dit garandeert niet dat een andere backend zonder adapterwerk kan worden aangesloten.
