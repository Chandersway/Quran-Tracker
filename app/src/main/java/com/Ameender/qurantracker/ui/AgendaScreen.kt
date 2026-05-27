package com.Ameender.qurantracker.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.data.ALL_HIZB
import com.Ameender.qurantracker.data.PlanningItem
import com.Ameender.qurantracker.viewmodel.PlanningViewModel
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ReminderTimeDialog(
    initialHour: Int,
    initialMinute: Int,
    onSave: (Int, Int) -> Unit,
    onClear: () -> Unit,
    onDismiss: () -> Unit
) {
    var hour by remember { mutableIntStateOf(initialHour.coerceIn(0, 23)) }
    var minute by remember { mutableIntStateOf((initialMinute / 5 * 5).coerceIn(0, 55)) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = LabelGold,
        title = { Text("Help mij herinneren") },
        text = {
            Column {
                Text("Wanneer wil je lezen?", fontSize = 12.sp, color = MutedGold)
                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ReminderQuickChip("Nu") {
                        val cal = Calendar.getInstance()
                        hour = cal.get(Calendar.HOUR_OF_DAY)
                        minute = (cal.get(Calendar.MINUTE) / 5 * 5).coerceIn(0, 55)
                    }
                    ReminderQuickChip("+30 min") {
                        val cal = Calendar.getInstance().apply { add(Calendar.MINUTE, 30) }
                        hour = cal.get(Calendar.HOUR_OF_DAY)
                        minute = (cal.get(Calendar.MINUTE) / 5 * 5).coerceIn(0, 55)
                    }
                    ReminderQuickChip("Vanavond") {
                        hour = 20
                        minute = 0
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TimeStepper("Uur", hour, 0, 23, onChange = { hour = it }, modifier = Modifier.weight(1f))
                    Text(":", fontSize = 20.sp, color = Gold, fontWeight = FontWeight.Bold)
                    TimeStepper("Min", minute, 0, 55, step = 5, onChange = { minute = it }, modifier = Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Gekozen tijd: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}",
                    fontSize = 12.sp,
                    color = GoldLight,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(hour, minute) }) {
                Text("Opslaan", color = Gold)
            }
        },
        dismissButton = {
            Row {
                TextButton(onClick = onClear) {
                    Text("Wissen", color = DeleteRed)
                }
                TextButton(onClick = onDismiss) {
                    Text("Annuleren", color = MutedGold)
                }
            }
        }
    )
}

@Composable
fun ReminderQuickChip(label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(AppShape.control))
            .background(DeepNavy)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, fontSize = 11.sp, color = GoldLight, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun TimeStepper(
    label: String,
    value: Int,
    min: Int,
    max: Int,
    step: Int = 1,
    onChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Text(label, fontSize = 10.sp, color = MutedGold)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control)),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clickable { onChange((value - step).coerceAtLeast(min)) },
                contentAlignment = Alignment.Center
            ) { Text("-", fontSize = 14.sp, color = GoldLight) }
            Text(
                value.toString().padStart(2, '0'),
                fontSize = 15.sp,
                color = GoldLight,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f)
            )
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clickable { onChange((value + step).coerceAtMost(max)) },
                contentAlignment = Alignment.Center
            ) { Text("+", fontSize = 14.sp, color = GoldLight) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgendaScreen(
    planningViewModel: PlanningViewModel = viewModel(),
    onBack: () -> Unit = {}
) {
    val allItems      by planningViewModel.allItems.collectAsState()
    val datesWithItems by planningViewModel.datesWithItems.collectAsState()

    val sdf        = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val displaySdf = SimpleDateFormat("EEEE d MMMM", Locale("nl"))
    val today      = sdf.format(Date())

    var selectedDate   by remember { mutableStateOf(today) }
    var showAddSheet   by remember { mutableStateOf(false) }
    var currentMonth   by remember { mutableStateOf(Calendar.getInstance()) }

    // Items voor geselecteerde dag
    val selectedItems = allItems.filter { it.date == selectedDate }

    if (showAddSheet) {
        AddPlanningItemSheet(
            selectedDate    = selectedDate,
            planningViewModel = planningViewModel,
            onDismiss       = { showAddSheet = false }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
    ) {
        // ── Header ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MidNavy)
                .padding(horizontal = AppSpacing.screen, vertical = AppSpacing.list),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // ← Terug knop
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Terug", tint = Gold)
            }

            Text("📅 Agenda", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = GoldLight)

            // + Toevoegen knop
            IconButton(
                onClick = { showAddSheet = true },
                modifier = Modifier
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(StrongGoldSurface)
                    .border(1.dp, Gold, RoundedCornerShape(AppShape.control))
            ) {
                Icon(Icons.Default.Add, contentDescription = "Toevoegen", tint = Gold)
            }
        }
        // ── Kalender ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(MidNavy)
                .padding(horizontal = AppSpacing.screen, vertical = AppShape.control)
        ) {
            // Maand navigatie
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {
                    currentMonth = (currentMonth.clone() as Calendar).apply {
                        add(Calendar.MONTH, -1)
                    }
                }) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Vorige", tint = Gold)
                }

                val maandSdf = SimpleDateFormat("MMMM yyyy", Locale("nl"))
                Text(
                    maandSdf.format(currentMonth.time).replaceFirstChar { it.uppercase() },
                    fontSize = 15.sp, fontWeight = FontWeight.Bold, color = GoldLight
                )

                IconButton(onClick = {
                    currentMonth = (currentMonth.clone() as Calendar).apply {
                        add(Calendar.MONTH, 1)
                    }
                }) {
                    Icon(Icons.Default.ChevronRight, contentDescription = "Volgende", tint = Gold)
                }
            }

            // Dag labels
            Row(modifier = Modifier.fillMaxWidth()) {
                listOf("Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo").forEach { dag ->
                    Text(
                        dag,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center,
                        fontSize = 11.sp,
                        color = DimGold
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Kalender grid
            val cal = (currentMonth.clone() as Calendar).apply {
                set(Calendar.DAY_OF_MONTH, 1)
            }
            val firstDayOfWeek = (cal.get(Calendar.DAY_OF_WEEK) + 5) % 7 // Ma=0
            val daysInMonth    = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
            val totalCells     = firstDayOfWeek + daysInMonth
            val rows           = (totalCells + 6) / 7

            repeat(rows) { row ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    repeat(7) { col ->
                        val dayIndex = row * 7 + col - firstDayOfWeek + 1
                        if (dayIndex < 1 || dayIndex > daysInMonth) {
                            Box(modifier = Modifier.weight(1f).aspectRatio(1f))
                        } else {
                            val dayCal = (currentMonth.clone() as Calendar).apply {
                                set(Calendar.DAY_OF_MONTH, dayIndex)
                            }
                            val dateStr    = sdf.format(dayCal.time)
                            val isToday    = dateStr == today
                            val isSelected = dateStr == selectedDate
                            val hasItems   = datesWithItems.contains(dateStr)

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .aspectRatio(1f)
                                    .padding(2.dp)
                                    .clip(RoundedCornerShape(AppShape.smallControl))
                                    .background(
                                        when {
                                            isSelected -> Gold
                                            isToday    -> MediumGoldSurface
                                            else       -> Color.Transparent
                                        }
                                    )
                                    .clickable { selectedDate = dateStr },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        "$dayIndex",
                                        fontSize = 13.sp,
                                        color = when {
                                            isSelected -> DarkNavy
                                            isToday    -> GoldLight
                                            else       -> SoftTextGold
                                        },
                                        fontWeight = if (isSelected || isToday) FontWeight.Bold else FontWeight.Normal
                                    )
                                    // Stipje als er items zijn
                                    if (hasItems) {
                                        Box(
                                            modifier = Modifier
                                                .size(4.dp)
                                                .clip(RoundedCornerShape(2.dp))
                                                .background(if (isSelected) DarkNavy else Gold)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ── Geselecteerde dag items ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = AppSpacing.screen, vertical = AppSpacing.list)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    try {
                        val d = sdf.parse(selectedDate)
                        displaySdf.format(d!!).replaceFirstChar { it.uppercase() }
                    } catch (e: Exception) { selectedDate },
                    fontSize = 14.sp,
                    color = Gold,
                    fontWeight = FontWeight.Medium
                )
                if (selectedDate == today) {
                    Text("Vandaag", fontSize = 11.sp, color = DoneGreen)
                }
            }
        }

        if (selectedItems.isEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("📭", fontSize = 32.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Niets gepland",
                    fontSize = 14.sp,
                    color = SoftTextGold,
                    textAlign = TextAlign.Center
                )
                Text(
                    "Tik op + om iets toe te voegen",
                    fontSize = 12.sp,
                    color = DimGold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedButton(
                    onClick = { showAddSheet = true },
                    shape  = RoundedCornerShape(AppShape.control),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Gold),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Gold)
                ) {
                    Text("+ Toevoegen")
                }
            }

        } else {
            LazyColumn(
                contentPadding = PaddingValues(horizontal = AppSpacing.screen),
                modifier = Modifier.fillMaxSize()
            ) {
                items(selectedItems, key = { it.id }) { item ->
                    PlanningItemCard(
                        item      = item,
                        onToggle  = { planningViewModel.toggleDone(item) },
                        onDelete  = { planningViewModel.deleteItem(item.id) },
                        onReminderChange = { hour, minute ->
                            planningViewModel.setReminder(item, hour, minute)
                        }
                    )
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

// ── Planning item kaart ────────────────────────────────────

@Composable
fun PlanningItemCard(
    item: PlanningItem,
    onToggle: () -> Unit,
    onDelete: () -> Unit,
    onReminderChange: (Int?, Int?) -> Unit
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showReminderDialog by remember { mutableStateOf(false) }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest  = { showDeleteConfirm = false },
            containerColor    = MidNavy,
            titleContentColor = GoldLight,
            textContentColor  = LabelGold,
            title = { Text("Verwijderen?") },
            text  = { Text("Wil je '${item.displayName}' verwijderen uit je planning?") },
            confirmButton = {
                TextButton(onClick = { onDelete(); showDeleteConfirm = false }) {
                    Text("Verwijderen", color = DeleteRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Annuleren", color = MutedGold)
                }
            }
        )
    }

    if (showReminderDialog) {
        ReminderTimeDialog(
            initialHour = item.reminderHour ?: 20,
            initialMinute = item.reminderMinute ?: 0,
            onSave = { hour, minute ->
                onReminderChange(hour, minute)
                showReminderDialog = false
            },
            onClear = {
                onReminderChange(null, null)
                showReminderDialog = false
            },
            onDismiss = { showReminderDialog = false }
        )
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = AppSpacing.itemVertical)
            .clip(RoundedCornerShape(AppShape.tile))
            .background(
                if (item.isDone) GoldSurface else MidNavy
            )
            .border(
                1.dp,
                if (item.isDone) Gold.copy(alpha = 0.4f) else BorderNavy,
                RoundedCornerShape(AppShape.tile)
            )
            .padding(AppSpacing.list),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Checkbox
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(AppShape.smallControl))
                .background(if (item.isDone) Gold else DeepNavy)
                .border(1.dp, if (item.isDone) Gold else ButtonBorderNavy, RoundedCornerShape(AppShape.smallControl))
                .clickable { onToggle() },
            contentAlignment = Alignment.Center
        ) {
            if (item.isDone) {
                Text("✓", fontSize = 14.sp, color = DarkNavy, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            // Type icoon + naam
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    when (item.type) {
                        "rub", "hizb" -> "📿"
                        "juz"         -> "📜"
                        "surah"       -> "📖"
                        "khatma"      -> "📅"
                        else          -> "📌"
                    },
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    item.displayName,
                    fontSize = 13.sp,
                    color = if (item.isDone) MutedGold else SoftTextGold,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (item.isDone)
                        androidx.compose.ui.text.style.TextDecoration.LineThrough
                    else null
                )
            }
            // Begin ayah
            if (item.arabicText.isNotEmpty()) {
                Text(
                    item.arabicText,
                    fontSize = 13.sp,
                    color = Gold.copy(alpha = if (item.isDone) 0.4f else 0.8f),
                    textAlign = TextAlign.End,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(AppShape.smallControl))
                    .background(if (item.reminderHour != null) TodayDoneSurface else DeepNavy)
                    .border(
                        1.dp,
                        if (item.reminderHour != null) DoneGreen else BorderNavy,
                        RoundedCornerShape(AppShape.smallControl)
                    )
                    .clickable { showReminderDialog = true }
                    .padding(horizontal = 9.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Notifications,
                    contentDescription = null,
                    tint = if (item.reminderHour != null) DoneGreen else MutedGold,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    if (item.reminderHour != null && item.reminderMinute != null) {
                        "Herinner mij ${item.reminderHour.toString().padStart(2, '0')}:${item.reminderMinute.toString().padStart(2, '0')}"
                    } else {
                        "Herinner mij"
                    },
                    fontSize = 11.sp,
                    color = if (item.reminderHour != null) DoneGreen else MutedGold,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Verwijder knop
        IconButton(onClick = { showDeleteConfirm = true }) {
            Icon(
                Icons.Default.Delete,
                contentDescription = "Verwijderen",
                tint = StrongDeleteSurface,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

// ── Bottom sheet: item toevoegen ──────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPlanningItemSheet(
    selectedDate: String,
    planningViewModel: PlanningViewModel,
    onDismiss: () -> Unit
) {
    var selectedType  by remember { mutableStateOf("rub") }
    var selectedHizb  by remember { mutableStateOf(1) }
    var selectedRub   by remember { mutableStateOf(1) }
    var selectedJuz   by remember { mutableStateOf(1) }
    var selectedSurah by remember { mutableStateOf(1) }
    var selectedSurahName by remember { mutableStateOf("Al-Fatihah") }
    var khatmaOpen by remember { mutableStateOf(false) }
    var khatmaDays by remember { mutableStateOf(30) }
    var khatmaSaved by remember { mutableStateOf(false) }

    val rubLabel = { n: Int -> when (n) { 1 -> "¼"; 2 -> "½"; 3 -> "¾"; else -> "1 (heel)" } }

    // Bereken display naam en arabic tekst
    val hizbInfo = ALL_HIZB.find { it.hizbNumber == selectedHizb }
    val displayName = when (selectedType) {
        "rub"   -> "Hizb $selectedHizb — ${rubLabel(selectedRub)}"
        "hizb"  -> "Hizb $selectedHizb"
        "juz"   -> "Juz $selectedJuz"
        "surah" -> selectedSurahName
        else    -> ""
    }
    val arabicText = when (selectedType) {
        "rub", "hizb" -> hizbInfo?.startText ?: ""
        else          -> ""
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor   = MidNavy,
        sheetState       = rememberModalBottomSheetState(skipPartiallyExpanded = false)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                "Item toevoegen",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = GoldLight,
                modifier = Modifier.padding(bottom = 4.dp)
            )

            // Geselecteerde datum tonen
            val displaySdf = SimpleDateFormat("EEEE d MMMM", Locale("nl"))
            val sdf        = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            Text(
                try {
                    displaySdf.format(sdf.parse(selectedDate)!!).replaceFirstChar { it.uppercase() }
                } catch (e: Exception) { selectedDate },
                fontSize = 13.sp, color = Gold,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            KhatmaPlannerBlock(
                days = khatmaDays,
                expanded = khatmaOpen,
                saved = khatmaSaved,
                onToggle = { khatmaOpen = !khatmaOpen },
                onDaysChange = {
                    khatmaDays = it
                    khatmaSaved = false
                },
                onCreate = {
                    planningViewModel.addKhatmaPlan(selectedDate, khatmaDays)
                    khatmaSaved = true
                }
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Type kiezen
            Text("Type", fontSize = 13.sp, color = MutedGold,
                modifier = Modifier.padding(bottom = 8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    "rub"   to "📿 Rub",
                    "hizb"  to "📿 Hizb",
                    "juz"   to "📜 Juz",
                    "surah" to "📖 Soera"
                ).forEach { (type, label) ->
                    val selected = selectedType == type
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(AppShape.control))
                            .background(if (selected) StrongGoldSurface else DeepNavy)
                            .border(1.dp, if (selected) Gold else BorderNavy, RoundedCornerShape(AppShape.control))
                            .clickable { selectedType = type }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(label, fontSize = 11.sp,
                            color = if (selected) GoldLight else DimGold,
                            textAlign = TextAlign.Center)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Subtype kiezen op basis van type
            when (selectedType) {
                "rub", "hizb" -> {
                    // Hizb nummer
                    Text("Hizb nummer", fontSize = 13.sp, color = MutedGold,
                        modifier = Modifier.padding(bottom = 8.dp))
                    NumberPicker(
                        value   = selectedHizb,
                        range   = 1..60,
                        onValueChange = { selectedHizb = it }
                    )

                    // Begin ayah preview
                    if (hizbInfo != null) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(AppShape.control))
                                .background(DeepNavy)
                                .border(1.dp, Gold.copy(alpha = 0.3f), RoundedCornerShape(AppShape.control))
                                .padding(AppSpacing.list)
                        ) {
                            Column {
                                Text(
                                    "${hizbInfo.surahArabic} ${hizbInfo.surahNumber}:${hizbInfo.ayahNumber}",
                                    fontSize = 12.sp, color = Gold.copy(alpha = 0.7f)
                                )
                                Text(
                                    hizbInfo.startText,
                                    fontSize = 15.sp, color = GoldLight,
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                                )
                            }
                        }
                    }

                    // Rub kwart (alleen voor type "rub")
                    if (selectedType == "rub") {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Kwart", fontSize = 13.sp, color = MutedGold,
                            modifier = Modifier.padding(bottom = 8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            (1..4).forEach { rub ->
                                val selected = selectedRub == rub
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(AppShape.control))
                                        .background(if (selected) StrongGoldSurface else DeepNavy)
                                        .border(1.dp, if (selected) Gold else BorderNavy, RoundedCornerShape(AppShape.control))
                                        .clickable { selectedRub = rub }
                                        .padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(rubLabel(rub), fontSize = 14.sp,
                                        color = if (selected) GoldLight else DimGold,
                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
                                }
                            }
                        }
                    }
                }

                "juz" -> {
                    Text("Juz nummer", fontSize = 13.sp, color = MutedGold,
                        modifier = Modifier.padding(bottom = 8.dp))
                    NumberPicker(
                        value   = selectedJuz,
                        range   = 1..30,
                        onValueChange = { selectedJuz = it }
                    )
                }

                "surah" -> {
                    Text("Soera", fontSize = 13.sp, color = MutedGold,
                        modifier = Modifier.padding(bottom = 8.dp))
                    NumberPicker(
                        value   = selectedSurah,
                        range   = 1..114,
                        onValueChange = { id ->
                            selectedSurah     = id
                            selectedSurahName = ALL_SURAHS.find { it.id == id }?.name ?: "Soera $id"
                        }
                    )
                    val surah = ALL_SURAHS.find { it.id == selectedSurah }
                    if (surah != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(AppShape.control))
                                .background(DeepNavy)
                                .border(1.dp, Gold.copy(alpha = 0.3f), RoundedCornerShape(AppShape.control))
                                .padding(AppSpacing.list),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(surah.name, fontSize = 14.sp, color = GoldLight)
                            Text(surah.arabic, fontSize = 16.sp, color = Gold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Preview van wat er opgeslagen wordt
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(AppShape.control))
                    .background(SubtleGoldSurface)
                    .border(1.dp, Gold.copy(alpha = 0.2f), RoundedCornerShape(AppShape.control))
                    .padding(AppSpacing.list)
            ) {
                Column {
                    Text("Wordt opgeslagen als:", fontSize = 11.sp, color = DimGold,
                        modifier = Modifier.padding(bottom = 4.dp))
                    Text(displayName, fontSize = 14.sp, color = GoldLight, fontWeight = FontWeight.Medium)
                    if (arabicText.isNotEmpty()) {
                        Text(arabicText, fontSize = 13.sp, color = Gold,
                            textAlign = TextAlign.End,
                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Opslaan knop
            Button(
                onClick = {
                    val refId = when (selectedType) {
                        "rub", "hizb" -> selectedHizb
                        "juz"         -> selectedJuz
                        "surah"       -> selectedSurah
                        else          -> 1
                    }
                    val sub = if (selectedType == "rub") selectedRub else 0
                    planningViewModel.addItem(
                        date        = selectedDate,
                        type        = selectedType,
                        referenceId = refId,
                        subId       = sub,
                        displayName = displayName,
                        arabicText  = arabicText
                    )
                    onDismiss()
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape    = RoundedCornerShape(AppShape.tile),
                colors   = ButtonDefaults.buttonColors(containerColor = Gold)
            ) {
                Text("➕ Toevoegen aan planning", fontSize = 14.sp,
                    color = DarkNavy, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

// ── Nummer picker component ────────────────────────────────

@Composable
fun KhatmaPlannerBlock(
    days: Int,
    expanded: Boolean,
    saved: Boolean,
    onToggle: () -> Unit,
    onDaysChange: (Int) -> Unit,
    onCreate: () -> Unit
) {
    var previewOpen by remember { mutableStateOf(false) }
    val previewLines = remember(days) { khatmaPreview(days) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(AppShape.tile))
            .background(SubtleGoldSurface)
            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile))
            .padding(AppSpacing.list)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onToggle),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.DateRange, contentDescription = null, tint = Gold, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("Khatma-plan maken", fontSize = 14.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                Text("Verdeel Juz 1-30 automatisch over dagen", fontSize = 11.sp, color = DimGold)
            }
            Icon(
                imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = ChevronNavy
            )
        }

        AnimatedVisibility(visible = expanded) {
            Column(modifier = Modifier.padding(top = AppSpacing.list)) {
                Text("Aantal dagen", fontSize = 12.sp, color = MutedGold, modifier = Modifier.padding(bottom = 8.dp))
                NumberPicker(value = days, range = 1..240, onValueChange = onDaysChange)

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(AppShape.control))
                        .background(DeepNavy)
                        .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                        .clickable { previewOpen = !previewOpen }
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Wat ga ik lezen?", fontSize = 12.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                        Text("${previewLines.size} dagen verdeeld over de hele khatma", fontSize = 10.sp, color = MutedGold)
                    }
                    Icon(
                        imageVector = if (previewOpen) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = null,
                        tint = ChevronNavy
                    )
                }

                AnimatedVisibility(visible = previewOpen) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 260.dp)
                            .verticalScroll(rememberScrollState())
                            .padding(top = 8.dp)
                    ) {
                        previewLines.forEach { line ->
                            Text(line, fontSize = 11.sp, color = SoftTextGold, modifier = Modifier.padding(bottom = 4.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onCreate,
                    modifier = Modifier.fillMaxWidth().height(AgendaKhatmaStyle.plannerButtonHeight),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = if (saved) DoneGreen else Gold)
                ) {
                    Text(
                        if (saved) "Khatma-plan toegevoegd" else "Maak khatma-plan",
                        fontSize = 13.sp,
                        color = DarkNavy,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

fun khatmaPreview(days: Int): List<String> {
    val safeDays = days.coerceIn(1, 240)
    return (0 until safeDays).map { index ->
        val day = index + 1
        val start = ((index * 240) / safeDays) + 1
        val end = (((index + 1) * 240) / safeDays).coerceAtLeast(start)
        "Dag $day: ${khatmaPartRangeLabel(start, end)}"
    }
}

fun khatmaPartRangeLabel(startPart: Int, endPart: Int): String {
    val safeStart = startPart.coerceIn(1, 240)
    val safeEnd = endPart.coerceIn(safeStart, 240)
    val startJuz = ((safeStart - 1) / 8) + 1
    val endJuz = ((safeEnd - 1) / 8) + 1
    val startRubInJuz = ((safeStart - 1) % 8) + 1
    val endRubInJuz = ((safeEnd - 1) % 8) + 1
    if (startRubInJuz == 1 && endRubInJuz == 8) {
        return if (startJuz == endJuz) "Juz $startJuz" else "Juz $startJuz-$endJuz"
    }

    val startHizb = ((safeStart - 1) / 4) + 1
    val endHizb = ((safeEnd - 1) / 4) + 1
    val startRub = ((safeStart - 1) % 4) + 1
    val endRub = ((safeEnd - 1) % 4) + 1
    return when {
        safeStart == safeEnd -> "Hizb $startHizb Rub $startRub"
        startHizb == endHizb -> "Hizb $startHizb Rub $startRub-$endRub"
        else -> "Hizb $startHizb Rub $startRub t/m Hizb $endHizb Rub $endRub"
    }
}

@Composable
fun NumberPicker(value: Int, range: IntRange, onValueChange: (Int) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable { if (value > range.first) onValueChange(value - 1) },
            contentAlignment = Alignment.Center
        ) { Text("−", fontSize = 20.sp, color = GoldLight) }

        Box(
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, Gold.copy(alpha = 0.4f), RoundedCornerShape(AppShape.control))
                .padding(vertical = 12.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "$value",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = GoldLight,
                textAlign = TextAlign.Center
            )
        }

        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                .clickable { if (value < range.last) onValueChange(value + 1) },
            contentAlignment = Alignment.Center
        ) { Text("+", fontSize = 20.sp, color = GoldLight) }
    }
}
