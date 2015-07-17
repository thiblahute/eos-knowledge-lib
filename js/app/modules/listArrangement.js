// Copyright 2015 Endless Mobile, Inc.

/* exported ListArrangement */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const ListArrangement = new Lang.Class({
    Name: 'ListArrangement',
    GTypeName: 'EknListArrangement',
    Extends: Gtk.ScrolledWindow,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'count': GObject.ParamSpec.override('count', Arrangement.Arrangement),
        'factory': GObject.ParamSpec.override('factory', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/listArrangement.ui',
    InternalChildren: [ 'list_box' ],

    _init: function (props={}) {
        this.parent(props);
    },

    get count() {
        return this._list_box.get_children().length;
    },

    add_card: function (widget) {
        this._list_box.add(widget);
    },

    clear: function () {
        let children = this._list_box.get_children();
        children.forEach((child) => this._list_box.remove(child));
    },
});
