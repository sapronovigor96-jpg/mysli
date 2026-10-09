from PIL import Image
W,H=40,30
C=dict(K=(52,36,28),B=(150,100,64),D=(122,80,50),W=(244,230,218),S=(214,192,178),P=(232,170,160),E=(40,52,58),G=(96,110,118),H=(255,255,255),T=(58,160,226),N=(232,150,140))
canvas=[[None]*W for _ in range(H)]
def layer():
    return [[None]*W for _ in range(H)]
def rect(L,x0,y0,x1,y1,c):
    for y in range(max(0,y0),min(H,y1+1)):
        for x in range(max(0,x0),min(W,x1+1)): L[y][x]=c
def outline_and_merge(L):
    # outline around shape, then paste onto canvas
    o=[r[:] for r in L]
    for y in range(H):
        for x in range(W):
            if L[y][x] is None:
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    X,Y=x+dx,y+dy
                    if 0<=X<W and 0<=Y<H and L[Y][X] is not None:
                        o[y][x]='K';break
    for y in range(H):
        for x in range(W):
            if o[y][x] is not None: canvas[y][x]=o[y][x]
# ---- head layer (ears + head) ----
h=layer()
# ears: triangles, mirrored
for y in range(1,11):
    t=y-1
    for x in range(12-t//4, min(12+t,20)+1):
        h[y][x]='B'; h[y][49-x]='B'
for y in range(3,10):
    t=y-3
    for x in range(13, 13+t):
        if x<=17: h[y][x]='P'; h[y][49-x]='P'
# head body rounded
top=8
for y in range(top,H):
    k=y-top
    inset=[4,2,1,1][k] if k<4 else 0
    rect(h,11+inset,y,38-inset,y,'B')
# face: cream lower + V blaze
for y in range(16,H): rect(h,12,y,37,y,'W')
for y in range(12,16):
    half=(y-12)
    rect(h,24-half,y,25+half,y,'W')
# cheeks keep brown edges down to row 20
for y in range(16,21):
    rect(h,11,y,13-(y-16)//2,y,'B'); rect(h,36+(y-16)//2,y,38,y,'B')
# subtle darker shading on cap
# eyes (rounded)
for ex in (15,28):
    rect(h,ex,15,ex+6,20,'E')
    h[15][ex]='B' if ex==15 else 'W'; h[15][ex+6]='W' if ex==15 else 'B'
    h[20][ex]='W'; h[20][ex+6]='W'
    rect(h,ex+1,18,ex+5,19,'G')
    h[16][ex+2]='H'; h[16][ex+3]='H'; h[17][ex+2]='H'; h[18][ex+4]='H'
# fix eye corners that fall on brown area
h[15][15]='B'; h[15][34]='B'
# tears
for (x,y) in [(15,21),(15,22),(16,22),(34,21),(34,22),(33,22),(34,23)]:
    h[y][x]='T'
# nose + mouth
rect(h,24,21,25,21,'N'); h[22][24]='N'; h[22][25]='N'
for (x,y) in [(24,23),(25,23),(23,24),(26,24),(22,23),(27,23)]:
    h[y][x]='K'
outline_and_merge(h)
# ---- paw layer ----
p=layer()
rect(p,2,20,11,H-1,'W')
rect(p,3,13,7,20,'W')      # thumb
rect(p,8,18,11,19,'W')
p[13][3]=None; p[13][7]=None
p[20][2]=None
# finger creases
for y in (22,25,28):
    rect(p,7,y,11,y,'S')
rect(p,3,16,4,17,'S')
outline_and_merge(p)
im=Image.new('RGBA',(W,H),(0,0,0,0))
for y in range(H):
    for x in range(W):
        c=canvas[y][x]
        if c: im.putpixel((x,y),C[c]+(255,))
im.save('cat-px.png'); im.resize((W*12,H*12),Image.NEAREST).save('cat-big.png')
