package com.Ameender.qurantracker.ui

internal fun checklistText(language: String, key: String): String {
    val row = when (key) {
        "title" -> listOf("Tahajjud", "Tahajjud", "التهجد", "Tahajjud")
        "manage" -> listOf("Beheren", "Manage", "إدارة", "Gérer")
        "clearPosition" -> listOf("Leespositie wissen", "Clear reading position", "مسح موضع القراءة", "Effacer la position de lecture")
        "clearChecklist" -> listOf("Checklist leegmaken", "Clear checklist", "مسح قائمة المتابعة", "Vider la liste")
        "positionWarning" -> listOf("Je opgeslagen leespositie wordt gewist. Alle vinkjes blijven behouden.", "Your saved reading position will be cleared. All checkmarks will be kept.", "سيُمسح موضع القراءة المحفوظ. ستبقى جميع علامات التحديد.", "Votre position de lecture sera effacée. Toutes les coches seront conservées.")
        "checklistWarning" -> listOf("Alle vinkjes worden verwijderd. Je opgeslagen leespositie blijft behouden.", "All checkmarks will be removed. Your saved reading position will be kept.", "ستُحذف جميع علامات التحديد. سيبقى موضع القراءة المحفوظ.", "Toutes les coches seront supprimées. Votre position de lecture sera conservée.")
        "clear" -> listOf("Wissen", "Clear", "مسح", "Effacer")
        "cancel" -> listOf("Annuleren", "Cancel", "إلغاء", "Annuler")
        "here" -> listOf("Hier ben je gebleven", "Where you left off", "حيث توقفت", "Où vous en étiez")
        "empty" -> listOf("Nog geen leespositie bewaard", "No reading position saved yet", "لم يُحفظ موضع القراءة بعد", "Aucune position enregistrée")
        "next" -> listOf("Hierna", "Next", "التالي", "Ensuite")
        "continue" -> listOf("Verder lezen", "Continue reading", "متابعة القراءة", "Continuer la lecture")
        "end" -> listOf("Einde van de Koran bereikt", "End of the Quran reached", "وصلت إلى نهاية القرآن", "Fin du Coran atteinte")
        "help" -> listOf("Vinkjes zijn je checklist. Met ‘Hier gestopt’ bewaar je apart waar je verder wilt gaan.", "Checkmarks track completed parts. Use ‘Stopped here’ to save your reading position separately.", "علامات الصح للأجزاء المكتملة. استخدم «توقفت هنا» لحفظ موضع القراءة بشكل مستقل.", "Les coches indiquent les parties terminées. « Arrêt ici » enregistre séparément votre position.")
        "stop" -> listOf("Hier gestopt", "Stopped here", "توقفت هنا", "Arrêt ici")
        "saved" -> listOf("Leespositie bewaard", "Reading position saved", "تم حفظ موضع القراءة", "Position enregistrée")
        "check" -> listOf("Als gelezen markeren", "Mark as read", "تحديد كمقروء", "Marquer comme lu")
        "undo" -> listOf("Vinkje verwijderen", "Uncheck", "إلغاء التحديد", "Décocher")
        "open" -> listOf("Openen", "Open", "فتح", "Ouvrir")
        "hizb" -> listOf("Ḥizb", "Ḥizb", "حزب", "Ḥizb")
        "rub" -> listOf("Rubʿ", "Rubʿ", "ربع", "Rubʿ")
        "juz" -> listOf("Juzʾ", "Juzʾ", "جزء", "Juzʾ")
        "surah" -> listOf("Soera", "Surah", "سورة", "Sourate")
        "error" -> listOf("Opslaan mislukt. Probeer opnieuw.", "Could not save. Please retry.", "تعذر الحفظ. حاول مجددًا.", "Échec de l’enregistrement. Réessayez.")
        else -> error("Unknown checklist text: $key")
    }
    return row[when(language) { "en" -> 1; "ar" -> 2; "fr" -> 3; else -> 0 }]
}
