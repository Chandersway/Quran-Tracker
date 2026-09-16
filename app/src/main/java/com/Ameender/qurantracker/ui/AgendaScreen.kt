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
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.data.ALL_HIZB
import com.Ameender.qurantracker.data.PlanningItem

import com.Ameender.qurantracker.viewmodel.PlanningViewModel

import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ReminderTimeDialog(
    initialHour: Int,
    initialMinute: Int,
    text: AppStrings,
    onSave: (Int, Int) -> Unit,
    onClear: () -> Unit,
    onDismiss: () -> Unit
) {
    var hour by remember { mutableIntStateOf(initialHour.coerceIn(0, 23)) }
    var minute by remember { mutableIntStateOf(initialMinute.coerceIn(0, 59)) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = LabelGold,
        title = { Text(text.t("agenda.reminderTitle")) },
        text = {
            Column {
                Text(text.t("agenda.reminderQuestion"), fontSize = 12.sp, color = SoftTextGold)
                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ReminderQuickChip(text.t("agenda.now")) {
                        val cal = Calendar.getInstance()
                        hour = cal.get(Calendar.HOUR_OF_DAY)
                        minute = cal.get(Calendar.MINUTE)
                    }
                    ReminderQuickChip(text.t("agenda.plusThirtyMinutes")) {
                        val cal = Calendar.getInstance().apply { add(Calendar.MINUTE, 30) }
                        hour = cal.get(Calendar.HOUR_OF_DAY)
                        minute = cal.get(Calendar.MINUTE)
                    }
                    ReminderQuickChip(text.t("agenda.tonight")) {
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
                    TimeStepper(text.t("agenda.hour"), hour, 0, 23, onChange = { hour = it }, modifier = Modifier.weight(1f))
                    Text(":", fontSize = 20.sp, color = Gold, fontWeight = FontWeight.Bold)
                    TimeStepper(text.t("agenda.minute"), minute, 0, 59, onChange = { minute = it }, modifier = Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text.t("agenda.selectedTime", "${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}"),
                    fontSize = 12.sp,
                    color = GoldLight,
                    fontWeight = FontWeight.Bold
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(hour, minute) }) {
                Text(text.t("common.save"), color = Gold)
            }
        },
        dismissButton = {
            Row {
                TextButton(onClick = onClear) {
                    Text(text.t("agenda.clear"), color = DeleteRed)
                }
                TextButton(onClick = onDismiss) {
                    Text(text.t("common.cancel"), color = SoftTextGold)
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
        Text(label, fontSize = 10.sp, color = SoftTextGold)
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
                    .size(AppComponentDefaults.minTouchTarget)
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
                    .size(AppComponentDefaults.minTouchTarget)
                    .clickable { onChange((value + step).coerceAtMost(max)) },
                contentAlignment = Alignment.Center
            ) { Text("+", fontSize = 14.sp, color = GoldLight) }
        }
    }
}

@Composable
fun AgendaScreen(
    planningViewModel: PlanningViewModel = viewModel(),
    appLanguage: String = "nl",
    notificationItemId: Int? = null,
    goalViewModel: com.Ameender.qurantracker.viewmodel.GoalViewModel? = null,
    onContinueGoal: (Int) -> Unit = {}
) {
    val text = AppText.strings(appLanguage)
    val allItems by planningViewModel.allItems.collectAsState()
    val dateFormatter = remember { SimpleDateFormat("yyyy-MM-dd", Locale.ROOT) }
    val appLocale = remember(appLanguage) { agendaLocale(appLanguage) }
    val displayFormatter = remember(appLocale) { SimpleDateFormat("EEEE d MMMM", appLocale) }
    val monthFormatter = remember(appLocale) { SimpleDateFormat("MMMM yyyy", appLocale) }
    val weekdayFormatter = remember(appLocale) { SimpleDateFormat("EEE", appLocale) }
    var today by remember { mutableStateOf(dateFormatter.format(Date())) }
    LaunchedEffect(Unit) {
        while (true) {
            today = dateFormatter.format(Date())
            kotlinx.coroutines.delay(30_000)
        }
    }
    var selectedDate by rememberSaveable { mutableStateOf(today) }
    var consumedNotificationId by rememberSaveable { mutableStateOf<Int?>(null) }
    LaunchedEffect(notificationItemId, allItems) {
        if (notificationItemId != null && notificationItemId != consumedNotificationId) {
            allItems.find { it.id == notificationItemId }?.let {
                selectedDate = it.date
                consumedNotificationId = notificationItemId
            }
        }
    }
    var showAddSheet by rememberSaveable { mutableStateOf(false) }
    var showMonthOverview by rememberSaveable { mutableStateOf(false) }
    var showAllUpcoming by rememberSaveable { mutableStateOf(false) }
    var showMissed by rememberSaveable { mutableStateOf(false) }
    val currentMonth = remember(selectedDate) {
        Calendar.getInstance().apply { time = dateFormatter.parse(selectedDate) ?: Date() }
    }
    val selectedItems = remember(allItems, selectedDate) {
        allItems.filter { it.date == selectedDate }
            .sortedWith(compareBy<PlanningItem> { it.isDone }
                .thenBy { it.reminderHour ?: 24 }.thenBy { it.reminderMinute ?: 0 }.thenBy { it.createdAt })
    }
    val upcomingItems = remember(allItems, today) {
        allItems.filter { it.date > today && !it.isDone }
            .sortedWith(compareBy<PlanningItem> { it.date }
                .thenBy { it.reminderHour ?: 24 }.thenBy { it.reminderMinute ?: 0 }.thenBy { it.createdAt })
    }
    val missedItems = remember(allItems, today) {
        allItems.filter { it.date < today && !it.isDone }.groupBy { it.date }.toSortedMap(reverseOrder())
    }
    val listState = androidx.compose.foundation.lazy.rememberLazyListState()
    val scope = rememberCoroutineScope()
    val selectDate: (String) -> Unit = { date ->
        selectedDate = date
        scope.launch { listState.animateScrollToItem(0) }
    }
    val movePeriod: (Int) -> Unit = { direction ->
        selectedDate = dateFormatter.format((currentMonth.clone() as Calendar).apply {
            add(if (showMonthOverview) Calendar.MONTH else Calendar.WEEK_OF_YEAR, direction)
        }.time)
    }

    if (showAddSheet) {
        AddPlanningItemSheet(
            selectedDate = selectedDate, planningViewModel = planningViewModel,
            text = text, dateFormatter = dateFormatter, displayFormatter = displayFormatter,
            onDismiss = { showAddSheet = false }
        )
    }
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize().background(DarkNavy),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item(key = "calendar") {
            WeekStrip(
                currentMonth, selectedDate, today, allItems, text, monthFormatter,
                weekdayFormatter, dateFormatter, showMonthOverview,
                onPreviousMonth = { movePeriod(-1) }, onNextMonth = { movePeriod(1) },
                onToggleMonth = { showMonthOverview = !showMonthOverview },
                onSelectDate = { selectedDate = it }
            )
        }
        item(key = "day") {
            Column {
                PlannerSectionHeader(
                    title = formatAgendaDate(selectedDate, dateFormatter, displayFormatter),
                    action = text.t("agenda.add"), onAction = { showAddSheet = true }
                )
                if (selectedItems.isNotEmpty()) {
                    val done = selectedItems.count { it.isDone }
                    Text(text.t("agenda.completedCount", done, selectedItems.size),
                        color = SoftTextGold, fontSize = 12.sp)
                    LinearProgressIndicator(
                        progress = { done.toFloat() / selectedItems.size },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp).height(4.dp),
                        color = DoneGreen, trackColor = BorderNavy
                    )
                }
            }
        }
        if (goalViewModel != null) item(key = "daily-goals") {
            GoalHubPanel(goalViewModel, appLanguage, compact = true, date = selectedDate, onContinue = onContinueGoal)
        }
        if (selectedItems.isEmpty()) {
            item(key = "empty") {
                PlannerCard {
                    Icon(Icons.Default.EventAvailable, null, tint = Gold, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.height(8.dp))
                    Text(text.t("agenda.emptyTitle"), color = GoldLight, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    Text(text.t("agenda.emptySubtitle"), color = SoftTextGold, fontSize = 13.sp)
                    TextButton(onClick = { showAddSheet = true }) {
                        Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(text.t("agenda.addItem"))
                    }
                }
            }
        }
        items(selectedItems, key = { "plan-${it.id}" }) { item ->
            PlanningItemCard(item, { planningViewModel.toggleDone(item) },
                { planningViewModel.deleteItem(item.id) },
                { hour, minute -> planningViewModel.setReminder(item, hour, minute) }, text)
        }
        if (upcomingItems.isNotEmpty()) item(key = "upcoming") {
            UpcomingPlanningList(
                upcomingItems, agendaDateOffset(today, 1, dateFormatter),
                agendaDateOffset(today, 2, dateFormatter), text, dateFormatter,
                displayFormatter, showAllUpcoming, { showAllUpcoming = !showAllUpcoming },
                onSelectDate = selectDate
            )
        }
        if (missedItems.isNotEmpty()) item(key = "missed") {
            PlannerCard {
                PlannerSectionHeader(
                    title = "${text.t("agenda.missedDays")} · ${missedItems.values.sumOf { it.size }}",
                    action = text.t(if (showMissed) "agenda.viewLess" else "agenda.viewAll"),
                    onAction = { showMissed = !showMissed }
                )
                if (showMissed) missedItems.forEach { (date, pending) ->
                    TextButton(onClick = { selectDate(date) }, modifier = Modifier.fillMaxWidth()) {
                        Text(formatAgendaDate(date, dateFormatter, displayFormatter),
                            modifier = Modifier.weight(1f), color = GoldLight, textAlign = TextAlign.Start)
                        Text(pending.size.toString(), color = SoftTextGold)
                        Icon(Icons.Default.ChevronRight, null, tint = MutedGold)
                    }
                }
            }
        }
        item(key = "bottom") { Spacer(Modifier.navigationBarsPadding().height(16.dp)) }
    }
}
@Composable
private fun WeekStrip(
    currentMonth: Calendar,
    selectedDate: String,
    today: String,
    items: List<PlanningItem>,
    text: AppStrings,
    monthFormatter: SimpleDateFormat,
    weekdayFormatter: SimpleDateFormat,
    dateFormatter: SimpleDateFormat,
    isMonthExpanded: Boolean,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onToggleMonth: () -> Unit,
    onSelectDate: (String) -> Unit
) {
    PlannerCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                monthFormatter.format(currentMonth.time).replaceFirstChar { it.uppercase() },
                color = GoldLight, fontSize = 17.sp, fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f)
            )
            IconButton(onClick = onPreviousMonth) {
                Icon(Icons.Default.ChevronLeft, text.t("agenda.previous"), tint = GoldLight)
            }
            IconButton(onClick = onNextMonth) {
                Icon(Icons.Default.ChevronRight, text.t("agenda.next"), tint = GoldLight)
            }
        }
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onToggleMonth) {
                Icon(if (isMonthExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.CalendarMonth,
                    null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text(text.t(if (isMonthExpanded) "agenda.hideMonth" else "agenda.showMonth"), fontSize = 12.sp)
            }
            Spacer(Modifier.weight(1f))
            TextButton(onClick = { onSelectDate(today) }, enabled = selectedDate != today) {
                Text(text.t("agenda.todayTitle"), fontSize = 12.sp)
            }
        }
        if (isMonthExpanded) {
            AgendaMonthGrid(currentMonth, selectedDate, today, items,
                weekdayFormatter, dateFormatter, onSelectDate)
        } else {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                agendaWeekDates(selectedDate, dateFormatter).forEach { date ->
                    AgendaWeekDayCell(date, date == selectedDate, agendaDayStatus(date, items, today),
                        text, weekdayFormatter, dateFormatter, { onSelectDate(date) }, Modifier.weight(1f))
                }
            }
        }
    }
}
@Composable
private fun AgendaWeekDayCell(
    date: String,
    isSelected: Boolean,
    status: AgendaDayStatus,
    text: AppStrings,
    weekdayFormatter: SimpleDateFormat,
    dateFormatter: SimpleDateFormat,
    onSelect: () -> Unit,
    modifier: Modifier = Modifier
) {
    val calendar = remember(date) { Calendar.getInstance().apply { time = dateFormatter.parse(date) ?: Date() } }
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(AppShape.tile))
            .background(if (isSelected) DoneGreen else DeepNavy.copy(alpha = 0.55f))
            .border(1.dp, if (isSelected) DoneGreen else BorderNavy, RoundedCornerShape(AppShape.tile))
            .clickable { onSelect() }
            .padding(vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(formatWeekdayLabel(calendar, weekdayFormatter), color = if (isSelected) GoldLight else MutedGold, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
        Spacer(modifier = Modifier.height(4.dp))
        Text(calendar.get(Calendar.DAY_OF_MONTH).toString(), color = if (isSelected) GoldLight else SoftTextGold, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Box(modifier = Modifier.size(8.dp).clip(RoundedCornerShape(50)).background(agendaStatusColor(status)))
    }
}

@Composable
private fun UpcomingPlanningList(
    items: List<PlanningItem>,
    tomorrow: String,
    dayAfterTomorrow: String,
    text: AppStrings,
    dateFormatter: SimpleDateFormat,
    displayFormatter: SimpleDateFormat,
    showAll: Boolean,
    onToggleShowAll: () -> Unit,
    onSelectDate: (String) -> Unit
) {
    val visibleItems = if (showAll) items else items.take(3)
    val canToggle = items.size > 3

    PlannerCard {
        PlannerSectionHeader(
            title = text.t("agenda.upcoming.title"),
            action = if (canToggle) text.t(if (showAll) "agenda.viewLess" else "agenda.viewAll") else null,
            onAction = if (canToggle) onToggleShowAll else null
        )
        if (items.isEmpty()) {
            Text(text.t("agenda.noTomorrowPlanning"), color = SoftTextGold, fontSize = 13.sp, modifier = Modifier.padding(vertical = 12.dp))
        } else {
            visibleItems.forEach { item ->
                UpcomingPlanningRow(
                    item = item,
                    dayLabel = upcomingDayLabel(item.date, tomorrow, dayAfterTomorrow, text, dateFormatter, displayFormatter),
                    text = text,
                    onClick = { onSelectDate(item.date) }
                )
            }
        }
    }
}

@Composable
private fun UpcomingPlanningRow(
    item: PlanningItem,
    dayLabel: String,
    text: AppStrings,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clip(RoundedCornerShape(AppShape.tile)).background(DeepNavy).border(1.dp, BorderNavy, RoundedCornerShape(AppShape.tile)).clickable(onClick = onClick).padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(dayLabel, color = Gold, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(72.dp))
        Box(modifier = Modifier.size(32.dp).clip(RoundedCornerShape(AppShape.control)).background(GoldSurface), contentAlignment = Alignment.Center) {
            Icon(upcomingPlanningIcon(item.type), contentDescription = null, tint = Gold, modifier = Modifier.size(22.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(item.displayName, color = GoldLight, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text(planningTypeLabel(item.type, text), color = SoftTextGold, fontSize = 12.sp)
        }
        val reminderLabel = formatPlanningReminder(item)
        if (reminderLabel != null) {
            Text(reminderLabel, color = SoftTextGold, fontSize = 12.sp, textAlign = TextAlign.End)
        }
        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Gold, modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun AgendaMonthGrid(
    currentMonth: Calendar,
    selectedDate: String,
    today: String,
    items: List<PlanningItem>,
    weekdayFormatter: SimpleDateFormat,
    dateFormatter: SimpleDateFormat,
    onSelectDate: (String) -> Unit
) {
    val monthCalendar = remember(currentMonth) { (currentMonth.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, 1) } }
    val daysInMonth = monthCalendar.getActualMaximum(Calendar.DAY_OF_MONTH)
    val firstDayOffset = (monthCalendar.get(Calendar.DAY_OF_WEEK) + 5) % 7
    val cells = List(firstDayOffset) { null } + (1..daysInMonth).map { day -> (currentMonth.clone() as Calendar).apply { set(Calendar.DAY_OF_MONTH, day) } }

    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        agendaWeekCalendars().forEach { calendar ->
            Text(
                formatWeekdayLabel(calendar, weekdayFormatter),
                color = SoftTextGold,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                maxLines = 1,
                modifier = Modifier.weight(1f)
            )
        }
    }
    Spacer(modifier = Modifier.height(8.dp))
    cells.chunked(7).forEach { week ->
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            week.forEach { calendar ->
                if (calendar == null) {
                    Spacer(modifier = Modifier.weight(1f).height(AppComponentDefaults.minTouchTarget))
                } else {
                    val date = dateFormatter.format(calendar.time)
                    val status = agendaDayStatus(date, items, today)
                    Box(
                        modifier = Modifier.weight(1f).height(AppComponentDefaults.minTouchTarget).clip(RoundedCornerShape(AppShape.smallControl)).background(agendaStatusSurface(status)).border(1.dp, if (date == selectedDate) DoneGreen else BorderNavy, RoundedCornerShape(AppShape.smallControl)).clickable { onSelectDate(date) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(calendar.get(Calendar.DAY_OF_MONTH).toString(), color = if (status == AgendaDayStatus.Today) GoldLight else SoftTextGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            repeat(7 - week.size) { Spacer(modifier = Modifier.weight(1f).height(AppComponentDefaults.minTouchTarget)) }
        }
        Spacer(modifier = Modifier.height(6.dp))
    }
}

@Composable
private fun PlannerCard(containerColor: Color = MidNavy, borderColor: Color = BorderNavy, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(AppShape.card)).background(containerColor).border(1.dp, borderColor, RoundedCornerShape(AppShape.card)).padding(12.dp),
        content = content
    )
}

@Composable
private fun PlannerSectionHeader(title: String, action: String? = null, onAction: (() -> Unit)? = null) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, color = GoldLight, fontSize = 17.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
        if (action != null) {
            TextButton(onClick = { onAction?.invoke() }) {
                Text(action, color = DoneGreen, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

internal enum class AgendaDayStatus { Empty, Planned, Partial, Completed, Missed, Today }

internal fun agendaDayStatus(date: String, items: List<PlanningItem>, today: String): AgendaDayStatus {
    val dayItems = items.filter { it.date == date }
    if (dayItems.isEmpty()) return AgendaDayStatus.Empty
    val doneCount = dayItems.count { it.isDone }
    return when {
        doneCount == dayItems.size -> AgendaDayStatus.Completed
        date < today && doneCount < dayItems.size -> AgendaDayStatus.Missed
        doneCount > 0 -> AgendaDayStatus.Partial
        else -> AgendaDayStatus.Planned
    }
}

private fun agendaStatusColor(status: AgendaDayStatus): Color = when (status) {
    AgendaDayStatus.Completed -> DoneGreen
    AgendaDayStatus.Partial -> Gold
    AgendaDayStatus.Missed -> DeleteRed
    AgendaDayStatus.Today -> DoneGreen
    AgendaDayStatus.Planned -> MutedGold
    AgendaDayStatus.Empty -> BorderNavy
}

private fun agendaStatusSurface(status: AgendaDayStatus): Color = when (status) {
    AgendaDayStatus.Completed -> TodayDoneSurface
    AgendaDayStatus.Partial -> GoldSurface
    AgendaDayStatus.Missed -> StrongDeleteSurface.copy(alpha = 0.18f)
    AgendaDayStatus.Today -> DoneGreen
    AgendaDayStatus.Planned -> PeriodSurface
    AgendaDayStatus.Empty -> MidNavy
}

internal fun agendaWeekDates(today: String, formatter: SimpleDateFormat): List<String> {
    val startOfWeek = try {
        Calendar.getInstance().apply {
            time = formatter.parse(today) ?: Date()
            firstDayOfWeek = Calendar.MONDAY
            while (get(Calendar.DAY_OF_WEEK) != Calendar.MONDAY) {
                add(Calendar.DAY_OF_MONTH, -1)
            }
        }
    } catch (e: Exception) {
        Calendar.getInstance()
    }
    return (0..6).map { offset ->
        val day = (startOfWeek.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH, offset) }
        formatter.format(day.time)
    }
}

internal fun agendaDateOffset(date: String, offset: Int, formatter: SimpleDateFormat): String = try {
    val calendar = Calendar.getInstance().apply {
        time = formatter.parse(date) ?: Date()
        add(Calendar.DAY_OF_MONTH, offset)
    }
    formatter.format(calendar.time)
} catch (e: Exception) {
    date
}

private fun agendaLocale(appLanguage: String): Locale = when (appLanguage.lowercase()) {
    "ar" -> Locale("ar")
    "en" -> Locale.ENGLISH
    else -> Locale("nl")
}

private fun agendaWeekCalendars(): List<Calendar> {
    val monday = Calendar.getInstance().apply {
        firstDayOfWeek = Calendar.MONDAY
        set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
    }
    return (0..6).map { offset -> (monday.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH, offset) } }
}

private fun formatWeekdayLabel(calendar: Calendar, weekdayFormatter: SimpleDateFormat): String {
    return weekdayFormatter.format(calendar.time)
        .replace(".", "")
        .replaceFirstChar { it.uppercase() }
}

private fun formatAgendaDate(date: String, dateFormatter: SimpleDateFormat, displayFormatter: SimpleDateFormat): String = try {
    displayFormatter.format(dateFormatter.parse(date) ?: Date()).replaceFirstChar { it.uppercase() }
} catch (e: Exception) {
    date
}

private fun planningTypeLabel(type: String, text: AppStrings): String = when (type) {
    "rub", "hizb", "juz", "khatma" -> text.t("agenda.types.reading")
    "surah", "hifdh" -> text.t("agenda.types.hifdh")
    "revision", "murajaah" -> text.t("agenda.types.revision")
    else -> text.t("agenda.type")
}

private fun upcomingPlanningIcon(type: String): androidx.compose.ui.graphics.vector.ImageVector = when (type) {
    "surah", "hifdh" -> Icons.Default.Psychology
    "revision", "murajaah" -> Icons.Default.Refresh
    else -> Icons.AutoMirrored.Filled.MenuBook
}

private fun upcomingDayLabel(
    date: String,
    tomorrow: String,
    dayAfterTomorrow: String,
    text: AppStrings,
    dateFormatter: SimpleDateFormat,
    displayFormatter: SimpleDateFormat
): String = when (date) {
    tomorrow -> text.t("agenda.upcoming.tomorrow")
    dayAfterTomorrow -> text.t("agenda.upcoming.dayAfterTomorrow")
    else -> formatAgendaDate(date, dateFormatter, displayFormatter).substringBefore(" ")
}

private fun formatPlanningReminder(item: PlanningItem): String? {
    val hour = item.reminderHour ?: return null
    val minute = item.reminderMinute ?: return null
    return "${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}"
}

@Composable
fun PlanningItemCard(
    item: PlanningItem,
    onToggle: () -> Unit,
    onDelete: () -> Unit,
    onReminderChange: (Int?, Int?) -> Unit,
    text: AppStrings
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showReminderDialog by remember { mutableStateOf(false) }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest  = { showDeleteConfirm = false },
            containerColor    = MidNavy,
            titleContentColor = GoldLight,
            textContentColor  = LabelGold,
            title = { Text(text.t("common.delete")) },
            text  = { Text(text.t("agenda.deleteQuestion", item.displayName)) },
            confirmButton = {
                TextButton(onClick = { onDelete(); showDeleteConfirm = false }) {
                    Text(text.t("common.delete"), color = DeleteRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text(text.t("common.cancel"), color = SoftTextGold)
                }
            }
        )
    }

    if (showReminderDialog) {
        ReminderTimeDialog(
            initialHour = item.reminderHour ?: 20,
            initialMinute = item.reminderMinute ?: 0,
            text = text,
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
        Checkbox(
            checked = item.isDone,
            onCheckedChange = { onToggle() },
            colors = CheckboxDefaults.colors(checkedColor = DoneGreen, uncheckedColor = SoftTextGold)
        )
        Spacer(Modifier.width(4.dp))
        Column(modifier = Modifier.weight(1f)) {
            // Type icoon + naam
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    upcomingPlanningIcon(item.type),
                    contentDescription = null,
                    tint = Gold,
                    modifier = Modifier.size(16.dp)
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
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
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
                    .clickable(enabled = !item.isDone) { showReminderDialog = true }
                    .heightIn(min = 48.dp)
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
                        text.t(
                            "agenda.remindMeAt",
                            "${item.reminderHour.toString().padStart(2, '0')}:${item.reminderMinute.toString().padStart(2, '0')}"
                        )
                    } else {
                        text.t("agenda.remindMe")
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
                contentDescription = text.t("common.delete"),
                tint = MutedGold,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

// â”€â”€ Bottom sheet: item toevoegen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddPlanningItemSheet(
    selectedDate: String,
    planningViewModel: PlanningViewModel,
    text: AppStrings,
    dateFormatter: SimpleDateFormat,
    displayFormatter: SimpleDateFormat,
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

    val rubLabel = { n: Int -> when (n) { 1 -> "1/4"; 2 -> "1/2"; 3 -> "3/4"; else -> text.t("agenda.rubWhole") } }

    // Bereken display naam en arabic tekst
    val hizbInfo = ALL_HIZB.find { it.hizbNumber == selectedHizb }
    val displayName = when (selectedType) {
        "rub"   -> "${text.t("unit.hizb")} $selectedHizb - ${rubLabel(selectedRub)}"
        "hizb"  -> "${text.t("unit.hizb")} $selectedHizb"
        "juz"   -> "${text.t("unit.juz")} $selectedJuz"
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
        sheetState       = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .imePadding()
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(
                text.t("agenda.addItem"),
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = GoldLight,
                modifier = Modifier.padding(bottom = 4.dp)
            )

            Text(
                formatAgendaDate(selectedDate, dateFormatter, displayFormatter),
                fontSize = 13.sp, color = Gold,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            KhatmaPlannerBlock(
                days = khatmaDays,
                expanded = khatmaOpen,
                saved = khatmaSaved,
                text = text,
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
            Text(text.t("agenda.type"), fontSize = 13.sp, color = SoftTextGold,
                modifier = Modifier.padding(bottom = 8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    "rub"   to text.t("unit.rub"),
                    "hizb"  to text.t("unit.hizb"),
                    "juz"   to text.t("unit.juz"),
                    "surah" to text.t("agenda.surah")
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
                    Text(text.t("agenda.hizbNumber"), fontSize = 13.sp, color = SoftTextGold,
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
                        Text(text.t("agenda.quarter"), fontSize = 13.sp, color = SoftTextGold,
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
                    Text(text.t("agenda.juzNumber"), fontSize = 13.sp, color = SoftTextGold,
                        modifier = Modifier.padding(bottom = 8.dp))
                    NumberPicker(
                        value   = selectedJuz,
                        range   = 1..30,
                        onValueChange = { selectedJuz = it }
                    )
                }

                "surah" -> {
                    Text(text.t("agenda.surah"), fontSize = 13.sp, color = SoftTextGold,
                        modifier = Modifier.padding(bottom = 8.dp))
                    NumberPicker(
                        value   = selectedSurah,
                        range   = 1..114,
                        onValueChange = { id ->
                            selectedSurah     = id
                            selectedSurahName = ALL_SURAHS.find { it.id == id }?.name ?: text.formatSurah(id)
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
                    Text(text.t("agenda.savedAs"), fontSize = 11.sp, color = DimGold,
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
                Text(text.t("agenda.addToPlanning"), fontSize = 14.sp,
                    color = DarkNavy, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

// â”€â”€ Nummer picker component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@Composable
fun KhatmaPlannerBlock(
    days: Int,
    expanded: Boolean,
    saved: Boolean,
    text: AppStrings,
    onToggle: () -> Unit,
    onDaysChange: (Int) -> Unit,
    onCreate: () -> Unit
) {
    var previewOpen by remember { mutableStateOf(false) }
    val previewLines = remember(days, text) { khatmaPreview(days, text) }

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
                Text(text.t("agenda.khatmaPlanTitle"), fontSize = 14.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                Text(text.t("agenda.khatmaPlanSubtitle"), fontSize = 11.sp, color = DimGold)
            }
            Icon(
                imageVector = if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                contentDescription = null,
                tint = ChevronNavy
            )
        }

        AnimatedVisibility(visible = expanded) {
            Column(modifier = Modifier.padding(top = AppSpacing.list)) {
                Text(text.t("agenda.daysCount"), fontSize = 12.sp, color = SoftTextGold, modifier = Modifier.padding(bottom = 8.dp))
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
                        Text(text.t("agenda.previewTitle"), fontSize = 12.sp, color = GoldLight, fontWeight = FontWeight.Bold)
                        Text(text.t("agenda.previewSubtitle", previewLines.size), fontSize = 10.sp, color = SoftTextGold)
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
                enabled = !saved,
                    modifier = Modifier.fillMaxWidth().height(AgendaKhatmaStyle.plannerButtonHeight),
                    shape = RoundedCornerShape(AppShape.control),
                    colors = ButtonDefaults.buttonColors(containerColor = if (saved) DoneGreen else Gold)
                ) {
                    Text(
                        if (saved) text.t("agenda.khatmaPlanAdded") else text.t("agenda.createKhatmaPlan"),
                        fontSize = 13.sp,
                        color = DarkNavy,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

fun khatmaPreview(days: Int, text: AppStrings): List<String> {
    val safeDays = days.coerceIn(1, 240)
    return (0 until safeDays).map { index ->
        val day = index + 1
        val start = ((index * 240) / safeDays) + 1
        val end = (((index + 1) * 240) / safeDays).coerceAtLeast(start)
        text.t("agenda.previewDay", day, khatmaPartRangeLabel(start, end, text))
    }
}

fun khatmaPartRangeLabel(startPart: Int, endPart: Int, text: AppStrings): String {
    val safeStart = startPart.coerceIn(1, 240)
    val safeEnd = endPart.coerceIn(safeStart, 240)
    val startJuz = ((safeStart - 1) / 8) + 1
    val endJuz = ((safeEnd - 1) / 8) + 1
    val startRubInJuz = ((safeStart - 1) % 8) + 1
    val endRubInJuz = ((safeEnd - 1) % 8) + 1
    if (startRubInJuz == 1 && endRubInJuz == 8) {
        return if (startJuz == endJuz) {
            "${text.t("unit.juz")} $startJuz"
        } else {
            "${text.t("unit.juz")} $startJuz-$endJuz"
        }
    }

    val startHizb = ((safeStart - 1) / 4) + 1
    val endHizb = ((safeEnd - 1) / 4) + 1
    val startRub = ((safeStart - 1) % 4) + 1
    val endRub = ((safeEnd - 1) % 4) + 1
    val startLabel = "${text.t("unit.hizb")} $startHizb ${text.t("unit.rub")} $startRub"
    val endLabel = "${text.t("unit.hizb")} $endHizb ${text.t("unit.rub")} $endRub"
    return when {
        safeStart == safeEnd -> startLabel
        startHizb == endHizb -> "${text.t("unit.hizb")} $startHizb ${text.t("unit.rub")} $startRub-$endRub"
        else -> text.t("agenda.range", startLabel, endLabel)
    }
}

@Composable
fun NumberPicker(value: Int, range: IntRange, onValueChange: (Int) -> Unit) {
    var input by remember(value) { mutableStateOf(value.toString()) }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = { if (value > range.first) onValueChange(value - 1) },
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
        ) {
            Icon(Icons.Default.Remove, contentDescription = null, tint = GoldLight)
        }

        OutlinedTextField(
            value = input,
            onValueChange = { rawValue ->
                val digits = rawValue.filter { it.isDigit() }
                input = digits
                digits.toIntOrNull()
                    ?.coerceIn(range.first, range.last)
                    ?.let(onValueChange)
            },
            modifier = Modifier
                .weight(1f)
                .height(52.dp),
            singleLine = true,
            textStyle = LocalTextStyle.current.copy(
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = GoldLight,
                textAlign = TextAlign.Center
            ),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(AppShape.control),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = GoldLight,
                unfocusedTextColor = GoldLight,
                focusedContainerColor = DeepNavy,
                unfocusedContainerColor = DeepNavy,
                focusedBorderColor = Gold,
                unfocusedBorderColor = Gold.copy(alpha = 0.4f),
                cursorColor = Gold
            )
        )

        IconButton(
            onClick = { if (value < range.last) onValueChange(value + 1) },
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(AppShape.control))
                .background(DeepNavy)
                .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
        ) {
            Icon(Icons.Default.Add, contentDescription = null, tint = GoldLight)
        }
    }
}
