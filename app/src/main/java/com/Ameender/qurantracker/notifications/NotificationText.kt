package com.Ameender.qurantracker.notifications

internal fun notificationText(language: String, key: String): String {
    val row = when (key) {
        "intro" -> listOf("Kies welke herinneringen je ontvangt en wanneer je rust wilt.", "Choose your reminders and when you want quiet time.", "اختر تذكيراتك والأوقات التي تفضل فيها الهدوء.", "Choisissez vos rappels et vos heures de calme.")
        "deviceAllowed" -> listOf("Toegestaan op je telefoon", "Allowed on your phone", "مسموح بها على هاتفك", "Autorisées sur votre téléphone")
        "systemHelp" -> listOf("Geluid, trillen en weergave op je vergrendelscherm beheer je via Android.", "Manage sound, vibration and lock-screen visibility in Android.", "تحكّم بالصوت والاهتزاز والعرض على شاشة القفل من إعدادات Android.", "Gérez le son, les vibrations et l’écran verrouillé dans Android.")
        "localOn" -> listOf("Herinneringen op dit apparaat", "Reminders on this device", "التذكيرات على هذا الجهاز", "Rappels sur cet appareil")
        "localHelp" -> listOf("Voor je dagdoel en agenda. Groepsvoorkeuren staan hieronder apart.", "For daily goals and planning. Group preferences are separate below.", "للهدف اليومي والجدول. تفضيلات المجموعات مستقلة أدناه.", "Pour vos objectifs et votre agenda. Les groupes sont réglés séparément.")
        "dailyHelp" -> listOf("Elke dag op jouw tijdstip, ook als je dagdoel al behaald is of niet is ingesteld.", "Every day at your chosen time, even if your goal is completed or not set.", "كل يوم في وقتك المحدد، سواء أكملت هدفك أم لم تحدد هدفًا.", "Chaque jour, même si votre objectif est atteint ou non défini.")
        "readingReminderBody" -> listOf("Tijd voor jouw leesmoment met de Quran.", "Time for your Quran reading moment.", "حان وقت وردك من القرآن الكريم.", "C’est le moment de lire le Coran.")
        "extraTime" -> listOf("Extra tijdstip", "Additional time", "الوقت الإضافي", "Heure supplémentaire")
        "comingSoon" -> listOf("Pushmeldingen nog niet beschikbaar", "Push notifications not yet available", "الإشعارات الفورية غير متاحة بعد", "Notifications push pas encore disponibles")
        "title" -> listOf("Notificaties", "Notifications", "الإشعارات", "Notifications")
        "general" -> listOf("Algemeen", "General", "عام", "Général")
        "all" -> listOf("Alle notificaties op dit apparaat", "All notifications on this device", "جميع الإشعارات على هذا الجهاز", "Toutes les notifications sur cet appareil")
        "quiet" -> listOf("Stille uren", "Quiet hours", "ساعات الهدوء", "Heures calmes")
        "from" -> listOf("Van", "From", "من", "De")
        "until" -> listOf("Tot", "Until", "إلى", "À")
        "daily" -> listOf("Vaste herinneringen", "Scheduled reminders", "تذكيرات مجدولة", "Rappels programmés")
        "reminder" -> listOf("Dagelijkse herinnering", "Daily reminder", "تذكير يومي", "Rappel quotidien")
        "extra" -> listOf("Tweede dagelijkse herinnering", "Second daily reminder", "تذكير يومي ثانٍ", "Deuxième rappel quotidien")
        "time" -> listOf("Tijd", "Time", "الوقت", "Heure")
        "chooseTime" -> listOf("Kiezen", "Choose", "اختيار", "Choisir")
        "hours" -> listOf("Uur (0–23)", "Hour (0–23)", "الساعة (0–23)", "Heure (0–23)")
        "minutesLabel" -> listOf("Minuut (0–59)", "Minute (0–59)", "الدقيقة (0–59)", "Minute (0–59)")
        "save" -> listOf("Opslaan", "Save", "حفظ", "Enregistrer")
        "cancel" -> listOf("Annuleren", "Cancel", "إلغاء", "Annuler")
        "remaining" -> listOf("Nog %1\$d %2\$s voor je dagelijkse doel.", "%1\$d %2\$s left to reach your daily goal.", "بقي %1\$d %2\$s لإكمال هدفك اليومي.", "Encore %1\$d %2\$s pour atteindre votre objectif quotidien.")
        "planning" -> listOf("Planning & agenda", "Planning & calendar", "التخطيط والجدول", "Planning et agenda")
        "planningOn" -> listOf("Herinneringen", "Reminders", "التذكيرات", "Rappels")
        "planningHelp" -> listOf("Stel de herinneringstijd in bij je agenda-item. Afgeronde en verwijderde items krijgen geen melding.", "Set the reminder time on your calendar item. Completed and deleted items do not trigger reminders.", "حدّد وقت التذكير في عنصر الجدول. لا تُرسل تذكيرات للعناصر المكتملة أو المحذوفة.", "Définissez l’heure du rappel dans l’agenda. Les éléments terminés ou supprimés ne déclenchent aucun rappel.")
        "groups" -> listOf("Groepen", "Groups", "المجموعات", "Groupes")
        "groupOn" -> listOf("Groepsnotificaties", "Group notifications", "إشعارات المجموعات", "Notifications de groupe")
        "mention" -> listOf("Mentions", "Mentions", "الإشارات إليك", "Mentions")
        "reaction" -> listOf("Reacties op eigen berichten", "Reactions to your posts", "التفاعلات مع منشوراتك", "Réactions à vos publications")
        "announcement" -> listOf("Aankondigingen", "Announcements", "الإعلانات", "Annonces")
        "invitation" -> listOf("Uitnodigingen", "Invitations", "الدعوات", "Invitations")
        "join_request" -> listOf("Toetredingsverzoeken", "Join requests", "طلبات الانضمام", "Demandes d’adhésion")
        "update" -> listOf("Belangrijke updates", "Important updates", "التحديثات المهمة", "Mises à jour importantes")
        "perGroup" -> listOf("Per groep", "Per group", "حسب المجموعة", "Par groupe")
        "allMode" -> listOf("Alles", "All", "الكل", "Tout")
        "important" -> listOf("Belangrijk", "Important", "المهم", "Important")
        "mentions" -> listOf("Alleen mentions", "Mentions only", "الإشارات فقط", "Mentions uniquement")
        "muted" -> listOf("Gedempt", "Muted", "مكتوم", "Muet")
        "blocked" -> listOf("Notificaties zijn uitgeschakeld op je apparaat.", "Notifications are disabled on your device.", "الإشعارات معطلة على جهازك.", "Les notifications sont désactivées sur votre appareil.")
        "system" -> listOf("Open systeeminstellingen", "Open system settings", "فتح إعدادات النظام", "Ouvrir les réglages système")
        "saving" -> listOf("Opslaan…", "Saving…", "جارٍ الحفظ…", "Enregistrement…")
        "saved" -> listOf("Opgeslagen", "Saved", "تم الحفظ", "Enregistré")
        "error" -> listOf("Opslaan mislukt. Je vorige instellingen blijven behouden.", "Could not save. Your previous settings have been kept.", "تعذّر الحفظ. تم الاحتفاظ بإعداداتك السابقة.", "Échec de l’enregistrement. Vos réglages précédents sont conservés.")
        "loadError" -> listOf("Groepsvoorkeuren konden niet worden geladen. Controleer je verbinding en de serverconfiguratie.", "Could not load group preferences. Check your connection and server configuration.", "تعذّر تحميل تفضيلات المجموعات. تحقّق من الاتصال وإعدادات الخادم.", "Impossible de charger les préférences de groupe. Vérifiez la connexion et la configuration du serveur.")
        "retry" -> listOf("Opnieuw proberen", "Retry", "إعادة المحاولة", "Réessayer")
        "login" -> listOf("Log in om groepsvoorkeuren te beheren.", "Sign in to manage group preferences.", "سجّل الدخول لإدارة تفضيلات المجموعات.", "Connectez-vous pour gérer les préférences de groupe.")
        "pushPending" -> listOf("Groepspush is nog niet aangesloten. Deze voorkeuren beheren toekomstige pushmeldingen; bestaande meldingen in groepen blijven beschikbaar.", "Group push delivery is not connected yet. These preferences control future push notifications; existing in-group notifications remain available.", "لم يتم توصيل خدمة إشعارات المجموعات بعد. تتحكم هذه التفضيلات في الإشعارات المستقبلية، وتظل الإشعارات الحالية داخل المجموعات متاحة.", "L’envoi push des groupes n’est pas encore connecté. Ces préférences concernent les futurs envois ; les notifications dans les groupes restent disponibles.")
        "timing" -> listOf("Herinneringen volgen de tijdzone van je apparaat. Android kan de bezorging vertragen. Stille uren stellen meldingen uit; gelijke begin- en eindtijd schakelen stille uren uit.", "Reminders follow your device’s time zone. Android may delay delivery. Quiet hours defer notifications; matching start and end times disable quiet hours.", "تتبع التذكيرات المنطقة الزمنية لجهازك، وقد يؤخر Android وصولها. تؤجل ساعات الهدوء الإشعارات؛ وتُعطّل إذا تطابق وقتا البداية والنهاية.", "Les rappels suivent le fuseau de votre appareil. Android peut retarder leur réception. Les heures calmes reportent les notifications ; des heures identiques les désactivent.")
        else -> listOf(key, key, key, key)
    }
    return row[when(language) { "en" -> 1; "ar" -> 2; "fr" -> 3; else -> 0 }]
}

internal fun notificationUnit(language: String, unit: String): String = when(unit) {
    "pages" -> when(language) { "en", "fr" -> "pages"; "ar" -> "صفحات"; else -> "pagina’s" }
    "minutes" -> when(language) { "en", "fr" -> "minutes"; "ar" -> "دقائق"; else -> "minuten" }
    "ayahs" -> if(language == "ar") "آيات" else "ayat"
    "hizb" -> if(language == "ar") "حزب" else "hizb"
    "juz" -> if(language == "ar") "جزء" else "juz"
    else -> if(language == "ar") "ربع حزب" else "rubʿ"
}
