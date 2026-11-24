import sys, time, json
from playwright.sync_api import sync_playwright

URL = 'file:///D:/website/index.html'
OUT = 'D:/website/.shots/'

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1600, 'height': 1000}, device_scale_factor=1)
    errs = []
    pg.on('console', lambda m: errs.append(('console:' + m.type, m.text)) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
    pg.goto(URL, wait_until='load')
    pg.wait_for_timeout(1500)
    pg.screenshot(path=OUT + '01-loader.png')
    pg.wait_for_timeout(4200)
    pg.screenshot(path=OUT + '02-hero.png')
    print('ERRORS:', json.dumps(errs, indent=1)[:3000])
    print('body ready:', pg.evaluate("document.body.className"))
    print('pl display:', pg.evaluate("getComputedStyle(document.getElementById('pl')).display"))
    b.close()
