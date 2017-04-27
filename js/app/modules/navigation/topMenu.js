// Copyright 2016 Endless Mobile, Inc.

/* exported TopMenu */

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

// FIXME: Should be responsive and change to 60 after a width threshold is crossed
const TOP_MENU_HEIGHT = 50;

/**
 * Class: TopMenu
 * Module that shows a banner and a top menu.
 *
 * This module shows two submodules: (1) a banner, typically a logo; (2) a horizontal
 * menu that includes all the options.
 *
 * When the module cannot accomodate both the banner and the menu, it hides the
 * banner.
 *
 * Implements:
 *   <Module>
 */
const TopMenu = new Module.Class({
    Name: 'Navigation.TopMenu',
    Extends: Gtk.Box,

    Slots: {
        /**
         * Slot: banner
         * Typically an image previewer to display the logo
         */
        'banner': {},
        /**
         * Slot: menu
         * Module that contains the horizontal menu
         */
        'menu': {},
    },

    _init: function (props={}) {

        props.hexpand = true;
        props.orientation = Gtk.Orientation.HORIZONTAL;
        props.spacing = props.spacing | 8;

        this.parent(props);

        this._banner = this.create_submodule('banner');
        this._menu = this.create_submodule('menu');

        this._banner.hexpand = false;
        this._banner.valign = Gtk.Align.CENTER;
        this._menu.hexpand = true;
        this._menu.halign = Gtk.Align.END;

        this.add(this._banner);
        this.add(this._menu);

        this.show_all();
    },

    vfunc_get_preferred_width: function () {
        let [, banner_nat] = this._banner.get_preferred_width();
        let [menu_min, menu_nat] = this._menu.get_preferred_width();
        return [menu_min, banner_nat + menu_nat];
    },

    vfunc_get_preferred_height: function () {
        let [, banner_nat] = this._banner.get_preferred_height();
        let [, menu_nat] = this._menu.get_preferred_height();
        let height = Math.max(banner_nat, menu_nat, TOP_MENU_HEIGHT);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        let [banner_min,] = this._banner.get_preferred_width();
        let [menu_min,] = this._menu.get_preferred_width();

        this._banner.visible = (alloc.width >= banner_min + menu_min);

        this.parent(alloc);

        Utils.set_container_clip(this);
    },
});

