from PIL import Image
import numpy as np
for f in ["logo-mark.png","logo-512.png","badge.png","mark.png"]:
    im = Image.open("assets/img/"+f).convert("RGBA")
    a = np.asarray(im).astype(float)[:,:,3]/255.0
    W = 44
    h = max(1,int(a.shape[0]/a.shape[1]*W*0.5))
    s = np.asarray(Image.fromarray((a*255).astype(np.uint8)).resize((W,h), Image.LANCZOS)).astype(float)/255.0
    print("==",f,im.size,"alpha coverage",round(a.mean(),3))
    chars=" .:-=+*#%@"
    for r in s:
        print("".join(chars[min(9,int(p*10))] for p in r))
