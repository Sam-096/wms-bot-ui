import { Injectable } from '@angular/core';
import { UserRole } from '../models/chat-message.model';

export interface FaqItem {
  icon: string;
  label: string;
  message: string;
  color: string; // DaisyUI badge/btn class suffix: 'primary'|'secondary'|'accent'|'warning'|'error'
}

const FAQ_MAP: Record<UserRole, FaqItem[]> = {
  manager: [
    { icon: '📊', label: 'Pending Inward', message: 'How many inward entries are pending today?', color: 'primary' },
    { icon: '📦', label: 'Low Stock Alert', message: 'Which items are below minimum stock level?', color: 'warning' },
    { icon: '🚛', label: "Today's Dispatches", message: "Show me today's outward dispatches", color: 'secondary' },
    { icon: '🔒', label: 'Active Bonds', message: 'List all active bond entries', color: 'accent' },
    { icon: '📈', label: 'Summary', message: 'Give me a warehouse summary for today', color: 'primary' },
  ],
  admin: [
    { icon: '📊', label: 'Pending Inward', message: 'How many inward entries are pending today?', color: 'primary' },
    { icon: '📦', label: 'Low Stock Alert', message: 'Which items are below minimum stock level?', color: 'warning' },
    { icon: '🚛', label: "Today's Dispatches", message: "Show me today's outward dispatches", color: 'secondary' },
    { icon: '🔒', label: 'Active Bonds', message: 'List all active bond entries', color: 'accent' },
    { icon: '📈', label: 'Summary', message: 'Give me a warehouse summary for today', color: 'primary' },
  ],
  gatekeeper: [
    { icon: '🚛', label: 'Vehicles Inside', message: 'Which vehicles are currently inside the warehouse?', color: 'primary' },
    { icon: '🆕', label: 'New Gate Pass', message: 'How do I create a new gate pass?', color: 'secondary' },
    { icon: '🚪', label: 'Close Gate Pass', message: 'How do I close an open gate pass?', color: 'accent' },
    { icon: '📋', label: "Today's Log", message: "Show today's gate pass log", color: 'primary' },
  ],
  driver: [
    { icon: '📦', label: 'Check Stock', message: 'What stock is available for my consignment?', color: 'primary' },
    { icon: '📥', label: 'Inward Status', message: 'What is the status of my inward entry?', color: 'secondary' },
    { icon: '📤', label: 'Outward Status', message: 'What is the status of my outward entry?', color: 'accent' },
    { icon: '📊', label: 'Daily Summary', message: 'Give me a summary of today\'s activity', color: 'primary' },
  ],
};

@Injectable({ providedIn: 'root' })
export class FaqConfigService {
  getRoleBasedFaqs(role: UserRole): FaqItem[] {
    return FAQ_MAP[role] ?? FAQ_MAP['driver'];
  }
}
