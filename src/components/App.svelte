<script>
	import Entrance from './Entrance.svelte';
	import Main from './Main.svelte';
	import TopBar from './Topbar.svelte';

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
		padding-top: 25px;
	}
</style>

<TopBar />

<main>
	{#if page === 'entrance'}
		<Entrance on:navigate={navigate}/>
	{:else if page === 'main'}
		<Main />
	{:else}
		<div>page not found</div>
	{/if}
</main>