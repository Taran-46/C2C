import json
from playwright.sync_api import sync_playwright
URL = "file:///D:/website/index.html"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(URL, wait_until="load"); pg.wait_for_timeout(5000)
    pg.evaluate("document.getElementById('mark').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(1200)
    # move pointer over the mark to show interaction
    box = pg.locator("#markCanvas").bounding_box()
    pg.mouse.move(box["x"]+box["width"]*0.72, box["y"]+box["height"]*0.32)
    pg.wait_for_timeout(900)
    pg.screenshot(path=".shots/11-mark.png")
    print("ERR", errs)
    b.close()
