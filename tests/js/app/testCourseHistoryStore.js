const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const ArticleObjectModel = imports.search.articleObjectModel;
const CourseHistoryStore = imports.app.courseHistoryStore;
const MediaObjectModel = imports.search.mediaObjectModel;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const Pages = imports.app.pages;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;

describe('CourseHistoryStore', function () {
    let store, dispatcher, engine, reading_history;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();
        engine = MockEngine.mock_default();
        store = new CourseHistoryStore.CourseHistoryStore();
        store.set_current_item_from_props({ page_type: Pages.HOME });
        spyOn(AppUtils, 'record_search_metric');
        let data = [
            {
                ekn_id: '1',
                title: 'Foo',
                child_tags: ['foo'],
            },
            {
                ekn_id: '2',
                title: 'Bar',
                child_tags: ['bar'],
            },
        ];
        let sets = data.map((obj) => new SetObjectModel.SetObjectModel(obj));
        engine.get_objects_by_query_finish.and.returnValue([sets, {
            more_results: null,
        }]);
        SetMap.init_map_with_models(sets);
    });

    it('goes back to the home page when home button is clicked', function () {
        dispatcher.dispatch({
            action_type: Actions.HOME_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.HOME);
    });

    it('goes to the home page when launched from desktop', function () {
        dispatcher.dispatch({
            action_type: Actions.LAUNCHED_FROM_DESKTOP,
        });
        expect(store.get_current_item().page_type).toBe(Pages.HOME);
    });

    it('shows the set page when a set model is clicked', function () {
        let model = new SetObjectModel.SetObjectModel({
            ekn_id: 'ekn://foo/set',
        });
        dispatcher.dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: model,
        });
        expect(store.get_current_item().page_type).toBe(Pages.SET);
    });

    it('updates current-subset when a subset model is clicked', function () {
        spyOn(store, 'set_current_subset');
        let model = new SetObjectModel.SetObjectModel({
            ekn_id: 'ekn://foo/set',
            tags: ['foo'],
        });
        dispatcher.dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: model,
        });
        expect(store.set_current_subset).toHaveBeenCalled();
    });

    function test_close_lightbox (action, descriptor) {
        it('closes the lightbox when ' + descriptor, function () {
            let model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
            let media_model = new MediaObjectModel.MediaObjectModel({
                ekn_id: 'ekn://foo/pix',
            });
            store.set_current_item_from_props({
                page_type: Pages.ARTICLE,
                model: model,
                media_model: media_model,
            });
            dispatcher.dispatch({
                action_type: action,
            });
            expect(store.get_current_item().media_model).toBeNull();
        });
    }
    test_close_lightbox(Actions.LIGHTBOX_CLOSED, 'lightbox close clicked');
    test_close_lightbox(Actions.SEARCH_BOX_FOCUSED, 'search box focused');

    describe('when an article card is clicked', function () {
        let prev_model, next_model, model;
        beforeEach(function () {
            model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://test/article',
            });
            prev_model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://test/prev',
            });
            next_model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://test/next',
            });

            dispatcher.dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: [prev_model, model, next_model],
                context_label: 'Some Context',
            });
        });

        it('shows it in lightbox', function () {
            expect(store.get_current_item().media_model).toBe(model);
        });
    });

    describe('when desktop search result opened', function () {
        let model;

        beforeEach(function () {
            model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn:///foo',
            });
            engine.get_object_by_id_finish.and.returnValue(model);
            dispatcher.dispatch({
                action_type: Actions.DBUS_LOAD_ITEM_CALLED,
                query: 'foo',
                ekn_id: 'ekn:///foo',
            });
        });

        it('loads an item', function () {
            expect(engine.get_object_by_id).toHaveBeenCalled();
            expect(engine.get_object_by_id.calls.mostRecent().args[0])
                .toBe('ekn:///foo');
        });

        it('goes to the article page', function () {
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });
    });
});
