var square_width = 120;
var grid = [];
var screen_height = 600;
var screen_width = 720;
var total_rows = screen_height / square_width;
var total_cols = screen_width / square_width;

class Square {
  //clickable walls
  constructor(row_num, col_num, ypos, xpos, width) {
    this.row_num = row_num;
    this.col_num = col_num;
    this.width = width;
    this.xpos = xpos;
    this.ypos = ypos;
    this.square = false;
    this.walls = {
      Top: [
        createVector(this.xpos, this.ypos),
        createVector(this.xpos + this.width, this.ypos),
      ],
      Right: [
        createVector(this.xpos + this.width, this.ypos),
        createVector(this.xpos + this.width, this.ypos + this.width),
      ],
      Bottom: [
        createVector(this.xpos, this.ypos + this.width),
        createVector(this.xpos + this.width, this.ypos + this.width),
      ],
      Left: [
        createVector(this.xpos, this.ypos),
        createVector(this.xpos, this.ypos + this.width),
      ],
    };
  }

  toggle(walls) {
    var direction_bool = {
      Top: false,
      Right: false,
      Bottom: false,
      Left: false,
    };

    var to_be_removed = [];

    if (this.square == false) {
      this.square = true;
    } else {
      this.square = false;
    }

    for (let wall of walls) {
      for (var direction in this.walls) {
        if (
          wall[0].equals(this.walls[direction][0]) &&
          wall[1].equals(this.walls[direction][1])
        ) {
          to_be_removed.push(wall);
          direction_bool[direction] = true;
        }
      }
    }

    for (var direction in direction_bool) {
      if (direction_bool[direction] == false) {
        walls.push(this.walls[direction]);
      }
    }

    for (let wall of to_be_removed) {
      var index = walls.indexOf(wall);
      walls.splice(index, 1);
    }
  }

  toggle_square() {
    if (this.square == true) {
      push();
      fill(0);
      noStroke();
      square(this.xpos, this.ypos, this.width);
      pop();
    } else {
      push();
      noStroke();
      fill(255);
      square(this.xpos + 2, this.ypos + 2, this.width - 4);
      push();
      strokeWeight(4);
      fill(100, 100, 200);
      square(this.xpos + 8, this.ypos + 8, this.width - 16);
      pop();
      pop();
    }
  }
}

function create_grid(grid, square_width, total_rows, total_cols) {
  for (let i = 0; i < total_rows; i++) {
    grid.push([]);
    for (let j = 0; j < total_cols; j++) {
      let new_square = new Square(
        i,
        j,
        i * square_width,
        j * square_width,
        square_width
      );
      grid[i].push(new_square);
      if (i == total_rows - 1 || j == total_cols - 2 || i == 0) {
        new_square.toggle(walls);
      }
    }
  }
}

function repopulate_path(population_size, fitness_array, agent_array, nn) {
  //genetic algorithm functions
  var x_position = square_width / 2;
  var y_position = height - square_width / 2;

  for (let i = 0; i < population_size; i++) {
    organism = new Organism(x_position, y_position);
    if (nn !== null) {
      organism.neuralnetwork = nn[i];
    }

    organism.show();
    agent_array.push(organism);

    fitness_array[0].push(organism);
    fitness_array[1].push(0);
  }
}

function crossover_mutate(parents, population_size, success_num) {
  let overall_prob = 0.06;
  let rate_of_change = 0.96;

  let prob_mutate = overall_prob * Math.pow(rate_of_change, success_num);
  if (prob_mutate < 0.007) {
    prob_mutate = 0.007;
  }
  //prob_mutate = 0.04;
  console.log(prob_mutate);
  //crossover both weight and bias matrices
  //mutates each one and creates and returns new array of neural networks
  //crossover weights

  let weights_biases = [[], []];
  let index = 0;

  for (let parent of parents) {
    weights_biases[index].push(parent.neuralnetwork.weights_ho);
    weights_biases[index].push(parent.neuralnetwork.weights_ih);
    weights_biases[index].push(parent.neuralnetwork.bias_h);
    weights_biases[index].push(parent.neuralnetwork.bias_o);
    index++;
  }

  let org_nns = []; //array of neural networks
  for (let l = 0; l < population_size; l++) {
    let nn_matrices = [];
    let temp_nn = new NeuralNetwork(
      parents[0].neuralnetwork.input,
      parents[0].neuralnetwork.hidden,
      parents[0].neuralnetwork.output
    );
    for (let k = 0; k < weights_biases[0].length; k++) {
      let num_rows = weights_biases[0][k].rows;
      let num_cols = weights_biases[0][k].cols;

      let random_row = floor(random(num_rows));
      let random_col = floor(random(num_cols));

      let current = weights_biases[0][k];
      let new_arr = [];
      let new_matrix = new Matrix(current.rows, current.cols);

      for (let i = 0; i < weights_biases[0][k].rows; i++) {
        new_arr.push([]);
        for (let j = 0; j < weights_biases[0][k].cols; j++) {
          if (i == random_row && j == random_col) {
            current = weights_biases[1][k];
          }
          let rand = random(1);
          if (rand < prob_mutate) {
            new_arr[i].push(random(-1, 1));
          } else {
            new_arr[i].push(current.matrix[i][j]);
          }
        }
      }

      new_matrix.arrayToMatrix(new_arr);

      nn_matrices.push(new_matrix); // array containing arrays of 4 matrix objects; weights_ho,weights_ih, bias_h, bias_o
    }
    temp_nn.weights_ho = nn_matrices[0];
    temp_nn.weights_ih = nn_matrices[1];
    temp_nn.bias_h = nn_matrices[2];
    temp_nn.bias_o = nn_matrices[3];

    org_nns.push(temp_nn);
  }

  return org_nns;
}

function pick_parents(fitness_values) {
  var max = fitness_values[1].reduce(function (a, b) {
    return Math.max(a, b);
  });

  var index = fitness_values[1].indexOf(max);
  var parent1 = fitness_values[0][index];
  fitness_values[1][index] = 0;
  max = fitness_values[1].reduce(function (a, b) {
    return Math.max(a, b);
  });
  index = fitness_values[1].indexOf(max);
  var parent2 = fitness_values[0][index];

  var parents = [parent1, parent2];

  console.log("New generation parents chosen");
  return parents;
}

var agents = [];
var walls = [];

var fitness_values = [[], []];
var highest_fitness = 0;
var lowest_fitness = 100;
var temp_fitness = [[], []];

var time = 0;
var max_gen_time = 400;
const total_population = 70;
var total_fitness = 0;

var goal;
var start;
var initial_distance;
var alive_arr = [];

var pause = false;
var reset = false;

function setup() {
  //SETUP

  createCanvas(screen_width + square_width + 50, screen_height);
  frameRate(70);
  goal = createVector(width - ((3 * square_width) / 2 + 50), square_width / 2);
  start = createVector(square_width / 2, height - square_width / 2);
  initial_distance = goal.dist(start);

  push();
  square(screen_width - square_width, 0, square_width);

  pop();

  console.log("initial distance", initial_distance);

  create_grid(grid, square_width, total_rows, total_cols);

  repopulate_path(total_population, temp_fitness, agents, null);

  var a = createVector(0, 0);
  var b = createVector(width, 0);
  var c = createVector(width, height);
  var d = createVector(0, height);
  walls.push([a, b]);
  walls.push([b, c]);
  walls.push([c, d]);
  walls.push([d, a]);
}

function draw() {
  //DRAW
  if (!pause) {
    time += 1;
  }

  background(0);

  for (let i = 0; i < total_rows; i++) {
    for (let j = 0; j < total_cols; j++) {
      grid[i][j].toggle_square(walls);
    }
  }
  push();
  fill(100, 200, 100);
  strokeWeight(5);
  stroke(255);
  square(screen_width - (square_width - 2), 2, square_width - 5, 10);
  pop();
  push();
  textSize(30);
  fill(120, 255, 120);
  text("GOAL", screen_width - (square_width - 17), 70);
  pop();
  push();
  fill(200, 100, 100);
  stroke(255);
  strokeWeight(5);
  square(2, screen_height - (square_width - 2), square_width - 5, 10);
  pop();
  push();
  textSize(30);
  fill(255, 120, 120);
  text("START", 12, screen_height - (square_width - 70));
  pop();

  for (i = 0; i < agents.length; i++) {
    if (pause) {
      agents[i].speed = 0;
    } else {
      agents[i].speed = 1.3;
    }
    if (agents[i].fitness > highest_fitness) {
      highest_fitness = agents[i].fitness;
    }

    show_highest_fitness = highest_fitness.toFixed(1);

    show_total_fitness = total_fitness.toFixed(1);
    fill(180);
    square(screen_width, 0, 190);
    textSize(15);
    fill(255);
    text("Highest current fitness", screen_width + 10, 30);
    text(show_highest_fitness, screen_width + 10, 60);
    text("Total fitness", screen_width + 10, 90);
    text(show_total_fitness, screen_width + 10, 120);
    text("Time", screen_width + 10, 150);
    text(time + "/400", screen_width + 10, 180);

    agents[i].show();
    agents[i].update();
    agents[i].calculate_fitness(
      goal,
      initial_distance,
      grid,
      fitness_values,
      temp_fitness,
      agents
    );

    agents[i].sense(walls, fitness_values, agents, temp_fitness); //check ordering of these vars
    temp_fitness[1][i] = agents[i].fitness;
    if (!agents[i].alive && !alive_arr.includes(agents[i])) {
      alive_arr.push(agents[i]);
    }
    if (alive_arr.length == agents.length || time == max_gen_time) {
      highest_fitness = 0;
      lowest_fitness = 100;
      var found_goal = 0;
      fitness_values = temp_fitness;
      console.log("Fitness values:", fitness_values);
      total_fitness = 0;
      for (let fitness_value of fitness_values[1]) {
        if (fitness_value >= 30) {
          found_goal += 1;
        }
        total_fitness += fitness_value;
      }
      if (agents.length !== 0) {
        console.log("Number that found goal:", found_goal);
        agents = [];
      }
      if (!reset) {
        let parents = pick_parents(fitness_values);
        fitness_values = [[], []];
        let children_nn = crossover_mutate(
          parents,
          total_population,
          found_goal
        );

        temp_fitness = [[], []];
        repopulate_path(total_population, temp_fitness, agents, children_nn);
      } else {
        repopulate_path(total_population, temp_fitness, agents, null);
        reset = false;
      }

      time = 0;
      alive_arr = [];
    }
  }

  fill(180);
  noStroke();
  square(screen_width, 189, height - 190);
  textSize(15);

  if (pause) {
    push();
    fill(255);
    rect(screen_width + 40, 200, 75, 60, 10);
    translate(screen_width + 40 + 40, 200 + 30);
    fill(100);
    triangle(-20, -20, -20, 20, 20, 0);
    pop();
  } else if (!pause) {
    push();
    fill(0);
    rect(screen_width + 40, 200, 75, 60, 10);
    translate(screen_width + 40 + 36, 200 + 30);
    fill(255);
    rect(-20, -20, 18, 40);
    rect(3, -20, 18, 40);
    pop();
  }

  if (!reset) {
    fill(255);
    rect(screen_width + 30, 270, 100, 50, 10);
    fill(0);
    text("RESET NN", screen_width + 40, 300);
  } else {
    fill(0);
    rect(screen_width + 30, 270, 100, 50, 10);
    fill(255);
    text("RESET NN", screen_width + 40, 300);
  }
  fill(255);
  textSize(13);
  text(
    "*Reset all organism neural networks to random values. All learned behaviours will be discarded. Click on squares to toggle obstacles",
    screen_width + 20,
    330,
    150,
    150
  );
}

function mousePressed() {
  for (let i = 0; i < total_rows; i++) {
    for (let j = 0; j < total_cols; j++) {
      if (
        mouseX < grid[i][j].xpos + square_width &&
        mouseX > grid[i][j].xpos &&
        mouseY < grid[i][j].ypos + square_width &&
        mouseY > grid[i][j].ypos
      ) {
        var start;
        var end;
        if (i == total_rows - 1 && j == 0) {
          start = true;
        }
        if (i == 0 && j == total_cols - 1) {
          end = true;
        }
        if (!start && !end) {
          grid[i][j].toggle(walls);
        }
      }
    }
  }

  if (
    mouseX > screen_width + 40 &&
    mouseX < screen_width + 115 &&
    mouseY > 200 &&
    mouseY < 260
  ) {
    if (pause == false) {
      pause = true;
    } else {
      pause = false;
    }
  }
  if (
    mouseX > screen_width + 30 &&
    mouseX < screen_width + 130 &&
    mouseY > 270 &&
    mouseY < 320
  ) {
    if (reset == false) {
      reset = true;
    } else {
      reset = false;
    }
  }
}
