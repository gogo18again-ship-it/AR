import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// ─── DOM 오류 인터셉터 (진단용, 오류 원인 특정 후 제거 예정) ──────────────────
// ErrorBoundary에 잡히기 전에 removeChild/insertBefore 실패의 정확한
// 호출 스택을 콘솔에 기록합니다. source map이 활성화된 빌드에서
// 원본 파일명과 라인번호를 확인할 수 있습니다.
const _removeChild = Node.prototype.removeChild as <T extends Node>(child: T) => T;
Node.prototype.removeChild = function <T extends Node>(child: T): T {
  if (!this.contains(child)) {
    console.error(
      '[DOM INTERCEPTOR] removeChild: node is not a child of this parent.\n' +
        '  parent:', this, '\n  child:', child,
      '\n  call stack:',
      new Error('[removeChild 호출 위치]').stack,
    );
  }
  return _removeChild.call(this, child) as T;
};

const _insertBefore = Node.prototype.insertBefore as <T extends Node>(newNode: T, refNode: Node | null) => T;
Node.prototype.insertBefore = function <T extends Node>(newNode: T, refNode: Node | null): T {
  if (refNode !== null && !this.contains(refNode)) {
    console.error(
      '[DOM INTERCEPTOR] insertBefore: refNode is not a child of this parent.\n' +
        '  parent:', this, '\n  newNode:', newNode, '\n  refNode:', refNode,
      '\n  call stack:',
      new Error('[insertBefore 호출 위치]').stack,
    );
  }
  return _insertBefore.call(this, newNode, refNode) as T;
};
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(<App />);
