// Copyright 2016 Endless Mobile, Inc.

/* exported SupplementaryArticlesModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Class: SupplementaryArticlesModule
 * A module that displays all unread articles as cards in an arrangement. If no
 * unread articles are available it will show read articles with the same criteria.
 *
 * Slots:
 *   arrangement
 *   card-type
 */
const SupplementaryArticlesModule = new Lang.Class({
    Name: 'SupplementaryArticlesModule',
    GTypeName: 'EknSupplementaryArticlesModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: same-set
         *
         * Whether to show articles from the same set or from different sets.
         */
        'same-set':  GObject.ParamSpec.boolean('same-set', 'Show articles from same set',
            'Whether to show articles in the same set',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/supplementaryArticlesModule.ui',

    _init: function (props={}) {
        this.parent(props);
        this._arrangement = this.create_submodule('arrangement');
        this.attach(this._arrangement, 0, 1, 2, 1);

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_SUPPLEMENTARY_ARTICLES:
                    this._arrangement.clear();
                    break;
                case Actions.APPEND_SUPPLEMENTARY_ARTICLES:
                    if (payload.same_set !== this.same_set)
                        return;

                    // If we asked for unread articles and didn't get any
                    // try now asking for _read_ articles with the same
                    // criteria
                    if (payload.need_unread && payload.models.length === 0) {
                        dispatcher.dispatch({
                            action_type: Actions.NEED_MORE_SUPPLEMENTARY_ARTICLES,
                            same_set: this.same_set,
                            set_tags: payload.set_tags,
                            need_unread: false,
                        });
                    }
                    payload.models.forEach(this._add_card, this);
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'card-type'];
    },

    _add_card: function (model) {
        let card = this.create_submodule('card-type', {
            model: model,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: this._arrangement.get_cards().map((card) => card.model),
            });
        });
        this._arrangement.add_card(card);
    },
});