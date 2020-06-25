<script>
	import Entrance from './Entrance.svelte';
	import Main from './Main.svelte';
	import TopBar from './Topbar.svelte';

	import { ipcRenderer } from 'electron';
	import { beforeMount } from 'svelte';

	const FULL_TOGGLE = ipcRenderer.sendSync('FULL_TOGGLE_CHK');
	console.log(FULL_TOGGLE);
	let page = 'entrance';

	function navigate(newPage) {
		page = newPage.detail;
	}
</script>

<style>
	main {
		display: grid;
		grid-template-columns: 200px auto;
		grid-template-rows: 35px auto;
		height: 100%;
		margin-top: 25px;
	}
</style>

<TopBar {FULL_TOGGLE} />

<main>
	{#if page === 'entrance'}
		<Entrance {FULL_TOGGLE} on:navigate={navigate}/>
	{:else if page === 'main'}
		<Main {FULL_TOGGLE} />
	{:else}
		<div>page not found</div>
	{/if}
</main>