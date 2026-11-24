(function () {
  const KEY = "domhim-cart-v1";

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("domhim:cart"));
  }

  function findProduct(id) {
    return (window.DOMHIM_PRODUCTS || []).find((p) => p.id === id);
  }

  window.DomhimCart = {
    items: read,
    count: function () {
      return read().reduce((n, i) => n + i.qty, 0);
    },
    total: function () {
      return read().reduce((n, i) => {
        const p = findProduct(i.id);
        return n + (p ? p.price * i.qty : 0);
      }, 0);
    },
    add: function (id, qty) {
      qty = Math.max(1, parseInt(qty, 10) || 1);
      const items = read();
      const row = items.find((i) => i.id === id);
      if (row) row.qty += qty;
      else items.push({ id: id, qty: qty });
      write(items);
    },
    setQty: function (id, qty) {
      qty = parseInt(qty, 10) || 0;
      let items = read();
      if (qty <= 0) items = items.filter((i) => i.id !== id);
      else {
        const row = items.find((i) => i.id === id);
        if (row) row.qty = qty;
      }
      write(items);
    },
    remove: function (id) {
      write(read().filter((i) => i.id !== id));
    },
    clear: function () {
      write([]);
    },
  };
})();
