// inspiration from https://minesweeper.online/game/2459822712
console.log('hello minesweeper');

const difficulty_levels = ['beginner', 'intermediate', 'expert'];
let board = [];
const bomb_cells = [];
let difficulty = difficulty_levels[0];
const game_config_for = {
  'beginner': {
    'grid_size': 9,
    'num_bombs': 10,
  },
  'intermediate': {
    'grid_size': 12,
    'num_bombs': 24,
  },
  'expert': {
    'grid_size': 20,
    'num_bombs': 99,
  },
}
let grid_size = game_config_for[difficulty].grid_size;
let num_bombs = game_config_for[difficulty].num_bombs;
// game status
const not_started = 'not_started';
const in_progress = 'in_progress';
const over = 'over';
let game_state = not_started;
// game state
let bombs_left = num_bombs;
let cells_left_to_reveal = grid_size * grid_size - num_bombs;
let flag_countdown = num_bombs;
let timer = 0;
let timer_interval = null;
const bomb_positions = new Set();
const surrounding_displacements = [[-1,-1], [-1,0], [-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

// cell bomb number is stored in board
// which cells are bombs is stored in set
// cell flagged, hidden status is stored on cell

function create_2D_grid() {
  board = [];
  for (let r = 0; r < grid_size; r++) {
    board.push([]);
    for (let c = 0; c < grid_size; c++) {
      board[r].push({
        cell: null,
        bomb_no: 0,
      })
    }
  }
  init_number_on_cells();
}

function is_bomb(r,c) {
  if (bomb_positions.has(`${r},${c}`)) {
    return true;
  }
  return false;
}

function is_flagged(cell) {
  return cell.classList.contains('flagged');
}

function is_revealed(cell) {
  return !cell.classList.contains('hidden');
}

function get_cell_number(r,c) {
  // 8 cells to check
  let sum = 0;
  surrounding_displacements.forEach((pos) => {
    if (is_bomb(r + pos[0], c + pos[1])) {
      sum += 1;
    }
  })
  return sum;
}

function init_number_on_cells() {
  for (let r = 0; r < grid_size; r++) {
    for (let c = 0; c < grid_size; c++) {
      if (!bomb_positions.has(`${r},${c}`)) {
        board[r][c].bomb_no = get_cell_number(r,c);
      }
    }
  }
}

function generate_bomb_positions() {
  bomb_positions.clear();
  while (bomb_positions.size < num_bombs) {
    const rand_row = Math.floor(Math.random()*grid_size);
    const rand_col = Math.floor(Math.random()*grid_size);
    const rand_rc = `${rand_row},${rand_col}`;
    if (!bomb_positions.has(rand_rc)) {
      bomb_positions.add(rand_rc);
    }
  }
}

function reset_game_state() {
  // reset game state
  stop_timer({ restart: true });
  set_flag_countdown(num_bombs);
  flag_countdown = num_bombs;
  cells_left_to_reveal = grid_size * grid_size - num_bombs;
  game_state = not_started;
  document.getElementById('game-reset-button').classList = 'unpressed-smiley-face';
}

function initialise_game_board() {
  // initialise game board [][]
  generate_bomb_positions();
  create_2D_grid();
  // create elements
  initialise_actual_cells();
}

function new_game() {
  grid_size = game_config_for[difficulty].grid_size;
  num_bombs = game_config_for[difficulty].num_bombs;
  reset_game_state();
  initialise_game_board()
}

function toggle_flag_on_cell(cell, r, c) {
  if (!cell.classList.contains('hidden') || game_state === over) {
    return;
  }
  const isBomb = bomb_positions.has(`${r},${c}`);
  if (cell.classList.contains('flagged')) {
    cell.classList.remove('flagged');
    flag_countdown += 1;
    set_flag_countdown(flag_countdown);
    if (isBomb) {
      bombs_left += 1;
    }
  } else {
    cell.classList.add('flagged');
    flag_countdown -= 1;
    set_flag_countdown(flag_countdown);
    if (isBomb) {
      bombs_left -= 1;
    }
  }
}

function initialise_actual_cells() {
  const cell_grid_container = document.getElementById('cell-grid-container');
  // remove all child elements before initialise new cells
  while (cell_grid_container.lastElementChild) {
    cell_grid_container.removeChild(cell_grid_container.lastElementChild);
  }

  const cell_grid = document.createElement('div');
  cell_grid_container.appendChild(cell_grid);
  for (let r = 0; r < grid_size; r++) {
    const grid_row = document.createElement('div');
    grid_row.className = 'grid-row';
    for (let c = 0; c < grid_size; c++) {
      const cell = document.createElement('div');
      board[r][c].cell = cell;
      cell.className = 'cell hidden';
      if (is_bomb(r, c)) {
        bomb_cells.push(cell);
      }
      // handle left click
      cell.addEventListener('click', () => {
        onmove(cell, r, c);
      });
      // handle right click
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggle_flag_on_cell(cell, r, c);
        return false;
      })
      grid_row.appendChild(cell);
    }
    cell_grid.appendChild(grid_row);
  }
}

function set_flag_countdown(num) {
  // flag_countdown = num_bombs;
  const padded_num = num.toString().padStart(3, '0');
  const num_array = padded_num.split('');
  document.getElementById('bombs-left-ones').className = `score-digit digit-num${num_array[2]}`
  document.getElementById('bombs-left-tens').className = `score-digit digit-num${num_array[1]}`
  document.getElementById('bombs-left-hundreds').className = `score-digit digit-num${num_array[0]}`
}

function set_timer(num) {
  timer = num;
  let padded_num = num.toString().padStart(3, '0');
  if (padded_num.length > 3) {
    padded_num = padded_num.slice(-3);
  }
  const num_array = padded_num.split('');
  document.getElementById('timer-ones').className = `score-digit digit-num${num_array[2]}`
  document.getElementById('timer-tens').className = `score-digit digit-num${num_array[1]}`
  document.getElementById('timer-hundreds').className = `score-digit digit-num${num_array[0]}`
}

function start_timer() {
  if (!timer_interval) {
    timer_interval = setInterval(() => {
      set_timer(timer + 1);
    }, 1000)
  }
}

function stop_timer(param = { restart: false }) {
  const { restart } = param;
  if (timer_interval) {
    clearInterval(timer_interval);
  }
  if (restart) {
    timer_interval = null;
    set_timer(0)
  }
}

function game_over() {
  // display all bombs
  game_state = over;
  document.getElementById('game-reset-button').classList = 'lost-smiley-face';
  bomb_cells.forEach((cell) => {
    if (!cell.classList.contains('mine') && !cell.classList.contains('red_mine')) {
      cell.classList.add('mine');
    }
  })
  stop_timer();
}

function is_game_won() {
  return cells_left_to_reveal === 0;
}

function game_won() {
  // flag all bombs
  // change smiley face to sun glasses
  game_state = over;
  document.getElementById('game-reset-button').classList = 'victory-smiley-face';
  bomb_cells.forEach((cell) => {
    if (!cell.classList.contains('flagged')) {
      cell.classList.add('flagged');
    }
  })
  // flag all bombs
  // disable all click
  stop_timer();
}

function is_valid_cell(r,c) {
  if (r < 0 || c < 0 || r >= grid_size || c >= grid_size) {
    return false;
  }
  return true;
}

function reveal_cell(r, c) {
  if (!is_valid_cell(r,c)) {
    return;
  }
  const bfs_array = [[r,c]];
  const searched = new Set();
  while (bfs_array.length > 0) {
    const [cell_row, cell_col] = bfs_array.shift();
    const cell_id = `${cell_row},${cell_col}`;
    if (searched.has(cell_id) || !is_valid_cell(cell_row, cell_col)) {
      continue;
    }
    searched.add(cell_id);
    const { cell, bomb_no } = board[cell_row][cell_col];
    if (!cell.classList.contains('hidden')) {
      continue;
    }
    cell.classList.remove('hidden');
    cell.classList.add(`cell-num${bomb_no}`);
    cells_left_to_reveal -= 1;
    if (bomb_no === 0) {
      surrounding_displacements.forEach((pos) => {
        const next_row = cell_row + pos[0];
        const next_col = cell_col + pos[1];
        if (!searched.has(`${next_row},${next_col}`)) {
          bfs_array.push([next_row,next_col]);
        }
      })
    }
  }
}

function onmove(cell, r, c) {
  if (game_state === over) {
    return;
  }
  if (game_state === not_started) {
    start_timer();
  }
  if (is_flagged(cell) || is_revealed(cell)) {
    return;
  }
  if (is_bomb(r,c)) {
    cell.classList.add('mine_red');
    game_over();
    return;
  }
  reveal_cell(r, c);
  if (is_game_won()) {
    game_won();
  }
}

function init_game_reset_button() {
  // init difficulty
  const difficulty_btn = document.getElementById('difficulty-btn');
  const difficulty_options = document.getElementById('difficulty-options');
  difficulty_btn.addEventListener('click', () => {
    difficulty_options.classList.remove('hide-level-options');
  })
  difficulty_levels.forEach((level) => {
    const option = document.createElement('div');
    option.innerText = level;
    option.className = 'level-option'
    option.addEventListener('click', () => {
      difficulty = level;
      difficulty_options.classList.add('hide-level-options');
      new_game();
    })
    difficulty_options.appendChild(option);
  })
  // init game reset button
  const game_reset_btn = document.getElementById('game-reset-button');
  game_reset_btn.addEventListener('click', () => {
    new_game(difficulty);
  });
  game_reset_btn.addEventListener('mousedown', () => {
    game_reset_btn.classList = 'pressed-smiley-face';
  })
  game_reset_btn.addEventListener('mouseup', () => {
    game_reset_btn.classList = 'unpressed-smiley-face';
  })
}

// GAME LOGIC
init_game_reset_button();
new_game();

// Do everything before creating the real elements!
// generate board 2D array
// generate bomb positions
// generate score
// then initialise actual grid element

// Possible enhancements
// - allow user to select difficulty
