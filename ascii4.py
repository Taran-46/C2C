from PIL import Image
import numpy as np, json
im = Image.open("assets/img/mark.png").convert("RGBA")
a = np.asarray(im).astype(float)[:,:,3]/255.0
ys,xs = np.where(a>0.06); y0,y1,x0,x1 = ys.min(),ys.max()+1,xs.min(),xs.max()+1
crop = a[y0:y1, x0:x1]
W=56
h=max(1,round(crop.shape[0]/crop.shape[1]*W*0.50))
small = np.asarray(Image.fromarray((crop*255).astype(np.uint8)).resize((W,h), Image.LANCZOS)).astype(float)/255.0
small = np.where(small<0.13, 0.0, small)
hexs="0123456789abcdef"
rows=["".join(hexs[min(15,int(round(p*15)))] for p in r) for r in small]
print("W,H=",W,h,"frac",round(float((small>0.13).mean()),3))
chars=" .:-=+*#%@"
for r in small:
    print("".join(chars[min(9,int(p*10))] for p in r))
json.dump({"w":W,"h":h,"rows":rows}, open("assets/img/mask.json","w"), separators=(",",":"))
