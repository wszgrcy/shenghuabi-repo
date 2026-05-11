"use strict";
exports.activate = activate;
exports.deactivate = deactivate;
let dispose$$
async function activate(context) {
    const result = import('./index.mjs').then(({ activate }) => activate(context))
    dispose$$ = result.then(({ dispose$$ }) => dispose$$)
    return (await result).exports;
}
function deactivate() {
    return dispose$$?.then((dispose) => dispose())
}