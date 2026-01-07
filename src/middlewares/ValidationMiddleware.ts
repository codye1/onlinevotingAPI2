import Send from '../utils/Send';
import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

class ValidationMiddleware {
  static validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          // Format errors like { email: ['error1', 'error2'], password: ['error1'] }
          const formattedErrors: Record<string, string[]> = {};

          error.issues.forEach((issue) => {
            const field = issue.path.join('.') || 'form';
            if (!formattedErrors[field]) {
              formattedErrors[field] = [];
            }
            formattedErrors[field].push(issue.message);
          });

          return Send.validationErrors(res, formattedErrors);
        }

        // If it's another type of error, send a generic error response
        return Send.error(res, 'Invalid request data');
      }
    };
  }
}

export default ValidationMiddleware;
