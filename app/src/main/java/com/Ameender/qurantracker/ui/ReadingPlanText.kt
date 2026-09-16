package com.Ameender.qurantracker.ui

internal fun readingPlanText(language: String, key: String): String {
    val values = when (key) {
        "Mijn leesplan" -> listOf("My reading plan", "خطة قراءتي", "Mon programme de lecture")
        "Doel, planning en voortgang" -> listOf("Goal, schedule and progress", "الهدف والجدول والتقدم", "Objectif, calendrier et progression")
        "Stel je eigen leesdoel in" -> listOf("Set your own reading goal", "حدّد هدفك للقراءة", "Définissez votre objectif de lecture")
        "Plan instellen →" -> listOf("Set up your plan →", "إعداد الخطة ←", "Configurer le programme →")
        "Bekijken en aanpassen →" -> listOf("View and edit →", "عرض وتعديل ←", "Consulter et modifier →")
        "Een leesplan op jouw tempo" -> listOf("A reading plan at your pace", "خطة قراءة تناسب وتيرتك", "Un programme à votre rythme")
        "Kies hoeveel je wilt lezen. Welke gedeelten je leest bepaal je zelf; herhaling telt mee. Dit plan staat los van je dagelijkse doelen." -> listOf("Choose how much you want to read. You decide which passages to read, and rereading counts too. This plan is separate from your daily goals.", "حدّد مقدار ما تريد قراءته، واختر المقاطع بنفسك؛ وتُحتسب إعادة القراءة أيضًا. هذه الخطة مستقلة عن أهدافك اليومية.", "Choisissez la quantité à lire et les passages qui vous conviennent. Les relectures comptent aussi. Ce programme est indépendant de vos objectifs quotidiens.")
        "Voortgang aanpassen" -> listOf("Adjust progress", "تعديل التقدم", "Ajuster la progression")
        "Je doel" -> listOf("Your goal", "هدفك", "Votre objectif")
        "Totaal te lezen" -> listOf("Total reading target", "إجمالي الكمية المستهدفة", "Quantité totale à lire")
        "Planning" -> listOf("Schedule", "الجدول الزمني", "Calendrier")
        "Een einddatum is optioneel. Zonder datum lees je op je eigen tempo." -> listOf("A finish date is optional. Without one, you can read at your own pace.", "تحديد موعد للإتمام اختياري. يمكنك القراءة بوتيرتك الخاصة دون موعد محدد.", "La date de fin est facultative. Sans date, vous lisez à votre rythme.")
        "Einddatum kiezen" -> listOf("Choose a finish date", "اختيار موعد الإتمام", "Choisir une date de fin")
        "Zonder einddatum" -> listOf("Remove finish date", "إلغاء موعد الإتمام", "Supprimer la date de fin")
        "Deze einddatum is verstreken. Kies een nieuwe datum of lees zonder einddatum." -> listOf("This finish date has passed. Choose a new date or continue without a deadline.", "انقضى موعد الإتمام. اختر موعدًا جديدًا أو تابع دون موعد محدد.", "Cette date est passée. Choisissez une nouvelle date ou continuez sans échéance.")
        "Leesplan opgeslagen" -> listOf("Reading plan saved", "تم حفظ خطة القراءة", "Programme enregistré")
        "Opslaan mislukt. Probeer opnieuw." -> listOf("Could not save. Please try again.", "تعذّر الحفظ. حاول مرة أخرى.", "Échec de l’enregistrement. Réessayez.")
        "Leesplan starten" -> listOf("Start reading plan", "بدء خطة القراءة", "Commencer le programme")
        "Wijzigingen opslaan" -> listOf("Save changes", "حفظ التغييرات", "Enregistrer les modifications")
        "Hoe wordt er geteld?" -> listOf("How progress is counted", "كيف يُحتسب التقدم؟", "Comment la progression est-elle calculée ?")
        "Leesregistraties vanaf het starten van dit plan tellen automatisch mee. Ook dezelfde hizb opnieuw lezen telt. Minuten tellen niet mee. Verschillende eenheden worden bij benadering omgerekend (60 hizb = 240 rubʿ = 30 juz = 604 pagina’s = 6236 ayat). Een correctie verandert alleen dit plan, niet je leesgeschiedenis of dagdoel." -> listOf("Reading logged after you start this plan counts automatically, including rereading the same hizb. Minutes do not count. Units are converted approximately (60 hizb = 240 rubʿ = 30 juz = 604 pages = 6,236 ayat). Adjustments affect only this plan, not your reading history or daily goal.", "تُحتسب تلقائيًا القراءات المسجلة منذ بدء الخطة، بما فيها إعادة قراءة الحزب نفسه. لا تُحتسب الدقائق. تُحوّل الوحدات تقريبيًا (٦٠ حزبًا = ٢٤٠ ربعًا = ٣٠ جزءًا = ٦٠٤ صفحات = ٦٢٣٦ آية). يؤثر التصحيح في هذه الخطة فقط، ولا يغيّر سجل القراءة أو الهدف اليومي.", "Les lectures enregistrées après le début du programme comptent automatiquement, y compris les relectures du même hizb. Les minutes ne comptent pas. La conversion est approximative (60 hizb = 240 rubʿ = 30 juz = 604 pages = 6 236 ayat). Les corrections concernent uniquement ce programme, sans modifier votre historique ni votre objectif quotidien.")
        "Gelezen totaal corrigeren" -> listOf("Adjust total read", "تصحيح إجمالي القراءة", "Corriger le total lu")
        "Vul je nieuwe totale voortgang in, inclusief wat al automatisch is geteld. Zo telt dezelfde lezing niet dubbel." -> listOf("Enter your updated total, including reading already counted automatically. This prevents counting the same reading twice.", "أدخل الإجمالي الصحيح، بما فيه ما احتُسب تلقائيًا، لتجنّب احتساب القراءة نفسها مرتين.", "Saisissez le nouveau total, en incluant les lectures déjà comptées automatiquement, pour éviter les doublons.")
        "Opslaan" -> listOf("Save", "حفظ", "Enregistrer")
        "Annuleren" -> listOf("Cancel", "إلغاء", "Annuler")
        "remaining" -> listOf("Remaining", "المتبقي", "Restant")
        "automatic" -> listOf("Automatically logged", "المسجل تلقائيًا", "Enregistré automatiquement")
        "adjustment" -> listOf("Adjustment", "التصحيح", "Correction")
        "pace" -> listOf("Suggested daily pace", "المقدار اليومي المقترح", "Rythme quotidien conseillé")
        else -> return key
    }
    return when(language) { "en" -> values[0]; "ar" -> values[1]; "fr" -> values[2]; else -> when(key) { "remaining" -> "Resterend"; "automatic" -> "Automatisch"; "adjustment" -> "Correctie"; "pace" -> "Richttempo per dag"; else -> key } }
}

internal fun normalizePlanNumber(value: String): String = buildString {
    value.forEach { char -> append(when { char.isDigit() -> ('0'.code + Character.digit(char, 10)).toChar(); char == ',' || char == '٫' -> '.'; else -> char }) }
}
