// Cards CRUD via SQL direto (bypass PocketBase REST validation)

routerAdd('POST', '/api/cards/create', function(c) {
  try {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    for (var i = 0; i < 15; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));

    var info = c.requestInfo();
    var body = info.body;
    var name = body.name || '';
    var type = body.type || 'credit';
    var dueDay = parseInt(body.due_day) || 1;

    if (!name.trim()) return c.json(400, { error: 'name required' });

    var owner = info.auth && info.auth.id ? info.auth.id : '';
    if (!owner) return c.json(401, { error: 'auth required' });

    var collection = $app.findCollectionByNameOrId('cards');
    var record = new Record(collection);
    record.set('id', id);
    record.set('name', name);
    record.set('type', type);
    record.set('due_day', dueDay);
    record.set('owner', owner);
    $app.save(record);

    return c.json(200, { id: id, name: name, type: type, due_day: dueDay, owner: owner });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});

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

routerAdd('POST', '/api/cards/delete', function(c) {
  try {
    var info = c.requestInfo();
    var id = info.body && info.body.id ? String(info.body.id) : '';
    if (!id) return c.json(400, { error: 'id required' });

    var owner = info.auth && info.auth.id ? info.auth.id : '';
    if (!owner) return c.json(401, { error: 'auth required' });

    var collection = $app.findCollectionByNameOrId('cards');
    var record = new Record(collection);
    record.set('id', id);
    record.markAsNotNew();
    $app.delete(record);

    return c.json(200, { success: true });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});
