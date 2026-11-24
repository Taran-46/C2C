import json
from PIL import Image
import numpy as np

im = Image.open('assets/img/mark.png').convert('RGBA')
a = np.asarray(im).astype(float)[:, :, 3] / 255.0

variants = [
    " .:-=+*#%@",
    " ·-+*#@",
    " ░▒▓█",
]

arts = []
for v in variants:
    W = 52
    h = int(a.shape[0] / a.shape[1] * W * 0.5)
    small = Image.fromarray((a * 255).astype(np.uint8)).resize((W, h), Image.LANCZOS)
    arr = np.asarray(small).astype(float) / 255.0
    lines = []
    for row in arr:
        s = ''.join(v[min(len(v) - 1, int(p * len(v)))] for p in row)
        lines.append(s.rstrip())
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    arts.append(lines)

json.dump(arts, open('assets/img/posters.json', 'w', encoding='utf-8'), ensure_ascii=False)

with open('assets/img/posters.txt', 'w', encoding='utf-8') as f:
    for a2 in arts:
        f.write('\n'.join(a2) + '\n---\n')
print('ok', [len(x) for x in arts])
