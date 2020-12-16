class Organism {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.angle = 0;
    this.velocity = createVector(0, 0);
    this.acceleration;
    this.size = 10;

    this.speed = 1.3;
    this.radian = 0.2; //turn rate

    this.sensors = [];
    this.sight = 82;
    for (let i = 0; i < 360; i += 20) {
      this.sensors.push(new Sensor(this.position, radians(i), this.sight));
    }
    this.walls = [
      [createVector(-this.size, this.size), createVector(this.size, this.size)],
      [createVector(this.size, this.size), createVector(0, -this.size)],
      [createVector(0, -this.size), createVector(-this.size, this.size)],
    ];

    this.neuralnetwork = new NeuralNetwork(this.sensors.length, 20, 1);
    this.fitness = 0;
    this.alive = true;
    this.visited = [];
  }

  show() {

    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle + PI / 2);
    fill(100, 100, 200, 190);
    stroke(255, 255, 255, 190);
    strokeWeight(3.0);
    strokeCap(ROUND);
    triangle(
      this.walls[0][0].x,
      this.walls[0][0].y,
      this.walls[1][0].x,
      this.walls[1][0].y,
      this.walls[2][0].x,
      this.walls[2][0].y
    );

    pop();
  }

  forward() {
    if (this.alive) {
      var force = p5.Vector.fromAngle(this.angle);
      this.velocity.add(force);
      this.velocity.mult(this.speed);
    }
  }

  turn(direction) {
    if (direction == "left") {
      this.angle -= this.radian;
    }
    if (direction == "right") {
      this.angle += this.radian;
    }
  }

  sense(walls, fitness_vals, agents, temp_fitness) {
    let self = this;
    let nn_input = new Matrix(this.sensors.length, 1);

    var dead = false;

    for (let i = 0; i < this.sensors.length; i++) {
      let sensor = this.sensors[i];
      let closest_point = null;
      let record = this.sight;
      let normalize = null;

      for (let wall of walls) {
        //checks distance to each wall.

        var intersecting_point = sensor.intersect(wall);
        if (intersecting_point) {
          var distance = p5.Vector.dist(self.position, intersecting_point);
          if (distance < record && distance < self.sight) {
            record = distance;
            closest_point = intersecting_point;
            normalize = 1 - distance / this.sight;
          }
        }
      }

      if (record < self.size / 2) {
        this.speed = 0;
        this.alive = false;

        // check if too close to wall and to account for frame rate
      }

      nn_input.matrix[i][0] = normalize;
    }


    this.think(nn_input);
  }

  delete(agents, fitness_vals, temp_fitness) {

    let self = this;

    this.alive = false;

    for (let i = 0; i < agents.length; i++) {
      if (agents[i] == self) {
        agents.splice(i, 1);
        let agent = temp_fitness[0].splice(i, 1);
        let agent_fitness = temp_fitness[1].splice(i, 1);

        fitness_vals[0].push(agent[0]);
        fitness_vals[1].push(agent_fitness[0]);

        break;
      }
    }
  }

  think(input) {
    let self = this;
    var output = self.neuralnetwork.feedforward(input);

    let mapped = output.matrix[0][0] * 2 * PI;

    self.angle = mapped;
    self.forward();
  }

  calculate_fitness(
    goal,
    initial_distance,
    grid,
    fitness_vals,
    temp_fitness,
    agents
  ) {
    var d = goal.dist(this.position);
    var difference = initial_distance - d;

    for (let i = 0; i < total_rows; i++) {
      for (let j = 0; j < total_cols; j++) {
        let x_end = grid[i][j].xpos + grid[i][j].width;
        let y_end = grid[i][j].ypos + grid[i][j].width;
        if (
          this.position.x < x_end &&
          this.position.x > grid[i][j].xpos &&
          this.position.y < y_end &&
          this.position.y > grid[i][j].ypos
        ) {
          if (i == 0 && j == 5) {
            this.fitness = 30;
            this.speed = 0;
            this.alive = false;
          } else if (!this.visited.includes(grid[i][j])) {
            this.visited.push(grid[i][j]);

            this.fitness += this.visited.length * 0.1;
          }
        }
      }
    }
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.mult(0.6);
  }
}

class Sensor {
  
  constructor(position, angle, length) {
    this.position = position;
    this.direction = p5.Vector.fromAngle(angle);
    this.length = length;
  }

  show() {
    push();
    stroke(255);
    translate(this.position.x, this.position.y);
    line(0, 0, this.direction.x * this.length, this.direction.y * this.length);
    pop();
  }

  intersect(object_wall) {
    //check if two lines intersect
    var x1 = object_wall[0].x;
    var y1 = object_wall[0].y;
    var x2 = object_wall[1].x;
    var y2 = object_wall[1].y;

    var x3 = this.position.x;
    var y3 = this.position.y;
    var x4 = this.position.x + this.direction.x * this.length;
    var y4 = this.position.y + this.direction.y * this.length;

    var den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (den == 0) {
      //checks if lines are parallel ie dont intersect
      return null;
    }

    var t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;

    var u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    if (t > 0 && t < 1 && u > 0 && u < 1) {
      //test values for intersection (finite line and infinite line)
      let intersecting_point = createVector();
      intersecting_point.x = x1 + t * (x2 - x1);
      intersecting_point.y = y1 + t * (y2 - y1);
    
      return intersecting_point;
    } else {
      return;
    }
  }
}
