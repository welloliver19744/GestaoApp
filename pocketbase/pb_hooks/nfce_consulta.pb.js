// NFC-e: fetch URL direta do QR + parse HTML SEFAZ SP
routerAdd('GET', '/api/nfce/consulta', function(c) {
  try {
    var info = c.requestInfo();
    var qrUrl = info.query && info.query.url ? String(info.query.url) : '';
    var accessKey = info.query && info.query.accessKey ? String(info.query.accessKey) : '';

    var fetchUrl = qrUrl;
    if (!fetchUrl && accessKey && accessKey.length >= 44) {
      var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      function b64url(s) {
        var b2 = [];
        for (var i = 0; i < s.length; i++) {
          var cc = s.charCodeAt(i);
          if (cc < 128) { b2.push(cc); }
          else if (cc < 2048) { b2.push(192 | (cc >> 6)); b2.push(128 | (cc & 63)); }
          else { b2.push(224 | (cc >> 12)); b2.push(128 | ((cc >> 6) & 63)); b2.push(128 | (cc & 63)); }
        }
        var r = '';
        for (var i2 = 0; i2 < b2.length; i2 += 3) {
          var bb = (b2[i2] << 16) | ((i2 + 1 < b2.length ? b2[i2 + 1] : 0) << 8) | (i2 + 2 < b2.length ? b2[i2 + 2] : 0);
          r += B64[(bb >> 18) & 63] + B64[(bb >> 12) & 63];
          r += i2 + 1 < b2.length ? B64[(bb >> 6) & 63] : '=';
          r += i2 + 2 < b2.length ? B64[bb & 63] : '=';
        }
        return r.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      fetchUrl = 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaPublica.aspx?p=' + encodeURIComponent(b64url(accessKey));
    }

    if (!fetchUrl) return c.json(400, { error: 'url ou accessKey obrigatorio' });

    var resp = $http.send({
      url: fetchUrl,
      method: 'GET',
      timeout: 15,
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36' }
    });

    var raw = resp.body;
    var chars = [];
    if (Array.isArray(raw)) {
      for (var i = 0; i < raw.length; i++) chars.push(String.fromCharCode(raw[i]));
    } else {
      chars.push(String(raw));
    }
    var html = chars.join('');

    if (html.indexOf('g-recaptcha') !== -1 || html.indexOf('captcha') !== -1 || html.indexOf('Página não encontrada') !== -1) {
      return c.json(200, { store: '', purchase_date: '', total_amount: 0, items: [] });
    }

    // 1. Store
    var store = '';
    var m = html.match(/class="txtTopo"[^>]*>([^<]+)</);
    if (m) store = m[1].trim();

    // 2. Date (multiplos formatos)
    var date = '';
    var d = html.match(/Emiss[ãa]o[^<]*<\/strong>\s*(\d{2})\/(\d{2})\/(\d{4})/);
    if (!d) d = html.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (d) date = d[3] + '-' + d[2] + '-' + d[1];

    // 3. Total - prefere totalNumb com txtMax, depois o ultimo totalNumb
    var total = 0;
    var maxMatch = html.match(/class="totalNumb\s+txtMax"[^>]*>([\d.,]+)</);
    if (maxMatch) {
      total = parseFloat(maxMatch[1].replace(/\./g, '').replace(',', '.'));
    }
    if (!total) {
      var allTotals = [];
      var tr = /class="totalNumb[^"]*"[^>]*>([\d.,]+)</g;
      var tm;
      while ((tm = tr.exec(html)) !== null) {
        var v = parseFloat(tm[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(v) && v > 0) allTotals.push(v);
      }
      if (allTotals.length > 0) total = allTotals[allTotals.length - 1];
    }

    // 4. Items
    var items = [];
    var ir = /<tr[^>]*id="Item\s*\+\s*\d+"[^>]*>([\s\S]*?)<\/tr>/g;
    var im;
    while ((im = ir.exec(html)) !== null) {
      var block = im[1];
      var nm = block.match(/class="txtTit"[^>]*>([^<]+)</);
      var qm = block.match(/Qtde\.:<\/strong>\s*([^<]+)/);
      var pm = block.match(/Vl\.\s*Unit\.:<\/strong>[\s\S]*?([\d.,]+)\s*</);
      if (nm && qm && pm) {
        var qty = parseFloat(qm[1].replace(/\./g, '').replace(',', '.'));
        var up = parseFloat(pm[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(qty) && !isNaN(up) && qty > 0) {
          items.push({ description: nm[1].trim(), quantity: qty, unit_price: up });
        }
      }
    }

    return c.json(200, { store: store, purchase_date: date, total_amount: total, items: items.slice(0, 80) });
  } catch (err) {
    return c.json(200, { store: '', purchase_date: '', total_amount: 0, items: [] });
  }
});
