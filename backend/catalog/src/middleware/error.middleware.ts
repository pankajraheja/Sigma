// ---------------------------------------------------------------------------
// Error handler middleware — maps domain errors to HTTP responses
// ---------------------------------------------------------------------------

import type { Request, Response, NextFunction } from 'express';
import type { ApiError } from '../models/api.types.js';
import { NotFoundError, ValidationError } from '../services/asset.service.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof NotFoundError) {
    const body: ApiError = {
      error: 'NOT_FOUND',
      message: err.message,
      statusCode: 404,
    };
    res.status(404).json(body);
    return;
  }

  if (err instanceof ValidationError) {
    const body: ApiError = {
      error: 'VALIDATION_ERROR',
      message: err.message,
      statusCode: 400,
    };
    res.status(400).json(body);
    return;
  }

  // Unexpected errors — do not leak internals in production
  console.error('[ERROR] Unhandled error:', err);
  const body: ApiError = {
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
    statusCode: 500,
  };
  res.status(500).json(body);
}
