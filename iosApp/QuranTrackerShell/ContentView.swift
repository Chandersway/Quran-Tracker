import SwiftUI

struct ContentView: View {
    @State private var isTestConfirmed = false

    private var buildLabel: String {
        let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "—"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "—"
        return "Versie \(version) · build \(build)"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                Image(systemName: "book.closed.fill")
                    .font(.largeTitle)
                    .foregroundStyle(.teal)
                    .accessibilityHidden(true)

                VStack(spacing: 12) {
                    Text("Quran Tracker")
                        .font(.largeTitle.bold())
                        .accessibilityAddTraits(.isHeader)

                    Text("Welkom bij Quran Tracker")
                        .font(.title3)

                    Text("Een rustig moment voor jouw dagelijkse Quran-routine.")
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 20) {
                    Text(isTestConfirmed
                         ? "De knop werkt. Welkom op je iPhone!"
                         : "Tik op de knop om deze eerste versie te testen.")
                        .font(.body)
                        .accessibilityIdentifier("shell.status")

                    Button {
                        isTestConfirmed.toggle()
                    } label: {
                        Text(isTestConfirmed ? "Opnieuw beginnen" : "Test de knop")
                            .font(.headline)
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.teal)
                    .accessibilityIdentifier("shell.testButton")
                }
                .padding(24)
                .background(.background, in: RoundedRectangle(cornerRadius: 24))

                VStack(spacing: 6) {
                    Text("Eerste iOS-testversie")
                    Text(buildLabel)
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
            .multilineTextAlignment(.center)
            .frame(maxWidth: 480)
            .padding(24)
            .frame(maxWidth: .infinity)
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }
}
