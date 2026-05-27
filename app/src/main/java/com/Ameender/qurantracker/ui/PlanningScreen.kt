package com.Ameender.qurantracker.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.Ameender.qurantracker.viewmodel.GoalViewModel

@Composable
fun PlanningScreen(goalViewModel: GoalViewModel = viewModel()) {
    val goal       by goalViewModel.dailyGoal.collectAsState()
    val todayCount by goalViewModel.todayCount.collectAsState()
    val streak     by goalViewModel.streak.collectAsState()

    // Lokale state voor bewerken
    var selectedUnit   by remember(goal) { mutableStateOf(goal.unit) }
    var targetInput    by remember(goal) { mutableStateOf(goal.target.toString()) }
    var reminderHour   by remember(goal) { mutableIntStateOf(goal.reminderHour) }
    var reminderMinute by remember(goal) { mutableIntStateOf(goal.reminderMinute) }
    var saved          by remember { mutableStateOf(false) }

    val progress = if (goal.target > 0)
        (todayCount.toFloat() / goal.target).coerceIn(0f, 1f)
    else 0f

    val goalReached = todayCount >= goal.target && goal.target > 0
    val unitLabel   = goalViewModel.unitLabel(goal.unit)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkNavy)
            .verticalScroll(rememberScrollState())
            .padding(AppSpacing.screen)
    ) {
        // ── Header ──
        Text(
            "📅 Dagelijks Doel",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = GoldLight,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Text(
            "Stel in hoeveel je elke dag wilt lezen",
            fontSize = 13.sp,
            color = MutedGold,
            modifier = Modifier.padding(bottom = 20.dp)
        )

        // ── Voortgangsring vandaag ──
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = MidNavy),
            shape = RoundedCornerShape(AppShape.largeCard)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Vandaag",
                    fontSize = 14.sp,
                    color = MutedGold,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // Cirkel voortgang
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.size(160.dp)
                ) {
                    val animProgress = remember { Animatable(0f) }
                    LaunchedEffect(progress) {
                        animProgress.animateTo(progress, tween(800, easing = EaseOutCubic))
                    }

                    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
                        val stroke = 16.dp.toPx()
                        val inset  = stroke / 2
                        // Achtergrond ring
                        drawArc(
                            color      = BorderNavy,
                            startAngle = -90f,
                            sweepAngle = 360f,
                            useCenter  = false,
                            style      = Stroke(stroke, cap = StrokeCap.Round),
                            topLeft    = androidx.compose.ui.geometry.Offset(inset, inset),
                            size       = androidx.compose.ui.geometry.Size(
                                size.width - stroke, size.height - stroke
                            )
                        )
                        // Voortgang ring
                        drawArc(
                            color      = if (goalReached) DoneGreen else Gold,
                            startAngle = -90f,
                            sweepAngle = 360f * animProgress.value,
                            useCenter  = false,
                            style      = Stroke(stroke, cap = StrokeCap.Round),
                            topLeft    = androidx.compose.ui.geometry.Offset(inset, inset),
                            size       = androidx.compose.ui.geometry.Size(
                                size.width - stroke, size.height - stroke
                            )
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            if (goalReached) "✅" else "$todayCount",
                            fontSize = if (goalReached) 36.sp else 36.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (goalReached) DoneGreen else GoldLight
                        )
                        Text(
                            "/ ${goal.target} $unitLabel",
                            fontSize = 13.sp,
                            color = MutedGold
                        )
                        if (goalReached) {
                            Text(
                                "MashaAllah! 🌙",
                                fontSize = 12.sp,
                                color = DoneGreen,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Streak
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(AppShape.chip))
                        .background(GoldSurface)
                        .border(1.dp, StrongGoldSurface, RoundedCornerShape(AppShape.chip))
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🔥", fontSize = 20.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            "$streak dagen op rij",
                            fontSize = 14.sp,
                            color = GoldLight,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            if (streak == 0) "Begin vandaag!"
                            else if (streak < 7) "Goed bezig!"
                            else if (streak < 30) "Geweldige streak! 💪"
                            else "MashaAllah! Ongelooflijk! 🌟",
                            fontSize = 11.sp,
                            color = MutedGold
                        )
                    }
                }
            }
        }

        // ── Instellingen ──
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            colors = CardDefaults.cardColors(containerColor = MidNavy),
            shape = RoundedCornerShape(AppShape.largeCard)
        ) {
            Column(modifier = Modifier.padding(AppSpacing.card)) {
                Text(
                    "⚙️ Instellingen",
                    fontSize = 15.sp,
                    color = Gold,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                // Eenheid kiezen
                Text("Eenheid", fontSize = 13.sp, color = MutedGold,
                    modifier = Modifier.padding(bottom = 8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(
                        "rub"   to "Rub",
                        "hizb"  to "Hizb",
                        "pages" to "Pagina's",
                        "ayahs" to "Ayahs"
                    ).forEach { (unit, label) ->
                        val selected = selectedUnit == unit
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(AppShape.control))
                                .background(if (selected) StrongGoldSurface else DeepNavy)
                                .border(
                                    1.dp,
                                    if (selected) Gold else BorderNavy,
                                    RoundedCornerShape(AppShape.control)
                                )
                                .clickable { selectedUnit = unit }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                label,
                                fontSize = 12.sp,
                                color = if (selected) GoldLight else DimGold,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Doel aantal
                Text("Doel per dag", fontSize = 13.sp, color = MutedGold,
                    modifier = Modifier.padding(bottom = 8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Min knop
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(AppShape.control))
                            .background(DeepNavy)
                            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                            .clickable {
                                val v = targetInput.toIntOrNull() ?: 1
                                if (v > 1) targetInput = (v - 1).toString()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("−", fontSize = 20.sp, color = GoldLight)
                    }

                    // Getal
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
                            targetInput,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = GoldLight,
                            textAlign = TextAlign.Center
                        )
                    }

                    // Plus knop
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(AppShape.control))
                            .background(DeepNavy)
                            .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.control))
                            .clickable {
                                val v = targetInput.toIntOrNull() ?: 1
                                targetInput = (v + 1).toString()
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("+", fontSize = 20.sp, color = GoldLight)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Herinnering tijd
                Text("Herinnering", fontSize = 13.sp, color = MutedGold,
                    modifier = Modifier.padding(bottom = 8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Uur
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Uur", fontSize = 11.sp, color = DimGold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(AppShape.smallControl))
                                    .background(DeepNavy)
                                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                    .clickable { if (reminderHour > 0) reminderHour-- },
                                contentAlignment = Alignment.Center
                            ) { Text("−", fontSize = 16.sp, color = GoldLight) }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(AppShape.smallControl))
                                    .background(DeepNavy)
                                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    reminderHour.toString().padStart(2, '0'),
                                    fontSize = 18.sp, color = GoldLight,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(AppShape.smallControl))
                                    .background(DeepNavy)
                                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                    .clickable { if (reminderHour < 23) reminderHour++ },
                                contentAlignment = Alignment.Center
                            ) { Text("+", fontSize = 16.sp, color = GoldLight) }
                        }
                    }

                    Text(":", fontSize = 24.sp, color = Gold, fontWeight = FontWeight.Bold)

                    // Minuut
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Min", fontSize = 11.sp, color = DimGold,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(AppShape.smallControl))
                                    .background(DeepNavy)
                                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                    .clickable { reminderMinute = (reminderMinute - 5).coerceAtLeast(0) },
                                contentAlignment = Alignment.Center
                            ) { Text("−", fontSize = 16.sp, color = GoldLight) }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(AppShape.smallControl))
                                    .background(DeepNavy)
                                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    reminderMinute.toString().padStart(2, '0'),
                                    fontSize = 18.sp, color = GoldLight,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(AppShape.smallControl))
                                    .background(DeepNavy)
                                    .border(1.dp, BorderNavy, RoundedCornerShape(AppShape.smallControl))
                                    .clickable { reminderMinute = (reminderMinute + 5).coerceAtMost(55) },
                                contentAlignment = Alignment.Center
                            ) { Text("+", fontSize = 16.sp, color = GoldLight) }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Opslaan knop
                Button(
                    onClick = {
                        val target = targetInput.toIntOrNull() ?: 1
                        goalViewModel.saveGoal(selectedUnit, target, reminderHour, reminderMinute)
                        saved = true
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(AppShape.tile),
                    colors = ButtonDefaults.buttonColors(containerColor = Gold)
                ) {
                    Text(
                        if (saved) "✅ Opgeslagen!" else "Opslaan & Herinnering instellen",
                        fontSize = 14.sp,
                        color = DarkNavy,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Info kaart
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = DeepNavy),
            shape = RoundedCornerShape(AppShape.compactCard)
        ) {
            Column(modifier = Modifier.padding(AppSpacing.compactCard)) {
                Text("ℹ️ Hoe werkt het?", fontSize = 13.sp, color = Gold,
                    modifier = Modifier.padding(bottom = 8.dp))
                listOf(
                    "📿 Rub - elk kwart van een hizb",
                    "📿 Hizb - 4 rub = 1 hizb (60 totaal)",
                    "📄 Pagina's — schatting op basis van soera's",
                    "🔔 Herinnering — je krijgt elke dag een melding"
                ).forEach { tip ->
                    Text(
                        tip, fontSize = 12.sp, color = DimGold,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}
