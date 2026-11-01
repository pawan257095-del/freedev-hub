const fs=require('fs'), vm=require('vm'), path=require('path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'data.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox);
const items=sandbox.window.FREEDEV_ITEMS||[];
if(!items.length) throw new Error('No resources found in data.js');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'category';
const base=(process.env.SITE_URL||'').trim().replace(/\/$/,''); // Set SITE_URL to the final HTTPS domain before indexing.
const gaId=(process.env.GA_MEASUREMENT_ID||'').trim();
if(gaId && !/^G-[A-Z0-9]+$/i.test(gaId)) throw new Error('Invalid GA_MEASUREMENT_ID. Expected a Google Analytics ID beginning with G-.');
const gaTag=gaId ? `<!-- FreeDev Hub GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');</script>` : '';
const grouped=new Map();
for(const item of items){const key=item.category||'Other'; if(!grouped.has(key)) grouped.set(key,[]); grouped.get(key).push(item);}
const categories=[...grouped.keys()].sort((a,b)=>a.localeCompare(b));
const links=categories.map(c=>`<a href="./${slug(c)}/index.html">${esc(c)} <span>${grouped.get(c).length}</span></a>`).join('');
const css=`<style>
:root{color-scheme:dark;--bg:#0b1020;--panel:#121a2e;--text:#edf2ff;--muted:#a6b2cc;--line:#26324d;--accent:#8b9cff}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 15% 0%,#1a2850 0,transparent 42%),var(--bg);color:var(--text);font:16px/1.65 system-ui,-apple-system,Segoe UI,sans-serif}
.wrap{width:min(1120px,calc(100% - 36px));margin:auto}.top{padding:26px 0;border-bottom:1px solid var(--line)}a{color:#b8c4ff}.brand{font-weight:800;color:white;text-decoration:none;font-size:20px}.hero{padding:58px 0 28px}.eyebrow{color:#9eafff;font-size:12px;font-weight:800;letter-spacing:.14em}.hero h1{font-size:clamp(34px,6vw,58px);line-height:1.08;margin:12px 0}.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:24px 0 48px}.card,.resource{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px}.card{display:block;text-decoration:none;color:var(--text)}.card:hover,.resource:hover{border-color:#788cff}.card span{display:block;color:var(--muted);font-size:13px}.resource{margin:12px 0}.resource h3{margin:0 0 5px;font-size:18px}.resource p{margin:4px 0 12px;color:var(--muted)}.section{padding:16px 0 30px}.footer{border-top:1px solid var(--line);padding:24px 0 44px;color:var(--muted);font-size:13px}.crumb{font-size:14px;color:var(--muted)}.btn{display:inline-block;padding:10px 15px;border:1px solid var(--line);border-radius:999px;text-decoration:none;margin:8px 8px 0 0}
</style>`;
const page=(title,desc,canonical,body,crumb='')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${canonical ? `<link rel="canonical" href="${canonical}">` : ""}${gaTag}<meta name="robots" content="${base ? "index,follow" : "noindex,follow"}"><meta name="theme-color" content="#0b1020"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}">${css}</head><body><header class="top"><div class="wrap"><a class="brand" href="../../index.html">FreeDev Hub</a></div></header><main class="wrap">${crumb}<div class="hero"><div class="eyebrow">DEVELOPER RESOURCE DIRECTORY</div><h1>${esc(title.split(' | ')[0])}</h1><p class="muted">${esc(desc)}</p><a class="btn" href="../../index.html#directory">Explore full searchable directory</a></div>${body}</main><footer class="footer"><div class="wrap">FreeDev Hub is a discovery directory. Free-plan terms, limits, availability and commercial permissions can change; verify details on each provider’s official website. <a href="../../index.html">Home</a></div></footer></body></html>`;
const urls=base?[base+'/']:[];
const categoryCards=categories.map(c=>`<a class="card" href="./${slug(c)}/index.html"><strong>${esc(c)}</strong><span>${grouped.get(c).length} listed resources</span></a>`).join('');
const homeBody=`<section class="section"><h2>Browse categories</h2><div class="grid">${categoryCards}</div></section><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":"FreeDev Hub developer resources","description":"Browse developer tools and services by category.","url":base+"/"})}</script>`;
fs.writeFileSync(path.join(root,'seo-home.html'),page('FreeDev Hub | Free developer tools and services','Browse a searchable directory of developer tools, cloud services, APIs, databases, hosting and AI resources.',base+'/',homeBody));
for(const c of categories){
 const slugged=slug(c), dir=path.join(root,'categories',slugged); fs.mkdirSync(dir,{recursive:true});
 const list=grouped.get(c);
 const resourceHtml=list.slice(0,30).map(x=>`<article class="resource"><h3><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a></h3><p>${esc(x.description||'No description was supplied in the source directory.')}</p></article>`).join('');
 const body=`<section class="section"><h2>${esc(c)} resources</h2><p class="muted">Showing ${Math.min(list.length,30)} of ${list.length} entries in this source category. Use the full directory for search, sorting and saved resources.</p>${resourceHtml}</section><section class="section"><h2>Explore other categories</h2><div class="grid">${categories.filter(x=>x!==c).map(x=>`<a class="card" href="../${slug(x)}/index.html">${esc(x)}<span>${grouped.get(x).length} resources</span></a>`).join('')}</div></section><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage","name":c+" developer resources","description":"Browse "+list.length+" directory entries in "+c+".","url":base+'/categories/'+slugged+'/'})}</script>`;
 const desc=`Explore ${list.length} ${c.toLowerCase()} developer resources, tools and services in FreeDev Hub. Check official provider pages for current free plans, limits and terms.`;
 const canonical=base+'/categories/'+slugged+'/';
 // category page needs home-relative links; page helper uses ../../ for all pages, which is correct from /categories/slug/
 fs.writeFileSync(path.join(dir,'index.html'),page(c+' developer resources | FreeDev Hub',desc,canonical,body,`<p class="crumb"><a href="../../index.html">Home</a> / ${esc(c)}</p>`));
 if(base) urls.push(canonical);
}
// Add crawlable category links to the main page so search engines can discover every landing page.
const homePath=path.join(root,'index.html');
let homeHtml=fs.readFileSync(homePath,'utf8');
homeHtml=homeHtml.replace(/<!-- FreeDev Hub GA4 -->[\\s\\S]*?<\\/script>/,'');
if(gaTag) homeHtml=homeHtml.replace('</head>',gaTag+'</head>');
if(base){
 homeHtml=homeHtml.replace(/<meta name="robots" content="[^"]*">/i,'<meta name="robots" content="index,follow">');
 if(!/<link rel="canonical"/i.test(homeHtml)) homeHtml=homeHtml.replace('</head>',`<link rel="canonical" href="${base}/"></head>`);
}else{
 homeHtml=homeHtml.replace(/<meta name="robots" content="[^"]*">/i,'<meta name="robots" content="noindex,follow">');
}
const staticNav=`<section class="seo-category-index" aria-labelledby="seo-category-heading"><h2 id="seo-category-heading">Browse developer resources by category</h2><p>Explore the directory through these category guides.</p><nav aria-label="Developer resource categories">${categories.map(c=>`<a href="categories/${slug(c)}/index.html">${esc(c)}</a>`).join('')}</nav></section>`;
if(!homeHtml.includes('seo-category-index')) homeHtml=homeHtml.replace('</main>',staticNav+'</main>');
fs.writeFileSync(homePath,homeHtml);
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`);
console.log(JSON.stringify({items:items.length,categories:categories.length,sitemapUrls:urls.length,siteUrlConfigured:Boolean(base),categoryIndexing:base?'enabled':'disabled-until-domain-configured'}));
