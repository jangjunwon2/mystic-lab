"use client";

import { useState, useCallback } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PromptOptions {
  title?: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (v: boolean) => void;
}

interface PromptState extends PromptOptions {
  resolve: (v: string | null) => void;
}

export function useAdminDialogs() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const showPrompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({ ...options, resolve });
    });
  }, []);

  const handleConfirmYes = useCallback(() => {
    confirmState?.resolve(true);
    setConfirmState(null);
  }, [confirmState]);

  const handleConfirmNo = useCallback(() => {
    confirmState?.resolve(false);
    setConfirmState(null);
  }, [confirmState]);

  const handlePromptConfirm = useCallback((value: string) => {
    promptState?.resolve(value);
    setPromptState(null);
  }, [promptState]);

  const handlePromptCancel = useCallback(() => {
    promptState?.resolve(null);
    setPromptState(null);
  }, [promptState]);

  return {
    confirmState,
    promptState,
    showConfirm,
    showPrompt,
    handleConfirmYes,
    handleConfirmNo,
    handlePromptConfirm,
    handlePromptCancel,
  };
}
