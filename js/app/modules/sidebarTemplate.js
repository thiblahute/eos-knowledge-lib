// Copyright 2015 Endless Mobile, Inc.

/* exported SidebarTemplate, get_css_for_module */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

const _FixedWidthFrame = new Lang.Class({
    Name: 'FixedWidthFrame',
    GTypeName: 'EknFixedWidthFrame',
    Extends: Gtk.Frame,

    vfunc_get_preferred_width: function () {
        return [this.width, this.width];
    },
});

const _MaxWidthFrame = new Lang.Class({
    Name: 'MaxWidthFrame',
    GTypeName: 'EknMaxWidthFrame',
    Extends: Gtk.Frame,

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        let [min, nat] = this.parent();
        return [Math.min(min, this.width), Math.min(nat, this.width)];
    },
});

/**
 * Class: SidebarTemplate
 * Template with a sidebar and content area
 *
 * The <sidebar-width> property controls the width of the sidebar slot, and the
 * <fixed> property controls whether this is a fixed or a maximum width.
 *
 * Slots:
 *   sidebar
 *   content
 *
 * CSS Styles:
 *   sidebar-template - on the template
 *   sidebar - a frame containing the sidebar module
 *   content - a frame containing the content module
 */
const SidebarTemplate = new Lang.Class({
    Name: 'SidebarTemplate',
    GTypeName: 'EknSidebarTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        /**
         * Property: sidebar-width
         * Sidebar width.
         */
        'sidebar-width': GObject.ParamSpec.int('sidebar-width',
            'sidebar width', 'Preferred natural width for widget',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            1, GLib.MAXINT32, 400),

        /**
         * Property: fixed
         * True if the <sidebar-width> is a fixed width, false if a maximum.
         *
         * Default:
         *   true
         */
        'fixed': GObject.ParamSpec.boolean('fixed', 'Fixed',
            'Whether the width is a fixed width or maximum width',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),

        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.HORIZONTAL;
        props.expand = true;
        this.parent(props);

        let content_frame = new Gtk.Frame({
            expand: true,
        });
        let SidebarFrameClass = this.fixed ? _FixedWidthFrame : _MaxWidthFrame;
        let sidebar_frame = new SidebarFrameClass({
            expand: false,
        });
        sidebar_frame.width = this.sidebar_width;

        let sidebar = this.create_submodule('sidebar');
        let content = this.create_submodule('content', {
            valign: Gtk.Align.END,
        });

        // FIXME: These should not be optional for now
        if (content)
            content_frame.add(content);
        if (sidebar)
            sidebar_frame.add(sidebar);
        this.add(content_frame);
        this.add(sidebar_frame);

        this.get_style_context().add_class(StyleClasses.SIDEBAR_TEMPLATE);
        content_frame.get_style_context().add_class(StyleClasses.CONTENT);
        sidebar_frame.get_style_context().add_class(StyleClasses.SIDEBAR);

        // FIXME: These should be private, but for now OverviewPage still needs
        // to reach in here.
        this.content_frame = content_frame;
        this.sidebar_frame = sidebar_frame;
    },

    get_slot_names: function () {
        return [ 'sidebar', 'content' ];
    },
});

function get_css_for_module(css_data) {
    let module_data = Utils.get_css_for_submodule('module', css_data);
    return Utils.object_to_css_string(module_data, '.' + StyleClasses.SIDEBAR);
}
