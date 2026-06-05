// Debug: create transaction via $app.save() bypassing REST validation
routerAdd('POST', '/api/debug/create_tx', function(c) {
  try {
    var info = c.requestInfo();
    var body = info.body;
    if (!body) return c.json(400, { error: 'no body' });

    var collection = $app.findCollectionByNameOrId('transactions');
    var record = new Record(collection);
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    for (var i = 0; i < 15; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    record.set('id', id);

    // Set all fields
    record.set('description', body.description || 'test');
    if (body.category) record.set('category', body.category);
    if (body.store) record.set('store', body.store);
    if (body.purchase_date) record.set('purchase_date', body.purchase_date);
    if (body.total_amount) record.set('total_amount', parseFloat(body.total_amount));
    if (body.payment_type) record.set('payment_type', body.payment_type);
    if (body.installment_count) record.set('installment_count', parseInt(body.installment_count));
    if (body.installment_number) record.set('installment_number', parseInt(body.installment_number));
    if (body.installment_value) record.set('installment_value', parseFloat(body.installment_value));
    if (body.due_date) record.set('due_date', body.due_date);
    if (body.currency) record.set('currency', body.currency);

    $app.save(record);

    return c.json(200, { id: record.get('id'), success: true });
  } catch (err) {
    return c.json(500, { error: String(err) });
  }
});
