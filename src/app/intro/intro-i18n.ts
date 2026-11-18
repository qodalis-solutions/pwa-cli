/** The words of the introduction in one language. Command names stay in English, as typed. */
export interface IntroText {
  dialog: string;
  next: string;
  skip: string;
  start: string;
  tryIt: string;
  /** "Slide {n} of {total}" */
  slideOf: string;
  /** "Go to slide {n}" */
  goTo: string;
  /** Title and sentence of each slide, in INTRO_SLIDES order. */
  slides: [title: string, text: string][];
}

/** The CLI's languages: English and its ten language packs (cli-modules.ts). */
export const INTRO_TEXT: Record<string, IntroText> = {
  en: {
    dialog: 'Introduction',
    next: 'Next',
    skip: 'Skip',
    start: 'Get started',
    tryIt: 'Try it',
    slideOf: 'Slide {n} of {total}',
    goTo: 'Go to slide {n}',
    slides: [
      ['Welcome', 'A command-line toolbox in your pocket: type a command and press Enter.'],
      ['Getting around', 'Type help for every command, Tab to complete, ↑ for history; the extra keys add Tab, Ctrl and arrows.'],
      ['Everyday tools', 'QR codes, passwords, GUIDs, encoding, curl, speed tests, to-dos, a stopwatch, charts and Markdown.'],
      ['Files', 'Your files stay on this device: list them with ls, read them with cat, edit them with nano.'],
      ['Games', 'Snake, Tetris, 2048, Wordle, Sudoku and Minesweeper, by touch or keyboard.'],
      ['Make it yours', 'Pick colours with theme, one of 11 languages and more settings with configure.'],
    ],
  },
  de: {
    dialog: 'Einführung',
    next: 'Weiter',
    skip: 'Überspringen',
    start: "Los geht's",
    tryIt: 'Ausprobieren',
    slideOf: 'Folie {n} von {total}',
    goTo: 'Zu Folie {n}',
    slides: [
      ['Willkommen', 'Eine Kommandozeilen-Werkzeugkiste für die Hosentasche: Befehl eingeben und Enter drücken.'],
      ['Erste Schritte', 'help zeigt alle Befehle, Tab vervollständigt, ↑ blättert im Verlauf; die Zusatztasten bieten Tab, Strg und Pfeile.'],
      ['Alltagswerkzeuge', 'QR-Codes, Passwörter, GUIDs, Kodierung, curl, Speedtests, To-dos, eine Stoppuhr, Diagramme und Markdown.'],
      ['Dateien', 'Deine Dateien bleiben auf diesem Gerät: auflisten mit ls, lesen mit cat, bearbeiten mit nano.'],
      ['Spiele', 'Snake, Tetris, 2048, Wordle, Sudoku und Minesweeper, per Touch oder Tastatur.'],
      ['Ganz nach deinem Geschmack', 'Farben mit theme, eine von 11 Sprachen und weitere Einstellungen mit configure.'],
    ],
  },
  es: {
    dialog: 'Introducción',
    next: 'Siguiente',
    skip: 'Omitir',
    start: 'Empezar',
    tryIt: 'Probar',
    slideOf: 'Diapositiva {n} de {total}',
    goTo: 'Ir a la diapositiva {n}',
    slides: [
      ['Bienvenido', 'Una caja de herramientas de línea de comandos en tu bolsillo: escribe un comando y pulsa Intro.'],
      ['Primeros pasos', 'help muestra todos los comandos, Tab completa, ↑ recorre el historial; las teclas extra añaden Tab, Ctrl y flechas.'],
      ['Herramientas diarias', 'Códigos QR, contraseñas, GUID, codificación, curl, pruebas de velocidad, tareas, un cronómetro, gráficos y Markdown.'],
      ['Archivos', 'Tus archivos se quedan en este dispositivo: lístalos con ls, léelos con cat y edítalos con nano.'],
      ['Juegos', 'Snake, Tetris, 2048, Wordle, Sudoku y Buscaminas, con el dedo o con el teclado.'],
      ['A tu manera', 'Elige los colores con theme, uno de 11 idiomas y más ajustes con configure.'],
    ],
  },
  fr: {
    dialog: 'Introduction',
    next: 'Suivant',
    skip: 'Passer',
    start: 'Commencer',
    tryIt: 'Essayer',
    slideOf: 'Diapositive {n} sur {total}',
    goTo: 'Aller à la diapositive {n}',
    slides: [
      ['Bienvenue', 'Une boîte à outils en ligne de commande dans votre poche : tapez une commande et appuyez sur Entrée.'],
      ['Prise en main', "help liste toutes les commandes, Tab complète, ↑ parcourt l'historique ; les touches supplémentaires ajoutent Tab, Ctrl et les flèches."],
      ['Outils du quotidien', 'Codes QR, mots de passe, GUID, encodage, curl, tests de débit, tâches, chronomètre, graphiques et Markdown.'],
      ['Fichiers', 'Vos fichiers restent sur cet appareil : listez-les avec ls, lisez-les avec cat, modifiez-les avec nano.'],
      ['Jeux', 'Snake, Tetris, 2048, Wordle, Sudoku et Démineur, au toucher ou au clavier.'],
      ['À votre image', "Choisissez les couleurs avec theme, l'une des 11 langues et d'autres réglages avec configure."],
    ],
  },
  it: {
    dialog: 'Introduzione',
    next: 'Avanti',
    skip: 'Salta',
    start: 'Inizia',
    tryIt: 'Prova',
    slideOf: 'Diapositiva {n} di {total}',
    goTo: 'Vai alla diapositiva {n}',
    slides: [
      ['Benvenuto', 'Una cassetta degli attrezzi a riga di comando in tasca: digita un comando e premi Invio.'],
      ['Primi passi', 'help elenca tutti i comandi, Tab completa, ↑ scorre la cronologia; i tasti extra aggiungono Tab, Ctrl e frecce.'],
      ['Strumenti quotidiani', 'Codici QR, password, GUID, codifica, curl, test di velocità, attività, cronometro, grafici e Markdown.'],
      ['File', 'I tuoi file restano su questo dispositivo: elencali con ls, leggili con cat, modificali con nano.'],
      ['Giochi', 'Snake, Tetris, 2048, Wordle, Sudoku e Campo minato, al tocco o da tastiera.'],
      ['Su misura per te', 'Scegli i colori con theme, una delle 11 lingue e altre impostazioni con configure.'],
    ],
  },
  ja: {
    dialog: 'はじめに',
    next: '次へ',
    skip: 'スキップ',
    start: 'はじめる',
    tryIt: '試す',
    slideOf: 'スライド {n}/{total}',
    goTo: 'スライド {n} へ移動',
    slides: [
      ['ようこそ', 'ポケットに入るコマンドラインのツールボックス。コマンドを入力して Enter を押すだけです。'],
      ['基本操作', 'help で全コマンドを表示、Tab で補完、↑ で履歴。追加キーで Tab、Ctrl、矢印キーが使えます。'],
      ['便利なツール', 'QR コード、パスワード、GUID、エンコード、curl、速度テスト、ToDo、ストップウォッチ、グラフ、Markdown。'],
      ['ファイル', 'ファイルはこの端末に保存されます。ls で一覧、cat で表示、nano で編集。'],
      ['ゲーム', 'Snake、テトリス、2048、Wordle、数独、マインスイーパーをタッチやキーボードで。'],
      ['自分好みに', 'theme で配色、11 の言語から選択、configure でその他の設定。'],
    ],
  },
  ko: {
    dialog: '소개',
    next: '다음',
    skip: '건너뛰기',
    start: '시작하기',
    tryIt: '해 보기',
    slideOf: '슬라이드 {n}/{total}',
    goTo: '슬라이드 {n}(으)로 이동',
    slides: [
      ['환영합니다', '주머니 속 명령줄 도구 상자: 명령을 입력하고 Enter를 누르세요.'],
      ['기본 사용법', 'help로 모든 명령 보기, Tab으로 자동 완성, ↑로 기록 탐색. 추가 키로 Tab, Ctrl, 화살표를 쓸 수 있습니다.'],
      ['일상 도구', 'QR 코드, 비밀번호, GUID, 인코딩, curl, 속도 측정, 할 일, 스톱워치, 차트, Markdown.'],
      ['파일', '파일은 이 기기에 저장됩니다. ls로 목록, cat으로 읽기, nano로 편집.'],
      ['게임', 'Snake, 테트리스, 2048, Wordle, 스도쿠, 지뢰 찾기를 터치나 키보드로.'],
      ['나만의 설정', 'theme으로 색상, 11개 언어 중 선택, configure로 그 밖의 설정.'],
    ],
  },
  pt: {
    dialog: 'Introdução',
    next: 'Próximo',
    skip: 'Pular',
    start: 'Começar',
    tryIt: 'Experimentar',
    slideOf: 'Slide {n} de {total}',
    goTo: 'Ir para o slide {n}',
    slides: [
      ['Bem-vindo', 'Uma caixa de ferramentas de linha de comando no seu bolso: digite um comando e pressione Enter.'],
      ['Primeiros passos', 'help mostra todos os comandos, Tab completa, ↑ percorre o histórico; as teclas extras trazem Tab, Ctrl e setas.'],
      ['Ferramentas do dia a dia', 'Códigos QR, senhas, GUIDs, codificação, curl, testes de velocidade, tarefas, cronômetro, gráficos e Markdown.'],
      ['Arquivos', 'Seus arquivos ficam neste dispositivo: liste com ls, leia com cat, edite com nano.'],
      ['Jogos', 'Snake, Tetris, 2048, Wordle, Sudoku e Campo Minado, pelo toque ou pelo teclado.'],
      ['Do seu jeito', 'Escolha as cores com theme, um de 11 idiomas e outras configurações com configure.'],
    ],
  },
  ro: {
    dialog: 'Introducere',
    next: 'Înainte',
    skip: 'Omite',
    start: 'Să începem',
    tryIt: 'Încearcă',
    slideOf: 'Diapozitivul {n} din {total}',
    goTo: 'Mergi la diapozitivul {n}',
    slides: [
      ['Bun venit', 'O trusă de unelte în linie de comandă, în buzunar: scrie o comandă și apasă Enter.'],
      ['Primii pași', 'help arată toate comenzile, Tab completează, ↑ parcurge istoricul; tastele suplimentare adaugă Tab, Ctrl și săgeți.'],
      ['Unelte de zi cu zi', 'Coduri QR, parole, GUID-uri, codificare, curl, teste de viteză, sarcini, cronometru, grafice și Markdown.'],
      ['Fișiere', 'Fișierele tale rămân pe acest dispozitiv: listează-le cu ls, citește-le cu cat, editează-le cu nano.'],
      ['Jocuri', 'Snake, Tetris, 2048, Wordle, Sudoku și Minesweeper, prin atingere sau de la tastatură.'],
      ['Pe gustul tău', 'Alege culorile cu theme, una din 11 limbi și alte setări cu configure.'],
    ],
  },
  ru: {
    dialog: 'Введение',
    next: 'Далее',
    skip: 'Пропустить',
    start: 'Начать',
    tryIt: 'Попробовать',
    slideOf: 'Слайд {n} из {total}',
    goTo: 'Перейти к слайду {n}',
    slides: [
      ['Добро пожаловать', 'Набор инструментов командной строки в кармане: введите команду и нажмите Enter.'],
      ['Основы', 'help покажет все команды, Tab дополняет, ↑ листает историю; дополнительные клавиши дают Tab, Ctrl и стрелки.'],
      ['Инструменты на каждый день', 'QR-коды, пароли, GUID, кодирование, curl, тест скорости, задачи, секундомер, графики и Markdown.'],
      ['Файлы', 'Ваши файлы хранятся на этом устройстве: список — ls, чтение — cat, правка — nano.'],
      ['Игры', 'Snake, Tetris, 2048, Wordle, Sudoku и Сапёр — касанием или с клавиатуры.'],
      ['Под себя', 'Цвета — theme, один из 11 языков и другие настройки — configure.'],
    ],
  },
  zh: {
    dialog: '简介',
    next: '下一步',
    skip: '跳过',
    start: '开始使用',
    tryIt: '试一试',
    slideOf: '第 {n} 张，共 {total} 张',
    goTo: '转到第 {n} 张',
    slides: [
      ['欢迎', '装进口袋的命令行工具箱：输入命令，按回车即可。'],
      ['基本操作', 'help 列出所有命令，Tab 自动补全，↑ 浏览历史；额外按键提供 Tab、Ctrl 和方向键。'],
      ['日常工具', '二维码、密码、GUID、编码、curl、网速测试、待办、秒表、图表和 Markdown。'],
      ['文件', '文件保存在本设备上：用 ls 列出，用 cat 查看，用 nano 编辑。'],
      ['游戏', '贪吃蛇、俄罗斯方块、2048、Wordle、数独和扫雷，触屏或键盘皆可。'],
      ['个性化', '用 theme 换配色，在 11 种语言中选择，用 configure 调整更多设置。'],
    ],
  },
};

export const INTRO_LOCALES = Object.keys(INTRO_TEXT);

/** The text for a CLI locale (`pt-BR` -> `pt`), English when there is none. */
export function introText(locale: string | undefined): IntroText {
  const tag = (locale ?? '').toLowerCase();
  return INTRO_TEXT[tag] ?? INTRO_TEXT[tag.split('-')[0]] ?? INTRO_TEXT['en'];
}

/** Fills `{name}` placeholders. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''));
}
