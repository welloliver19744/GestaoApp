migrate((app) => {
  const categories = new Collection({
    name: 'categories',
    type: 'base',
    system: false,
    schema: [
      { name: 'name', type: 'text', required: true, options: { min: 1, max: 50 } },
      { name: 'icon', type: 'text', required: false, options: { max: 50 } },
      { name: 'color', type: 'text', required: false, options: { max: 7 } },
      { name: 'budget_monthly', type: 'number', required: false, options: { min: 0 } },
    ],
  })
  app.save(categories)

  const transactions = new Collection({
    name: 'transactions',
    type: 'base',
    system: false,
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
    ],
    indexes: [
      'CREATE INDEX idx_transactions_due_date ON transactions (due_date)',
      'CREATE INDEX idx_transactions_paid ON transactions (paid)',
      'CREATE INDEX idx_transactions_group_id ON transactions (group_id)',
      'CREATE INDEX idx_transactions_purchase_date ON transactions (purchase_date)',
    ],
  })
  app.save(transactions)
}, (app) => {
  app.delete(app.findCollectionByNameOrId('transactions'))
  app.delete(app.findCollectionByNameOrId('categories'))
})
