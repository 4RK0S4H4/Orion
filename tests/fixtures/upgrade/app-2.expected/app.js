// Ledger: strings carry Orion names, code carries S4 calls
const chips = document.querySelectorAll('.s4-pill, .s4-chip-set > .s4-pill');
const fake = '.s4-chips and s4-chip-set are other names';
document.addEventListener('s4-input', (e) => S4.toast({ text: 'Saved' }));
document.addEventListener('s4-change-later', () => 0);
const bar = document.querySelector('[data-pinned]');
bar.setAttribute('data-variant', 'raised');
if (bar.dataset.pinned !== undefined) bar.dataset.variant = 'raised';
S4.icon.set(document.querySelector('.s4-icon'), 'magnifier');
const notOrion = { snackbar: 1 }; notOrion.snackbar += 1; mySnackbar(); window.S4.snackbarLog = [];
function mySnackbar() { return 's4-pill'; }
