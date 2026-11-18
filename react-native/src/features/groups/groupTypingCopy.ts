import type { Locale } from '../../i18n';
import type { GroupTypingParticipant } from '../../services/groups/groupTyping';

export const groupTypingCopy = {
  one: {
    nl: '{name} is aan het typen…',
    en: '{name} is typing…',
    ar: '{name} يكتب الآن…',
  },
  unnamed: {
    nl: 'Een groepslid is aan het typen…',
    en: 'A group member is typing…',
    ar: 'أحد أعضاء المجموعة يكتب الآن…',
  },
  two: {
    nl: '{first} en {second} zijn aan het typen…',
    en: '{first} and {second} are typing…',
    ar: '{first} و{second} يكتبان الآن…',
  },
  several: {
    nl: '{count} groepsleden zijn aan het typen…',
    en: '{count} group members are typing…',
    ar: '{count} من أعضاء المجموعة يكتبون الآن…',
  },
} satisfies Record<string, Record<Locale, string>>;

/** Whole sentences; names are literal user content, never passed to translation lookup. */
export function groupTypingText(people: readonly GroupTypingParticipant[], locale: Locale) {
  if (!people.length) return '';
  if (people.length === 1) {
    const name = people[0]!.displayName;
    return name.trim()
      ? groupTypingCopy.one[locale].replace('{name}', () => name)
      : groupTypingCopy.unnamed[locale];
  }
  if (people.length === 2 && people.every((person) => person.displayName.trim()))
    return groupTypingCopy.two[locale].replace(
      /\{(first|second)\}/g,
      (_match, key: string) => people[key === 'first' ? 0 : 1]!.displayName,
    );
  return groupTypingCopy.several[locale].replace('{count}', String(people.length));
}
