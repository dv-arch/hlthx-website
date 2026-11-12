"""Static preview of the Trusted by page, the home strip and the lab results page (placeholder data).
Usage: python render_trusted.py <out dir>   (needs python-liquid)"""
import json, re, sys, os, shutil, datetime
from liquid import Environment, FileSystemLoader, Mode
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); OUT=sys.argv[1]; BASE='/trusted-preview'
class Loader(FileSystemLoader):
    def get_source(self, env, name, *a, **k):
        return super().get_source(env, name if name.endswith('.liquid') else name+'.liquid', *a, **k)
env=Environment(loader=Loader(ROOT+"/snippets"), tolerance=Mode.LAX); F=env.filters
F['image_url']=lambda v,*a,**k: v.get('src','') if isinstance(v,dict) else ''
F['image_tag']=lambda v,*a,**k: f'<img src="{v}" alt="{k.get("alt","")}" loading="lazy">' if v else ''
F['video_tag']=lambda v,*a,**k: ''
F['asset_url']=lambda v: BASE+'/assets/'+str(v)
F['newline_to_br']=lambda v: str(v).replace('\n','<br />\n')
F['handleize']=lambda v: re.sub(r'[^a-z0-9]+','-',str(v).lower()).strip('-')
F['t']=lambda v,*a,**k: str(v); F['default_errors']=lambda v: ''
def date(v, fmt=''):
    if str(v) in ('now','today'): return datetime.date.today().strftime(fmt or '%Y')
    try: d=datetime.date.fromisoformat(str(v))
    except Exception: return str(v)
    return d.strftime(fmt)
F['date']=date
def defaults(sch): return {s['id']:(s.get('default') if s.get('type') in ('number','range','checkbox','product','video','image_picker','link_list') else s.get('default','')) for s in sch if 'id' in s}
settings=defaults([s for g in json.load(open(ROOT+'/config/settings_schema.json')) for s in g.get('settings',[])])
V=lambda x: {'value':x}
PH_NAME='Name to confirm'; PH_CRED='Qualification and hospital to confirm'; PH_QUOTE='Quote to come, in their own words and approved by them.'
PH_ROLE='Role to confirm, e.g. reviewed the formulation for dose and safety.'; PH_DISC='Relationship to confirm, e.g. paid advisor'
rels=['Formulated with input from','Reviewed by','Formulated with input from','Reviewed by']
xs={}
for i in range(4):
    h=f'expert-{i+1}'
    xs[h]={'system':{'handle':h},'name':V(f'{PH_NAME} ({i+1})'),'credential':V(PH_CRED),'category':V('Doctor'),'relationship':V(rels[i]),
           'photo':V({'src':f'{BASE}/assets/xp{i+1}.jpg'}),'video':V(''),'quote':V(''),'role':V(PH_ROLE),'disclosure':V(PH_DISC),'consent':V(True),'position':V(i+1)}
rs={'example':{'system':{'handle':'example'},'batch':V('Batch number to come'),'tested_on':V('2026-12-01'),'lab':V('Laboratory name to come'),'accreditation':V('NABL'),
     'results':V(['Label claim: Result to come','Heavy metals: Result to come','Microbiology: Result to come','Probiotic count: Result to come']),'certificate':V('')}}
mo={'expert':dict(xs, values=list(xs.values())),'lab_report':dict(rs, values=list(rs.values()))}
glob=dict(settings=settings, shop={'name':'HLTHX','metaobjects':mo}, routes={'root_url':'/','cart_url':'/cart'}, request={'path':'/','design_mode':False}, cart={'item_count':0}, page={'title':''})
CSS=[]
def section(stype, sdata, sid):
    src=open(f'{ROOT}/sections/{stype}.liquid').read()
    sch=json.loads(src[src.index('{% schema %}')+12:src.index('{% endschema %}')])
    if '{% stylesheet %}' in src:
        CSS.append(src[src.index('{% stylesheet %}')+16:src.index('{% endstylesheet %}')]); src=src[:src.index('{% stylesheet %}')]+src[src.index('{% endstylesheet %}')+19:]
    src=src[:src.index('{% schema %}')]
    st=defaults(sch.get('settings',[])); st.update(sdata.get('settings',{}))
    bdefs={b['type']:b for b in sch.get('blocks',[])}; blocks=[]
    for k in sdata.get('block_order',[]):
        b=sdata['blocks'][k]; d=defaults(bdefs[b['type']].get('settings',[])); d.update(b.get('settings',{})); blocks.append({'type':b['type'],'settings':d,'shopify_attributes':'','id':k})
    return env.from_string(src).render(section={'settings':st,'blocks':blocks,'id':sid}, **glob)
def template(name):
    t=json.load(open(f'{ROOT}/templates/{name}.json')); return ''.join(section(t['sections'][k]['type'], t['sections'][k], k) for k in t['order'])
def group(name):
    g=json.load(open(f'{ROOT}/sections/{name}.json')); return ''.join(section(g['sections'][k]['type'], g['sections'][k], k) for k in g['order'])
head=group('header-group'); foot=group('footer-group')
os.makedirs(OUT+'/assets', exist_ok=True)
for f in ['hlthx.css','hlthx.js','motion.min.js','hlthx-motion.js']: shutil.copy(f'{ROOT}/assets/{f}', f'{OUT}/assets/{f}')
store='https://hlthx-store.myshopify.com'
def page(main, title, path):
    html=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} | HLTHX preview</title><meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="{BASE}/assets/hlthx.css"><style>{"".join(CSS)}
.pv{{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:90;display:flex;gap:4px;padding:5px;border-radius:999px;background:rgba(20,20,20,.9);font:500 .76rem Montserrat,sans-serif;box-shadow:0 12px 30px -12px rgba(0,0,0,.5)}}
.pv a{{color:#fff;text-decoration:none;padding:.6em 1em;border-radius:999px;white-space:nowrap}}.pv a[aria-current]{{background:#E3A008;color:#1B1203}}</style>
<script>if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){{document.documentElement.classList.add('mo');setTimeout(function(){{document.documentElement.classList.remove('mo')}},3000)}}</script>
</head><body>
{head}
<main id="MainContent">{main}</main>
{foot}
<nav class="pv" aria-label="Preview pages"><a href="{BASE}/"{' aria-current="page"' if path=='/index.html' else ''}>Trusted by</a><a href="{BASE}/home"{' aria-current="page"' if path=='/home.html' else ''}>Home strip</a><a href="{BASE}/lab-tests"{' aria-current="page"' if path=='/lab-tests.html' else ''}>Lab results</a></nav>
<script src="{BASE}/assets/hlthx.js" defer></script><script src="{BASE}/assets/motion.min.js" defer></script><script src="{BASE}/assets/hlthx-motion.js" defer></script>
</body></html>'''
    html=re.sub(r'href="/(?!/|trusted-preview)', 'href="'+store+'/', html)
    html=html.replace(store+'/pages/lab-tests', BASE+'/lab-tests').replace(store+'/pages/trusted-by', BASE+'/')
    for ph in [PH_CRED, PH_QUOTE, PH_ROLE, PH_DISC, 'Batch number to come', 'Laboratory name to come', 'Result to come']+[f'{PH_NAME} ({i+1})' for i in range(4)]:
        html=html.replace(ph, f'<span class="xp__ph">{ph}</span>')
    open(OUT+path,'w').write(html); return len(re.findall(r'\{\{|\{%', html))
home=json.load(open(ROOT+'/templates/index.json'))
strip=section('trusted-strip', home['sections']['trusted'], 'trusted')
print('unrendered', page(template('page.trusted-by'),'Trusted by','/index.html'), page(strip,'Home strip','/home.html'), page(template('page.lab-tests'),'Lab results','/lab-tests.html'))
