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
  /** Title, sentence and picture description of each slide, in INTRO_SLIDES order. */
  slides: [title: string, text: string, alt: string][];
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
      ['Welcome', 'A command-line toolbox in your pocket: type a command and press Enter.', 'Screenshot: help prints the Qodalis CLI banner, its version and the first commands.'],
      ['Getting around', 'Type help for every command, Tab to complete, ↑ for history; the extra keys add Tab, Ctrl and arrows.', 'Screenshot: guid new and echo run, history lists them, and Tab completes gen to generate-password.'],
      ['Everyday tools', 'QR codes, passwords, GUIDs, encoding, curl, speed tests, to-dos, a stopwatch, charts and Markdown.', 'Screenshot: generate-password prints a new random password.'],
      ['Files', 'Your files stay on this device: list them with ls, read them with cat, edit them with nano.', 'Screenshot: ls lists the notes folder and todo.txt.'],
      ['Games', 'Snake, Tetris, 2048, Wordle, Sudoku and Minesweeper, by touch or keyboard.', 'Screenshot: the Snake board with the snake and an apple.'],
      ['More packages', 'Add more tools and games with pkg add <name>; pkg browse lists them, and Connect Four, Hangman, 15-puzzle and Mastermind are on the way.', 'Screenshot: pkg browse lists the packages that can be added, with their versions.'],
      ['Make it yours', 'Pick colours with theme, one of 11 languages and more settings with configure.', 'Screenshot: theme list shows the dark themes with their colours.'],
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
      ['Willkommen', 'Eine Kommandozeilen-Werkzeugkiste für die Hosentasche: Befehl eingeben und Enter drücken.', 'Screenshot: help zeigt das Qodalis-CLI-Banner, die Version und die ersten Befehle.'],
      ['Erste Schritte', 'help zeigt alle Befehle, Tab vervollständigt, ↑ blättert im Verlauf; die Zusatztasten bieten Tab, Strg und Pfeile.', 'Screenshot: guid new und echo laufen, history listet sie auf und Tab ergänzt gen zu generate-password.'],
      ['Alltagswerkzeuge', 'QR-Codes, Passwörter, GUIDs, Kodierung, curl, Speedtests, To-dos, eine Stoppuhr, Diagramme und Markdown.', 'Screenshot: generate-password gibt ein neues zufälliges Passwort aus.'],
      ['Dateien', 'Deine Dateien bleiben auf diesem Gerät: auflisten mit ls, lesen mit cat, bearbeiten mit nano.', 'Screenshot: ls listet den Ordner notes und todo.txt auf.'],
      ['Spiele', 'Snake, Tetris, 2048, Wordle, Sudoku und Minesweeper, per Touch oder Tastatur.', 'Screenshot: das Snake-Spielfeld mit der Schlange und einem Apfel.'],
      ['Mehr Pakete', 'Weitere Werkzeuge und Spiele fügst du mit pkg add <name> hinzu; pkg browse listet sie auf, und Vier gewinnt, Galgenmännchen, 15-Puzzle und Mastermind sind unterwegs.', 'Screenshot: pkg browse listet die Pakete auf, die sich hinzufügen lassen, mit ihren Versionen.'],
      ['Ganz nach deinem Geschmack', 'Farben mit theme, eine von 11 Sprachen und weitere Einstellungen mit configure.', 'Screenshot: theme list zeigt die dunklen Themes mit ihren Farben.'],
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
      ['Bienvenido', 'Una caja de herramientas de línea de comandos en tu bolsillo: escribe un comando y pulsa Intro.', 'Captura: help muestra el banner de Qodalis CLI, su versión y los primeros comandos.'],
      ['Primeros pasos', 'help muestra todos los comandos, Tab completa, ↑ recorre el historial; las teclas extra añaden Tab, Ctrl y flechas.', 'Captura: se ejecutan guid new y echo, history los lista y Tab completa gen como generate-password.'],
      ['Herramientas diarias', 'Códigos QR, contraseñas, GUID, codificación, curl, pruebas de velocidad, tareas, un cronómetro, gráficos y Markdown.', 'Captura: generate-password muestra una contraseña aleatoria nueva.'],
      ['Archivos', 'Tus archivos se quedan en este dispositivo: lístalos con ls, léelos con cat y edítalos con nano.', 'Captura: ls lista la carpeta notes y todo.txt.'],
      ['Juegos', 'Snake, Tetris, 2048, Wordle, Sudoku y Buscaminas, con el dedo o con el teclado.', 'Captura: el tablero de Snake con la serpiente y una manzana.'],
      ['Más paquetes', 'Añade más herramientas y juegos con pkg add <nombre>; pkg browse los lista, y Conecta 4, el Ahorcado, el 15-puzzle y Mastermind están en camino.', 'Captura: pkg browse lista los paquetes que se pueden añadir, con sus versiones.'],
      ['A tu manera', 'Elige los colores con theme, uno de 11 idiomas y más ajustes con configure.', 'Captura: theme list muestra los temas oscuros con sus colores.'],
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
      ['Bienvenue', 'Une boîte à outils en ligne de commande dans votre poche : tapez une commande et appuyez sur Entrée.', 'Capture : help affiche la bannière de Qodalis CLI, sa version et les premières commandes.'],
      ['Prise en main', "help liste toutes les commandes, Tab complète, ↑ parcourt l'historique ; les touches supplémentaires ajoutent Tab, Ctrl et les flèches.", "Capture : guid new et echo s'exécutent, history les liste et Tab complète gen en generate-password."],
      ['Outils du quotidien', 'Codes QR, mots de passe, GUID, encodage, curl, tests de débit, tâches, chronomètre, graphiques et Markdown.', 'Capture : generate-password affiche un nouveau mot de passe aléatoire.'],
      ['Fichiers', 'Vos fichiers restent sur cet appareil : listez-les avec ls, lisez-les avec cat, modifiez-les avec nano.', 'Capture : ls liste le dossier notes et todo.txt.'],
      ['Jeux', 'Snake, Tetris, 2048, Wordle, Sudoku et Démineur, au toucher ou au clavier.', 'Capture : le plateau de Snake avec le serpent et une pomme.'],
      ['Plus de paquets', "Ajoutez d'autres outils et jeux avec pkg add <nom> ; pkg browse les liste, et Puissance 4, le Pendu, le taquin et Mastermind arrivent bientôt.", "Capture : pkg browse liste les paquets que l'on peut ajouter, avec leurs versions."],
      ['À votre image', "Choisissez les couleurs avec theme, l'une des 11 langues et d'autres réglages avec configure.", 'Capture : theme list affiche les thèmes sombres avec leurs couleurs.'],
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
      ['Benvenuto', 'Una cassetta degli attrezzi a riga di comando in tasca: digita un comando e premi Invio.', 'Schermata: help mostra il banner di Qodalis CLI, la versione e i primi comandi.'],
      ['Primi passi', 'help elenca tutti i comandi, Tab completa, ↑ scorre la cronologia; i tasti extra aggiungono Tab, Ctrl e frecce.', 'Schermata: vengono eseguiti guid new ed echo, history li elenca e Tab completa gen in generate-password.'],
      ['Strumenti quotidiani', 'Codici QR, password, GUID, codifica, curl, test di velocità, attività, cronometro, grafici e Markdown.', 'Schermata: generate-password stampa una nuova password casuale.'],
      ['File', 'I tuoi file restano su questo dispositivo: elencali con ls, leggili con cat, modificali con nano.', 'Schermata: ls elenca la cartella notes e todo.txt.'],
      ['Giochi', 'Snake, Tetris, 2048, Wordle, Sudoku e Campo minato, al tocco o da tastiera.', 'Schermata: il campo di Snake con il serpente e una mela.'],
      ['Altri pacchetti', "Aggiungi altri strumenti e giochi con pkg add <nome>; pkg browse li elenca, e Forza 4, l'Impiccato, il gioco del 15 e Mastermind sono in arrivo.", 'Schermata: pkg browse elenca i pacchetti che si possono aggiungere, con le loro versioni.'],
      ['Su misura per te', 'Scegli i colori con theme, una delle 11 lingue e altre impostazioni con configure.', 'Schermata: theme list mostra i temi scuri con i loro colori.'],
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
      ['ようこそ', 'ポケットに入るコマンドラインのツールボックス。コマンドを入力して Enter を押すだけです。', 'スクリーンショット: help が Qodalis CLI のバナー、バージョン、最初のコマンドを表示しています。'],
      ['基本操作', 'help で全コマンドを表示、Tab で補完、↑ で履歴。追加キーで Tab、Ctrl、矢印キーが使えます。', 'スクリーンショット: guid new と echo を実行し、history がそれらを一覧表示し、Tab で gen が generate-password に補完されます。'],
      ['便利なツール', 'QR コード、パスワード、GUID、エンコード、curl、速度テスト、ToDo、ストップウォッチ、グラフ、Markdown。', 'スクリーンショット: generate-password が新しいランダムなパスワードを表示しています。'],
      ['ファイル', 'ファイルはこの端末に保存されます。ls で一覧、cat で表示、nano で編集。', 'スクリーンショット: ls が notes フォルダーと todo.txt を一覧表示しています。'],
      ['ゲーム', 'Snake、テトリス、2048、Wordle、数独、マインスイーパーをタッチやキーボードで。', 'スクリーンショット: ヘビとリンゴがある Snake のゲーム画面。'],
      ['パッケージを追加', 'pkg add <名前> でツールやゲームを追加できます。pkg browse で一覧を表示。四目並べ、ハングマン、15 パズル、マスターマインドも準備中です。', 'スクリーンショット: pkg browse が追加できるパッケージをバージョン付きで一覧表示しています。'],
      ['自分好みに', 'theme で配色、11 の言語から選択、configure でその他の設定。', 'スクリーンショット: theme list がダークテーマを色付きで表示しています。'],
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
      ['환영합니다', '주머니 속 명령줄 도구 상자: 명령을 입력하고 Enter를 누르세요.', '스크린샷: help가 Qodalis CLI 배너, 버전, 첫 명령들을 보여 줍니다.'],
      ['기본 사용법', 'help로 모든 명령 보기, Tab으로 자동 완성, ↑로 기록 탐색. 추가 키로 Tab, Ctrl, 화살표를 쓸 수 있습니다.', '스크린샷: guid new와 echo를 실행하고 history가 이를 나열하며, Tab이 gen을 generate-password로 완성합니다.'],
      ['일상 도구', 'QR 코드, 비밀번호, GUID, 인코딩, curl, 속도 측정, 할 일, 스톱워치, 차트, Markdown.', '스크린샷: generate-password가 새 무작위 비밀번호를 출력합니다.'],
      ['파일', '파일은 이 기기에 저장됩니다. ls로 목록, cat으로 읽기, nano로 편집.', '스크린샷: ls가 notes 폴더와 todo.txt를 나열합니다.'],
      ['게임', 'Snake, 테트리스, 2048, Wordle, 스도쿠, 지뢰 찾기를 터치나 키보드로.', '스크린샷: 뱀과 사과가 있는 Snake 게임 판.'],
      ['패키지 추가', 'pkg add <이름>으로 도구와 게임을 더 추가하세요. pkg browse가 목록을 보여 주며, 사목, 행맨, 15 퍼즐, 마스터마인드도 준비 중입니다.', '스크린샷: pkg browse가 추가할 수 있는 패키지를 버전과 함께 나열합니다.'],
      ['나만의 설정', 'theme으로 색상, 11개 언어 중 선택, configure로 그 밖의 설정.', '스크린샷: theme list가 어두운 테마를 색상과 함께 보여 줍니다.'],
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
      ['Bem-vindo', 'Uma caixa de ferramentas de linha de comando no seu bolso: digite um comando e pressione Enter.', 'Captura de tela: help mostra o banner do Qodalis CLI, a versão e os primeiros comandos.'],
      ['Primeiros passos', 'help mostra todos os comandos, Tab completa, ↑ percorre o histórico; as teclas extras trazem Tab, Ctrl e setas.', 'Captura de tela: guid new e echo são executados, history os lista e Tab completa gen para generate-password.'],
      ['Ferramentas do dia a dia', 'Códigos QR, senhas, GUIDs, codificação, curl, testes de velocidade, tarefas, cronômetro, gráficos e Markdown.', 'Captura de tela: generate-password mostra uma nova senha aleatória.'],
      ['Arquivos', 'Seus arquivos ficam neste dispositivo: liste com ls, leia com cat, edite com nano.', 'Captura de tela: ls lista a pasta notes e todo.txt.'],
      ['Jogos', 'Snake, Tetris, 2048, Wordle, Sudoku e Campo Minado, pelo toque ou pelo teclado.', 'Captura de tela: o tabuleiro do Snake com a cobra e uma maçã.'],
      ['Mais pacotes', 'Adicione mais ferramentas e jogos com pkg add <nome>; pkg browse os lista, e Lig 4, Forca, o 15-puzzle e Mastermind estão a caminho.', 'Captura de tela: pkg browse lista os pacotes que podem ser adicionados, com suas versões.'],
      ['Do seu jeito', 'Escolha as cores com theme, um de 11 idiomas e outras configurações com configure.', 'Captura de tela: theme list mostra os temas escuros com suas cores.'],
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
      ['Bun venit', 'O trusă de unelte în linie de comandă, în buzunar: scrie o comandă și apasă Enter.', 'Captură de ecran: help afișează bannerul Qodalis CLI, versiunea și primele comenzi.'],
      ['Primii pași', 'help arată toate comenzile, Tab completează, ↑ parcurge istoricul; tastele suplimentare adaugă Tab, Ctrl și săgeți.', 'Captură de ecran: rulează guid new și echo, history le listează, iar Tab completează gen în generate-password.'],
      ['Unelte de zi cu zi', 'Coduri QR, parole, GUID-uri, codificare, curl, teste de viteză, sarcini, cronometru, grafice și Markdown.', 'Captură de ecran: generate-password afișează o parolă nouă, aleatorie.'],
      ['Fișiere', 'Fișierele tale rămân pe acest dispozitiv: listează-le cu ls, citește-le cu cat, editează-le cu nano.', 'Captură de ecran: ls listează folderul notes și todo.txt.'],
      ['Jocuri', 'Snake, Tetris, 2048, Wordle, Sudoku și Minesweeper, prin atingere sau de la tastatură.', 'Captură de ecran: tabla jocului Snake, cu șarpele și un măr.'],
      ['Mai multe pachete', 'Adaugă alte unelte și jocuri cu pkg add <nume>; pkg browse le listează, iar Connect Four, Spânzurătoarea, jocul 15 și Mastermind sunt pe drum.', 'Captură de ecran: pkg browse listează pachetele care pot fi adăugate, cu versiunile lor.'],
      ['Pe gustul tău', 'Alege culorile cu theme, una din 11 limbi și alte setări cu configure.', 'Captură de ecran: theme list arată temele întunecate cu culorile lor.'],
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
      ['Добро пожаловать', 'Набор инструментов командной строки в кармане: введите команду и нажмите Enter.', 'Снимок экрана: help выводит баннер Qodalis CLI, версию и первые команды.'],
      ['Основы', 'help покажет все команды, Tab дополняет, ↑ листает историю; дополнительные клавиши дают Tab, Ctrl и стрелки.', 'Снимок экрана: выполнены guid new и echo, history их перечисляет, а Tab дополняет gen до generate-password.'],
      ['Инструменты на каждый день', 'QR-коды, пароли, GUID, кодирование, curl, тест скорости, задачи, секундомер, графики и Markdown.', 'Снимок экрана: generate-password выводит новый случайный пароль.'],
      ['Файлы', 'Ваши файлы хранятся на этом устройстве: список — ls, чтение — cat, правка — nano.', 'Снимок экрана: ls показывает папку notes и todo.txt.'],
      ['Игры', 'Snake, Tetris, 2048, Wordle, Sudoku и Сапёр — касанием или с клавиатуры.', 'Снимок экрана: поле игры Snake со змейкой и яблоком.'],
      ['Больше пакетов', 'Добавляйте инструменты и игры командой pkg add <имя>; pkg browse покажет список, а «Четыре в ряд», «Виселица», «Пятнашки» и Mastermind уже на подходе.', 'Снимок экрана: pkg browse показывает пакеты, которые можно добавить, с их версиями.'],
      ['Под себя', 'Цвета — theme, один из 11 языков и другие настройки — configure.', 'Снимок экрана: theme list показывает тёмные темы с их цветами.'],
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
      ['欢迎', '装进口袋的命令行工具箱：输入命令，按回车即可。', '截图：help 显示 Qodalis CLI 横幅、版本和最前面的命令。'],
      ['基本操作', 'help 列出所有命令，Tab 自动补全，↑ 浏览历史；额外按键提供 Tab、Ctrl 和方向键。', '截图：运行 guid new 和 echo 后，history 列出它们，Tab 将 gen 补全为 generate-password。'],
      ['日常工具', '二维码、密码、GUID、编码、curl、网速测试、待办、秒表、图表和 Markdown。', '截图：generate-password 输出一个新的随机密码。'],
      ['文件', '文件保存在本设备上：用 ls 列出，用 cat 查看，用 nano 编辑。', '截图：ls 列出 notes 文件夹和 todo.txt。'],
      ['游戏', '贪吃蛇、俄罗斯方块、2048、Wordle、数独和扫雷，触屏或键盘皆可。', '截图：贪吃蛇游戏棋盘，有蛇和一个苹果。'],
      ['更多软件包', '用 pkg add <名称> 添加更多工具和游戏；pkg browse 会列出它们，四子棋、猜词游戏、数字华容道和珠玑妙算也即将推出。', '截图：pkg browse 列出可添加的软件包及其版本。'],
      ['个性化', '用 theme 换配色，在 11 种语言中选择，用 configure 调整更多设置。', '截图：theme list 显示深色主题及其配色。'],
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
