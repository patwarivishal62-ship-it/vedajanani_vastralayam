(function(){
  function $(id){return document.getElementById(id);}
  function openDrawer(el){el.classList.add('open');$('drawerOverlay').classList.add('show');document.body.style.overflow='hidden';}
  function closeAll(){document.querySelectorAll('.mobile-drawer,.search-drawer,.cart-drawer').forEach(function(d){d.classList.remove('open');});var o=$('drawerOverlay');if(o)o.classList.remove('show');document.body.style.overflow='';}
  document.addEventListener('DOMContentLoaded',function(){
    var mOpen=$('menuDrawerOpen'),mClose=$('menuDrawerClose'),sOpen=$('searchOpen'),sClose=$('searchClose'),cOpen=$('cartOpen'),cClose=$('cartClose'),ov=$('drawerOverlay');
    if(mOpen)mOpen.addEventListener('click',function(){openDrawer($('mobileDrawer'));});
    if(mClose)mClose.addEventListener('click',closeAll);
    if(sOpen)sOpen.addEventListener('click',function(){openDrawer($('searchDrawer'));});
    if(sClose)sClose.addEventListener('click',closeAll);
    if(cOpen)cOpen.addEventListener('click',function(){openDrawer($('cartDrawer'));});
    if(cClose)cClose.addEventListener('click',closeAll);
    if(ov)ov.addEventListener('click',closeAll);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll();});
    // Shop All click toggle (touch)
    document.querySelectorAll('.shopall-wrap > a').forEach(function(a){
      a.addEventListener('click',function(e){
        var wrap=a.parentElement;
        if(window.innerWidth>1100 && wrap.classList.contains('open')){wrap.classList.remove('open');return;}
        if(window.innerWidth>1100){e.preventDefault();document.querySelectorAll('.shopall-wrap.open').forEach(function(w){w.classList.remove('open');});wrap.classList.add('open');}
      });
    });
    document.addEventListener('click',function(e){if(!e.target.closest('.shopall-wrap')){document.querySelectorAll('.shopall-wrap.open').forEach(function(w){w.classList.remove('open');});}});
  });
})();
