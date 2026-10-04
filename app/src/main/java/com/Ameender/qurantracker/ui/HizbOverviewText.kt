package com.Ameender.qurantracker.ui

internal fun hizbText(language: String, key: String): String {
    val values = when(key) {
        "chooseMultiple" -> listOf("Meerdere kiezen", "Select multiple", "اختيار عدة أحزاب", "Choisir plusieurs")
        "hizb" -> listOf("Hizb", "Hizb", "حزب", "Hizb")
        "title" -> listOf("Jouw Hizb-overzicht", "Your Hizb overview", "ملخص الأحزاب", "Vos lectures par hizb")
        "choose" -> listOf("Kies één of meerdere", "Choose one or more", "اختر حزبًا أو أكثر", "Choisir un ou plusieurs")
        "selector" -> listOf("Kies Ahzāb", "Choose Ahzāb", "اختر الأحزاب", "Choisir les ahzāb")
        "selected" -> listOf("geselecteerd", "selected", "محدد", "sélectionnés")
        "done" -> listOf("Gereed", "Done", "تم", "Terminé")
        "Week" -> listOf("Week", "Week", "أسبوع", "Semaine")
        "Month" -> listOf("Maand", "Month", "شهر", "Mois")
        "Year" -> listOf("Jaar", "Year", "سنة", "Année")
        "Custom" -> listOf("Aangepast", "Custom", "مخصص", "Personnalisé")
        "from" -> listOf("Van", "From", "من", "Du")
        "through" -> listOf("Tot en met", "Through", "إلى", "Au")
        "invalid" -> listOf("Kies een einddatum op of na de begindatum, niet in de toekomst.", "Choose an end date on or after the start, not in the future.", "اختر نهاية لا تسبق البداية ولا تقع في المستقبل.", "La fin doit suivre le début et ne pas être dans le futur.")
        "empty" -> listOf("Nog geen Hizb-check-ins in deze periode.", "No Hizb check-ins in this period yet.", "لا توجد تسجيلات أحزاب في هذه الفترة.", "Aucun hizb enregistré sur cette période.")
        "error" -> listOf("Opslaan mislukt. Probeer opnieuw.", "Could not save. Try again.", "تعذر الحفظ. حاول مجددًا.", "Échec de l’enregistrement. Réessayez.")
        "loadError" -> listOf("Overzicht laden mislukt.", "Could not load overview.", "تعذر تحميل الملخص.", "Impossible de charger le résumé.")
        "retry" -> listOf("Opnieuw proberen", "Retry", "إعادة المحاولة", "Réessayer")
        "expand" -> listOf("Bekijk volledig", "Expand", "توسيع العرض", "Agrandir")
        "collapse" -> listOf("Verkleinen", "Collapse", "تصغير", "Réduire")
        "count" -> listOf("keer ingecheckt", "check-ins", "تسجيلات", "enregistrements")
        "hint" -> listOf("Swipe voor Hizb 1–60. Tik voor details. Alleen volledige Hizb-check-ins tellen mee.", "Swipe through Hizb 1–60. Tap for details. Only full Hizb check-ins are counted.", "اسحب لعرض الأحزاب 1–60 واضغط للتفاصيل. تُحسب تسجيلات الحزب الكامل فقط.", "Balayez les hizb 1–60. Touchez pour les détails. Seuls les hizb complets sont comptés.")
        else -> listOf(key, key, key, key)
    }
    return values[when(language) { "en" -> 1; "ar" -> 2; "fr" -> 3; else -> 0 }]
}
