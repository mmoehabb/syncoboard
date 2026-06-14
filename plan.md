1.  **Analyze the current UI:**
    - Currently, the `MainBoard.tsx` has buttons for Voice Call, Activate/Deactivate Board, Sync Board, and Add Task aligned horizontally.
    - The goal is to move these actions into an "options" list accessible via a `MoreHorizontal` (ellipsis) button.
    - The Activate/Deactivate button should have color coding (green for activate, red for deactivate).
2.  **Modify `apps/web/src/app/dashboard/components/MainBoard.tsx`:**
    - Import `MoreHorizontal` from `lucide-react`.
    - Import dropdown UI components or simply implement a state variable to toggle the visibility of the options dropdown (`isBoardOptionsOpen`, `setIsBoardOptionsOpen`). Add a `useRef` and `useEffect` to handle closing it on outside clicks, similar to `NotificationsDropdown.tsx`.
    - Remove the current inline buttons for:
      - Join/Leave Voice Call (`<Phone />`)
      - Activate/Deactivate Board (`<PowerOff />`, `<Power />`)
      - Sync Board (`<RefreshCw />`)
      - Add Task (`<Plus />`)
    - Instead, replace them with a single `MoreHorizontal` button.
    - When the `MoreHorizontal` button is clicked, it opens a dropdown.
    - The dropdown contains these options as list items (`ContextMenuItem` or similar custom styling):
      - "Voice Call" (with `<Phone />` icon) - keep existing dynamic Join/Leave text if needed.
      - "Activate Board" / "Deactivate Board" (with `<Power />` / `<PowerOff />` icon). Apply green color when text is "Activate Board", red color when "Deactivate Board".
      - "Sync Board" (with `<RefreshCw />` icon)
      - "Add Task" (with `<Plus />` icon)
3.  **Ensure functionality:**
    - Ensure all previous `onClick` handlers are preserved for the items in the dropdown.
    - Update styling for dropdown item to match standard syncoboard style (using Tailwind).
4.  **Complete pre-commit steps:**
    - Run `pre_commit_instructions` and follow steps (linting, tests, etc.)
5.  **Submit the code.**
