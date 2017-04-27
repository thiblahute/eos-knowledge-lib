// Copyright 2016 Endless Mobile, Inc.

/* exported SideBySide */

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const MENU_HEIGHT = 50;
const SPACING_MIN = 15;
const SPACING_MAX = 50;

const _SideBySideLayout = new Knowledge.Class({
    Name: 'Arrangement.SideBySideLayout',
    Extends: Gtk.Box,

    _init: function (props={}) {
        this.all_visible = true;
        props.orientation = Gtk.Orientation.HORIZONTAL;

        this.parent(props);

        /* Button to trigger dropdown */
        this._popover_button = new Gtk.Button({ label: " ⁝ " });
        Utils.set_hand_cursor_on_widget(this._popover_button);
        this.pack_end(this._popover_button, false, false, 0);

        let label = this._popover_button.get_child();
        label.valign = Gtk.Align.CENTER;

        /* Used for dropdown menu if cards do not fix */
        this._popover = new Gtk.Popover({
            position: Gtk.PositionType.BOTTOM,
            relative_to: label,
        });
        this._popover_button.connect("clicked", () => {
            this._popover.popup();
        });

        /* Classes needed for cards to have the same style */
        let context = this._popover.get_style_context();
        context.add_class('ArrangementSideBySide__popover');
        context.add_class('ArrangementSideBySide');
        context.add_class('Arrangement');

        /* Dropdown contents */
        let scroll = new Gtk.ScrolledWindow ({
            vscrollbar_policy: Gtk.PolicyType.NEVER,
            propagate_natural_width: true,
        });
        this._popover_box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        scroll.add(this._popover_box);
        this._popover.add(scroll);
        this._popover_box.show();
        scroll.show();
    },

    vfunc_get_preferred_height: function () {
        if (this.get_parent().get_cards().length === 0)
            return [0, 0];

        return [MENU_HEIGHT, MENU_HEIGHT];
    },

    vfunc_get_preferred_width: function () {
        let all_cards = this.get_parent().get_cards();
        if (all_cards.length === 0)
            return [0, 0];

        let [, first_nat] = all_cards[0].get_preferred_width();
        let [, button_nat] = this._popover_button.get_preferred_width();

        let min = first_nat + SPACING_MIN + button_nat;
        let nat = 0;

        all_cards.forEach ((card) => {
            let [, card_nat] = card.get_preferred_width();
            nat += card_nat + SPACING_MAX;
        });

        return [min, nat - SPACING_MAX];
    },

    _ensure_card_parent: function (card, parent) {
        let current_parent = card.get_parent();

        if (current_parent != parent) {
            current_parent.remove(card);
            parent.add(card);
            card.show();
        }
    },

    vfunc_size_allocate: function (alloc) {
        let all_cards = this.get_parent().get_cards();

        this.all_visible = true;

        if (all_cards.length === 0)
            return;

        let [, button_nat] = this._popover_button.get_preferred_width();
        let width = alloc.width;
        let cards_width = 0;
        let spacing = button_nat + SPACING_MIN;

        all_cards.forEach ((card) => {
            let [, card_nat] = card.get_preferred_width();

            cards_width += card_nat;

            if (this.all_visible && width >= cards_width + spacing)
                this._ensure_card_parent(card, this);
            else  {
                this._ensure_card_parent(card, this._popover_box);
                this.all_visible = false;
            }

            spacing += SPACING_MIN;
        });

        /* Set proper spacing */
        if (this.all_visible) {
            let leftover = (width - cards_width) / (all_cards.length - 1);
            this.spacing = Math.min(leftover, SPACING_MAX);
            this._popover_button.hide();
        }
        else {
            this.spacing = SPACING_MIN;
            this._popover_button.show();
        }

        /* Do the actual allocation */
        this.parent(alloc);
    },

});

/**
 * Class: SideBySide
 * Arrangement to be used in horizontal menus
 *
 * This arrangement presents cards in a horizontal layout, and is intended to
 * display menu items.
 */
const SideBySide = new Module.Class({
    Name: 'Arrangement.SideBySide',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this._layout = new _SideBySideLayout({
            visible: true,
            expand: true,
        });
        this.parent(props);

        this.add(this._layout);
    },

    // Arrangement override
    pack_card: function (card) {
        this._layout.add(card);
    },

    // Arrangement override
    unpack_card: function (card) {
        this._layout.remove(card);
    },

    get all_visible() {
        return this._layout.all_visible;
    },
});
