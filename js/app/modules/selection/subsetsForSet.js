/* exported SubsetsForSet */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const SetMap = imports.app.setMap;
const Xapian = imports.app.modules.selection.xapian;

/**
 * Class: SubsetsForSet
 */
const SubsetsForSet = new Module.Class({
    Name: 'Selection.SubsetsForSet',
    Extends: Xapian.Xapian,
    Properties: {
        /**
         * Property: track-subset
         * Whether this content group should track changes in subset as
         * opposed to top level set.
         */
        'track-subset': GObject.ParamSpec.boolean('track-subset',
            'Track subset', 'Only refresh when subset changes',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
        /**
         * Property: track-parent
         * Whether this selection should track changes in parent of the current
         * set. This is useful when we have a page showing both content from
         * the current set and also a navigation panel showing the siblings
         * of the current set.
         */
        'track-parent': GObject.ParamSpec.boolean('track-parent',
            'Track parent', 'Only refresh when parent changes',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}) {
        this.parent(props);
        if (this.global) {
            let property_name = 'current-set';
            if (this.track_subset) {
                property_name = 'current-subset';
            }
            this.model = this._get_model(property_name);
            HistoryStore.get_default().connect('notify::' + property_name, () => {
                let model = this._get_model(property_name);
                if (!model || (this.model && model.ekn_id === this.model.ekn_id))
                    return;
                this.model = model;
                this._set_needs_refresh(true);
            });
        }
        this._set_needs_refresh(true);
    },

    _get_model: function (property_name) {
        let model = HistoryStore.get_default()[property_name.replace('-', '_', 'g')];
        if (model && this.track_parent)
            model = SetMap.get_parent_set(model);
        return model;
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        if (!this.model)
            return null;

        return Eknc.QueryObject.new_from_props({
            limit: limit,
            tags_match_any: this.model.child_tags,
            tags_match_all: ['EknSetObject'],
            sort: Eknc.QueryObjectSort.SEQUENCE_NUMBER,
        });
    },
});
