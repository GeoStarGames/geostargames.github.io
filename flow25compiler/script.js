const compiler = new Flow25Compiler();
const codeInput = document.getElementById("code-input");
const runBtn = document.getElementById("run-btn");
const stopBtn = document.getElementById("stop-btn");
const newBtn = document.getElementById("new-btn");
const saveBtn = document.getElementById("save-btn");
const loadBtn = document.getElementById("load-btn");

runBtn.addEventListener("click", () => {
  compiler.compile(codeInput.value);
});

stopBtn.addEventListener("click", () => {
  compiler.isRunning = false;
});

newBtn.addEventListener("click", () => {
  location.reload();
});

saveBtn.addEventListener("click", () => {
  const code = codeInput.value;
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "code.flow25";
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
      codeInput.value = e.target.result;
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