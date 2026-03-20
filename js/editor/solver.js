(function () {
  function createEditorSolver(api) {
    function countEnabled(list) {
      return list.filter(Boolean).length;
    }

    function countEnabledMainSlots() {
      return countEnabled(api.getMainSlotEnabled());
    }

    function countEnabledFnSlots() {
      return countEnabled(api.getFnSlotEnabled());
    }

    function refreshEditorValues() {
      api.setActiveMainSlots(countEnabledMainSlots());
      api.setActiveFnSlots(countEnabledFnSlots());
    }

    function getAvailableMainCommands() {
      return [...new Set(api.getAvail().map(block => block.dir))];
    }

    function getAvailableFnCommands() {
      return getAvailableMainCommands().filter(dir => dir !== 'function');
    }

    function encodeState(state) {
      return `${state.x},${state.y},${state.ori}`;
    }

    function decodeState(key) {
      const [x, y, stateOri] = key.split(',');
      return { x: Number(x), y: Number(y), ori: stateOri };
    }

    function applyInstructionToState(state, dir) {
      if (!dir) return { success: false, state };

      const { cols, rows } = api.getBoardMeta();
      let next = { ...state };
      if (dir === 'forward') {
        if (state.ori === 'up') next.y = Math.max(0, state.y - 1);
        else if (state.ori === 'down') next.y = Math.min(rows - 1, state.y + 1);
        else if (state.ori === 'left') next.x = Math.max(0, state.x - 1);
        else next.x = Math.min(cols - 1, state.x + 1);

        if (api.isBlockedCell(next.x, next.y)) next = { ...state };
      } else if (dir === 'left') {
        next.ori = { up: 'left', left: 'down', down: 'right', right: 'up' }[state.ori];
      } else if (dir === 'right') {
        next.ori = { up: 'right', right: 'down', down: 'left', left: 'up' }[state.ori];
      }

      const goal = api.getGoal();
      return {
        success: next.x === goal.x && next.y === goal.y,
        state: next
      };
    }

    function buildFnPrograms() {
      const choices = [null, ...getAvailableFnCommands()];
      const programs = [];
      const activeFnIndexes = api.getFnSlotEnabled()
        .map((enabled, idx) => enabled ? idx : -1)
        .filter(idx => idx !== -1);

      function walk(posIdx, acc) {
        if (posIdx >= activeFnIndexes.length) {
          programs.push(acc.slice());
          return;
        }
        choices.forEach(choice => {
          acc.push(choice);
          walk(posIdx + 1, acc);
          acc.pop();
        });
      }

      if (!activeFnIndexes.length) return [[]];
      walk(0, []);
      return programs;
    }

    function simulateFunctionProgram(fnProgram, startState) {
      let state = { ...startState };
      for (const dir of fnProgram) {
        if (!dir) continue;
        const result = applyInstructionToState(state, dir);
        if (result.success) return { success: true, state: result.state };
        state = result.state;
      }
      return { success: false, state };
    }

    function countSolutionsForFnProgram(fnProgram) {
      const activeMainIndexes = api.getMainSlotEnabled()
        .map((enabled, idx) => enabled ? idx : -1)
        .filter(idx => idx !== -1);
      if (!activeMainIndexes.length) return 0;

      const mainChoices = [null, ...getAvailableMainCommands()];
      const player = api.getPlayer();
      let states = new Map([[encodeState({ ...player.pos, ori: player.ori }), 1]]);
      let solved = 0;
      const fnMemo = new Map();

      for (let slot = 0; slot < activeMainIndexes.length; slot++) {
        const nextStates = new Map();
        states.forEach((count, key) => {
          const state = decodeState(key);
          mainChoices.forEach(choice => {
            if (!choice) {
              nextStates.set(key, (nextStates.get(key) || 0) + count);
              return;
            }
            if (choice === 'function') {
              const memoKey = `${key}|${fnProgram.join('.')}`;
              let result = fnMemo.get(memoKey);
              if (!result) {
                result = simulateFunctionProgram(fnProgram, state);
                fnMemo.set(memoKey, result);
              }
              if (result.success) {
                solved += count;
              } else {
                const outKey = encodeState(result.state);
                nextStates.set(outKey, (nextStates.get(outKey) || 0) + count);
              }
              return;
            }
            const result = applyInstructionToState(state, choice);
            if (result.success) {
              solved += count;
            } else {
              const outKey = encodeState(result.state);
              nextStates.set(outKey, (nextStates.get(outKey) || 0) + count);
            }
          });
        });
        states = nextStates;
      }

      return solved;
    }

    function countEditorSolutions() {
      const fnPrograms = buildFnPrograms();
      let total = 0;
      fnPrograms.forEach(fnProgram => {
        total += countSolutionsForFnProgram(fnProgram);
      });
      return total;
    }

    return {
      countEnabledMainSlots,
      countEnabledFnSlots,
      refreshEditorValues,
      countEditorSolutions
    };
  }

  window.BOKS_EDITOR_SOLVER = createEditorSolver;
})();
