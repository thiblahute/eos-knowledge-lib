const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;
const Search = imports.app.modules.banner.search;

Gtk.init(null);

describe('Banner.Search', function () {
    let searchBanner, store;

    beforeEach(function () {
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        searchBanner = new Search.Search();
    });

    it('displays the query string somewhere when the search starts', function () {
        expect(Gtk.test_find_label(searchBanner, '*myfoobar*')).toBeNull();
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: 'myfoobar',
        });
        expect(Gtk.test_find_label(searchBanner, '*myfoobar*')).not.toBeNull();
    });
});
