const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Compat = imports.app.compat.compat;
const Engine = imports.search.engine;
const Warehouse = imports.app.warehouse;

const ModuleFactory = new Lang.Class({
    Name: 'ModuleFactory',
    Extends: GObject.Object,
    Properties: {
        /**
         * Property: warehouse
         *
         * The warehouse that holds the paths for creating modules.
         */
        'warehouse': GObject.ParamSpec.object('warehouse', 'Warehouse', 'Warehouse',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    _init: function (props={}) {
        /**
         * Property: app-json
         *
         * The json object parsed from app.json that contains the app's
         * description.
         */
        Object.defineProperties(this, {
            'app_json': {
                value: props['app_json'] || props['app-json'] || props['appJson'],
                writable: true,
            },
        });
        delete props['app_json'];
        delete props['app-json'];
        delete props['appJson'];

        props.warehouse = props.warehouse || new Warehouse.Warehouse();

        this.parent(props);

        if (!this.app_json.hasOwnProperty('version') || this.app_json.version < 2) {
            // For v1 app.jsons, the categories are stored in the app.json
            // rather than in the database. We create fake objects for them.
            Compat.create_v1_set_models(this.app_json,
                Engine.Engine.get_default());
            this.app_json = Compat.transform_v1_description(this.app_json);
        }
        // After this point, the app.json must be the current version!
    },

    create_named_module: function (name, extra_props={}) {
        let description = this._get_module_description_by_name(name);

        let module_class = this.warehouse.type_to_class(description['type']);
        let module_props = {
            factory: this,
            factory_name: name,
        };

        if (description.hasOwnProperty('properties'))
            Lang.copyProperties(description['properties'], module_props);
        Lang.copyProperties(extra_props, module_props);

        return new module_class(module_props);
    },

    /**
     * Method: create_module_for_slot
     * Returns module specified in app.json for a slot
     *
     * Searches the app.json for the module meant to fill the slot
     * {slot} of module {parent_name}. Creates and returns this module, or null
     * if the slot was not filled.
     *
     * Parameters:
     *   parent_name - Name of module for which to create submodule
     *   slot - Slot for which to create module
     *   extra_props - dictionary of construct properties for the submodule
     */
    create_module_for_slot: function (parent_name, slot, extra_props={}) {
        let factory_name = this._get_module_description_by_name(parent_name)['slots'][slot];
        if (factory_name === null)
            return null;
        return this.create_named_module(factory_name, extra_props);
    },

    /**
     * Method: _get_module_description_by_name
     * Returns JSON description of module
     *
     * Searches the 'modules' property in the app.json for the {name} key
     * and returns the resulting JSON object.
     */
    _get_module_description_by_name: function (name) {
        let description = this.app_json['modules'][name];
        if (!description)
            throw new Error('No description found in app.json for ' + name);

        return description;
    },
});
