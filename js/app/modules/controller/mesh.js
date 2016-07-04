// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const Compat = imports.app.compat.compat;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Controller = imports.app.interfaces.controller;
const HistoryStore = imports.app.historyStore;
const MeshHistoryStore = imports.app.meshHistoryStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const QueryObject = imports.search.queryObject;
const TabButton = imports.app.widgets.tabButton;
const TitleCard = imports.app.modules.card.title;

const RESULTS_SIZE = 10;

/**
 * Class: Mesh
 *
 * The Mesh controller model controls the Encyclopedia and presets formerly
 * known as templates A and B.
 * A very exploratory controller, the content is organized into categories and
 * may have filters, but can be reached through many different paths.
 */
const Mesh = new Module.Class({
    Name: 'Controller.Mesh',
    Extends: GObject.Object,
    Implements: [Controller.Controller],

    // Overridable in tests. Brand page should be visible for 2 seconds. The
    // transition is currently hardcoded to a slow fade over 500 ms.
    BRAND_PAGE_TIME_MS: 1500,

    _init: function (props) {
        this._launched_once = false;

        this.parent(props);

        let history = new MeshHistoryStore.MeshHistoryStore();
        HistoryStore.set_default(history);

        this._window = this.create_submodule('window', {
            application: this.application,
            visible: false,
        });
        Compat.add_preset_style_classes(this._window, this.template_type);

        this.load_theme();

        this._current_set_id = null;
        this._current_search_query = '';
        this._set_cancellable = new Gio.Cancellable();
        this._search_cancellable = new Gio.Cancellable();
        this._brand_page_timeout_id = 0;
        this._home_content_loaded = false;

        this._window.connect('key-press-event', this._on_key_press_event.bind(this));
        history.connect('changed', this._on_history_change.bind(this));
    },

    make_ready: function (cb=function () {}) {
        this._window.make_ready(() => {
            this._home_content_loaded = true;
            this._show_home_if_ready();
            cb();
        });
    },

    _on_history_change: function () {
        let history = HistoryStore.get_default();
        let item = history.get_current_item();
        let dispatcher = Dispatcher.get_default();

        switch (item.page_type) {
            case Pages.SEARCH:
                this._update_search_results(item);
                dispatcher.dispatch({
                    action_type: Actions.SHOW_SEARCH_PAGE,
                });
                break;
            case Pages.SET:
                this._update_set_results(item, () => {
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SET_PAGE,
                    });
                });
                break;
            case Pages.ARTICLE:
                if (this.template_type === 'B')
                    this._update_article_list();
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ARTICLE_PAGE,
                });
                break;
            case Pages.HOME:
                if (history.get_items().length === 1) {
                    Dispatcher.get_default().dispatch({
                        action_type: Actions.SHOW_BRAND_PAGE,
                    });
                    this._brand_page_timeout_id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.BRAND_PAGE_TIME_MS, () => {
                        this._brand_page_timeout_id = 0;
                        this._show_home_if_ready();
                        return GLib.SOURCE_REMOVE;
                    });
                } else {
                    this._show_home_if_ready();
                }
                break;
        }
    },

    _show_home_if_ready: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (!item || item.page_type !== Pages.HOME)
            return;
        if (!this._home_content_loaded)
            return;
        if (this._brand_page_timeout_id)
            return;
        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_HOME_PAGE,
        });
    },

    _on_key_press_event: function (widget, event) {
        let keyval = event.get_keyval()[1];
        let state = event.get_state()[1];

        let dispatcher = Dispatcher.get_default();
        if (keyval === Gdk.KEY_Escape) {
            dispatcher.dispatch({
                action_type: Actions.HIDE_ARTICLE_SEARCH,
            });
        } else if (((state & Gdk.ModifierType.CONTROL_MASK) !== 0) &&
                    keyval === Gdk.KEY_f) {
            dispatcher.dispatch({
                action_type: Actions.SHOW_ARTICLE_SEARCH,
            });
        }
    },

    _update_article_list: function () {
        HistoryStore.get_default().search_backwards(0, (item) => {
            if (item.query) {
                this._update_search_results(item);
                return true;
            }
            if (item.page_type === Pages.SET) {
                this._update_set_results(item);
                return true;
            }
            return false;
        });
    },

    _update_search_results: function (item) {
        let query_obj = new QueryObject.QueryObject({
            query: item.query,
            limit: RESULTS_SIZE,
            tags_match_any: ['EknArticleObject'],
        });
        let dispatcher = Dispatcher.get_default();
        if (this._current_search_query === item.query) {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: item.query,
            });
            return;
        }
        this._current_search_query = item.query;

        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: item.query,
        });
        this._search_cancellable.cancel();
        this._search_cancellable.reset();
        this._more_search_results_query = null;
        Engine.get_default().get_objects_by_query(query_obj, this._search_cancellable, (engine, task) => {
            let results, info;
            try {
                [results, info] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                if (error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    return;
                logError(error);
                dispatcher.dispatch({
                    action_type: Actions.SEARCH_FAILED,
                    query: item.query,
                    error: new Error('Search failed for unknown reason'),
                });
                return;
            }
            this._more_search_results_query = info.more_results;

            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: item.query,
            });
        });
    },

    _update_set_results: function (item, callback=() => {}) {
        let query_obj = new QueryObject.QueryObject({
            tags_match_any: item.model.child_tags,
            limit: RESULTS_SIZE,
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        });

        let dispatcher = Dispatcher.get_default();
        if (this._current_set_id === item.model.ekn_id) {
            dispatcher.dispatch({
                action_type: Actions.SET_READY,
                model: item.model,
            });
            callback();
            return;
        }
        this._current_set_id = item.model.ekn_id;

        dispatcher.dispatch({
            action_type: Actions.SHOW_SET,
            model: item.model,
        });
        this._set_cancellable.cancel();
        this._set_cancellable.reset();
        this._more_set_results_query = null;
        Engine.get_default().get_objects_by_query(query_obj, this._set_cancellable, (engine, task) => {
            let results, info;
            try {
                [results, info] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                if (error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    return;
                logError(error);
                callback();
                return;
            }
            this._more_set_results_query = info.more_results;
            dispatcher.dispatch({
                action_type: Actions.SET_READY,
                model: item.model,
            });
            callback();
        });
    },
});
