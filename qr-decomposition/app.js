(() => {
  // logic/matrix-utilities/utility.js
  function identityMatrix(n) {
    const identityMatrix2 = [];
    for (let i = 0; i < n; i++) {
      identityMatrix2.push([]);
      for (let j = 0; j < n; j++) {
        identityMatrix2[i][j] = i === j ? 1 : 0;
      }
    }
    return identityMatrix2;
  }
  function norm2(x) {
    let norm = 0;
    for (let minor of x)
      norm += minor ** 2;
    norm = Math.sqrt(norm);
    return norm;
  }
  function transpose(A) {
    let B = [];
    for (let i = 0; i < A[0].length; i++) {
      B[i] = [];
      for (let j = 0; j < A.length; j++)
        B[i][j] = A[j][i];
    }
    return B;
  }
  function sum(A, B) {
    let C = [];
    for (let i = 0; i < A.length; i++) {
      C[i] = [];
      for (let j = 0; j < A[0].length; j++)
        C[i][j] = A[i][j] + B[i][j];
    }
    return C;
  }
  function product(A, B) {
    let C = [];
    for (let i = 0; i < A.length; i++) {
      C[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let minor = 0;
        for (let k = 0; k < A[0].length; k++)
          minor += A[i][k] * B[k][j];
        C[i][j] = minor;
      }
    }
    return C;
  }
  function scalarProduct(c, A) {
    let B = [];
    for (let i = 0; i < A.length; i++) {
      B[i] = [];
      for (let j = 0; j < A[0].length; j++)
        B[i][j] = c * A[i][j];
    }
    return B;
  }
  function orthogonalization(vectors_) {
    let vectors = vectors_.map((vector) => [vector]);
    let OrthogonalVectors = [];
    for (let vector of vectors) {
      let newU = vector;
      for (let u of OrthogonalVectors) {
        let temp = scalarProduct(product(vector, transpose(u))[0] / product(u, transpose(u))[0], u);
        newU = sum(newU, scalarProduct(-1, temp));
      }
      OrthogonalVectors.push(newU);
    }
    OrthogonalVectors = OrthogonalVectors.map((v) => v[0]);
    return OrthogonalVectors;
  }
  function unify(x) {
    let norm2X = norm2(x);
    let unified = x.map((minor) => minor / norm2X);
    return unified;
  }

  // logic/Householder-QR-decomposition/main.js
  function QRDecomposition(matrix) {
    let n = matrix.length;
    let R = scalarProduct(1, matrix);
    let Q = identityMatrix(n);
    for (let i = 0; i < n - 1; i++) {
      let d = [];
      for (let j = i; j < n; j++)
        d.push(R[j][i]);
      let S = Math.sqrt(d.reduce((sum2, x) => sum2 + x ** 2, 0)) * (d[0] > 0 ? -1 : 1);
      let v0 = Math.sqrt(1 / 2 * (1 - d[0] / S));
      let b = -S * v0;
      let v = [[v0]];
      for (let j = 1; j < n - i; j++)
        v.push([d[j] / (2 * b)]);
      v.unshift(...new Array(i).fill([0]));
      let vvt = product(v, transpose(v));
      let Pi = sum(identityMatrix(n), scalarProduct(-2, vvt));
      R = product(Pi, R);
      Q = product(Q, Pi);
    }
    return [Q, R];
  }

  // logic/Gram-Schmidt-QR-decomposition/main.js
  function QRDecomposition2(A_) {
    let A = A_;
    let n = A.length;
    let Q = transpose(orthogonalization(transpose(A)).map((v) => unify(v)));
    let R = [];
    for (let i = 0; i < n; i++) {
      R[i] = [];
      for (let j = 0; j < n; j++) {
        if (j >= i)
          R[i][j] = product([transpose(A)[j]], transpose([transpose(Q)[i]]))[0][0];
        else
          R[i][j] = 0;
      }
    }
    return [Q, R];
  }

  // app.js
  window.addEventListener("load", (event) => {
    let dimentionButton = document.querySelector(
      ".linear-system__dimention-btn"
    );
    let dimentionInput = document.querySelector(
      ".linear-system__dimention-input"
    );
    let form = document.querySelector("#frmMain");
    let rowContainer = document.querySelectorAll(".linear-system__matrix");
    let resultRowContainer = document.querySelectorAll(".result-container");
    let inputs;
    let dim = [0, 0, 0];
    dimentionButton.addEventListener("click", () => {
      const dimValue = Number(dimentionInput.value);
      dim = new Array(dimValue).fill(0);
      rowContainer[0].innerHTML = "";
      rowContainer[0].insertAdjacentHTML(
        "beforeend",
        dim.map(
          (_, i) => `<div class="linear-system__matrix-row">${dim.map(
            (_2, j) => `<input class="linear-system__matrix-input" type="text" />`
          ).join("")}</div>`
        ).join("")
      );
      inputs = document.querySelectorAll(".linear-system__matrix-input");
    });
    form.addEventListener("submit", (event2) => {
      let inputs2 = event2.target.querySelectorAll("input");
      inputs2 = Array.from(inputs2);
      let matrix = inputs2.slice(0, -2);
      let buttons = inputs2.slice(-2);
      buttons.forEach((input) => input.classList.remove("selected"));
      event2.submitter.classList.add("selected");
      let matrixInput = [];
      for (let i = 0; i < dim.length; i++) {
        matrixInput[i] = [];
        for (let j = 0; j < dim.length; j++) {
          matrixInput[i][j] = Number(matrix[i * dim.length + j].value);
        }
      }
      const [Q, R] = event2.submitter.id === "gramschmidt-btn" ? QRDecomposition(matrixInput) : QRDecomposition2(matrixInput);
      insertMatrixToDOM(Q, resultRowContainer[0]);
      insertMatrixToDOM(R, resultRowContainer[1]);
      let outputs = document.querySelectorAll(
        ".linear-system__matrix-output"
      );
    });
  });
  function insertMatrixToDOM(matrix, matrixContainer) {
    matrixContainer.classList.add("linear-system__matrix");
    matrixContainer.innerHTML = "";
    matrixContainer.insertAdjacentHTML(
      "beforeend",
      matrix.map(
        (_, i) => `<div class="linear-system__matrix-row">${matrix[0].map(
          (_2, j) => `<div class="linear-system__matrix-output">${matrix[i][j].toFixed(5)}</div>`
        ).join("")}</div>`
      ).join("")
    );
  }
})();
