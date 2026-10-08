package com.Ameender.qurantracker.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.R

/** Original transparent wordmark without a surrounding card or background. */
@Composable
internal fun WirdnaBrand(modifier: Modifier = Modifier) {
    Image(painterResource(R.drawable.wirdna_wordmark), contentDescription = "WIRDNA",
        contentScale = ContentScale.Fit,
        modifier = modifier.widthIn(max = 256.dp).fillMaxWidth().aspectRatio(3f))
}
