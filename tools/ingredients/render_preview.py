import json, re, sys, os, shutil
from liquid import Environment, FileSystemLoader
ROOT='/home/user/hlthx-website'; OUT=sys.argv[1]; BASE='/ingredients-preview'
os.makedirs(OUT+'/assets', exist_ok=True)
class Loader(FileSystemLoader):
    def get_source(self, env, name, *a, **k):
        return super().get_source(env, name if name.endswith('.liquid') else name+'.liquid', *a, **k)
env=Environment(loader=Loader(ROOT+'/snippets'))
F=env.filters
for n in ['image_url','image_tag','video_tag','default_errors']: F[n]=lambda v,*a,**k: ''
F['asset_url']=lambda v: BASE+'/assets/'+str(v)
F['newline_to_br']=lambda v: str(v).replace('\n','<br />\n')
F['handleize']=lambda v: re.sub(r'[^a-z0-9]+','-',str(v).lower()).strip('-')
F['t']=lambda v,*a,**k: str(v); F['date']=lambda v,fmt='': '2026'
F['money']=F['money_without_trailing_zeros']=lambda v: '₹'+str(v)
def defaults(sch): return {s['id']:(s.get('default') if s.get('type') in ('number','range','checkbox','product','video','image_picker','link_list') else s.get('default','')) for s in sch if 'id' in s}
settings=defaults([s for g in json.load(open(ROOT+'/config/settings_schema.json')) for s in g.get('settings',[])])
D=json.load(open(ROOT+'/tools/ingredients/ingredients.json'))
V=lambda x: {'value':x}
ings={}
for i in D['ingredients']:
    ings[i['handle']]={'handle':i['handle'],'name':V(i['name']),'form':V(i.get('form') or ''),'group':V(i.get('group')),'amount':V(i.get('amount') or ''),
        'rda':V(i.get('rda') or ''),'rda_basis':V(i.get('rda_basis') or ''),'summary':V(i.get('summary') or ''),'benefits':V(i.get('benefits') or []),
        'card_image':V(''),'system':{'url':f'{BASE}/ingredient/{i["handle"]}'}}
systems={}
for n,s in enumerate(D['systems']):
    systems[s['handle']]={'handle':s['handle'],'name':V(s['name']),'description':V(s['description']),'icon':V(s['icon']),'position':V(n+1),
        'ingredients':V([ings[h] for h in s['ingredients']+s.get('suggested',[])]),
        'page':V({'url':'/pages/bones-teeth'} if s['handle']=='bones-joints-teeth' else ''),'system':{'url':f'{BASE}/body-system/{s["handle"]}'}}
mo={'body_system':dict(systems, values=list(systems.values())),'ingredient':dict(ings, values=list(ings.values()))}
glob=dict(settings=settings, shop={'name':'HLTHX','metaobjects':mo}, routes={'root_url':'/','cart_url':'/cart'}, request={'path':'/pages/ingredients','design_mode':False}, cart={'item_count':0}, page={'title':'Ingredients'})
CSS=[]
def section(stype, sdata, sid, extra=None):
    src=open(f'{ROOT}/sections/{stype}.liquid').read()
    sch=json.loads(src[src.index('{% schema %}')+12:src.index('{% endschema %}')])
    if '{% stylesheet %}' in src:
        CSS.append(src[src.index('{% stylesheet %}')+16:src.index('{% endstylesheet %}')]); src=src[:src.index('{% stylesheet %}')]+src[src.index('{% endstylesheet %}')+19:]
    src=src[:src.index('{% schema %}')]
    src=re.sub(r'\{%-?\s*(end)?paginate[^%]*-?%\}','',src)
    st=defaults(sch.get('settings',[])); st.update(sdata.get('settings',{}))
    bdefs={b['type']:b for b in sch.get('blocks',[])}; blocks=[]
    for k in sdata.get('block_order',[]):
        b=sdata['blocks'][k]; d=defaults(bdefs[b['type']].get('settings',[])); d.update(b.get('settings',{})); blocks.append({'type':b['type'],'settings':d,'shopify_attributes':'','id':k})
    return env.from_string(src).render(section={'settings':st,'blocks':blocks,'id':sid}, **dict(glob, **(extra or {})))
def group(name):
    g=json.load(open(f'{ROOT}/sections/{name}.json')); return ''.join(section(g['sections'][k]['type'], g['sections'][k], k) for k in g['order'])
head=group('header-group'); foot=group('footer-group')
for f in ['hlthx.css','hlthx.js','hlthx-ingredients.js','motion.min.js','hlthx-motion.js']: shutil.copy(f'{ROOT}/assets/{f}', f'{OUT}/assets/{f}')
store='https://hlthx-store.myshopify.com'
def page(main, title, path):
    html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} | HLTHX preview</title><meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{BASE}/assets/hlthx.css"><style>{"".join(CSS)}
.pv{{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:90;padding:.7em 1.2em;border-radius:999px;background:rgba(20,20,20,.88);color:#fff;font:500 .76rem Montserrat,sans-serif;white-space:nowrap;box-shadow:0 12px 30px -12px rgba(0,0,0,.5)}}</style>
<script>if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){{document.documentElement.classList.add('mo');setTimeout(function(){{document.documentElement.classList.remove('mo')}},3000)}}</script>
</head><body>
{head}
<main id="MainContent">{main}</main>
{foot}
<div class="pv">Preview &middot; content from Shopify &rsaquo; Metaobjects</div>
<script src="{BASE}/assets/hlthx.js" defer></script><script src="{BASE}/assets/motion.min.js" defer></script><script src="{BASE}/assets/hlthx-motion.js" defer></script>
</body></html>'''
    html=re.sub(r'href="/(?!/|ingredients-preview)', 'href="'+store+'/', html)
    html=html.replace('href="'+store+'/pages/ingredients#','href="'+BASE+'/#')
    p=OUT+path; os.makedirs(os.path.dirname(p), exist_ok=True); open(p,'w').write(html)
    left=re.findall(r'\{\{|\{%', html)
    return len(html), len(left)
r=[page(section('ingredients-hub',{},'main'),'Ingredients','/index.html')]
for h,i in ings.items(): r.append(page(section('ingredient-page',{},'main',{'metaobject':i}), i['name']['value'], f'/ingredient/{h}.html'))
for h,s in systems.items(): r.append(page(section('body-system-page',{},'main',{'metaobject':s}), s['name']['value'], f'/body-system/{h}.html'))
print(len(r),'pages; unrendered tags:',sum(x[1] for x in r), 'hub size', r[0][0])
