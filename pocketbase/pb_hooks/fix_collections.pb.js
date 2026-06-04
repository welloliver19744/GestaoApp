// One-time fix: add missing schema fields to collections
// Uses $app.dao() which is only available in cron/hook context
cronAdd("fix-collections", "*/1 * * * *", () => {
  try {
    var collections = [
      {
        name: "categories",
        fields: [
          { name: "name", type: "text", required: true, options: { min: 1, max: 50 } },
          { name: "icon", type: "text", required: false, options: { max: 50 } },
          { name: "color", type: "text", required: false, options: { max: 7 } },
          { name: "budget_monthly", type: "number", required: false, options: { min: 0 } },
        ],
      },
      {
        name: "transactions",
        fields: [
          { name: "description", type: "text", required: true, options: { min: 3, max: 200 } },
          { name: "category", type: "relation", required: true, options: { collectionId: $app.dao().findCollectionByNameOrId("categories").id, maxSelect: 1 } },
          { name: "store", type: "text", required: false, options: { max: 100 } },
          { name: "purchase_date", type: "date", required: true },
          { name: "total_amount", type: "number", required: true, options: { min: 0.01 } },
          { name: "payment_type", type: "select", required: true, options: { values: ["cash", "installment"], maxSelect: 1 } },
          { name: "installment_count", type: "number", required: true, options: { min: 1, max: 120 } },
          { name: "installment_number", type: "number", required: true, options: { min: 1, max: 120 } },
          { name: "installment_value", type: "number", required: true, options: { min: 0.01 } },
          { name: "due_date", type: "date", required: true },
          { name: "paid", type: "bool", required: false },
          { name: "paid_at", type: "date", required: false },
          { name: "paid_by", type: "relation", required: false, options: { collectionId: "_pb_users_table_", maxSelect: 1 } },
          { name: "group_id", type: "text", required: false, options: { max: 36 } },
          { name: "notes", type: "text", required: false, options: { max: 500 } },
          { name: "receipt", type: "file", required: false, options: { maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"], thumbs: ["320x240", "640x480"] } },
        ],
        indexes: [
          "CREATE INDEX idx_transactions_due_date ON transactions (due_date)",
          "CREATE INDEX idx_transactions_paid ON transactions (paid)",
          "CREATE INDEX idx_transactions_group_id ON transactions (group_id)",
          "CREATE INDEX idx_transactions_purchase_date ON transactions (purchase_date)",
        ],
      },
      {
        name: "recurring_transactions",
        fields: [
          { name: "description", type: "text", required: true, options: { min: 3, max: 200 } },
          { name: "category", type: "relation", required: true, options: { collectionId: $app.dao().findCollectionByNameOrId("categories").id, maxSelect: 1 } },
          { name: "store", type: "text", required: false, options: { max: 100 } },
          { name: "total_amount", type: "number", required: true, options: { min: 0.01 } },
          { name: "payment_type", type: "select", required: true, options: { values: ["cash", "installment"], maxSelect: 1 } },
          { name: "installment_count", type: "number", required: true, options: { min: 1, max: 120 } },
          { name: "installment_value", type: "number", required: true, options: { min: 0.01 } },
          { name: "frequency", type: "select", required: true, options: { values: ["monthly", "yearly"], maxSelect: 1 } },
          { name: "day_of_month", type: "number", required: true, options: { min: 1, max: 31 } },
          { name: "month", type: "number", required: false, options: { min: 1, max: 12 } },
          { name: "active", type: "bool", required: false },
          { name: "next_due", type: "date", required: true },
          { name: "notes", type: "text", required: false, options: { max: 500 } },
          { name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_table_", maxSelect: 1, cascadeDelete: false } },
        ],
      },
      {
        name: "push_subscriptions",
        fields: [
          { name: "user", type: "text", required: true, options: { max: 255 } },
          { name: "subscription", type: "json", required: true },
          { name: "enabled", type: "bool", required: false },
        ],
      },
    ]

    var fixed = 0
    for (var ci = 0; ci < collections.length; ci++) {
      var colDef = collections[ci]
      var col = $app.dao().findCollectionByNameOrId(colDef.name)

      // Check if fields already exist
      var existingFields = col.fields ? col.fields.items().length : 1
      if (existingFields > 1) {
        console.log("[fix] " + colDef.name + " already has " + existingFields + " fields, skipping")
        continue
      }

      console.log("[fix] Adding fields to " + colDef.name)

      // Delete the system id field that was auto-created if we're adding our own
      // Actually, just add fields on top
      for (var fi = 0; fi < colDef.fields.length; fi++) {
        try {
          var f = new Field(colDef.fields[fi])
          col.fields.add(f)
        } catch (e2) {
          console.log("[fix] Error adding field " + colDef.fields[fi].name + ": " + String(e2))
        }
      }

      $app.dao().saveCollection(col)
      
      // Add indexes for transactions
      if (colDef.indexes) {
        try {
          col.indexes = colDef.indexes
          $app.dao().saveCollection(col)
        } catch (e2) {
          console.log("[fix] Error adding indexes to " + colDef.name + ": " + String(e2))
        }
      }

      fixed++
    }

    // Seed categories if empty
    var catCol = $app.dao().findCollectionByNameOrId("categories")
    var existingCats = $app.dao().findRecordsByFilter("categories", "1=1", "", 1, 0)
    if (existingCats.length === 0) {
      console.log("[fix] Seeding categories")
      var seed = [
        { name: "Alimentação", icon: "shopping-cart", color: "#f97316" },
        { name: "Transporte", icon: "car", color: "#22d3ee" },
        { name: "Moradia", icon: "home", color: "#fbbf24" },
        { name: "Saúde", icon: "heart", color: "#fb7185" },
        { name: "Educação", icon: "book", color: "#c084fc" },
        { name: "Lazer", icon: "gamepad", color: "#4ade80" },
        { name: "Assinaturas", icon: "repeat", color: "#a78bfa" },
        { name: "Serviços", icon: "zap", color: "#f472b6" },
        { name: "Salário", icon: "briefcase", color: "#34d399" },
        { name: "Outros", icon: "more-horizontal", color: "#9ca3af" },
      ]
      for (var si = 0; si < seed.length; si++) {
        var rec = $app.dao().createRecord(catCol, seed[si])
        $app.dao().saveRecord(rec)
      }
    }

    // Cancel this cron job by removing the file after success
    console.log("[fix] Collections fixed successfully (" + fixed + " of " + collections.length + ")")
    // Keep running every minute but no-op after first success
    $app.dao().saveRecord($app.dao().findFirstRecordByFilter("_collections", "name='categories'"))
    // Create a marker to disable this cron
    console.log("[fix] Done! You can now remove this hook file.")
  } catch (e) {
    console.log("[fix] Error: " + String(e))
  }
})
