<script>
  import { afterUpdate } from 'svelte';

  export let params;
  export let abilities;
  export let data;

  let displayBin = false;

  const reverseLookup = (obj, val) => {
    for (const [k, v] of Object.entries(obj)) {
      if (v === val) return k;
    }
    return 'UNKNOWN';
  }

  afterUpdate(() => {
    for (const [i, param] of params.entries()) {
      if (param.type === 'ENUM' || param.type === 'bits') {
        if (typeof param.start === 'string') {
          if (param.start.includes('b')) {
            const parts = param.start.split('b');
            param.start = {
              byte: parseInt(parts[0]),
              bit: parseInt(parts[1])
            }
          } else {
            param.start = {
              byte: parseInt(param.start),
              bit: 0
            }
          }
        }
        if (typeof param.end === 'string') {
          if (param.end.includes('b')) {
            const parts = param.end.split('b');
            param.end = {
              byte: parseInt(parts[0]),
              bit: parseInt(parts[1])
            }
          } else {
            param.end = {
              byte: parseInt(param.start),
              bit: 0
            }
          }
        }


        const bitCount =
          ((param.end.byte) * 8 + param.end.bit) -
          (param.start.byte * 8 + param.start.bit)

        param.min = 0;
        param.max = parseInt(new Array(bitCount).fill(1).join(''), 2);
        param.bitCount = bitCount;

        let inString = '';
        for (let i = param.start.byte; i <= param.end.byte; i++) {
          inString = data.readUInt8(i).toString(2).padStart(8, '0') + inString; // because LE
        }
        param.value = parseInt(inString.substring(param.start.bit, inString.length - 8 + param.end.bit), 2);
      }
      else {
        params[i].value = ({
          u8(p) { param.bitCount = 8; params[i].min = 0; params[i].max = 255; return data.readUInt8(p) },
          i8(p) { param.bitCount = 8; params[i].min = -128; params[i].max = 127; return data.readInt8(p) },
          u16(p) { param.bitCount = 16; params[i].min = 0; params[i].max = 65535; return data.readUInt16LE(p) },
          i16(p) { param.bitCount = 16; params[i].min = -32768; params[i].max = 32767; return data.readInt16LE(p) },
          u32(p) { param.bitCount = 32; params[i].min = 0; params[i].max = 4294967295; return data.readUInt32LE(p) },
          i32(p) { param.bitCount = 32; params[i].min = -2147483648; params[i].max = 2147483647; return data.readInt32LE(p) },
          HEX(p) { return 'see hex view...' },
          ABILITY(p) { return this.u8(p) },
        })[param.type](parseInt(param.start))
      }
    }
  })

  function writeAdjustment(v, p) {
    if (p.type === 'ENUM' || p.type === 'bits') {
      p.value = parseInt(v);
      const clearMask = (
          ''.padStart(p.start.bit, '1')
          + new Array(p.bitCount).fill(0).join('')
          + ''.padEnd(8 - p.end.bit , '1')
        ).match(/.{1,8}/g)
        .reverse();

      const toWrite = (
          ''.padStart(p.start.bit, '0')
          + p.value.toString(2)
              .padStart(p.bitCount, '0')
          + ''.padEnd(8 - p.end.bit, '0')
        ).match(/.{1,8}/g)
        .reverse();

      for (let i = 0; i < clearMask.length; i++) {
        data[p.start.byte + i] &= parseInt(clearMask[i], 2);
        data[p.start.byte + i] |= parseInt(toWrite[i], 2);
      }
    } else {
      p.value = parseInt(v);
      ({
        u8(v, p) { return data.writeUInt8(v, p) },
        i8(v, p) { return data.writeInt8(v, p) },
        u16(v, p) { return data.writeUInt16LE(v, p) },
        i16(v, p) { return data.writeInt16LE(v, p) },
        u32(v, p) { return data.writeUInt32LE(v, p) },
        i32(v, p) { return data.writeInt32LE(v, p) },
        HEX() { return 'see hex view...' },
        ABILITY(v, p) { return this.u8(v, p) },
      })[p.type](p.value, parseInt(p.start))
    }
  }

  let thing = false;
  function checkBoundsAndSet(evt, param) {
    if (param.min <= evt.target.value && evt.target.value <= param.max) {
      writeAdjustment(evt.target.value, param);
    } else {
      evt.target.value = (evt.target.value > 0) ? param.max : param.min;
      writeAdjustment(evt.target.value, param);
    }

    thing = !thing;
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
<div class="ui checkbox">
  <input type="checkbox" on:change={(evt) => displayBin = evt.target.checked}>
  <label>display binary?</label>
</div>
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
        {:else if param.type === 'ENUM'}
          <div class="ui scrolling dropdown">
            <input type="hidden"
            on:change={(evt) => {writeAdjustment(param.enums[evt.target.value], param)}}
            value={reverseLookup(param.enums, param.value)}
            name="{`ability${params.indexOf(param)}`}">
            <div class="default text">None</div>
            <i class="dropdown icon"></i>
            <div class="menu">
              {#each Object.keys(param.enums) as e}
                <div class="item">{e}</div>
              {/each}
            </div>
          </div>
        {:else if param.type === 'HEX'}
          (edit as hex)
        {:else if param.type === 'bits'}
          <div class="ui transparent input">
            <input
              type="number"
              min={param.min}
              max={param.max}
              value={param.value}
              on:change={(evt) => checkBoundsAndSet(evt, param)}
              placeholder="value..."/>
          </div>
          ({(param.value !== undefined) ? (param.value >>> 0).toString(2).substr(-param.bitCount).padStart(param.bitCount, '0') : ''})
        {:else}
          <div class="ui transparent input">
            <input type="number"
              min={param.min}
              max={param.max}
              value={param.value}
              on:change={(evt) => checkBoundsAndSet(evt, param)}
              placeholder="value..."/>
          </div>
          <!-- forces update when value is changed -->
          <span style="display: none">{thing}</span>
          {#if displayBin}
            ({(param.value !== undefined) ? (param.value >>> 0).toString(2).substr(-param.bitCount).padStart(param.bitCount, '0') : ''})
          {/if}
        {/if}
        </div>
        <div class="description">{param.description}</div>
      </div>
    </div>
  {/each}
</div>