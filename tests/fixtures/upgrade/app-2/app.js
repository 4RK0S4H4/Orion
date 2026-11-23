// Ledger: strings carry Orion names, code carries S4 calls
const chips = document.querySelectorAll('.s4-chip, .s4-chip-set > .s4-chip');
const fake = '.s4-chips and s4-chip-set are other names';
document.addEventListener('s4-change', (e) => S4.snackbar({ text: 'Saved' }));
document.addEventListener('s4-change-later', () => 0);
const bar = document.querySelector('[data-sticky]');
bar.setAttribute('data-variant', 'elevated');
if (bar.dataset.sticky !== undefined) bar.dataset.variant = 'elevated';
S4.icon.set(document.querySelector('.s4-icon'), 'search');
const notOrion = { snackbar: 1 }; notOrion.snackbar += 1; mySnackbar(); window.S4.snackbarLog = [];
function mySnackbar() { return 's4-chip'; }
