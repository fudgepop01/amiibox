'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var electron = require('electron');
var fs = require('fs');
var fs__default = _interopDefault(fs);
var util = require('util');
var nfcPcsc = require('nfc-pcsc');
var os = _interopDefault(require('os'));
var maboii = require('maboii');

function noop() {}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

function run_all(fns) {
	fns.forEach(run);
}

function is_function(thing) {
	return typeof thing === 'function';
}

function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function append(target, node) {
	target.appendChild(node);
}

function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

function detach(node) {
	node.parentNode.removeChild(node);
}

function destroy_each(iterations, detaching) {
	for (let i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d(detaching);
	}
}

function element(name) {
	return document.createElement(name);
}

function text(data) {
	return document.createTextNode(data);
}

function space() {
	return text(' ');
}

function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else node.setAttribute(attribute, value);
}

function set_custom_element_data(node, prop, value) {
	if (prop in node) {
		node[prop] = value;
	} else {
		attr(node, prop, value);
	}
}

function children(element) {
	return Array.from(element.childNodes);
}

function set_data(text, data) {
	data = '' + data;
	if (text.data !== data) text.data = data;
}

function custom_event(type, detail) {
	const e = document.createEvent('CustomEvent');
	e.initCustomEvent(type, false, false, detail);
	return e;
}

let current_component;

function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error(`Function called outside component initialization`);
	return current_component;
}

function onMount(fn) {
	get_current_component().$$.on_mount.push(fn);
}

function afterUpdate(fn) {
	get_current_component().$$.after_render.push(fn);
}

function createEventDispatcher() {
	const component = current_component;

	return (type, detail) => {
		const callbacks = component.$$.callbacks[type];

		if (callbacks) {
			// TODO are there situations where events could be dispatched
			// in a server (non-DOM) environment?
			const event = custom_event(type, detail);
			callbacks.slice().forEach(fn => {
				fn.call(component, event);
			});
		}
	};
}

const dirty_components = [];

const resolved_promise = Promise.resolve();
let update_scheduled = false;
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];

function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

function add_binding_callback(fn) {
	binding_callbacks.push(fn);
}

function add_render_callback(fn) {
	render_callbacks.push(fn);
}

function flush() {
	const seen_callbacks = new Set();

	do {
		// first, call beforeUpdate functions
		// and update components
		while (dirty_components.length) {
			const component = dirty_components.shift();
			set_current_component(component);
			update(component.$$);
		}

		while (binding_callbacks.length) binding_callbacks.shift()();

		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		while (render_callbacks.length) {
			const callback = render_callbacks.pop();
			if (!seen_callbacks.has(callback)) {
				callback();

				// ...so guard against infinite loops
				seen_callbacks.add(callback);
			}
		}
	} while (dirty_components.length);

	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}

	update_scheduled = false;
}

function update($$) {
	if ($$.fragment) {
		$$.update($$.dirty);
		run_all($$.before_render);
		$$.fragment.p($$.dirty, $$.ctx);
		$$.dirty = null;

		$$.after_render.forEach(add_render_callback);
	}
}

let outros;

function group_outros() {
	outros = {
		remaining: 0,
		callbacks: []
	};
}

function check_outros() {
	if (!outros.remaining) {
		run_all(outros.callbacks);
	}
}

function on_outro(callback) {
	outros.callbacks.push(callback);
}

function mount_component(component, target, anchor) {
	const { fragment, on_mount, on_destroy, after_render } = component.$$;

	fragment.m(target, anchor);

	// onMount happens after the initial afterUpdate. Because
	// afterUpdate callbacks happen in reverse order (inner first)
	// we schedule onMount callbacks before afterUpdate callbacks
	add_render_callback(() => {
		const new_on_destroy = on_mount.map(run).filter(is_function);
		if (on_destroy) {
			on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});

	after_render.forEach(add_render_callback);
}

function destroy(component, detaching) {
	if (component.$$) {
		run_all(component.$$.on_destroy);
		component.$$.fragment.d(detaching);

		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		component.$$.on_destroy = component.$$.fragment = null;
		component.$$.ctx = {};
	}
}

function make_dirty(component, key) {
	if (!component.$$.dirty) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty = blank_object();
	}
	component.$$.dirty[key] = true;
}

function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
	const parent_component = current_component;
	set_current_component(component);

	const props = options.props || {};

	const $$ = component.$$ = {
		fragment: null,
		ctx: null,

		// state
		props: prop_names,
		update: noop,
		not_equal: not_equal$$1,
		bound: blank_object(),

		// lifecycle
		on_mount: [],
		on_destroy: [],
		before_render: [],
		after_render: [],
		context: new Map(parent_component ? parent_component.$$.context : []),

		// everything else
		callbacks: blank_object(),
		dirty: null
	};

	let ready = false;

	$$.ctx = instance
		? instance(component, props, (key, value) => {
			if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
				if ($$.bound[key]) $$.bound[key](value);
				if (ready) make_dirty(component, key);
			}
		})
		: props;

	$$.update();
	ready = true;
	run_all($$.before_render);
	$$.fragment = create_fragment($$.ctx);

	if (options.target) {
		if (options.hydrate) {
			$$.fragment.l(children(options.target));
		} else {
			$$.fragment.c();
		}

		if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
		mount_component(component, options.target, options.anchor);
		flush();
	}

	set_current_component(parent_component);
}

class SvelteComponent {
	$destroy() {
		destroy(this, true);
		this.$destroy = noop;
	}

	$on(type, callback) {
		const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
		callbacks.push(callback);

		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	$set() {
		// overridden by instance, if it has props
	}
}

/* src/components/Entrance.svelte generated by Svelte v3.3.0 */

function create_fragment(ctx) {
	var div0, t0, div5, div4, div1, t4, div2, t5, div3, button, dispose;

	return {
		c() {
			div0 = element("div");
			t0 = space();
			div5 = element("div");
			div4 = element("div");
			div1 = element("div");
			div1.innerHTML = `<h1 class="title svelte-91ohlx">-\\amiibox/-</h1>
			      <h3 class="subtitle svelte-91ohlx">accessible AI experimentation for everyone</h3>`;
			t4 = space();
			div2 = element("div");
			t5 = space();
			div3 = element("div");
			button = element("button");
			button.textContent = "Begin";
			div0.className = "top-left svelte-91ohlx";
			div1.className = "header";
			div2.className = "ui hidden divider";
			button.className = "enter-btn fluid ui black basic button";
			div3.className = "ui container";
			div4.className = "content svelte-91ohlx";
			div5.className = "bottom-left svelte-91ohlx";
			dispose = listen(button, "click", ctx.click_handler);
		},

		m(target, anchor) {
			insert(target, div0, anchor);
			insert(target, t0, anchor);
			insert(target, div5, anchor);
			append(div5, div4);
			append(div4, div1);
			append(div4, t4);
			append(div4, div2);
			append(div4, t5);
			append(div4, div3);
			append(div3, button);
		},

		p: noop,
		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div0);
				detach(t0);
				detach(div5);
			}

			dispose();
		}
	};
}

function instance($$self) {
	const dispatch = createEventDispatcher();

	function click_handler() {
		return dispatch('navigate', 'main');
	}

	return { dispatch, click_handler };
}

class Entrance extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, []);
	}
}

/* src/components/Overview.svelte generated by Svelte v3.3.0 */

function get_each_context_1(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.ability = list[i];
	return child_ctx;
}

function get_each_context(ctx, list, i) {
	const child_ctx = Object.create(ctx);
	child_ctx.param = list[i];
	return child_ctx;
}

// (79:8) {:else}
function create_else_block(ctx) {
	var div, input, input_value_value, dispose;

	function change_handler_1(...args) {
		return ctx.change_handler_1(ctx, ...args);
	}

	return {
		c() {
			div = element("div");
			input = element("input");
			attr(input, "type", "number");
			input.value = input_value_value = ctx.param.value;
			input.placeholder = "value...";
			div.className = "ui transparent input";
			dispose = listen(input, "change", change_handler_1);
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, input);
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			if ((changed.params) && input_value_value !== (input_value_value = ctx.param.value)) {
				input.value = input_value_value;
			}
		},

		d(detaching) {
			if (detaching) {
				detach(div);
			}

			dispose();
		}
	};
}

// (77:39) 
function create_if_block_1(ctx) {
	var t;

	return {
		c() {
			t = text("(edit as hex)");
		},

		m(target, anchor) {
			insert(target, t, anchor);
		},

		p: noop,

		d(detaching) {
			if (detaching) {
				detach(t);
			}
		}
	};
}

// (63:8) {#if param.type === 'ABILITY'}
function create_if_block(ctx) {
	var div2, input, input_value_value, input_name_value, t0, div0, t2, i, t3, div1, dispose;

	function change_handler(...args) {
		return ctx.change_handler(ctx, ...args);
	}

	var each_value_1 = ctx.abilities;

	var each_blocks = [];

	for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
		each_blocks[i_1] = create_each_block_1(get_each_context_1(ctx, each_value_1, i_1));
	}

	return {
		c() {
			div2 = element("div");
			input = element("input");
			t0 = space();
			div0 = element("div");
			div0.textContent = "None";
			t2 = space();
			i = element("i");
			t3 = space();
			div1 = element("div");

			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
				each_blocks[i_1].c();
			}
			attr(input, "type", "hidden");
			input.value = input_value_value = ctx.abilities[ctx.param.value];
			input.name = input_name_value = `ability${ctx.params.indexOf(ctx.param)}`;
			div0.className = "default text svelte-1ocda7f";
			i.className = "dropdown icon svelte-1ocda7f";
			div1.className = "menu";
			div2.className = "ui scrolling dropdown svelte-1ocda7f";
			dispose = listen(input, "change", change_handler);
		},

		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, input);
			append(div2, t0);
			append(div2, div0);
			append(div2, t2);
			append(div2, i);
			append(div2, t3);
			append(div2, div1);

			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
				each_blocks[i_1].m(div1, null);
			}
		},

		p(changed, new_ctx) {
			ctx = new_ctx;
			if ((changed.abilities || changed.params) && input_value_value !== (input_value_value = ctx.abilities[ctx.param.value])) {
				input.value = input_value_value;
			}

			if ((changed.params) && input_name_value !== (input_name_value = `ability${ctx.params.indexOf(ctx.param)}`)) {
				input.name = input_name_value;
			}

			if (changed.abilities) {
				each_value_1 = ctx.abilities;

				for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i_1);

					if (each_blocks[i_1]) {
						each_blocks[i_1].p(changed, child_ctx);
					} else {
						each_blocks[i_1] = create_each_block_1(child_ctx);
						each_blocks[i_1].c();
						each_blocks[i_1].m(div1, null);
					}
				}

				for (; i_1 < each_blocks.length; i_1 += 1) {
					each_blocks[i_1].d(1);
				}
				each_blocks.length = each_value_1.length;
			}
		},

		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			destroy_each(each_blocks, detaching);

			dispose();
		}
	};
}

// (72:14) {#each abilities as ability}
function create_each_block_1(ctx) {
	var div, t_value = ctx.ability, t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			div.className = "item";
		},

		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},

		p(changed, ctx) {
			if ((changed.abilities) && t_value !== (t_value = ctx.ability)) {
				set_data(t, t_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (58:2) {#each params as param}
function create_each_block(ctx) {
	var div3, div2, div0, t0_value = ctx.param.name, t0, t1, t2, div1, t3_value = ctx.param.description, t3, t4;

	function select_block_type(ctx) {
		if (ctx.param.type === 'ABILITY') return create_if_block;
		if (ctx.param.type === 'HEX') return create_if_block_1;
		return create_else_block;
	}

	var current_block_type = select_block_type(ctx);
	var if_block = current_block_type(ctx);

	return {
		c() {
			div3 = element("div");
			div2 = element("div");
			div0 = element("div");
			t0 = text(t0_value);
			t1 = text(":\n        ");
			if_block.c();
			t2 = space();
			div1 = element("div");
			t3 = text(t3_value);
			t4 = space();
			div0.className = "header";
			div1.className = "description";
			div2.className = "content";
			div3.className = "item";
		},

		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div2);
			append(div2, div0);
			append(div0, t0);
			append(div0, t1);
			if_block.m(div0, null);
			append(div2, t2);
			append(div2, div1);
			append(div1, t3);
			append(div3, t4);
		},

		p(changed, ctx) {
			if ((changed.params) && t0_value !== (t0_value = ctx.param.name)) {
				set_data(t0, t0_value);
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(changed, ctx);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);
				if (if_block) {
					if_block.c();
					if_block.m(div0, null);
				}
			}

			if ((changed.params) && t3_value !== (t3_value = ctx.param.description)) {
				set_data(t3, t3_value);
			}
		},

		d(detaching) {
			if (detaching) {
				detach(div3);
			}

			if_block.d();
		}
	};
}

function create_fragment$1(ctx) {
	var h1, t_1, div;

	var each_value = ctx.params;

	var each_blocks = [];

	for (var i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "Overview";
			t_1 = space();
			div = element("div");

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
			h1.className = "header";
			div.className = "ui middle aligned selection list";
		},

		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t_1, anchor);
			insert(target, div, anchor);

			for (var i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},

		p(changed, ctx) {
			if (changed.params || changed.abilities) {
				each_value = ctx.params;

				for (var i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(changed, child_ctx);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}
				each_blocks.length = each_value.length;
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(h1);
				detach(t_1);
				detach(div);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { params, abilities, data } = $$props;

  afterUpdate(() => {
    for (const [i, param] of params.entries()) {
      params[i].value = ({
        u8(p) { return data.readUInt8(p) },
        i8(p) { return data.readInt8(p) },
        u16(p) { return data.readUInt16LE(p) },
        i16(p) { return data.readInt16LE(p) },
        u32(p) { return data.readUInt32LE(p) },
        i32(p) { return data.readInt32LE(p) },
        HEX(p) { return 'see hex view...' },
        ABILITY(p) { return this.u8(p) }
      })[param.type](parseInt(param.start)); $$invalidate('params', params);
    }
  });

  function writeAdjustment(v, p) {
    p.value = parseInt(v);
    ({
      u8(v, p) { return data.writeUInt8(v, p) },
      i8(v, p) { return data.writeInt8(v, p) },
      u16(v, p) { return data.writeUInt16LE(v, p) },
      i16(v, p) { return data.writeInt16LE(v, p) },
      u32(v, p) { return data.writeUInt32LE(v, p) },
      i32(v, p) { return data.writeInt32LE(v, p) },
      HEX() { return 'see hex view...' },
      ABILITY(v, p) { return this.u8(v, p) }
    })[p.type](p.value, parseInt(p.start));
  }

	function change_handler({ param }, evt) {writeAdjustment(abilities.map(v => v.toLowerCase()).indexOf(evt.target.value), param);}

	function change_handler_1({ param }, evt) {
		return writeAdjustment(evt.target.value, param);
	}

	$$self.$set = $$props => {
		if ('params' in $$props) $$invalidate('params', params = $$props.params);
		if ('abilities' in $$props) $$invalidate('abilities', abilities = $$props.abilities);
		if ('data' in $$props) $$invalidate('data', data = $$props.data);
	};

	return {
		params,
		abilities,
		data,
		writeAdjustment,
		change_handler,
		change_handler_1
	};
}

class Overview extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["params", "abilities", "data"]);
	}
}

/* src/components/Hex.svelte generated by Svelte v3.3.0 */

function create_fragment$2(ctx) {
	var h1, t1, label, t3, input, t4, div, fudge_hex_tooltip, t5, fudge_hex_editor, dispose;

	return {
		c() {
			h1 = element("h1");
			h1.textContent = "HEX";
			t1 = space();
			label = element("label");
			label.textContent = "editable?";
			t3 = space();
			input = element("input");
			t4 = space();
			div = element("div");
			fudge_hex_tooltip = element("fudge-hex-tooltip");
			t5 = space();
			fudge_hex_editor = element("fudge-hex-editor");
			h1.className = "header";
			label.htmlFor = "edit-toggle";
			input.id = "edit-toggle";
			attr(input, "type", "checkbox");
			fudge_hex_tooltip.id = "tooltip";
			set_custom_element_data(fudge_hex_editor, "mode", "region");
			set_custom_element_data(fudge_hex_editor, "edit-type", "readonly");
			set_custom_element_data(fudge_hex_editor, "max-lines", "34");
			set_custom_element_data(fudge_hex_editor, "bytes-per-line", "16");
			div.className = "hex-container";

			dispose = [
				listen(input, "change", ctx.change_handler),
				listen(fudge_hex_editor, "hexDataChanged", ctx.hexDataChanged_handler)
			];
		},

		m(target, anchor) {
			insert(target, h1, anchor);
			insert(target, t1, anchor);
			insert(target, label, anchor);
			insert(target, t3, anchor);
			insert(target, input, anchor);
			insert(target, t4, anchor);
			insert(target, div, anchor);
			append(div, fudge_hex_tooltip);
			append(div, t5);
			append(div, fudge_hex_editor);
			add_binding_callback(() => ctx.fudge_hex_editor_binding(fudge_hex_editor, null));
		},

		p(changed, ctx) {
			if (changed.items) {
				ctx.fudge_hex_editor_binding(null, fudge_hex_editor);
				ctx.fudge_hex_editor_binding(fudge_hex_editor, null);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(h1);
				detach(t1);
				detach(label);
				detach(t3);
				detach(input);
				detach(t4);
				detach(div);
			}

			ctx.fudge_hex_editor_binding(null, fudge_hex_editor);
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { data, params } = $$props;
  let editor;
  let dispatch = createEventDispatcher();

  onMount(async () => {
    setTimeout(async () => {
      await editor.acceptFile(new File([new Blob([data])], 'amiibodata'));
      editor.regions = []; $$invalidate('editor', editor);

      for (const param of params) {
        editor.regions.push({
          start: parseInt(param.start),
          end: parseInt(param.end),
          name: param.name,
          description: param.description
        });
      }
    }, 100);
  });

  async function broadcastChange() {
    dispatch('dataChanged', await editor.saveFile());
  }

	function change_handler(evt) {
	  if (evt.target.checked) {
	    editor.mode="edit"; $$invalidate('editor', editor);
	    editor.editType="overwrite"; $$invalidate('editor', editor);
	  } else {
	    editor.mode="region"; $$invalidate('editor', editor);
	    editor.editType="readonly"; $$invalidate('editor', editor);
	  }
	}

	function fudge_hex_editor_binding($$node, check) {
		editor = $$node;
		$$invalidate('editor', editor);
	}

	function hexDataChanged_handler() {
		return broadcastChange();
	}

	$$self.$set = $$props => {
		if ('data' in $$props) $$invalidate('data', data = $$props.data);
		if ('params' in $$props) $$invalidate('params', params = $$props.params);
	};

	return {
		data,
		params,
		editor,
		broadcastChange,
		change_handler,
		fudge_hex_editor_binding,
		hexDataChanged_handler
	};
}

class Hex extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["data", "params"]);
	}
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

var escapeStringRegexp = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

var colorName = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

var conversions = createCommonjsModule(function (module) {
/* MIT license */


// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in colorName) {
	if (colorName.hasOwnProperty(key)) {
		reverseKeywords[colorName[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var rdif;
	var gdif;
	var bdif;
	var h;
	var s;

	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var v = Math.max(r, g, b);
	var diff = v - Math.min(r, g, b);
	var diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}
		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in colorName) {
		if (colorName.hasOwnProperty(keyword)) {
			var value = colorName[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return colorName[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};
});
var conversions_1 = conversions.rgb;
var conversions_2 = conversions.hsl;
var conversions_3 = conversions.hsv;
var conversions_4 = conversions.hwb;
var conversions_5 = conversions.cmyk;
var conversions_6 = conversions.xyz;
var conversions_7 = conversions.lab;
var conversions_8 = conversions.lch;
var conversions_9 = conversions.hex;
var conversions_10 = conversions.keyword;
var conversions_11 = conversions.ansi16;
var conversions_12 = conversions.ansi256;
var conversions_13 = conversions.hcg;
var conversions_14 = conversions.apple;
var conversions_15 = conversions.gray;

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	var graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions);

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	var graph = buildGraph();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

var route = function (fromModel) {
	var graph = deriveBFS(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};

var convert = {};

var models = Object.keys(conversions);

function wrapRaw(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(function (fromModel) {
	convert[fromModel] = {};

	Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

	var routes = route(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert[fromModel][toModel] = wrapRounded(fn);
		convert[fromModel][toModel].raw = wrapRaw(fn);
	});
});

var colorConvert = convert;

var ansiStyles = createCommonjsModule(function (module) {


const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 0)
	};
	styles.color.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 0)
	};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 10)
	};
	styles.bgColor.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 10)
	};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (let key of Object.keys(colorConvert)) {
		if (typeof colorConvert[key] !== 'object') {
			continue;
		}

		const suite = colorConvert[key];

		if (key === 'ansi16') {
			key = 'ansi';
		}

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});
});

var hasFlag = (flag, argv) => {
	argv = argv || process.argv;
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const pos = argv.indexOf(prefix + flag);
	const terminatorPos = argv.indexOf('--');
	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};

const env = process.env;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false')) {
	forceColor = false;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = true;
}
if ('FORCE_COLOR' in env) {
	forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(stream) {
	if (forceColor === false) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (stream && !stream.isTTY && forceColor !== true) {
		return 0;
	}

	const min = forceColor ? 1 : 0;

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors. Windows 10 build 14931 is the first release
		// that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	if (env.TERM === 'dumb') {
		return min;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: getSupportLevel(process.stdout),
	stderr: getSupportLevel(process.stderr)
};

const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape(c) {
	if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
	const results = [];
	const chunks = args.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		if (!isNaN(chunk)) {
			results.push(Number(chunk));
		} else if ((matches = chunk.match(STRING_REGEX))) {
			results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle(style) {
	STYLE_REGEX.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const styleName of Object.keys(enabled)) {
		if (Array.isArray(enabled[styleName])) {
			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			if (enabled[styleName].length > 0) {
				current = current[styleName].apply(current, enabled[styleName]);
			} else {
				current = current[styleName];
			}
		}
	}

	return current;
}

var templates = (chalk, tmp) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
		if (escapeChar) {
			chunk.push(unescape(escapeChar));
		} else if (style) {
			const str = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
			styles.push({inverse, styles: parseStyle(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(chr);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMsg);
	}

	return chunks.join('');
};

var chalk = createCommonjsModule(function (module) {


const stdoutColor = supportsColor_1.stdout;



const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	const scLevel = stdoutColor ? stdoutColor.level : 0;
	obj.level = options.level === undefined ? scLevel : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling `chalk.constructor()`
	// by itself will have a `this` of a previously constructed chalk object
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
	ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
		}
	};
}

styles.visible = {
	get() {
		return build.call(this, this._styles || [], true, 'visible');
	}
};

ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');
for (const model of Object.keys(ansiStyles.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.color.close,
					closeRe: ansiStyles.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles.bgColor.close,
					closeRe: ansiStyles.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder._empty = _empty;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = String(arguments[0]);

	if (argsLen === 0) {
		return '';
	}

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return this._empty ? '' : str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	if (!Array.isArray(strings)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return [].slice.call(arguments, 1).join(' ');
	}

	const args = [].slice.call(arguments, 2);
	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
		parts.push(String(strings.raw[i]));
	}

	return templates(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = stdoutColor;
module.exports.default = module.exports; // For TypeScript
});
var chalk_1 = chalk.supportsColor;

const parseBytes = (name, data, length) => {
    if (!(data instanceof Buffer) && typeof data !== 'string') {
        throw new Error(`${name} must an instance of Buffer or a HEX string.`);
    }
    if (Buffer.isBuffer(data)) {
        if (data.length !== length) {
            throw new Error(`${name} must be ${length} bytes long.`);
        }
        return data;
    }
    if (typeof data === 'string') {
        if (data.length !== length * 2) {
            throw new Error(`${name} must be a ${length * 2} char HEX string.`);
        }
        return Buffer.from(data, 'hex');
    }
    throw new Error(`${name} must an instance of Buffer or a HEX string.`);
};
class CardIO {
    constructor() {
        this.nfc = new nfcPcsc.NFC;
    }
    init() {
        return new Promise((resolve) => {
            this.nfc.on('reader', (reader) => {
                this.reader = reader;
                resolve();
            });
        });
    }
    read() {
        return new Promise(async (resolve) => {
            const data = await this.reader.read(0, 540);
            this.data = data;
            resolve(data);
        });
    }
    writeFull(toWrite) {
        return new Promise(async (resolve, reject) => {
            const password = parseBytes('Password', 'FFFFFFFF', 4);
            const cmd = Buffer.from([
                0xff,
                0x00,
                0x00,
                0x00,
                0x07,
                // Payload (7 bytes)
                0xd4,
                0x42,
                0x1b,
                ...password,
            ]);
            const response = await this.reader.transmit(cmd, 7);
            this.reader.logger.debug('pwd_auth response', response);
            if (response.length < 5) {
                console.log('invalid_response_length', `Invalid response length ${response.length}. Expected minimal length was 2 bytes.`);
                process.exit();
            }
            if (response[2] !== 0x00 || response.length < 7) {
                console.log('invalid_password', `Authentication failed. Might be invalid password or unsupported card.`);
                process.exit();
            }
            try {
                console.log('writing data');
                await this.reader.write(0x4, toWrite.slice(0x04 * 4, 0x82 * 4), 4);
                console.log('writing last chunk');
                await this.reader.write(0x82, toWrite.slice(0x82 * 4, 0x88 * 4), 4);
                console.log('writing first chunk');
                console.log('first chunk p4...');
                await this.reader.write(0x3, toWrite.slice(0x03 * 4, 0x04 * 4), 4);
                console.log('first chunk p3...');
                await this.reader.write(0x2, toWrite.slice(0x02 * 4, 0x03 * 4), 4);
                console.log('first chunk p1...');
                await this.reader.write(0x0, toWrite.slice(0x00 * 4, 0x01 * 4), 4);
                console.log('written!');
                resolve();
            }
            catch (e) {
                console.log(e.message);
                reject();
            }
        });
    }
    writeData(toWrite, pw) {
        return new Promise(async (resolve, reject) => {
            // console.log(`now processing: ${sourcePath} | pw: ${pw}`);
            const password = parseBytes('Password', pw, 4);
            const cmd = Buffer.from([
                0xff,
                0x00,
                0x00,
                0x00,
                0x07,
                // Payload (7 bytes)
                0xd4,
                0x42,
                0x1b,
                ...password,
            ]);
            const response = await this.reader.transmit(cmd, 7);
            this.reader.logger.debug('pwd_auth response', response);
            if (response[2] !== 0x00 || response.length < 7) {
                console.error("auth failed");
                this.reader.on('card.off', card => {
                    reject();
                });
            }
            console.log(`writing data`);
            for (let chunk = 0x4; chunk <= 0x82; chunk++) {
                if (this.data.slice(chunk * 4, (chunk + 1) * 4).join(',') === toWrite.slice(chunk * 4, (chunk + 1) * 4).join(','))
                    continue;
                for (let i = 1; i <= 20; i++) {
                    try {
                        await this.reader.write(chunk, toWrite.slice(chunk * 4, (chunk + 1) * 4), 4);
                        break;
                    }
                    catch (e) {
                        if (i === 20) {
                            console.error(`failed on 0x${chunk.toString(16)}`);
                            reject();
                        }
                    }
                }
            }
            console.log(chalk.bold(chalk.cyanBright(`~~ Written! ~~`)));
            this.reader.on('card.off', card => {
                resolve();
            });
        });
    }
    write(toWrite, pw) {
        return new Promise(async (resolve, reject) => {
            // console.log(`now processing: ${sourcePath} | pw: ${pw}`);
            const password = parseBytes('Password', pw, 4);
            const cmd = Buffer.from([
                0xff,
                0x00,
                0x00,
                0x00,
                0x07,
                // Payload (7 bytes)
                0xd4,
                0x42,
                0x1b,
                ...password,
            ]);
            const response = await this.reader.transmit(cmd, 7);
            this.reader.logger.debug('pwd_auth response', response);
            if (response[2] !== 0x00 || response.length < 7) {
                console.error("auth failed");
                this.reader.on('card.off', card => {
                    reject();
                });
            }
            console.log(`writing data`);
            for (let chunk = 0x4; chunk <= 0x82; chunk++) {
                if (this.data.slice(chunk * 4, (chunk + 1) * 4).join(',') === toWrite.slice(chunk * 4, (chunk + 1) * 4).join(','))
                    continue;
                for (let i = 1; i <= 20; i++) {
                    try {
                        await this.reader.write(chunk, toWrite.slice(chunk * 4, (chunk + 1) * 4), 4);
                        break;
                    }
                    catch (e) {
                        if (i === 20) {
                            console.error(`failed on 0x${chunk.toString(16)}`);
                            reject();
                        }
                    }
                }
            }
            console.log(chalk.bold(chalk.cyanBright(`~~ Written! ~~`)));
            this.reader.on('card.off', card => {
                resolve();
            });
        });
    }
}

const keys = maboii.loadMasterKeys([...fs.readFileSync(__dirname + "/keys/key_retail.bin")]);
const main = (file) => {
    if (file instanceof Buffer) {
        const unpacked = maboii.unpack(keys, [...file]);
        return Buffer.from(unpacked.unpacked);
    }
    else {
        const unpacked = maboii.unpack(keys, [...fs.readFileSync(`enc_custom/${file}`)]);
        fs.writeFileSync(`dec_custom/${file}`, Buffer.from(unpacked.unpacked));
    }
};

class CRC32 {
    constructor(p0 = 0xEDB88320) {
        // console.log(p0);
        p0 |= 0x80000000;
        p0 >>>= 0;
        let u0 = new Array(0x100).fill(0);
        let i = 1;
        while (i & 0xFF) {
            let t0 = i;
            for (let j = 0; j < 8; j++) {
                let b = (t0 & 0x1) >>> 0;
                t0 = (t0 >>> 0x1) >>> 0;
                if (b)
                    t0 = (t0 ^ p0) >>> 0;
            }
            u0[i] = t0 >>> 0;
            i++;
        }
        this.u0 = u0;
    }
    calc0(s, inXOR = 0xFFFFFFFF, outXOR = 0xFFFFFFFF) {
        let u = this.u0;
        let t = inXOR;
        for (const k of s) {
            t = ((t >>> 0x8) ^ u[(k ^ t) & 0xFF]) >>> 0;
        }
        return (t ^ outXOR) >>> 0;
    }
}
const sign = (buffer) => {
    let crc32 = new CRC32();
    let t = crc32.calc0(buffer.slice(0xE0, 0xE0 + 0xD4), 0x0);
    let buf = Buffer.alloc(4);
    buf.writeUInt32LE(t, 0);
    buffer.writeUInt32LE(t, 0xDC);
};

const keys$1 = maboii.loadMasterKeys([...fs.readFileSync(__dirname + "/keys/key_retail.bin")]);
const main$1 = (buf) => {
    const packed = maboii.pack(keys$1, [...(buf)]);
    return Buffer.from(packed);
};

const calcKeyARaw = (uid) => {
    console.log([...uid.values()].map(v => v.toString(16).padStart(2, '0')));
    const intVals = uid;
    const intKey = [
        (intVals[1] ^ intVals[3] ^ 170) >>> 0,
        (intVals[2] ^ intVals[4] ^ 85) >>> 0,
        (intVals[3] ^ intVals[5] ^ 170) >>> 0,
        (intVals[4] ^ intVals[6] ^ 85) >>> 0
    ];
    // console.log(intKey);
    return intKey.map(v => v.toString(16).padStart(2, '0')).join('');
};

/* src/components/Main.svelte generated by Svelte v3.3.0 */

// (231:27) 
function create_if_block_1$1(ctx) {
	var current;

	var hex = new Hex({
		props: {
		data: ctx.data,
		params: ctx.params
	}
	});
	hex.$on("dataChanged", ctx.dataChanged_handler);

	return {
		c() {
			hex.$$.fragment.c();
		},

		m(target, anchor) {
			mount_component(hex, target, anchor);
			current = true;
		},

		p(changed, ctx) {
			var hex_changes = {};
			if (changed.data) hex_changes.data = ctx.data;
			if (changed.params) hex_changes.params = ctx.params;
			hex.$set(hex_changes);
		},

		i(local) {
			if (current) return;
			hex.$$.fragment.i(local);

			current = true;
		},

		o(local) {
			hex.$$.fragment.o(local);
			current = false;
		},

		d(detaching) {
			hex.$destroy(detaching);
		}
	};
}

// (229:2) {#if page === 'overview'}
function create_if_block$1(ctx) {
	var current;

	var overview = new Overview({
		props: {
		data: ctx.data,
		params: ctx.params,
		abilities: ctx.abilities
	}
	});
	overview.$on("load", setTimeout(ctx.load_handler, 100));

	return {
		c() {
			overview.$$.fragment.c();
		},

		m(target, anchor) {
			mount_component(overview, target, anchor);
			current = true;
		},

		p(changed, ctx) {
			var overview_changes = {};
			if (changed.data) overview_changes.data = ctx.data;
			if (changed.params) overview_changes.params = ctx.params;
			if (changed.abilities) overview_changes.abilities = ctx.abilities;
			overview.$set(overview_changes);
		},

		i(local) {
			if (current) return;
			overview.$$.fragment.i(local);

			current = true;
		},

		o(local) {
			overview.$$.fragment.o(local);
			current = false;
		},

		d(detaching) {
			overview.$destroy(detaching);
		}
	};
}

function create_fragment$3(ctx) {
	var div4, div0, i, t0, t1_value = ctx.modalState === 'clone' ? 'BLANK' : '', t1, t2, t3, div3, t7, div5, t8, div6, t9, div17, div8, t10, div11, div9, button0, t12, button1, t14, div10, button2, t16, button3, t18, button4, t20, div16, div13, t22, div15, t24, div18, current_block_type_index, if_block, current, dispose;

	var if_block_creators = [
		create_if_block$1,
		create_if_block_1$1
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.page === 'overview') return 0;
		if (ctx.page === 'hex') return 1;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c() {
			div4 = element("div");
			div0 = element("div");
			i = element("i");
			t0 = text("\n    Place ");
			t1 = text(t1_value);
			t2 = text(" card on reader");
			t3 = space();
			div3 = element("div");
			div3.innerHTML = `<div class="ui red basic cancel inverted button"><i class="remove icon"></i>
			      cancel
			    </div>
			    <div class="ui green ok inverted button"><i class="checkmark icon"></i>
			      Ok
			    </div>`;
			t7 = space();
			div5 = element("div");
			t8 = space();
			div6 = element("div");
			t9 = space();
			div17 = element("div");
			div8 = element("div");
			div8.innerHTML = `<div class="square image"></div>`;
			t10 = space();
			div11 = element("div");
			div9 = element("div");
			button0 = element("button");
			button0.innerHTML = `<i class="icon folder open"></i>
			        Load
			      `;
			t12 = space();
			button1 = element("button");
			button1.innerHTML = `<i class="icon save"></i>
			        Save
			      `;
			t14 = space();
			div10 = element("div");
			button2 = element("button");
			button2.innerHTML = `<i class="icon download"></i>
			        Scan
			      `;
			t16 = space();
			button3 = element("button");
			button3.innerHTML = `<i class="icon upload"></i>
			        Apply
			      `;
			t18 = space();
			button4 = element("button");
			button4.innerHTML = `<i class="icon plus"></i>
			      Clone
			    `;
			t20 = space();
			div16 = element("div");
			div13 = element("div");
			div13.innerHTML = `<div class="header content">
			        Overview
			      </div>`;
			t22 = space();
			div15 = element("div");
			div15.innerHTML = `<div class="header content">
			        Hex
			      </div>`;
			t24 = space();
			div18 = element("div");
			if (if_block) if_block.c();
			i.className = "microchip icon";
			div0.className = "ui icon header";
			div3.className = "actions";
			div4.className = "ui basic modal";
			div5.className = "top-left svelte-wxn4yo";
			div6.className = "top-right svelte-wxn4yo";
			div8.className = "ui placeholder";
			button0.className = "ui labeled icon button";
			button1.className = "ui labeled icon button";
			div9.className = "ui two mini buttons";
			button2.className = "ui labeled icon button";
			button3.className = "ui labeled icon button";
			div10.className = "ui two mini buttons";
			button4.className = "ui labeled icon mini fluid button";
			div11.className = "io svelte-wxn4yo";
			div13.className = "item";
			div15.className = "item";
			div16.className = "ui middle aligned selection list";
			div17.className = "bottom-left svelte-wxn4yo";
			div18.className = "bottom-right svelte-wxn4yo";

			dispose = [
				listen(button0, "click", ctx.click_handler),
				listen(button1, "click", ctx.click_handler_1),
				listen(button2, "click", ctx.click_handler_2),
				listen(button3, "click", ctx.click_handler_3),
				listen(button4, "click", ctx.click_handler_4),
				listen(div13, "click", ctx.click_handler_5),
				listen(div15, "click", ctx.click_handler_6)
			];
		},

		m(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div0);
			append(div0, i);
			append(div0, t0);
			append(div0, t1);
			append(div0, t2);
			append(div4, t3);
			append(div4, div3);
			insert(target, t7, anchor);
			insert(target, div5, anchor);
			insert(target, t8, anchor);
			insert(target, div6, anchor);
			insert(target, t9, anchor);
			insert(target, div17, anchor);
			append(div17, div8);
			append(div17, t10);
			append(div17, div11);
			append(div11, div9);
			append(div9, button0);
			append(div9, t12);
			append(div9, button1);
			append(div11, t14);
			append(div11, div10);
			append(div10, button2);
			append(div10, t16);
			append(div10, button3);
			append(div11, t18);
			append(div11, button4);
			append(div17, t20);
			append(div17, div16);
			append(div16, div13);
			append(div16, t22);
			append(div16, div15);
			insert(target, t24, anchor);
			insert(target, div18, anchor);
			if (~current_block_type_index) if_blocks[current_block_type_index].m(div18, null);
			current = true;
		},

		p(changed, ctx) {
			if ((!current || changed.modalState) && t1_value !== (t1_value = ctx.modalState === 'clone' ? 'BLANK' : '')) {
				set_data(t1, t1_value);
			}

			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				if (if_block) {
					group_outros();
					on_outro(() => {
						if_blocks[previous_block_index].d(1);
						if_blocks[previous_block_index] = null;
					});
					if_block.o(1);
					check_outros();
				}

				if (~current_block_type_index) {
					if_block = if_blocks[current_block_type_index];
					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					}
					if_block.i(1);
					if_block.m(div18, null);
				} else {
					if_block = null;
				}
			}
		},

		i(local) {
			if (current) return;
			if (if_block) if_block.i();
			current = true;
		},

		o(local) {
			if (if_block) if_block.o();
			current = false;
		},

		d(detaching) {
			if (detaching) {
				detach(div4);
				detach(t7);
				detach(div5);
				detach(t8);
				detach(div6);
				detach(t9);
				detach(div17);
				detach(t24);
				detach(div18);
			}

			if (~current_block_type_index) if_blocks[current_block_type_index].d();
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	

  const readFile = util.promisify(fs__default.readFile);
  const writeFile = util.promisify(fs__default.writeFile);

  let modalState = '';

  let params = [];
  let abilities = [];
  let data = Buffer.alloc(540);
  async function load() {
    $$invalidate('abilities', abilities = (await readFile(`${__dirname}/amiibo/abilities.txt`, 'utf8')).split('\n'));
    const splitted = (await readFile(`${__dirname}/amiibo/regions.txt`, 'utf8')).split('\n');

    params.push({});
    let lineNum = 0;
    let description = '';
    for (const line of splitted) {
      switch(lineNum) {
        case 0:
          let l = line.split(":");
          params[params.length - 1].name = l[0].trim(); $$invalidate('params', params);
          params[params.length - 1].type = l[1].trim(); $$invalidate('params', params);
          break;
        case 1: params[params.length - 1].start = line; $$invalidate('params', params); break;
        case 2: params[params.length - 1].end = line; $$invalidate('params', params); break;
        case 3: params[params.length - 1].category = line; $$invalidate('params', params); break;
        default:
          if (line.length === 0) {
            description = description.substring(0, description.length - 1);
            params[params.length - 1].description = description; $$invalidate('params', params);
            description = '';
            params.push({});
            lineNum = 0;
            continue;
          }
          else description += line + ' ';
      }
      lineNum++;
    }
    params.pop();
  }

  let card;
  let pw;
  async function initCard() {
    $$invalidate('card', card = new CardIO());
    await card.init();
  }

  async function loadFile() {
    let paths = await electron.remote.dialog.showOpenDialog({
      message: 'open amiibo bin'
    });
    $$invalidate('data', data = main(await readFile(paths[0])));
  }

  async function saveFile() {
    let paths = await electron.remote.dialog.showSaveDialog({
      message: 'save amiibo bin'
    });
    await writeFile(paths[0], main$1(data));

  }

  async function readCard() {
    $$invalidate('modalState', modalState = 'read');
    window['$']('.ui.basic.modal').modal({
      closable: false,
      onApprove: async () => {
        $$invalidate('data', data = await card.read());
        $$invalidate('data', data = main(data));
      }
    })
    .modal('show');
  }


  async function writeCard() {
    $$invalidate('modalState', modalState = 'write');
    window['$']('.ui.basic.modal').modal({
      closable: false,
      onApprove: async () => {
        let targetCard = await card.read();
        $$invalidate('pw', pw = calcKeyARaw(Buffer.from([...targetCard.slice(0, 3), ...targetCard.slice(4, 8)])));

        targetCard = main(targetCard);
        data.copy(targetCard, 0xE0, 0xE0, 0x1B5);

        sign(targetCard);
        let encrypted = main$1(targetCard);
        await card.writeData(encrypted, pw);
      }
    })
    .modal('show');
  }

  async function cloneCard() {
    $$invalidate('modalState', modalState = 'clone');
    let paths = await electron.remote.dialog.showOpenDialog({
      message: 'open amiibo bin'
    });

    window['$']('.ui.basic.modal').modal({
      closable: false,
      onApprove: async () => {
        let source = await readFile(paths[0]);
        let dest = await card.read();
        $$invalidate('pw', pw = calcKeyARaw(Buffer.from([...dest.slice(0, 3), ...dest.slice(4, 8)])));

        let dec = main(Buffer.from([...source]));

        Buffer.from([...dest.slice(0, 8)]).copy(dec, 0x1D4);
        Buffer.from(pw.match(/.{2}/g).map(v => parseInt(v, 16))).copy(dec, 0x214);
        Buffer.from([0x80, 0x80]).copy(dec, 0x218);
        Buffer.from([0x00, 0x00, 0x00]).copy(dec, 0x208);
        Buffer.from([...dest.slice(8, 10)]).copy(dec, 0x00);
        Buffer.from([0x00, 0x00]).copy(dec, 0x02);

        let enc = main$1(dec);

        enc[10] = 0x0F;
        enc[11] = 0xE0;
        enc[0x208] = 0x01;
        enc[0x20A] = 0x0F;
        // console.log([...enc.slice(0)].map(v => `0x${v.toString(16).padStart(2, '0')}`).join(', '));
        await card.writeFull(enc.slice(0));
      }
    })
    .modal('show');
  }

  load();
  initCard();

  let page = 'overview';

	function click_handler() {
		return loadFile();
	}

	function click_handler_1() {
		return saveFile();
	}

	function click_handler_2() {
		return readCard();
	}

	function click_handler_3() {
		return writeCard();
	}

	function click_handler_4() {
		return cloneCard();
	}

	function click_handler_5() {
		const $$result = page="overview";
		$$invalidate('page', page);
		return $$result;
	}

	function click_handler_6() {
		const $$result = page="hex";
		$$invalidate('page', page);
		return $$result;
	}

	function load_handler() {
		return window['$']('.ui.dropdown').dropdown();
	}

	function dataChanged_handler(evt) {
		const $$result = data = Buffer.from(evt.detail);
		$$invalidate('data', data);
		return $$result;
	}

	return {
		modalState,
		params,
		abilities,
		data,
		loadFile,
		saveFile,
		readCard,
		writeCard,
		cloneCard,
		page,
		Buffer,
		window,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4,
		click_handler_5,
		click_handler_6,
		load_handler,
		dataChanged_handler
	};
}

class Main extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
	}
}

/* src/components/Topbar.svelte generated by Svelte v3.3.0 */

function create_fragment$4(ctx) {
	var div;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<p class="svelte-j2jbra">by fudgepop01</p>`;
			div.className = "topbar svelte-j2jbra";
		},

		m(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

class Topbar extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$4, safe_not_equal, []);
	}
}

/* src/components/App.svelte generated by Svelte v3.3.0 */

// (30:1) {:else}
function create_else_block$1(ctx) {
	var div;

	return {
		c() {
			div = element("div");
			div.textContent = "page not found";
		},

		m(target, anchor) {
			insert(target, div, anchor);
		},

		p: noop,
		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (28:27) 
function create_if_block_1$2(ctx) {
	var current;

	var main = new Main({});

	return {
		c() {
			main.$$.fragment.c();
		},

		m(target, anchor) {
			mount_component(main, target, anchor);
			current = true;
		},

		p: noop,

		i(local) {
			if (current) return;
			main.$$.fragment.i(local);

			current = true;
		},

		o(local) {
			main.$$.fragment.o(local);
			current = false;
		},

		d(detaching) {
			main.$destroy(detaching);
		}
	};
}

// (26:1) {#if page === 'entrance'}
function create_if_block$2(ctx) {
	var current;

	var entrance = new Entrance({});
	entrance.$on("navigate", ctx.navigate);

	return {
		c() {
			entrance.$$.fragment.c();
		},

		m(target, anchor) {
			mount_component(entrance, target, anchor);
			current = true;
		},

		p: noop,

		i(local) {
			if (current) return;
			entrance.$$.fragment.i(local);

			current = true;
		},

		o(local) {
			entrance.$$.fragment.o(local);
			current = false;
		},

		d(detaching) {
			entrance.$destroy(detaching);
		}
	};
}

function create_fragment$5(ctx) {
	var t, main, current_block_type_index, if_block, current;

	var topbar = new Topbar({});

	var if_block_creators = [
		create_if_block$2,
		create_if_block_1$2,
		create_else_block$1
	];

	var if_blocks = [];

	function select_block_type(ctx) {
		if (ctx.page === 'entrance') return 0;
		if (ctx.page === 'main') return 1;
		return 2;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			topbar.$$.fragment.c();
			t = space();
			main = element("main");
			if_block.c();
			main.className = "svelte-1op9f54";
		},

		m(target, anchor) {
			mount_component(topbar, target, anchor);
			insert(target, t, anchor);
			insert(target, main, anchor);
			if_blocks[current_block_type_index].m(main, null);
			current = true;
		},

		p(changed, ctx) {
			var previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);
			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(changed, ctx);
			} else {
				group_outros();
				on_outro(() => {
					if_blocks[previous_block_index].d(1);
					if_blocks[previous_block_index] = null;
				});
				if_block.o(1);
				check_outros();

				if_block = if_blocks[current_block_type_index];
				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}
				if_block.i(1);
				if_block.m(main, null);
			}
		},

		i(local) {
			if (current) return;
			topbar.$$.fragment.i(local);

			if (if_block) if_block.i();
			current = true;
		},

		o(local) {
			topbar.$$.fragment.o(local);
			if (if_block) if_block.o();
			current = false;
		},

		d(detaching) {
			topbar.$destroy(detaching);

			if (detaching) {
				detach(t);
				detach(main);
			}

			if_blocks[current_block_type_index].d();
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	

	let page = 'entrance';

	function navigate(newPage) {
		$$invalidate('page', page = newPage.detail);
	}

	return { page, navigate };
}

class App extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$5, safe_not_equal, []);
	}
}

const app = new App({
    target: document.body
});
//# sourceMappingURL=renderer.js.map
