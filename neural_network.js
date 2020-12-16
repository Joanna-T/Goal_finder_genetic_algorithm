class Matrix {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.matrix = [];

    for (let i = 0; i < this.rows; i++) {
      //create matrix of zeros
      this.matrix.push([]);
      for (let j = 0; j < this.cols; j++) {
        this.matrix[i].push(0);
      }
    }
  }

  randomize(min, max) {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        this.matrix[i][j] = Math.random() * (max - min) + min;
      }
    }
  }

  multiply(x) {
    if (x instanceof Matrix) {
      if (this.cols !== x.rows) {
        console.log("columns of a must match rows of b");
        return undefined;
      }

      let result = new Matrix(this.rows, x.cols);
      for (let i = 0; i < result.rows; i++) {
        for (let j = 0; j < result.cols; j++) {
          let total = 0;
          for (let k = 0; k < this.matrix[i].length; k++) {
            total += this.matrix[i][k] * x.matrix[k][j];
          }

          result.matrix[i][j] = total;
        }
      }
      return result;
    } else if (typeof x === "number") {
      let result = new Matrix(this.rows, this.cols);
      let multiple;
      for (let i = 0; i < this.rows; i++) {
        //multiply by scalar value
        for (let j = 0; j < this.cols; j++) {
          multiple = this.matrix[i][j] * x;
          result.matrix[i].push(multiple);
        }
      }
      return result;
    }
  }

  add(x) {
    if (x instanceof Matrix) {
      if (this.cols !== x.cols || this.rows !== x.rows) {
        console.log("columns and rows of a must match columns and rows of b");
        return undefined;
      }
      let result = new Matrix(this.rows, this.cols);
      let added;
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          added = this.matrix[i][j] + x.matrix[i][j];
          result.matrix[i][j] = added;
        }
      }
      return result;
    } else if (typeof x === "number") {
      let result = new Matrix(this.rows, this.cols);
      let added;
      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          added = this.matrix[i][j] + x;
          result.matrix[i].push(added);
        }
      }
      return result;
    }
  }

  arrayToMatrix(x) {
    for (let i = 0; i < this.rows; i++) {
      //first make matrix with correct dimensions, then transform values to desired with array
      for (let j = 0; j < this.cols; j++) {
        this.matrix[i][j] = x[i][j];
      }
    }
  }

  mapit(func) {
    let result = new Matrix(this.rows, this.cols);
    let val;
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        val = func(this.matrix[i][j]);
        result.matrix[i][j] = val;
      }
    }
    return result;
  }
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function relu(x) {
  return Math.max(x, 0.5);
}

class NeuralNetwork {
  constructor(input, hidden, output) {
    this.input = input;
    this.hidden = hidden;
    this.output = output;

    this.weights_ih = new Matrix(this.hidden, this.input);
    this.weights_ho = new Matrix(this.output, this.hidden);
    this.weights_ih.randomize(-1, 1);
    this.weights_ho.randomize(-1, 1);
    this.bias_h = new Matrix(this.hidden, 1);
    this.bias_o = new Matrix(this.output, 1);
    this.bias_h.randomize(-0.5, 0.5);
    this.bias_o.randomize(-0.5, 0.5);
  }

  feedforward(input) {
    //expects matrix as input

    let hidden_output = this.weights_ih.multiply(input);
    hidden_output = hidden_output.add(this.bias_h);
    hidden_output = hidden_output.mapit(sigmoid);

    let final_output = this.weights_ho.multiply(hidden_output);
    final_output = final_output.add(this.bias_o);
    final_output = final_output.mapit(relu);

    //console.log("output", final_output);
    return final_output;
  }
}
