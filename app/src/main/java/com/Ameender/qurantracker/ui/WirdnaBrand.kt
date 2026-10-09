package com.Ameender.qurantracker.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.R

/** Book symbol and app name without a surrounding card or background. */
@Composable
internal fun WirdnaBrand(modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.widthIn(max = 300.dp).fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally)
    ) {
        Image(painterResource(R.drawable.wirdna_symbol), contentDescription = null,
            contentScale = ContentScale.Fit, modifier = Modifier.size(64.dp))
        Text("Quran Tracker", modifier = Modifier.weight(1f, fill = false),
            fontFamily = FontFamily.Serif, fontWeight = FontWeight.SemiBold,
            fontSize = 25.sp, lineHeight = 30.sp, textAlign = TextAlign.Start,
            color = MaterialTheme.colorScheme.onBackground)
    }
}
