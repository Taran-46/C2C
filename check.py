from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width':1600,'height':1000})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('C:' + m.text) if m.type == 'error' else None)
    pg.goto('file:///D:/website/index.html', wait_until='load')
    pg.wait_for_timeout(5200)
    print('ERR', errs[:5])
    print('mf:', pg.eval_on_selector('.mf__big', 'e => e.innerText.replace(/\\n/g, " | ")'))
    print('dates', pg.evaluate("Array.from(document.querySelectorAll('[data-night]')).map(e=>e.textContent)"))
    print('nextDate', pg.eval_on_selector('#nextDate', 'e=>e.textContent'))

    pg.eval_on_selector('#manifesto', 'e => e.scrollIntoView({block:"start"})')
    pg.wait_for_timeout(1600)
    pg.screenshot(path='.shots/fix-manifesto.png')

    pg.eval_on_selector('#shipped', 'e => e.scrollIntoView({block:"start"})')
    pg.wait_for_timeout(2400)
    pg.screenshot(path='.shots/new-wall.png')
    print('cells', pg.evaluate("document.querySelectorAll('.wall__cell.in').length"))

    # hover a cell to check the floating log
    box = pg.eval_on_selector('.wall__cell[data-i="31"]', 'e => { const r = e.getBoundingClientRect(); return {x:r.x+r.width/2, y:r.y+r.height/2}; }')
    pg.mouse.move(box['x'], box['y'])
    pg.wait_for_timeout(900)
    pg.screenshot(path='.shots/new-wall-hover.png')
    print('popOn', pg.evaluate("document.getElementById('wpop').classList.contains('on')"))
    b.close()
