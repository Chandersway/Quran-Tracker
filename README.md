# Quran-Tracker

De cross-platform app staat in [`react-native/`](react-native/README.md). Voer daar op Windows `npm ci` en `npm run android:local` uit om de ontwikkelapp en emulator te starten. Alleen de simulator openen kan met `npm run android:emulator`.

De [React Native README](react-native/README.md) beschrijft wat je op een andere pc moet installeren: Node/npm, Java, Android Studio, de SDK-onderdelen en een emulator. De [ontwikkelhandleiding](react-native/docs/LOCAL_DEVELOPMENT.md) behandelt SDK-instellingen, Fast Refresh, DevTools en foutdiagnose.

- [Gebruikershandleiding](react-native/docs/GEBRUIKERSHANDLEIDING.md): alle functies gebruiken en je gegevens bewaren.
- [Technische appgids](react-native/docs/TECHNISCHE_APPGIDS.md): schermen, instellingen, regels en volledige bronindex.
- [Live chat instellen](react-native/docs/LIVE_CHAT_SETUP.md): exacte code, Supabase-configuratie, SQL, typing en verificatie.
- [APK, iOS en stores](react-native/docs/RELEASE_HANDLEIDING.md): `npm run build:apk`, EAS-AAB/IPA en publicatie stap voor stap.

De oorspronkelijke Kotlin-code blijft naast de React Native-app beschikbaar. De nieuwe migratie-/controlebranch wordt afzonderlijk aangeboden; een branch pushen publiceert de app niet in de stores en wijzigt geen Supabase-productieconfiguratie.
