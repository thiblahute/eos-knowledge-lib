const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Post = imports.app.modules.card.post;

Gtk.init(null);

describe('Card.Post', function () {
    let card;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        card = new Post.Post({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
            }),
        });
    });

    it('has the correct style classes', function () {
        expect(card).toHaveCssClass('post-card');
        expect(card).toHaveDescendantWithCssClass('content-frame');
        expect(card).toHaveDescendantWithCssClass('title');
        expect(card).toHaveDescendantWithCssClass('thumbnail');
    });

    it('has labels that understand Pango markup', function () {
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
    });
});
