<script>
  import fs from 'fs';
  import { promisify } from 'util';
  import { remote } from 'electron';
  import Overview from './Overview.svelte';
  import Hex from './Hex.svelte';
  import Credits from './Credits.svelte';
  import { EOL } from 'os';

  import decrypt from '../util/decrypt';
  import sign from '../util/checksum';
  import encrypt from '../util/re_encrypt';
  import { calcKeyARaw } from '../util/pwd215';

  export let FULL_TOGGLE;

  const readFile = promisify(fs.readFile);
  const writeFile = promisify(fs.writeFile);

  let modalState = '';
  let overviewPage;

  let params = [];
  let abilities = [];
  let data = Buffer.alloc(540);
  let keys;
  async function load() {
    let config = JSON.parse(await readFile(`${remote.app.getPath('userData')}/PATHS.json`, 'utf8'));
    if (!FULL_TOGGLE) config.regions = '__default__';
    if (config.keys !== 'UNCONFIGURED') keys = config.keys;
	if (config.abilities == '__DEFAULT__') { abilities = (await readFile(`${__dirname}/amiibo/abilities.txt`, 'utf8')).split(EOL)}
	else abilities = (await readFile(config.abilities, 'utf8')).split(EOL);
	
    const splitted = (await readFile(
      config.regions === '__DEFAULT__'
        ? `${__dirname}/amiibo/regions.txt`
        : config.regions === '__default__'
          ? `${__dirname}/amiibo/regions_LEGAL.txt`
          : config.regions,
      'utf8'))
      .split(EOL);

    params.push({});
    let lineNum = 0;
    let description = '';

    let isInEnum = false;
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
          if (params[params.length - 1].type === 'ENUM' && line.startsWith('{')) {
            isInEnum = true;
            params[params.length - 1].enums = {};
            continue;
          }
          if (isInEnum) {
            if (line.startsWith('}')) {
              isInEnum = false;
              continue;
            } else {
              let l = line.split(":");
              if (l[1].trim().startsWith('0b')) l[1] = parseInt(l[1].trim().substring(2), 2);
              else l[1] = parseInt(l[1].trim());
              params[params.length - 1].enums[l[0].trim()] = l[1];
            }
          }
          else description += line + ' ';
      }
      lineNum++;
    }
    params.pop();
    console.log(params);
  }

  let card;
  let pw;
  async function initCard() {
    card = new CardIO();
    // setTimeout(() => {
    //   card = undefined;
    //   return false;
    // }, 1000);
    const thing = await card.init();
    if (thing) return true;
    else {
      card = undefined;
      return false;
    } 
  }

  let updateEditorFn = (data) => {};
  async function loadFile(method) {
    let paths = await remote.dialog.showOpenDialog({
      message: 'open amiibo bin'
    });
    if (method === 'encrypt') data = decrypt(await readFile(paths.filePaths[0]), keys);
    else data = await readFile(paths.filePaths[0]);
    updateEditorFn(data);
    if (overviewPage) overviewPage.updateDropdowns();
  }

  async function saveFile(method) {
    let p = await remote.dialog.showSaveDialog({
      message: 'save amiibo bin'
    });

    if (FULL_TOGGLE) data[0xE3] |= 0b00000001;

    // applies box nickname
    if (FULL_TOGGLE) {
      const newNick = data.toString('utf16le', 0x39, 0x4C).replace(/\0/g, ' ');
      data.write(newNick, 0x39, newNick.length * 2, 'utf16le');
      data.write('25A1', 0x4A, 2, 'hex');
    }

    let encData = encrypt(data, keys);
    pw = calcKeyARaw(Buffer.from([...encData.slice(0, 3), ...encData.slice(4, 8)]));

    let decData = decrypt(encData, keys);
    data.copy(decData, 0xE0, 0xE0, 0x1B5);
    sign(decData);

    if (method === 'encrypt') await writeFile(p.filePath, encrypt(decData, keys));
    else await writeFile(p.filePath, decData);
  }

  // async function readCard() {
  //   let readerCheck = false;
  //   if (!card) readerCheck = await initCard();
  //   else readerCheck = true;
  //   if (readerCheck) {
  //     modalState = 'read';
  //     window['$']('.ui.basic.modal.main').modal({
  //       closable: false,
  //       onApprove: async () => {
  //         data = await card.read();
  //         data = decrypt(data, keys);
  //         if (FULL_TOGGLE) data[0xE3] |= 0b00000001;
  //         updateEditorFn(data);
  //         if (overviewPage) overviewPage.updateDropdowns();
  //       }
  //     })
  //     .modal('show');
  //   } else {
  //     modalState = 'no compatible card reader found';
  //     window['$']('.ui.basic.modal.error').modal({
  //       closable: false
  //     })
  //     .modal('show');
  //   }

  // }


  // async function writeCard() {
  //   let readerCheck = false;
  //   if (!card) readerCheck = await initCard();
  //   else readerCheck = true;

  //   if (readerCheck) {
  //     modalState = 'write'
  //     window['$']('.ui.basic.modal.main').modal({
  //       closable: false,
  //       onApprove: async () => {
  //         if (FULL_TOGGLE) data[0xE3] |= 0b00000001;
  //         let targetCard = await card.read();
  //         pw = calcKeyARaw(Buffer.from([...targetCard.slice(0, 3), ...targetCard.slice(4, 8)]));

  //         targetCard = decrypt(targetCard, keys);
  //         data.copy(targetCard, 0xE0, 0xE0, 0x1B5);

  //         // applies box nickname
  //         if (FULL_TOGGLE) {
  //           const newNick = targetCard.toString('utf16le', 0x39, 0x4C).replace(/\0/g, ' ');
  //           targetCard.write(newNick, 0x39, newNick.length * 2, 'utf16le');
  //           targetCard.write('25A1', 0x4A, 2, 'hex');
  //         }

  //         sign(targetCard);
  //         let encrypted = encrypt(targetCard, keys);
  //         await card.writeData(encrypted, pw)
  //       }
  //     })
  //     .modal('show');
  //   } else {
  //     modalState = 'no compatible card reader found';
  //     window['$']('.ui.basic.modal.error').modal({
  //       closable: false
  //     })
  //     .modal('show');
  //   }

  // }

  // async function cloneCard() {
  //   if (!card) await initCard();
  //   modalState = 'clone';
  //   let paths = await remote.dialog.showOpenDialog({
  //     message: 'open amiibo bin'
  //   })

  //   window['$']('.ui.basic.modal.main').modal({
  //     closable: false,
  //     onApprove: async () => {
  //       let source = await readFile(paths[0]);
  //       let dest = await card.read();
  //       pw = calcKeyARaw(Buffer.from([...dest.slice(0, 3), ...dest.slice(4, 8)]));

  //       let dec = decrypt(Buffer.from([...source]), keys);

  //       Buffer.from([...dest.slice(0, 8)]).copy(dec, 0x1D4);
  //       Buffer.from(pw.match(/.{2}/g).map(v => parseInt(v, 16))).copy(dec, 0x214);
  //       Buffer.from([0x80, 0x80]).copy(dec, 0x218);
  //       Buffer.from([0x00, 0x00, 0x00]).copy(dec, 0x208);
  //       Buffer.from([...dest.slice(8, 10)]).copy(dec, 0x00);
  //       Buffer.from([0x00, 0x00]).copy(dec, 0x02);

  //       let enc = encrypt(dec, keys);

  //       enc[10] = 0x0F;
  //       enc[11] = 0xE0;
  //       enc[0x208] = 0x01;
  //       enc[0x20A] = 0x0F;
  //       await card.writeFull(enc.slice(0));
  //     }
  //   })
  //   .modal('show');
  // }

  window["LOADFILE"] = async () => await loadFile("decrypt");
  window["SAVEFILE"] = async () => await saveFile("decrypt");
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

<div class="ui basic modal main">
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

<div class="ui basic modal error">
  <div class="ui icon header">
    <i class="x icon"></i>
    {modalState}
  </div>
  <div class="actions">
    <div class="ui red ok inverted button">
      <i class="checkmark icon"></i>
      Ok
    </div>
  </div>
</div>

<div class="top-left"></div>
<div class="top-right"></div>
<div class="bottom-left">
  <div class="ui middle aligned selection list">
    <div class="item" on:click={() => page="overview"}>
      <div class="header content">
        Overview
      </div>
    </div>
    {#if FULL_TOGGLE}
      <div class="item" on:click={() => page="hex"}>
        <div class="header content">
          Hex
        </div>
      </div>
    {/if}
    <div class="item" on:click={() => page="credits"}>
      <div class="header content">
        Credits
      </div>
    </div>
  </div>

  <div class="io">
    <div class="ui two mini buttons">
      <button class="ui labeled icon button" on:click={() => loadFile('encrypt')}>
        <i class="icon folder open"></i>
        load_ENC
      </button>
      <button class="ui labeled icon button" on:click={() => saveFile('encrypt')}>
        <i class="icon save"></i>
        save_ENC
      </button>
    </div>
    <!-- <div class="ui two mini buttons">
      <button class={`${keys ? '' : 'disabled red'} ui labeled icon button`} on:click={() => readCard()}>
        <i class="icon download"></i>
        Scan
      </button>
      <button class={`${keys ? '' : 'disabled red'} ui labeled icon button`} on:click={() => writeCard()}>
        <i class="icon upload"></i>
        Apply
      </button>
    </div> -->
    <!-- <div class="ui two mini buttons">
      <button class="ui labeled icon button" on:click={() => loadFile('decrypt')}>
        <i class="icon folder open"></i>
        load_DEC
      </button>
      <button class="ui labeled icon button" on:click={() => saveFile('decrypt')}>
        <i class="icon save"></i>
        save_DEC
      </button>
    </div> -->
    <!-- <button class={`${keys ? '' : 'disabled red'} ui labeled icon mini fluid button`} on:click={() => cloneCard()}>
      <i class="icon plus"></i>
      Clone
    </button> -->
  </div>
</div>
<div class="bottom-right">
  {#if page === 'overview'}
    <Overview bind:this={overviewPage} {data} {params} {FULL_TOGGLE} {abilities} on:load={setTimeout(() => window['$']('.ui.dropdown').dropdown(), 100)}/>
  {:else if page === 'hex' && FULL_TOGGLE}
    <Hex
      on:dataChanged={(evt) => data = Buffer.from(evt.detail)}
      on:updateEditorFn={(evt) => updateEditorFn = evt.detail}
      {data}
      {params}>
    </Hex>
  {:else if page === 'credits'}
    <Credits></Credits>
  {/if}
</div>