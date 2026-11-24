from playwright.sync_api import sync_playwright
URL = "file:///D:/website/index.html"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="load"); pg.wait_for_timeout(5200)
    pg.click("#modeBtn"); pg.wait_for_timeout(2600)
    pg.screenshot(path=".shots/14-light-hero.png")
    pg.evaluate("document.getElementById('mark').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(2400)
    pg.screenshot(path=".shots/16-light-mark.png")
    pg.evaluate("document.querySelector('#join').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(1600)
    pg.screenshot(path=".shots/17-light-join.png")
    print("ERR", errs); b.close()
