import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ═══════════════════════════════════════════════════════════════════════════
// DOM 진단 인터셉터 (임시 — 근본 원인 확인 후 제거)
// ═══════════════════════════════════════════════════════════════════════════

/** 순환 참조 안전 요약 함수 */
function safeOuter(el: Element | null, max = 200): string {
  if (!el) return 'null';
  try {
    const raw = el.outerHTML ?? '';
    return raw.length > max ? raw.slice(0, max) + '…' : raw;
  } catch {
    return `<${el.tagName?.toLowerCase() ?? '?'}>`;
  }
}

function safeText(node: Node | null, max = 60): string {
  if (!node) return 'null';
  try {
    const t = (node as any).textContent ?? '';
    return t.length > max ? t.slice(0, max) + '…' : t;
  } catch {
    return '(error reading textContent)';
  }
}

function safeOuter2(node: Node | null, max = 200): string {
  if (!node) return 'null';
  if ((node as any).outerHTML !== undefined) return safeOuter(node as Element, max);
  return `#node(type=${node.nodeType})`;
}

// ── A. removeChild 인터셉터 ─────────────────────────────────────────────────
const _removeChild = Node.prototype.removeChild as <T extends Node>(child: T) => T;
Node.prototype.removeChild = function <T extends Node>(child: T): T {
  const isInvalid = !this.contains(child);

  console.error('[DOM TRACE removeChild START]');
  console.error('timestamp:', Date.now());
  console.error('parent node object:', this);
  console.error('parent.nodeName:', this.nodeName);
  console.error('parent.id:', (this as any).id ?? 'n/a');
  console.error('parent.className:', (this as any).className ?? 'n/a');
  console.error('parent.isConnected:', this.isConnected);
  console.error('parent.parentNode:', this.parentNode);
  console.error('child node object:', child);
  console.error('child.nodeName:', child.nodeName);
  console.error('child.nodeType:', child.nodeType);
  console.error('child.textContent(요약):', safeText(child));
  console.error('child.outerHTML(요약):', safeOuter2(child));
  console.error('child.isConnected:', child.isConnected);
  console.error('child.parentNode:', child.parentNode);
  console.error('parent === child.parentNode:', this === child.parentNode);
  console.error('parent.contains(child):', this.contains(child));
  console.error('Array.from(parent.childNodes):', Array.from(this.childNodes));
  console.error('parent.outerHTML(요약):', safeOuter2(this));
  console.error('document.activeElement:', document.activeElement);
  console.error('location.pathname:', location.pathname);
  console.error('removeChild call stack:', new Error('removeChild call stack').stack);

  if (isInvalid) {
    console.error('[DOM TRACE removeChild INVALID RELATION]');
  }

  return _removeChild.call(this, child) as T;
};

// ── B. insertBefore 인터셉터 ──────────────────────────────────────────────
const _insertBefore = Node.prototype.insertBefore as <T extends Node>(
  newNode: T, refNode: Node | null
) => T;
Node.prototype.insertBefore = function <T extends Node>(
  newNode: T, refNode: Node | null
): T {
  const isInvalid = refNode !== null && !this.contains(refNode);

  console.error('[DOM TRACE insertBefore START]');
  console.error('timestamp:', Date.now());
  console.error('parent node object:', this);
  console.error('parent.nodeName:', this.nodeName);
  console.error('parent.id:', (this as any).id ?? 'n/a');
  console.error('parent.className:', (this as any).className ?? 'n/a');
  console.error('parent.isConnected:', this.isConnected);
  console.error('newNode object:', newNode);
  console.error('newNode.nodeName:', newNode.nodeName);
  console.error('newNode.textContent(요약):', safeText(newNode));
  console.error('newNode.outerHTML(요약):', safeOuter2(newNode));
  console.error('newNode.parentNode:', newNode.parentNode);
  console.error('newNode.isConnected:', newNode.isConnected);
  console.error('referenceNode object:', refNode);
  console.error('referenceNode?.nodeName:', refNode?.nodeName ?? 'null');
  console.error('referenceNode?.textContent(요약):', safeText(refNode));
  console.error('referenceNode?.outerHTML(요약):', safeOuter2(refNode));
  console.error('referenceNode?.parentNode:', refNode?.parentNode ?? 'null');
  console.error('referenceNode?.isConnected:', refNode?.isConnected ?? 'null');
  console.error('referenceNode === null:', refNode === null);
  console.error('referenceNode?.parentNode === parent:', refNode?.parentNode === this);
  console.error('parent.contains(referenceNode):', refNode ? this.contains(refNode) : 'n/a');
  console.error('Array.from(parent.childNodes):', Array.from(this.childNodes));
  console.error('parent.outerHTML(요약):', safeOuter2(this));
  console.error('document.activeElement:', document.activeElement);
  console.error('location.pathname:', location.pathname);
  console.error('insertBefore call stack:', new Error('insertBefore call stack').stack);

  if (isInvalid) {
    console.error('[DOM TRACE insertBefore INVALID REFERENCE]');
  }

  return _insertBefore.call(this, newNode, refNode) as T;
};

// ═══════════════════════════════════════════════════════════════════════════
// MutationObserver (디버그 모드: localStorage.__DEBUG_DOM === "1")
// ═══════════════════════════════════════════════════════════════════════════
function setupDebugMutationObserver() {
  if (localStorage.getItem('__DEBUG_DOM') !== '1') return;

  function isSelectRelated(target: Node): boolean {
    const el = target as Element;
    if (!el.closest) return false;
    // SelectTrigger button 또는 SelectContent 또는 그 자손
    return !!(
      el.closest('button[role="combobox"]') ||
      el.closest('[data-radix-select-content]') ||
      el.closest('[data-state]')?.closest('button[role="combobox"]') ||
      // SelectValue span (내부 span)
      (el.tagName === 'SPAN' && el.closest('button[role="combobox"]'))
    );
  }

  function isButtonInternalNode(node: Node): boolean {
    const el = node as Element;
    if (!el.closest) return false;
    return !!(el.closest?.('button[role="combobox"]'));
  }

  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      const isRelevant =
        isSelectRelated(mut.target) ||
        Array.from(mut.addedNodes).some(n => isSelectRelated(n)) ||
        Array.from(mut.removedNodes).some(n => isSelectRelated(n));

      if (!isRelevant) continue;

      const isSelectValue =
        isButtonInternalNode(mut.target) ||
        Array.from(mut.removedNodes).some(n => isButtonInternalNode(n)) ||
        Array.from(mut.addedNodes).some(n => isButtonInternalNode(n));

      const label = isSelectValue
        ? '[MUTATION TRACE SELECT VALUE NODE]'
        : '[MUTATION TRACE]';

      console.error(label, {
        type: mut.type,
        target: mut.target,
        'target.nodeName': mut.target.nodeName,
        'target summary': safeOuter2(mut.target),
        addedNodes: Array.from(mut.addedNodes).map(n => safeOuter2(n, 80)),
        removedNodes: Array.from(mut.removedNodes).map(n => safeOuter2(n, 80)),
        previousSibling: safeOuter2(mut.previousSibling),
        nextSibling: safeOuter2(mut.nextSibling),
        timestamp: Date.now(),
        pathname: location.pathname,
      });
    }
  });

  // 앱 root 전체를 감시 (subtree: true)
  const root = document.getElementById('root');
  if (root) {
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state'] });
    console.error('[MUTATION TRACE] Observer started on #root');
  }
}

// DOM이 준비된 후 Observer 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupDebugMutationObserver);
} else {
  setupDebugMutationObserver();
}
// ═══════════════════════════════════════════════════════════════════════════

createRoot(document.getElementById('root')!).render(<App />);
