<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
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
      <button class="enter-btn fluid ui black basic button" on:click={() => dispatch('navigate', 'main')}>Begin</button>
    </div>
  </div>
</div>