(function () {
  function createLevelEditor(api) {
    function syncEditorAvailableBlocks() {
      if (!api.isEditorMode()) return;
      const enabledBlocks = Object.keys(api.getEditorBlockEnabled()).filter(dir => api.getEditorBlockEnabled()[dir]);
      api.setAvailableBlocks(enabledBlocks);
    }

    function pruneProgramsByEnabledBlocks() {
      const enabledMap = api.getEditorBlockEnabled();
      const isAllowed = dir => !!enabledMap[dir];
      const prog = api.getProg();
      const fnProg = api.getFnProg();

      for (let i = 0; i < prog.length; i++) {
        if (prog[i] && !isAllowed(prog[i].dir || prog[i].direction)) prog[i] = null;
      }
      for (let i = 0; i < fnProg.length; i++) {
        if (fnProg[i] && !isAllowed(fnProg[i].dir || fnProg[i].direction)) fnProg[i] = null;
      }
    }

    function toggleEditorBlock(dir) {
      if (!api.isEditorMode()) return;
      const enabledMap = api.getEditorBlockEnabled();
      if (!Object.prototype.hasOwnProperty.call(enabledMap, dir)) return;
      enabledMap[dir] = !enabledMap[dir];
      pruneProgramsByEnabledBlocks();
      syncEditorAvailableBlocks();
      api.renderAvail();
      api.renderBoard();
      api.renderFn();
      api.refreshEditorDebug();
    }

    function setEditorMode(enabled) {
      api.setEditorModeFlag(enabled);
      document.body.classList.toggle('editor-mode', enabled);
      if (enabled) {
        api.setSlotMasks(0, 0);
        api.resetEditorBlockEnabled();
        syncEditorAvailableBlocks();
      }
      api.resetPrograms();
      api.setFnUnlockHintActive(false);
      api.setStepStartHintActive(false);
      api.renderAvail();
      api.renderBoard();
      api.renderFn();
      api.refreshEditorValues();
      api.updateDebugBadge();
    }

    function toggleEditorSlot(zone, idx) {
      if (api.isBusy() || !api.isEditorMode()) return;
      if (zone === 'main') {
        api.getMainSlotEnabled()[idx] = !api.getMainSlotEnabled()[idx];
        if (!api.getMainSlotEnabled()[idx]) api.getProg()[idx] = null;
      } else {
        api.getFnSlotEnabled()[idx] = !api.getFnSlotEnabled()[idx];
        if (!api.getFnSlotEnabled()[idx]) api.getFnProg()[idx] = null;
      }
      api.refreshEditorValues();
      api.renderBoard();
      api.renderFn();
      api.refreshEditorDebug();
    }

    function renderEditorAvail(row, sz) {
      row.classList.add('editor-blocks-row');
      ['forward', 'left', 'right', 'function'].forEach(dir => {
        const enabledMap = api.getEditorBlockEnabled();
        const item = document.createElement('div');
        item.className = 'editor-block-item' + (enabledMap[dir] ? ' enabled' : ' disabled');

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'editor-block-toggle';
        toggle.textContent = enabledMap[dir] ? 'ON' : 'OFF';
        toggle.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          toggleEditorBlock(dir);
        });

        const block = api.mkB({ id: `${dir}-editor`, ...api.getPool()[dir] }, sz, sz, 'ablock');
        block.dataset.ai = api.getAvail().findIndex(entry => entry.dir === dir);
        block.style.position = 'relative';
        block.style.top = 'auto';
        block.style.left = 'auto';
        block.style.transform = 'none';

        if (enabledMap[dir]) {
          api.bindDrag(block, 'avail', block.dataset.ai, sz);
        } else {
          block.classList.add('disabled');
        }

        item.appendChild(toggle);
        item.appendChild(block);
        row.appendChild(item);
      });
    }

    function setupGoalDrag() {
      const grid = document.getElementById('gameGrid');
      if (!grid) return;

      function start(cx, cy, target) {
        if (api.isBusy() || !api.isEditorMode() || !api.hasGoal?.() || !target?.closest('.goal-cell')) return false;
        const goalCell = target.closest('.goal-cell');
        const size = goalCell?.getBoundingClientRect().width || 48;
        const g = document.getElementById('ghost');
        g.innerHTML = api.goalSVG();
        g.style.cssText = `display:block;width:${size}px;height:${size}px;left:${cx}px;top:${cy}px;`;
        if (goalCell) goalCell.style.opacity = '0.25';
        return true;
      }

      function move(cx, cy) {
        const g = document.getElementById('ghost');
        g.style.left = cx + 'px';
        g.style.top = cy + 'px';
        g.style.display = 'none';
        const u = document.elementFromPoint(cx, cy);
        g.style.display = 'block';
        document.querySelectorAll('.cell.hi').forEach(c => c.classList.remove('hi'));
        u?.closest('.cell')?.classList.add('hi');
      }

      function end(cx, cy) {
        document.getElementById('ghost').style.display = 'none';
        document.querySelectorAll('.cell.hi').forEach(c => c.classList.remove('hi'));
        document.querySelector('.goal-cell')?.style.removeProperty('opacity');
        const u = document.elementFromPoint(cx, cy);
        const cell = u?.closest('.cell');
        if (!cell) return;
        const tx = +cell.dataset.cx;
        const ty = +cell.dataset.cy;
        const player = api.getPlayer();
        if (api.isBlockedCell(tx, ty) || (tx === player.pos.x && ty === player.pos.y)) return;
        api.setGoal({ x: tx, y: ty });
        api.initGrid();
        api.drawBackground();
        api.syncSprite();
        api.refreshEditorDebug();
      }

      grid.addEventListener('touchstart', e => {
        const target = e.target;
        if (!start(e.touches[0].clientX, e.touches[0].clientY, target)) return;
        e.preventDefault();
        e.stopPropagation();
        const mm = ev => {
          ev.preventDefault();
          move(ev.touches[0].clientX, ev.touches[0].clientY);
        };
        const mu = ev => {
          ev.preventDefault();
          end(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY);
          grid.removeEventListener('touchmove', mm);
          grid.removeEventListener('touchend', mu);
        };
        grid.addEventListener('touchmove', mm, { passive: false });
        grid.addEventListener('touchend', mu, { passive: false });
      }, { passive: false });

      grid.addEventListener('mousedown', e => {
        if (!start(e.clientX, e.clientY, e.target)) return;
        e.preventDefault();
        const mm = ev => move(ev.clientX, ev.clientY);
        const mu = ev => {
          end(ev.clientX, ev.clientY);
          document.removeEventListener('mousemove', mm);
          document.removeEventListener('mouseup', mu);
        };
        document.addEventListener('mousemove', mm);
        document.addEventListener('mouseup', mu);
      });
    }

    return {
      setupGoalDrag,
      syncEditorAvailableBlocks,
      toggleEditorBlock,
      setEditorMode,
      toggleEditorSlot,
      renderEditorAvail
    };
  }

  window.BOKS_LEVEL_EDITOR = createLevelEditor;
})();
