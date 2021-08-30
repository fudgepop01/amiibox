import { spawn } from 'child_process';
import { codes, getBreakCode } from './vb_scan_codes';
import { resolve } from 'dns';

const vBoxInstallPath = process.env.VBOX_INSTALL_PATH || process.env.VBOX_MSI_INSTALL_PATH;
const vBoxManageBinary = 'VBoxManage.exe';

export const sendAmiiboFileCommand = async () => {
  const str = "nfc /media/sf_Amiibox/tosend.bin";

  const signals = [];
  for (const ch of str) {
    let sig: keyof typeof codes;
    let shift = false;
    switch (ch) {
      case '/': sig = 'SLASH'; break;
      case '.': sig = 'PERIOD'; break;
      case '_': sig = 'MINUS'; shift = true; break;
      case ' ': sig = 'SPACE'; break;
      default:
        if (ch === ch.toUpperCase()) shift = true;
        sig = ch.toUpperCase() as any;
        break;
    }

    if (shift) signals.push(codes['SHIFT']);
    signals.push(codes[sig]);
    signals.push(getBreakCode(sig))
    if (shift) signals.push(getBreakCode('SHIFT'));
  }

  signals.push(codes["ENTER"]);
  signals.push(getBreakCode("ENTER"));

  const codeStr = signals.map(seq => {
    return seq.map(val => val.toString(16).padStart(2, '0')).join(' ')
  }).join(' ');

  const proc = spawn(
    vBoxManageBinary,
    ['controlvm', 'xubuntu', 'keyboardputscancode', codeStr],
    {cwd: vBoxInstallPath, shell: true}
  )

  proc.on('exit',  () => {
    return "success";
  })
}
