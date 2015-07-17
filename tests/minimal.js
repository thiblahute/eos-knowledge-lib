// Copyright 2015 Endless Mobile, Inc.

/* exported MinimalArrangement, MinimalCard, MinimalModule, MinimalDocumentCard */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const DocumentCard = imports.app.interfaces.documentCard;
const HomePage = imports.app.homePage;
const Module = imports.app.interfaces.module;

const MinimalArrangement = new Lang.Class({
    Name: 'MinimalArrangement',
    Extends: Gtk.Widget,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'count': GObject.ParamSpec.override('count', Arrangement.Arrangement),
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
        this._count = 0;
    },

    get count() {
        return this._count;
    },

    add_card: function () {
        this._count++;
    },

    clear: function () {
        this._count = 0;
    },
});

const MinimalCard = new Lang.Class({
    Name: 'MinimalCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
    }
});

const MinimalHomePage = new Lang.Class({
    Name: 'MinimalHomePage',
    Extends: GObject.Object,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'search-box': GObject.ParamSpec.override('search-box',
            HomePage.HomePage),
    },

    _init: function (props={}) {
        this.parent(props);
    },
});

const MinimalModule = new Lang.Class({
    Name: 'MinimalModule',
    Extends: GObject.Object,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },
});

const MinimalDocumentCard = new Lang.Class({
    Name: 'MinimalDocumentCard',
    Extends: Gtk.Widget,
    Implements: [ Module.Module, Card.Card, DocumentCard.DocumentCard ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'content-view': GObject.ParamSpec.override('content-view', DocumentCard.DocumentCard),
        'info-notice': GObject.ParamSpec.object('info-notice', 'Info notice',
            '', GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE,
            Gtk.Widget),
        'show-toc': GObject.ParamSpec.boolean('show-toc', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
        'show-top-title': GObject.ParamSpec.boolean('show-top-title', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            true),
    },

    _init: function (props={}) {
        props.info_notice = props.info_notice || new Gtk.Label();
        this.parent(props);
        this.toc = {
            connect: function () {},
        };
    },
});
