/// <reference path="../pb_modules/pocketbase.d.ts" />
// migration: Add currency and original_amount fields

const collections = [
  {
    name: "transactions",
    fields: [
      { name: "currency", type: "select", required: true, values: ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"] },
      { name: "original_amount", type: "number", required: false },
    ],
  },
  {
    name: "recurring_transactions",
    fields: [
      { name: "currency", type: "select", required: true, values: ["BRL", "USD", "EUR", "GBP", "ARS", "CLP"] },
    ],
  },
];

for (const colDef of collections) {
  const collection = $app.dao().findCollectionByNameOrId(colDef.name);
  if (!collection) {
    console.log(`Collection ${colDef.name} not found`);
    continue;
  }

  for (const fieldDef of colDef.fields) {
    // Check if field already exists
    const existing = collection.fields.find((f) => f.name === fieldDef.name);
    if (existing) {
      console.log(`Field ${fieldDef.name} already exists in ${colDef.name}`);
      continue;
    }

    const field = new PocketBaseField(fieldDef.type);
    field.name = fieldDef.name;
    field.required = fieldDef.required || false;

    if (fieldDef.type === "select" && fieldDef.values) {
      field.values = fieldDef.values;
    }

    collection.fields.add(field);
    console.log(`Added field ${fieldDef.name} to ${colDef.name}`);
  }

  $app.dao().saveCollection(collection);
}

console.log("Migration complete");
