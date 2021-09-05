<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import * as fs from 'fs';
	import { promisify } from 'util';
	import { remote } from 'electron';
	import * as crypt from 'crypto';

	export let FULL_TOGGLE;

	let writeFile = promisify(fs.writeFile);
	let readFile = promisify(fs.readFile);

	const dispatch = createEventDispatcher();

	async function setKeys() {
		let keyPath = (await remote.dialog.showOpenDialog({
			message: 'select key_retail.bin'
		})).filePaths[0];
		let sha1 = crypt.createHash('sha1');
		sha1.update(await readFile(keyPath));
		if (sha1.digest('hex') !== "bbdbb49a917d14f7a997d327ba40d40c39e606ce") {
			await remote.BrowserView.showMessageBox({
				type: "warning",
				message: "incorrect. The keys need to be in one file together."
			})
			needsKeys = true;
			return;
		}
		config.keys = keyPath;
		await writeFile(`${remote.app.getPath('userData')}/PATHS.json`, JSON.stringify(config, null, 2), 'utf8');
		needsKeys = false;
	}

	async function setRegions() {
		let regionPath = (await remote.dialog.showOpenDialog({
			message: 'select regions.txt'
		})).filePaths[0];
		if (!regionPath) return;

		config.regions = regionPath;
		await writeFile(`${remote.app.getPath('userData')}/PATHS.json`, JSON.stringify(config, null, 2), 'utf8');
	}

	async function setRegionsToDefualt() {
		const confirmation = await remote.dialog.showMessageBox({
			type: "question",
			buttons: ["cancel", "ok"],
			title: 'confirmation',
			message: "are you sure you wish to reset the regions to default?"
		})[0];
		if (confirmation === 0) return;

		config.regions = '__DEFAULT__';
		await writeFile(`${remote.app.getPath('userData')}/PATHS.json`, JSON.stringify(config, null, 2), 'utf8');
	}

	let config;
	let needsKeys;
	onMount(async () => {
		try {
			console.log(remote.app.getPath('userData'));
			console.log(await readFile(`${remote.app.getPath('userData')}/PATHS.json`, 'utf8'));
		}
		catch (e) {
			await writeFile(`${remote.app.getPath('userData')}/PATHS.json`, '{"keys":"UNCONFIGURED","regions":"__DEFAULT__"}', 'utf8');
		}

		config = JSON.parse(await readFile(`${remote.app.getPath('userData')}/PATHS.json`, 'utf8'));
		if (!FULL_TOGGLE) config.regions = '__default__';
		needsKeys = (config.keys === "UNCONFIGURED");
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
			{#if FULL_TOGGLE}
				<h1 class="title">-\amiibox/-</h1>
				<h3 class="subtitle">accessible AI experimentation for everyone</h3>
			{:else}
				<h1 class="title">
					<i class="icon trophy"></i> -\tournamiibox/- <i class="icon trophy"></i>
				</h1>
				<h3 class="subtitle">accessible, tournament-legal amiibo tools for everyone</h3>
			{/if}
    </div>
    <div class="ui hidden divider" />
    <div class="ui container">
			<div class={`${needsKeys ? 'massive' : 'small'} ui fluid buttons`}>
      	<button class={`enter-btn ui ${needsKeys ? '' : 'basic'} red button`} on:click={() => setKeys()}>select keys</button>
      	{#if FULL_TOGGLE}
					<button class={"enter-btn ui basic red button"} on:click={() => setRegions()}>select region config</button>
					<button class={"enter-btn ui basic red button"} on:click={() => setRegionsToDefualt()}>RESET region config</button>
				{/if}
			</div>
      <button class={`${needsKeys ? 'mini ' : 'huge'} enter-btn fluid ui black basic button`} on:click={() => dispatch('navigate', 'main')}>Begin</button>
    </div>
  </div>
</div>