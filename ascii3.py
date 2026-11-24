from PIL import Image
import numpy as np
im = Image.open("assets/img/mark.png").convert("RGBA")
a = np.asarray(im).astype(float)[:,:,3]/255.0
ys,xs = np.where(a>0.06)
y0,y1,x0,x1 = ys.min(),ys.max()+1,xs.min(),xs.max()+1
crop = a[y0:y1, x0:x1]
print("bbox",x0,y0,x1,y1,"size",crop.shape)
W=54
h=max(1,round(crop.shape[0]/crop.shape[1]*W*0.52))
small = np.asarray(Image.fromarray((crop*255).astype(np.uint8)).resize((W,h), Image.LANCZOS)).astype(float)/255.0
hexs="0123456789abcdef"
rows=[]
for r in small:
    rows.append("".join(hexs[min(15,int(round(p*15)))] for p in r))
print("W,H =",W,h)
print('const MASK = [')
for r in rows: print('  "%s",'%r)
print('];')
ks=[k for k,v in sorted({}.items())]
print("nonzero frac", (small>0.12).mean())
