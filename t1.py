import json
from playwright.sync_api import sync_playwright

URL = "file:///D:/website/index.html"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]
    pg.on("console", lambda m: errs.append((m.type, m.text)) if m.type in ("error","warning") else None)
    pg.on("pageerror", lambda e: errs.append(("pageerror", str(e))))
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(5200)
    pg.screenshot(path=".shots/10-hero.png")
    print("ERR1", json.dumps(errs, indent=1)[:2500]); errs.clear()

    # scroll to mark
    pg.evaluate("document.getElementById('mark').scrollIntoView()")
    pg.wait_for_timeout(2600)
    pg.screenshot(path=".shots/11-mark.png")
    print("ERR2", json.dumps(errs, indent=1)[:1500]); errs.clear()

    # palette
    pg.keyboard.press("Control+k")
    pg.wait_for_timeout(700)
    pg.screenshot(path=".shots/12-palette.png")
    pg.keyboard.type("chill")
    pg.wait_for_timeout(500)
    pg.screenshot(path=".shots/13-palette-search.png")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(400)

    # theme
    pg.evaluate("window.scrollTo(0,0)")
    pg.wait_for_timeout(900)
    pg.click("#modeBtn")
    pg.wait_for_timeout(1500)
    pg.screenshot(path=".shots/14-light-hero.png")
    pg.evaluate("document.getElementById('manifesto').scrollIntoView()")
    pg.wait_for_timeout(1800)
    pg.screenshot(path=".shots/15-light-mf.png")
    pg.evaluate("document.getElementById('mark').scrollIntoView()")
    pg.wait_for_timeout(2200)
    pg.screenshot(path=".shots/16-light-mark.png")
    print("ERR3", json.dumps(errs, indent=1)[:2000])
    print("THEME", pg.evaluate("document.documentElement.getAttribute('data-theme')"))
    b.close()
