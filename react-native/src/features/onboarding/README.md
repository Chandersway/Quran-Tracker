# Introductie

`screens/OnboardingScreen.tsx` opent `components/OnboardingFlow.tsx`, dat ook vanuit instellingen wordt gebruikt. Gedeelde onboardingregels staan in `domain/onboarding.ts`; voorkeuren worden via de gedeelde store bewaard.

De eerste introductie bewaart taal, stap en voltooiing. Replay opent direct, gebruikt eigen stapstatus en wijzigt geen opgeslagen voorkeuren of voortgang. De zes oefenvoorbeelden behouden hun lokale demonstratiestatus. De introductieroot zet de geselecteerde taalrichting ook wanneer replay in een native modal staat.

`state/persistence/importedPresentation.ts` activeert na een nieuwe succesvolle Android-import de bewaarde presentatievoorkeuren. Een oudere installatie met voorkeuren maar zonder stageflag geldt als bestaande gebruiker; expliciete `LANGUAGE`/`INTRO_PENDING`-stadia blijven onafgerond. De oorspronkelijke importer en bron-snapshot veranderen niet. Bestaande RN-opslag doorloopt dit importpad niet opnieuw, zodat latere gebruikerskeuzen blijven staan.
