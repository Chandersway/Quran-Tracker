# Quran Tracker — iOS F01

Zelfstandige SwiftUI-shell, voorbereid op Windows. Nog niet met Xcode gebouwd.
De opgegeven iOS-versie is 16.2; het voorlopige deploymenttarget is iOS 16.0.

- `QuranTrackerShell/`: de twee Swift-bronbestanden voor de app.
- `Configuration/F01.xcconfig`: gedeelde voorgestelde targetinstellingen.
- `.gitignore`: lokale Xcode-status en buildoutputs.

Er staat bewust nog geen `.xcodeproj` in deze map. Maak het definitieve project
met de officiële iOS App-template op de Mac, volgens het
[F01-rapport en Mac-stappenplan](../docs/ios/F01-first-ios-build.md).

Het enige scherm bevat een welkom, een testknop en versie-/buildinformatie.
De knop verandert lokale `@State`; opnieuw tikken herstelt de begintoestand.
Na volledig afsluiten wordt de teststatus opnieuw ingesteld. Er is geen opslag
of netwerkfunctionaliteit. De interface is voor deze proef Nederlandstalig.

De Gradle-module `app/` blijft zelfstandig. Een map `shared/` en KMP-dependencies
zijn voor deze fase niet nodig.
