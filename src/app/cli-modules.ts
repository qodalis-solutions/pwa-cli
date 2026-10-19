import { ICliModule } from '@qodalis/cli-core';
import { game2048Module } from '@qodalis/cli-2048';
import { browserStorageModule } from '@qodalis/cli-browser-storage';
import { chartModule } from '@qodalis/cli-chart';
import { cronModule } from '@qodalis/cli-cron';
import { csvModule } from '@qodalis/cli-csv';
import { curlModule } from '@qodalis/cli-curl';
import { encodeModule } from '@qodalis/cli-encode';
import { filesModule } from '@qodalis/cli-files';
import { guidModule } from '@qodalis/cli-guid';
import { langDeModule } from '@qodalis/cli-lang-de';
import { langEsModule } from '@qodalis/cli-lang-es';
import { langFrModule } from '@qodalis/cli-lang-fr';
import { langItModule } from '@qodalis/cli-lang-it';
import { langJaModule } from '@qodalis/cli-lang-ja';
import { langKoModule } from '@qodalis/cli-lang-ko';
import { langPtModule } from '@qodalis/cli-lang-pt';
import { langRoModule } from '@qodalis/cli-lang-ro';
import { langRuModule } from '@qodalis/cli-lang-ru';
import { langZhModule } from '@qodalis/cli-lang-zh';
import { markdownModule } from '@qodalis/cli-markdown';
import { minesweeperModule } from '@qodalis/cli-minesweeper';
import { passwordGeneratorModule } from '@qodalis/cli-password-generator';
import { qrModule } from '@qodalis/cli-qr';
import { regexModule } from '@qodalis/cli-regex';
import { snakeModule } from '@qodalis/cli-snake';
import { speedTestModule } from '@qodalis/cli-speed-test';
import { stopwatchModule } from '@qodalis/cli-stopwatch';
import { stringModule } from '@qodalis/cli-string';
import { sudokuModule } from '@qodalis/cli-sudoku';
import { tetrisModule } from '@qodalis/cli-tetris';
import { textToImageModule } from '@qodalis/cli-text-to-image';
import { todoModule } from '@qodalis/cli-todo';
import { wgetModule } from '@qodalis/cli-wget';
import { wordleModule } from '@qodalis/cli-wordle';
import { yesnoModule } from '@qodalis/cli-yesno';

import { appModule } from './privacy-command';

/**
 * Plugins bundled with the app. All of them run on the device; none needs a
 * Qodalis CLI server (curl, wget and speed-test only reach the URLs the user
 * gives them). The users plugin is left out: its first-run wizard asks for an
 * email and password before the terminal can be used.
 */
export const CLI_MODULES: ICliModule[] = [
  // App commands (privacy policy)
  appModule,
  // Tools
  guidModule,
  stringModule,
  regexModule,
  encodeModule,
  passwordGeneratorModule,
  qrModule,
  textToImageModule,
  markdownModule,
  csvModule,
  chartModule,
  cronModule,
  stopwatchModule,
  todoModule,
  yesnoModule,
  // Files and storage kept on the device
  filesModule,
  browserStorageModule,
  // Network
  curlModule,
  wgetModule,
  speedTestModule,
  // Games
  game2048Module,
  minesweeperModule,
  snakeModule,
  sudokuModule,
  tetrisModule,
  wordleModule,
  // Languages
  langDeModule,
  langEsModule,
  langFrModule,
  langItModule,
  langJaModule,
  langKoModule,
  langPtModule,
  langRoModule,
  langRuModule,
  langZhModule,
];
