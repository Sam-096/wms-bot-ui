import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

/** Typed backend error shape from Spring Boot 3.x */
interface BackendError {
  code: string;
  message: string;
  path: string;
  timestamp: string;
}

interface ToastContent {
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private readonly toast = inject(ToastService);

  private readonly ERROR_MESSAGES: Readonly<Record<string, ToastContent>> = {
    AUTH_FAILED:         { title: 'Login Failed',      message: 'Invalid email or password.' },
    ACCESS_DENIED:       { title: 'Access Denied',     message: "You don't have permission for this." },
    NOT_FOUND:           { title: 'Not Found',         message: 'Record not found.' },
    DUPLICATE_ENTRY:     { title: 'Already Exists',    message: 'This record already exists.' },
    TOO_MANY_REQUESTS:   { title: 'Too Many Attempts', message: 'Wait 1 minute before trying again.' },
    AI_UNAVAILABLE:      { title: 'AI Unavailable',    message: 'AI service is busy. Try again shortly.' },
    GROQ_CIRCUIT_OPEN:   { title: 'AI Switching',      message: 'Switching to backup AI. Please wait.' },
    SESSION_NOT_FOUND:   { title: 'Session Expired',   message: 'Chat session expired. Starting fresh.' },
    INSUFFICIENT_STOCK:  { title: 'Insufficient Stock',message: 'Not enough stock available.' },
    INTERNAL_ERROR:      { title: 'Server Error',      message: 'Something went wrong. Try again.' },
    WAREHOUSE_NOT_FOUND: { title: 'Warehouse Error',   message: 'Warehouse not found or unavailable.' },
  } as const;

  handleApiError(error: HttpErrorResponse): void {
    const backendError = error.error as Partial<BackendError>;
    const code         = backendError?.code ?? '';
    const backendMsg   = backendError?.message;

    const content = this.ERROR_MESSAGES[code] ?? {
      title:   'Error',
      message: backendMsg ?? 'An unexpected error occurred.',
    };

    // Persist (duration 0 = never auto-dismiss) for server errors or unknown codes
    const persist  = code === 'INTERNAL_ERROR' || code === '';
    const duration = persist ? 0 : 5000;

    // For NOT_FOUND, show the specific backend message (e.g. "Session abc not found")
    const displayMsg =
      backendMsg && code === 'NOT_FOUND' ? backendMsg : content.message;

    this.toast.error(content.title, displayMsg, duration, code || undefined);
  }
}
