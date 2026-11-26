(function () {
  var lastFocusedTrigger = null;

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openDrawer(el, trigger) {
    if (!el) return;
    closeAllDrawers(true);
    lastFocusedTrigger = trigger || document.activeElement;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    var ov = $('drawerOverlay');
    if (ov) {
      ov.classList.add('show');
      ov.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';

    var focusTarget = el.querySelector('input[type="search"], button, a[href], input');
    if (focusTarget) {
      setTimeout(function () { focusTarget.focus(); }, 40);
    }
  }

  function closeAllDrawers(skipFocusRestore) {
    document.querySelectorAll('.mobile-drawer, .search-drawer, .cart-drawer, .filter-drawer').forEach(function (d) {
      d.classList.remove('open');
      d.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('[aria-expanded="true"][aria-controls]').forEach(function (btn) {
      var ctrl = btn.getAttribute('aria-controls');
      if (ctrl && ctrl !== 'mobileShopAllSub') {
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    var ov = $('drawerOverlay');
    if (ov) {
      ov.classList.remove('show');
      ov.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (!skipFocusRestore && lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  function showCartError(msg) {
    var errEl = $('cartDrawerError');
    if (!errEl) return;
    if (msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
    } else {
      errEl.textContent = '';
      errEl.hidden = true;
    }
  }

  function refreshCartDrawer(openAfter, errorMsg) {
    fetch(window.location.pathname + '?section_id=cart-drawer')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.getElementById('cartDrawer');
        var cur = $('cartDrawer');
        if (fresh && cur) {
          cur.innerHTML = fresh.innerHTML;
          bindCartDrawerEvents();
        }
        return fetch('/cart.js').then(function (r) { return r.json(); });
      })
      .then(function (cart) {
        var c = $('cartCount');
        if (c) c.textContent = cart.item_count;
        var bagBtn = $('cartOpen');
        if (bagBtn) bagBtn.setAttribute('aria-label', 'Shopping bag, ' + cart.item_count + ' items');
        if (openAfter) openDrawer($('cartDrawer'), bagBtn);
        if (errorMsg) showCartError(errorMsg);
      })
      .catch(function () {});
  }

  function bindCartDrawerEvents() {
    var cClose = $('cartDrawerClose');
    if (cClose) cClose.onclick = function () { closeAllDrawers(false); };

    document.querySelectorAll('.js-cart-qty').forEach(function (btn) {
      btn.onclick = function () {
        var line = parseInt(btn.getAttribute('data-line'), 10);
        var qty = parseInt(btn.getAttribute('data-qty'), 10);
        showCartError('');
        fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ line: line, quantity: qty })
        })
          .then(function (res) {
            return res.json().then(function (data) {
              if (!res.ok) {
                throw new Error(data.description || data.message || 'Could not update bag quantity.');
              }
              return data;
            });
          })
          .then(function () { refreshCartDrawer(true); })
          .catch(function (err) {
            showCartError(err && err.message ? err.message : 'Unable to update quantity.');
          });
      };
    });

    var noteEl = $('CartDrawerNote');
    if (noteEl && !noteEl.dataset.bound) {
      noteEl.dataset.bound = '1';
      var noteTimer;
      noteEl.addEventListener('input', function () {
        clearTimeout(noteTimer);
        noteTimer = setTimeout(function () {
          fetch('/cart/update.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note: noteEl.value })
          }).catch(function () {});
        }, 400);
      });
    }
  }

  function initHeaderAndDrawers(root) {
    var scope = root || document;
    var mOpen = $('menuDrawerOpen');
    var mClose = $('menuDrawerClose');
    var sOpen = $('searchOpen');
    var sClose = $('searchClose');
    var cOpen = $('cartOpen');
    var ov = $('drawerOverlay');

    if (mOpen) mOpen.onclick = function () { openDrawer($('mobileDrawer'), mOpen); };
    if (mClose) mClose.onclick = function () { closeAllDrawers(false); };
    if (sOpen) {
      sOpen.onclick = function () {
        openDrawer($('searchDrawer'), sOpen);
      };
    }
    if (sClose) sClose.onclick = function () { closeAllDrawers(false); };
    if (cOpen) cOpen.onclick = function () { openDrawer($('cartDrawer'), cOpen); };
    if (ov) ov.onclick = function () { closeAllDrawers(false); };

    var mmToggle = $('mobileShopAllToggle');
    var mmSub = $('mobileShopAllSub');
    if (mmToggle && mmSub) {
      mmToggle.onclick = function () {
        var collapsed = mmSub.classList.toggle('is-collapsed');
        mmToggle.setAttribute('aria-expanded', String(!collapsed));
      };
    }

    scope.querySelectorAll('.shopall-wrap > a').forEach(function (a) {
      if (a.dataset.bound) return;
      a.dataset.bound = '1';
      a.addEventListener('click', function (e) {
        if (window.matchMedia('(hover: none)').matches) {
          var wrap = a.parentElement;
          if (!wrap.classList.contains('open')) {
            e.preventDefault();
            wrap.classList.add('open');
            a.setAttribute('aria-expanded', 'true');
          }
        }
      });
    });

    scope.querySelectorAll('[data-filter-drawer-open]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-filter-drawer-open');
        openDrawer($(targetId), btn);
      });
    });

    scope.querySelectorAll('[data-filter-drawer-close]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        closeAllDrawers(false);
      });
    });

    bindCartDrawerEvents();
  }

  function initPredictiveSearch(root) {
    var scope = root || document;
    var input = scope.querySelector('[data-predictive-search-input]');
    var container = $('predictiveSearchResults');
    if (!input || !container || input.dataset.bound) return;
    input.dataset.bound = '1';

    var suggestBase = document.body.getAttribute('data-predictive-search-url') || '/search/suggest';
    var searchUrl = document.body.getAttribute('data-search-url') || '/search';
    var debounceTimer = null;
    var activeIndex = -1;

    function clearResults() {
      container.innerHTML = '';
      container.hidden = true;
      activeIndex = -1;
    }

    function renderResults(query, products) {
      if (!query) {
        clearResults();
        return;
      }
      if (!products || !products.length) {
        container.innerHTML =
          '<div class="predictive-empty">No sarees found for “' + escapeHtml(query) + '”. Press Enter for full search or try Cotton, Silk, Chiffon, or Festive.</div>';
        container.hidden = false;
        activeIndex = -1;
        return;
      }

      var itemsHtml = products.map(function (p) {
        var thumb = p.featured_image && p.featured_image.url
          ? '<img src="' + escapeHtml(p.featured_image.url) + '" alt="' + escapeHtml(p.title) + '" width="48" height="62" loading="lazy">'
          : '';
        var priceText = p.price ? '₹' + escapeHtml(p.price) : '';
        return (
          '<li class="predictive-item" role="option">' +
            '<a href="' + escapeHtml(p.url) + '">' +
              thumb +
              '<span class="predictive-item-meta">' +
                '<span class="predictive-item-title">' + escapeHtml(p.title) + '</span>' +
                (priceText ? '<span class="predictive-item-price">' + priceText + '</span>' : '') +
              '</span>' +
            '</a>' +
          '</li>'
        );
      }).join('');

      container.innerHTML =
        '<ul class="predictive-list">' + itemsHtml + '</ul>' +
        '<div class="predictive-footer">' +
          '<a class="link-cta" href="' + escapeHtml(searchUrl) + '?type=product&q=' + encodeURIComponent(query) + '">View all results for “' + escapeHtml(query) + '” →</a>' +
        '</div>';
      container.hidden = false;
      activeIndex = -1;
    }

    input.addEventListener('input', function () {
      var q = input.value.trim();
      clearTimeout(debounceTimer);
      if (q.length < 2) {
        clearResults();
        return;
      }
      debounceTimer = setTimeout(function () {
        var endpoint = suggestBase + '.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=6';
        fetch(endpoint, { headers: { 'Accept': 'application/json' } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (!data || !data.resources || !data.resources.results) {
              clearResults();
              return;
            }
            renderResults(q, data.resources.results.products || []);
          })
          .catch(function () { clearResults(); });
      }, 240);
    });

    input.addEventListener('keydown', function (e) {
      var links = container.querySelectorAll('.predictive-item a');
      if (!links.length || container.hidden) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % links.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + links.length) % links.length;
      } else if (e.key === 'Enter' && activeIndex >= 0 && links[activeIndex]) {
        e.preventDefault();
        window.location.href = links[activeIndex].href;
        return;
      } else {
        return;
      }
      links.forEach(function (l, i) { l.classList.toggle('is-focused', i === activeIndex); });
    });
  }

  function initAnnouncementBars(root) {
    (root || document).querySelectorAll('[data-announcement-bar]').forEach(function (bar) {
      var slides = bar.querySelectorAll('.announcement-slide');
      if (slides.length <= 1) return;
      var idx = 0;
      var autoplay = bar.getAttribute('data-autoplay') === 'true';
      var speed = parseInt(bar.getAttribute('data-speed'), 10) || 5000;

      function show(n) {
        idx = (n + slides.length) % slides.length;
        slides.forEach(function (s, i) {
          s.classList.toggle('is-active', i === idx);
        });
      }

      var prev = bar.querySelector('[data-announcement-prev]');
      var next = bar.querySelector('[data-announcement-next]');
      if (prev) prev.onclick = function () { show(idx - 1); };
      if (next) next.onclick = function () { show(idx + 1); };

      if (bar._timer) clearInterval(bar._timer);
      if (autoplay) {
        bar._timer = setInterval(function () { show(idx + 1); }, speed);
      }
    });
  }

  function initCategoryTabs(root) {
    (root || document).querySelectorAll('[data-category-tabs]').forEach(function (section) {
      var tabs = section.querySelectorAll('[data-tab-filter]');
      var cards = section.querySelectorAll('[data-tab-group]');
      if (!tabs.length || !cards.length) return;

      function applyFilter(key) {
        var norm = (key || 'all').toLowerCase().trim();
        var visibleCount = 0;
        cards.forEach(function (c) {
          var g = (c.getAttribute('data-tab-group') || 'all').toLowerCase().trim();
          var match = norm === 'all' || g === norm || g === 'all';
          c.classList.toggle('is-hidden-tab', !match);
          if (match) visibleCount++;
        });
        if (visibleCount === 0) {
          cards.forEach(function (c) { c.classList.remove('is-hidden-tab'); });
        }
      }

      tabs.forEach(function (t) {
        t.onclick = function () {
          tabs.forEach(function (x) {
            x.classList.remove('active');
            x.setAttribute('aria-selected', 'false');
          });
          t.classList.add('active');
          t.setAttribute('aria-selected', 'true');
          applyFilter(t.getAttribute('data-tab-filter'));
        };
      });

      var activeTab = section.querySelector('.cat-tab.active') || tabs[0];
      if (activeTab) applyFilter(activeTab.getAttribute('data-tab-filter'));
    });
  }

  function initProductPage(root) {
    (root || document).querySelectorAll('[data-product-section]').forEach(function (sec) {
      if (sec.dataset.pdpInit) return;
      sec.dataset.pdpInit = '1';

      var mainImg = sec.querySelector('[data-pdp-main]');
      var stage = sec.querySelector('[data-pdp-main-stage]');
      var thumbs = Array.prototype.slice.call(sec.querySelectorAll('[data-pdp-thumb]'));
      var counterEl = sec.querySelector('[data-pdp-counter]');
      var prevBtn = sec.querySelector('[data-pdp-prev]');
      var nextBtn = sec.querySelector('[data-pdp-next]');

      var lightbox = sec.querySelector('[data-pdp-lightbox]');
      var lightboxImg = sec.querySelector('[data-pdp-lightbox-img]');
      var zoomOpenBtn = sec.querySelector('[data-pdp-zoom-open]');
      var zoomCloseBtn = sec.querySelector('[data-pdp-zoom-close]');
      var zoomPrevBtn = sec.querySelector('[data-pdp-zoom-prev]');
      var zoomNextBtn = sec.querySelector('[data-pdp-zoom-next]');

      var currentIdx = 0;

      function setSlide(n) {
        if (!thumbs.length || !mainImg) return;
        currentIdx = (n + thumbs.length) % thumbs.length;
        var activeThumb = thumbs[currentIdx];
        var src = activeThumb.getAttribute('data-src');
        var zoomSrc = activeThumb.getAttribute('data-zoom-src') || src;
        var alt = activeThumb.getAttribute('data-alt') || mainImg.alt;

        if (src) {
          mainImg.src = src;
          mainImg.removeAttribute('srcset');
          mainImg.alt = alt;
          mainImg.setAttribute('data-current-index', String(currentIdx));
        }
        if (lightboxImg && zoomSrc) {
          lightboxImg.src = zoomSrc;
          lightboxImg.alt = alt;
        }
        if (counterEl) {
          counterEl.textContent = (currentIdx + 1) + ' / ' + thumbs.length;
        }
        thumbs.forEach(function (t, i) {
          var isCur = i === currentIdx;
          t.classList.toggle('is-active', isCur);
          t.setAttribute('aria-current', isCur ? 'true' : 'false');
        });
      }

      thumbs.forEach(function (t, i) {
        t.addEventListener('click', function () { setSlide(i); });
      });
      if (prevBtn) prevBtn.addEventListener('click', function () { setSlide(currentIdx - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { setSlide(currentIdx + 1); });

      /* Mobile touch swipe on main image stage */
      if (stage && thumbs.length > 1) {
        var touchStartX = 0;
        var touchEndX = 0;
        stage.addEventListener('touchstart', function (e) {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        stage.addEventListener('touchend', function (e) {
          touchEndX = e.changedTouches[0].screenX;
          var delta = touchEndX - touchStartX;
          if (Math.abs(delta) > 42) {
            if (delta < 0) setSlide(currentIdx + 1);
            else setSlide(currentIdx - 1);
          }
        }, { passive: true });
      }

      /* Fullscreen Zoom Lightbox */
      var zoomTriggerEl = null;
      function openLightbox(trigger) {
        if (!lightbox || !lightboxImg) return;
        zoomTriggerEl = trigger || document.activeElement;
        if (thumbs[currentIdx]) {
          lightboxImg.src = thumbs[currentIdx].getAttribute('data-zoom-src') || mainImg.src;
        } else if (mainImg) {
          lightboxImg.src = mainImg.src;
        }
        lightbox.hidden = false;
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (zoomCloseBtn) zoomCloseBtn.focus();
      }
      function closeLightbox() {
        if (!lightbox) return;
        lightbox.hidden = true;
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (zoomTriggerEl && typeof zoomTriggerEl.focus === 'function') {
          zoomTriggerEl.focus();
        }
      }

      if (zoomOpenBtn) zoomOpenBtn.addEventListener('click', function () { openLightbox(zoomOpenBtn); });
      if (mainImg && lightbox) mainImg.addEventListener('click', function () { openLightbox(mainImg); });
      if (zoomCloseBtn) zoomCloseBtn.addEventListener('click', closeLightbox);
      if (zoomPrevBtn) zoomPrevBtn.addEventListener('click', function () { setSlide(currentIdx - 1); });
      if (zoomNextBtn) zoomNextBtn.addEventListener('click', function () { setSlide(currentIdx + 1); });
      if (lightbox) {
        lightbox.addEventListener('click', function (e) {
          if (e.target === lightbox) closeLightbox();
        });
        document.addEventListener('keydown', function (e) {
          if (lightbox.hidden) return;
          if (e.key === 'Escape') closeLightbox();
          if (e.key === 'ArrowLeft') setSlide(currentIdx - 1);
          if (e.key === 'ArrowRight') setSlide(currentIdx + 1);
        });
      }

      /* Quantity Stepper */
      var qtyInput = sec.querySelector('[data-pdp-qty-input]');
      sec.querySelectorAll('[data-qty-step]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!qtyInput) return;
          var step = parseInt(btn.getAttribute('data-qty-step'), 10) || 1;
          var cur = parseInt(qtyInput.value, 10) || 1;
          qtyInput.value = String(Math.max(1, cur + step));
        });
      });

      /* Live Variant Switching (Price, Compare Price, SKU, Stock, Image, WhatsApp Link) */
      var variantsJsonEl = sec.querySelector('[data-pdp-variants]');
      var variants = [];
      try {
        if (variantsJsonEl) variants = JSON.parse(variantsJsonEl.textContent);
      } catch (err) {
        variants = [];
      }

      var variantSel = sec.querySelector('[data-variant-select]');
      var hiddenId = sec.querySelector('[data-variant-id-input]');
      var priceEl = sec.querySelector('[data-pdp-price]');
      var compareEl = sec.querySelector('[data-pdp-compare]');
      var skuWrap = sec.querySelector('[data-pdp-sku]');
      var skuVal = sec.querySelector('[data-pdp-sku-val]');
      var submitBtn = sec.querySelector('[data-pdp-submit]');
      var stickyPrice = sec.querySelector('[data-pdp-sticky-price]');
      var stickyBtn = sec.querySelector('[data-pdp-sticky-submit]');
      var waLink = sec.querySelector('[data-pdp-wa-link]');

      if (variantSel && hiddenId) {
        var defaultAddLabel = submitBtn ? submitBtn.textContent.trim() : 'Add to Bag';
        variantSel.addEventListener('change', function () {
          var chosenId = Number(variantSel.value);
          hiddenId.value = String(chosenId);
          var v = variants.find(function (item) { return item.id === chosenId; });
          if (!v) return;

          if (priceEl) {
            priceEl.textContent = v.price_formatted;
            priceEl.classList.toggle('sale', Boolean(v.compare_formatted));
          }
          if (compareEl) {
            if (v.compare_formatted) {
              compareEl.textContent = v.compare_formatted;
              compareEl.hidden = false;
            } else {
              compareEl.textContent = '';
              compareEl.hidden = true;
            }
          }
          if (stickyPrice) stickyPrice.textContent = v.price_formatted;

          if (skuWrap && skuVal) {
            if (v.sku) {
              skuVal.textContent = v.sku;
              skuWrap.hidden = false;
            } else {
              skuWrap.hidden = true;
            }
          }

          if (submitBtn) {
            submitBtn.disabled = !v.available;
            submitBtn.textContent = v.available ? defaultAddLabel : 'Sold Out';
          }
          if (stickyBtn) {
            stickyBtn.disabled = !v.available;
            stickyBtn.textContent = v.available ? 'Add to Bag' : 'Sold Out';
          }

          if (v.image_src && mainImg) {
            var matchIdx = thumbs.findIndex(function (t) {
              return t.getAttribute('data-src') === v.image_src;
            });
            if (matchIdx >= 0) {
              setSlide(matchIdx);
            } else {
              mainImg.src = v.image_src;
              mainImg.removeAttribute('srcset');
            }
          }

          if (waLink) {
            var waDigits = sec.getAttribute('data-wa-digits') || '';
            var waGreeting = sec.getAttribute('data-wa-greeting') || '';
            var prodTitle = sec.getAttribute('data-product-title') || '';
            var prodUrl = sec.getAttribute('data-product-url') || window.location.href;
            var msg = waGreeting + ' ' + prodTitle + ' (' + v.title + ')';
            if (v.sku) msg += ' [SKU: ' + v.sku + ']';
            msg += ' ' + prodUrl;
            waLink.href = 'https://wa.me/' + encodeURIComponent(waDigits) + '?text=' + encodeURIComponent(msg);
          }
        });
      }

      /* Native Share / Copy Link */
      var shareBtn = sec.querySelector('[data-pdp-share]');
      if (shareBtn) {
        var shareLabel = shareBtn.querySelector('[data-share-label]');
        var origShareText = shareLabel ? shareLabel.textContent : 'Share Saree';
        shareBtn.addEventListener('click', function () {
          var title = shareBtn.getAttribute('data-share-title') || document.title;
          var url = shareBtn.getAttribute('data-share-url') || window.location.href;
          if (navigator.share) {
            navigator.share({ title: title, url: url }).catch(function () {});
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
              if (shareLabel) {
                shareLabel.textContent = 'Link Copied';
                setTimeout(function () { shareLabel.textContent = origShareText; }, 2200);
              }
            }).catch(function () {});
          }
        });
      }

      /* Indian 6-Digit PIN Code Checker */
      sec.querySelectorAll('[data-pincode-widget]').forEach(function (widget) {
        var pInput = widget.querySelector('[data-pincode-input]');
        var pBtn = widget.querySelector('[data-pincode-btn]');
        var pRes = widget.querySelector('[data-pincode-result]');
        if (!pInput || !pBtn || !pRes) return;

        function checkPin() {
          var val = pInput.value.replace(/\D/g, '').slice(0, 6);
          pInput.value = val;
          if (!/^[1-9][0-9]{5}$/.test(val)) {
            pRes.textContent = 'Please enter a valid 6-digit Indian PIN code.';
            pRes.classList.add('is-error');
            pRes.hidden = false;
            return;
          }
          var prefixesRaw = (widget.getAttribute('data-serviceable-prefixes') || '').trim();
          var msgValid = widget.getAttribute('data-msg-valid') || 'Valid PIN code. Delivery details are confirmed at checkout.';
          var msgOutside = widget.getAttribute('data-msg-outside') || 'Please enquire on WhatsApp for delivery to this PIN code.';
          var ok = true;
          if (prefixesRaw) {
            var prefixes = prefixesRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            ok = prefixes.some(function (pref) { return val.indexOf(pref) === 0; });
          }
          pRes.textContent = ok ? msgValid : msgOutside;
          pRes.classList.toggle('is-error', !ok);
          pRes.hidden = false;
        }

        pBtn.addEventListener('click', checkPin);
        pInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            checkPin();
          }
        });
      });

      /* Mobile Sticky Add-to-Bag Bar */
      var stickyBar = sec.querySelector('[data-pdp-sticky-bar]');
      var buySentinel = sec.querySelector('[data-pdp-buy-sentinel]');
      var pdpForm = sec.querySelector('.pdp-form');
      if (stickyBar && buySentinel && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var showBar = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            stickyBar.classList.toggle('is-visible', showBar);
            stickyBar.setAttribute('aria-hidden', String(!showBar));
          });
        }, { threshold: 0 });
        observer.observe(buySentinel);
      }
      if (stickyBtn && pdpForm) {
        stickyBtn.addEventListener('click', function () {
          if (typeof pdpForm.requestSubmit === 'function') {
            pdpForm.requestSubmit();
          } else {
            pdpForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        });
      }
    });
  }

  function initCollectionSort(root) {
    (root || document).querySelectorAll('[data-collection-sort]').forEach(function (sel) {
      if (sel.dataset.bound) return;
      sel.dataset.bound = '1';
      sel.addEventListener('change', function () {
        var url = new URL(window.location.href);
        url.searchParams.set('sort_by', sel.value);
        url.searchParams.delete('page');
        window.location.href = url.toString();
      });
    });
  }

  function initAjaxAddToCart(root) {
    var useDrawer = document.body.getAttribute('data-cart-drawer') !== 'false';
    if (!useDrawer) return;
    (root || document).querySelectorAll('.js-ajax-cart-form').forEach(function (form) {
      if (form.dataset.ajaxBound) return;
      form.dataset.ajaxBound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = form.querySelector('button[type="submit"]');
        var errBox = form.querySelector('[data-pdp-error]');
        if (errBox) {
          errBox.textContent = '';
          errBox.hidden = true;
        }
        var prevText = btn ? btn.textContent : '';
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Adding…';
        }
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        })
          .then(function (r) {
            return r.json().then(function (data) {
              if (!r.ok) {
                throw new Error(data.description || data.message || 'Unable to add saree to bag.');
              }
              return data;
            });
          })
          .then(function () {
            if (btn) {
              btn.disabled = false;
              btn.textContent = prevText;
            }
            refreshCartDrawer(true);
          })
          .catch(function (err) {
            if (btn) {
              btn.disabled = false;
              btn.textContent = prevText;
            }
            var msg = err && err.message ? err.message : 'Unable to add item to bag.';
            if (errBox) {
              errBox.textContent = msg;
              errBox.hidden = false;
            } else {
              refreshCartDrawer(true, msg);
            }
          });
      });
    });
  }

  function initProductRecommendations(root) {
    (root || document).querySelectorAll('[data-product-recommendations]').forEach(function (el) {
      if (el.dataset.recsLoaded) return;
      var url = el.getAttribute('data-url');
      if (!url) return;
      el.dataset.recsLoaded = '1';
      fetch(url)
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (html) {
          if (!html) return;
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fresh = doc.querySelector('[data-product-recommendations]');
          if (fresh && fresh.innerHTML.trim()) {
            el.innerHTML = fresh.innerHTML;
            initAjaxAddToCart(el);
          }
        })
        .catch(function () {});
    });
  }

  function bootAll(root) {
    initHeaderAndDrawers(root);
    initPredictiveSearch(root);
    initAnnouncementBars(root);
    initCategoryTabs(root);
    initProductPage(root);
    initCollectionSort(root);
    initAjaxAddToCart(root);
    initProductRecommendations(root);
  }

  document.addEventListener('DOMContentLoaded', function () {
    bootAll(document);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllDrawers(false);
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.shopall-wrap')) {
        document.querySelectorAll('.shopall-wrap.open').forEach(function (w) {
          w.classList.remove('open');
          var a = w.querySelector(':scope > a');
          if (a) a.setAttribute('aria-expanded', 'false');
        });
      }
    });
  });

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
  });
})();
