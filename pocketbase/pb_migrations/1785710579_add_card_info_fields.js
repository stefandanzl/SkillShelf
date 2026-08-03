/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("cards_");

    // Optional source reference for a card, e.g. "1", "1.4", "3a", "Q12".
    // Stored as text (not number) so non-numeric source labels are preserved.
    collection.fields.add(
      new TextField({
        name: "question_number",
        required: false,
        presentable: false,
        system: false,
      })
    );

    // Optional topic / chapter / category label.
    collection.fields.add(
      new TextField({
        name: "topic",
        required: false,
        presentable: false,
        system: false,
      })
    );

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("cards_");
    collection.fields.removeByName("question_number");
    collection.fields.removeByName("topic");
    app.save(collection);
  }
);
