import re, os, urllib.request

css = open('assets/fonts/g.css', encoding='utf-8').read()
blocks = css.split('@font-face')
out = []
for b in blocks[1:]:
    fam = re.search(r"font-family: '([^']+)'", b).group(1)
    style = re.search(r'font-style: (\w+)', b).group(1)
    wght = re.search(r'font-weight: ([\d ]+)', b).group(1).strip()
    url = re.search(r'url\((https[^)]+)\)', b).group(1)
    m = re.search(r'unicode-range: ([^;]+);', b)
    ur = m.group(1) if m else ''
    if 'U+0000-00FF' not in ur:
        continue
    name = fam.replace(' ', '') + '-' + style + '-' + wght.replace(' ', '_') + '.woff2'
    p = 'assets/fonts/' + name
    if not os.path.exists(p):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        open(p, 'wb').write(urllib.request.urlopen(req).read())
    out.append(
        "@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;"
        "src:url('../fonts/%s') format('woff2');unicode-range:%s;}"
        % (fam, style, wght, name, ur)
    )

open('assets/css/fonts.css', 'w', encoding='utf-8').write('\n'.join(out))
print('\n'.join(out))
