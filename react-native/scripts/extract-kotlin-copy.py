"""Extract curated Kotlin copy without translating or rewriting it (UTF-8 throughout).

Only localization structures are read as copy. Backend constants/credentials are never
copied. Every value retains its original source location and Kotlin interpolation.
"""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'app/src/main/java/com/Ameender/qurantracker'
OUT = ROOT / 'src/i18n'
STRING = r'"(?:\\.|[^"\\])*"'
catalog = {}
warnings = []


def decode(s):
    # Kotlin escapes differ from JSON only for escaped dollars and single quotes.
    return json.loads(s.replace('\\$', '$').replace("\\'", "'"))


def balanced(text, start, opening='(', closing=')'):
    depth = 0
    quote = False
    escape = False
    for i in range(start, len(text)):
        c = text[i]
        if quote:
            if escape:
                escape = False
            elif c == '\\':
                escape = True
            elif c == '"':
                quote = False
            continue
        if c == '"':
            quote = True
        elif c == opening:
            depth += 1
        elif c == closing:
            depth -= 1
            if depth == 0:
                return i
    raise ValueError(f'Unclosed expression at {start}')


def parts(text, offset=0):
    """Split argument lists while retaining exact source offsets."""
    start = 0
    i = 0
    while i < len(text):
        if text[i] == '"':
            m = re.match(STRING, text[i:])
            if m:
                i += len(m[0])
                continue
        if text[i] in '([{':
            i = balanced(text, i, text[i], {'(': ')', '[': ']', '{': '}'}[text[i]]) + 1
            continue
        if text[i] == ',':
            yield text[start:i], offset + start
            start = i + 1
        i += 1
    yield text[start:], offset + start


def add(key, locale, raw, path, text, offset, kind):
    if locale not in ('nl', 'en', 'ar', 'fr'):
        return
    try:
        value = decode(raw)
    except (ValueError, json.JSONDecodeError):
        warnings.append({'path': path, 'offset': offset, 'reason': 'unsupported Kotlin string escape'})
        return
    row = catalog.setdefault(key, {'values': {}, 'provenance': {}, 'kind': kind})
    provenance = {'path': path, 'line': text.count('\n', 0, offset) + 1}
    if locale in row['values'] and row['values'][locale] != value:
        warnings.append({'key': key, 'locale': locale, 'reason': 'conflicting extraction', 'provenance': provenance})
        return
    row['values'][locale] = value
    row['provenance'][locale] = provenance


def constructor(text, start, end, key, locale, path, class_fields):
    for index, (part, offset) in enumerate(parts(text[start + 1:end], start + 1)):
        match = re.match(r'\s*(\w+)\s*=\s*', part)
        field = match[1] if match else (class_fields[index] if index < len(class_fields) else str(index))
        value = part[match.end():] if match else part.lstrip()
        value_offset = offset + (match.end() if match else len(part) - len(part.lstrip()))
        child = key + '.' + field
        literal = re.fullmatch(STRING, value.strip())
        if literal:
            add(child, locale, literal[0], path, text, value_offset, 'constructor')
        else:
            call = re.match(r'(\w+)\s*\(', value)
            if call:
                inner = value_offset + call.end() - 1
                fields = FIELDS.get(call[1], [])
                if call[1] == 'listOf':
                    fields = []
                constructor(text, inner, balanced(text, inner), child, locale, path, fields)


files = sorted(SOURCE.rglob('*.kt'))
sources = {p: p.read_text(encoding='utf-8') for p in files}
FIELDS = {}
DEFAULTS = {}
for p, text in sources.items():
    for m in re.finditer(r'(?:data\s+)?class\s+(\w+)\s*\(', text):
        end = balanced(text, m.end() - 1)
        FIELDS[m[1]] = re.findall(r'\bval\s+(\w+)\s*:', text[m.end():end])
        DEFAULTS[m[1]] = [(d[1], d[2], p, text, m.end() + d.start(2)) for d in re.finditer(r'\bval\s+(\w+)\s*:\s*String\s*=\s*(' + STRING + ')', text[m.end():end])]

for p, text in sources.items():
    path = p.relative_to(ROOT.parent).as_posix()
    # AppStrings has explicit locale instances, plus semantic UI maps.
    if p.name == 'AppText.kt':
        for name, locale in [('dutch', 'nl'), ('english', 'en'), ('arabic', 'ar')]:
            m = re.search(r'private val ' + name + r'\s*=\s*AppStrings\(', text)
            constructor(text, m.end() - 1, balanced(text, m.end() - 1), 'app', locale, path, FIELDS['AppStrings'])
            m = re.search(r'private fun ' + name + r'Ui\(\)\s*=\s*mapOf\(', text)
            if m:
                end = balanced(text, m.end() - 1)
                for row in re.finditer('(' + STRING + r')\s+to\s+(' + STRING + ')', text[m.end():end]):
                    add(decode(row[1]), locale, row[2], path, text, m.end() + row.start(2), 'semantic-map')
        continue
    # Trilingual inline helpers: goalText(language,nl,en,ar), label(nl,en,ar[,fr]).
    for m in re.finditer(r'\b(goalText|label)\s*\(', text):
        start = m.end() - 1
        args = list(parts(text[start + 1:balanced(text, start)], start + 1))
        if m[1] == 'goalText':
            args = args[1:]
        if len(args) not in (3, 4) or not all(re.fullmatch(STRING, a.strip()) for a, _ in args):
            continue
        identity = hashlib.sha256(decode(args[1][0].strip()).encode()).hexdigest()[:10]
        key = 'inline.' + p.stem + '.' + identity
        for locale, (raw, offset) in zip(('nl', 'en', 'ar', 'fr'), args):
            add(key, locale, raw.strip(), path, text, offset, 'inline-helper')
    # Inline language conditionals used by note targets and small controls.
    conditional = r'if\s*\(\s*(?:appLanguage|language)\s*==\s*"(en|ar)"\s*\)\s*(' + STRING + r')\s*else\s*if\s*\(\s*(?:appLanguage|language)\s*==\s*"(en|ar)"\s*\)\s*(' + STRING + r')\s*else\s*(' + STRING + ')'
    for m in re.finditer(conditional,text):
        if m[1]==m[3]: continue
        rows = {m[1]:(m[2],m.start(2)),m[3]:(m[4],m.start(4)),'nl':(m[5],m.start(5))}
        identity = hashlib.sha256(decode(rows['en'][0]).encode()).hexdigest()[:10]
        for locale,(raw,offset) in rows.items(): add('inline.'+p.stem+'.'+identity,locale,raw,path,text,offset,'inline-conditional')
    # Screen-owned when(language) expressions are also curated copy. Only
    # direct literal branches are catalogued; complex expressions remain in the
    # raw literal inventory and are not guessed into locale rows.
    for m in re.finditer(r'when\s*\(\s*(?:appLanguage|language|toolbarLanguage|text\.localeCode)\s*\)\s*\{', text):
        start = m.end()-1
        end = balanced(text, start, '{', '}')
        body = text[start+1:end]
        masked = re.sub(STRING, lambda match: ' ' * len(match[0]), body)
        rows = []
        for arm in re.finditer(r'((?:"(?:en|nl|ar|fr)"\s*,?\s*)+|else)\s*->\s*(' + STRING + ')', body):
            before = masked[:arm.start()]
            if before.count('{') != before.count('}') or before.count('(') != before.count(')'):
                continue
            locales = ['nl'] if arm[1] == 'else' else re.findall(r'"(en|nl|ar|fr)"',arm[1])
            rows.extend((locale,arm[2],start+1+arm.start(2)) for locale in locales)
        localized = {locale for locale,_,_ in rows}
        if not {'en','ar','nl'}.issubset(localized):
            continue
        english = next(raw for locale,raw,_ in rows if locale=='en')
        identity = hashlib.sha256(decode(english).encode()).hexdigest()[:10]
        key = 'inline.'+p.stem+'.'+identity
        for locale,raw,offset in rows:
            add(key,locale,raw,path,text,offset,'inline-when')
    # Localized data class constructors selected directly by language.
    for m in re.finditer(r'("(?:en|nl|ar|fr)"|else)\s*->\s*(\w+(?:Strings|Text))\s*\(', text):
        if m[2] not in FIELDS:
            continue
        locale = 'nl' if m[1] == 'else' else decode(m[1])
        prefix = {'FocusStrings': 'focus', 'NoteStrings': 'notes', 'MutashabihatText': 'mutashabihat', 'BookMenuStrings': 'books', 'BookReaderStrings': 'bookReader'}.get(m[2], m[2][0].lower() + m[2][1:])
        constructor(text, m.end() - 1, balanced(text, m.end() - 1), prefix, locale, path, FIELDS.get(m[2], []))
        if locale == 'nl':
            for field, raw, default_path, default_text, offset in DEFAULTS.get(m[2], []):
                if 'nl' not in catalog.get(prefix + '.' + field, {}).get('values', {}):
                    add(prefix + '.' + field, 'nl', raw, default_path.relative_to(ROOT.parent).as_posix(), default_text, offset, 'constructor-default')
    if p.name == 'HamburgerMenu.kt':
        for m in re.finditer(r'("Account"|"الحساب"|"Compte"|else)\s*->\s*AccountStrings\s*\(', text):
            locale = {'"Account"':'en', '"الحساب"':'ar', '"Compte"':'fr', 'else':'nl'}[m[1]]
            constructor(text, m.end() - 1, balanced(text, m.end() - 1), 'account', locale, path, FIELDS['AccountStrings'])
    if p.name == 'AyahNotesScreen.kt':
        category = text.find('private fun noteTagCategories')
        if category >= 0:
            brace = text.index('{',category)
            ending = balanced(text,brace,'{','}')
            for m in re.finditer(r'("en"|"ar"|else)\s*->\s*listOf\(',text[brace:ending]):
                locale = 'nl' if m[1]=='else' else decode(m[1])
                start = brace+m.end()-1
                for index,(raw,offset) in enumerate(parts(text[start+1:balanced(text,start)],start+1)):
                    if re.fullmatch(STRING,raw.strip()): add('notes.tagCategories.'+str(index),locale,raw.strip(),path,text,offset,'localized-list')
    if p.name == 'NoteTargetComponents.kt':
        for m in re.finditer(r'NoteScope\.(JUZ|HIZB|RUB|SURAH|AYAH)\s*->\s*if\s*\(language\s*==\s*"ar"\)\s*(' + STRING + r')\s*else\s*(' + STRING + ')',text):
            for locale,raw,offset in [('ar',m[2],m.start(2)),('en',m[3],m.start(3)),('nl',m[3],m.start(3))]:
                add('notes.scope.'+m[1].lower(),locale,raw,path,text,offset,'source-scope-label')
    # Small key -> listOf tables have deliberately different locale orders.
    table_prefixes = {'ReadingChecklistText.kt': ('checklist', ('nl', 'en', 'ar', 'fr')),
        'ReadingPlanText.kt': ('readingPlan', ('en', 'ar', 'fr')),
        'HizbOverviewText.kt': ('hizbOverview', ('nl', 'en', 'ar', 'fr')),
        'NotificationText.kt': ('notifications', ('nl', 'en', 'ar', 'fr')),
        'AccountManagement.kt': ('accountManagement', ('nl', 'en', 'fr', 'ar'))}
    if p.name in table_prefixes:
        prefix, order = table_prefixes[p.name]
        for m in re.finditer('(' + STRING + r')\s*->\s*listOf\(', text):
            start = m.end() - 1
            args = list(parts(text[start + 1:balanced(text, start)], start + 1))
            if len(args) != len(order) or not all(re.fullmatch(STRING, a.strip()) for a, _ in args):
                continue
            raw_key = decode(m[1])
            key = prefix + '.' + raw_key
            for locale, (raw, offset) in zip(order, args):
                add(key, locale, raw.strip(), path, text, offset, 'localized-table')
            if prefix == 'readingPlan':
                nl_overrides = {'remaining': 'Resterend', 'automatic': 'Automatisch', 'adjustment': 'Correctie', 'pace': 'Richttempo per dag'}
                add(key, 'nl', json.dumps(nl_overrides.get(raw_key, raw_key)), path, text, m.start(1), 'localized-table')

# The curated book biographies are content too. Preserve all seven definitions
# and provenance rather than maintaining a second, subtly rewritten RN array.
book_definitions = []
for p,text in sources.items():
    if p.name != 'BookReaderScreen.kt': continue
    path = p.relative_to(ROOT.parent).as_posix()
    for m in re.finditer(r'BookDefinition\s*\(',text):
        start=m.end()-1
        values={}
        provenance={}
        for part,offset in parts(text[start+1:balanced(text,start)],start+1):
            match=re.fullmatch(r'\s*(\w+)\s*=\s*('+STRING+r')\s*',part)
            if match:
                values[match[1]]=decode(match[2])
                provenance[match[1]]={'path':path,'line':text.count('\n',0,offset+match.start(2))+1}
        if 'id' not in values: continue
        for suffix,locale in [('En','en'),('Nl','nl'),('Ar','ar'),('Fr','fr')]:
            field='summary'+suffix
            add('bookMetadata.'+values['id']+'.summary',locale,json.dumps(values[field],ensure_ascii=False),path,text,0,'book-metadata')
            catalog['bookMetadata.'+values['id']+'.summary']['provenance'][locale]=provenance[field]
        book_definitions.append({'id':values['id'],'assetFile':values['assetFile'].removeprefix('books/'),'titleAr':values['titleAr'],'titleEn':values['titleEn'],'author':values['author'],'summary':{lang:values['summary'+suffix] for suffix,lang in [('En','en'),('Nl','nl'),('Ar','ar'),('Fr','fr')]},'provenance':provenance})
(OUT/'book-metadata.json').write_text(json.dumps(book_definitions,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

# Android resources are preserved separately; only actually provided translations
# are included. A missing translation is not silently invented.
for resource in sorted((ROOT.parent / 'app/src/main/res').glob('values*/strings.xml')):
    locale = {'values': 'en', 'values-nl': 'nl', 'values-ar': 'ar', 'values-fr': 'fr'}.get(resource.parent.name)
    if not locale:
        continue
    text = resource.read_text(encoding='utf-8')
    for el in ET.fromstring(text):
        if el.tag == 'string':
            raw = json.dumps(''.join(el.itertext()), ensure_ascii=False)
            offset = text.find('name="' + el.attrib['name'] + '"')
            add('android.' + el.attrib['name'], locale, raw, resource.relative_to(ROOT.parent).as_posix(), text, offset, 'android-resource')

OUT.mkdir(exist_ok=True)
payload = {'schemaVersion': 1, 'source': 'Kotlin source; values preserved verbatim after Kotlin escape decoding', 'entries': dict(sorted(catalog.items())), 'extractionWarnings': warnings}
(OUT / 'source-catalog.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
# Complete UI string-literal evidence, including expressions not safely grouped
# into languages. Technical identifiers are explicitly not canonical UI keys.
literals = []
for p,text in sources.items():
    if 'ui' not in p.parts and p.name not in ('NotificationText.kt','PlanningLabels.kt'):
        continue
    for m in re.finditer(r'"""[\s\S]*?"""|' + STRING,text):
        raw = m[0]
        try:
            value = raw[3:-3] if raw.startswith('"""') else decode(raw)
        except ValueError:
            continue
        literals.append({'path':p.relative_to(ROOT.parent).as_posix(),'line':text.count('\n',0,m.start())+1,'value':value,'rawKotlinString':raw,'classification':'source-literal; may be UI, interpolation, identifier or technical constant; not a verified localization row'})
(ROOT/'docs').mkdir(exist_ok=True)
(ROOT/'docs/kotlin-copy-literals.json').write_text(json.dumps({'schemaVersion':1,'literals':literals},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'entries': len(catalog), 'completeEN_NL_AR': sum(all(lang in row['values'] for lang in ('en','nl','ar')) for row in catalog.values()), 'warnings': len(warnings)}, ensure_ascii=False))
