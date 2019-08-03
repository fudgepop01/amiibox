<script>
  import { onMount, createEventDispatcher } from 'svelte';

  export let data;
  export let params;
  let editor;
  let dispatch = createEventDispatcher();

  onMount(async () => {
    setTimeout(async () => {
      await editor.acceptFile(new File([new Blob([data])], 'amiibodata'));
      editor.regions = [];

      for (const param of params) {
        editor.regions.push({
          start: parseInt(param.start),
          end: parseInt(param.end),
          name: param.name,
          description: param.description
        })
      }
    }, 100);
  })

  async function broadcastChange() {
    dispatch('dataChanged', await editor.saveFile());
  }

</script>

<style>
</style>

<h1 class="header">HEX</h1>
<label for="edit-toggle">editable?</label>
<input id="edit-toggle" type="checkbox" on:change={(evt) => {
  if (evt.target.checked) {
    editor.mode="edit";
    editor.editType="overwrite";
  } else {
    editor.mode="region";
    editor.editType="readonly";
  }
}}>
<div class="hex-container">
  <fudge-hex-tooltip id="tooltip"></fudge-hex-tooltip>
  <fudge-hex-editor on:hexDataChanged={() => broadcastChange()} mode="region" edit-type="readonly" bind:this={editor} max-lines="34" bytes-per-line="16"/>
</div>

