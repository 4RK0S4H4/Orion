# File Upload

A drop zone that is also a real button, then one row per file. It works with a tap, a click, the keyboard or a drag;
dragging is an extra, never the only way. **Orion never uploads anything itself:** it checks each file (type, size,
count), shows it and fires events; the app sends it and reports back with a small API.

```html
<div class="s4-upload" data-max-size="10 MB" data-max-files="5">
  <span class="s4-upload-label">Receipts</span>
  <input type="file" name="receipts" accept=".pdf,image/*" multiple>
  <div class="s4-text-field-supporting">They are attached to this expense report.</div>
</div>
<script>
  field.addEventListener('s4-upload', (e) => {               // start sending e.detail.file
    send(e.detail.file, (p) => S4.upload.progress(field, e.detail.id, p))
      .then(() => S4.upload.done(field, e.detail.id), () => S4.upload.fail(field, e.detail.id, 'Couldn’t upload. Try again.'));
  });
  field.addEventListener('s4-retry', (e) => { /* send e.detail.file again */ });
</script>
```

| Attribute | What |
|---|---|
| `accept`, `multiple`, `required`, `disabled`, `name` on the input | As usual. The chosen files are put back into the input, so a plain form post and `required` work. |
| `data-max-size` (“10 MB”) | Bigger files are refused with the reason (“Too large: 14.2 MB. The limit is 10 MB.”). |
| `data-max-files` | More files are refused. |
| `data-msg-type`, `data-msg-size` | Your own wording for a refusal. |
| `data-variant="compact"` | One file in a row the size of a field (for forms), with Remove once chosen. |
| `data-variant="avatar"` | A round photo with a camera badge; `data-initials`, `data-photo` (current photo URL); a `[data-upload-remove]` button inside removes it. Put the label and supporting text in a `.s4-upload-avatar-text` beside it. |
| `data-error="…"` on the field | An error (the zone keeps its fill; the label and message turn the error color). |

The hint under the zone's title is written from `accept`, `data-max-size` and `data-max-files` (“PDF or images, up to
10 MB each, 5 at most”). On a touch screen the zone just says “Choose Files”.

**Events** (on the field): `s4-upload { id, file }` per accepted file; `s4-change { files }`; `s4-retry { id, file }`;
a cancelable `s4-remove { id, file }`; `s4-reject { file, reason }`.
**API:** `S4.upload.progress(field, id, 0..1)` (or `null` for “Uploading…”), `S4.upload.done(field, id, text?)`,
`S4.upload.fail(field, id, message)`, `S4.upload.files(field)`, `S4.upload.add(field, files)`, `S4.upload.clear(field)`.

**Rows:** a thumbnail (the picture itself for images, a file icon otherwise), the name (it wraps, never cut), its size
and state, a progress bar while sending, Try Again after a failure, Remove. Refused files stay as a row with the reason
until removed, so people see what happened. Rows open and close in place (Reveal).

**When to use:** attachments, documents for a form, a profile photo. **Not:** pasting text, picking from files the app
already has (a list or a gallery), or a big media library (a page of its own).

**Do** say the types and the limit before people choose; let the form go on while files send. **Don't** make the zone
the only way in on a phone (it isn't: it is a button), hide refused files, or upload before the person chose.

**Accessibility:** the zone is a `<button>` described by the label and the supporting text; the file input is hidden
(the button opens it). Additions, refusals, finished uploads and failures are announced politely; each row's buttons
are named with the file (“Remove march.pdf”, “Try Again: taxi.pdf”); the progress bar is a `progressbar`.

**Tokens:** `--md-sys-shape-corner-extra-large` (the zone, rounder with the corner dial), `--md-sys-shape-corner-large`
and `-small` (rows and thumbnails, concentric), `--md-sys-color-secondary-container`, `--s4-color-success`,
`--md-sys-color-error`. **Motion:** State (the zone), Reveal (rows), the progress bar's Ink.
