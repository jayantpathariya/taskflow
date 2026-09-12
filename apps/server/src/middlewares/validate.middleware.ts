import type { Request, Response, NextFunction } from "express";

interface ValidatableSchema {
  parseAsync: (data: unknown) => Promise<any>;
}

export const validateBody = (schema: ValidatableSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error && error.issues && Array.isArray(error.issues)) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((issue: any) => ({
            field: Array.isArray(issue.path) ? issue.path.join(".") : issue.path,
            message: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
