import gzip, sys, collections
import xml.etree.ElementTree as ET
path=sys.argv[1]
counts=[]; parents=[]; cats=[]
tn_all=set(); desc_tns=[]
for ev,el in ET.iterparse(gzip.open(path),events=('end',)):
    if el.tag=='DescriptorRecord':
        tns=[t.text for t in el.findall('./TreeNumberList/TreeNumber')]
        ui=el.findtext('DescriptorUI')
        desc_tns.append((ui,tns)); tn_all.update(tns)
        el.clear()
n=len(desc_tns)
c=collections.Counter(len(t) for _,t in desc_tns)
with_tn=[t for _,t in desc_tns if t]
tot=sum(len(t) for t in with_tn)
print("descriptors",n,"with tree numbers",len(with_tn),"total tree numbers",tot)
print("mean per descriptor with tn %.3f; mean over all %.3f"%(tot/len(with_tn),tot/n))
print("dist",sorted(c.items()))
multi=sum(1 for t in with_tn if len(t)>1)
print("multi-tn",multi,"%.1f%%"%(100*multi/len(with_tn)))
# distinct parents: parent descriptor of each tree number
tn2d={}
for ui,t in desc_tns:
    for x in t: tn2d[x]=ui
dp=[]; topcat=[]
for ui,t in desc_tns:
    if not t: continue
    ps=set()
    for x in t:
        if '.' in x: ps.add(tn2d.get(x.rsplit('.',1)[0]))
        else: ps.add('ROOT:'+x[0])
    dp.append(len(ps)); topcat.append(len(set(x[0] for x in t)))
cd=collections.Counter(dp)
print("distinct parent descriptors: mean %.3f; >1 parent: %d (%.1f%%)"%(sum(dp)/len(dp),sum(1 for v in dp if v>1),100*sum(1 for v in dp if v>1)/len(dp)))
print("parent dist",sorted(cd.items())[:12])
print(">1 top-level category letter: %d (%.1f%%)"%(sum(1 for v in topcat if v>1),100*sum(1 for v in topcat if v>1)/len(topcat)))
mx=max(desc_tns,key=lambda d:len(d[1])); print("max",mx[0],len(mx[1]))
