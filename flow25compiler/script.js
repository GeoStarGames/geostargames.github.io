const compiler = new Flow25Compiler();
const lib_compiler = new FlowLibCompiler();
const codeInput = document.getElementById("code-input");
const runBtn = document.getElementById("run-btn");
const stopBtn = document.getElementById("stop-btn");
const newBtn = document.getElementById("new-btn");
const saveBtn = document.getElementById("save-btn");
const saveLibBtn = document.getElementById("save-lib-btn");
const loadBtn = document.getElementById("load-btn");
const addLibBtn = document.getElementById("add-lib-btn");
const docBtn = document.getElementById("documentation-btn");

runBtn.addEventListener("click", () => {
  compiler.compile(codeInput.value);
});

stopBtn.addEventListener("click", () => {
  compiler.isRunning = false;
});

newBtn.addEventListener("click", () => {
  location.reload();
});

docBtn.addEventListener("click", () => {
  window.location.replace("documentation.html")
});

saveBtn.addEventListener("click", () => {
  const librariesString = "\n//LIBRARIES_START\n" + 
    JSON.stringify(compiler.libraries) + 
    "\n//LIBRARIES_END";

  // Combine user code with library data
  const code = codeInput.value + librariesString;
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "code.flow25";
  a.click();
  URL.revokeObjectURL(url);
});

saveLibBtn.addEventListener("click", () => {
  const code = codeInput.value;
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "code.lib25";
  a.click();
  URL.revokeObjectURL(url);
});

loadBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".flow25";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      let content = e.target.result;

      // Extract libraries
      const libraryMatch = content.match(/\/\/LIBRARIES_START\n([\s\S]*?)\n\/\/LIBRARIES_END/);
      if (libraryMatch) {
        try {
          compiler.libraries = JSON.parse(libraryMatch[1]); // Restore libraries
        } catch (error) {
          console.error("Error parsing libraries:", error);
        }
        // Remove libraries section from code
        content = content.replace(libraryMatch[0], "").trim();
      }

      codeInput.value = content;
    };
    reader.readAsText(file);
  };
  input.click();
});

addLibBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".lib25";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      let name = lib_compiler.compile(e.target.result);
      compiler.libraries[name] = lib_compiler.libraries[name];
      
    };
    reader.readAsText(file);
  };
  input.click();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "F5") {
    compiler.compile(codeInput.value);
  } else if (e.key === "F4") {
    compiler.isRunning = false;
  }
});

document.getElementById("export-js-btn").addEventListener("click", () => {
  const flow25Code = document.getElementById("code-input").value;

  // Compile Flow25 code to JavaScript
  const jsCode = compileToJavaScript(flow25Code);

  // Create the HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flow25 Game</title>
  <style>
      body {
          margin: 0;
          font-family: Arial, sans-serif;
          background-color:rgb(78, 78, 78);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
      }
      .game-window {
          background-color: #2c3e50;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          width: 300px;
      }
      .game-title {
          background-color: #34495e;
          color: white;
          padding: 10px;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
      }
      .game-canvas {
          background-color: black;
          display: block;
          margin: 0 auto;
      }
  </style>
</head>
<body>
  <div class="game-window">
      <div class="game-title">Flow25 Game</div>
      <canvas id="game-canvas" class="game-canvas" width="256" height="256"></canvas>
  </div>
  <script>
      ${jsCode}
  </script>
</body>
</html>
  `;

  // Create a downloadable HTML file
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flow25_game.html";
  a.click();
  URL.revokeObjectURL(url);
});

function compileToJavaScript(flow25Code) {
  // Convert Flow25 code to JavaScript
  // This is a simplified example; you can expand it based on your compiler logic
  let jsCode = `
      const canvas = document.getElementById("game-canvas");
      const ctx = canvas.getContext("2d");
      const variables = {};
      const output = [];

      variables["gpu_data_x"] = 0;
      variables["gpu_data_y"] = 0;
      variables["gpu_data_color"] = "rgb(255, 255, 255)";
      variables["gpu_data_char"] = " ";
      variables["gpu_data"] = 0;
      variables["push_data"] = 0;
      variables["gpu_read_data"] = 0;

      const backBuffer = document.createElement("canvas");
      backBuffer.width = 256;
      backBuffer.height = 256;
      const backCtx = backBuffer.getContext("2d");

      // Flow25 to JavaScript translation
      ${flow25Code
          .split("\n")
          .map(line => {
              const tokens = line.trim().split(" ");
              switch (tokens[0]) {
                  case "var":
                    const [_, name, operator, ...valueParts] = tokens;
                    const value = valueParts.join(" ");
                    if (operator === "=") {
                      return `variables["${tokens[1]}"] = ${parseInt(value, 10)};`
                    } else if (operator === "%=") {
                      return `variables["${tokens[1]}"] = "${value.slice(1, -1)}";`
                    }
                      return `variables["${tokens[1]}"] = "${tokens[3] || 0}";`;
                  case "set":
                    return `variables["${tokens[1]}"] ${tokens[2]}` + ` variables["${tokens.slice(3).join(" ")}"]`;
                  case "out":
                      return `output.push(variables["${tokens[1]}"]);`;
                  case "gpu_send":
                    return `variables["gpu_data"] = ` + ` variables["${tokens[1]}"]`;
                  case "gpu_call":
                      if (tokens[1] === "set_char") {
                      return `
            variables["gpu_data_char"] = ` + `variables["gpu_data"]

                          backCtx.fillStyle = variables["gpu_data_color"];
                          backCtx.font = "16px monospace";
                          backCtx.fillText(variables["gpu_data_char"], variables["gpu_data_x"], variables["gpu_data_y"]);
                      `;
                      } else if (tokens[1] === "set_x") {
                        return `variables["gpu_data_x"] = ` + `variables["gpu_data"]`;
                      } else if (tokens[1] === "set_y") {
                        return `variables["gpu_data_y"] = ` + `variables["gpu_data"]`;
                      } else if (tokens[1] === "set_color") {
                        return `variables["gpu_data_color"] = ` + `variables["gpu_data"]`;
                      } else if (tokens[1] === "clear_screen") {
                        return `backCtx.clearRect(0, 0, 256, 256);`;
                      } else if (tokens[1] === "flip") {
                        return `ctx.clearRect(0, 0, 256, 256);
                        ctx.drawImage(backBuffer, 0, 0);
                        backCtx.clearRect(0, 0, 256, 256);`;
                      }
                      break;
                  default:
                      return "";
              }
          })
          .join("\n")}

      // Display output
      console.log(variables);
      console.log(output);
  `;

  return jsCode;
}