// Stores CRUD via SQL direto (bypass PocketBase REST validation)

routerAdd('GET', '/api/stores/list', function(c) {
  try {
    var info = c.requestInfo();
    var owner = info.auth && info.auth.id ? String(info.auth.id) : '';
    if (!owner) return c.json(401, { error: 'auth required' });
    var records = $app.findRecordsByFilter('stores', 'owner = {:owner}', 'name', 0, 0, { owner: owner });
    var items = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var rid = r.id;
      if (typeof rid !== 'string') { try { rid = r.getId(); } catch (e) {} }
      items.push({
        id: String(rid || ''),
        name: r.get('name'),
        owner: r.get('owner'),
        created: r.get('created'),
        updated: r.get('updated'),
      });
    }
    return c.json(200, { items: items });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});

routerAdd('POST', '/api/stores/create', function(c) {
  try {
    var info = c.requestInfo();
    var owner = info.auth && info.auth.id ? String(info.auth.id) : '';
    if (!owner) return c.json(401, { error: 'auth required' });
    var body = info.body || {};
    var name = String(body.name || '').trim();
    if (!name) return c.json(400, { error: 'name required' });

    var existing = $app.findRecordsByFilter('stores', 'name = {:name} && owner = {:owner}', '', 1, 0, { name: name, owner: owner });
    if (existing.length > 0) {
      var e0 = existing[0];
      var eid = e0.id;
      if (typeof eid !== 'string') { try { eid = e0.getId(); } catch (e) {} }
      return c.json(200, { id: String(eid || ''), name: name, owner: owner, existed: true });
    }

    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    for (var i = 0; i < 15; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    var collection = $app.findCollectionByNameOrId('stores');
    var record = new Record(collection);
    record.set('id', id);
    record.set('name', name);
    record.set('owner', owner);
    $app.save(record);
    return c.json(200, { id: id, name: name, owner: owner, existed: false });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});

routerAdd('POST', '/api/stores/delete', function(c) {
  try {
    var info = c.requestInfo();
    var owner = info.auth && info.auth.id ? String(info.auth.id) : '';
    if (!owner) return c.json(401, { error: 'auth required' });
    var id = String((info.body && info.body.id) || '');
    if (!id) return c.json(400, { error: 'id required' });
    var collection = $app.findCollectionByNameOrId('stores');
    var record = new Record(collection);
    record.set('id', id);
    record.markAsNotNew();
    $app.delete(record);
    return c.json(200, { success: true });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});
