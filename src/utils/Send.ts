import { Response } from 'express';

class Send {
  static success<T>(res: Response, data: T, message = 'success') {
    res.status(200).json({
      ok: true,
      message,
      ...data,
    });
  }

  static error<T>(res: Response, data: T, message = 'error') {
    // A generic 500 Internal Server Error is returned for unforeseen issues
    res.status(500).json({
      ok: false,
      message,
      ...data,
    });
  }

  static notFound<T>(res: Response, data: T, message = 'not found') {
    // 404 is for resources that don't exist
    res.status(404).json({
      ok: false,
      message,
      ...data,
    });
  }

  static unauthorized<T>(res: Response, data: T, message = 'unauthorized') {
    // 401 for unauthorized access (e.g., invalid token)
    res.status(401).json({
      ok: false,
      message,
      ...data,
    });
  }

  static validationErrors(res: Response, errors: Record<string, string[]>) {
    // 422 for unprocessable entity (validation issues)
    res.status(422).json({
      ok: false,
      message: 'Validation error',
      errors,
    });
  }

  static forbidden<T>(res: Response, data: T, message = 'forbidden') {
    // 403 for forbidden access (when the user does not have the rights to access)
    res.status(403).json({
      ok: false,
      message,
      ...data,
    });
  }

  static badRequest<T>(
    res: Response,
    data: T,
    message = 'bad request',
    code: number = 400,
  ) {
    // 400 for general bad request errors
    res.status(code).json({
      ok: false,
      message,
      ...data,
    });
  }
}

export default Send;
