// Type definitions for field detection
export type FieldName = string;
export type StatusValue = string | null;

export enum DateFormat {
  ISO = 'iso',
  DD_MM_YY = 'dd_mm_yy',
  MM_DD_YY = 'mm_dd_yy',
  NATURAL = 'natural'
}

export interface FieldElement {
  element: Element;
  value: string | null;
  type: 'input' | 'textarea' | 'contenteditable' | 'div';
}

export interface DateParseResult {
  success: boolean;
  value: string | null;
  format: DateFormat | null;
}

// Type guards
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isElement = (value: unknown): value is Element => value instanceof Element;
export const isHTMLInputElement = (value: unknown): value is HTMLInputElement => value instanceof HTMLInputElement;
export const isHTMLTextAreaElement = (value: unknown): value is HTMLTextAreaElement => value instanceof HTMLTextAreaElement;
export const isHTMLSelectElement = (value: unknown): value is HTMLSelectElement => value instanceof HTMLSelectElement;

// Utility functions for field detection
export const getStatusValue = (statusFieldName: string = 'status'): StatusValue => {
  const selectors = [
    `[name='${statusFieldName}']`,
    `select[name='${statusFieldName}']`,
    `[data-field='${statusFieldName}'] input, [data-field='${statusFieldName}'] select`
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (isHTMLInputElement(element) || isHTMLTextAreaElement(element) || isHTMLSelectElement(element)) {
      return element.value;
    }
  }
  return null;
};

export const isDateField = (fieldName: FieldName, element: Element): boolean => {
  const dateIndicators = [
    fieldName.toLowerCase().includes('date'),
    fieldName.toLowerCase().includes('time'),
    element.getAttribute('type') === 'date',
    element.getAttribute('type') === 'datetime-local',
    element.closest('[data-field="date"]'),
    element.closest('[data-field="datetime"]'),
    element.closest('[data-field="timestamp"]'),
    element.classList.contains('date'),
    element.classList.contains('datetime')
  ];

  return dateIndicators.some(Boolean);
};

export const parseDateValue = (fieldValue: string): DateParseResult => {
  // Handle natural language date format like "DateFebruary 28th, 2025" or "february-28th-2025"
  const naturalDateMatch = fieldValue.match(/^(?:Date)?([a-zA-Z]+)\s*-?\s*(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})$/i);
  if (naturalDateMatch) {
    try {
      const [, monthName, day, year] = naturalDateMatch;
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june', 
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthIndex = monthNames.indexOf(monthName.toLowerCase());
      
      if (monthIndex !== -1) {
        const month = (monthIndex + 1).toString().padStart(2, '0');
        const paddedDay = day.padStart(2, '0');
        const now = new Date();
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        // Format: DDMMYYYY-HHMM (just numbers with hours and minutes)
        const processedValue = `${year}${month}${paddedDay}${hours}${minutes}${seconds}`;
        return { success: true, value: processedValue, format: DateFormat.NATURAL };
      }
    } catch (error) {
      console.warn('Natural date parsing failed:', error);
    }
  }

  const patterns = [
    { regex: /^\d{4}-\d{2}-\d{2}/, format: DateFormat.ISO },
    { regex: /^\d{1,2}\/\d{1,2}\/\d{4}/, format: DateFormat.NATURAL },
    { regex: /(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/, format: DateFormat.ISO },
    { regex: /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/, format: DateFormat.DD_MM_YY },
    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, format: DateFormat.MM_DD_YY }
  ];

  for (const pattern of patterns) {
    const match = fieldValue.match(pattern.regex);
    if (match) {
      try {
        let parsedDate: Date | null = null;
        let processedValue: string | null = null;

        if (pattern.format === DateFormat.ISO) {
          parsedDate = new Date(fieldValue);
        } else if (pattern.format === DateFormat.DD_MM_YY) {
          const [, day, month, year] = match;
          const fullYear = year.length === 2 ? `20${year}` : year;
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          processedValue = `${day.padStart(2, '0')}${month.padStart(2, '0')}${fullYear}-${hours}${minutes}`;
        } else if (pattern.format === DateFormat.MM_DD_YY) {
          const [, month, day, year] = match;
          const fullYear = year.length === 2 ? `20${year}` : year;
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          processedValue = `${day.padStart(2, '0')}${month.padStart(2, '0')}${fullYear}-${hours}${minutes}`;
        }

        if (parsedDate && !isNaN(parsedDate.getTime())) {
          // For ISO dates, format as DDMMYYYY-HHMM
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const day = parsedDate.getDate().toString().padStart(2, '0');
          const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
          const year = parsedDate.getFullYear().toString();
          processedValue = `${day}${month}${year}-${hours}${minutes}`;
        }

        if (processedValue) {
          return { success: true, value: processedValue, format: pattern.format };
        }
      } catch (error) {
        console.warn('Date parsing failed:', error);
      }
    }
  }

  return { success: false, value: null, format: null };
};

export const extractFieldValue = (element: Element): string | null => {
  if (element.getAttribute('contenteditable') === 'true') {
    return element.textContent;
  } else if (element.classList.contains('v-input__input') || element.classList.contains('v-textarea__input')) {
    return isHTMLInputElement(element) ? element.value : null;
  } else if (element.tagName.toLowerCase() === 'div') {
    return element.textContent;
  } else if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
    return isHTMLInputElement(element) || isHTMLTextAreaElement(element) ? element.value : null;
  }
  return null;
};

export const findFieldElement = (fieldName: FieldName): FieldElement | null => {
  const selectors = [
    `[data-field="${fieldName}"]`,
    `[data-field="date"]`,
    `[data-field="datetime"]`,
    `[data-field="timestamp"]`,
    `input[name="${fieldName}"]`,
    `input[id="${fieldName}"]`,
    `textarea[name="${fieldName}"]`,
    `textarea[id="${fieldName}"]`,
    `[data-ky-field="${fieldName}"]`,
    `.field-${fieldName} input`,
    `.field-${fieldName} textarea`,
    `[data-field="${fieldName}"] input[type="date"]`,
    `[data-field="${fieldName}"] input[type="datetime-local"]`,
    `[data-field="date"] input[type="date"]`,
    `[data-field="datetime"] input[type="datetime-local"]`,
    `[contenteditable="true"][data-ky-field="${fieldName}"]`,
    `div[class*="prepend"][data-field="${fieldName}"]`,
    `div[class*="date"][data-field="${fieldName}"]`,
    `div[class*="date"]`,
    `[data-field="${fieldName}"] .v-input__input`,
    `[data-field="${fieldName}"] .v-textarea__input`,
    `[data-field="${fieldName}"] .v-field__input`,
    `[data-field="date"] .v-field__input`,
    `[data-field="datetime"] .v-field__input`
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (isElement(element)) {
      const value = extractFieldValue(element);
      if (value) {
        const type = element.getAttribute('contenteditable') === 'true' ? 'contenteditable' :
                    element.classList.contains('v-input__input') || element.classList.contains('v-textarea__input') ? 'input' :
                    element.tagName.toLowerCase() === 'div' ? 'div' : 'textarea';
        
        return { element, value, type };
      }
    }
  }

  return null;
};

// Main function to get processed field value
export const getProcessedFieldValue = (fieldName: FieldName): string | null => {
  const fieldElement = findFieldElement(fieldName);
  
  if (fieldElement && fieldElement.value) {
    let processedValue = fieldElement.value;
    
    if (isDateField(fieldName, fieldElement.element)) {
      const dateResult = parseDateValue(processedValue);
      if (dateResult.success && dateResult.value) {
        processedValue = dateResult.value;
      }
    }
    
    return processedValue;
  }
  
  return null;
}; 