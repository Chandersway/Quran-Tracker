/** Home-screen widget text. The widget follows the app language; Dutch is the default. */
export const homeWidgetCopy = {
  nl: {
    title: 'Vandaag lezen',
    reached: 'Dagdoel gehaald ✓',
    remaining: (amount: string, unit: string) => `Nog ${amount} ${unit} te gaan`,
    planned: (passage: string) => `Gepland: ${passage}`,
    continue: (place: string) => `Verder: ${place}`,
    noGoal: 'Geen dagdoel',
    setGoal: 'Stel een dagdoel in',
    empty: 'Open Quran Tracker om je dagdoel te laden',
  },
  en: {
    title: 'Read today',
    reached: 'Daily goal reached ✓',
    remaining: (amount: string, unit: string) => `${amount} ${unit} to go`,
    planned: (passage: string) => `Planned: ${passage}`,
    continue: (place: string) => `Continue: ${place}`,
    noGoal: 'No daily goal',
    setGoal: 'Set a daily goal',
    empty: 'Open Quran Tracker to load your daily goal',
  },
  ar: {
    title: 'قراءة اليوم',
    reached: 'تم تحقيق الهدف اليومي ✓',
    remaining: (amount: string, unit: string) => `متبقٍ ${amount} ${unit}`,
    planned: (passage: string) => `مخطط: ${passage}`,
    continue: (place: string) => `تابع: ${place}`,
    noGoal: 'لا يوجد هدف يومي',
    setGoal: 'حدد هدفًا يوميًا',
    empty: 'افتح Quran Tracker لتحميل هدفك اليومي',
  },
} as const;
