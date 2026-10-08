"""Bake hollow, smoothly joined garment meshes. Requires numpy; no image editing.
The browser only loads the mesh and the existing product photographs.
"""
from pathlib import Path
import numpy as np
import gzip

OUT = Path(__file__).resolve().parents[1] / 'public/storefront/clothing-rail/meshes'
STEP = 2.5

def generate(style):
    tee = style in ('tee', 'court')
    fitted = style == 'court'
    quarter = style == 'quarter'
    bottom = 307 if fitted else 283 if tee else 300 if quarter else 320 if style == 'sweat-short' else 329
    width = 76 if fitted else 81 if tee else 82 if quarter else 87
    xs=np.arange(-140,141,STEP); ys=np.arange(15,346,STEP); zs=np.arange(-49,50,STEP)
    X,Y,Z=np.meshgrid(xs,ys,zs,indexing='ij')
    def field(x,y,z):
        width_y=np.interp(y,[20,35,65,110,bottom-30,bottom],[35,52,width-5,width,width-2,width-1])
        depth_y=np.interp(y,[20,40,70,110,bottom],[14,22,29,32,23])
        t=np.clip((y-55)/(bottom-55),0,1)
        theta=np.arctan2(x/width,z/30)
        fold=(np.sin(theta*7+t*2.3)*1.8+np.sin(theta*13-t*4)*.55)*np.minimum(t*4,1)
        body=(np.sqrt((x/(width_y+fold))**2+(z/(depth_y+fold))**2)-1)*depth_y
        shoulder=27+(43 if quarter else 32)*np.abs(x)/width
        hem=bottom+2*np.sin(theta*3)+1.2*np.cos(theta*7)
        body=np.maximum(body,np.maximum(shoulder-y,y-hem))
        for side in [-1,1]:
            sx=side*(width-44); sy=75 if tee else 88
            ex=side*(112 if tee else 112); ey=135 if tee else bottom-3
            dx=ex-sx; dy=ey-sy; length=np.hypot(dx,dy)
            along=((x-sx)*dx+(y-sy)*dy)/length
            t=np.clip(along/length,0,1)
            across=((x-sx)*dy-(y-sy)*dx)/length
            r=30+(23-30)*t if tee else 29+(17-29)*t
            d=27+(18-27)*t if tee else 26+(16-26)*t
            wrinkle=(np.sin(t*23+z*.12)*.7+np.sin(t*7+across*.1)*.7)*np.sin(t*np.pi)
            sleeve=(np.sqrt((across/(r+wrinkle))**2+((z+2)/(d+wrinkle))**2)-1)*d
            sleeve=np.maximum(sleeve,np.maximum(-along,along-length))
            k=9
            h=np.clip(.5+.5*(sleeve-body)/k,0,1)
            body=sleeve*(1-h)+body*h-k*h*(1-h)
        collar=(np.sqrt((x/(29 if quarter else 32))**2+(z/17)**2)-1)*17
        collar=np.maximum(collar,np.maximum(27+(23 if quarter else 13)*np.clip(z/17,0,1)-y,y-(64 if quarter else 50)))
        h=np.clip(.5+.5*(collar-body)/5,0,1)
        body=collar*(1-h)+body*h-5*h*(1-h)
        # Oval open neckline; the shaded inside is physically visible on turns.
        neck=(np.sqrt((x/(26 if quarter else 29))**2+(z/14)**2)-1)*14
        neck=np.maximum(neck,y-(62 if quarter else 55))
        return np.maximum(body,-neck)
    F=field(X,Y,Z)
    grad=np.stack(np.gradient(F,STEP),axis=-1)
    corners=np.array([[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]])
    tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]]
    vs=[F[c[0]:F.shape[0]-1+c[0],c[1]:F.shape[1]-1+c[1],c[2]:F.shape[2]-1+c[2]] for c in corners]
    active=np.argwhere((np.min(vs,axis=0)<0)&(np.max(vs,axis=0)>=0))
    vertices=[]
    for cell in active:
        indices=cell+corners
        vals=F[tuple(indices.T)]
        ps=np.column_stack([xs[indices[:,0]],ys[indices[:,1]],zs[indices[:,2]]])
        ns=grad[tuple(indices.T)]
        for tet in tets:
            inside=[i for i in tet if vals[i]<0];outside=[i for i in tet if vals[i]>=0]
            if not inside or not outside:continue
            def cut(a,b):
                t=vals[a]/(vals[a]-vals[b]); p=ps[a]+t*(ps[b]-ps[a]);n=ns[a]+t*(ns[b]-ns[a]);n/=np.linalg.norm(n)
                return p,n
            if len(inside)==1:
                triangles=[[cut(inside[0],b) for b in outside]]
            elif len(outside)==1:
                triangles=[[cut(outside[0],b) for b in inside]]
            else:
                a,b=inside;c,d=outside
                ac,ad,bc,bd=cut(a,c),cut(a,d),cut(b,c),cut(b,d)
                triangles=[[ac,ad,bc],[ad,bd,bc]]
            for tri in triangles:
                p=np.mean([v[0] for v in tri],axis=0);n=np.mean([v[1] for v in tri],axis=0)
                # Leave the waist and cuff ends open, with a visible thin textile rim.
                if all(v[0][1]>bottom-3 for v in tri):continue
                cuff=False
                for side in [-1,1]:
                    sx=side*(width-44);sy=75 if tee else 88;ex=side*112;ey=135 if tee else bottom-3
                    axis=np.array([ex-sx,ey-sy,0.]);length=np.linalg.norm(axis);axis/=length
                    along=np.dot(p-np.array([sx,sy,-2]),axis)
                    if along>length-1 and np.dot(n,axis)>.8:cuff=True
                if cuff:continue
                cross=np.cross(tri[1][0]-tri[0][0],tri[2][0]-tri[0][0])
                if np.dot(cross,n)<0:tri.reverse()
                clipped=[]
                for a,b in zip(tri,tri[1:]+tri[:1]):
                    ina=a[0][1]<=bottom-3;inb=b[0][1]<=bottom-3
                    if ina:clipped.append(a)
                    if ina!=inb:
                        t=(bottom-3-a[0][1])/(b[0][1]-a[0][1]);pos=a[0]+t*(b[0]-a[0]);norm=a[1]+t*(b[1]-a[1]);norm/=np.linalg.norm(norm);clipped.append((pos,norm))
                for i in range(1,len(clipped)-1):
                    for pos,norm in [clipped[0],clipped[i],clipped[i+1]]:
                        x,y,z=pos
                        vertices.append([x+140,y,z,*norm,(x+140)/280,y/360,0 if z>=0 else 1])
    data=np.asarray(vertices,dtype='<f4')
    scales=np.array([50,50,50,10000,10000,10000,10000,10000,10000])
    unique, indices=np.unique(np.round(data*scales).astype('<i2'),axis=0,return_inverse=True)
    packed=unique.tobytes();padding=b'\0'*(-len(packed)%4)
    payload=np.array([len(unique),len(indices),16+len(packed)+len(padding),1],dtype='<u4').tobytes()+packed+padding+indices.astype('<u4').tobytes()
    with gzip.open(OUT/f'{style}.bin.gz','wb',compresslevel=9) as f:f.write(payload)
    print(style,len(vertices)//3,'triangles',len(unique),'vertices',(OUT/f'{style}.bin.gz').stat().st_size,'bytes')
for style in ['tee','court','quarter','sweat','sweat-short']:generate(style)
