import base64, re

files = {
    ('Instrument Serif', 'italic', '400'): 'InstrumentSerif-italic-400.woff2',
    ('Instrument Serif', 'normal', '400'): 'InstrumentSerif-normal-400.woff2',
    ('JetBrains Mono', 'normal', '300 600'): 'JetBrainsMono-normal-300_600.woff2',
    ('Space Grotesk', 'normal', '300 700'): 'SpaceGrotesk-normal-300_700.woff2',
}

out = []
for (fam, style, wght), fn in files.items():
    b = base64.b64encode(open('assets/fonts/' + fn, 'rb').read()).decode()
    out.append(
        "@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:block;"
        "src:url(data:font/woff2;base64,%s) format('woff2');}"
        % (fam, style, wght, b)
    )

open('assets/css/fonts-inline.css', 'w', encoding='utf-8').write('\n'.join(out))
print('written', sum(len(x) for x in out))
