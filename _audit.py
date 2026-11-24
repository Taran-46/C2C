import re, os
h = open('index.html', encoding='utf-8').read()
c = open('assets/css/style.css', encoding='utf-8').read()
j = open('assets/js/app.js', encoding='utf-8').read()

cls = set()
for m in re.finditer(r'class="([^"]+)"', h):
    for x in m.group(1).split():
        cls.add(x)
missing = [x for x in sorted(cls) if not re.search(r'\.' + re.escape(x) + r'(?![\w-])', c)]
print('CLASSES IN HTML WITHOUT CSS:', len(missing))
print(missing)

ids = set(re.findall(r"[\$]{1,2}\('#([\w-]+)'", j))
hid = set(re.findall(r'id="([\w-]+)"', h))
print('\nJS ids missing from HTML:', sorted(ids - hid))
print('HTML ids count:', len(hid), 'unused in js:', len(hid - ids))

# CSS classes defined but never used in html/js
cssc = set(re.findall(r'\.([a-zA-Z][\w-]+)(?=[\s,{:>+~\[])', c))
used = set(cls)
for m in re.finditer(r"class(?:Name)?\s*[=+]\s*['\"]([^'\"]+)['\"]", j):
    used.update(m.group(1).split())
for m in re.finditer(r"classList\.(?:add|remove|toggle)\(([^)]*)\)", j):
    used.update(re.findall(r"'([\w-]+)'", m.group(1)))
unused = [x for x in sorted(cssc) if x not in used]
print('\nCSS CLASSES NEVER USED:', len(unused))
print(unused[:120])

print('\nHTML sections:', re.findall(r'<section[^>]*id="([\w-]+)"', h))
print('\nJS module banners:')
for m in re.finditer(r'\n\s*(\d+)\. ([A-Z][^\n]{2,60})', j):
    print('  ', m.group(1), m.group(2))
print('\nfile sizes:', {f: os.path.getsize(f) for f in ['index.html', 'assets/css/style.css', 'assets/js/app.js']})
