import json
from playwright.sync_api import sync_playwright
URL = "file:///D:/website/index.html"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(URL, wait_until="load"); pg.wait_for_timeout(5200)
    pg.keyboard.press("Control+k"); pg.wait_for_timeout(800)
    pg.screenshot(path=".shots/12-palette.png")
    pg.keyboard.type("chi"); pg.wait_for_timeout(600)
    pg.screenshot(path=".shots/13-palette-search.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(500)
    pg.click("#modeBtn"); pg.wait_for_timeout(1800)
    pg.screenshot(path=".shots/14-light-hero.png")
    pg.evaluate("document.getElementById('mark').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(2400)
    pg.screenshot(path=".shots/16-light-mark.png")
    print("ERR", errs)
    print("theme", pg.evaluate("document.documentElement.dataset.theme"))
    b.close()
