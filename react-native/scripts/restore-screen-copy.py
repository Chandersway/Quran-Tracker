from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
keys_path = root/'src/i18n/screen-source-keys.json'
text = keys_path.read_text(encoding='utf8').replace('app.groupJoin.', 'app.groupJoinText.').replace('app.groupPrivacy.', 'app.groupPrivacyOption.').replace('app.groupMembers.noMembers', 'app.groupMembersText.noMembers')
keys_path.write_text(text,encoding='utf8')
edits = {
    'groups/GroupsScreen.tsx': ('const t = strings[state.preferences.language];', 'const t = restoreSourceCopy(state.preferences.language, strings[state.preferences.language], strings.en, screenSourceKeys.groups);'),
    'groups/GroupScreen.tsx': ('const t = copy[state.preferences.language];', 'const t = restoreSourceCopy(state.preferences.language, copy[state.preferences.language], copy.en, screenSourceKeys.group);'),
    'account/AccountScreen.tsx': ('const t = copy[state.preferences.language];', 'const t = restoreSourceCopy(state.preferences.language, copy[state.preferences.language], copy.en, screenSourceKeys.account);'),
    'account/NotificationsScreen.tsx': ('const t = labels[state.preferences.language];', 'const t = restoreSourceCopy(state.preferences.language, labels[state.preferences.language], labels.en, screenSourceKeys.notifications);'),
    'account/SettingsScreen.tsx': ('const t = labels[state.preferences.language];', 'const t = restoreSourceCopy(state.preferences.language, labels[state.preferences.language], labels.en, screenSourceKeys.settings);'),
    'notes/NotesScreen.tsx': ('const copy = words[language] ?? words.en;', 'const copy = restoreSourceCopy(language, words[language] ?? words.en, words.en, screenSourceKeys.notes);'),
    'study/StudyScreen.tsx': ('const copy = strings[language] ?? strings.en;', 'const copy = restoreSourceCopy(language, strings[language] ?? strings.en, strings.en, screenSourceKeys.study);'),
}
for name,(old,new) in edits.items():
    p = root/'src/features'/name
    text = p.read_text(encoding='utf8')
    if old in text:
        text = text.replace(old,new)
        text = "import { restoreSourceCopy, screenSourceKeys } from '../../i18n';\n" + text
        p.write_text(text,encoding='utf8')
    else:
        assert new in text, name+' source copy selection changed; inspect manually'
catalog = json.loads((root/'src/i18n/source-catalog.json').read_text(encoding='utf8'))['entries']
keys = json.loads(keys_path.read_text(encoding='utf8'))
assert all(value in catalog for screen in keys.values() for value in screen.values())
print('Restored curated source fields in',len(edits),'screens.')
