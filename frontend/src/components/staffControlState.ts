export type StaffPagination = {
  current_page: number; per_page: number; total: number; last_page: number;
  from: number | null; to: number | null;
};

export function staffError(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed. Please retry.';
}

export function caseStatusChange(current: string, next: string): { status?: string } {
  return current === next ? {} : { status: next };
}

// React state updates are deferred; this lock blocks a second action immediately.
export function createActionLock() {
  let locked = false;
  return {
    enter() { if (locked) return false; locked = true; return true; },
    release() { locked = false; },
  };
}

export function createRequestSequence() {
  let current = 0;
  return {
    next() { return ++current; },
    isCurrent(ticket: number) { return ticket === current; },
  };
}
