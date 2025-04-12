/**
 * Clasă pentru erori operaționale personalizate
 */
class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Captează stack trace fără a include această clasă în stivă
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError; 