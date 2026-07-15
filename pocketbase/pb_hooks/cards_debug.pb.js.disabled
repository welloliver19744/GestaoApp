// cards_debug.pb.js — Intercepta POST /api/collections/cards/records e loga detalhes
routerAdd('POST', '/api/collections/cards/records', function(c) {
  try {
    var body = JSON.stringify(c.requestInfo().body || {});
    console.log('CARDS_DEBUG body=' + body);
    console.log('CARDS_DEBUG auth=' + JSON.stringify(c.requestInfo().auth || {}));
  } catch(e) {
    console.log('CARDS_DEBUG error=' + String(e));
  }
  c.next();
});
