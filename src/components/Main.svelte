<script>
  import fs from 'fs';
  import { promisify } from 'util';
  import { remote } from 'electron';
  import Overview from './Overview.svelte';
  import Hex from './Hex.svelte';
  import { EOL } from 'os';

  import CardIO from '../util/cardIO';
  import decrypt from '../util/decrypt';
  import sign from '../util/checksum';
  import encrypt from '../util/re_encrypt';
  import { calcKeyARaw } from '../util/pwd215';

  const readFile = promisify(fs.readFile);
  const writeFile = promisify(fs.writeFile);

  let modalState = '';

  let params = [];
  let abilities = [];
  let data = Buffer.alloc(540);
  let keys;
  async function load() {
    let config = JSON.parse(await readFile(`${remote.app.getPath('userData')}/PATHS.json`, 'utf8'));
    if (config.keys !== 'UNCONFIGURED') keys = config.keys;

    abilities = (await readFile(`${__dirname}/amiibo/abilities.txt`, 'utf8')).split(EOL);
    const splitted = (await readFile(config.regions === '__DEFAULT__' ? `${__dirname}/amiibo/regions.txt` : config.regions, 'utf8')).split(EOL);

    params.push({});
    let lineNum = 0;
    let description = '';
    for (const line of splitted) {
      switch(lineNum) {
        case 0:
          let l = line.split(":");
          params[params.length - 1].name = l[0].trim();
          params[params.length - 1].type = l[1].trim();
          break;
        case 1: params[params.length - 1].start = line; break;
        case 2: params[params.length - 1].end = line; break;
        case 3: params[params.length - 1].category = line; break;
        default:
          if (line.length === 0) {
            description = description.substring(0, description.length - 1);
            params[params.length - 1].description = description;
            description = '';
            params.push({});
            lineNum = 0;
            continue;
          }
          else description += line + ' ';
      }
      lineNum++;
    }
    params.pop();
  }

  let card;
  let pw;
  async function initCard() {
    card = new CardIO();
    await card.init();
  }

  async function loadFile() {
    let paths = await remote.dialog.showOpenDialog({
      message: 'open amiibo bin'
    });
    data = decrypt(await readFile(paths[0]), keys);
  }

  async function saveFile() {
    let paths = await remote.dialog.showSaveDialog({
      message: 'save amiibo bin'
    });
    await writeFile(paths[0], encrypt(data), keys);

  }

  async function readCard() {
    if (!card) await initCard();
    modalState = 'read';
    window['$']('.ui.basic.modal').modal({
      closable: false,
      onApprove: async () => {
        data = await card.read();
        data = decrypt(data, keys);
      }
    })
    .modal('show');
  }


  async function writeCard() {
    if (!card) await initCard();
    modalState = 'write'
    window['$']('.ui.basic.modal').modal({
      closable: false,
      onApprove: async () => {
        let targetCard = await card.read();
        pw = calcKeyARaw(Buffer.from([...targetCard.slice(0, 3), ...targetCard.slice(4, 8)]));

        targetCard = decrypt(targetCard, keys);
        data.copy(targetCard, 0xE0, 0xE0, 0x1B5);

        sign(targetCard);
        let encrypted = encrypt(targetCard, keys);
        await card.writeData(encrypted, pw)
      }
    })
    .modal('show');
  }

  async function cloneCard() {
    if (!card) await initCard();
    modalState = 'clone';
    let paths = await remote.dialog.showOpenDialog({
      message: 'open amiibo bin'
    })

    window['$']('.ui.basic.modal').modal({
      closable: false,
      onApprove: async () => {
        let source = await readFile(paths[0]);
        let dest = await card.read();
        pw = calcKeyARaw(Buffer.from([...dest.slice(0, 3), ...dest.slice(4, 8)]));

        let dec = decrypt(Buffer.from([...source]), keys);

        Buffer.from([...dest.slice(0, 8)]).copy(dec, 0x1D4);
        Buffer.from(pw.match(/.{2}/g).map(v => parseInt(v, 16))).copy(dec, 0x214);
        Buffer.from([0x80, 0x80]).copy(dec, 0x218);
        Buffer.from([0x00, 0x00, 0x00]).copy(dec, 0x208);
        Buffer.from([...dest.slice(8, 10)]).copy(dec, 0x00);
        Buffer.from([0x00, 0x00]).copy(dec, 0x02);

        let enc = encrypt(dec, keys);

        enc[10] = 0x0F;
        enc[11] = 0xE0;
        enc[0x208] = 0x01;
        enc[0x20A] = 0x0F;
        await card.writeFull(enc.slice(0));
      }
    })
    .modal('show');
  }

  load();

  let page = 'overview';
</script>

<style>
  .top-left { background-color: black; }
  .top-right { background-color: black; }
  .bottom-left {
    border-right: 1px solid black;
  }
  .bottom-right {
    overflow: scroll;
  }

  .io {
    background-color: lightgrey;
  }
</style>

<div class="ui basic modal">
  <div class="ui icon header">
    <i class="microchip icon"></i>
    Place {modalState === 'clone' ? 'BLANK' : ''} card on reader
  </div>
  <div class="actions">
    <div class="ui red basic cancel inverted button">
      <i class="remove icon"></i>
      cancel
    </div>
    <div class="ui green ok inverted button">
      <i class="checkmark icon"></i>
      Ok
    </div>
  </div>
</div>

<div class="top-left"></div>
<div class="top-right"></div>
<div class="bottom-left">
  <div class="ui placeholder">
    <div class="square image"></div>
  </div>
  <div class="io">
    <div class="ui two mini buttons">
      <button class="ui labeled icon button" on:click={() => loadFile()}>
        <i class="icon folder open"></i>
        Load
      </button>
      <button class="ui labeled icon button" on:click={() => saveFile()}>
        <i class="icon save"></i>
        Save
      </button>
    </div>
    <div class="ui two mini buttons">
      <button class={`${keys ? '' : 'disabled red'} ui labeled icon button`} on:click={() => readCard()}>
        <i class="icon download"></i>
        Scan
      </button>
      <button class={`${keys ? '' : 'disabled red'} ui labeled icon button`} on:click={() => writeCard()}>
        <i class="icon upload"></i>
        Apply
      </button>
    </div>
    <button class={`${keys ? '' : 'disabled red'} ui labeled icon mini fluid button`} on:click={() => cloneCard()}>
      <i class="icon plus"></i>
      Clone
    </button>
  </div>

  <div class="ui middle aligned selection list">
    <div class="item" on:click={() => page="overview"}>
      <div class="header content">
        Overview
      </div>
    </div>
    <div class="item" on:click={() => page="hex"}>
      <div class="header content">
        Hex
      </div>
    </div>
  </div>
</div>
<div class="bottom-right">
  {#if page === 'overview'}
    <Overview {data} {params} {abilities} on:load={setTimeout(() => window['$']('.ui.dropdown').dropdown(), 100)}/>
  {:else if page === 'hex'}
    <Hex on:dataChanged={(evt) => data = Buffer.from(evt.detail)} {data} {params}></Hex>
  {/if}
</div>