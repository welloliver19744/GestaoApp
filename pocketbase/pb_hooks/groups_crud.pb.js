// Groups CRUD via SQL direto (bypass PocketBase REST validation)

routerAdd('GET', '/api/groups/list', function(c) {
  try {
    var info = c.requestInfo();
    var owner = '';
    try { if (info.auth && info.auth.id) owner = String(info.auth.id); } catch (e) {}
    if (!owner) return c.json(401, { error: 'auth required' });
    var records;
    try {
      records = $app.findRecordsByFilter('groups', '', '-name', 0, 0);
    } catch (e1) {
      return c.json(500, { error: 'find-failed:' + String(e1) });
    }
    var items = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var rid = r.id;
      if (typeof rid !== 'string') { try { rid = r.getId(); } catch (e) {} }
      var rOwner = String(r.get('created_by') || '');
      var rMembers = String(r.get('members') || '[]');
      var membersArr = [];
      try { membersArr = JSON.parse(rMembers); } catch (e) { membersArr = []; }
      if (rOwner !== owner && membersArr.indexOf(owner) === -1) continue;
      items.push({
        id: String(rid || ''),
        name: r.get('name'),
        description: r.get('description'),
        members: membersArr,
        created_by: rOwner,
        created: r.get('created'),
        updated: r.get('updated'),
      });
    }
    return c.json(200, { items: items });
  } catch (err) {
    return c.json(500, { error: 'list-failed:' + String(err) });
  }
});

routerAdd('POST', '/api/groups/create', function(c) {
  try {
    var info = c.requestInfo();
    var owner = '';
    try { if (info.auth && info.auth.id) owner = String(info.auth.id); } catch (e) {}
    if (!owner) return c.json(401, { error: 'auth required' });
    var body = info.body || {};
    var name = String(body.name || '').trim();
    if (!name) return c.json(400, { error: 'name required' });
    var description = String(body.description || '');
    var members = Array.isArray(body.members) ? body.members : [];
    var membersStr = JSON.stringify(members);

    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    for (var i = 0; i < 15; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    var collection = $app.findCollectionByNameOrId('groups');
    var record = new Record(collection);
    record.set('id', id);
    record.set('name', name);
    record.set('description', description);
    record.set('members', membersStr);
    record.set('created_by', owner);
    $app.save(record);
    return c.json(200, { id: id, name: name, description: description, members: members, created_by: owner });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});

routerAdd('POST', '/api/groups/update', function(c) {
  try {
    var info = c.requestInfo();
    var owner = '';
    try { if (info.auth && info.auth.id) owner = String(info.auth.id); } catch (e) {}
    if (!owner) return c.json(401, { error: 'auth required' });
    var body = info.body || {};
    var id = String(body.id || '');
    if (!id) return c.json(400, { error: 'id required' });
    var members = Array.isArray(body.members) ? body.members : [];

    var collection = $app.findCollectionByNameOrId('groups');
    var existing = $app.findRecordById(collection, id);
    if (!existing) return c.json(404, { error: 'not found' });
    if (String(existing.get('created_by') || '') !== owner) return c.json(403, { error: 'forbidden' });

    existing.set('name', body.name || '');
    existing.set('description', body.description || '');
    existing.set('members', JSON.stringify(members));
    $app.save(existing);
    return c.json(200, { id: id, name: body.name, description: body.description, members: members });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});

routerAdd('POST', '/api/groups/delete', function(c) {
  try {
    var info = c.requestInfo();
    var owner = '';
    try { if (info.auth && info.auth.id) owner = String(info.auth.id); } catch (e) {}
    if (!owner) return c.json(401, { error: 'auth required' });
    var id = String((info.body && info.body.id) || '');
    if (!id) return c.json(400, { error: 'id required' });
    var collection = $app.findCollectionByNameOrId('groups');

    // Verifica se o grupo existe e pertence ao usuário
    var existing = $app.findRecordById(collection, id);
    if (!existing) return c.json(404, { error: 'not found' });
    if (String(existing.get('created_by') || '') !== owner) return c.json(403, { error: 'forbidden' });

    var record = new Record(collection);
    record.set('id', id);
    record.markAsNotNew();
    $app.delete(record);
    return c.json(200, { success: true });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});
