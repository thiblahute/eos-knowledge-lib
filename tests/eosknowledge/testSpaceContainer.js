const Cairo = imports.gi.cairo;  // note GI module, not native module
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const TEST_WINDOW_SIZE = 300;

// Colored box with a fixed size request of a particular size.
const IncompressibleBox = new Lang.Class({
    Name: 'IncompressibleBox',
    Extends: Gtk.Frame,
    _init: function (size, props={}) {
        if (!props.hasOwnProperty('valign'))
            props['valign'] = Gtk.Align.START;
        if (!props.hasOwnProperty('halign'))
            props['halign'] = Gtk.Align.START;
        this.parent(props);
        this.size = size;
    },

    vfunc_get_preferred_width: function () {
        return [this.size, this.size];
    },

    vfunc_get_preferred_height: function () {
        return [this.size, this.size];
    }
});

// Colored box with a natural request of a particular size. It can be compressed
// by up to half of its natural request in either direction.
const CompressibleBox = new Lang.Class({
    Name: 'CompressibleBox',
    Extends: IncompressibleBox,

    vfunc_get_preferred_width: function () {
        return [this.size / 2, this.size];
    },

    vfunc_get_preferred_height: function () {
        return [this.size / 2, this.size];
    },
});

function update_gui() {
    while (Gtk.events_pending())
        Gtk.main_iteration(false);
}

describe('Space container', function () {
    let win;

    beforeEach(function () {
        win = new Gtk.OffscreenWindow();
        win.set_size_request(TEST_WINDOW_SIZE, TEST_WINDOW_SIZE);
    });

    afterEach(function () {
        win.destroy();
    });

    it('constructs', function () {
        let container = new EosKnowledge.SpaceContainer();
    });

    describe('vertically oriented', function () {
        beforeEach(function () {
            // Use the suite's "this" object so that the container is available
            // in the addTests... function's scope.
            this.container = new EosKnowledge.SpaceContainer({
                orientation: Gtk.Orientation.VERTICAL,
            });
            this.add_box = (box) => {
                box.show_all();
                this.container.add(box);
                return box;
            };
            win.add(this.container);
            win.show_all();
        });

        addTestsForOrientation('height', 'width', 'y', 'valign');
    });

    describe('horizontally oriented', function () {
        beforeEach(function () {
            this.container = new EosKnowledge.SpaceContainer({
                orientation: Gtk.Orientation.HORIZONTAL,
            });
            this.add_box = (box) => {
                box.show_all();
                this.container.add(box);
                return box;
            };
            win.add(this.container);
            win.show_all();
        });

        addTestsForOrientation('width', 'height', 'x', 'halign');
    });
});

function addTestsForOrientation(primary, secondary, primary_pos, primary_align) {
    // NOTE: These tests use get_child_visible() to test whether the container
    // determined there was enough space to show the child. That is an
    // implementation detail, unfortunately.

    it('gives a single child its natural request if there is enough space', function () {
        let box = this.add_box(new IncompressibleBox(100));
        update_gui();

        expect(box.get_allocation()[primary]).toBe(100);
        expect(box.get_child_visible()).toBe(true);
    });

    it('gives a single child as much space as it can', function () {
        let box = this.add_box(new CompressibleBox(400));
        update_gui();

        expect(box.get_allocation()[primary]).toBe(TEST_WINDOW_SIZE);
        expect(box.get_child_visible()).toBe(true);
    });

    // Pending, because there is currently no way to stop a Gtk.OffscreenWindow
    // from growing bigger due to its minimal size request.
    xit('shows no children if there is not enough space for a single child', function () {
        let box = this.add_box(new IncompressibleBox(800));
        update_gui();

        expect(box.get_child_visible()).toBe(false);
    });

    it('shows only as many children as will fit', function () {
        let boxes = [200, 200].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_child_visible()).toBe(true);
        expect(boxes[1].get_child_visible()).toBe(false);
    });

    it('shares out extra space equally among visible children', function () {
        let boxes = [200, 200].map((size) => this.add_box(new CompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_allocation()[primary]).toBe(150);
        expect(boxes[1].get_allocation()[primary]).toBe(150);
    });

    it('shares out extra space among visible children up to the natural size', function () {
        let boxes = [50, 50].map((size) => this.add_box(new CompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_allocation()[primary]).toBe(50);
        expect(boxes[1].get_allocation()[primary]).toBe(50);
    });

    it('does not share out extra space to invisible children', function () {
        let boxes = [200, 200, 400].map((size) => this.add_box(new CompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_allocation()[primary]).toBe(150);
        expect(boxes[1].get_allocation()[primary]).toBe(150);
        expect(boxes[2].get_child_visible()).toBe(false);
    });

    it('shares out extra space beyond the natural size to expandable visible children', function () {
        let boxes = [50, 50].map((size) => this.add_box(new CompressibleBox(size)));
        boxes[0].expand = true;
        boxes[0].halign = Gtk.Align.FILL;
        boxes[0].valign = Gtk.Align.FILL;
        update_gui();

        expect(boxes[0].get_allocation()[primary]).toBe(250);
        expect(boxes[1].get_allocation()[primary]).toBe(50);
    });

    it('requests ' + secondary + ' equal to the maximum of its children', function () {
        this.add_box(new CompressibleBox(50));
        this.add_box(new CompressibleBox(150));
        this.add_box(new IncompressibleBox(100));

        let [minimum, natural] = this.container['get_preferred_' + secondary]();
        expect(minimum).toBe(100);
        expect(natural).toBe(150);
    });

    it('requests minimum ' + primary + ' equal to the minimum of its first child', function () {
        [50, 100, 150].forEach((size) => this.add_box(new CompressibleBox(size)));

        let [minimum, natural] = this.container['get_preferred_' + primary]();
        expect(minimum).toBe(25);
    });

    it('requests natural ' + primary + ' equal to the sum of its children', function () {
        [50, 100, 150, 100].forEach((size) => this.add_box(new CompressibleBox(size)));

        let [minimum, natural] = this.container['get_preferred_' + primary]();
        expect(natural).toBe(400);
    });

    it('does not allocate space to invisible children', function () {
        let boxes = [150, 150, 150].map((size) => this.add_box(new IncompressibleBox(size)));
        boxes[1].hide();
        boxes.forEach((box) => spyOn(box, 'size_allocate'));
        update_gui();

        expect(boxes[0].get_child_visible()).toBe(true);
        expect(boxes[2].get_child_visible()).toBe(true);
        expect(boxes[1].size_allocate).not.toHaveBeenCalled();
    });

    it('does not show children past the first non-fitting one, even if it fits', function () {
        let boxes = [200, 300, 50].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(boxes[2].get_child_visible()).toBe(false);
    });

    it('includes the spacing in its size request', function () {
        let boxes = [50, 50].map((size) => this.add_box(new IncompressibleBox(size)));
        this.container.spacing = 50;
        update_gui();

        let [minimum, natural] = this.container['get_preferred_' + primary]();
        expect(natural).toBe(150);
    });

    it('can push its children off the end with spacing', function () {
        let boxes = [50, 50].map((size) => this.add_box(new IncompressibleBox(size)));
        this.container.spacing = 250;
        update_gui();

        expect(boxes[0].get_child_visible()).toBe(true);
        expect(boxes[1].get_child_visible()).toBe(false);
    });

    it('tells that all children are visible', function () {
        let boxes = [100, 100].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(this.container.all_visible).toBeTruthy();
    });

    it('tells that not all children are visible', function () {
        let boxes = [200, 200].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(this.container.all_visible).toBeFalsy();
    });

    it('notifies when not all children are visible anymore', function (done) {
        let boxes = [150, 150].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        this.container.connect('notify::all-visible', () => {
            expect(this.container.all_visible).toBeFalsy();
            done();
        });
        this.add_box(new IncompressibleBox(150));
        update_gui();
    });

    it('notifies when all children become visible', function (done) {
        let boxes = [200, 200].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        this.container.connect('notify::all-visible', () => {
            expect(this.container.all_visible).toBeTruthy();
            done();
        });
        this.container.remove(boxes[1]);
        update_gui();
    });

    it('allocates leftover space to the end for Align.START', function () {
        this.container[primary_align] = Gtk.Align.START;
        let boxes = [200, 200].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_allocation()[primary_pos]).toBe(0);
    });

    it('allocates leftover space to both ends for Align.CENTER', function () {
        this.container[primary_align] = Gtk.Align.CENTER;
        let boxes = [200, 200].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_allocation()[primary_pos]).toBe(50);
    });

    it('allocates leftover space to both ends for Align.FILL', function () {
        this.container[primary_align] = Gtk.Align.FILL;
        let boxes = [200, 200].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_allocation()[primary_pos]).toBe(50);
    });

    it('allocates leftover space to the beginning for Align.END', function () {
        this.container[primary_align] = Gtk.Align.END;
        let boxes = [200, 200].map((size) => this.add_box(new IncompressibleBox(size)));
        update_gui();

        expect(boxes[0].get_allocation()[primary_pos]).toBe(100);
    });
}
