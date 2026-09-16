package com.Ameender.qurantracker.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

enum class CelebrationLevel(
    val pieces: Int,
    val heightDp: Int,
    val durationMs: Int,
    val title: String
) {
    Soft(34, 112, 900, "Mooi gelezen"),
    Bright(58, 132, 1050, "Goed bezig"),
    Grand(86, 152, 1250, "Mijlpaal bereikt")
}

data class ReadingCelebration(
    val itemLabel: String,
    val level: CelebrationLevel
)

private data class ConfettiPiece(
    val startX: Float,
    val angle: Float,
    val distance: Float,
    val size: Float,
    val color: Color,
    val spin: Float,
    val shape: Int
)

@Composable
fun ReadingCelebrationDialog(
    celebration: ReadingCelebration,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = LabelGold,
        title = {
            Text(
                celebration.level.title,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                ConfettiBurst(
                    level = celebration.level,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(celebration.level.heightDp.dp)
                )
                Spacer(modifier = Modifier.size(8.dp))
                Text(
                    "${celebration.itemLabel} is opgeslagen als gelezen.",
                    color = LabelGold,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Verder", color = Gold)
            }
        }
    )
}

@Composable
private fun ConfettiBurst(
    level: CelebrationLevel,
    modifier: Modifier = Modifier
) {
    val progress = remember { Animatable(0f) }
    val colors = listOf(Gold, GoldLight, ReadBlue, SoftReadBlue, Color(0xFFE86F6F), Color(0xFF73D39B))
    val pieces by remember(level) {
        mutableStateOf(
            List(level.pieces) { index ->
                val random = Random(level.ordinal * 10_000 + index)
                ConfettiPiece(
                    startX = random.nextFloat(),
                    angle = random.nextFloat() * PI.toFloat(),
                    distance = random.nextFloat() * 0.7f + 0.35f,
                    size = random.nextFloat() * 9f + 6f,
                    color = colors[random.nextInt(colors.size)],
                    spin = random.nextFloat() * 360f,
                    shape = random.nextInt(3)
                )
            }
        )
    }

    LaunchedEffect(level) {
        progress.snapTo(0f)
        progress.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = level.durationMs)
        )
    }

    Canvas(modifier = modifier) {
        val center = Offset(size.width / 2f, size.height * 0.72f)
        pieces.forEach { piece ->
            val eased = 1f - (1f - progress.value) * (1f - progress.value)
            val drift = cos(piece.angle) * piece.distance * size.width * 0.48f * eased
            val lift = sin(piece.angle) * piece.distance * size.height * 0.95f * eased
            val fall = size.height * 0.42f * progress.value * progress.value
            val x = center.x + drift + (piece.startX - 0.5f) * size.width * 0.18f
            val y = center.y - lift + fall
            val alpha = (1f - progress.value * 0.25f).coerceIn(0f, 1f)

            rotate(piece.spin * progress.value, Offset(x, y)) {
                when (piece.shape) {
                    0 -> drawCircle(
                        color = piece.color.copy(alpha = alpha),
                        radius = piece.size / 2f,
                        center = Offset(x, y)
                    )
                    1 -> drawRect(
                        color = piece.color.copy(alpha = alpha),
                        topLeft = Offset(x - piece.size / 2f, y - piece.size / 2f),
                        size = Size(piece.size, piece.size * 0.55f)
                    )
                    else -> drawRect(
                        color = piece.color.copy(alpha = alpha),
                        topLeft = Offset(x - piece.size / 2f, y - piece.size / 2f),
                        size = Size(piece.size * 0.6f, piece.size)
                    )
                }
            }
        }

        drawCircle(
            color = Gold.copy(alpha = 0.2f * (1f - progress.value)),
            radius = size.minDimension * (0.18f + progress.value * 0.35f),
            center = center
        )
    }
}
