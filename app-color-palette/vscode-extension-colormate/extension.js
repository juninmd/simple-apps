const vscode = require("vscode");
const { convert, toHex, parseColor, findColors } = require("./src/color");

const swatch = vscode.window.createTextEditorDecorationType({
  before: {
    margin: "0 4px 0 0",
    width: "0.8em",
    height: "0.8em",
    border: "1px solid #888",
  },
});

async function convertSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const sel = editor.selection;
  const text = editor.document.getText(sel).trim();
  if (!parseColor(text)) {
    vscode.window.showInformationMessage("colormate: selecione uma cor (hex, rgb() ou hsl()).");
    return;
  }
  const pick = await vscode.window.showQuickPick(
    [
      { label: convert(text, "hex"), target: "hex", description: "hex" },
      { label: convert(text, "rgb"), target: "rgb", description: "rgb" },
      { label: convert(text, "hsl"), target: "hsl", description: "hsl" },
    ],
    { placeHolder: "Converter cor para…" },
  );
  if (pick) editor.edit((b) => b.replace(sel, pick.label));
}

function decorate(editor) {
  if (!editor) return;
  const text = editor.document.getText();
  const decos = findColors(text).map((c) => {
    const range = new vscode.Range(
      editor.document.positionAt(c.index),
      editor.document.positionAt(c.index + c.length),
    );
    const hex = toHex(parseColor(c.match));
    return { range, renderOptions: { before: { backgroundColor: hex } } };
  });
  editor.setDecorations(swatch, decos);
}

function activate(context) {
  context.subscriptions.push(
    swatch,
    vscode.commands.registerCommand("colormate.convert", convertSelection),
    vscode.window.onDidChangeActiveTextEditor(decorate),
    vscode.workspace.onDidChangeTextDocument((e) => {
      const ed = vscode.window.activeTextEditor;
      if (ed && e.document === ed.document) decorate(ed);
    }),
  );
  decorate(vscode.window.activeTextEditor);
}

function deactivate() {}

module.exports = { activate, deactivate };
