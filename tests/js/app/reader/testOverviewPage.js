const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleSnippetCard = imports.app.modules.articleSnippetCard;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const OverviewPage = imports.app.reader.overviewPage;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Overview page widget', function () {
    let page;
    let snippets;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        snippets = [
            {
                title: 'Title 1',
                synopsis: 'Secrets on how to cook frango',
            },
            {
                title: 'Title 2',
                synopsis: 'Tricks to learning to speak portuguese',
            }
        ]
        .map((props) => new ContentObjectModel.ContentObjectModel(props))
        .map((model, ix) =>
            new ArticleSnippetCard.ArticleSnippetCard({
                model: model,
                style_variant: ix % 3,
            }));
        page = new OverviewPage.OverviewPage();
    });

    it('constructs', function () {});

    it('can set article snippets', function () {
        page.set_article_snippets(snippets);
        expect(page).toHaveDescendantWithCssClass(StyleClasses.READER_ARTICLE_SNIPPET);
    });

    it('has the overview-page CSS class', function () {
        expect(page).toHaveCssClass(StyleClasses.READER_OVERVIEW_PAGE);
    });

    it('sets the style variant class on article snippets', function () {
        page.set_article_snippets(snippets);
        expect(page).toHaveDescendantWithCssClass('snippet0');
        expect(page).toHaveDescendantWithCssClass('snippet1');
    });

    it('does not set a style variant class for style variant -1', function () {
        page.set_article_snippets([
            new ArticleSnippetCard.ArticleSnippetCard({
                model: new ContentObjectModel.ContentObjectModel({
                    title: 'Frango',
                    synopsis: 'Frango tikka masala, yum',
                }),
                style_variant: -1,
            })
        ]);
        expect(page).not.toHaveDescendantWithCssClass('snippet-1');
        expect(page).not.toHaveDescendantWithCssClass('snippet0');
    });

    it('uses 0 as the default style variant', function () {
        page.set_article_snippets([
            new ArticleSnippetCard.ArticleSnippetCard({
                model: new ContentObjectModel.ContentObjectModel({
                    title: 'Frango',
                    synopsis: 'Frango tikka masala, yum',
                }),
            })
        ]);
        expect(page).toHaveDescendantWithCssClass('snippet0');
    });
});
