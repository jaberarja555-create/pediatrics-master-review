"""Draw yellow arrows and labels on X-ray / ultrasound pictures (owner: mark the sign for students).
Usage: from tools.annotate import run; run("name", [("a",(x1,y1),(x2,y2)), ("t",(x,y),"Label",size)])
Reads D+name+".jpg" and overwrites it; keep the original (git) and re-annotate from it."""
import math,sys
from PIL import Image,ImageDraw,ImageFont
D='/home/user/pediatrics-master-review/content/img/'
FONT='/usr/share/fonts/opentype/inter/Inter-Bold.otf'
Y=(255,214,64)
def label(d,xy,text,size):
    f=ImageFont.truetype(FONT,size); x,y=xy
    b=d.textbbox((x,y),text,font=f); p=max(3,size//6)
    d.rounded_rectangle((b[0]-p,b[1]-p,b[2]+p,b[3]+p),radius=p,fill=(0,0,0,175))
    d.text((x,y),text,font=f,fill=Y)
    return b
def arrow(d,a,b,w):
    for col,ww in (((0,0,0,200),w+2),(Y+(255,),w)):
        d.line([a,b],fill=col,width=ww)
        ang=math.atan2(b[1]-a[1],b[0]-a[0]); L=w*4
        pts=[b,(b[0]-L*math.cos(ang-0.45),b[1]-L*math.sin(ang-0.45)),(b[0]-L*math.cos(ang+0.45),b[1]-L*math.sin(ang+0.45))]
        d.polygon(pts,fill=col)
def run(name,items,size=26,w=5,src=None):
    im=Image.open(D+(src or name)+'.jpg').convert('RGBA'); ov=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(ov)
    for it in items:
        if it[0]=='a': arrow(d,it[1],it[2],w)
    for it in items:
        if it[0]=='t': label(d,it[1],it[2],it[3] if len(it)>3 else size)
    Image.alpha_composite(im,ov).convert('RGB').save(D+name+'.jpg',quality=90)
