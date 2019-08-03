<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import * as fs from 'fs';
	import { promisify } from 'util';
	import { remote } from 'electron';
	import * as crypt from 'crypto';

	let writeFile = promisify(fs.writeFile);
	let readFile = promisify(fs.readFile);
	let readdir = promisify(fs.readdir);

	const dispatch = createEventDispatcher();

	async function setKeys() {
		let keyPath = await remote.dialog.showOpenDialog({
			message: 'select key_retail.bin'
		})[0];
		let sha1 = crypt.createHash('sha1');
		sha1.update(await readFile(keyPath));
		if (sha1.digest('hex') !== "bbdbb49a917d14f7a997d327ba40d40c39e606ce") {
			console.log("incorrect. The keys need to be in one file together.");
			needsKeys = true;
			return;
		}
		needsKeys = false;
		config.keys = keyPath;
		await writeFile(`${__dirname}/PATHS.json`, JSON.stringify(config, null, 2), 'utf8');
	}

	async function setRegions() {
		let regionPath = await remote.dialog.showOpenDialog({
			message: 'select regions.txt'
		})[0];
		if (!regionPath) return;

		config.regions = regionPath;
		await writeFile(`${__dirname}/PATHS.json`, JSON.stringify(config, null, 2), 'utf8');
	}

	let config;
	let needsKeys;
	onMount(async () => {
		config = JSON.parse(await readFile(`${__dirname}/PATHS.json`, 'utf8'));
		needsKeys = config.keys === "UNCONFIGURED";
		console.log(config);
	})
</script>

<style>
  .top-left {
		background-color: black;
		grid-column-start: 1;
		grid-column-end: 3;
	}

	.bottom-left {
		align-content: center;
		grid-column-start: 1;
		grid-column-end: 3;
	}

  .content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		height: 100%;
	}

	.subtitle { font-size: 2em; margin: 0;}
	.title { font-size: 5em; margin: 0;}
</style>

<div class="top-left"></div>
<div class="bottom-left">
  <div class="content">
    <div class="header">
      <h1 class="title">-\amiibox/-</h1>
      <h3 class="subtitle">accessible AI experimentation for everyone</h3>
    </div>
    <div class="ui hidden divider" />
    <div class="ui container">
			<div class={`${needsKeys ? 'massive' : 'small'} ui fluid buttons`}>
      	<button class={`enter-btn ui ${needsKeys ? '' : 'basic'} red button`} on:click={() => setKeys()}>select keys</button>
      	<button class={"enter-btn ui basic red button"} on:click={() => setRegions()}>select region config</button>
			</div>
      <button class={`${needsKeys ? 'mini ' : 'huge'} enter-btn fluid ui black basic button`} on:click={() => dispatch('navigate', 'main')}>Begin</button>
    </div>
  </div>
</div>