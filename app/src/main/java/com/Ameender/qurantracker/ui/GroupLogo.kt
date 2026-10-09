package com.Ameender.qurantracker.ui

import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mosque
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.Ameender.qurantracker.data.SupabaseService
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch

/** Shared group identity, deliberately separate from a member's group profile avatar. */
@Composable
internal fun GroupLogo(
    code: String,
    canEdit: Boolean,
    text: AppStrings,
    size: Dp = 76.dp,
    loadLogo: suspend (String) -> String? = SupabaseService::loadGroupLogo
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var url by remember(code) { mutableStateOf<String?>(null) }
    var loading by remember(code) { mutableStateOf(true) }
    var dialog by remember(code) { mutableStateOf(false) }
    var saving by remember(code) { mutableStateOf(false) }
    var pending by remember(code) { mutableStateOf<ByteArray?>(null) }
    var pendingUri by remember(code) { mutableStateOf<String?>(null) }
    var mime by remember(code) { mutableStateOf("image/jpeg") }
    var removing by remember(code) { mutableStateOf(false) }
    var error by remember(code) { mutableStateOf<String?>(null) }
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(code) {
        try { url = loadLogo(code) }
        catch (e: Exception) { if (e is CancellationException) throw e; error = text.t("groups.logo.loadError") }
        finally { loading = false }
    }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) scope.launch {
            saving = true
            try {
                val selected = withContext(Dispatchers.IO) {
                    val type = context.contentResolver.getType(uri)?.lowercase().orEmpty()
                    require(type in setOf("image/jpeg", "image/png", "image/webp")) { text.t("groups.profile.typeError") }
                    val bytes = context.contentResolver.openInputStream(uri)?.use { input ->
                        val output = java.io.ByteArrayOutputStream()
                        val buffer = ByteArray(8192)
                        while (true) {
                            val count = input.read(buffer)
                            if (count < 0) break
                            require(output.size() + count <= 5 * 1024 * 1024) { text.t("groups.profile.sizeError") }
                            output.write(buffer, 0, count)
                        }
                        output.toByteArray()
                    }
                        ?: error(text.t("groups.profile.readError"))
                    require(bytes.isNotEmpty() && bytes.size <= 5 * 1024 * 1024) { text.t("groups.profile.sizeError") }
                    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
                    require(bounds.outWidth > 0 && bounds.outHeight > 0 && bounds.outWidth.toLong() * bounds.outHeight <= 50_000_000) {
                        text.t("groups.profile.readError")
                    }
                    bytes to type
                }
                pending = selected.first; mime = selected.second; pendingUri = uri.toString(); removing = false; error = null
            } catch (e: Exception) { if (e is CancellationException) throw e; error = e.localizedMessage }
            finally { saving = false }
        }
    }
    Box {
        Box(Modifier.size(size).clip(RoundedCornerShape(size * 0.28f)).background(GoldSurface)
            .then(if (canEdit) Modifier.clickable(enabled = !loading) {
                pending = null; pendingUri = null; removing = false; dialog = true
            } else Modifier),
            contentAlignment = Alignment.Center) {
            Icon(Icons.Default.Mosque, text.t("groups.logo.title"), tint = Gold, modifier = Modifier.size(size * 0.52f))
            if (url != null) AsyncImage(url, text.t("groups.logo.title"),
                Modifier.fillMaxSize().testTag("group_logo_$code"), contentScale = ContentScale.Crop)
            if (loading) CircularProgressIndicator(Modifier.size(24.dp), color = Gold, strokeWidth = 2.dp)
        }
        SnackbarHost(snackbar, Modifier.widthIn(max = 280.dp))
    }
    if (dialog) AlertDialog(
        onDismissRequest = { if (!saving) dialog = false },
        containerColor = MidNavy,
        title = { Text(text.t("groups.logo.edit"), color = GoldLight) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Box(Modifier.size(140.dp).clip(RoundedCornerShape(24.dp)).background(GoldSurface), contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.Mosque, null, tint = Gold, modifier = Modifier.size(56.dp))
                    if (!removing && (pendingUri ?: url) != null) AsyncImage(pendingUri ?: url, text.t("groups.logo.title"),
                        Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                }
                Text(text.t("groups.logo.hint"), color = SoftTextGold)
                TextButton(enabled = !saving, onClick = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }) {
                    Text(text.t("groups.logo.choose"), color = Gold)
                }
                if (url != null) TextButton(enabled = !saving, onClick = { pending = null; pendingUri = null; removing = true; error = null }) {
                    Text(text.t("groups.logo.remove"), color = DeleteRed)
                }
                error?.let { Text(it, color = DeleteRed) }
                if (saving) LinearProgressIndicator(Modifier.fillMaxWidth(), color = Gold)
            }
        },
        confirmButton = {
            TextButton(enabled = !saving && (pending != null || removing), onClick = {
                scope.launch {
                    saving = true; error = null
                    try {
                        SupabaseService.setGroupLogo(code, if (removing) null else pending, mime)
                        url = loadLogo(code)
                        dialog = false
                        snackbar.showSnackbar(text.t("groups.logo.saved"))
                    } catch (e: Exception) { if (e is CancellationException) throw e; error = text.t("groups.logo.saveError") }
                    finally { saving = false }
                }
            }) { Text(text.save, color = Gold) }
        },
        dismissButton = { TextButton(enabled = !saving, onClick = { dialog = false }) { Text(text.groupForm.back, color = MutedGold) } }
    )
}
