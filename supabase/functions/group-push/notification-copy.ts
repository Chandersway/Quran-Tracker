// Exact curated strings from Android notifications/NotificationText.kt:
// notificationText("replyTitle") and notificationText("replyBody").
const replies: Record<string, { title: string; body: string }> = {
  nl: { title: 'Nieuwe groepsreactie', body: 'Er is gereageerd op een discussie waaraan je deelneemt. Tik om te bekijken.' },
  en: { title: 'New group reply', body: 'Someone replied to a discussion you participate in. Tap to view.' },
  ar: { title: 'رد جديد في المجموعة', body: 'هناك رد جديد في نقاش تشارك فيه. اضغط لعرضه.' },
  fr: { title: 'Nouvelle réponse dans le groupe', body: 'Une réponse a été ajoutée à une discussion à laquelle vous participez. Appuyez pour la voir.' },
};
export function curatedReplyText(language: string) { return replies[language] ?? replies.nl!; }

const posts: Record<string, { title: string; body: string }> = {
  nl: { title: 'Nieuw groepsbericht', body: 'Er is iets gedeeld in je groep. Tik om te bekijken.' },
  en: { title: 'New group post', body: 'Something was shared in your group. Tap to view.' },
  ar: { title: 'منشور جديد في المجموعة', body: 'تمت مشاركة منشور في مجموعتك. اضغط لعرضه.' },
  fr: { title: 'Nouvelle publication dans le groupe', body: 'Une nouvelle publication est disponible dans votre groupe. Appuyez pour la voir.' },
};
export function curatedGroupPushText(kind: 'group_post' | 'group_reply', language: string) {
  return kind === 'group_post' ? posts[language] ?? posts.nl! : curatedReplyText(language);
}
