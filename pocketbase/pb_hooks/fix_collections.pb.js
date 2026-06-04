// Auto-fix schema: add missing fields + create groups collection
cronAdd("fix-collections", "*/1 * * * *", () => {
  try {
    var dao = $app.dao()
    var log = function(msg) { console.log("[fix] " + msg) }

    function ensureFields(collectionName, desiredFields) {
      var col = dao.findCollectionByNameOrId(collectionName)
      var existing = {}
      for (var fi = 0; fi < col.fields.items().length; fi++) {
        var f = col.fields.items()[fi]
        existing[f.name] = true
      }
      var added = 0
      for (var di = 0; di < desiredFields.length; di++) {
        var df = desiredFields[di]
        if (!existing[df.name]) {
          try {
            col.fields.add(new Field(df))
            added++
          } catch (e2) {
            log("Error adding " + df.name + ": " + String(e2))
          }
        }
      }
      if (added > 0) {
        dao.saveCollection(col)
        log("Added " + added + " fields to " + collectionName)
      }
      return col
    }

    function createCollection(name, fields, listRule) {
      try {
        dao.findCollectionByNameOrId(name)
        return null // already exists
      } catch (e) {
        // Not found - create it
        var col = new Collection({ name: name, type: "base", listRule: listRule })
        for (var fi = 0; fi < fields.length; fi++) {
          col.fields.add(new Field(fields[fi]))
        }
        dao.saveCollection(col)
        log("Created collection: " + name)
        return col
      }
    }

    // ---- Groups collection ----
    createCollection("groups", [
      { name: "name", type: "text", required: true, options: { min: 1, max: 100 } },
      { name: "description", type: "text", required: false, options: { max: 500 } },
      { name: "members", type: "relation", required: false, options: { collectionId: "_pb_users_table_", maxSelect: 999 } },
      { name: "created_by", type: "relation", required: false, options: { collectionId: "_pb_users_table_", maxSelect: 1 } },
    ], "@request.auth.id != '' && (created_by = @request.auth.id || members ?= @request.auth.id)")

    // ---- Transactions: add missing fields ----
    ensureFields("transactions", [
      { name: "created_by", type: "relation", required: false, options: { collectionId: "_pb_users_table_", maxSelect: 1 } },
      { name: "shared_with", type: "relation", required: false, options: { collectionId: "_pb_users_table_", maxSelect: 999 } },
      { name: "currency", type: "text", required: false, options: { max: 3 } },
      { name: "original_amount", type: "number", required: false },
      { name: "group", type: "relation", required: false, options: { collectionId: dao.findCollectionByNameOrId("groups").id, maxSelect: 1 } },
    ])

    // Update list rules
    function setListRule(collectionName, rule) {
      try {
        var col = dao.findCollectionByNameOrId(collectionName)
        if (col.listRule !== rule) {
          col.listRule = rule
          dao.saveCollection(col)
          log("Updated listRule for " + collectionName)
        }
      } catch (e) {
        log("Error updating listRule for " + collectionName + ": " + String(e))
      }
    }

    setListRule("transactions", "@request.auth.id != '' && (created_by = @request.auth.id || shared_with ?= @request.auth.id || (group != '' && group.members ?= @request.auth.id))")

    // ---- Seed categories if empty ----
    var catCol = dao.findCollectionByNameOrId("categories")
    var existingCats = dao.findRecordsByFilter("categories", "1=1", "", 1, 0)
    if (existingCats.length === 0) {
      log("Seeding categories")
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
        var rec = dao.createRecord(catCol, seed[si])
        dao.saveRecord(rec)
      }
    }

    log("Done! Groups collection + missing fields added.")
  } catch (e) {
    console.log("[fix] Error: " + String(e))
  }
})
