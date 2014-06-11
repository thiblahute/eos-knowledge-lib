const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const WebKit2 = imports.gi.WebKit2;

EosKnowledge.init();

const TESTDIR = Endless.getCurrentFileDir() + '/..';
const MOCK_ARTICLE_PATH = TESTDIR + '/test-content/cyprus.jsonld';

describe('Article Presenter', function () {
    let presenter;
    let view;
    let mockArticleData;
    let articleObject;
    let engine;
    let webview;

    beforeEach(function () {

        let file = Gio.file_new_for_path(MOCK_ARTICLE_PATH);

        let [success, data] = file.load_contents(null);
        mockArticleData = JSON.parse(data);

        articleObject = new EosKnowledge.ArticleObjectModel.new_from_json_ld(mockArticleData);

        view = new EosKnowledge.ArticlePageA();
        view.switcher.connect('create-webview', function () {
            webview = new WebKit2.WebView();
            return webview;
        });

        engine = new EosKnowledge.Engine();

        presenter = new EosKnowledge.ArticlePresenter({
            article_view: view,
            engine: engine
        });
        presenter.article_model = articleObject;

    });

    it('can be constructed', function () {});

    it('can set title and subtitle on view', function () {
        expect(view.title).toBe(articleObject.title);

    });

    it('can set toc section list', function () {
        let labels = [];
        for (let obj of mockArticleData['tableOfContents']) {
            if (!('hasParent' in obj)) {
                labels.push(obj['hasLabel']);
            }
        }
        expect(view.toc.section_list).toEqual(labels);
    });

    xit('emits signal when webview navigates to media object', function (done) {
        let redirect_page = '<html><head><meta http-equiv="refresh" content="0;url=media://my_media_url.jpg"></head><body></body></html>';
        presenter.connect('media-object-clicked', function (widget, media_object_id) {
            expect(media_object_id).toEqual('my_media_url.jpg');
            done();
        }.bind());
        webview.load_html(redirect_page, null);
    });
});
