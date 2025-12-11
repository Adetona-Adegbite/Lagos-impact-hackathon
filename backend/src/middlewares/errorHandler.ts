import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responses.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error] ', err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, err);
};
