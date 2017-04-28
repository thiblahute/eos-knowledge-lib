const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const NextArticle = imports.app.modules.selection.nextArticle;
const Pages = imports.app.pages;
const Compliance = imports.tests.compliance;

Gtk.init(null);

function setup (store) {
    let model = Eknc.ArticleObjectModel.new_from_props({
      ekn_id: 'ekn:///d3eee75ff0beef2c001c00b424e632280e671f32'
    });

    let next_model = Eknc.ArticleObjectModel.new_from_props({
      ekn_id: 'ekn:///e430d1587a3710f5c1444d96b07eb3ee7a2b2a1e'
    });

    store.set_current_item_from_props({
        page_type: Pages.ARTICLE,
        model: model,
        context: [model, next_model],
    });
}

Compliance.test_selection_compliance(NextArticle.NextArticle, setup);
Compliance.test_xapian_selection_compliance(NextArticle.NextArticle, setup);
