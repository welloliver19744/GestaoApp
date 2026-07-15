/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const names = ['push_subscriptions', 'recurring_transactions', 'transactions', 'categories']
  for (var i = 0; i < names.length; i++) {
    try { app.delete(app.findCollectionByNameOrId(names[i])) } catch (e) {}
  }

  // Create categories
  const categories = new Collection({
    name: 'categories',
    type: 'base',
    system: false,
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: null,
    schema: [
      { name: 'name', type: 'text', required: true, options: { min: 1, max: 50 } },
      { name: 'icon', type: 'text', required: false, options: { max: 50 } },
      { name: 'color', type: 'text', required: false, options: { max: 7 } },
      { name: 'budget_monthly', type: 'number', required: false, options: { min: 0 } },
    ],
  })
  app.save(categories)

  var seed = [
    { name: 'Alimentação', icon: 'shopping-cart', color: '#f97316' },
    { name: 'Transporte', icon: 'car', color: '#22d3ee' },
    { name: 'Moradia', icon: 'home', color: '#fbbf24' },
    { name: 'Saúde', icon: 'heart', color: '#fb7185' },
    { name: 'Educação', icon: 'book', color: '#c084fc' },
    { name: 'Lazer', icon: 'gamepad', color: '#4ade80' },
    { name: 'Assinaturas', icon: 'repeat', color: '#a78bfa' },
    { name: 'Serviços', icon: 'zap', color: '#f472b6' },
    { name: 'Salário', icon: 'briefcase', color: '#34d399' },
    { name: 'Outros', icon: 'more-horizontal', color: '#9ca3af' },
  ]
  for (var s = 0; s < seed.length; s++) {
    app.save(new Record(categories, seed[s]))
  }

  // Create transactions (no indexes)
  const transactions = new Collection({
    name: 'transactions',
    type: 'base',
    system: false,
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    schema: [
      { name: 'description', type: 'text', required: true, options: { min: 3, max: 200 } },
      { name: 'category', type: 'relation', required: true, options: { collectionId: categories.id, maxSelect: 1 } },
      { name: 'store', type: 'text', required: false, options: { max: 100 } },
      { name: 'purchase_date', type: 'date', required: true },
      { name: 'total_amount', type: 'number', required: true, options: { min: 0.01 } },
      { name: 'payment_type', type: 'select', required: true, options: { values: ['cash', 'installment'], maxSelect: 1 } },
      { name: 'installment_count', type: 'number', required: true, options: { min: 1, max: 120 } },
      { name: 'installment_number', type: 'number', required: true, options: { min: 1, max: 120 } },
      { name: 'installment_value', type: 'number', required: true, options: { min: 0.01 } },
      { name: 'due_date', type: 'date', required: true },
      { name: 'paid', type: 'bool', required: false },
      { name: 'paid_at', type: 'date', required: false },
      { name: 'paid_by', type: 'relation', required: false, options: { collectionId: '_pb_users_table_', maxSelect: 1 } },
      { name: 'group_id', type: 'text', required: false, options: { max: 36 } },
      { name: 'notes', type: 'text', required: false, options: { max: 500 } },
      { name: 'receipt', type: 'file', required: false, options: { maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], thumbs: ['320x240', '640x480'] } },
    ],
  })
  app.save(transactions)

  // Recurring
  const recurring = new Collection({
    name: 'recurring_transactions',
    type: 'base',
    system: false,
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    schema: [
      { name: 'description', type: 'text', required: true, options: { min: 3, max: 200 } },
      { name: 'category', type: 'relation', required: true, options: { collectionId: categories.id, maxSelect: 1 } },
      { name: 'store', type: 'text', required: false, options: { max: 100 } },
      { name: 'total_amount', type: 'number', required: true, options: { min: 0.01 } },
      { name: 'payment_type', type: 'select', required: true, options: { values: ['cash', 'installment'], maxSelect: 1 } },
      { name: 'installment_count', type: 'number', required: true, options: { min: 1, max: 120 } },
      { name: 'installment_value', type: 'number', required: true, options: { min: 0.01 } },
      { name: 'frequency', type: 'select', required: true, options: { values: ['monthly', 'yearly'], maxSelect: 1 } },
      { name: 'day_of_month', type: 'number', required: true, options: { min: 1, max: 31 } },
      { name: 'month', type: 'number', required: false, options: { min: 1, max: 12 } },
      { name: 'active', type: 'bool', required: false },
      { name: 'next_due', type: 'date', required: true },
      { name: 'notes', type: 'text', required: false, options: { max: 500 } },
      { name: 'owner', type: 'relation', required: true, options: { collectionId: '_pb_users_table_', maxSelect: 1, cascadeDelete: false } },
    ],
  })
  app.save(recurring)

  // Push subscriptions
  const push = new Collection({
    name: 'push_subscriptions',
    type: 'base',
    system: false,
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    deleteRule: '@request.auth.id != ""',
    schema: [
      { name: 'user', type: 'text', required: true, options: { max: 255 } },
      { name: 'subscription', type: 'json', required: true },
      { name: 'enabled', type: 'bool', required: false },
    ],
  })
  app.save(push)
}, (app) => {
  var names = ['push_subscriptions', 'recurring_transactions', 'transactions', 'categories']
  for (var i = 0; i < names.length; i++) {
    try { app.delete(app.findCollectionByNameOrId(names[i])) } catch (e) {}
  }
})
