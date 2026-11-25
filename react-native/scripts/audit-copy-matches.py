import re, json, difflib
from pathlib import Path
root = Path(__file__).resolve().parents[1]
text = (root/'src/i18n/index.ts').read_text(encoding='utf8')
old = re.findall(r"'((?:\\.|[^'\\])*)': \[", text)
catalog = json.loads((root/'src/i18n/source-catalog.json').read_text(encoding='utf8'))['entries']
ens = {v['values']['en']: k for k,v in catalog.items() if 'en' in v['values']}
print('Existing:', len(old), 'Exact:',sum(x in ens for x in old))
for x in old:
    if x not in ens:
        print(x, '=>', difflib.get_close_matches(x, ens, 1, .55))
(root/'src/i18n/migration-ui-strings.json').write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
