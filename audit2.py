from playwright.sync_api import sync_playwright
import json

JS = r"""
() => {
  const out = {};
  out.scrollW = document.documentElement.scrollWidth;
  out.innerW = window.innerWidth;
  const over = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2)) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'absolute') return;
      over.push([el.tagName + '.' + (el.className||'').toString().slice(0,40), Math.round(r.left), Math.round(r.right)]);
    }
  });
  out.overflow = over.slice(0, 12);
  out.eyebrows = [...document.querySelectorAll('.eyebrow')].map(e => e.textContent.trim().replace(/\s+/g,' '));
  out.sections = [...document.querySelectorAll('main section')].map(s => [s.id, Math.round(s.getBoundingClientRect().height)]);
  const mf = document.querySelector('.mf__big');
  out.mfText = mf ? mf.innerText.replace(/\n/g,' | ') : null;
  out.mfWords = mf ? mf.querySelectorAll('.w').length : 0;
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for w,h,tag in [(1600,1000,'desk'),(390,844,'mob')]:
        pg = b.new_page(viewport={'width':w,'height':h})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('C:'+m.text) if m.type=='error' else None)
        pg.goto('file:///D:/website/index.html', wait_until='load')
        pg.wait_for_timeout(5000)
        print(tag, json.dumps(pg.evaluate(JS), indent=1)[:2500])
        print(tag, 'errs', errs[:5])
        pg.close()
    b.close()
