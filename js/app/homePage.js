// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StyleClasses = imports.app.styleClasses;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const AppBanner = imports.app.modules.appBanner;
const ImagePreviewer = imports.app.imagePreviewer;
const SearchBox = imports.app.searchBox;

/**
 * Class: HomePage
 *
 * This represents the abstract class for the home page of the knowledge apps.
 * It has a title image URI and list of article cards to show.
 *
 * To work properly, subclasses will want to implement the 'pack_widgets'
 * and 'pack_cards' methods.
 */
const HomePage = new Lang.Class({
    Name: 'HomePage',
    GTypeName: 'EknHomePage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: app-banner
         * A logo for the application. Read-only.
         */
        'app-banner': GObject.ParamSpec.object('app-banner', 'App Banner',
            'The logo for this application',
            GObject.ParamFlags.READABLE,
            AppBanner.AppBanner),
        /**
         * Property: search-box
         *
         * The <SearchBox> widget created by this widget. Read-only,
         * modify using the <SearchBox> API. Use to type search queries and to display the last
         * query searched.
         */
        'search-box': GObject.ParamSpec.object('search-box', 'Search Box',
            'The Search box of this view widget',
            GObject.ParamFlags.READABLE,
            Endless.SearchBox),
        /**
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    Signals: {
        /**
         * Event: article-selected
         *
         * This event is triggered when an article is selected from the autocomplete menu.
         */
        'article-selected': {
            param_types: [GObject.TYPE_STRING]
        },
        /**
         * Event: search-entered
         * This event is triggered when the search box is activated. The parameter
         * is the search query.
         */
        'search-entered': {
            param_types: [GObject.TYPE_STRING]
        },

        /**
         * Event: search-text-changed
         * This event is triggered when the text in the search box is changed. The parameter
         * is the search box.
         */
        'search-text-changed': {
            param_types: [GObject.TYPE_OBJECT]
        },
        /**
         * Event: show-categories
         * This event is triggered when the categories button is clicked.
         */
        'show-categories': {}
    },

    _init: function (props) {
        props = props || {};
        this.app_banner = new AppBanner.AppBanner();
        this.app_banner.set_min_percentage(0.4);
        this.app_banner.set_max_percentage(0.7);

        this._cards = null;

        // Not using a SearchEntry since that comes with
        // the 'x' as secondary icon, which we don't want
        this.search_box = new SearchBox.SearchBox();

        this.search_box.connect('text-changed', Lang.bind(this, function (search_entry) {
            this.emit('search-text-changed', search_entry);
        }));

        this.search_box.connect('activate', Lang.bind(this, function (search_entry) {
            this.emit('search-entered', search_entry.text);
        }));

        this.search_box.connect('menu-item-selected', Lang.bind(this, function (search_entry, article_id) {
            this.emit('article-selected', article_id);
        }));

        this.parent(props);

        this.get_style_context().add_class(StyleClasses.HOME_PAGE);
        this.search_box.get_style_context().add_class(StyleClasses.SEARCH_BOX);

        this.pack_widgets(this.app_banner, this.search_box);
        this.show_all();
    },

    /**
     * Method: pack_widgets
     *
     * A virtual function to be overridden in subclasses. _init will set up
     * two widgets: title_image and seach_box, and then call into this virtual
     * function.
     *
     * The title_image is a GtkImage, and the search_box is a GtkEntry all
     * connectified for homePage search signals. They can be packed into this
     * widget along with any other widgetry for the subclass in this function.
     */
    pack_widgets: function (title_image, search_box) {
        this.attach(title_image, 0, 0, 3, 1);
        this.attach(search_box, 0, 1, 3, 1);
    },

    /**
     * Method: pack_cards
     *
     * A virtual function to be overridden in subclasses. This will be called,
     * whenever the card list changes with a new list of cards to be packed in
     * the widget
     */
    pack_cards: function (cards) {
        // no-op
    },

    set cards (v) {
        if (this._cards === v)
            return;
        this._cards = v;
        if (this._cards === null) {
            this.pack_cards([]);
        } else {
            this.pack_cards(this._cards);
        }
    },

    get cards () {
        return this._cards;
    },

    _on_search_entered: function (widget) {
        this.emit('search-entered', widget.text);
    },
});
