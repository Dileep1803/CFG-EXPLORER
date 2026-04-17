/* ═══════════════════════════════════════════════════
   PARTICLE SYSTEM
═══════════════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['rgba(0,229,255,', 'rgba(176,77,255,', 'rgba(0,255,163,'];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
    }
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,229,255,${0.05 * (1 - dist/90)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ═══════════════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════════════ */
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  const btn = document.getElementById('theme-toggle-btn');
  btn.innerHTML = isLight ? '☾ Dark Mode' : '☀ Light Mode';
}

/* ═══════════════════════════════════════════════════
   GRAMMAR STATE
═══════════════════════════════════════════════════ */
let grammar = { productions: [], startSymbol: 'S', nonterminals: new Set(), terminals: new Set() };
let derivationState = { leftmost: [], rightmost: [], trees: [], currentStep: 0, mode: 'leftmost', autoTimer: null };
let currentTreeView = 'single';
let currentDerivTab = 'leftmost';

/* ═══════════════════════════════════════════════════
   PRODUCTION MANAGEMENT
═══════════════════════════════════════════════════ */
function addProduction(val = '') {
  const list = document.getElementById('productions-list');
  const row = document.createElement('div');
  row.className = 'production-row';
  row.innerHTML = `
    <input type="text" class="prod-input" placeholder="e.g. S → aSb | ε" value="${val}"
      oninput="updateGrammar()">
    <button class="del-btn" onclick="removeProduction(this)">×</button>`;
  list.appendChild(row);
  updateGrammar();
}

function removeProduction(btn) {
  btn.parentElement.remove();
  updateGrammar();
}

function updateGrammar() {
  const inputs = document.querySelectorAll('.prod-input');
  const prods = [];
  const nonterminals = new Set();
  const terminals = new Set();

  inputs.forEach(inp => {
    const val = inp.value.trim();
    if (!val) return;
    // Parse "A → X | Y | Z" or "A -> X | Y | Z"
    const match = val.match(/^([A-Z][A-Za-z0-9_']*)\s*(?:→|->)\s*(.+)$/);
    if (match) {
      const lhs = match[1];
      const rhs = match[2].split('|').map(s => s.trim()).filter(s => s !== '');
      nonterminals.add(lhs);
      rhs.forEach(prod => {
        // Identify terminals and nonterminals in each production
        [...prod].forEach(ch => {
          if (ch === 'ε' || ch === ' ') return;
          if (/[A-Z]/.test(ch)) nonterminals.add(ch);
          else terminals.add(ch);
        });
        prods.push({ lhs, rhs: prod });
      });
    }
  });

  grammar.productions = prods;
  grammar.nonterminals = nonterminals;
  grammar.terminals = terminals;

  // Update start symbol dropdown
  const sel = document.getElementById('start-symbol');
  const cur = sel.value;
  sel.innerHTML = '';
  nonterminals.forEach(nt => {
    const opt = document.createElement('option');
    opt.value = nt; opt.textContent = nt;
    if (nt === cur || nt === 'S') opt.selected = (nt === cur || (!cur && nt === 'S'));
    sel.appendChild(opt);
  });
  grammar.startSymbol = sel.value || (nonterminals.size ? [...nonterminals][0] : 'S');

  updateGrammarHint();
  showError('');
}

function updateGrammarHint() {
  const hint = document.getElementById('grammar-hint');
  if (!grammar.productions.length) { hint.textContent = '—'; return; }

  let hasEpsilon = grammar.productions.some(p => p.rhs === 'ε');
  let hasRecursion = grammar.productions.some(p => [...p.rhs].some(c => grammar.nonterminals.has(c)));
  let text = [];
  if (hasEpsilon) text.push('ε-productions');
  if (hasRecursion) text.push('recursive');
  hint.textContent = text.length ? text.join(', ') : 'standard CFG';
  hint.style.color = 'var(--neon-green)';
}

function showError(msg) {
  const el = document.getElementById('prod-error');
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

/* ═══════════════════════════════════════════════════
   EXAMPLES
═══════════════════════════════════════════════════ */
const EXAMPLES = {
  balanced: {
    prods: ['S → ( S ) S | ε'],
    start: 'S', string: '(())'
  },
  arithmetic: {
    prods: ['E → E + E | E * E | ( E ) | id'],
    start: 'E', string: 'id+id*id'
  },
  palindrome: {
    prods: ['S → a S a | b S b | a | b | ε'],
    start: 'S', string: 'abba'
  },
  ambiguous: {
    prods: ['S → S + S | S * S | a'],
    start: 'S', string: 'a+a*a'
  },
  anbn: {
    prods: ['S → a S b | ε'],
    start: 'S', string: 'aaabbb'
  }
};

function loadExample(name) {
  const ex = EXAMPLES[name];
  const list = document.getElementById('productions-list');
  list.innerHTML = '';
  ex.prods.forEach(p => addProduction(p));
  document.getElementById('input-string').value = ex.string;
  updateGrammar();
  setTimeout(() => {
    document.getElementById('start-symbol').value = ex.start;
    grammar.startSymbol = ex.start;
  }, 50);
}

/* ═══════════════════════════════════════════════════
   PARSING ENGINE — Memoized Recursive Descent
   Handles left-recursive grammars safely via memoization,
   cycle detection, and a global work budget.
═══════════════════════════════════════════════════ */

let _parseWorkDone = 0;
const _PARSE_WORK_LIMIT = 50000;
let _parseMemo = new Map();
let _parseInProgress = new Set();

/**
 * Parse a single RHS string into an array of symbols.
 * Handles multi-char nonterminals and terminals.
 */
function parseRHS(rhs, nonterminals) {
  if (rhs === 'ε') return ['ε'];
  const syms = [];
  let i = 0;
  while (i < rhs.length) {
    if (rhs[i] === ' ') { i++; continue; }
    // Try to match a nonterminal (uppercase + optional lowercase/digits/etc)
    let matched = false;
    for (const nt of [...nonterminals].sort((a,b) => b.length - a.length)) {
      if (rhs.startsWith(nt, i)) {
        syms.push(nt); i += nt.length; matched = true; break;
      }
    }
    if (!matched) { syms.push(rhs[i]); i++; }
  }
  return syms;
}

/**
 * Build all parse trees for the given string using recursive parsing.
 * Uses memoization and cycle detection for left-recursive grammars.
 * Returns an array of tree objects { symbol, children }
 */
function buildParseTrees(symbol, inputArr, nonterminals, productions, depth = 0) {
  if (depth > 20 || _parseWorkDone > _PARSE_WORK_LIMIT) return [];
  _parseWorkDone++;

  const inputKey = inputArr.join('');
  const memoKey = symbol + '|' + inputKey;

  // Return cached result if available
  if (_parseMemo.has(memoKey)) return _parseMemo.get(memoKey);

  // Detect left-recursion cycles: if we're already computing this exact (symbol, input),
  // return empty to break the cycle
  if (_parseInProgress.has(memoKey)) return [];
  _parseInProgress.add(memoKey);

  const results = [];
  const relevantProds = productions.filter(p => p.lhs === symbol);

  for (const prod of relevantProds) {
    if (_parseWorkDone > _PARSE_WORK_LIMIT) break;

    const rhs = parseRHS(prod.rhs, nonterminals);

    if (rhs[0] === 'ε') {
      if (inputArr.length === 0) {
        results.push({ symbol, children: [{ symbol: 'ε', children: [], isLeaf: true }], isLeaf: false });
      }
      continue;
    }

    // Try to partition inputArr into |rhs| segments matching each rhs symbol
    const partitions = partition(inputArr, rhs, nonterminals, productions, depth + 1);
    for (const parts of partitions) {
      if (_parseWorkDone > _PARSE_WORK_LIMIT || results.length > 50) break;
      const childCombos = cartesian(parts);
      for (const combo of childCombos) {
        results.push({ symbol, children: combo, isLeaf: false });
        if (results.length > 50) break;
      }
    }
  }

  _parseInProgress.delete(memoKey);

  // Cache only a limited number of results
  const capped = results.slice(0, 20);
  _parseMemo.set(memoKey, capped);
  return capped;
}

/**
 * Partition inputArr into parts for each symbol in rhs.
 * Returns array of arrays of arrays of trees.
 */
function partition(inputArr, rhs, nonterminals, productions, depth) {
  if (_parseWorkDone > _PARSE_WORK_LIMIT) return [];

  if (rhs.length === 0) {
    return inputArr.length === 0 ? [[]] : [];
  }

  const sym = rhs[0];
  const rest = rhs.slice(1);
  const isNT = nonterminals.has(sym);
  const results = [];

  if (isNT) {
    for (let len = 0; len <= inputArr.length; len++) {
      if (_parseWorkDone > _PARSE_WORK_LIMIT || results.length > 50) break;
      const prefix = inputArr.slice(0, len);
      const suffix = inputArr.slice(len);
      const subtrees = buildParseTrees(sym, prefix, nonterminals, productions, depth);
      if (subtrees.length === 0) continue;
      const restParts = partition(suffix, rest, nonterminals, productions, depth);
      for (const rp of restParts) {
        results.push([subtrees, ...rp]);
        if (results.length > 50) break;
      }
    }
  } else {
    // Terminal — may be multi-char like "id"
    if (inputArr.length < sym.length) return [];
    const prefix = inputArr.slice(0, sym.length).join('');
    if (prefix !== sym) return [];
    const leafNode = [{ symbol: sym, children: [], isLeaf: true }];
    const restParts = partition(inputArr.slice(sym.length), rest, nonterminals, productions, depth);
    for (const rp of restParts) {
      results.push([leafNode, ...rp]);
    }
  }
  return results;
}

/**
 * Cartesian product of arrays of trees.
 */
function cartesian(parts) {
  if (parts.length === 0) return [[]];
  const [first, ...rest] = parts;
  const restCombos = cartesian(rest);
  const results = [];
  for (const item of first) {
    for (const rc of restCombos) {
      results.push([item, ...rc]);
    }
    if (results.length > 100) break; // Limit for performance
  }
  return results;
}

/* ═══════════════════════════════════════════════════
   DERIVATION ENGINE
═══════════════════════════════════════════════════ */

/**
 * Build leftmost derivation steps from a parse tree.
 * Returns array of sentential forms (strings).
 */
function treeToDerivation(tree, nonterminals, type = 'leftmost') {
  const steps = [tree.symbol];
  function expand(sentForm) {
    // Find target NT index
    let idx = -1;
    if (type === 'leftmost') {
      idx = sentForm.findIndex(s => nonterminals.has(s));
    } else {
      for (let i = sentForm.length - 1; i >= 0; i--) {
        if (nonterminals.has(sentForm[i])) { idx = i; break; }
      }
    }
    if (idx === -1) return; // All terminals

    // Find which node to expand — walk tree in order
    const expanded = expandNode(tree, sentForm, idx, type, nonterminals);
    if (!expanded) return;

    steps.push(expanded.result);
    if (expanded.result.some(s => nonterminals.has(s))) {
      expand(expanded.result);
    }
  }

  expand([tree.symbol]);
  return steps;
}

function expandNode(tree, sentForm, targetIdx, type, nonterminals) {
  // Build the expansion by flattening the tree in order
  const flat = flattenTree(tree);
  if (!flat) return null;
  const newForm = [...sentForm];
  const expansion = flat[targetIdx];
  if (!expansion) return null;
  newForm.splice(targetIdx, 1, ...expansion);
  return { result: newForm };
}

function flattenTree(node) {
  if (node.isLeaf) return [[node.symbol]];
  if (node.symbol === 'ε') return [['ε']];
  const result = [];
  for (const child of node.children) {
    const sub = flattenTree(child);
    if (!sub) return null;
    result.push(...sub);
  }
  return result;
}

/**
 * Generate step-by-step derivation from a parse tree.
 */
function generateDerivationSteps(tree, nonterminals, type) {
  const steps = [];
  const currentForm = [grammar.startSymbol];
  steps.push([...currentForm]);

  function traverse(node, sentForm) {
    if (node.isLeaf) return sentForm;
    if (node.symbol === 'ε') return sentForm.filter(s => s !== 'ε');

    // Find this node's position in sentForm
    let targetIdx = -1;
    if (type === 'leftmost') {
      targetIdx = sentForm.findIndex(s => nonterminals.has(s));
    } else {
      for (let i = sentForm.length - 1; i >= 0; i--) {
        if (nonterminals.has(sentForm[i])) { targetIdx = i; break; }
      }
    }
    if (targetIdx === -1) return sentForm;

    // Get expansion of this node
    const childSymbols = node.children.map(c => c.symbol);
    const newForm = [...sentForm];
    newForm.splice(targetIdx, 1, ...childSymbols);
    steps.push([...newForm]);

    // Recurse on children
    let form = newForm;
    if (type === 'leftmost') {
      for (const child of node.children) {
        if (!child.isLeaf) form = traverse(child, form);
      }
    } else {
      for (let i = node.children.length - 1; i >= 0; i--) {
        if (!node.children[i].isLeaf) form = traverse(node.children[i], form);
      }
    }
    return form;
  }

  traverse(tree, currentForm);
  return steps;
}

/* ═══════════════════════════════════════════════════
   MAIN RUN FUNCTION
═══════════════════════════════════════════════════ */
function runDerivation(mode) {
  const inputStr = document.getElementById('input-string').value.trim();
  grammar.startSymbol = document.getElementById('start-symbol').value;

  if (!grammar.productions.length) {
    showError('Please add at least one production rule.'); return;
  }
  if (!grammar.startSymbol) {
    showError('Please select a start symbol.'); return;
  }
  showError('');

  // Show loading
  document.getElementById('loading').classList.add('visible');

  setTimeout(() => {
    const inputArr = inputStr === 'ε' ? [] : [...inputStr];

    // Reset parser state for fresh run
    _parseWorkDone = 0;
    _parseMemo = new Map();
    _parseInProgress = new Set();

    // Build parse trees
    const trees = buildParseTrees(
      grammar.startSymbol, inputArr,
      grammar.nonterminals, grammar.productions
    );

    derivationState.trees = trees;

    // Generate derivation steps for each tree
    let leftSteps = [], rightSteps = [];
    if (trees.length > 0) {
      leftSteps  = generateDerivationSteps(trees[0], grammar.nonterminals, 'leftmost');
      rightSteps = generateDerivationSteps(trees[0], grammar.nonterminals, 'rightmost');
    }

    derivationState.leftmost  = leftSteps;
    derivationState.rightmost = rightSteps;
    derivationState.currentStep = 0;

    // Update UI
    document.getElementById('loading').classList.remove('visible');
    updateStatus(trees, inputStr);
    renderDerivationSteps(mode === 'rightmost' ? 'rightmost' : 'leftmost');

    if (trees.length > 0) {
      document.getElementById('tree-placeholder').style.display = 'none';
      renderTree(trees[0], 'tree-svg-container');
      setupStepControls(leftSteps, trees[0]);
      document.getElementById('export-btn').style.display = 'block';

      if (trees.length >= 2 && (mode === 'both' || mode === 'ambig')) {
        switchTreeView('ambig');
        renderAmbiguityView(trees);
      }
    } else {
      document.getElementById('tree-placeholder').style.display = 'flex';
      document.getElementById('tree-svg-container').innerHTML = '';
    }

    renderOutputReport(trees, inputStr, leftSteps);
  }, 400);
}

/* ═══════════════════════════════════════════════════
   STATUS BAR
═══════════════════════════════════════════════════ */
function updateStatus(trees, inputStr) {
  const accept = document.getElementById('stat-accept');
  const derivs = document.getElementById('stat-derivations');
  const ambig  = document.getElementById('stat-ambig');

  if (trees.length > 0) {
    accept.className = 'stat-pill green';
    accept.innerHTML = '<div class="stat-dot"></div> Accepted';
  } else {
    accept.className = 'stat-pill red';
    accept.innerHTML = '<div class="stat-dot"></div> Rejected';
  }

  derivs.className = 'stat-pill blue';
  derivs.textContent = `${trees.length} parse tree${trees.length !== 1 ? 's' : ''}`;

  if (trees.length >= 2) {
    ambig.className = 'stat-pill amber';
    ambig.innerHTML = '<div class="stat-dot"></div> Ambiguous!';
    document.getElementById('ambig-alert').style.display = 'block';
    document.getElementById('ambig-alert-msg').textContent =
      `${trees.length} distinct parse trees found — grammar is ambiguous!`;
  } else if (trees.length === 1) {
    ambig.className = 'stat-pill green';
    ambig.textContent = 'Unambiguous (1 tree)';
    document.getElementById('ambig-alert').style.display = 'none';
  } else {
    ambig.className = 'stat-pill';
    ambig.textContent = '— ambiguity';
    document.getElementById('ambig-alert').style.display = 'none';
  }
}

/* ═══════════════════════════════════════════════════
   DERIVATION STEPS DISPLAY
═══════════════════════════════════════════════════ */
function renderDerivationSteps(type) {
  currentDerivTab = type;
  document.getElementById('dtab-left').className  = 'deriv-tab' + (type === 'leftmost'  ? ' active' : '');
  document.getElementById('dtab-right').className = 'deriv-tab' + (type === 'rightmost' ? ' active' : '');

  const steps = type === 'leftmost' ? derivationState.leftmost : derivationState.rightmost;
  const container = document.getElementById('deriv-steps');
  const finalEl   = document.getElementById('deriv-final');
  const noDerivEl = document.getElementById('no-deriv');

  container.innerHTML = '';
  finalEl.style.display = 'none';
  noDerivEl.style.display = 'none';

  if (!steps.length) {
    noDerivEl.style.display = 'block';
    return;
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const div = document.createElement('div');
    div.className = 'deriv-step';

    const num = document.createElement('div');
    num.className = 'step-num';
    num.textContent = i;

    const content = document.createElement('div');
    content.className = 'step-content';

    // Find changed symbol for highlight
    let html = '';
    if (i > 0) {
      const prev = steps[i-1];
      let highlightIdx = -1;
      // Find first difference
      for (let k = 0; k < step.length; k++) {
        if (prev[k] !== step[k]) { highlightIdx = k; break; }
      }
      step.forEach((sym, idx) => {
        const expanded = idx >= prev.length || sym !== prev[idx];
        if (grammar.nonterminals && grammar.nonterminals.has(sym) && idx === highlightIdx) {
          html += `<span class="highlight">${sym}</span>`;
        } else {
          html += sym === 'ε' ? 'ε' : sym;
        }
      });
      if (i < steps.length - 1) {
        content.innerHTML = html;
        div.appendChild(num);
        div.appendChild(content);
        const arrow = document.createElement('span');
        arrow.className = 'step-arrow';
        arrow.textContent = '⇒';
        content.appendChild(document.createElement('br'));
        content.appendChild(arrow);
      } else {
        content.innerHTML = html;
      }
    } else {
      content.textContent = step.join('');
    }

    div.appendChild(num);
    div.appendChild(content);
    container.appendChild(div);
  }

  // Final string
  const last = steps[steps.length - 1];
  const finalStr = last.filter(s => s !== 'ε').join('') || 'ε';
  finalEl.textContent = `⊢* ${finalStr}`;
  finalEl.style.display = 'block';
}

function switchDeriv(type) {
  renderDerivationSteps(type);
}

/* ═══════════════════════════════════════════════════
   D3 TREE RENDERING
═══════════════════════════════════════════════════ */
function renderTree(treeData, containerId, animate = true) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const W = container.clientWidth  || 600;
  const H = container.clientHeight || 460;

  const svg = d3.select(container).append('svg')
    .attr('width', '100%').attr('height', '100%')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .style('background', 'transparent');

  // Add defs for glow filter
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', `glow-${containerId}`);
  filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Convert to D3 hierarchy
  const root = d3.hierarchy(treeData, d => d.children && d.children.length ? d.children : null);
  const treeLayout = d3.tree().size([W - 60, H - 80]);
  treeLayout(root);

  const g = svg.append('g').attr('transform', 'translate(30, 40)');

  // Draw links
  g.selectAll('.link-line')
    .data(root.links())
    .enter().append('path')
    .attr('class', 'link-line')
    .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y))
    .style('opacity', 0)
    .transition().duration(animate ? 500 : 0).delay((d, i) => animate ? i * 30 : 0)
    .style('opacity', 1);

  // Draw nodes
  const node = g.selectAll('.node-group')
    .data(root.descendants())
    .enter().append('g')
    .attr('class', 'node-group')
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('cursor', 'pointer');

  node.append('circle')
    .attr('r', 0)
    .attr('class', 'node-circle')
    .attr('fill', d => {
      if (d.data.isLeaf) return 'rgba(0,255,163,0.15)';
      if (grammar.nonterminals && grammar.nonterminals.has(d.data.symbol)) return 'rgba(0,229,255,0.1)';
      return 'rgba(176,77,255,0.1)';
    })
    .attr('stroke', d => {
      if (d.data.isLeaf) return '#00ffa3';
      if (grammar.nonterminals && grammar.nonterminals.has(d.data.symbol)) return '#00e5ff';
      return '#b04dff';
    })
    .attr('stroke-width', 1.5)
    .style('filter', `url(#glow-${containerId})`)
    .transition().duration(animate ? 400 : 0).delay((d, i) => animate ? i * 40 : 0)
    .attr('r', d => d.data.isLeaf ? 8 : 11);

  node.append('text')
    .attr('class', 'node-label')
    .attr('fill', d => {
      if (d.data.isLeaf) return '#00ffa3';
      if (grammar.nonterminals && grammar.nonterminals.has(d.data.symbol)) return '#00e5ff';
      return '#b04dff';
    })
    .text(d => d.data.symbol)
    .style('font-size', d => d.data.symbol.length > 2 ? '9px' : '11px')
    .style('opacity', 0)
    .transition().duration(animate ? 300 : 0).delay((d, i) => animate ? i * 40 + 200 : 0)
    .style('opacity', 1);

  // Hover effects
  node.on('mouseover', function(event, d) {
    d3.select(this).select('circle')
      .transition().duration(150)
      .attr('r', d.data.isLeaf ? 11 : 14)
      .attr('stroke-width', 2.5);
    // Show tooltip
    svg.append('text')
      .attr('id', 'tooltip-text')
      .attr('x', d.x + 35).attr('y', d.y + 38)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Share Tech Mono').style('font-size', '10px')
      .style('fill', 'var(--neon-amber)')
      .text(d.data.isLeaf ? 'terminal' : 'nonterminal');
  }).on('mouseout', function(event, d) {
    d3.select(this).select('circle')
      .transition().duration(150)
      .attr('r', d.data.isLeaf ? 8 : 11)
      .attr('stroke-width', 1.5);
    svg.select('#tooltip-text').remove();
  });
}

/* ═══════════════════════════════════════════════════
   AMBIGUITY VIEW
═══════════════════════════════════════════════════ */
function renderAmbiguityView(trees) {
  document.getElementById('ambig-container').classList.add('visible');
  document.getElementById('single-tree-view').style.display = 'none';

  if (trees.length >= 1) renderTree(trees[0], 'ambig-svg-1', false);
  if (trees.length >= 2) renderTree(trees[1], 'ambig-svg-2', false);
}

function switchTreeView(mode) {
  currentTreeView = mode;
  document.getElementById('tab-single').className = 'tree-tab' + (mode === 'single' ? ' active' : '');
  document.getElementById('tab-ambig').className  = 'tree-tab' + (mode === 'ambig'  ? ' active' : '');

  if (mode === 'single') {
    document.getElementById('single-tree-view').style.display = 'block';
    document.getElementById('ambig-container').classList.remove('visible');
    if (derivationState.trees.length > 0) {
      renderTree(derivationState.trees[0], 'tree-svg-container');
    }
  } else {
    document.getElementById('single-tree-view').style.display = 'none';
    document.getElementById('ambig-container').classList.add('visible');
    if (derivationState.trees.length >= 2) {
      renderAmbiguityView(derivationState.trees);
    } else if (derivationState.trees.length === 1) {
      // Show the single tree in Tree 1, and a message in Tree 2
      renderTree(derivationState.trees[0], 'ambig-svg-1', false);
      document.getElementById('ambig-svg-2').innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:360px;padding:30px;text-align:center">
          <div style="width:50px;height:50px;border:1.5px solid rgba(0,255,163,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:14px;opacity:0.6">
            <span style="font-size:1.4rem;color:var(--neon-green)">✓</span>
          </div>
          <div style="font-family:var(--font-display);font-size:0.6rem;letter-spacing:0.15em;color:var(--neon-green);margin-bottom:8px">UNAMBIGUOUS</div>
          <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-sec);line-height:1.6">
            No second parse tree exists.<br>
            This grammar produces exactly<br>
            one derivation for this input.
          </div>
        </div>`;
    } else {
      document.getElementById('ambig-svg-1').innerHTML = '<div style="padding:40px;color:var(--text-dim);font-family:var(--font-mono);font-size:0.8rem;text-align:center">No parse trees</div>';
      document.getElementById('ambig-svg-2').innerHTML = '';
    }
  }
}

/* ═══════════════════════════════════════════════════
   STEP-BY-STEP ANIMATION
═══════════════════════════════════════════════════ */
let currentAnimStep = 0;
let animSteps = [];
let autoTimer = null;

function setupStepControls(steps, tree) {
  animSteps = steps;
  currentAnimStep = steps.length - 1;
  document.getElementById('step-controls').classList.add('visible');
  updateStepCounter();
}

function stepForward() {
  if (currentAnimStep < animSteps.length - 1) {
    currentAnimStep++;
    updateStepHighlight();
  }
}

function stepBack() {
  if (currentAnimStep > 0) {
    currentAnimStep--;
    updateStepHighlight();
  }
}

function updateStepHighlight() {
  updateStepCounter();
  // Highlight corresponding derivation step
  const stepEls = document.querySelectorAll('.deriv-step');
  stepEls.forEach((el, i) => {
    el.style.background = i === currentAnimStep ? 'rgba(0,229,255,0.08)' : '';
    el.style.borderRadius = '6px';
  });
  if (stepEls[currentAnimStep]) {
    stepEls[currentAnimStep].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function updateStepCounter() {
  document.getElementById('step-counter').textContent =
    `Step ${currentAnimStep} / ${Math.max(0, animSteps.length - 1)}`;
}

function toggleAutoPlay() {
  const btn = document.getElementById('auto-play-btn');
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btn.textContent = '▶▶ Auto';
  } else {
    currentAnimStep = 0;
    autoTimer = setInterval(() => {
      if (currentAnimStep >= animSteps.length - 1) {
        clearInterval(autoTimer); autoTimer = null;
        btn.textContent = '▶▶ Auto';
        return;
      }
      stepForward();
    }, 700);
    btn.textContent = '⏸ Stop';
  }
}

/* ═══════════════════════════════════════════════════
   OUTPUT REPORT
═══════════════════════════════════════════════════ */
function renderOutputReport(trees, inputStr, steps) {
  const el = document.getElementById('output-report');
  const isAccepted = trees.length > 0;
  const isAmbig = trees.length >= 2;

  el.innerHTML = `
    <div style="margin-bottom:8px">
      <span style="color:var(--text-dim)">String:</span>
      <span style="color:var(--neon-amber);margin-left:6px">"${inputStr}"</span>
    </div>
    <div style="margin-bottom:8px">
      <span style="color:var(--text-dim)">Result:</span>
      <span style="color:${isAccepted ? 'var(--neon-green)' : 'var(--neon-pink)'};margin-left:6px">
        ${isAccepted ? '✓ Accepted' : '✗ Not Generated'}
      </span>
    </div>
    <div style="margin-bottom:8px">
      <span style="color:var(--text-dim)">Parse trees:</span>
      <span style="color:var(--neon-blue);margin-left:6px">${trees.length}</span>
    </div>
    <div style="margin-bottom:8px">
      <span style="color:var(--text-dim)">Derivation steps:</span>
      <span style="color:var(--neon-blue);margin-left:6px">${Math.max(0, steps.length - 1)}</span>
    </div>
    <div>
      <span style="color:var(--text-dim)">Ambiguity:</span>
      <span style="color:${isAmbig ? 'var(--neon-pink)' : 'var(--neon-green)'};margin-left:6px">
        ${isAmbig ? '⚠ Ambiguous!' : isAccepted ? '✓ Unambiguous' : '—'}
      </span>
    </div>
    ${isAmbig ? `<div style="margin-top:10px;padding:8px;border:1px solid rgba(255,45,120,0.3);border-radius:6px;background:rgba(255,45,120,0.06);font-size:0.72rem;color:#ff9ab8;line-height:1.5">
      The grammar produces ${trees.length} distinct parse trees for "${inputStr}".
      Switch to "Ambiguity Compare" view to see them side by side.
    </div>` : ''}
  `;
}

/* ═══════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════ */
function exportTree() {
  const svgEl = document.querySelector('#tree-svg-container svg');
  if (!svgEl) return;

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const W = svgEl.clientWidth || 600;
  const H = svgEl.clientHeight || 460;
  canvas.width = W * 2; canvas.height = H * 2;
  ctx.scale(2, 2);
  ctx.fillStyle = '#060b16';
  ctx.fillRect(0, 0, W, H);

  const img = new Image();
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const a = document.createElement('a');
    a.download = 'parse-tree.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  img.src = url;
}

/* ═══════════════════════════════════════════════════
   EDUCATIONAL ACCORDION
═══════════════════════════════════════════════════ */
function toggleEdu(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('.edu-icon');
  body.classList.toggle('open');
  icon.classList.toggle('open');
}

/* ═══════════════════════════════════════════════════
   INIT — Load default example
═══════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  loadExample('anbn');
});
