/* NEXORA custom controls: app-styled dropdowns for Android and desktop. */
(() => {
  'use strict';
  if (window.__NEXORA_CUSTOM_CONTROLS__) return;
  window.__NEXORA_CUSTOM_CONTROLS__ = true;

  let openWrap = null;
  const closeOpen = () => {
    if (!openWrap) return;
    openWrap.classList.remove('nx-open');
    const menu = openWrap.querySelector('.nx-select-menu');
    if (menu) menu.style.display = 'none';
    const trigger = openWrap.querySelector('.nx-select-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    openWrap = null;
  };

  const selectedText = (select) => {
    const chosen = Array.from(select.selectedOptions || []);
    if (!chosen.length) return select.multiple ? 'Choose options' : (select.options[0]?.textContent || 'Choose');
    if (select.multiple) {
      if (chosen.length === 1) return chosen[0].textContent.trim();
      return chosen.length + ' selected';
    }
    return chosen[0].textContent.trim();
  };

  function refresh(select) {
    const wrap = select.closest('.nx-select-wrap');
    if (!wrap) return;
    const trigger = wrap.querySelector('.nx-select-trigger');
    const menu = wrap.querySelector('.nx-select-menu');
    if (!trigger || !menu) return;
    trigger.querySelector('.nx-select-label').textContent = selectedText(select);
    menu.innerHTML = '';
    Array.from(select.options).forEach((option, index) => {
      if (option.disabled && !option.value) return;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'nx-select-option';
      item.setAttribute('role', select.multiple ? 'checkbox' : 'option');
      item.setAttribute('aria-selected', option.selected ? 'true' : 'false');
      item.disabled = option.disabled;
      const check = document.createElement('span');
      check.className = 'nx-select-check';
      check.textContent = option.selected ? '✓' : '';
      const label = document.createElement('span');
      label.textContent = option.textContent.trim();
      item.append(check, label);
      item.addEventListener('click', () => {
        if (select.multiple) {
          option.selected = !option.selected;
        } else {
          select.selectedIndex = index;
        }
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        refresh(select);
        if (!select.multiple) closeOpen();
      });
      menu.appendChild(item);
    });
    if (select.multiple) {
      const done = document.createElement('button');
      done.type = 'button';
      done.className = 'nx-select-done';
      done.textContent = 'Done';
      done.addEventListener('click', closeOpen);
      menu.appendChild(done);
    }
    trigger.disabled = select.disabled;
    trigger.setAttribute('aria-label', select.getAttribute('aria-label') || selectedText(select));
  }

  function position(wrap) {
    const trigger = wrap.querySelector('.nx-select-trigger');
    const menu = wrap.querySelector('.nx-select-menu');
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 190), window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    menu.style.width = width + 'px';
    menu.style.left = left + 'px';
    menu.style.top = Math.min(rect.bottom + 7, window.innerHeight - 100) + 'px';
  }

  function enhance(select) {
    if (!(select instanceof HTMLSelectElement) || select.closest('.nx-select-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'nx-select-wrap' + (select.multiple || select.classList.contains('input') || getComputedStyle(select).width === '100%' ? ' nx-select-block' : '');
    const parent = select.parentNode;
    parent.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('nx-native-select');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nx-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.className = 'nx-select-label';
    trigger.appendChild(label);

    const menu = document.createElement('div');
    menu.className = 'nx-select-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-multiselectable', select.multiple ? 'true' : 'false');
    wrap.append(trigger, menu);

    trigger.addEventListener('click', () => {
      if (wrap.classList.contains('nx-open')) { closeOpen(); return; }
      closeOpen();
      refresh(select);
      wrap.classList.add('nx-open');
      trigger.setAttribute('aria-expanded', 'true');
      openWrap = wrap;
      position(wrap);
    });
    select.addEventListener('change', () => refresh(select));
    const optionObserver = new MutationObserver(() => refresh(select));
    optionObserver.observe(select, { childList: true, subtree: true, characterData: true, attributes: true });
    refresh(select);
  }

  function scan(root) {
    if (root.matches?.('select')) enhance(root);
    root.querySelectorAll?.('select').forEach(enhance);
  }

  document.addEventListener('click', (event) => {
    if (openWrap && !openWrap.contains(event.target)) closeOpen();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeOpen();
  });
  window.addEventListener('resize', () => { if (openWrap) position(openWrap); });
  window.addEventListener('scroll', () => { if (openWrap) closeOpen(); }, true);

  const start = () => {
    scan(document);
    const observer = new MutationObserver((records) => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === 1) scan(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();