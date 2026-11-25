export type AccountCopy = {
  title: string;
  subtitle: string;
  signedIn: string;
  signedOut: string;
  email: string;
  password: string;
  repeatSignupPassword: string;
  name: string;
  signIn: string;
  signUp: string;
  create: string;
  forgot: string;
  reset: string;
  signOut: string;
  account: string;
  manage: string;
  changePassword: string;
  changeEmail: string;
  deleteAccount: string;
  emailProvider: string;
  googleProvider: string;
  appleProvider: string;
  appleLoginFailed: string;
  appleDeleteHelp: string;
  appleDeleteFailed: string;
  appleDeleteRequiresIos: string;
  appleManualRevocation: string;
  appleRevocationInstructions: string;
  resetHelp: string;
  emailHelp: string;
  passwordHelp: string;
  deletionHelp: string;
  confirmation: string;
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
  newEmail: string;
  save: string;
  cancel: string;
  done: string;
  busy: string;
  emailInvalid: string;
  emailDifferent: string;
  passwordMismatch: string;
  passwordLength: string;
  resetSent: string;
  emailSent: string;
  passwordChanged: string;
  deleted: string;
  deletionChecking: string;
  deletionBlocked: string;
  deletionLinkedData: string;
  deletionNotReady: string;
  wrongPassword: string;
  emailUnconfirmed: string;
  resendConfirmation: string;
  confirmationSent: string;
  recentLogin: string;
  rateLimit: string;
  genericError: string;
  noBackend: string;
  passwordVisibility: string;
  enterCode: string;
  sendCode: string;
  codeSent: string;
  codeHelp: string;
  recovery: string;
  recoveryHelp: string;
  profile: string;
  profileName: string;
  saveProfile: string;
  avatar: string;
  profileSaved: string;
  avatarSaved: string;
};
export const accountCopy: Record<'en' | 'nl' | 'ar', AccountCopy> = {
  en: {
    title: 'Account',
    subtitle: 'Keep your sign-in details in order.',
    signedIn: 'Signed in',
    signedOut: 'Your reading stays on this device until you sign in.',
    email: 'Email address',
    password: 'Password',
    repeatSignupPassword: 'Repeat password',
    name: 'Display name (optional)',
    signIn: 'Sign in',
    emailUnconfirmed:
      'Confirm your email before signing in. Open the confirmation link in your inbox or spam folder. You can request a new confirmation email below.',
    resendConfirmation: 'Resend confirmation email',
    confirmationSent:
      'A new confirmation email was requested. Check your inbox and spam folder, then open the link to confirm your email.',
    signUp: 'Create account',
    create: 'Create account',
    forgot: 'Forgot password?',
    reset: 'Send recovery link',
    signOut: 'Sign out',
    account: 'Account details',
    manage: 'Security and account access',
    changePassword: 'Change password',
    changeEmail: 'Change email address',
    deleteAccount: 'Delete online account',
    emailProvider: 'Email and password',
    googleProvider: 'Google account',
    appleProvider: 'Apple account',
    appleLoginFailed: 'Sign in with Apple could not be completed. Please try again.',
    appleDeleteHelp:
      'Confirm with Apple on this iPhone or iPad to revoke Apple access and delete your online account.',
    appleDeleteFailed:
      'Apple access and account deletion could not be completed. Your account has not been confirmed deleted. Please try again.',
    appleDeleteRequiresIos:
      'This device cannot revoke Apple access automatically. After account deletion, revoke access in your Apple account settings. A recent sign-in is required; use an existing linked sign-in method or sign in on iPhone or iPad first.',
    appleManualRevocation:
      'Your online account was deleted. Also remove Wirdna from Sign in with Apple in your Apple account settings. Local reading data was kept.',
    appleRevocationInstructions: 'Apple access removal instructions',
    resetHelp:
      'Enter the address on your account. Open the recovery link on this device. If an account exists, we will send a message.',
    emailHelp:
      'Your address changes only after you confirm the message sent to your current and new inboxes.',
    passwordHelp: 'Use a long, unique passphrase between 12 and 128 characters.',
    deletionHelp:
      'This permanently deletes your online account and linked personal data. Local reading progress, notes, and downloads stay on this device.',
    confirmation: 'Type your current email to confirm',
    currentPassword: 'Current password',
    newPassword: 'New password',
    repeatPassword: 'Repeat new password',
    newEmail: 'New email address',
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',
    busy: 'Working…',
    emailInvalid: 'Enter a valid email address.',
    emailDifferent: 'Enter a different email address.',
    passwordMismatch: 'The passwords do not match.',
    passwordLength: 'Use 12 to 128 characters.',
    resetSent:
      'If an account exists for that address, a recovery link is on its way. Check spam too.',
    emailSent:
      'Change requested. Follow the confirmation messages. Your current email stays active until then.',
    passwordChanged: 'Your password has been changed.',
    deleted: 'Your online account was deleted. Local reading data was kept.',
    deletionChecking: 'Checking whether this account can be deleted…',
    deletionBlocked: 'Group ownership must be transferred first. Nothing was deleted.',
    deletionLinkedData: 'Some linked online data must be removed first. Nothing was deleted.',
    deletionNotReady: 'Account deletion is not available on the server. Nothing was deleted.',
    wrongPassword: 'The current password is incorrect.',
    recentLogin: 'Sign in again, then retry within five minutes.',
    rateLimit: 'Too many attempts. Wait before trying again.',
    genericError: 'Could not complete this. Check your connection and try again.',
    noBackend: 'Account services are not configured yet. Local reading is still available.',
    passwordVisibility: 'Show or hide password',
    enterCode: 'Confirmation code',
    sendCode: 'Send confirmation code',
    codeSent: 'Code sent. Check your email.',
    codeHelp: 'Extra confirmation is required. Request a code and enter it from your email.',
    recovery: 'Choose a new password',
    recoveryHelp: 'Your recovery link is verified. Set a new password for your account.',
    profile: 'Community profile',
    profileName: 'Name shown to other readers',
    saveProfile: 'Save profile',
    avatar: 'Choose profile photo',
    profileSaved: 'Your profile was saved.',
    avatarSaved: 'Your profile photo was updated.',
  },
  nl: {
    title: 'Account',
    subtitle: 'Houd je inloggegevens op orde.',
    signedIn: 'Ingelogd',
    signedOut: 'Je leesgegevens blijven op dit apparaat totdat je inlogt.',
    email: 'E-mailadres',
    password: 'Wachtwoord',
    repeatSignupPassword: 'Wachtwoord herhalen',
    name: 'Weergavenaam (optioneel)',
    signIn: 'Inloggen',
    emailUnconfirmed:
      'Bevestig je e-mailadres voordat je inlogt. Open de bevestigingslink in je inbox of spammap. Hieronder kun je een nieuwe bevestigingsmail aanvragen.',
    resendConfirmation: 'Bevestigingsmail opnieuw versturen',
    confirmationSent:
      'Er is een nieuwe bevestigingsmail aangevraagd. Controleer je inbox en spammap en open de link om je e-mailadres te bevestigen.',
    signUp: 'Account aanmaken',
    create: 'Account aanmaken',
    forgot: 'Wachtwoord vergeten?',
    reset: 'Herstellink versturen',
    signOut: 'Uitloggen',
    account: 'Accountgegevens',
    manage: 'Beveiliging en accounttoegang',
    changePassword: 'Wachtwoord wijzigen',
    changeEmail: 'E-mailadres wijzigen',
    deleteAccount: 'Online account verwijderen',
    emailProvider: 'E-mail en wachtwoord',
    googleProvider: 'Google-account',
    appleProvider: 'Apple-account',
    appleLoginFailed: 'Inloggen met Apple is niet gelukt. Probeer het opnieuw.',
    appleDeleteHelp:
      'Bevestig met Apple op deze iPhone of iPad om de Apple-toegang in te trekken en je online account te verwijderen.',
    appleDeleteFailed:
      'De Apple-toegang en accountverwijdering konden niet worden afgerond. Het account is niet bevestigd verwijderd. Probeer het opnieuw.',
    appleDeleteRequiresIos:
      'Dit apparaat kan Apple-toegang niet automatisch intrekken. Trek na accountverwijdering ook de toegang in via je Apple-accountinstellingen. Je moet recent ingelogd zijn: gebruik een al gekoppelde inlogmethode of log eerst in op iPhone of iPad.',
    appleManualRevocation:
      'Je online account is verwijderd. Verwijder Wirdna ook bij Inloggen met Apple in je Apple-accountinstellingen. Lokale leesgegevens zijn behouden.',
    appleRevocationInstructions: 'Uitleg Apple-toegang intrekken',
    resetHelp:
      'Vul het e-mailadres van je account in. Open de herstellink op dit apparaat. Als er een account bestaat, sturen we een bericht.',
    emailHelp:
      'Je adres verandert pas nadat je de berichten in je huidige en nieuwe inbox hebt bevestigd.',
    passwordHelp: 'Gebruik een lange, unieke wachtzin van 12 tot 128 tekens.',
    deletionHelp:
      'Je online account en gekoppelde persoonsgegevens worden definitief verwijderd. Leesvoortgang, notities en downloads op dit apparaat blijven behouden.',
    confirmation: 'Typ je huidige e-mailadres ter bevestiging',
    currentPassword: 'Huidig wachtwoord',
    newPassword: 'Nieuw wachtwoord',
    repeatPassword: 'Herhaal nieuw wachtwoord',
    newEmail: 'Nieuw e-mailadres',
    save: 'Opslaan',
    cancel: 'Annuleren',
    done: 'Gereed',
    busy: 'Bezig…',
    emailInvalid: 'Vul een geldig e-mailadres in.',
    emailDifferent: 'Vul een ander e-mailadres in.',
    passwordMismatch: 'De wachtwoorden komen niet overeen.',
    passwordLength: 'Gebruik 12 tot 128 tekens.',
    resetSent:
      'Als er een account met dit adres bestaat, ontvang je een herstellink. Controleer ook je spammap.',
    emailSent:
      'Wijziging aangevraagd. Volg de bevestigingsberichten. Je huidige adres blijft actief tot die tijd.',
    passwordChanged: 'Je wachtwoord is gewijzigd.',
    deleted: 'Je online account is verwijderd. Lokale leesgegevens zijn behouden.',
    deletionChecking: 'We controleren of dit account kan worden verwijderd…',
    deletionBlocked: 'Draag eerst het eigenaarschap van groepen over. Er is niets verwijderd.',
    deletionLinkedData: 'Verwijder eerst gekoppelde online gegevens. Er is niets verwijderd.',
    deletionNotReady:
      'Account verwijderen is nog niet beschikbaar op de server. Er is niets verwijderd.',
    wrongPassword: 'Het huidige wachtwoord klopt niet.',
    recentLogin: 'Log opnieuw in en probeer het binnen vijf minuten opnieuw.',
    rateLimit: 'Te veel pogingen. Wacht even en probeer opnieuw.',
    genericError: 'Dit kon niet worden afgerond. Controleer je verbinding en probeer opnieuw.',
    noBackend: 'Accountdiensten zijn nog niet ingesteld. Lokaal lezen blijft beschikbaar.',
    passwordVisibility: 'Wachtwoord tonen of verbergen',
    enterCode: 'Bevestigingscode',
    sendCode: 'Bevestigingscode versturen',
    codeSent: 'Code verstuurd. Controleer je e-mail.',
    codeHelp: 'Extra bevestiging nodig. Vraag een code aan en vul de code uit je e-mail in.',
    recovery: 'Kies een nieuw wachtwoord',
    recoveryHelp: 'Je herstellink is bevestigd. Stel een nieuw wachtwoord in.',
    profile: 'Profiel in de gemeenschap',
    profileName: 'Naam die andere lezers zien',
    saveProfile: 'Profiel opslaan',
    avatar: 'Profielfoto kiezen',
    profileSaved: 'Je profiel is opgeslagen.',
    avatarSaved: 'Je profielfoto is bijgewerkt.',
  },
  ar: {
    title: 'الحساب',
    subtitle: 'أدر بيانات تسجيل الدخول.',
    signedIn: 'تم تسجيل الدخول',
    signedOut: 'تبقى قراءتك على هذا الجهاز حتى تسجل الدخول.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    repeatSignupPassword: 'إعادة كلمة المرور',
    name: 'اسم العرض (اختياري)',
    signIn: 'تسجيل الدخول',
    emailUnconfirmed:
      'أكّد بريدك الإلكتروني قبل تسجيل الدخول. افتح رابط التأكيد في صندوق الوارد أو البريد غير المرغوب فيه. يمكنك طلب رسالة تأكيد جديدة أدناه.',
    resendConfirmation: 'إعادة إرسال رسالة التأكيد',
    confirmationSent:
      'تم طلب رسالة تأكيد جديدة. تحقّق من صندوق الوارد والبريد غير المرغوب فيه، ثم افتح الرابط لتأكيد بريدك الإلكتروني.',
    signUp: 'إنشاء حساب',
    create: 'إنشاء حساب',
    forgot: 'هل نسيت كلمة المرور؟',
    reset: 'إرسال رابط الاستعادة',
    signOut: 'تسجيل الخروج',
    account: 'بيانات الحساب',
    manage: 'الأمان وإمكانية الوصول',
    changePassword: 'تغيير كلمة المرور',
    changeEmail: 'تغيير البريد الإلكتروني',
    deleteAccount: 'حذف الحساب عبر الإنترنت',
    emailProvider: 'البريد وكلمة المرور',
    googleProvider: 'حساب Google',
    appleProvider: 'حساب Apple',
    appleLoginFailed: 'تعذر إكمال تسجيل الدخول باستخدام Apple. حاول مرة أخرى.',
    appleDeleteHelp:
      'أكد هويتك باستخدام Apple على جهاز iPhone أو iPad هذا لإلغاء وصول Apple وحذف حسابك عبر الإنترنت.',
    appleDeleteFailed:
      'تعذر إكمال إلغاء وصول Apple وحذف الحساب. لم يتم تأكيد حذف حسابك. حاول مرة أخرى.',
    appleDeleteRequiresIos:
      'لا يمكن لهذا الجهاز إلغاء وصول Apple تلقائيًا. بعد حذف الحساب، ألغِ الوصول من إعدادات حساب Apple. يلزم تسجيل دخول حديث؛ استخدم طريقة دخول مرتبطة مسبقًا أو سجل الدخول على iPhone أو iPad أولًا.',
    appleManualRevocation:
      'تم حذف حسابك عبر الإنترنت. أزل وردنا أيضًا من تسجيل الدخول باستخدام Apple في إعدادات حساب Apple. تم الاحتفاظ ببيانات القراءة المحلية.',
    appleRevocationInstructions: 'تعليمات إلغاء وصول Apple',
    resetHelp:
      'أدخل بريد حسابك وافتح رابط الاستعادة على هذا الجهاز. سنرسل رسالة إذا كان الحساب موجودًا.',
    emailHelp: 'لن يتغير بريدك حتى تؤكد الرسالة في صندوق بريدك الحالي والجديد.',
    passwordHelp: 'استخدم عبارة مرور فريدة من 12 إلى 128 حرفًا.',
    deletionHelp:
      'سيُحذف حسابك وبياناته الشخصية عبر الإنترنت نهائيًا. ستبقى القراءة والملاحظات والتنزيلات المحلية على هذا الجهاز.',
    confirmation: 'اكتب بريدك الحالي للتأكيد',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    repeatPassword: 'أعد كتابة كلمة المرور',
    newEmail: 'البريد الإلكتروني الجديد',
    save: 'حفظ',
    cancel: 'إلغاء',
    done: 'تم',
    busy: 'جارٍ العمل…',
    emailInvalid: 'أدخل بريدًا إلكترونيًا صالحًا.',
    emailDifferent: 'أدخل بريدًا إلكترونيًا مختلفًا.',
    passwordMismatch: 'كلمتا المرور غير متطابقتين.',
    passwordLength: 'استخدم من 12 إلى 128 حرفًا.',
    resetSent: 'إذا وُجد حساب بهذا البريد فسيصلك رابط الاستعادة. تحقق من الرسائل غير المرغوب فيها.',
    emailSent: 'تم طلب التغيير. اتبع رسائل التأكيد؛ سيبقى بريدك الحالي فعالًا حتى ذلك الحين.',
    passwordChanged: 'تم تغيير كلمة المرور.',
    deleted: 'حُذف حسابك عبر الإنترنت مع الاحتفاظ ببيانات القراءة المحلية.',
    deletionChecking: 'جارٍ التحقق من إمكانية حذف الحساب…',
    deletionBlocked: 'انقل ملكية المجموعات أولًا. لم يُحذف شيء.',
    deletionLinkedData: 'احذف البيانات المرتبطة عبر الإنترنت أولًا. لم يُحذف شيء.',
    deletionNotReady: 'حذف الحساب غير متاح على الخادم بعد. لم يُحذف شيء.',
    wrongPassword: 'كلمة المرور الحالية غير صحيحة.',
    recentLogin: 'سجّل الدخول من جديد ثم حاول خلال خمس دقائق.',
    rateLimit: 'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.',
    genericError: 'تعذر إتمام ذلك. تحقق من الاتصال وحاول مجددًا.',
    noBackend: 'خدمات الحساب غير مهيأة بعد. يمكنك مواصلة القراءة محليًا.',
    passwordVisibility: 'إظهار أو إخفاء كلمة المرور',
    enterCode: 'رمز التأكيد',
    sendCode: 'إرسال رمز التأكيد',
    codeSent: 'أُرسل الرمز. تحقق من بريدك.',
    codeHelp: 'يلزم تأكيد إضافي. اطلب رمزًا وأدخله من بريدك.',
    recovery: 'اختر كلمة مرور جديدة',
    recoveryHelp: 'تم التحقق من رابط الاستعادة. عيّن كلمة مرور جديدة لحسابك.',
    profile: 'الملف الشخصي للمجتمع',
    profileName: 'الاسم الذي يراه القراء',
    saveProfile: 'حفظ الملف',
    avatar: 'اختيار صورة الملف',
    profileSaved: 'تم حفظ ملفك.',
    avatarSaved: 'تم تحديث صورة ملفك.',
  },
};
