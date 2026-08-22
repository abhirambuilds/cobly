import { Request, Response, NextFunction } from 'express';

// Define a basic error structure
interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // In production, do not expose internal error details for 500 errors
  const isProduction = process.env.NODE_ENV === 'production';
  const responseMessage = isProduction && statusCode === 500 ? 'Internal Server Error' : message;

  console.error(`[Error] ${statusCode} - ${message}`);
  
  if (!isProduction && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: {
      message: responseMessage,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
};
