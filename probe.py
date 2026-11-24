from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width':1600,'height':1000})
    pg.goto('file:///D:/website/index.html', wait_until='load')
    pg.wait_for_timeout(5000)
    out = pg.evaluate("""() => {
      const ws = Array.from(document.querySelectorAll('.mf__big .w'));
      return ws.map(w => {
        const r = w.getClientRects()[0] || {top:0,left:0};
        return [w.textContent, Math.round(w.offsetTop), Math.round(r.top), Math.round(r.left)];
      });
    }""")
    for row in out[:16]:
        print(row)
    b.close()
