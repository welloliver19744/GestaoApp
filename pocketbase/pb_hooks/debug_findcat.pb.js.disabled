routerAdd('GET', '/api/debug/findcat', function(c) {
  try {
    // Test findRecordsByFilter
    var filter = $app.findRecordsByFilter('categories', 'id = {:id}', '', 0, 0, { id: '3iy86kf7soyk6qo' });
    var byFilter = null;
    if (filter && filter.length > 0) {
      byFilter = { id: filter[0].get('id'), name: filter[0].get('name') };
    }

    // Test findRecordById with collection ID
    var byColId = $app.findRecordById('pbc_3292755704', '3iy86kf7soyk6qo');
    var byIdResult = null;
    if (byColId) {
      byIdResult = { id: byColId.get('id'), name: byColId.get('name') };
    }

    return c.json(200, {
      byFilter: byFilter,
      byColId: byIdResult,
    });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});
