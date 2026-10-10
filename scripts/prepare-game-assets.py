"""Export user-approved PNG masters as WebP; usage: python scripts/prepare-game-assets.py SOURCE."""
from pathlib import Path
from PIL import Image
import sys,json,hashlib
source=Path(sys.argv[1]);target=Path('public/game-assets');target.mkdir(parents=True,exist_ok=True)
manifest=[]
for file in sorted(source.glob('*.png')):
    im=Image.open(file)
    max_width=1920 if file.stem.startswith(('scene-','world-sky','ending-')) else 1100
    if im.width>max_width: im.thumbnail((max_width,1100),Image.Resampling.LANCZOS)
    out=target/(file.stem+'.webp');im.save(out,'WEBP',quality=86,method=6)
    manifest.append({'source':file.name,'file':out.name,'width':im.width,'height':im.height,'bytes':out.stat().st_size,'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest()})
Path('public/game-assets/manifest.json').write_text(json.dumps({'sourceFolder':'https://drive.google.com/drive/folders/16gTL9i8vJ7p6s1M6PqSaKPo_NJ8x95u6','assets':manifest},indent=2))
print(len(manifest),'assets;',sum(a['bytes'] for a in manifest),'bytes')
