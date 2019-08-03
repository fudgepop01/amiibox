import svelte from 'rollup-plugin-svelte';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript';
import babel from 'rollup-plugin-babel';

export default {
	input: ['src/main.ts', 'src/renderer.ts'],

	output: {
		dir: 'rolledup',
		format: 'cjs',
		sourcemap: true
	},

	plugins: [
		resolve(),
		svelte({
			css(css) {
				css.write('rolledup/svelte.css');
			}
		}),
		commonjs(),
		json(),
		typescript({ typescript: require('typescript') }),
		babel({
      exclude: 'node_modules/**'
    })
	],

	external: [
		'electron',
		'child_process',
		'nfc-pcsc',
		'crypto',
		'maboii',
		'fs',
		'util',
		'bindings',
		'path',
		'url',
		'module',
		'os'
	]
};
