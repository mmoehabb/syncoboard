import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { AppMode } from "../types/commands";
import { NORMAL_ACTIONS_REGISTRY } from "../lib/normal-actions-registry";

export function useInputFocusTracking() {
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as unknown as HTMLElement; // eslint-disable-line no-restricted-syntax
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setIsInputFocused(false);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return { isInputFocused };
}

export function useActiveContainerSync() {
  const pathname = usePathname();

  useEffect(() => {
    const syncActiveContainer = () => {
      const containers = document.querySelectorAll(".cmd-container");
      if (containers.length > 0) {
        const hasActive = Array.from(containers).some((c) =>
          c.classList.contains("cmd-active-container"),
        );
        if (!hasActive) {
          containers[0].classList.add("cmd-active-container");
        }
      }
    };

    // Run initially
    syncActiveContainer();

    // Re-run when DOM elements are added/removed (e.g., dynamically rendered lists)
    const observer = new MutationObserver((mutations) => {
      let shouldSync = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          // Quick check if a container might have been added/removed
          shouldSync = true;
          break;
        }
      }
      if (shouldSync) {
        syncActiveContainer();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [pathname]); // Also re-run on path changes
}

export function useKeyboardNavigation(
  mode: AppMode,
  setMode: (mode: AppMode) => void,
) {
  const keyBuffer = useRef<string>("");
  const keyTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as unknown as HTMLElement; // eslint-disable-line no-restricted-syntax
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (mode === "normal") {
        if (isInput && e.key === "Escape") {
          target.blur();
          return;
        }

        if (e.key === "/") {
          if (!isInput) {
            e.preventDefault();
            setMode("command");
          }
          return;
        }

        if (!isInput) {
          // Vim Pane switching via DOM
          if (e.ctrlKey) {
            const containers = Array.from(
              document.querySelectorAll(".cmd-container"),
            );
            if (containers.length > 0) {
              const activeContainerIndex = containers.findIndex((c) =>
                c.classList.contains("cmd-active-container"),
              );

              if (e.key.toLowerCase() === "l" || e.key.toLowerCase() === "j") {
                e.preventDefault();
                const nextIndex =
                  activeContainerIndex < containers.length - 1
                    ? activeContainerIndex + 1
                    : 0;
                containers.forEach((c) =>
                  c.classList.remove("cmd-active-container"),
                );
                const nextContainer = containers[nextIndex];
                nextContainer.classList.add("cmd-active-container");
                nextContainer.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
                return;
              }
              if (e.key.toLowerCase() === "h" || e.key.toLowerCase() === "k") {
                e.preventDefault();
                const prevIndex =
                  activeContainerIndex > 0
                    ? activeContainerIndex - 1
                    : containers.length - 1;
                containers.forEach((c) =>
                  c.classList.remove("cmd-active-container"),
                );
                const targetContainer = containers[prevIndex] || containers[0];
                if (targetContainer) {
                  targetContainer.classList.add("cmd-active-container");
                  targetContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  });
                }
                return;
              }
            }
          }

          // Container scrolling via Alt + j/k
          if (
            e.altKey &&
            (e.key === "j" ||
              e.key === "k" ||
              e.code === "KeyJ" ||
              e.code === "KeyK" ||
              e.key === "∆" ||
              e.key === "˚")
          ) {
            e.preventDefault();
            const activeContainer = document.querySelector(
              ".cmd-container.cmd-active-container",
            );
            if (activeContainer) {
              const scrollAmount = 100;
              const isDown =
                e.key === "j" || e.code === "KeyJ" || e.key === "∆";

              // Find the scrollable element (could be the container itself, or an inner element)
              let scrollTarget = activeContainer;
              if (scrollTarget.scrollHeight <= scrollTarget.clientHeight) {
                const scrollableChild = activeContainer.querySelector(
                  ".overflow-y-auto, .overflow-auto",
                );
                if (scrollableChild) {
                  scrollTarget = scrollableChild;
                }
              }

              scrollTarget.scrollBy({
                top: isDown ? scrollAmount : -scrollAmount,
                behavior: "smooth",
              });
            }
            return;
          }

          // DOM based j / k navigation
          if (e.key === "j" || e.key === "k") {
            e.preventDefault();

            // Find active container, default to first one if none is active
            const containers = Array.from(
              document.querySelectorAll(".cmd-container"),
            );
            let activeContainer = document.querySelector(
              ".cmd-container.cmd-active-container",
            );

            if (!activeContainer && containers.length > 0) {
              activeContainer = containers[0];
              activeContainer.classList.add("cmd-active-container");
            }

            if (activeContainer) {
              const selectables = Array.from(
                activeContainer.querySelectorAll(".cmd-selectable"),
              );
              if (selectables.length > 0) {
                const selectedIndex = selectables.findIndex((s) =>
                  s.classList.contains("cmd-selected"),
                );

                let nextIndex = 0;
                if (e.key === "j") {
                  nextIndex =
                    selectedIndex < selectables.length - 1
                      ? selectedIndex + 1
                      : selectedIndex === -1
                        ? 0
                        : selectedIndex;
                } else if (e.key === "k") {
                  nextIndex = selectedIndex > 0 ? selectedIndex - 1 : 0;
                }

                // Remove from all in document to be safe, or just this container
                document
                  .querySelectorAll(".cmd-selected")
                  .forEach((el) => el.classList.remove("cmd-selected"));

                const nextSelected = selectables[nextIndex];
                if (nextSelected) {
                  nextSelected.classList.add("cmd-selected");
                  nextSelected.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  });
                }
              }
            }
            return;
          }

          if (e.key === "Enter") {
            const selectedElement = document.querySelector(
              ".cmd-selected",
            );
            if (selectedElement) {
              e.preventDefault();
              if (
                selectedElement.tagName === "INPUT" ||
                selectedElement.tagName === "TEXTAREA" ||
                selectedElement.tagName === "SELECT"
              ) {
                (selectedElement as unknown as HTMLElement).focus(); // eslint-disable-line no-restricted-syntax
              } else {
                (selectedElement as unknown as HTMLElement).click(); // eslint-disable-line no-restricted-syntax
              }
            } else {
              // Trigger default action (like expand/collapse) if nothing is selected within the container
              const activeContainer = document.querySelector(
                ".cmd-active-container",
              );
              if (activeContainer) {
                const collapsibleHeader = activeContainer.querySelector(
                  ".cmd-collapsible",
                );
                if (collapsibleHeader) {
                  e.preventDefault();
                  (collapsibleHeader as unknown as HTMLElement).click(); // eslint-disable-line no-restricted-syntax
                }
              }
            }
            return;
          }

          keyBuffer.current += e.key;

          if (keyTimeout.current) {
            clearTimeout(keyTimeout.current);
          }

          if (NORMAL_ACTIONS_REGISTRY[e.key]) {
            NORMAL_ACTIONS_REGISTRY[e.key].action();
            keyBuffer.current = "";
          } else if (NORMAL_ACTIONS_REGISTRY[keyBuffer.current]) {
            NORMAL_ACTIONS_REGISTRY[keyBuffer.current].action();
            keyBuffer.current = "";
          }

          keyTimeout.current = setTimeout(() => {
            keyBuffer.current = "";
          }, 500);
        }
      } else if (mode === "command") {
        if (e.key === "Escape") {
          e.preventDefault();
          setMode("normal");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (keyTimeout.current) clearTimeout(keyTimeout.current);
    };
  }, [mode, setMode]);
}
