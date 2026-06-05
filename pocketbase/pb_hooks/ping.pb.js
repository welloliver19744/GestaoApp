console.log('HELLO FROM PING HOOK');
routerAdd('GET', '/api/ping', function(c) {
  return c.json(200, { ok: true });
});
