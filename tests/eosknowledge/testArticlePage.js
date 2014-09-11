const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;
const InstanceOfMatcher = imports.InstanceOfMatcher;
const WidgetDescendantMatcher = imports.WidgetDescendantMatcher;

describe('Article Page A', function () {
    let page, article_a, article_b;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        page = new EosKnowledge.ArticlePage();
        article_a = new Gtk.Label();
        article_b = new Gtk.Label();
    });

    it('can be constructed', function () {
        expect(page).toBeDefined();
    });

    it('instantiates a table of contents widget', function () {
        expect(page.toc).toBeA(EosKnowledge.TableOfContents);
    });

    it('transitions in new content views', function () {
        page.switch_in_content_view(article_a, EosKnowledge.LoadingAnimation.NONE);
        expect(page).toHaveDescendant(article_a);
        page.switch_in_content_view(article_b, EosKnowledge.LoadingAnimation.NONE);
        expect(page).toHaveDescendant(article_b);
    });

    it('calls new-view-transitioned after a new content view is added', function () {
        let new_view = jasmine.createSpy('new-view');
        page.connect('new-view-transitioned', function () {
            new_view();
        });
        page.switch_in_content_view(article_a, EosKnowledge.LoadingAnimation.NONE);
        expect(new_view).toHaveBeenCalled();
    });

    describe('Style class of article page A', function () {
        it('has article page class', function () {
            expect(page).toHaveCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE);
        });
        it('has a descendant with title class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        });
        it('has a descendant with toolbar frame class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TOOLBAR_FRAME);
        });
        it('has a descendant with switcher frame class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_SWITCHER_FRAME);
        });
        it('has a table of contents with collapsed class when narrow', function () {
            let alloc = page.get_allocation();
            alloc.width = 1;
            alloc.height = 9999;
            page.size_allocate(alloc);
            expect(page.toc).toHaveCssClass(EosKnowledge.STYLE_CLASS_COLLAPSED);
            alloc.width = 9999;
            alloc.height = 9999;
            page.size_allocate(alloc);
            expect(page.toc).not.toHaveCssClass(EosKnowledge.STYLE_CLASS_COLLAPSED);
        });
    });
});
