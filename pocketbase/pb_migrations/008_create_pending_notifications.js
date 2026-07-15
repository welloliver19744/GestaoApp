/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: 'pending_notifications',
    type: 'base',
    system: false,
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '@request.auth.id != ""',
    updateRule: null,
    deleteRule: '@request.auth.id != ""',
    schema: [
      { name: 'user', type: 'text', required: true, options: { max: 255 } },
      { name: 'title', type: 'text', required: true, options: { max: 255 } },
      { name: 'body', type: 'text', required: true, options: { max: 500 } },
      { name: 'url', type: 'text', required: false, options: { max: 255 } },
    ],
  })
  app.save(collection)
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId('pending_notifications')) } catch (e) {}
})
