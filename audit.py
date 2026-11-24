from playwright.sync_api import sync_playwright

secs = ['mark','manifesto','loop','rituals','radio','nights','how','voices','join']

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width':1600,'height':1000})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file:///D:/website/index.html', wait_until='load')
    pg.wait_for_timeout(5500)
    for s in secs:
        pg.evaluate("(s)=>{const el=document.querySelector('#'+s); if(el) el.scrollIntoView({block:'start'});}", s)
        pg.wait_for_timeout(2000)
        pg.screenshot(path='.shots/now-' + s + '.png')
    print('height', pg.evaluate('document.body.scrollHeight'))
    print('errs', errs[:6])
    b.close()
