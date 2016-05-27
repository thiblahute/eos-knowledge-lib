// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const HamburgerBasement = imports.app.modules.layout.hamburgerBasement;
const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.HamburgerBasement', function () {
    let home_page, factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('Placeholder1', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder2', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder3', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder4', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('home-page-template', HamburgerBasement.HamburgerBasement,
        {
            'top': 'Placeholder1',
            'middle': 'Placeholder2',
            'bottom': 'Placeholder3',
            'basement': 'Placeholder4',
        });
        home_page = factory.create_named_module('home-page-template');
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let top = factory.get_created_named_mocks('Placeholder1')[0];
        expect(home_page).toHaveDescendant(top);
        let middle = factory.get_created_named_mocks('Placeholder2')[0];
        expect(home_page).toHaveDescendant(middle);
        let bottom = factory.get_created_named_mocks('Placeholder3')[0];
        expect(home_page).toHaveDescendant(bottom);
        let basement = factory.get_created_named_mocks('Placeholder4')[0];
        expect(home_page).toHaveDescendant(basement);
    });

    it('has a tab button', function () {
        expect(home_page).toHaveDescendantWithClass(Gtk.Button);
    });

    describe('CSS style context', function () {
        it('has home page A template class', function () {
            expect(home_page).toHaveCssClass('hamburger-basement-template');
        });

        it('has tab button class', function () {
            expect(home_page).toHaveDescendantWithCssClass('tab-button');
        });
    });
});
