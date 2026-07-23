---
name: removeChild 배포 버그 수정
description: Radix UI Select + Presence 조합에서 배포(production) 환경에서만 발생하는 removeChild/insertBefore 오류의 근본 원인과 해결 패턴 (소스코드 추적 완료)
---

## 근본 원인 (소스코드 추적으로 확인됨)

### SelectItemText portal 메커니즘 (`@radix-ui/react-select` v2.3.3, line 1034)

```javascript
// SelectItemText 렌더 내부:
itemContext.isSelected && context.valueNode && !context.valueNodeHasChildren && !shouldShowPlaceholder(context.value)
  ? ReactDOM.createPortal(itemTextProps.children, context.valueNode)
  : null
```

선택된 SelectItem의 텍스트가 **`context.valueNode` (SelectValue `<span>`) 에 portal됨**.
`context.valueNode`는 SelectTrigger `<button>` 내부에 있음 → 컴포넌트 스택에 `button`이 표시되는 이유.

### SelectContent의 이중 Portal 구조

Select 닫혀 있을 때:
- `SelectContentFragment` → `ReactDOM.createPortal(children, DocumentFragment)` (오프스크린)
- 그 안의 selected SelectItem → `ReactDOM.createPortal(text, context.valueNode)` (button 내부 span)

### Presence 닫기 경로 (`@radix-ui/react-presence` line 96-107)

```javascript
if (currentAnimationName === "none" || styles?.display === "none") {
  send("UNMOUNT");   // ← 닫기 애니메이션 없으면 직접 UNMOUNT
} else {
  if (wasPresent && isAnimating) send("ANIMATION_OUT");  // → unmountSuspended
  else send("UNMOUNT");
}
```

### 실패 경로 (닫기 애니메이션 있을 때)

1. 항목 선택 → context.open=false → `data-state="closed"` + 닫기 애니메이션 클래스 적용
2. `currentAnimationName !== "none"` → `ANIMATION_OUT` → **unmountSuspended** (SelectContentImpl 아직 렌더됨)
3. 뮤테이션 성공 → navigation/setAddOpen(false) → form 언마운트 커밋
4. animationend 이벤트 → `ANIMATION_END` → unmounted → SelectContentFragment 커밋
5. 두 커밋(3, 4) 사이에 `context.valueNode` portal 조작 충돌:
   - removeChild 실패: `context.valueNode.removeChild(text)` — text 이미 제거됨
   - insertBefore 실패: `context.valueNode.insertBefore(text_new, text_old)` — text_old 이미 없음

### 열기 애니메이션은 무관

close 경로는 `currentAnimationName`만 체크. 열기 애니메이션 유무는 Presence 닫기 동작에 영향 없음.

## 적용된 해결책

### 1. 닫기 애니메이션 제거 (핵심 수정)
`select.tsx` SelectContent className에서 `data-[state=closed]:animate-out zoom-out-95 fade-out-0` 제거.
→ 닫힐 때 `currentAnimationName === "none"` → UNMOUNT 직행 → unmountSuspended 없음 → 두 커밋 경쟁 없음.

열기 애니메이션(`data-[state=open]:animate-in` 등)은 유지 (close 경로와 무관).

### 2. 2단계 안전 navigation 패턴 (new.tsx, edit.tsx)
```tsx
const [transitioning, setTransitioning] = useState(false);

useEffect(() => {
  if (!someMutation.isSuccess) return;
  queryClient.invalidateQueries({ queryKey: ... });
  toast.success("...");
  setTransitioning(true); // Phase 1: 폼 언마운트
}, [someMutation.isSuccess]);

useEffect(() => {
  if (!transitioning) return;
  setLocation("/target"); // Phase 2: Radix DOM 정리 후 navigate
}, [transitioning, setLocation]);

if (transitioning) return null;
```

### 3. SelectContent Portal 제거 (별도 적용됨)
`SelectPrimitive.Portal` 래퍼를 제거하고 인라인 렌더링.
이 변경의 독립적 효과는 미확인이나, 닫기 애니메이션 제거가 핵심 수정임.

## v3 = App

프로덕션 번들 마지막 줄: `CE.createRoot(document.getElementById("root")).render(c.jsx(v3,{}))`
→ `v3 = App` (src/App.tsx). 컴포넌트 스택에서 v3는 루트 컴포넌트.

## 데스크탑 전용 발생

Layout은 CSS-only 반응형 (`hidden md:flex`). React 파이버 트리는 모바일/데스크탑 동일.
소스코드만으로는 데스크탑 전용 이유 미증명 — DOM 인터셉터 런타임 출력 필요.
(현재 빌드에 DOM 인터셉터 + sourcemap 포함됨, 배포 후 확인 가능)

**Why:** 닫기 애니메이션 제거가 `unmountSuspended` 경쟁 조건을 차단함.

**How to apply:** Radix Select가 있는 폼 페이지 전체에 공통 적용 (select.tsx 수정으로 전역 효과).
