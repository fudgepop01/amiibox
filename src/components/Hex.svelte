<script>
  // import '../../static/fudgedit/dist/fudgeapps/fudgeapps.esm.js';
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
        let s = 0, e = 0;
        if (typeof param.start !== 'string') {
          s = param.start.byte + param.start.bit / 8;
          e = param.end.byte + param.end.bit / 8;
          console.log(s, e);
        } else {
          s = parseInt(param.start);
          e = parseInt(param.end);
        }

        editor.regions.push({
          start: s,
          end: e,
          name: param.name,
          description: param.description
        })
      }
    }, 100);
  })

  async function broadcastChange() {
    dispatch('dataChanged', await editor.saveFile());
  }

  let binView = false;
  const toggleBinView = () => {

  }

</script>

<style>
  .hex-container {
    line-height: 15px;
  }

  ::global(.binLine:nth-child(2n-1), .hexLine:nth-child(2n-1), .charLine:nth-child(2n-1), .lineLabel:nth-child(2n-1)) {
    mix-blend-mode: multiply;
    background-color: #EEFFFF;
  }
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
<label for="bin-toggle">show binary?</label>
<input id="bin-toggle" type="checkbox" on:change={(evt) => {
  if (evt.target.checked) {
    editor.bytesPerLine = 4;
    editor.displayBin = true;
  } else {
    editor.bytesPerLine = 16;
    editor.displayBin = false;
    editor.setLineNumber(0)
  }
}}>
<div class="hex-container">
  <fudge-hex-tooltip id="tooltip"></fudge-hex-tooltip>
  <fudge-hex-editor
    on:hexDataChanged={() => broadcastChange()}
    mode="region"
    edit-type="readonly"
    bind:this={editor}
    max-lines="34"
    bytes-per-line="16"
  />
</div>

