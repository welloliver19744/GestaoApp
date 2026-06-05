// NFC-e consultation via SEFAZ SP
// POST /api/nfce/consulta { "accessKey": "352606..." }
// Returns { "total_amount", "purchase_date", "store", "items" }

var BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64URL(str) {
  var bytes = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) { bytes.push(192 | (c >> 6)); bytes.push(128 | (c & 63)); }
    else { bytes.push(224 | (c >> 12)); bytes.push(128 | ((c >> 6) & 63)); bytes.push(128 | (c & 63)); }
  }
  var result = '';
  for (var i = 0; i < bytes.length; i += 3) {
    var b = (bytes[i] << 16) | ((i + 1 < bytes.length ? bytes[i + 1] : 0) << 8) | (i + 2 < bytes.length ? bytes[i + 2] : 0);
    result += BASE64_CHARS[(b >> 18) & 63];
    result += BASE64_CHARS[(b >> 12) & 63];
    result += i + 1 < bytes.length ? BASE64_CHARS[(b >> 6) & 63] : '=';
    result += i + 2 < bytes.length ? BASE64_CHARS[b & 63] : '=';
  }
  return result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function extractCNPJ(chave) {
  if (!chave || chave.length < 20) return '';
  return chave.slice(6, 20);
}

function parseBRL(val) {
  if (!val) return 0;
  var s = String(val);
  var cleaned = s.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseDateBR(str) {
  if (!str) return '';
  var s = String(str).split(' ')[0];
  var m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (m) return m[3] + '-' + m[2] + '-' + m[1];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return '';
}

function extractFromHTML(htmlRaw, chave) {
  var html = typeof htmlRaw === 'string' ? htmlRaw : '';
  var result = { total_amount: 0, purchase_date: '', store: '', items: [] };

  // 1. Try JSON in script tags (var/let/const)
  var scriptRegex = /<script[^>]*>[\s\S]*?(?:var|let|const)\s+(?:dados|nfce|nota|data)\s*=\s*(\{[\s\S]*?\});/gi;
  var m;
  while ((m = scriptRegex.exec(html)) !== null) {
    try {
      var data = JSON.parse(m[1]);
      result.total_amount = parseBRL(data.vNF || data.total || data.vTotTrib || data.valorTotal || data.total_amount);
      result.purchase_date = parseDateBR(data.dEmi || data.dataEmissao || data.data || data.purchase_date);
      result.store = data.xNome || data.nome_fantasia || data.nome || data.razaoSocial || data.store || '';
      if (Array.isArray(data.det || data.itens || data.items)) {
        result.items = (data.det || data.itens || data.items).map(function(i) {
          var prod = i.prod || i;
          return {
            description: prod.xProd || prod.descricao || prod.description || '',
            amount: parseBRL(prod.vProd || prod.vUnCom || prod.amount || 0),
            quantity: parseFloat(prod.qCom || prod.quantity || 1),
          };
        });
      }
      if (result.total_amount || result.purchase_date) break;
    } catch (_) {}
  }

  // 2. Try <script type="application/json">
  if (!result.total_amount) {
    var jsonScriptRegex = /<script\s+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((m = jsonScriptRegex.exec(html)) !== null) {
      try {
        var data = JSON.parse(m[1]);
        result.total_amount = parseBRL(data.vNF || data.total || data.valorTotal);
        result.purchase_date = parseDateBR(data.dEmi || data.dataEmissao || data.data);
        result.store = result.store || data.xNome || data.nome_fantasia || data.nome || '';
        break;
      } catch (_) {}
    }
  }

  // 3. Regex fallback from HTML table
  if (!result.total_amount) {
    var totalRegex = /(?:TOTAL|VALOR TOTAL|Total)\s*R?\$?\s*([\d.,]+)/i.exec(html);
    if (totalRegex) result.total_amount = parseBRL(totalRegex[1]);
  }
  if (!result.purchase_date) {
    var dateRegex = /(?:Emiss[ãa]o|Data|DATA|Emissao)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i.exec(html);
    if (dateRegex) result.purchase_date = dateRegex[1].replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
  }
  if (!result.store) {
    var storeRegex = /(?:Raz[ãa]o Social|Nome Fantasia|Emitente|Estabelecimento)\s*:?\s*([^\n<"]+)/i.exec(html);
    if (storeRegex) result.store = storeRegex[1].trim();
  }

  // 4. Fallback CNPJ
  if (!result.store && chave) {
    result.store = extractCNPJ(chave);
  }

  return result;
}

routerAdd('POST', '/api/nfce/consulta', function(c) {
  try {
    var body = c.requestInfo().body;
    var accessKey = String(body.accessKey || '').trim();

    if (!accessKey || accessKey.length < 44) {
      return c.json(400, { error: 'accessKey invalida: ' + accessKey });
    }

    var p = toBase64URL(accessKey);
    var url = 'https://www.sefaz.sp.gov.br/nfce/consulta?p=' + encodeURIComponent(p);

    var response = $http.send({
      url: url,
      method: 'GET',
      timeout: 20,
    });

    var html = typeof response.body === 'string' ? response.body : String(response.body || '');
    var result = extractFromHTML(html, accessKey);

    return c.json(200, result);
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});
