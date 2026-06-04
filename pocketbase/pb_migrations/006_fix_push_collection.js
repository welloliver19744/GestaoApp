/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  var collection
  try {
    collection = app.findCollectionByNameOrId('push_subscriptions')
    app.delete(collection)
  } catch (e) {}

  collection = new Collection({
    name: 'push_subscriptions',
    type: 'base',
    system: false,
    schema: [
      { name: 'user', type: 'text', required: true, options: { max: 255 } },
      { name: 'subscription', type: 'json', required: true },
      { name: 'enabled', type: 'bool', required: false },
    ],
  })
  app.save(collection)
}, (app) => {
  try {
    var collection = app.findCollectionByNameOrId('push_subscriptions')
    app.delete(collection)
  } catch (e) {}
})
