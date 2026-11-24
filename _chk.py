from playwright.sync_api import sync_playwright

secs = ['top', 'mark', 'manifesto', 'loop', 'rituals', 'radio', 'nights', 'how', 'shipped', 'voices', 'join']

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1600, 'height': 1000})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console:' + m.type + ':' + m.text) if m.type == 'error' else None)
    pg.goto('file:///D:/website/index.html', wait_until='load')
    pg.wait_for_timeout(6000)
    for s in secs:
        pg.evaluate("(s)=>{const el=document.querySelector('#'+s); if(el) el.scrollIntoView({block:'start'});}", s)
        pg.wait_for_timeout(1400)
        pg.screenshot(path='.shots/chk-' + s + '.png')
    print('height', pg.evaluate('document.body.scrollHeight'))
    print('errs', errs[:8])
    b.close()
