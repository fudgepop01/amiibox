<script>
	import { shell } from 'electron';

	export let FULL_TOGGLE;

	const openSite = () => {
		shell.openExternal("https://www.ko-fi.com/fudgepop01");
	}
</script>

<style>
  .topbar {
		display: flex;
		position: fixed;
		width: 100%;
		height: 25px;
		background-color: black;
	}

	.topbar p {
		color: grey;
		font-style: italic;
		margin: auto;
	}

	.topbar > p.mode {
		text-align: left;
		display: inline-block;
		width: 50%;
		padding-left: 5px;
	}

	.topbar > p.love {
		text-align: right;
		display: inline-block;
		width: 50%;
		padding-right: 5px;
	}

	.topbar > p.love:hover > i {
		text-shadow: 0 0 3px #FF0000;
		color: #DD0000;
	}
</style>


<div class="topbar">
	<p class="mode">{FULL_TOGGLE ? 'full mode' : 'TOURNAMENT MODE'}</p>
	<p class="love" on:click={openSite}>
		made with &nbsp;<i class="icon heart"></i> by fudgepop01
	</p>
</div>