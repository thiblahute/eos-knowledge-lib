const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const System = imports.system;

const ArticleCard = imports.articleCard;
const ArticlePresenter = imports.articlePresenter;
const CardA = imports.cardA;
const CardB = imports.cardB;
const Engine = imports.engine;
const Window = imports.window;

/**
 * Class: Presenter
 *
 * A presenter module to manage this application. It initializes an application
 * from a JSON file. It will set up the <Card> widgets on the home page
 * and connect to signal events on those card widgets
 *
 * It has one property, which is the window, representing the top level view
 * of the application.
 *
 */
const Presenter = new Lang.Class({
    Name: 'Presenter',
    GTypeName: 'EknPresenter',
    Extends: GObject.Object,

    _init: function (app, app_filename, props) {
        this.parent(props);

        let app_content = this._parse_object_from_path(app_filename);
        this._template_type = app_content['templateType'];
        this.view = new Window.Window({
            application: app,
            template_type: this._template_type
        });

        try {
            this._setAppContent(app_content);
        } catch(e) {
            printerr(e);
            printerr(e.stack);
            System.exit(1);
        }

        this._engine = new Engine.Engine();

        this._article_presenter = new ArticlePresenter.ArticlePresenter({
            article_view: this.view.article_page,
            engine: this._engine
        });

        // Connect signals
        this.view.connect('back-clicked', this._on_back.bind(this));
        this.view.connect('forward-clicked', function (view) {
            view.show_article_page();
        });
        this.view.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.connect('search-entered', this._on_search.bind(this));
        this.view.connect('article-selected', this._on_article_selection.bind(this));

        this.view.connect('sidebar-back-clicked', this._on_back.bind(this));
        this.view.connect('lightbox-nav-previous-clicked', this._on_lightbox_previous_clicked.bind(this));
        this.view.connect('lightbox-nav-next-clicked', this._on_lightbox_next_clicked.bind(this));

        this.view.home_page.connect('search-entered', this._on_search.bind(this));
        this.view.home_page.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.home_page.connect('article-selected', this._on_article_selection.bind(this));

        this.view.home_page.connect('show-categories', this._on_categories_button_clicked.bind(this));
        this._article_presenter.connect('media-object-clicked', this._on_media_object_clicked.bind(this));
        this.view.categories_page.connect('show-home', this._on_home_button_clicked.bind(this));
        this._original_page = this.view.home_page;
        this._search_origin_page = this.view.home_page;
    },

    _setAppContent: function(data) {
        this._domain = data['appId'].split('.').pop();
        this.view.home_page.title_image_uri = data['titleImageURI'];
        this.view.background_image_uri = data['backgroundHomeURI'];
        this.view.blur_background_image_uri = data['backgroundSectionURI'];
        for (let page of [this.view.home_page, this.view.categories_page]) {
            let category_cards = data['sections'].map(function (section) {
                let card = new CardA.CardA({
                    title: section['title'],
                    thumbnail_uri: section['thumbnailURI']
                });
                card.connect('clicked', this._on_section_card_clicked.bind(this, section['tags']));
                return card;
            }.bind(this));
            page.cards = category_cards;
        }
    },

    _parse_object_from_path: function (path) {
        let file = Gio.file_new_for_uri(path);
        let [success, data] = file.load_contents(null);
        return JSON.parse(data);
    },

    _on_categories_button_clicked: function (button) {
        this._original_page = this.view.categories_page;
        this.view.show_categories_page();
    },

    _on_home_button_clicked: function (button) {
        this._original_page = this.view.home_page;
        this.view.show_home_page();
    },

    _on_section_card_clicked: function (tags, card) {
        this._engine.get_objects_by_query(this._domain, {
            'tag': tags
        }, this._load_section_page.bind(this));
        this.view.section_page.title = card.title;
    },

    _on_search: function (view, query) {
        this._engine.get_objects_by_query(this._domain, {
            'q': query
        }, this._load_section_page.bind(this));
        this.view.section_page.title = "Results for " + query;
    },

    _on_search_text_changed: function (view, entry) {
        this._engine.get_objects_by_query(this._domain, {
            'prefix': entry.text
        }, function (err, results) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
            } else {
                entry.set_menu_items(results.map(function (obj) {
                    return {
                        title: obj.title,
                        id: obj.ekn_id
                    };
                }));
            }
        });
    },

    _on_article_selection: function (view, id) {
        if (view === this.view.home_page) {
            this._search_origin_page = this.view.home_page;
        } else {
            this._search_origin_page = this.view.section_page;
        }
        let database_id = id.split('/').pop();
        this._engine.get_object_by_id(this._domain, database_id, Lang.bind(this, function (err, model) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
            } else {
                this._article_presenter.article_model = model;
                this.view.show_article_page();
            }
        }));
    },

    _on_article_card_clicked: function (card, model) {
        this._article_presenter.article_model = model;
        this.view.show_article_page();
    },

    _on_media_object_clicked: function (media_object, is_resource) {
        this._preview_media_object(media_object, is_resource);
    },

    _on_lightbox_previous_clicked: function (view, media_object) {
        let resources = this._article_presenter.article_model.get_resources();
        let current_index = this._get_position_in_resources(media_object.ekn_id, resources);
        if (current_index > 0) {
            // If it equals 0, it's the first resource, can't go to previous
            this._preview_media_object(resources[current_index - 1]);
        }
    },

    _on_lightbox_next_clicked: function (view, media_object) {
        let resources = this._article_presenter.article_model.get_resources();
        let current_index = this._get_position_in_resources(media_object.ekn_id, resources);
        if (current_index >= 0 && current_index < resources.length - 1) {
            // If it equals resources.length - 1, it's the last resource, can't go to next
            this._preview_media_object(resources[current_index - 1]);
        }
    },

    _get_position_in_resources: function (article_model_id, resources) {
        let resource_ids = resources.map(function (model) {
            return model.ekn_id;
        });
        return resource_ids.indexOf(article_model_id);
    },

    _on_back: function () {
        let visible_page = this.view.get_visible_page();
        if (visible_page === this.view.article_page) {
            if (this._search_origin_page === this.view.home_page) {
                this.view.show_home_page();
            } else {
                this.view.show_section_page();
            }
        } else if (visible_page === this.view.section_page) {
            if (this._original_page === this.view.home_page){
                this.view.show_home_page();
            } else if (this._original_page === this.view.categories_page) {
                this.view.show_categories_page();
            }
        } else {
            // Do nothing
        }
    },

    _load_section_page: function (err, results) {
        if (typeof err !== 'undefined') {
            printerr(err);
            printerr(err.stack);
        }
        let cards = results.map(this._new_card_from_article_model.bind(this));
        let segments = {
            'Articles': cards
        };
        this._search_origin_page = this.view.section_page;
        this.view.section_page.segments = segments;
        this.view.show_section_page();
    },

    _new_card_from_article_model: function (model) {
        let card = new ArticleCard.ArticleCard({
            title: model.title,
            synopsis: model.synopsis
        });
        card.connect('clicked', function () {
            this._on_article_card_clicked(card, model);
        }.bind(this));
        return card;
    },

    _preview_media_object: function (media_object, is_resource) {
        let previewer = new EosKnowledge.Previewer({
            visible: true
        });
        let infobox = EosKnowledge.MediaInfobox.new_from_ekn_model(media_object);

        previewer.file = Gio.File.new_for_path(media_object.content_uri);
        this.view.lightbox.media_object = media_object;
        this.view.lightbox.infobox_widget = infobox;
        this.view.lightbox.content_widget = previewer;
        this.view.lightbox.reveal_overlays = true;
        this.view.lightbox.has_navigation_buttons = is_resource;
    }
});
