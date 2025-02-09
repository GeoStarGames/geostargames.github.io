class FlowLibCompiler {
    constructor() {
      this.libraries = {}; // Stores all libraries
      this.name = "";
    }
  
    compile(code) {
      const lines = code.split("\n").map(line => line.trim()).filter(line => line);
      if (lines[0] !== "#comp lib25") {
        throw new Error("Invalid library file. Must start with '#comp lib25'.");
      }
  
      let currentLibrary = null;
      let currentFunction = null;
  
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const tokens = line.split(" ");
  
        switch (tokens[0]) {
          case "create":
            currentLibrary = tokens[1];
            this.name = tokens[1];
            this.libraries[currentLibrary] = {};
            break;
          case "add":
            currentFunction = tokens[1];
            this.libraries[currentLibrary][currentFunction] = {
              args: [],
              code: [],
            };
            break;
          case "arg":  // Changed from arg1/arg2 to generic arg
            if (currentFunction) {
              this.libraries[currentLibrary][currentFunction].args.push(tokens[1]);
            }
            break;
          case "end":
            currentFunction = null;
            break;
          default:
            if (currentFunction) {
              this.libraries[currentLibrary][currentFunction].code.push(line);
            }
            break;
        }
      }

      return this.name;
    }
  
    getLibrary(name) {
      return this.libraries[name];
    }
  }