(function () {
  const rub = new Intl.NumberFormat("ru-RU");

  function money(n) {
    return rub.format(n) + " ₽";
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function toast(msg) {
    var el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("is-on");
    }, 2600);
  }

  function productById(id) {
    return (window.DOMHIM_PRODUCTS || []).find(function (p) {
      return p.id === id;
    });
  }

  function qtyFromCard(card) {
    var input = card && card.querySelector(".qty input");
    return Math.max(1, parseInt(input && input.value, 10) || 1);
  }

  function renderHeaderCart() {
    $all("[data-cart-count]").forEach(function (el) {
      el.textContent = DomhimCart.count();
    });
    $all("[data-cart-total]").forEach(function (el) {
      el.textContent = money(DomhimCart.total());
    });
  }

  function cardHtml(p) {
    var badge = p.badge
      ? '<span class="p-badge ' + p.badge + '">' + (p.badge === "hit" ? "Хит" : "Новинка") + "</span>"
      : "";
    return (
      '<article class="p-card" data-id="' + p.id + '">' +
      badge +
      '<div class="p-img" data-open="' + p.id + '"><img src="' + p.image + '" alt="' + escapeHtml(p.name) + '"></div>' +
      '<div class="p-name" data-open="' + p.id + '">' + escapeHtml(p.name) + "</div>" +
      '<div class="p-meta">' + escapeHtml(p.brand) + " · " + escapeHtml(p.volume) + "</div>" +
      '<div class="p-art">Артикул: ' + escapeHtml(p.sku) + "</div>" +
      '<div class="p-price">' + money(p.price) + " <small>ориентир.</small></div>" +
      (p.inStock ? '<div class="p-stock">В наличии</div>' : "") +
      '<div class="p-actions">' +
      '<div class="qty"><button type="button" data-step="-1" aria-label="Меньше">−</button>' +
      '<input type="number" min="1" value="1" aria-label="Количество">' +
      '<button type="button" data-step="1" aria-label="Больше">+</button></div>' +
      '<button type="button" class="icon-cart" data-add="' + p.id + '" aria-label="В корзину">🛒</button>' +
      "</div>" +
      '<button type="button" class="btn btn-outline p-oneclick" data-oneclick="' + p.id + '">Купить в 1 клик</button>' +
      "</article>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mountCards(container, products) {
    if (!container) return;
    container.innerHTML = products.map(cardHtml).join("");
  }

  function openModal(id) {
    var p = productById(id);
    var bg = $("#product-modal");
    if (!p || !bg) return;
    $("#modal-img").src = p.image;
    $("#modal-img").alt = p.name;
    $("#modal-name").textContent = p.name;
    $("#modal-meta").textContent = p.brand + " · " + p.volume;
    $("#modal-art").textContent = "Артикул: " + p.sku;
    $("#modal-price").innerHTML = money(p.price) + " <small>ориентировочная цена</small>";
    $("#modal-desc").textContent = p.description;
    $("#modal-src").innerHTML =
      "Фото и цена по открытой витрине: " +
      escapeHtml(p.sourceName) +
      (p.sourceUrl ? ' · <a href="' + p.sourceUrl + '" target="_blank" rel="noopener">источник</a>' : "");
    bg.dataset.id = id;
    var addBtn = bg.querySelector("[data-add], #modal-add");
    if (addBtn) addBtn.setAttribute("data-add", id);
    bg.querySelector(".qty input").value = "1";
    bg.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    var bg = $("#product-modal");
    if (!bg) return;
    bg.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function renderCartDrawer() {
    var body = $("#cart-items");
    if (!body) return;
    var items = DomhimCart.items();
    if (!items.length) {
      body.innerHTML = '<div class="drawer-empty">Корзина пуста. Добавьте товары из каталога.</div>';
    } else {
      body.innerHTML = items
        .map(function (i) {
          var p = productById(i.id);
          if (!p) return "";
          return (
            '<div class="ci" data-id="' + p.id + '">' +
            '<img src="' + p.image + '" alt="">' +
            "<div><div class=\"nm\">" + escapeHtml(p.name) + "</div>" +
            '<div class="pr">' + money(p.price) + " · " + p.volume + "</div>" +
            '<div class="qty" style="margin-top:8px"><button type="button" data-cart-step="-1">−</button>' +
            '<input type="number" min="1" value="' + i.qty + '">' +
            '<button type="button" data-cart-step="1">+</button></div></div>' +
            '<button type="button" class="ci-remove" data-remove="' + p.id + '" aria-label="Удалить">×</button>' +
            "</div>"
          );
        })
        .join("");
    }
    $("#cart-sum").textContent = money(DomhimCart.total());
  }

  function openCart() {
    $("#cart-drawer").classList.add("is-open");
    $("#cart-bg").classList.add("is-open");
    document.body.style.overflow = "hidden";
    renderCartDrawer();
  }

  function closeCart() {
    $("#cart-drawer").classList.remove("is-open");
    $("#cart-bg").classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function bindUi() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-open]");
      if (t) {
        openModal(t.getAttribute("data-open"));
        return;
      }
      t = e.target.closest("[data-add]");
      if (t) {
        var card = t.closest(".p-card") || t.closest(".modal");
        DomhimCart.add(t.getAttribute("data-add"), qtyFromCard(card));
        toast("Товар добавлен в корзину");
        return;
      }
      t = e.target.closest("[data-oneclick]");
      if (t) {
        DomhimCart.add(t.getAttribute("data-oneclick"), qtyFromCard(t.closest(".p-card")));
        openCart();
        return;
      }
      t = e.target.closest("[data-step]");
      if (t) {
        var box = t.closest(".qty");
        var input = box.querySelector("input");
        var next = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(t.getAttribute("data-step"), 10));
        input.value = next;
        return;
      }
      t = e.target.closest("[data-cart-step]");
      if (t) {
        var row = t.closest(".ci");
        var inp = row.querySelector("input");
        var q = Math.max(1, (parseInt(inp.value, 10) || 1) + parseInt(t.getAttribute("data-cart-step"), 10));
        inp.value = q;
        DomhimCart.setQty(row.getAttribute("data-id"), q);
        return;
      }
      t = e.target.closest("[data-remove]");
      if (t) {
        DomhimCart.remove(t.getAttribute("data-remove"));
        return;
      }
      if (e.target.closest("[data-open-cart]")) {
        openCart();
        return;
      }
      if (e.target.closest("[data-close-cart]") || e.target.id === "cart-bg") {
        closeCart();
        return;
      }
      if (e.target.closest("[data-close-modal]") || e.target.id === "product-modal") {
        closeModal();
        return;
      }
      if (e.target.closest("[data-checkout]")) {
        e.preventDefault();
        toast("Это прототип: кнопка «Оформить заказ» никуда не ведёт");
        return;
      }
      if (e.target.closest("[data-burger]")) {
        $("#mobile-nav").classList.toggle("is-open");
        return;
      }
    });

    document.addEventListener("change", function (e) {
      var row = e.target.closest(".ci");
      if (row && e.target.matches("input")) {
        DomhimCart.setQty(row.getAttribute("data-id"), e.target.value);
      }
    });

    document.addEventListener("domhim:cart", function () {
      renderHeaderCart();
      if ($("#cart-drawer") && $("#cart-drawer").classList.contains("is-open")) renderCartDrawer();
    });

    $all("[data-search]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = (form.querySelector("input") || {}).value || "";
        var url = "catalog.html?q=" + encodeURIComponent(q.trim());
        window.location.href = url;
      });
    });

    renderHeaderCart();
  }

  function initHero() {
    var slides = $all(".hero-slide");
    if (!slides.length) return;
    var i = 0;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, idx) {
        s.classList.toggle("is-on", idx === i);
      });
    }
    show(0);
    var prev = $("[data-hero='prev']");
    var next = $("[data-hero='next']");
    if (prev) prev.addEventListener("click", function () { show(i - 1); });
    if (next) next.addEventListener("click", function () { show(i + 1); });
  }

  function initHome() {
    var news = (window.DOMHIM_PRODUCTS || []).filter(function (p) {
      return p.badge === "new" || p.badge === "hit";
    });
    if (news.length < 8) {
      news = news.concat(
        window.DOMHIM_PRODUCTS.filter(function (p) {
          return news.indexOf(p) === -1;
        })
      );
    }
    var start = 0;
    var box = $("#new-products");
    function paint() {
      var slice = news.slice(start, start + 4);
      if (slice.length < 4) slice = slice.concat(news.slice(0, 4 - slice.length));
      mountCards(box, slice);
    }
    paint();
    var prev = $("[data-new='prev']");
    var next = $("[data-new='next']");
    if (prev)
      prev.addEventListener("click", function () {
        start = (start - 1 + news.length) % news.length;
        paint();
      });
    if (next)
      next.addEventListener("click", function () {
        start = (start + 1) % news.length;
        paint();
      });
    initHero();
  }

  function initCatalog() {
    var params = new URLSearchParams(location.search);
    var cat = params.get("cat") || "all";
    var q = (params.get("q") || "").trim().toLowerCase();
    var searchInput = $("#catalog-q");
    if (searchInput && q) searchInput.value = params.get("q");
    $all("[data-filter]").forEach(function (btn) {
      if (btn.getAttribute("data-filter") === cat) btn.classList.add("is-on");
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("data-filter");
        var url = new URL(location.href);
        if (next === "all") url.searchParams.delete("cat");
        else url.searchParams.set("cat", next);
        location.href = url.toString();
      });
    });
    var list = window.DOMHIM_PRODUCTS || [];
    if (cat !== "all") list = list.filter(function (p) { return p.category === cat; });
    if (q) {
      list = list.filter(function (p) {
        return (p.name + " " + p.brand + " " + p.sku + " " + p.short).toLowerCase().indexOf(q) !== -1;
      });
    }
    var title = $("#catalog-title");
    if (title) {
      if (q) title.textContent = "Поиск: «" + params.get("q") + "»";
      else if (cat !== "all" && window.DOMHIM_CATEGORIES[cat]) title.textContent = window.DOMHIM_CATEGORIES[cat].title;
    }
    var count = $("#catalog-count");
    if (count) count.textContent = "Найдено: " + list.length;
    var grid = $("#catalog-grid");
    if (!list.length) {
      grid.innerHTML = '<div class="empty">Ничего не нашлось. Попробуйте другой запрос или категорию.</div>';
    } else {
      mountCards(grid, list);
    }
    var openId = params.get("id");
    if (openId) openModal(openId);
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindUi();
    if (document.body.dataset.page === "home") initHome();
    if (document.body.dataset.page === "catalog") initCatalog();
  });
})();
