(() => {
  const items = (window.FREEDEV_ITEMS || []).map((x,i)=>({...x,id:i}));
  const $ = id => document.getElementById(id);
  const categories = [...new Set(items.map(x=>x.category))].sort((a,b)=>a.localeCompare(b));
  const state = {query:'',category:'all',quick:'all',sort:'relevance',visible:24,saved:new Set(JSON.parse(localStorage.getItem('freedev-saved')||'[]'))};
  $('totalCount').textContent=items.length.toLocaleString()+'+'; $('categoryCount').textContent=categories.length; $('sideCount').textContent=categories.length;
  const counts = Object.fromEntries(categories.map(c=>[c,items.filter(x=>x.category===c).length]));
  function renderCategories(){
    $('categoryList').innerHTML = `<button class="category-btn ${state.category==='all'?'active':''}" data-cat="all"><span>All resources</span><span>${items.length}</span></button>`+categories.map(c=>`<button class="category-btn ${state.category===c?'active':''}" data-cat="${esc(c)}"><span>${esc(c)}</span><span>${counts[c]}</span></button>`).join('');
    $('categoryList').querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.cat;state.quick='all';state.visible=24;syncQuick();render()}));
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function matchesQuick(x){
    if(state.quick==='all') return true;
    if(state.quick==='saved') return state.saved.has(x.id);
    const hay=(x.name+' '+(x.description||'')+' '+x.category).toLowerCase();
    const rules={
      'AI & ML': /\b(ai|ml|machine learning|artificial intelligence|llm|generative ai|model|inference)\b/i,
      'Hosting': /hosting|web host|static site|deployment|pages platform|app platform/i,
      'Backend': /backend|baas|serverless|database|authentication|auth service/i,
      'Storage': /storage|object store|file hosting|cdn|media storage/i,
      'Databases': /database|sql|nosql|postgres|mysql|mongodb|redis|sqlite|vector database/i,
      'APIs': /\bapi\b|api platform|api access|api marketplace/i,
      'Open-source mentions': /open.source|source available|self.hosted/i
    };
    return (rules[state.quick] || /$^/).test(hay);
  }
  function filtered(){let q=state.query.toLowerCase().trim();let list=items.filter(x=>(state.category==='all'||x.category===state.category)&&matchesQuick(x)&&(!q||(x.name+' '+(x.description||'')+' '+x.category).toLowerCase().includes(q)));
    if(state.sort==='az')list.sort((a,b)=>a.name.localeCompare(b.name));if(state.sort==='za')list.sort((a,b)=>b.name.localeCompare(a.name));return list;}
  function render(){const list=filtered();const shown=list.slice(0,state.visible);$('resultMeta').textContent=`${list.length.toLocaleString()} matching resources`;$('activeCategory').querySelector('span').textContent=state.category==='all'?(state.quick==='all'?'All resources':state.quick+' resources'):state.category;
    $('cards').innerHTML=shown.map(x=>`<article class="resource-card"><a class="card-main-link" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(x.name)} website in a new tab"><div class="card-content"><div class="card-top"><span class="resource-name">${esc(x.name)}</span><span class="external" aria-hidden="true">↗</span></div><p class="card-desc">${esc(x.description||'Visit the provider website for service details, current free-plan availability and terms.')}</p><div class="card-bottom"><span class="tag">${esc(x.category)}</span></div></div></a><button type="button" class="details-btn" data-details="${x.id}">Details</button><button type="button" class="save-btn ${state.saved.has(x.id)?'saved':''}" data-save="${x.id}" title="Save resource" aria-label="Save ${esc(x.name)}">${state.saved.has(x.id)?'★':'☆'}</button></article>`).join('');
    $('empty').hidden=list.length!==0;$('loadMore').hidden=list.length===0;$('loadMore').disabled=shown.length>=list.length;$('loadMore').textContent=shown.length>=list.length?'All resources loaded':`Load more (${(list.length-shown.length).toLocaleString()} remaining)`;
    $('cards').querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();let id=Number(b.dataset.save);state.saved.has(id)?state.saved.delete(id):state.saved.add(id);localStorage.setItem('freedev-saved',JSON.stringify([...state.saved]));render()}));
    $('cards').querySelectorAll('[data-details]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();showDetails(Number(b.dataset.details))}));
  }
  function inspectListing(x){
    const desc=(x.description||'').toLowerCase();
    const limitTerms=['requests per','per month','per day','per week','gb','mb','hours','quota','limit','limited','credits'];
    const hasLimits=limitTerms.some(term=>desc.includes(term));
    const mentionsPricing=/\b(pricing|paid plan|paid tier|free tier|free plan|freemium|credit card|billing)\b/i.test(x.description||'');
    return {
      listing:'Included in Free-for-dev source directory',
      description: x.description ? 'Description supplied by source' : 'No description supplied by source',
      limits: hasLimits ? 'Usage limits mentioned in source description — verify current values' : 'No specific usage limits identified in source description',
      pricing: mentionsPricing ? 'Pricing or plan terms mentioned — check provider pricing page' : 'Pricing model not established by source data',
      commercial:'Commercial-use permission not established — check provider terms'
    };
  }
  function showDetails(id){
    const x=items.find(item=>item.id===id); if(!x) return;
    const info=inspectListing(x);
    $('detailName').textContent=x.name;
    $('detailCategory').textContent=x.category;
    $('detailDescription').textContent=x.description||'No additional description is available in the source directory.';
    $('detailListing').textContent=info.listing;
    $('detailDescriptionStatus').textContent=info.description;
    $('detailLimits').textContent=info.limits;
    $('detailPricing').textContent=info.pricing;
    $('detailCommercial').textContent=info.commercial;
    $('detailUrl').href=x.url;
    $('detailUrl').textContent=x.url;
    $('detailDialog').showModal();
  }
  // The full-card anchor is a native browser link. No window.open() click handler is needed.
  function syncQuick(){document.querySelectorAll('[data-quick]').forEach(b=>b.classList.toggle('active',b.dataset.quick===state.quick));}
  $('search').addEventListener('input',e=>{state.query=e.target.value;state.visible=24;render()});$('sort').addEventListener('change',e=>{state.sort=e.target.value;render()});
  document.querySelectorAll('[data-quick]').forEach(b=>b.addEventListener('click',()=>{state.quick=b.dataset.quick;state.category='all';state.visible=24;syncQuick();renderCategories();render()}));
  $('clearFilters').addEventListener('click',()=>{state.query='';state.category='all';state.quick='all';state.visible=24;$('search').value='';syncQuick();renderCategories();render()});$('resetBtn').addEventListener('click',()=>$('clearFilters').click());$('loadMore').addEventListener('click',()=>{state.visible+=24;render()});
  $('themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('freedev-theme',document.body.classList.contains('light')?'light':'dark')});if(localStorage.getItem('freedev-theme')==='light')document.body.classList.add('light');
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('search').focus()}if(e.key==='Escape'){$('search').value='';state.query='';render()}});
  $('detailClose').addEventListener('click',()=>$('detailDialog').close());
  $('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog'))$('detailDialog').close()});
  renderCategories();render();
})();
