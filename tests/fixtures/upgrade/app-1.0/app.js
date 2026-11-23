/* Pantry: the list's small behaviours, written against Orion 1.0.0 */
const S4 = window.S4;
const panel = document.querySelector('.pt-actions');
document.getElementById('add').addEventListener('click', () => {
  S4.snackbar({ text: 'Item added', action: 'Undo' });
  S4.transition.drop(panel, { open: true });          // an old motion name: renamed
});
document.getElementById('share').addEventListener('click', () => {
  S4.transition.slide(panel, { open: true });         // an old motion name: renamed
  S4.transition.unfold(panel, { open: false });       // an old motion name: renamed
  S4.transition.containerTransform(panel, document.getElementById('share'), { open: true });   // a judgment item: its arguments changed
});
const notes = { dropdown: 'S4.transition.dropdown is not an Orion name', text: 'transition.drop in a sentence' };   // look-alikes: never touched
window.pantry = { notes, myS4: { transition: { drop: () => 0 } } };
