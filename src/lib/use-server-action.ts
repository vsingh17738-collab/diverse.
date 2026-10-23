"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "./action-result";

/**
 * Runs a server action with a pending flag and toast feedback.
 * Returns the action result (or undefined when the action threw).
 */
export function useServerAction() {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const execute = useCallback(
    async <T,>(
      fn: () => Promise<ActionResult<T>>,
      opts?: {
        onSuccess?: (result: ActionResult<T>) => void;
        onError?: (message: string) => void;
        successMessage?: string;
        silent?: boolean;
      },
    ): Promise<ActionResult<T> | undefined> => {
      setPending(true);
      try {
        const result = await fn();
        if (result && result.ok === false) {
          toast.error(result.error);
          opts?.onError?.(result.error);
          return result;
        }
        if (!opts?.silent) {
          const message =
            opts?.successMessage ?? (result?.ok ? result.message : undefined);
          if (message) toast.success(message);
        }
        opts?.onSuccess?.(result as ActionResult<T>);
        return result;
      } catch {
        toast.error("Something went wrong. Please try again.");
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [toast],
  );

  return { execute, pending };
}
