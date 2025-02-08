class Flow25Compiler {
    constructor() {
        this.variables = {};
        this.labels = {};
        this.outputText = "";
        this.isRunning = false;
        this.canvas = document.getElementById("output-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.textOutput = document.getElementById("text-output");
        this.currentLine = 1; // Start at line 1 to skip "#comp x8_mod"
        this.lines = [];
        this.callStack = []; // Add a call stack for function calls
    }

    compile(code) {
        this.variables = {};
        this.labels = {};
        this.outputText = "";
        this.textOutput.innerText = "";
        this.currentLine = 1; // Skip "#comp x8_mod" line
        this.lines = code.split("\n").map(line => line.trim()).filter(line => line);
        this.isRunning = true;

        if (this.lines[0] !== "#comp x8_mod") {
            this.output("Error: First line must be '#comp x8_mod'");
            return;
        }

        this.parseLabels();
        this.executeCodeAsync();
    }

    parseLabels() {
        this.lines.forEach((line, index) => {
            if (line.startsWith("label ")) {
                const labelName = line.split(" ")[1];
                this.labels[labelName] = index;
            }
        });
    }

    executeCodeAsync() {
        if (!this.isRunning || this.currentLine >= this.lines.length) {
            this.output("Program exited successfully.");
            return;
        }

        const line = this.lines[this.currentLine];
        const tokens = line.split(" ");

        // Skip labels during execution (they're already parsed)
        if (line.startsWith("label ")) {
            this.currentLine++;
            setTimeout(() => this.executeCodeAsync(), 0);
            return;
        }

        switch (tokens[0]) {
            case "var":
                this.handleVariableDeclaration(tokens);
                break;
            case "set":
                this.handleSetOperation(tokens);
                break;
            case "call":
                this.handleFunctionCall(tokens);
                break;
            case "return":
                this.handleReturn();
                break;
            case "if":
                this.handleIfStatement(tokens);
                break;
            case "run":
                this.handleRunCommand(tokens);
                break;
            case "gpu_send":
                this.handleGPUSend(tokens);
                break;
            case "gpu_call":
                this.handleGPUCall(tokens);
                break;
            case "out":
                this.handleOutOperation(tokens);
                break;
            case "quit":
                this.isRunning = false;
                this.output("Program exited successfully.");
                break;
            default:
                this.output(`Error: Unknown command '${tokens[0]}'`);
                break;
        }

        this.currentLine++;

        // Use setTimeout to allow the browser to breathe
        if (this.isRunning) {
            setTimeout(() => this.executeCodeAsync(), 0);
        }
    }

    handleVariableDeclaration(tokens) {
        const [_, name, operator, ...valueParts] = tokens;
        const value = valueParts.join(" "); // Join everything after the operator to handle strings with spaces
        if (operator === "=") {
            this.variables[name] = parseInt(value, 10); // For numbers
          //if (value.startsWith('"') && value.endsWith('"')) {
          //  this.variables[name] = value.slice(1, -1); // Remove quotes around the string
          //} else {
          //  this.variables[name] = parseInt(value, 10); // For numbers
          //}
        } else if (operator === "%=") {
            this.variables[name] = value.slice(1, -1);
        } else {
          this.output(`Error: Invalid operator '${operator}'`);
        }
      }
      
      handleSetOperation(tokens) {
        const [_, name, operator, ...valueParts] = tokens;
        const value = valueParts.join(" "); // Join everything after the operator to handle strings with spaces
        if (operator === "=") {
          if (value.startsWith('"') && value.endsWith('"')) {
            this.variables[name] = value.slice(1, -1); // Remove quotes around the string
          } else {
            this.variables[name] = this.variables[value] || parseInt(value, 10); // Handle numbers
          }
        } else if (operator === "+=") {
          if (typeof this.variables[name] === 'string') {
            this.variables[name] += value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : this.variables[value];
          } else {
            this.variables[name] += this.variables[value] || parseInt(value, 10);
          }
        } else if (operator === "-=") {
          this.variables[name] -= this.variables[value] || parseInt(value, 10);
        } else {
          this.output(`Error: Invalid operator '${operator}'`);
        }
      }

    handleFunctionCall(tokens) {
        const labelName = tokens[1];
        const labelIndex = this.labels[labelName];
        if (labelIndex !== undefined) {
            // Push the current line to the call stack before jumping
            this.callStack.push(this.currentLine + 1);
            this.currentLine = labelIndex;
        } else {
            this.output(`Error: Label '${labelName}' not found`);
        }
    }

    handleReturn() {
        // Pop from the call stack to return to the previous line
        if (this.callStack.length > 0) {
            this.currentLine = this.callStack.pop() - 1;
        } else {
            this.output("Error: Call stack is empty. No function to return to.");
        }
    }

    handleIfStatement(tokens) {
        const [_, a, operator, b, __, labelName] = tokens;
        const valueA = this.variables[a] || parseInt(a, 10);
        const valueB = this.variables[b] || parseInt(b, 10);

        let condition = false;
        switch (operator) {
            case "=":
                condition = valueA === valueB;
                break;
            case "!=":
                condition = valueA !== valueB;
                break;
            case "<":
                condition = valueA < valueB;
                break;
            case ">=":
                condition = valueA >= valueB;
                break;
            default:
                this.output(`Error: Invalid operator '${operator}'`);
                return;
        }

        if (condition) {
            const labelIndex = this.labels[labelName];
            if (labelIndex !== undefined) {
                this.currentLine = labelIndex;
            } else {
                this.output(`Error: Label '${labelName}' not found`);
            }
        }
    }

    handleRunCommand(tokens) {
        const labelName = tokens[1];
        const labelIndex = this.labels[labelName];
        if (labelIndex !== undefined) {
            this.currentLine = labelIndex;
        } else {
            this.output(`Error: Label '${labelName}' not found`);
        }
    }

    handleGPUSend(tokens) {
        const value = tokens[1];
        this.variables["gpu_data"] = this.variables[value] || parseInt(value, 10);
    }

    handleGPUCall(tokens) {
        const command = tokens[1];
        switch (command) {
            case "reset":
                this.ctx.clearRect(0, 0, 256, 256); // Clear the canvas
                break;
            case "clear_screen":
                this.ctx.fillStyle = "black";
                this.ctx.fillRect(0, 0, 256, 256); // Fill the canvas with black color
                break;
            case "set_char":
                if (this.x === undefined || this.y === undefined) {
                    this.output("Error: Coordinates (x, y) are not set.");
                    this.stopExecution();
                    return;
                }
                if (this.color === undefined) {
                    this.output("Error: Color is not set.");
                    this.stopExecution();
                    return;
                }
                const char = String.fromCharCode(this.variables["gpu_data"] || 65); // Default to 'A' if no data
                if (this.x >= 0 && this.x <= 255 && this.y >= 0 && this.y <= 255) {
                    this.ctx.fillStyle = this.color;
                    this.ctx.font = "16px monospace";
                    this.ctx.fillText(char, this.x, this.y); // Render character at the specified (x, y) position
                } else {
                    this.output(`Error: Invalid coordinates (${this.x}, ${this.y}). Must be between 0 and 255.`);
                    this.stopExecution(); // Stop execution if coordinates are out of bounds
                }
                break;
            case "set_x":
                const xVar = tokens[2]; // Variable for x (e.g., x)
                this.x = this.getVariableValue(xVar); // Retrieve the value of the variable
                if (this.x < 0 || this.x > 255) {
                    this.output(`Error: Invalid x-coordinate ${this.x}. Must be between 0 and 255.`);
                    this.stopExecution(); // Stop execution if x is out of bounds
                }
                break;
            case "set_y":
                const yVar = tokens[2]; // Variable for y (e.g., y)
                this.y = this.getVariableValue(yVar); // Retrieve the value of the variable
                if (this.y < 0 || this.y > 255) {
                    this.output(`Error: Invalid y-coordinate ${this.y}. Must be between 0 and 255.`);
                    this.stopExecution(); // Stop execution if y is out of bounds
                }
                break;
            case "set_color":
                const colorValue = this.variables["gpu_data"] || 255; // Default to white if no data
                if (colorValue >= 0 && colorValue <= 255) {
                    this.color = `rgb(${colorValue}, ${colorValue}, ${colorValue})`; // Grayscale color
                } else {
                    this.output("Error: Invalid color value. Must be between 0 and 255.");
                    this.stopExecution();
                }
                break;
            case "render":
                // No additional action needed here since rendering is handled in `set_char`
                break;
            default:
                this.output(`Error: Unknown GPU command '${command}'`);
                break;
        }
    }

    handleOutOperation(tokens, lineIndex) {
        const value = this.variables[tokens[1]];
        if (value !== undefined) {
          this.output(value, lineIndex);
        } else {
          this.output(`Error: Variable '${tokens[1]}' not found`, lineIndex);
        }
      }
      

    getVariableValue(variable) {
        return this.variables[variable] || 0; // Default to 0 if the variable is not found
    }

    stopExecution() {
        this.isRunning = false; // Stop the program execution
    }

    output(text) {
        this.outputText += `${text}\n`;
        this.textOutput.innerText = this.outputText;
    }
}
