const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ArticlesForSetCrossSection = imports.app.modules.selection.articlesForSetCrossSection;
const Compliance = imports.tests.compliance;
const HistoryStore = imports.app.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;

Gtk.init(null);

function setup (store) {
    store.set_current_item_from_props({
        page_type: 'set',
        model: Eknc.SetObjectModel.new_from_props(),
    });
}

Compliance.test_selection_compliance(ArticlesForSetCrossSection.ArticlesForSetCrossSection,
    setup);
Compliance.test_xapian_selection_compliance(ArticlesForSetCrossSection.ArticlesForSetCrossSection,
    setup);

describe('Selection.ArticlesForSet', function () {
    let factory, selection, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        [selection, factory] = MockFactory.setup_tree({
            type: ArticlesForSetCrossSection.ArticlesForSetCrossSection,
        });
    });

    it('dispatches item-clicked when asked to show more', function () {
        let model = Eknc.SetObjectModel.new_from_props();
        selection.model = model;
        selection.show_more();
        expect(dispatcher.last_payload_with_type(Actions.ITEM_CLICKED))
            .toBeDefined();
    });
});
