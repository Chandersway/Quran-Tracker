// Exact curated strings from Android notifications/NotificationText.kt:
// notificationText("replyTitle") and notificationText("replyBody").
const replies: Record<string, { title: string; body: string }> = {
  nl: { title: 'Nieuwe groepsreactie', body: 'Er is gereageerd op een discussie waaraan je deelneemt. Tik om te bekijken.' },
  en: { title: 'New group reply', body: 'Someone replied to a discussion you participate in. Tap to view.' },
  ar: { title: 'رد جديد في المجموعة', body: 'هناك رد جديد في نقاش تشارك فيه. اضغط لعرضه.' },
  fr: { title: 'Nouvelle réponse dans le groupe', body: 'Une réponse a été ajoutée à une discussion à laquelle vous participez. Appuyez pour la voir.' },
};
export function curatedReplyText(language: string) { return replies[language] ?? replies.nl!; }
