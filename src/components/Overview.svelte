<script>
  import { afterUpdate } from 'svelte';

  export let params;
  export let abilities;
  export let data;

  afterUpdate(() => {
    for (const [i, param] of params.entries()) {
      params[i].value = ({
        u8(p) { params[i].min = 0; params[i].max = 255; return data.readUInt8(p) },
        i8(p) { params[i].min = -128; params[i].max = 127; return data.readInt8(p) },
        u16(p) { params[i].min = 0; params[i].max = 65535; return data.readUInt16LE(p) },
        i16(p) { params[i].min = -32768; params[i].max = 32767; return data.readInt16LE(p) },
        u32(p) { params[i].min = 0; params[i].max = 4294967295; return data.readUInt32LE(p) },
        i32(p) { params[i].min = -2147483648; params[i].max = 2147483647; return data.readInt32LE(p) },
        HEX(p) { return 'see hex view...' },
        ABILITY(p) { return this.u8(p) }
      })[param.type](parseInt(param.start))
    }
  })

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
    })[p.type](p.value, parseInt(p.start))
  }
</script>

<style>
  .text {
    font-weight: 400;
  }

  .dropdown .text {
    padding-left: 20px;
  }

  .dropdown.icon {
    position: absolute;
    right: 0;
    margin: auto;
  }
</style>

<h1 class="header">
  Overview
</h1>
<div class="ui middle aligned selection list">
  {#each params as param}
    <div class="item">
      <div class="content">
        <div class="header">
        {param.name}:
        {#if param.type === 'ABILITY'}
          <div class="ui scrolling dropdown">
            <input type="hidden"
            on:change={(evt) => {writeAdjustment(abilities.map(v => v.toLowerCase()).indexOf(evt.target.value), param)}}
            value={abilities[param.value]}
            name="{`ability${params.indexOf(param)}`}">
            <div class="default text">None</div>
            <i class="dropdown icon"></i>
            <div class="menu">
              {#each abilities as ability}
                <div class="item">{ability}</div>
              {/each}
            </div>
          </div>
        {:else if param.type === 'HEX'}
          (edit as hex)
        {:else}
          <div class="ui transparent input">
            <input type="number" min={param.min} max={param.max} value={param.value} on:change={(evt) => (param.min <= evt.target.value && evt.target.value <= param.max) ? writeAdjustment(evt.target.value, param) : void 0} placeholder="value..."/>
          </div>
        {/if}
        </div>
        <div class="description">{param.description}</div>
      </div>
    </div>
  {/each}
</div>