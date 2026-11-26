(function () {
  function $(id) { return document.getElementById(id); }

  function openDrawer(el) {
    if (!el) return;
    closeAll();
    el.classList.add('open');
    var ov = $('drawerOverlay');
    if (ov) ov.classList.add('show');
    document.body.style.overflow = 'hidden';
    if (el.id === 'searchDrawer') {
      var input = el.querySelector('input[type="search"]');
      if (input) setTimeout(function () { input.focus(); }, 60);
    }
  }

  function closeAll() {
    document.querySelectorAll('.mobile-drawer, .search-drawer, .cart-drawer').forEach(function (d) {
      d.classList.remove('open');
    });
    var ov = $('drawerOverlay');
    if (ov) ov.classList.remove('show');
    document.body.style.overflow = '';
  }

  function refreshCartDrawer(openAfter) {
    var drawer = $('cartDrawer');
    var sectionId = drawer ? drawer.getAttribute('data-section-id') : 'cart-drawer';
    fetch(window.location.pathname + '?section_id=' + encodeURIComponent(sectionId))
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var fresh = doc.getElementById('cartDrawer');
        if (fresh && drawer) {
          drawer.innerHTML = fresh.innerHTML;
          bindCartDrawerControls();
        }
        return fetch('/cart.js').then(function (r) { return r.json(); });
      })
      .then(function (cart) {
        var badge = $('cartCount');
        if (badge) badge.textContent = cart.item_count;
        var drawerCount = $('cartDrawerCount');
        if (drawerCount) drawerCount.textContent = cart.item_count;
        if (openAfter) openDrawer($('cartDrawer'));
      })
      .catch(function () {});
  }

  function bindCartDrawerControls() {
    var cClose = $('cartClose');
    if (cClose) cClose.addEventListener('click', closeAll);

    document.querySelectorAll('.js-cart-qty').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-key');
        var qty = parseInt(btn.getAttribute('data-qty'), 10);
        if (!key || isNaN(qty)) return;
        btn.disabled = true;
        fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ id: key, quantity: Math.max(0, qty) })
        })
          .then(function (r) { return r.json(); })
          .then(function () { refreshCartDrawer(false); })
          .catch(function () { window.location.reload(); });
      });
    });
  }

  function initHeader(root) {
    var scope = root || document;
    var mOpen = $('menuDrawerOpen');
    var mClose = $('menuDrawerClose');
    var sOpen = $('searchOpen');
    var sClose = $('searchClose');
    var cOpen = $('cartOpen');
    var ov = $('drawerOverlay');

    if (mOpen && !mOpen.dataset.bound) {
      mOpen.dataset.bound = '1';
      mOpen.addEventListener('click', function () { openDrawer($('mobileDrawer')); });
    }
    if (mClose && !mClose.dataset.bound) {
      mClose.dataset.bound = '1';
      mClose.addEventListener('click', closeAll);
    }
    if (sOpen && !sOpen.dataset.bound) {
      sOpen.dataset.bound = '1';
      sOpen.addEventListener('click', function () { openDrawer($('searchDrawer')); });
    }
    if (sClose && !sClose.dataset.bound) {
      sClose.dataset.bound = '1';
      sClose.addEventListener('click', closeAll);
    }
    if (cOpen && !cOpen.dataset.bound) {
      cOpen.dataset.bound = '1';
      cOpen.addEventListener('click', function () { openDrawer($('cartDrawer')); });
    }
    if (ov && !ov.dataset.bound) {
      ov.dataset.bound = '1';
      ov.addEventListener('click', closeAll);
    }

    var accBtn = $('mobileShopAllToggle');
    var accSub = $('mobileShopAllSub');
    if (accBtn && accSub && !accBtn.dataset.bound) {
      accBtn.dataset.bound = '1';
      accBtn.addEventListener('click', function () {
        var collapsed = accSub.classList.toggle('is-collapsed');
        accBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      });
    }

    scope.querySelectorAll('.shopall-wrap > a').forEach(function (a) {
      if (a.dataset.bound) return;
      a.dataset.bound = '1';
      a.addEventListener('click', function (e) {
        var wrap = a.parentElement;
        if (window.innerWidth > 1100 && wrap.classList.contains('open')) {
          wrap.classList.remove('open');
          return;
        }
        if (window.innerWidth > 1100) {
          e.preventDefault();
          document.querySelectorAll('.shopall-wrap.open').forEach(function (w) { w.classList.remove('open'); });
          wrap.classList.add('open');
        }
      });
    });
  }

  function initAnnouncementBars(root) {
    (root || document).querySelectorAll('[data-announcement-bar]').forEach(function (bar) {
      var slides = bar.querySelectorAll('.announcement-slide');
      if (slides.length <= 1) return;
      var index = 0;
      var speed = parseInt(bar.getAttribute('data-speed'), 10) || 4000;
      var autoplay = bar.getAttribute('data-autoplay') === 'true';

      function show(i) {
        index = (i + slides.length) % slides.length;
        slides.forEach(function (s, idx) {
          s.classList.toggle('is-active', idx === index);
        });
      }

      var prev = bar.querySelector('[data-announcement-prev]');
      var next = bar.querySelector('[data-announcement-next]');
      if (prev) prev.addEventListener('click', function () { show(index - 1); });
      if (next) next.addEventListener('click', function () { show(index + 1); });

      if (bar._timer) clearInterval(bar._timer);
      if (autoplay) {
        bar._timer = setInterval(function () { show(index + 1); }, speed);
      }
    });
  }

  function initCategoryTabs(root) {
    (root || document).querySelectorAll('[data-category-tabs]').forEach(function (section) {
      var tabs = section.querySelectorAll('[data-tab-filter]');
      var cards = section.querySelectorAll('[data-tab-group]');
      if (!tabs.length || !cards.length) return;

      function applyFilter(key) {
        var matchCount = 0;
        cards.forEach(function (card) {
          var grp = card.getAttribute('data-tab-group') || 'all';
          var visible = key === 'all' || grp === 'all' || grp === key;
          card.classList.toggle('vv-tile--hidden', !visible);
          if (visible) matchCount++;
        });
        if (matchCount === 0) {
          cards.forEach(function (card) { card.classList.remove('vv-tile--hidden'); });
        }
      }

      tabs.forEach(function (tab) {
        if (tab.dataset.bound) return;
        tab.dataset.bound = '1';
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
          applyFilter(tab.getAttribute('data-tab-filter'));
        });
      });

      var activeTab = section.querySelector('.cat-tab.active');
      if (activeTab) applyFilter(activeTab.getAttribute('data-tab-filter'));
    });
  }

  function initProductSections(root) {
    (root || document).querySelectorAll('[data-product-section]').forEach(function (sec) {
      sec.querySelectorAll('[data-thumb-target]').forEach(function (btn) {
        if (btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', function () {
          var img = $(btn.getAttribute('data-thumb-target'));
          if (img) img.src = btn.getAttribute('data-thumb-src');
          sec.querySelectorAll('[data-thumb-target]').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
        });
      });

      var hiddenId = sec.querySelector('[data-variant-id-input]');
      var selectEl = sec.querySelector('[data-variant-select]');
      if (selectEl && hiddenId && !selectEl.dataset.bound) {
        selectEl.dataset.bound = '1';
        selectEl.addEventListener('change', function () { hiddenId.value = selectEl.value; });
      }

      sec.querySelectorAll('.variant-pill').forEach(function (pill) {
        if (pill.dataset.bound) return;
        pill.dataset.bound = '1';
        pill.addEventListener('click', function () {
          if (hiddenId) hiddenId.value = pill.getAttribute('data-variant-id');
          sec.querySelectorAll('.variant-pill').forEach(function (p) { p.classList.remove('is-selected'); });
          pill.classList.add('is-selected');
        });
      });
    });
  }

  function initCollectionSort(root) {
    (root || document).querySelectorAll('[data-collection-sort]').forEach(function (sel) {
      if (sel.dataset.bound) return;
      sel.dataset.bound = '1';
      sel.addEventListener('change', function () {
        var url = new URL(window.location.href);
        url.searchParams.set('sort_by', sel.value);
        window.location.href = url.toString();
      });
    });
  }

  function initAjaxCartForms(root) {
    var useDrawer = document.body.getAttribute('data-cart-drawer') !== 'false';
    if (!useDrawer) return;
    (root || document).querySelectorAll('.js-ajax-cart-form').forEach(function (form) {
      if (form.dataset.bound) return;
      form.dataset.bound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = form.querySelector('button[type="submit"]');
        var origText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Adding…';
        }
        var formData = new FormData(form);
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        })
          .then(function (r) {
            if (!r.ok) throw new Error('Cart error');
            return r.json();
          })
          .then(function () { refreshCartDrawer(true); })
          .catch(function () { form.submit(); })
          .finally(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = origText;
            }
          });
      });
    });
  }

  function bootAll(root) {
    initHeader(root);
    bindCartDrawerControls();
    initAnnouncementBars(root);
    initCategoryTabs(root);
    initProductSections(root);
    initCollectionSort(root);
    initAjaxCartForms(root);
  }

  document.addEventListener('DOMContentLoaded', function () {
    bootAll(document);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.shopall-wrap')) {
        document.querySelectorAll('.shopall-wrap.open').forEach(function (w) { w.classList.remove('open'); });
      }
    });
  });

  // Re-initialize cleanly inside the Shopify Theme Editor
  document.addEventListener('shopify:section:load', function (e) {
    bootAll(e.target);
  });

  document.addEventListener('shopify:block:select', function (e) {
    var slide = e.target.closest('.announcement-slide');
    if (slide) {
      var bar = slide.closest('[data-announcement-bar]');
      if (bar) {
        bar.querySelectorAll('.announcement-slide').forEach(function (s) { s.classList.remove('is-active'); });
        slide.classList.add('is-active');
      }
    }
    var tab = e.target.closest('[data-tab-filter]');
    if (tab) tab.click();
  });
})();
