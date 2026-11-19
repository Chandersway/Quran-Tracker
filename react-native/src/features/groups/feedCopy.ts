export type FeedLocale = 'nl' | 'en' | 'ar';
export type FeedReaction = 'like' | 'love' | 'dua' | 'insightful';

function arabicCount(
  count: number,
  singular: string,
  dual: string,
  plural: string,
  accusative: string,
) {
  if (count === 1) return `${singular} واحد`;
  if (count === 2) return dual;
  if (count === 0) return `لا ${plural}`;
  const remainder = count % 100;
  return `${count.toLocaleString('ar')} ${remainder >= 3 && remainder <= 10 ? plural : remainder >= 11 ? accusative : singular}`;
}

/** New social controls use complete phrases; user-authored text is never translated. */
export const feedCopy = {
  nl: {
    reactions: { like: 'Vind ik leuk', love: 'Mooi', dua: 'Dua', insightful: 'Inzichtelijk' },
    reply: 'Reageren',
    more: 'Meer berichtacties',
    edited: 'bewerkt',
    pinned: 'Vastgezet',
    chooseReaction: 'Kies een waardering',
    closeReactions: 'Waarderingen sluiten',
    reactionsCount: (count: number) =>
      `${count.toLocaleString('nl')} waardering${count === 1 ? '' : 'en'}`,
    commentsCount: (count: number) =>
      `${count.toLocaleString('nl')} reactie${count === 1 ? '' : 's'}`,
    writeComment: 'Schrijf een reactie…',
    send: 'Reactie versturen',
    retry: 'Opnieuw proberen',
    sending: 'Versturen…',
    failed: 'Versturen mislukt. Je concept is bewaard.',
    noComments: 'Nog geen reacties. Begin het gesprek.',
    deleteComment: 'Reactie verwijderen',
    postedBy: 'Oorspronkelijk bericht van',
    you: 'Jij',
    newPost: 'Nieuw bericht',
    writePost: 'Wat wil je delen?',
    postPlaceholder: 'Schrijf je bericht…',
    sendPost: 'Plaatsen',
    closeComposer: 'Berichtinvoer sluiten',
    newPosts: (count: number) =>
      count === 1
        ? 'Bekijk 1 nieuw bericht'
        : `Bekijk ${count.toLocaleString('nl')} nieuwe berichten`,
  },
  en: {
    reactions: { like: 'Like', love: 'Love', dua: 'Dua', insightful: 'Insightful' },
    reply: 'Comment',
    more: 'More post actions',
    edited: 'edited',
    pinned: 'Pinned',
    chooseReaction: 'Choose a reaction',
    closeReactions: 'Close reactions',
    reactionsCount: (count: number) =>
      `${count.toLocaleString('en')} reaction${count === 1 ? '' : 's'}`,
    commentsCount: (count: number) =>
      `${count.toLocaleString('en')} comment${count === 1 ? '' : 's'}`,
    writeComment: 'Write a comment…',
    send: 'Send comment',
    retry: 'Try again',
    sending: 'Sending…',
    failed: 'Could not send. Your draft has been kept.',
    noComments: 'No comments yet. Start the conversation.',
    deleteComment: 'Delete comment',
    postedBy: 'Original post by',
    you: 'You',
    newPost: 'New post',
    writePost: 'What would you like to share?',
    postPlaceholder: 'Write your post…',
    sendPost: 'Post',
    closeComposer: 'Close post composer',
    newPosts: (count: number) =>
      `Show ${count.toLocaleString('en')} new post${count === 1 ? '' : 's'}`,
  },
  ar: {
    reactions: { like: 'أعجبني', love: 'أحببته', dua: 'دعاء', insightful: 'مفيد' },
    reply: 'تعليق',
    more: 'المزيد من خيارات المنشور',
    edited: 'تم التعديل',
    pinned: 'مثبّت',
    chooseReaction: 'اختر تفاعلاً',
    closeReactions: 'إغلاق التفاعلات',
    reactionsCount: (count: number) => arabicCount(count, 'تفاعل', 'تفاعلان', 'تفاعلات', 'تفاعلًا'),
    commentsCount: (count: number) => arabicCount(count, 'تعليق', 'تعليقان', 'تعليقات', 'تعليقًا'),
    writeComment: 'اكتب تعليقًا…',
    send: 'إرسال التعليق',
    retry: 'حاول مرة أخرى',
    sending: 'جارٍ الإرسال…',
    failed: 'تعذر الإرسال. تم الاحتفاظ بمسودتك.',
    noComments: 'لا توجد تعليقات بعد. ابدأ المحادثة.',
    deleteComment: 'حذف التعليق',
    postedBy: 'المنشور الأصلي من',
    you: 'أنت',
    newPost: 'منشور جديد',
    writePost: 'ماذا تود أن تشارك؟',
    postPlaceholder: 'اكتب منشورك…',
    sendPost: 'نشر',
    closeComposer: 'إغلاق محرر المنشور',
    newPosts: (count: number) =>
      count === 1
        ? 'عرض منشور جديد'
        : count === 2
          ? 'عرض منشورين جديدين'
          : `عرض المنشورات الجديدة (${count.toLocaleString('ar')})`,
  },
} as const;
