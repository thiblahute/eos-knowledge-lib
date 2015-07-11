// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MinimalCard = imports.tests.minimalCard;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Card interface', function () {
    let card, model;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        model = new ArticleObjectModel.ArticleObjectModel({
            title: 'record title',
            thumbnail_uri: 'about:blank',
            authors: ['record author'],
            synopsis: 'record synopsis',
        });
        card = new MinimalCard.MinimalCard({
            model: model,
        });
    });

    it('adds the "invisible" and "fade-in" style classes while fading', function (done) {
        card.FADE_IN_TIME_MS = 20;
        Mainloop.timeout_add(10, () => {
            expect(card).toHaveCssClass(StyleClasses.INVISIBLE);
            expect(card).toHaveCssClass(StyleClasses.FADE_IN);
            return GLib.SOURCE_REMOVE;
        });
        Mainloop.timeout_add(25, () => {
            expect(card).not.toHaveCssClass(StyleClasses.INVISIBLE);
            expect(card).not.toHaveCssClass(StyleClasses.FADE_IN);
            done();
            return GLib.SOURCE_REMOVE;
        });
        card.fade_in();
        Utils.update_gui();
    });

    it('is insensitive while fading', function (done) {
        card.FADE_IN_TIME_MS = 20;
        Mainloop.timeout_add(10, () => {
            expect(card.sensitive).toBeFalsy();
            return GLib.SOURCE_REMOVE;
        });
        Mainloop.timeout_add(25, () => {
            expect(card.sensitive).toBeTruthy();
            done();
            return GLib.SOURCE_REMOVE;
        });
        card.fade_in();
        Utils.update_gui();
    });

    it('sets a title label visible if model has a title', function () {
        let label = new Gtk.Label();
        card.set_title_label_from_model(label);
        expect(label.visible).toBeTruthy();
    });

    it('sets a author label visible if model has authors', function () {
        let label = new Gtk.Label();
        card.set_author_label_from_model(label);
        expect(label.visible).toBeTruthy();
    });

    it('sets a thumbnail frame visible if model has a thumbnail uri', function () {
        let frame = new Gtk.Frame();
        card.set_thumbnail_frame_from_model(frame);
        expect(frame.visible).toBeTruthy();
    });

    it('sets a synopsis label visible if model has a synopsis', function () {
        let label = new Gtk.Label();
        card.set_synopsis_label_from_model(label);
        expect(label.visible).toBeTruthy();
    });

    // FIXME: no way to verify this.
    it('displays the record thumbnail in the thumbnail frame');
});
