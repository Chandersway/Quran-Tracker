package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogProperties
import com.Ameender.qurantracker.data.AccountManagementPolicy as Policy
import com.Ameender.qurantracker.data.SupabaseService
import com.Ameender.qurantracker.data.ProfileAvatarService
import com.Ameender.qurantracker.data.UserAccount
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch

internal fun accountManagementText(language: String, key: String): String {
    val values = when (key) {
        "title" -> listOf("Accountbeheer", "Account management", "Gestion du compte", "إدارة الحساب")
        "subtitle" -> listOf("Beveiliging en inloggegevens", "Security and sign-in details", "Sécurité et connexion", "الأمان وبيانات الدخول")
        "password" -> listOf("Wachtwoord wijzigen", "Change password", "Modifier le mot de passe", "تغيير كلمة المرور")
        "email" -> listOf("E-mailadres wijzigen", "Change email address", "Modifier l’adresse e-mail", "تغيير البريد الإلكتروني")
        "delete" -> listOf("Account verwijderen", "Delete account", "Supprimer le compte", "حذف الحساب")
        "forgot" -> listOf("Wachtwoord vergeten?", "Forgot password?", "Mot de passe oublié ?", "نسيت كلمة المرور؟")
        "reset" -> listOf("Herstellink versturen", "Send recovery link", "Envoyer le lien", "إرسال رابط الاستعادة")
        "save" -> listOf("Opslaan", "Save", "Enregistrer", "حفظ")
        "cancel" -> listOf("Annuleren", "Cancel", "Annuler", "إلغاء")
        "done" -> listOf("Gereed", "Done", "Terminé", "تم")
        "currentPassword" -> listOf("Huidig wachtwoord", "Current password", "Mot de passe actuel", "كلمة المرور الحالية")
        "newPassword" -> listOf("Nieuw wachtwoord", "New password", "Nouveau mot de passe", "كلمة المرور الجديدة")
        "repeatPassword" -> listOf("Herhaal nieuw wachtwoord", "Confirm new password", "Confirmer le mot de passe", "تأكيد كلمة المرور الجديدة")
        "passwordHelp" -> listOf("Gebruik 12–128 tekens. Een lange, unieke wachtzin werkt goed.", "Use 12–128 characters. A long, unique passphrase works well.", "Utilisez 12 à 128 caractères et une phrase secrète unique.", "استخدم من 12 إلى 128 حرفًا وعبارة مرور طويلة وفريدة.")
        "mismatch" -> listOf("De wachtwoorden komen niet overeen.", "The passwords do not match.", "Les mots de passe ne correspondent pas.", "كلمتا المرور غير متطابقتين.")
        "newEmail" -> listOf("Nieuw e-mailadres", "New email address", "Nouvelle adresse e-mail", "البريد الإلكتروني الجديد")
        "emailLabel" -> listOf("E-mailadres", "Email address", "Adresse e-mail", "البريد الإلكتروني")
        "emailHelp" -> listOf("Je nieuwe adres wordt pas actief na bevestiging. Controleer je huidige én nieuwe inbox.", "Your new address becomes active after confirmation. Check both your current and new inbox.", "La nouvelle adresse sera active après confirmation. Vérifiez les deux boîtes de réception.", "يُفعّل البريد الجديد بعد التأكيد. تحقق من بريدك الحالي والجديد.")
        "invalidEmail" -> listOf("Vul een geldig, ander e-mailadres in.", "Enter a valid, different email address.", "Saisissez une autre adresse e-mail valide.", "أدخل بريدًا إلكترونيًا صالحًا ومختلفًا.")
        "resetHelp" -> listOf("Vul het e-mailadres van je account in. Open de herstellink op deze telefoon.", "Enter your account email. Open the recovery link on this phone.", "Saisissez l’adresse du compte. Ouvrez le lien sur ce téléphone.", "أدخل بريد حسابك وافتح رابط الاستعادة على هذا الهاتف.")
        "resetSent" -> listOf("Als er een account met dit adres bestaat, ontvang je een herstellink. Controleer ook je spammap.", "If an account exists for this address, you will receive a recovery link. Check spam too.", "Si un compte existe, vous recevrez un lien. Vérifiez aussi les courriers indésirables.", "إذا وُجد حساب بهذا البريد فستصلك رسالة استعادة. تحقق من الرسائل غير المرغوب فيها.")
        "passwordSaved" -> listOf("Je wachtwoord is gewijzigd.", "Your password has been changed.", "Votre mot de passe a été modifié.", "تم تغيير كلمة المرور.")
        "emailSent" -> listOf("De wijziging is aangevraagd. Volg de bevestigingsmail(s); tot die tijd blijft je huidige adres zichtbaar.", "Change requested. Follow the confirmation email(s); your current address remains visible until then.", "Modification demandée. Suivez les e-mails de confirmation ; l’adresse actuelle reste affichée en attendant.", "تم طلب التغيير. اتبع رسائل التأكيد؛ سيظل بريدك الحالي ظاهرًا حتى التأكيد.")
        "google" -> listOf("Je logt in met Google. Beheer je Google-wachtwoord en e-mailadres bij Google.", "You sign in with Google. Manage your Google password and email with Google.", "Connexion Google : gérez votre mot de passe et votre adresse auprès de Google.", "تسجّل الدخول عبر Google. أدر كلمة مرور Google وبريدك من حساب Google.")
        "googleStatus" -> listOf("Ingelogd met Google", "Signed in with Google", "Connecté avec Google", "تم الدخول عبر Google")
        "emailStatus" -> listOf("Ingelogd met e-mail", "Signed in with email", "Connecté par e-mail", "تم الدخول بالبريد الإلكتروني")
        "deleteHelp" -> listOf("Deze actie is definitief. Je online account en gekoppelde persoonlijke gegevens worden verwijderd. Je lokale leesvoortgang, notities en downloads op deze telefoon blijven behouden.", "This is permanent. Your online account and linked personal data will be deleted. Local reading progress, notes and downloads on this phone are kept.", "Action définitive : votre compte en ligne et ses données personnelles seront supprimés. Votre progression, vos notes et téléchargements locaux seront conservés.", "هذا الإجراء نهائي. سيُحذف حسابك وبياناته الشخصية على الإنترنت. سيُحتفظ بتقدم القراءة والملاحظات والتنزيلات المحلية على هذا الهاتف.")
        "confirmEmail" -> listOf("Typ je huidige e-mailadres ter bevestiging", "Type your current email to confirm", "Saisissez votre adresse actuelle pour confirmer", "اكتب بريدك الحالي للتأكيد")
        "checking" -> listOf("Veiligheidscontrole…", "Checking eligibility…", "Vérification…", "جارٍ التحقق…")
        "notReady" -> listOf("Account verwijderen is nog niet beschikbaar op de server. Er is niets verwijderd.", "Account deletion is not yet available on the server. Nothing was deleted.", "La suppression n’est pas encore disponible sur le serveur. Rien n’a été supprimé.", "حذف الحساب غير متاح على الخادم بعد. لم يُحذف شيء.")
        "ownedGroups" -> listOf("Draag eerst het eigenaarschap van je groepen over. Groepen van anderen worden niet verwijderd.", "Transfer ownership of your groups first. Other people's groups will not be deleted.", "Transférez d’abord la propriété de vos groupes. Les groupes des autres ne seront pas supprimés.", "انقل ملكية مجموعاتك أولًا. لن تُحذف مجموعات الآخرين.")
        "linkedData" -> listOf("Er zijn nog gekoppelde groepsbijdragen of uploads. Voor veilige verwijdering is eerst afhandeling door de beheerder nodig. Er is niets verwijderd.", "Group contributions or uploads are still linked. An administrator must handle them before safe deletion. Nothing was deleted.", "Des contributions ou fichiers sont encore liés. Un administrateur doit les traiter avant suppression. Rien n’a été supprimé.", "ما زالت هناك مساهمات أو ملفات مرتبطة. يجب على المسؤول معالجتها أولًا للحذف الآمن. لم يُحذف شيء.")
        "recentLogin" -> listOf("Log voor deze actie opnieuw in en probeer het binnen vijf minuten opnieuw.", "Sign in again, then retry within five minutes.", "Reconnectez-vous puis réessayez dans les cinq minutes.", "سجّل الدخول مجددًا ثم أعد المحاولة خلال خمس دقائق.")
        "deleted" -> listOf("Je online account is verwijderd. Lokale leesgegevens zijn behouden.", "Your online account was deleted. Local reading data was kept.", "Votre compte en ligne a été supprimé. Les données locales sont conservées.", "حُذف حسابك على الإنترنت مع الاحتفاظ ببيانات القراءة المحلية.")
        "wrongPassword" -> listOf("Het huidige wachtwoord klopt niet.", "The current password is incorrect.", "Le mot de passe actuel est incorrect.", "كلمة المرور الحالية غير صحيحة.")
        "rateLimit" -> listOf("Te veel pogingen. Wacht even voordat je opnieuw probeert.", "Too many attempts. Wait before trying again.", "Trop de tentatives. Patientez avant de réessayer.", "محاولات كثيرة. انتظر قبل المحاولة مجددًا.")
        "error" -> listOf("Dit kon niet worden afgerond. Controleer je verbinding en probeer opnieuw.", "Unable to complete this. Check your connection and retry.", "Impossible de terminer. Vérifiez la connexion et réessayez.", "تعذر إتمام العملية. تحقق من الاتصال وحاول مجددًا.")
        "passwordRejected" -> listOf("Dit wachtwoord is niet toegestaan of is hetzelfde als je huidige wachtwoord. Kies een ander, sterk wachtwoord.", "This password is not allowed or matches your current password. Choose a different strong password.", "Mot de passe refusé ou identique à l’actuel. Choisissez-en un autre, robuste.", "كلمة المرور غير مسموحة أو مطابقة للحالية. اختر كلمة قوية ومختلفة.")
        "code" -> listOf("Bevestigingscode", "Confirmation code", "Code de confirmation", "رمز التأكيد")
        "sendCode" -> listOf("Bevestigingscode versturen", "Send confirmation code", "Envoyer le code", "إرسال رمز التأكيد")
        "codeHelp" -> listOf("Extra bevestiging nodig. Vraag een code aan en vul de code uit je e-mail in.", "Extra confirmation required. Request a code and enter it from your email.", "Confirmation supplémentaire requise. Demandez puis saisissez le code reçu par e-mail.", "يلزم تأكيد إضافي. اطلب رمزًا وأدخله من بريدك الإلكتروني.")
        "codeSent" -> listOf("Bevestigingscode verstuurd. Controleer je e-mail.", "Confirmation code sent. Check your email.", "Code envoyé. Vérifiez votre e-mail.", "أُرسل رمز التأكيد. تحقق من بريدك.")
        "visibility" -> listOf("Wachtwoord tonen/verbergen", "Show/hide password", "Afficher/masquer le mot de passe", "إظهار/إخفاء كلمة المرور")
        else -> listOf(key, key, key, key)
    }
    return values[when (language) { "en" -> 1; "fr" -> 2; "ar" -> 3; else -> 0 }]
}

private enum class AccountAction { PASSWORD, EMAIL, RESET, DELETE, RECOVERY }

@Composable
internal fun AccountManagementPanel(account: UserAccount?, email: String, language: String, enabled: Boolean) {
    var action by remember { mutableStateOf<AccountAction?>(null) }
    val isGoogle = account?.provider.equals("google", true)
    fun t(key: String) = accountManagementText(language, key)
    HorizontalDivider(color = BorderNavy, modifier = Modifier.padding(vertical = 8.dp))
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(t("title"), color = GoldLight, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text(t("subtitle"), color = MutedGold, fontSize = 12.sp)
        if (isGoogle) Text(t("google"), color = MutedGold, fontSize = 12.sp)
        for ((value, title) in listOf(AccountAction.PASSWORD to "password", AccountAction.EMAIL to "email", AccountAction.DELETE to "delete")) {
            val destructive = value == AccountAction.DELETE
            OutlinedButton(
                onClick = { action = value },
                enabled = enabled && account != null && (destructive || !isGoogle),
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, if (destructive) MaterialTheme.colorScheme.error else BorderNavy),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = if (destructive) MaterialTheme.colorScheme.error else GoldLight)
            ) {
                Icon(if (destructive) Icons.Default.DeleteOutline else if (value == AccountAction.EMAIL) Icons.Default.Email else Icons.Default.Lock, null, Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text(t(title), modifier = Modifier.weight(1f))
            }
        }
    }
    action?.let { AccountActionDialog(it, email, language, isGoogle) { action = null } }
}

@Composable
internal fun ForgotPasswordButton(email: String, language: String, enabled: Boolean) {
    var open by remember { mutableStateOf(false) }
    TextButton(onClick = { open = true }, enabled = enabled, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
        Text(accountManagementText(language, "forgot"), color = GoldLight)
    }
    if (open) AccountActionDialog(AccountAction.RESET, email, language, false) { open = false }
}

@Composable
fun AccountRecoveryHost(language: String) {
    val recovery by SupabaseService.passwordRecovery.collectAsState()
    if (recovery) AccountActionDialog(AccountAction.RECOVERY, "", language, false) { SupabaseService.dismissPasswordRecovery() }
}

@Composable
private fun AccountActionDialog(action: AccountAction, email: String, language: String, isGoogle: Boolean, onDismiss: () -> Unit) {
    fun t(key: String) = accountManagementText(language, key)
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    // Deliberately not rememberSaveable: credentials must not enter saved-instance state.
    var current by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmation by remember { mutableStateOf("") }
    var address by remember { mutableStateOf(if (action == AccountAction.RESET) email else "") }
    var nonce by remember { mutableStateOf("") }
    var needsCode by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var success by remember { mutableStateOf<String?>(null) }
    var info by remember { mutableStateOf<String?>(null) }
    var deletionStatus by remember { mutableStateOf("checking") }
    val isPassword = action == AccountAction.PASSWORD || action == AccountAction.RECOVERY
    val title = when (action) { AccountAction.PASSWORD, AccountAction.RECOVERY -> "password"; AccountAction.EMAIL -> "email"; AccountAction.RESET -> "forgot"; AccountAction.DELETE -> "delete" }
    LaunchedEffect(action) {
        if (action == AccountAction.DELETE) {
            deletionStatus = try { SupabaseService.accountDeletionStatus() } catch (e: Exception) {
                if (e is CancellationException) throw e
                "unavailable"
            }
        }
    }
    val valid = when (action) {
        AccountAction.PASSWORD -> current.isNotBlank() && Policy.matchingPasswords(password, confirmation) && (!needsCode || nonce.isNotBlank())
        AccountAction.RECOVERY -> Policy.matchingPasswords(password, confirmation)
        AccountAction.EMAIL -> current.isNotBlank() && Policy.changedEmail(email, address)
        AccountAction.RESET -> Policy.validEmail(address)
        AccountAction.DELETE -> deletionStatus == "ready" && Policy.deletionConfirmed(email, address) && (isGoogle || current.isNotBlank())
    }
    fun submit() {
        if (busy || !valid) return
        busy = true; error = null; info = null
        scope.launch {
            try {
                when (action) {
                    AccountAction.PASSWORD -> SupabaseService.changeAccountPassword(current, password, nonce)
                    AccountAction.RECOVERY -> SupabaseService.completePasswordRecovery(password)
                    AccountAction.EMAIL -> SupabaseService.changeAccountEmail(current, address)
                    AccountAction.RESET -> SupabaseService.requestPasswordReset(address)
                    AccountAction.DELETE -> {
                        SupabaseService.deleteOwnAccount(address, current)
                        ProfileAvatarService.clearCachedProfile(context, email)
                    }
                }
                current = ""; password = ""; confirmation = ""; nonce = ""
                success = t(when (action) { AccountAction.PASSWORD, AccountAction.RECOVERY -> "passwordSaved"; AccountAction.EMAIL -> "emailSent"; AccountAction.RESET -> "resetSent"; AccountAction.DELETE -> "deleted" })
            } catch (e: Exception) {
                if (e is CancellationException) throw e
                val reason = e.message.orEmpty().lowercase()
                val key = when {
                    "reauthentication" in reason || "nonce" in reason -> { needsCode = true; "codeHelp" }
                    "invalid_credentials" in reason || "invalid login" in reason -> "wrongPassword"
                    "weak_password" in reason || "same_password" in reason -> "passwordRejected"
                    "recent_login_required" in reason -> "recentLogin"
                    "owns_groups" in reason -> "ownedGroups"
                    "linked_data" in reason || "foreign key" in reason -> "linkedData"
                    "pgrst202" in reason || "42883" in reason -> "notReady"
                    "429" in reason || "rate_limit" in reason || "over_email_send" in reason -> "rateLimit"
                    else -> "error"
                }
                error = t(key)
            } finally { busy = false }
        }
    }
    AlertDialog(
        onDismissRequest = { if (!busy) onDismiss() },
        properties = DialogProperties(dismissOnBackPress = !busy, dismissOnClickOutside = false),
        containerColor = MidNavy,
        titleContentColor = GoldLight,
        textContentColor = SoftTextGold,
        title = { Text(t(title)) },
        text = {
            Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (success != null) Text(success!!) else {
                    Text(t(when (action) { AccountAction.PASSWORD, AccountAction.RECOVERY -> "passwordHelp"; AccountAction.EMAIL -> "emailHelp"; AccountAction.RESET -> "resetHelp"; AccountAction.DELETE -> "deleteHelp" }))
                    if (action == AccountAction.DELETE) {
                        val statusKey = when (deletionStatus) { "ready" -> if (isGoogle) "recentLogin" else null; "checking" -> "checking"; "owns_groups" -> "ownedGroups"; "linked_data" -> "linkedData"; else -> "notReady" }
                        statusKey?.let { Text(t(it), color = MutedGold) }
                        Text(email, fontWeight = FontWeight.Bold)
                    }
                    if (action == AccountAction.EMAIL || action == AccountAction.RESET || action == AccountAction.DELETE) {
                        OutlinedTextField(
                            value = address, onValueChange = { address = it; error = null }, enabled = !busy,
                            label = { Text(t(if (action == AccountAction.DELETE) "confirmEmail" else if (action == AccountAction.EMAIL) "newEmail" else "emailLabel")) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), singleLine = true, modifier = Modifier.fillMaxWidth(),
                            isError = action == AccountAction.EMAIL && address.isNotEmpty() && !Policy.changedEmail(email, address)
                        )
                        if (action == AccountAction.EMAIL && address.isNotEmpty() && !Policy.changedEmail(email, address)) Text(t("invalidEmail"), color = MaterialTheme.colorScheme.error)
                    }
                    if (action == AccountAction.PASSWORD || action == AccountAction.EMAIL || (action == AccountAction.DELETE && !isGoogle)) {
                        AccountPasswordField(current, { current = it; error = null }, t("currentPassword"), language, !busy)
                    }
                    if (isPassword) {
                        AccountPasswordField(password, { password = it; error = null }, t("newPassword"), language, !busy)
                        AccountPasswordField(confirmation, { confirmation = it; error = null }, t("repeatPassword"), language, !busy)
                        if (confirmation.isNotEmpty() && confirmation != password) Text(t("mismatch"), color = MaterialTheme.colorScheme.error)
                    }
                    if (needsCode && action == AccountAction.PASSWORD) {
                        OutlinedTextField(value = nonce, onValueChange = { nonce = it }, enabled = !busy, singleLine = true, label = { Text(t("code")) }, modifier = Modifier.fillMaxWidth())
                        TextButton(enabled = !busy, onClick = {
                            busy = true
                            scope.launch {
                                try { SupabaseService.requestPasswordChangeCode(); info = t("codeSent") }
                                catch (e: Exception) { if (e is CancellationException) throw e; error = t("error") }
                                finally { busy = false }
                            }
                        }) { Text(t("sendCode")) }
                    }
                    info?.let { Text(it, color = GoldLight) }
                    error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    if (busy) LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = Gold)
                }
            }
        },
        confirmButton = {
            if (success != null) TextButton(onClick = onDismiss) { Text(t("done")) }
            else Button(enabled = valid && !busy, onClick = ::submit, colors = ButtonDefaults.buttonColors(containerColor = if (action == AccountAction.DELETE) MaterialTheme.colorScheme.error else Gold)) {
                Text(t(if (action == AccountAction.RESET) "reset" else if (action == AccountAction.DELETE) "delete" else "save"))
            }
        },
        dismissButton = { if (success == null) TextButton(enabled = !busy, onClick = onDismiss) { Text(t("cancel")) } }
    )
}

@Composable
private fun AccountPasswordField(value: String, onChange: (String) -> Unit, label: String, language: String, enabled: Boolean) {
    var visible by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = value, onValueChange = onChange, enabled = enabled, label = { Text(label) }, singleLine = true,
        modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        visualTransformation = if (visible) VisualTransformation.None else PasswordVisualTransformation(),
        trailingIcon = { IconButton(onClick = { visible = !visible }, enabled = enabled) {
            Icon(if (visible) Icons.Default.VisibilityOff else Icons.Default.Visibility, accountManagementText(language, "visibility"))
        } }
    )
}
