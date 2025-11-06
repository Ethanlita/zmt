export const getErrorMessage = (error: unknown, fallback: string = '未知错误'): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
};

