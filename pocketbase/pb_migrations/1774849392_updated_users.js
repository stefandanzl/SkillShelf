/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select3571151285",
    "maxSelect": 1,
    "name": "language",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "en",
      "de"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("select3571151285")

  return app.save(collection)
})
