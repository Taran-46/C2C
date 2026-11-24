import json
from playwright.sync_api import sync_playwright
URL = "file:///D:/website/index.html"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]
    pg.on("console", lambda m: errs.append((m.type, m.text)) if m.type=="error" else None)
    pg.on("pageerror", lambda e: errs.append(("pageerror", str(e))))
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(5600)
    pg.screenshot(path=".shots/10-hero.png")
    print("ERR1", json.dumps(errs)[:1500]); errs.clear()
    pg.evaluate("document.getElementById('mark').scrollIntoView()")
    pg.wait_for_timeout(3000)
    pg.screenshot(path=".shots/11-mark.png")
    print("ERR2", json.dumps(errs)[:900]); errs.clear()
    b.close()
