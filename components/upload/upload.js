/* File upload: a drop zone that is also a button, and the list of files with their progress. Orion never uploads
   anything itself: it checks each file (type, size, count), shows it, and fires events; the app does the sending and
   reports back through a small API.
     <div class="s4-upload" data-max-size="10 MB" data-max-files="5">
       <span class="s4-upload-label">Receipts</span>
       <button class="s4-upload-zone" type="button">…</button>                 (upload.js fills an empty zone)
       <input type="file" id="receipts" name="receipts" accept=".pdf,image/*" multiple>
       <div class="s4-text-field-supporting">PDF, JPG or PNG, up to 10 MB each.</div>
     </div>
   data-variant: (none) the drop zone and a list; "compact" one file in a field-sized row; "avatar" a round photo.
   Events on the field: s4-upload { id, file } for each accepted file (start sending it); s4-change { files };
   s4-retry { id, file }; cancelable s4-remove { id, file }; s4-reject { file, reason }.
   API: S4.upload.progress(field, id, 0..1), S4.upload.done(field, id, text?), S4.upload.fail(field, id, message),
   S4.upload.files(field) -> [{ id, file, state }], S4.upload.add(field, files), S4.upload.clear(field).
   The chosen files are also put back into the input (DataTransfer), so a plain form post and `required` still work. */
(function () {
  var S4 = window.S4, uid = 0;
  function bytes(t) { if (!t) return 0; var m = /^\s*([\d.]+)\s*(b|kb|mb|gb)?\s*$/i.exec(t); if (!m) return +t || 0; var u = (m[2] || 'b').toLowerCase(); return +m[1] * { b: 1, kb: 1024, mb: 1048576, gb: 1073741824 }[u]; }
  function size(n, lang) {
    var f = function (v, d) { return new Intl.NumberFormat(lang, { maximumFractionDigits: d }).format(v); };
    return n < 1024 ? f(n, 0) + ' B' : n < 1048576 ? f(n / 1024, 0) + ' KB' : n < 1073741824 ? f(n / 1048576, 1) + ' MB' : f(n / 1073741824, 1) + ' GB';
  }
  function accepts(accept, file) {
    if (!accept) return true;
    var name = file.name.toLowerCase(), type = (file.type || '').toLowerCase();
    return accept.split(',').some(function (a) {
      a = a.trim().toLowerCase(); if (!a) return false;
      if (a[0] === '.') return name.slice(-a.length) === a;
      if (a.slice(-2) === '/*') return type.indexOf(a.slice(0, -1)) === 0;
      return type === a;
    });
  }
  function kinds(accept) {
    if (!accept) return '';
    var out = accept.split(',').map(function (a) { a = a.trim(); return a === 'image/*' ? 'images' : a[0] === '.' ? a.slice(1).toUpperCase() : a.split('/').pop().toUpperCase(); });
    return out.length > 1 ? out.slice(0, -1).join(', ') + ' or ' + out[out.length - 1] : out[0];
  }
  function api(f) { return f._s4upload; }
  S4.upload = {
    progress: function (f, id, v) { api(f) && api(f).progress(id, v); },
    done: function (f, id, text) { api(f) && api(f).done(id, text); },
    fail: function (f, id, msg) { api(f) && api(f).fail(id, msg); },
    files: function (f) { return api(f) ? api(f).list() : []; },
    clear: function (f) { api(f) && api(f).clear(); },
    add: function (f, files) { api(f) && api(f).add(files); }
  };

  S4.register('upload', function (scope) {
    S4.util.all(scope, '.s4-upload').forEach(function (f) {
      if (!S4.util.once(f, 'upload')) return;
      var input = f.querySelector('input[type="file"]'); if (!input) return;
      var lang = (f.closest('[lang]') || document.documentElement).getAttribute('lang') || undefined;
      var variant = f.dataset.variant || '';
      var single = variant === 'compact' || variant === 'avatar' || !input.multiple;
      var maxSize = bytes(f.dataset.maxSize), maxFiles = single ? 1 : (+f.dataset.maxFiles || 0);
      var accept = input.getAttribute('accept') || (variant === 'avatar' ? 'image/*' : '');
      if (variant === 'avatar' && !input.accept) input.accept = 'image/*';
      var labelEl = f.querySelector('.s4-upload-label');
      var labelText = labelEl ? labelEl.textContent.trim() : (input.getAttribute('aria-label') || 'Files');
      var sup = f.querySelector('.s4-text-field-supporting');
      var helper = sup ? sup.textContent : '';
      if (!input.id) input.id = 's4-upload-' + (++uid);
      if (labelEl && !labelEl.id) labelEl.id = input.id + '-label';
      if (sup && !sup.id) sup.id = input.id + '-help';
      input.tabIndex = -1; input.setAttribute('aria-hidden', 'true'); input.classList.add('s4-upload-input');
      var entries = [], own = false;
      var live = document.createElement('div'); live.className = 's4-visually-hidden'; live.setAttribute('role', 'status'); f.appendChild(live);
      var sayT; var say = function (t) { clearTimeout(sayT); sayT = setTimeout(function () { live.textContent = t; }, 300); };

      /* ---------- the zone (a real button) ---------- */
      var zone = f.querySelector('.s4-upload-zone');
      if (!zone) { zone = document.createElement('button'); zone.type = 'button'; zone.className = 's4-upload-zone'; input.before(zone); }
      if (!zone.children.length) {
        if (variant === 'avatar') {
          zone.innerHTML = '<span class="s4-upload-photo" aria-hidden="true"><span class="s4-upload-initials"></span></span><span class="s4-upload-badge" aria-hidden="true"><span class="s4-icon"></span></span>';
          zone.querySelector('.s4-upload-initials').textContent = f.dataset.initials || '';
          S4.icon.set(zone.querySelector('.s4-upload-badge .s4-icon'), 'camera');
          zone.setAttribute('aria-label', f.dataset.photo ? 'Change Photo' : 'Add Photo');
        } else if (variant === 'compact') {
          zone.innerHTML = '<span class="s4-icon" aria-hidden="true"></span><span class="s4-upload-zone-text"><span class="s4-upload-name">' + (f.dataset.chooseText || 'Choose a File') + '</span></span><span class="s4-upload-zone-action">Browse</span>';
          S4.icon.set(zone.querySelector('.s4-icon'), 'attach');
        } else {
          zone.innerHTML = '<span class="s4-upload-zone-icon" aria-hidden="true"><span class="s4-icon"></span></span>' +
            '<span class="s4-upload-zone-text"><span class="s4-upload-zone-title"><span data-pointer>Drop ' + (single ? 'a file' : 'files') + ' here or </span><span class="s4-upload-zone-choose">Choose ' + (single ? 'a File' : 'Files') + '</span></span>' +
            '<span class="s4-upload-zone-hint"></span></span>';
          S4.icon.set(zone.querySelector('.s4-icon'), 'upload');
          var hint = [];
          if (accept) hint.push(kinds(accept));
          if (maxSize) hint.push('up to ' + size(maxSize, lang) + (single ? '' : ' each'));
          if (maxFiles) hint.push(maxFiles + ' at most');
          zone.querySelector('.s4-upload-zone-hint').textContent = hint.length ? hint.join(', ').replace(/^./, function (c) { return c.toUpperCase(); }) : '';
          if (!hint.length) zone.querySelector('.s4-upload-zone-hint').remove();
        }
      }
      if (labelEl) zone.setAttribute('aria-describedby', [labelEl.id, sup ? sup.id : ''].filter(Boolean).join(' '));
      else if (sup) zone.setAttribute('aria-describedby', sup.id);
      if (variant === 'avatar' && f.dataset.photo) setPhoto(f.dataset.photo);
      zone.addEventListener('click', function () { if (!zone.disabled) input.click(); });

      /* ---------- the list ---------- */
      var list = f.querySelector('.s4-upload-list');
      if (!list && variant !== 'avatar') { list = document.createElement('ul'); list.className = 's4-upload-list'; list.setAttribute('aria-label', labelText); (sup || input).after(list); }
      if (variant === 'compact' && list) list.hidden = true;
      /* compact: a Remove button over the end of the row once a file is chosen */
      if (variant === 'compact') {
        var clr = document.createElement('button'); clr.type = 'button'; clr.className = 's4-icon-button s4-upload-clear'; clr.setAttribute('aria-label', 'Remove File'); clr.hidden = true;
        clr.innerHTML = '<span class="s4-icon"></span>'; S4.icon.set(clr.firstChild, 'close');
        zone.after(clr);
        clr.addEventListener('click', function () {
          var name = entries[0] ? entries[0].file.name : '';
          entries.slice().forEach(function (e) { remove(e, true); });
          var z = zone.querySelector('.s4-upload-name'); if (z) z.textContent = f.dataset.chooseText || 'Choose a File';
          var m = zone.querySelector('.s4-upload-zone-meta'); if (m) m.remove();
          f.removeAttribute('data-state'); changed(); zone.focus(); say('Removed ' + name + '.');
        });
        f.addEventListener('s4-change', function () { clr.hidden = !f.hasAttribute('data-filled'); });
      }

      function setPhoto(url) {
        var ph = zone.querySelector('.s4-upload-photo'); if (!ph) return;
        var img = ph.querySelector('img');
        if (!url) { if (img) img.remove(); f.removeAttribute('data-has-photo'); zone.setAttribute('aria-label', 'Add Photo'); return; }
        if (!img) { img = document.createElement('img'); img.alt = ''; ph.appendChild(img); }
        img.src = url; f.setAttribute('data-has-photo', ''); zone.setAttribute('aria-label', 'Change Photo');
      }
      function row(e) {
        var li = document.createElement('li'); li.className = 's4-upload-item'; li.dataset.id = e.id;
        var thumb = document.createElement('span'); thumb.className = 's4-upload-thumb'; thumb.setAttribute('aria-hidden', 'true');
        if (e.url) { var im = document.createElement('img'); im.src = e.url; im.alt = ''; thumb.appendChild(im); }
        else { var ic = document.createElement('span'); ic.className = 's4-icon'; thumb.appendChild(ic); S4.icon.set(ic, /^image\//.test(e.file.type) ? 'image' : 'document'); }
        var text = document.createElement('span'); text.className = 's4-upload-text';
        var name = document.createElement('span'); name.className = 's4-upload-name'; name.textContent = e.file.name;
        var meta = document.createElement('span'); meta.className = 's4-upload-meta';
        var bar = document.createElement('div'); bar.className = 's4-progress s4-upload-progress'; bar.setAttribute('aria-label', 'Uploading ' + e.file.name); bar.hidden = true;
        text.appendChild(name); text.appendChild(meta); text.appendChild(bar);
        var actions = document.createElement('span'); actions.className = 's4-upload-actions';
        var retry = document.createElement('button'); retry.type = 'button'; retry.className = 's4-icon-button s4-upload-retry'; retry.setAttribute('aria-label', 'Try Again: ' + e.file.name); retry.hidden = true;
        retry.innerHTML = '<span class="s4-icon"></span>'; S4.icon.set(retry.firstChild, 'refresh');
        var rm = document.createElement('button'); rm.type = 'button'; rm.className = 's4-icon-button s4-upload-remove'; rm.setAttribute('aria-label', 'Remove ' + e.file.name);
        rm.innerHTML = '<span class="s4-icon"></span>'; S4.icon.set(rm.firstChild, 'close');
        actions.appendChild(retry); actions.appendChild(rm);
        li.appendChild(thumb); li.appendChild(text); li.appendChild(actions);
        retry.addEventListener('click', function () { setState(e, 'uploading', 0); S4.util.emit(f, 's4-retry', { id: e.id, file: e.file }); });
        rm.addEventListener('click', function () { remove(e); });
        e.li = li; e.meta = meta; e.bar = bar; e.retry = retry;
        if (S4.init) S4.init(li);
        return li;
      }
      function setState(e, state, value, text) {
        e.state = state;
        if (e.li) e.li.setAttribute('data-state', state);
        if (variant === 'compact') { f.setAttribute('data-state', state); }
        if (!e.meta) return;
        var sz = size(e.file.size, lang);
        e.bar.hidden = state !== 'uploading';
        e.retry.hidden = state !== 'error' || !e.retryable;
        if (state === 'uploading') {
          if (value == null) e.bar.removeAttribute('data-value'); else e.bar.setAttribute('data-value', Math.max(0, Math.min(1, value)));
          e.meta.textContent = sz + ' · ' + (value == null ? 'Uploading…' : 'Uploading ' + Math.round(value * 100) + '%');
        } else if (state === 'done') { e.meta.textContent = sz + ' · ' + (text || 'Uploaded'); }
        else if (state === 'error') { e.meta.textContent = text; }
        else { e.meta.textContent = sz; }
        if (variant === 'compact') {
          var z = zone.querySelector('.s4-upload-name'); if (z) z.textContent = e.file.name;
          var meta2 = zone.querySelector('.s4-upload-zone-meta');
          if (!meta2) { meta2 = document.createElement('span'); meta2.className = 's4-upload-zone-meta'; zone.querySelector('.s4-upload-zone-text').appendChild(meta2); }
          meta2.textContent = e.meta.textContent;
        }
      }
      function syncInput() {
        try { var dt = new DataTransfer(); entries.forEach(function (e) { if (e.state !== 'rejected') dt.items.add(e.file); }); input.files = dt.files; } catch (x) {}
        input.setCustomValidity('');
        f.toggleAttribute('data-filled', entries.some(function (e) { return e.state !== 'rejected'; }));
        if (maxFiles && !single) f.toggleAttribute('data-full', entries.filter(function (e) { return e.state !== 'rejected'; }).length >= maxFiles);
      }
      function changed() {
        syncInput();
        if (f.hasAttribute('data-error') && variant !== 'avatar' && f.hasAttribute('data-filled')) showError(null);
        own = true; input.dispatchEvent(new Event('change', { bubbles: true })); own = false;
        S4.util.emit(f, 's4-change', { files: entries.filter(function (e) { return e.state !== 'rejected'; }).map(function (e) { return { id: e.id, file: e.file, state: e.state }; }) });
      }
      function remove(e, quiet) {
        if (!quiet) { var ev = new CustomEvent('s4-remove', { bubbles: true, cancelable: true, detail: { id: e.id, file: e.file } }); if (!f.dispatchEvent(ev)) return; }
        var i = entries.indexOf(e); if (i < 0) return;
        entries.splice(i, 1);
        if (e.url) setTimeout(function () { URL.revokeObjectURL(e.url); }, 1000);
        if (e.li) {
          var items = Array.prototype.slice.call(list.querySelectorAll(':scope > .s4-upload-item:not([data-leaving])'));
          var k = items.indexOf(e.li), next = items[k + 1] || items[k - 1];
          var hadFocus = e.li.contains(document.activeElement);
          e.li.setAttribute('data-leaving', '');
          var gone = function () { e.li.remove(); };
          S4.transition.reveal(e.li, { open: false }).then(gone, gone);
          if (hadFocus) (next ? next.querySelector('.s4-upload-remove') : zone).focus();
        }
        if (!quiet) { say('Removed ' + e.file.name + '.'); changed(); }
      }
      function add(files) {
        var list2 = Array.prototype.slice.call(files || []);
        if (!list2.length || zone.disabled) return;
        if (single) { entries.slice().forEach(function (e) { remove(e, true); }); list2 = list2.slice(0, 1); }
        var added = 0, rejected = [];
        list2.forEach(function (file) {
          var reason = '';
          if (!accepts(accept, file)) reason = (f.dataset.msgType || 'Can’t add this type of file.') + (accept ? ' Choose ' + kinds(accept) + '.' : '');
          else if (maxSize && file.size > maxSize) reason = (f.dataset.msgSize || 'Too large: ' + size(file.size, lang) + '.') + ' The limit is ' + size(maxSize, lang) + '.';
          else if (maxFiles && entries.filter(function (e) { return e.state !== 'rejected'; }).length >= maxFiles) reason = 'Only ' + maxFiles + ' files can be added.';
          var e = { id: 'f' + (++uid), file: file, state: 'ready', retryable: !reason };
          if (!reason && /^image\//.test(file.type) && window.URL && URL.createObjectURL) e.url = URL.createObjectURL(file);
          entries.push(e);
          if (variant === 'avatar') { if (reason) { showError(reason); entries.pop(); } else { setPhoto(e.url); showError(null); } }
          else { list.appendChild(row(e)); if (e.li) S4.transition.reveal(e.li, { open: true }); }
          if (reason) { setState(e, 'error', null, reason); e.state = 'rejected'; if (e.li) e.li.setAttribute('data-state', 'error'); rejected.push(file.name); S4.util.emit(f, 's4-reject', { file: file, reason: reason }); }
          else { setState(e, 'ready'); added++; }
        });
        say((added ? (added === 1 ? 'Added ' + list2[0].name + '.' : 'Added ' + added + ' files.') : '') + (rejected.length ? ' ' + rejected.length + ' could not be added.' : ''));
        changed();
        entries.forEach(function (e) { if (e.state === 'ready' && !e.sent) { e.sent = true; S4.util.emit(f, 's4-upload', { id: e.id, file: e.file }); } });
      }
      function showError(msg) {
        if (!msg) { f.removeAttribute('data-error'); if (sup) sup.textContent = helper; return; }
        f.setAttribute('data-error', msg);
        if (sup) sup.textContent = msg;
      }
      var find = function (id) { return entries.find(function (e) { return e.id === id; }); };
      f._s4upload = {
        progress: function (id, v) { var e = find(id); if (e) setState(e, 'uploading', v); },
        done: function (id, text) { var e = find(id); if (e) { setState(e, 'done', null, text); say(e.file.name + ' uploaded.'); } },
        fail: function (id, msg) { var e = find(id); if (e) { setState(e, 'error', null, msg || 'Couldn’t upload. Check your connection and try again.'); say(e.file.name + ': ' + e.meta.textContent); } },
        list: function () { return entries.map(function (e) { return { id: e.id, file: e.file, state: e.state }; }); },
        clear: function () { entries.slice().forEach(function (e) { remove(e, true); }); if (variant === 'avatar') setPhoto(f.dataset.photo || null); changed(); },
        add: add
      };

      input.addEventListener('change', function () { if (own) return; add(Array.prototype.slice.call(input.files || [])); });
      /* drag and drop: an extra way, never the only one */
      var depth = 0;
      zone.addEventListener('dragenter', function (e) { if (!e.dataTransfer || [].indexOf.call(e.dataTransfer.types, 'Files') < 0) return; e.preventDefault(); depth++; f.setAttribute('data-over', ''); });
      zone.addEventListener('dragover', function (e) { if (!f.hasAttribute('data-over')) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
      zone.addEventListener('dragleave', function () { if (--depth <= 0) { depth = 0; f.removeAttribute('data-over'); } });
      zone.addEventListener('drop', function (e) { e.preventDefault(); depth = 0; f.removeAttribute('data-over'); add(e.dataTransfer.files); });
      /* errors from .s4-form land on the input (it has no field around it): show them on the upload */
      new MutationObserver(function () {
        var m = input.getAttribute('data-error');
        if (m) { f.setAttribute('data-error', m); if (sup) sup.textContent = m; } else if (f.hasAttribute('data-error') && variant !== 'avatar') { f.removeAttribute('data-error'); if (sup) sup.textContent = helper; }
      }).observe(input, { attributes: true, attributeFilter: ['data-error'] });
      new MutationObserver(function () { zone.disabled = input.disabled; f.toggleAttribute('data-disabled', input.disabled); }).observe(input, { attributes: true, attributeFilter: ['disabled'] });
      zone.disabled = input.disabled; f.toggleAttribute('data-disabled', input.disabled);
      if (f.getAttribute('data-error') && sup) sup.textContent = f.getAttribute('data-error');   /* an error set in the markup */
      /* an avatar's Remove Photo button, if the page has one */
      var rmPhoto = f.querySelector('[data-upload-remove]');
      if (rmPhoto) rmPhoto.addEventListener('click', function () { entries.slice().forEach(function (e) { remove(e, true); }); setPhoto(null); changed(); say('Photo removed.'); });
    });
  });
})();
