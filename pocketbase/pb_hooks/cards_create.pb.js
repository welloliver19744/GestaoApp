// Cards create — tenta $app.save() com ID manual, fallback SQL direto
routerAdd('POST', '/api/cards/create', function(c) {
  try {
    var info = c.requestInfo();
    var body = info.body;
    var name = body.name || '';
    var type = body.type || 'credit';
    var dueDay = parseInt(body.due_day) || 1;

    if (!name.trim()) return c.json(400, { error: 'name required' });

    var owner = info.auth && info.auth.id ? info.auth.id : '';
    if (!owner) return c.json(401, { error: 'auth required' });

    // Generate ID (15 chars alfanumérico)
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    for (var i = 0; i < 15; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));

    // Tenta via $app.save() com ID manual
    try {
      var collection = $app.findCollectionByNameOrId('cards');
      var record = new Record(collection);
      record.set('id', id);
      record.set('name', name);
      record.set('type', type);
      record.set('due_day', dueDay);
      record.set('owner', owner);
      $app.save(record);
    } catch (e2) {
      // Fallback: $app.dao().db().execute()
      var now = new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0] + '.000Z';
      var dao = $app.Dao();
      dao.db().execute('INSERT INTO cards (id, name, type, due_day, owner, created, updated) VALUES ({:id}, {:name}, {:type}, {:due_day}, {:owner}, {:created}, {:updated})', {
        id: id, name: name, type: type, due_day: dueDay, owner: owner, created: now, updated: now
      });
    }

    return c.json(200, { id: id, name: name, type: type, due_day: dueDay, owner: owner });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});
