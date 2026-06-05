routerAdd('GET', '/api/cards/list', function(c) {
  try {
    var info = c.requestInfo();
    var owner = info.auth && info.auth.id ? info.auth.id : '';
    if (!owner) return c.json(401, { error: 'auth required' });

    var records = $app.findRecordsByFilter('cards', 'owner = {:owner}', '', 0, 0, { owner: owner });
    var items = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      items.push({
        id: r.getId(),
        name: r.get('name'),
        type: r.get('type'),
        due_day: r.get('due_day'),
        owner: r.get('owner')
      });
    }
    return c.json(200, { items: items });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});