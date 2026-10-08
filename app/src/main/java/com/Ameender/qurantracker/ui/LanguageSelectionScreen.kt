package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.data.AppLanguage

@Composable
fun LanguageSelectionScreen(
    language: AppLanguage,
    onSelect: (AppLanguage) -> Unit,
    onContinue: () -> Unit
) {
    val text = AppText.strings(language.code)
    Surface(color = AppColor.background, modifier = Modifier.fillMaxSize()) {
        Box(Modifier.safeDrawingPadding(), contentAlignment = Alignment.Center) {
            Column(
                Modifier.widthIn(max = 480.dp).fillMaxWidth()
                    .verticalScroll(rememberScrollState()).padding(AppSpacing.screen),
                verticalArrangement = Arrangement.spacedBy(AppSpacing.section)
            ) {
                WirdnaBrand(Modifier.align(Alignment.CenterHorizontally))
                Text(text.t("onboarding.language.title"), style = AppTextStyle.pageTitle,
                    color = AppColor.textPrimary, modifier = Modifier.semantics { heading() })
                Text(text.t("onboarding.language.description"), style = AppTextStyle.body,
                    color = AppColor.textSecondary)
                Column(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(AppSpacing.md)) {
                    AppLanguage.entries.forEach { option ->
                        val selected = option == language
                        Surface(
                            shape = RoundedCornerShape(AppShape.control),
                            color = AppColor.surface,
                            border = BorderStroke(if (selected) AppBorder.selected else AppBorder.thin,
                                if (selected) AppColor.primary else AppColor.border)
                        ) {
                            Row(
                                Modifier.fillMaxWidth().heightIn(min = 56.dp)
                                    .testTag("language_${option.code}")
                                    .selectable(selected, role = Role.RadioButton, onClick = { onSelect(option) })
                                    .padding(horizontal = AppSpacing.card, vertical = AppSpacing.md),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(AppSpacing.list)
                            ) {
                                Text(option.nativeName, style = AppTextStyle.sectionTitle,
                                    color = AppColor.textPrimary, modifier = Modifier.weight(1f))
                                RadioButton(selected = selected, onClick = null,
                                    colors = RadioButtonDefaults.colors(selectedColor = AppColor.primary))
                            }
                        }
                    }
                }
                QuranPrimaryButton(text.t("onboarding.language.continue"), onContinue,
                    modifier = Modifier.fillMaxWidth().testTag("language_continue"))
            }
        }
    }
}
