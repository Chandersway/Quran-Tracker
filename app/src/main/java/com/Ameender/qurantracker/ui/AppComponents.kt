package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Snackbar
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun QuranPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    loading: Boolean = false
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.heightIn(min = AppComponentDefaults.minTouchTarget),
        shape = RoundedCornerShape(AppComponentDefaults.controlRadius),
        colors = ButtonDefaults.buttonColors(
            containerColor = AppColor.primary,
            contentColor = AppColor.surfaceAlt,
            disabledContainerColor = AppColor.border,
            disabledContentColor = AppColor.textMuted
        ),
        contentPadding = PaddingValues(horizontal = AppSpacing.xl, vertical = AppSpacing.none)
    ) {
        if (loading) {
            QuranLoadingIndicator(size = AppIcon.sm, color = AppColor.surfaceAlt)
            Spacer(modifier = Modifier.width(AppSpacing.md))
        } else if (leadingIcon != null) {
            Icon(leadingIcon, contentDescription = null, modifier = Modifier.size(AppIcon.sm))
            Spacer(modifier = Modifier.width(AppSpacing.md))
        }
        Text(text, style = AppTextStyle.labelStrong, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
fun QuranSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    leadingIcon: ImageVector? = null,
    multiline: Boolean = false
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.heightIn(min = AppComponentDefaults.minTouchTarget),
        shape = RoundedCornerShape(AppComponentDefaults.controlRadius),
        border = BorderStroke(AppBorder.thin, AppColor.borderStrong),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = Color.Transparent,
            contentColor = AppColor.primaryText,
            disabledContentColor = AppColor.textMuted
        ),
        contentPadding = PaddingValues(horizontal = AppSpacing.xl, vertical = if (multiline) AppSpacing.md else AppSpacing.none)
    ) {
        if (leadingIcon != null) {
            Icon(leadingIcon, contentDescription = null, modifier = Modifier.size(AppIcon.sm))
            Spacer(modifier = Modifier.width(AppSpacing.md))
        }
        Text(text, style = AppTextStyle.labelStrong, maxLines = if (multiline) Int.MAX_VALUE else 1,
            modifier = if (multiline) Modifier.fillMaxWidth() else Modifier,
            textAlign = if (multiline) TextAlign.Center else TextAlign.Unspecified,
            overflow = TextOverflow.Ellipsis)
    }
}

@Composable
fun QuranIconButton(
    onClick: () -> Unit,
    icon: ImageVector,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    tint: Color = AppColor.primaryText,
    containerColor: Color = AppColor.surfaceAlt,
    size: Dp = AppIcon.touch
) {
    IconButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .size(size.coerceAtLeast(AppComponentDefaults.minTouchTarget))
            .background(containerColor, RoundedCornerShape(AppShape.smallControl))
    ) {
        Icon(icon, contentDescription = contentDescription, tint = tint, modifier = Modifier.size(AppIcon.md))
    }
}

@Composable
fun QuranAppCard(
    modifier: Modifier = Modifier,
    containerColor: Color = AppColor.surface,
    borderColor: Color = AppColor.border,
    radius: Dp = AppComponentDefaults.cardRadius,
    padding: Dp = AppComponentDefaults.cardPadding,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(radius),
        elevation = CardDefaults.cardElevation(defaultElevation = AppComponentDefaults.cardElevation)
    ) {
        Column(
            modifier = Modifier
                .border(AppBorder.thin, borderColor, RoundedCornerShape(radius))
                .padding(padding),
            content = content
        )
    }
}

@Composable
fun QuranStatisticCard(
    title: String,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    QuranAppCard(modifier = modifier.padding(bottom = AppSpacing.xxl)) {
        Text(title, style = AppTextStyle.cardTitle, color = AppColor.primary, modifier = Modifier.padding(bottom = AppSpacing.xl))
        content()
    }
}

@Composable
fun QuranProgressCard(
    title: String,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    QuranStatisticCard(title = title, modifier = modifier, content = content)
}

@Composable
fun QuranProgressRow(
    label: String,
    valueText: String,
    progress: Float,
    color: Color,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, style = AppTextStyle.bodySmall.copy(fontWeight = FontWeight.Bold), color = AppColor.textPrimary)
            Text(valueText, style = AppTextStyle.bodySmall, color = AppColor.textMuted)
        }
        Spacer(modifier = Modifier.height(AppSpacing.sm))
        LinearProgressIndicator(
            progress = { progress.coerceIn(0f, 1f) },
            modifier = Modifier
                .fillMaxWidth()
                .height(AppChartSize.progressHeight)
                .clip(RoundedCornerShape(AppShape.bar)),
            color = color,
            trackColor = AppColor.border.copy(alpha = 0.55f)
        )
    }
}

@Composable
fun QuranAyahCard(
    reference: String,
    text: String,
    modifier: Modifier = Modifier,
    textAlign: TextAlign = TextAlign.Start
) {
    QuranAppCard(
        modifier = modifier,
        radius = AppShape.control,
        padding = AppSpacing.list
    ) {
        Text(reference, style = AppTextStyle.bodySmall.copy(fontWeight = FontWeight.Bold), color = AppColor.primaryText)
        Spacer(modifier = Modifier.height(AppSpacing.md))
        Text(
            text,
            modifier = Modifier.fillMaxWidth(),
            fontSize = 16.sp,
            lineHeight = 27.sp,
            color = AppColor.textPrimary,
            textAlign = textAlign
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun QuranSurahCard(
    number: Int,
    name: String,
    arabicName: String,
    metadata: String,
    modifier: Modifier = Modifier,
    readCountText: String? = null,
    hifzScoreText: String? = null,
    backgroundColor: Color = AppColor.surface,
    borderColor: Color = AppColor.border,
    onClick: () -> Unit = {},
    onLongClick: (() -> Unit)? = null,
    actions: @Composable ColumnScope.() -> Unit = {}
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = AppComponentDefaults.minTouchTarget)
            .padding(bottom = AppSpacing.md)
            .clip(RoundedCornerShape(AppShape.tile))
            .semantics {
                role = Role.Button
                contentDescription = listOf(name, arabicName, metadata)
                    .filter { it.isNotBlank() }
                    .joinToString(". ")
            }
            .combinedClickable(onClick = onClick, onLongClick = onLongClick)
            .background(backgroundColor)
            .border(AppBorder.thin, borderColor, RoundedCornerShape(AppShape.tile))
            .padding(horizontal = AppSpacing.xl, vertical = AppSpacing.lg),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(AppIcon.action)
                .clip(RoundedCornerShape(AppShape.pill))
                .background(AppColor.surfaceAlt)
                .border(AppBorder.thin, AppColor.borderStrong, RoundedCornerShape(AppShape.pill)),
            contentAlignment = Alignment.Center
        ) {
            Text(number.toString(), style = AppTextStyle.caption, color = AppColor.primary)
        }
        Spacer(modifier = Modifier.width(AppSpacing.lg))
        Column(modifier = Modifier.weight(1f)) {
            Text(name, style = AppTextStyle.bodySmall, color = AppColor.textPrimary)
            Text(arabicName, style = AppTextStyle.bodySmall, color = AppColor.primary)
            Text(metadata, style = AppTextStyle.caption, color = AppColor.textDisabled)
            if (!readCountText.isNullOrBlank()) {
                Text(readCountText, style = AppTextStyle.caption.copy(fontWeight = FontWeight.Bold), color = AppColor.primary)
            }
            if (!hifzScoreText.isNullOrBlank()) {
                Text(hifzScoreText, style = AppTextStyle.caption, color = AppColor.textMuted)
            }
        }
        Column(
            verticalArrangement = Arrangement.spacedBy(AppSpacing.sm),
            horizontalAlignment = Alignment.End,
            content = actions
        )
    }
}

@Composable
fun QuranAppDialog(
    title: String,
    message: String,
    confirmText: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    dismissText: String? = null,
    destructive: Boolean = false,
    content: (@Composable ColumnScope.() -> Unit)? = null
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = AppColor.surface,
        titleContentColor = AppColor.primaryText,
        textContentColor = AppColor.textSecondary,
        title = { Text(title) },
        text = {
            Column {
                Text(message)
                if (content != null) {
                    Spacer(modifier = Modifier.height(AppSpacing.xl))
                    content()
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(confirmText, color = if (destructive) AppColor.danger else AppColor.primary)
            }
        },
        dismissButton = dismissText?.let {
            {
                TextButton(onClick = onDismiss) {
                    Text(it, color = AppColor.textMuted)
                }
            }
        }
    )
}

@Composable
fun QuranSnackbar(message: String, modifier: Modifier = Modifier) {
    Snackbar(
        modifier = modifier.padding(AppSpacing.md),
        containerColor = AppColor.surfaceAlt,
        contentColor = AppColor.textPrimary,
        shape = RoundedCornerShape(AppShape.control)
    ) {
        Text(message, style = AppTextStyle.bodySmall)
    }
}

@Composable
fun QuranLoadingIndicator(
    modifier: Modifier = Modifier,
    size: Dp = AppIcon.xl,
    color: Color = AppColor.primary
) {
    CircularProgressIndicator(modifier = modifier.size(size), color = color, strokeWidth = AppBorder.selected)
}

@Composable
fun QuranEmptyState(
    title: String,
    modifier: Modifier = Modifier,
    message: String? = null,
    icon: ImageVector = Icons.Default.Inbox
) {
    QuranStateBlock(title = title, message = message, icon = icon, tint = AppColor.textMuted, modifier = modifier)
}

@Composable
fun QuranErrorState(
    title: String,
    modifier: Modifier = Modifier,
    message: String? = null
) {
    QuranStateBlock(title = title, message = message, icon = Icons.Default.ErrorOutline, tint = AppColor.danger, modifier = modifier)
}

@Composable
fun QuranOfflineState(
    title: String,
    modifier: Modifier = Modifier,
    message: String? = null
) {
    QuranStateBlock(title = title, message = message, icon = Icons.Default.CloudOff, tint = AppColor.info, modifier = modifier)
}

@Composable
private fun QuranStateBlock(
    title: String,
    message: String?,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = AppSpacing.xxxl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(AppSpacing.md)
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(AppIcon.xl))
        Text(title, style = AppTextStyle.body.copy(fontWeight = FontWeight.Bold), color = AppColor.primaryText, textAlign = TextAlign.Center)
        if (!message.isNullOrBlank()) {
            Text(message, style = AppTextStyle.bodySmall, color = AppColor.textMuted, textAlign = TextAlign.Center)
        }
    }
}
