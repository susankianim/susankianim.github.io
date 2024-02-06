(() => {
  // formula.js
  var Formula = class {
    constructor(latexStr) {
      this.latexStr = latexStr;
      this.operators = ["\\neg", "\\wedge", "\\vee", "\\rightarrow"];
      this.operatorsPrecedence = {
        "\\neg": 4,
        "\\wedge": 3,
        "\\vee": 2,
        "\\rightarrow": 1
      };
      this.numberOfOperands = {
        "\\neg": 1,
        "\\wedge": 2,
        "\\vee": 2,
        "\\rightarrow": 2
      };
    }
    isWellFormed() {
      let statement = this.tokenize();
      let atoms = [...new Set(statement.filter((x) => !this.operators.includes(x)))];
      let grammer = {
        E: [["EArrow", "E"], ["EOr", "E"], ["EAnd", "E"], ["Not", "E"], ["OpenE", "Close"], atoms],
        EArrow: [["E", "Arrow"]],
        EOr: [["E", "Or"]],
        EAnd: [["E", "And"]],
        OpenE: [["Open", "E"]],
        Arrow: [["\\rightarrow"]],
        Or: [["\\vee"]],
        And: [["\\wedge"]],
        Not: [["\\neg"]],
        Open: [["("]],
        Close: [[")"]]
      };
      let n = statement.length;
      let table = [...Array(n)].map(() => [...Array(n)].map(() => []));
      for (let i = 0; i < n; i++) {
        for (let A of Object.keys(grammer)) {
          if (grammer[A].some((x) => x.includes(statement[i]))) {
            table[i][i].push(A);
          }
        }
      }
      for (let l = 1; l < n; l++) {
        for (let i = 0; i < n - l; i++) {
          let j = i + l;
          for (let k = i; k < j; k++) {
            for (let rule of Object.entries(grammer)) {
              let A = rule[0];
              for (let [B, C] of rule[1]) {
                if (table[i][k].includes(B) && table[k + 1][j].includes(C)) {
                  table[i][j].push(A);
                }
              }
            }
          }
        }
      }
      return table[0][n - 1].includes(Object.keys(grammer)[0]);
    }
    tokenize() {
      let str = this.latexStr.replace(/\s/g, "").replaceAll("\\neg", "\xAC").replaceAll("\\wedge", "\u2227").replaceAll("\\vee", "\u2228").replaceAll("\\rightarrow", "\u27F6");
      const symbol = {
        "\xAC": "\\neg",
        "\u2227": "\\wedge",
        "\u2228": "\\vee",
        "\u27F6": "\\rightarrow"
      };
      let arr = str.split("").map((x) => symbol[x] ? symbol[x] : x);
      return arr;
    }
    lessPrecedence(op1, op2) {
      if (op2 == "(")
        return false;
      return this.operatorsPrecedence[op1] < this.operatorsPrecedence[op2];
    }
    postfix() {
      if (!this.isWellFormed())
        throw new Error("This is not a well-formed formula.");
      let tokensArr = this.tokenize(this.latexStr);
      let operatorsStack = [];
      let output = [];
      for (let i = 0; i < tokensArr.length; i++) {
        let token = tokensArr[i];
        if (this.operators.includes(token)) {
          let topStack;
          while ((topStack = operatorsStack[operatorsStack.length - 1]) && this.lessPrecedence(token, topStack)) {
            output.push(operatorsStack.pop());
          }
          operatorsStack.push(token);
        } else if (token == "(") {
          operatorsStack.push(token);
        } else if (token == ")") {
          let topStack;
          while ((topStack = operatorsStack[operatorsStack.length - 1]) && topStack != "(") {
            output.push(operatorsStack.pop());
          }
          operatorsStack.pop();
        } else {
          output.push(token);
        }
      }
      while (operatorsStack.length != 0) {
        output.push(operatorsStack.pop());
      }
      return output;
    }
    getParseTree() {
      let tokensArr = this.postfix();
      let termStack = [];
      for (let i = 0; i < tokensArr.length; i++) {
        let token = tokensArr[i];
        let node = {
          symbol: token,
          children: []
        };
        for (let j = 0; j < this.numberOfOperands[token]; j++) {
          node.children.unshift(termStack.pop());
        }
        termStack.push(node);
      }
      return termStack[0];
    }
    getCnfFormula() {
      let cnf = this.CNF();
      return getFormula_(cnf);
      function getFormula_(node) {
        if (node.symbol == "\\vee") {
          return "(" + getFormula_(node.children[0]) + " \\vee " + getFormula_(node.children[1]) + ")";
        } else if (node.symbol == "\\rightarrow") {
          return "(" + getFormula_(node.children[0]) + " \\rightarrow " + getFormula_(node.children[1]) + ")";
        } else if (node.symbol == "\\wedge") {
          return "(" + getFormula_(node.children[0]) + " \\wedge " + getFormula_(node.children[1]) + ")";
        } else if (node.symbol == "\\neg") {
          return " \\neg " + getFormula_(node.children[0]);
        } else {
          return node.symbol;
        }
      }
    }
    implFree() {
      let tree = this.getParseTree();
      return implFree_(tree);
      function implFree_(node) {
        if (node.symbol == "\\rightarrow") {
          return {
            symbol: "\\vee",
            children: [
              {
                symbol: "\\neg",
                children: [implFree_(node.children[0])]
              },
              implFree_(node.children[1])
            ]
          };
        } else if (node.symbol == "\\vee") {
          return {
            symbol: "\\vee",
            children: [
              implFree_(node.children[0]),
              implFree_(node.children[1])
            ]
          };
        } else if (node.symbol == "\\wedge") {
          return {
            symbol: "\\wedge",
            children: [
              implFree_(node.children[0]),
              implFree_(node.children[1])
            ]
          };
        } else if (node.symbol == "\\neg") {
          return {
            symbol: "\\neg",
            children: [
              implFree_(node.children[0])
            ]
          };
        } else {
          return node;
        }
      }
    }
    NNF() {
      let implFreeTree = this.implFree();
      return NNF_(implFreeTree);
      function NNF_(node) {
        if (node.symbol == "\\neg" && node.children[0].symbol == "\\neg") {
          return NNF_(node.children[0].children[0]);
        } else if (node.symbol == "\\wedge") {
          return {
            symbol: "\\wedge",
            children: [
              NNF_(node.children[0]),
              NNF_(node.children[1])
            ]
          };
        } else if (node.symbol == "\\vee") {
          return {
            symbol: "\\vee",
            children: [
              NNF_(node.children[0]),
              NNF_(node.children[1])
            ]
          };
        } else if (node.symbol == "\\neg" && node.children[0].symbol == "\\wedge") {
          return {
            symbol: "\\vee",
            children: [
              NNF_({
                symbol: "\\neg",
                children: [
                  NNF_(node.children[0].children[0])
                ]
              }),
              NNF_({
                symbol: "\\neg",
                children: [
                  NNF_(node.children[0].children[1])
                ]
              })
            ]
          };
        } else if (node.symbol == "\\neg" && node.children[0].symbol == "\\vee") {
          return {
            symbol: "\\wedge",
            children: [
              NNF_({
                symbol: "\\neg",
                children: [
                  NNF_(node.children[0].children[0])
                ]
              }),
              NNF_({
                symbol: "\\neg",
                children: [
                  NNF_(node.children[0].children[1])
                ]
              })
            ]
          };
        } else {
          return node;
        }
      }
    }
    CNF() {
      let nnfTree = this.NNF();
      return CNF_(nnfTree);
      function CNF_(node) {
        if (node.symbol == "\\wedge") {
          return {
            symbol: "\\wedge",
            children: [
              CNF_(node.children[0]),
              CNF_(node.children[1])
            ]
          };
        } else if (node.symbol == "\\vee") {
          return distr(CNF_(node.children[0]), CNF_(node.children[1]));
        } else {
          return node;
        }
      }
      function distr(node1, node2) {
        {
          if (node1.symbol == "\\wedge") {
            return {
              symbol: "\\wedge",
              children: [
                distr(node1.children[0], node2),
                distr(node1.children[1], node2)
              ]
            };
          } else if (node2.symbol == "\\wedge") {
            return {
              symbol: "\\wedge",
              children: [
                distr(node1, node2.children[0]),
                distr(node1, node2.children[1])
              ]
            };
          } else {
            return {
              symbol: "\\vee",
              children: [node1, node2]
            };
          }
        }
      }
    }
  };

  // app.js
  function solve(latexStr) {
    try {
      let f = new Formula(latexStr);
      let isWellFormed = f.isWellFormed();
      let cnfFormula;
      if (isWellFormed) {
        cnfFormula = f.getCnfFormula();
      }
      return { isWellFormed, cnfFormula };
    } catch (error) {
      console.log(error);
    }
  }
  function update({ isWellFormed, cnfFormula }) {
    try {
      let isWellFormedContainer = document.getElementById("isWellFormed-container");
      if (isWellFormed) {
        isWellFormedContainer.innerHTML = "This formula is well-formed, and here is it's CNF:";
        let cnfFormulaContainer = document.getElementById("cnfFormula-container");
        cnfFormulaContainer.innerHTML = cnfFormula;
      } else {
        isWellFormedContainer.innerHTML = "This formula is not well-formed.";
      }
    } catch (e) {
      console.log(e);
    }
  }
  window.addEventListener("load", (event) => {
    let form = document.querySelector("#frmMain");
    form.addEventListener("submit", (event2) => {
      try {
        let latexStr = form.latexStr.value;
        let { isWellFormed, cnfFormula } = solve(latexStr);
        update({ isWellFormed, cnfFormula });
      } catch (e) {
        console.log(e);
      }
    });
  });
})();
