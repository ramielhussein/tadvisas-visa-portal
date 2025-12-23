// ESC/POS commands for thermal printers
const ESC = '\x1B';
const GS = '\x1D';

export const ESCPOS = {
  // Initialization
  INIT: ESC + '@',
  
  // Text formatting
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',
  DOUBLE_HEIGHT: ESC + '!' + '\x10',
  DOUBLE_WIDTH: ESC + '!' + '\x20',
  DOUBLE_SIZE: ESC + '!' + '\x30',
  NORMAL_SIZE: ESC + '!' + '\x00',
  
  // Alignment
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  
  // Paper control
  CUT: GS + 'V' + '\x00',
  PARTIAL_CUT: GS + 'V' + '\x01',
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
  
  // Line spacing
  LINE_SPACING: (n: number) => ESC + '3' + String.fromCharCode(n),
  DEFAULT_LINE_SPACING: ESC + '2',
};

// 80mm thermal printers typically have 48 characters per line (at normal font)
const LINE_WIDTH = 48;

export const formatLine = (left: string, right: string = '', separator: string = ' '): string => {
  const maxLeftWidth = LINE_WIDTH - right.length - 1;
  const truncatedLeft = left.length > maxLeftWidth ? left.substring(0, maxLeftWidth - 2) + '..' : left;
  const spaces = LINE_WIDTH - truncatedLeft.length - right.length;
  return truncatedLeft + separator.repeat(Math.max(1, spaces)) + right;
};

export const centerText = (text: string): string => {
  const padding = Math.floor((LINE_WIDTH - text.length) / 2);
  return ' '.repeat(Math.max(0, padding)) + text;
};

export const divider = (char: string = '-'): string => {
  return char.repeat(LINE_WIDTH);
};

export interface TaskData {
  id: string;
  transfer_number?: string;
  title?: string | null;
  from_location: string;
  to_location: string;
  transfer_date: string;
  transfer_time?: string | null;
  transfer_category?: string | null;
  hr_subtype?: string | null;
  notes?: string | null;
  worker?: {
    name: string;
    center_ref: string;
  } | null;
  client_name?: string | null;
}

export const formatTaskReceipt = (task: TaskData): string[] => {
  const now = new Date();
  const printTime = now.toLocaleString('en-AE', { 
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const printDate = now.toLocaleDateString('en-AE', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const taskDate = new Date(task.transfer_date).toLocaleDateString('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const categoryLabel = task.transfer_category === 'HR' 
    ? `HR - ${formatHRSubtype(task.hr_subtype)}`
    : task.transfer_category === 'ADMIN' 
      ? 'ADMIN'
      : 'TRANSPORT';

  const commands: string[] = [
    ESCPOS.INIT,
    ESCPOS.ALIGN_CENTER,
    ESCPOS.DOUBLE_SIZE,
    '*** NEW TASK ***',
    ESCPOS.NORMAL_SIZE,
    ESCPOS.FEED_LINES(1),
    
    // Task ID / Number
    ESCPOS.BOLD_ON,
    task.transfer_number || `#${task.id.slice(0, 8).toUpperCase()}`,
    ESCPOS.BOLD_OFF,
    ESCPOS.FEED_LINES(1),
    
    // Divider
    divider('='),
    '',
    
    // Category Badge
    ESCPOS.DOUBLE_HEIGHT,
    `[ ${categoryLabel} ]`,
    ESCPOS.NORMAL_SIZE,
    ESCPOS.FEED_LINES(1),
    
    // Title if exists
    ...(task.title ? [
      ESCPOS.BOLD_ON,
      task.title,
      ESCPOS.BOLD_OFF,
      ''
    ] : []),
    
    // Divider
    divider(),
    '',
    
    // Route
    ESCPOS.ALIGN_LEFT,
    ESCPOS.BOLD_ON,
    'FROM:',
    ESCPOS.BOLD_OFF,
    task.from_location,
    '',
    ESCPOS.BOLD_ON,
    'TO:',
    ESCPOS.BOLD_OFF,
    task.to_location,
    '',
    
    divider(),
    '',
    
    // Date & Time
    formatLine('Date:', taskDate),
    ...(task.transfer_time ? [formatLine('Time:', task.transfer_time)] : []),
    '',
    
    // Worker info if exists
    ...(task.worker ? [
      divider(),
      '',
      ESCPOS.BOLD_ON,
      'WORKER:',
      ESCPOS.BOLD_OFF,
      task.worker.name,
      formatLine('Ref:', task.worker.center_ref),
      ''
    ] : []),
    
    // Client info if exists
    ...(task.client_name ? [
      formatLine('Client:', task.client_name),
      ''
    ] : []),
    
    // Notes if exists
    ...(task.notes ? [
      divider(),
      '',
      ESCPOS.BOLD_ON,
      'NOTES:',
      ESCPOS.BOLD_OFF,
      ...wrapText(task.notes, LINE_WIDTH),
      ''
    ] : []),
    
    divider('='),
    '',
    
    // Print timestamp
    ESCPOS.ALIGN_CENTER,
    `Printed: ${printDate} ${printTime}`,
    '',
    
    // Footer
    ESCPOS.BOLD_ON,
    'TADGO DISPATCH',
    ESCPOS.BOLD_OFF,
    '',
    
    // Feed and cut
    ESCPOS.FEED_LINES(4),
    ESCPOS.PARTIAL_CUT,
  ];

  return commands;
};

const formatHRSubtype = (subtype: string | null | undefined): string => {
  if (!subtype) return '';
  const labels: Record<string, string> = {
    ATTEND_MEDICAL: 'Medical',
    TAWJEEH: 'Tawjeeh',
    BIOMETRICS: 'Biometrics',
    PASSPORT_DELIVERY: 'Passport',
  };
  return labels[subtype] || subtype;
};

const wrapText = (text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
};

// Beep sound for new task alerts
export const playAlertSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (frequency: number, duration: number, delay: number = 0) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + delay + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + delay + duration);
    
    oscillator.start(audioContext.currentTime + delay);
    oscillator.stop(audioContext.currentTime + delay + duration);
  };

  // Play a pleasant two-tone alert
  playTone(880, 0.15, 0);      // A5
  playTone(1108.73, 0.2, 0.15); // C#6
};
