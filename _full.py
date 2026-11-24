from playwright.sync_api import sync_playwright
from PIL import Image

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.goto('file:///D:/website/index.html', wait_until='load')
    pg.wait_for_timeout(4000)
    # scroll through to trigger reveals
    for y in range(0, 15000, 700):
        pg.evaluate('(y)=>scrollTo(0,y)', y)
        pg.wait_for_timeout(120)
    pg.evaluate('scrollTo(0,0)')
    pg.wait_for_timeout(800)
    pg.screenshot(path='.shots/full.png', full_page=True)
    b.close()

im = Image.open('.shots/full.png')
print(im.size)
w, h = im.size
scale = 900 / w
im = im.resize((900, int(h * scale)), Image.LANCZOS)
# split into two halves for legibility
half = im.height // 2
im.crop((0, 0, 900, half)).save('.shots/full-a.png')
im.crop((0, half, 900, im.height)).save('.shots/full-b.png')
print('ok', im.size)
