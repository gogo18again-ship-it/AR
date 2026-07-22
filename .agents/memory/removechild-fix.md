---
name: removeChild 배포 버그 수정
description: Radix UI Select + Presence + Portal 조합에서 배포(production) 환경에서만 발생하는 removeChild 오류의 근본 원인과 해결 패턴
---

## 근본 원인

`@radix-ui/react-select`의 `SelectItem`은 내부적으로 항상 `ReactDOM.createPortal`을 사용해 선택된 텍스트를 trigger의 `valueNode`에 렌더링한다 (외부 `SelectPrimitive.Portal` 제거와 무관).

`SelectContent` 내부에서 `@radix-ui/react-presence`의 `Presence`가 DOM 노드 생명주기를 관리한다.

**충돌 시나리오 (production 빌드에서만):**

1. 사용자가 Select를 열면 open 애니메이션(`data-[state=open]:animate-in` 등)이 시작됨
2. 빠른 선택으로 애니메이션 종료 전 `present=false`로 전환
3. Presence의 `useLayoutEffect`가 `currentAnimationName`을 확인:
   - close 애니메이션이 없으면 즉시 `UNMOUNT` → 동기적 언마운트
4. 그러나 내부 Portal(valueNode에 연결된)이 React fiber와 다른 순서로 정리됨
5. navigation 시 `setLocation` 호출 → React가 `EmployeeNew`를 언마운트하면서 fiber 클린업
6. 이미 Presence/Portal이 제거한 DOM 노드를 React가 다시 `removeChild` 시도 → `NotFoundError`

**배포 환경에서만 재현되는 이유:** 프로덕션 React는 최적화 빌드라 처리 속도가 달라 타이밍 경쟁 조건이 발생함. 개발 환경은 느린 처리로 타이밍이 맞지 않아 재현 안 됨.

## 해결책: 2단계 안전 navigation 패턴

React가 모든 Radix 컴포넌트를 먼저 언마운트한 뒤 navigate 하도록 분리.

```tsx
// Phase 1: mutation 성공 → transitioning=true → return null로 폼 언마운트
// Phase 2: React commit 완료 → Radix DOM 전부 제거됨 → setLocation 안전 호출

const [transitioning, setTransitioning] = useState(false);

useEffect(() => {
  if (!someMutation.isSuccess) return;
  queryClient.invalidateQueries({ queryKey: ... });
  toast.success("...");
  setTransitioning(true); // Phase 1: trigger unmount
}, [someMutation.isSuccess]);

useEffect(() => {
  if (!transitioning) return;
  setLocation("/target"); // Phase 2: navigate after Radix cleanup
}, [transitioning, setLocation]);

if (transitioning) return null; // 폼 컴포넌트 전체 언마운트
```

**Why:** `setLocation`을 직접 호출하면 React가 현재 컴포넌트를 언마운트하면서 Radix DOM을 정리하는 시점에 Portal/Presence 정리와 충돌. `return null`로 먼저 자식을 언마운트해두면 `setLocation` 시점에 정리할 Radix 노드가 없음.

**How to apply:** Radix Select/Combobox/Dialog 등 Portal을 사용하는 컴포넌트가 있는 form 페이지에서 navigation 성공 시 이 패턴 사용. `new.tsx`, `edit.tsx` 양쪽에 적용됨.
