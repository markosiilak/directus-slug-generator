import { createSlug } from './transliteration';
import { generateUUIDv4 } from './uuid';
import { getProcessedFieldValue, type FieldName } from './fieldDetection';

export interface AutoUpdateConfig {
  sourceField: FieldName;
  targetField: FieldName;
  separator?: string;
  lowercase?: boolean;
  autoUpdate?: boolean;
  preserveExisting?: boolean;
  updateOnChange?: boolean;
  updateOnBlur?: boolean;
  updateOnFocus?: boolean;
  generationMode?: 'slug' | 'uuid';
}

export interface AutoUpdateResult {
  success: boolean;
  oldValue: string | null;
  newValue: string | null;
  sourceValue: string | null;
  error?: string;
}

/**
 * Auto-updates a target field (URL/slug) when a source field changes
 */
export class AutoUpdater {
  private config: AutoUpdateConfig;
  private isUpdating: boolean = false;
  private lastSourceValue: string | null = null;

  constructor(config: AutoUpdateConfig) {
    this.config = {
      separator: '-',
      lowercase: true,
      autoUpdate: true,
      preserveExisting: false,
      updateOnChange: true,
      updateOnBlur: false,
      updateOnFocus: false,
      generationMode: 'slug',
      ...config
    };
  }

  /**
   * Initializes the auto-updater by setting up event listeners
   */
  public initialize(): void {
    if (!this.config.autoUpdate) return;

    const sourceElement = this.findSourceElement();
    if (!sourceElement) {
      console.warn(`AutoUpdater: Source field "${this.config.sourceField}" not found`);
      return;
    }

    // Set up event listeners based on configuration
    if (this.config.updateOnChange) {
      this.addChangeListener(sourceElement);
    }
    
    if (this.config.updateOnBlur) {
      this.addBlurListener(sourceElement);
    }
    
    if (this.config.updateOnFocus) {
      this.addFocusListener(sourceElement);
    }

    // Initial update
    this.performUpdate();
  }

  /**
   * Manually triggers an update
   */
  public async update(): Promise<AutoUpdateResult> {
    return this.performUpdate();
  }

  /**
   * Performs the actual update operation
   */
  private async performUpdate(): Promise<AutoUpdateResult> {
    if (this.isUpdating) {
      return {
        success: false,
        oldValue: null,
        newValue: null,
        sourceValue: null,
        error: 'Update already in progress'
      };
    }

    this.isUpdating = true;

    try {
      const sourceValue = getProcessedFieldValue(this.config.sourceField);
      const targetElement = this.findTargetElement();
      
      if (!targetElement) {
        return {
          success: false,
          oldValue: null,
          newValue: null,
          sourceValue,
          error: `Target field "${this.config.targetField}" not found`
        };
      }

      const oldValue = this.getFieldValue(targetElement);
      
      // Check if we should preserve existing value
      if (this.config.preserveExisting && oldValue && oldValue.trim() !== '') {
        return {
          success: true,
          oldValue,
          newValue: oldValue,
          sourceValue,
          error: 'Preserving existing value'
        };
      }

      // Check if source value has actually changed
      if (sourceValue === this.lastSourceValue && oldValue) {
        return {
          success: true,
          oldValue,
          newValue: oldValue,
          sourceValue,
          error: 'Source value unchanged'
        };
      }

      let newValue: string | null = null;
      
      if (this.config.generationMode === 'uuid') {
        newValue = generateUUIDv4();
        this.setFieldValue(targetElement, newValue);
        this.lastSourceValue = '__uuid__';
      } else {
        if (sourceValue) {
          const slugOptions = {
            separator: this.config.separator || '-',
            lowercase: this.config.lowercase !== false
          };
          newValue = createSlug(sourceValue, slugOptions);
          this.setFieldValue(targetElement, newValue);
          this.lastSourceValue = sourceValue;
        } else {
          this.setFieldValue(targetElement, '');
          this.lastSourceValue = null;
        }
      }

      return {
        success: true,
        oldValue,
        newValue,
        sourceValue
      };

    } catch (error) {
      return {
        success: false,
        oldValue: null,
        newValue: null,
        sourceValue: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Finds the source field element
   */
  private findSourceElement(): Element | null {
    const selectors = [
      `[data-field="${this.config.sourceField}"]`,
      `input[name="${this.config.sourceField}"]`,
      `textarea[name="${this.config.sourceField}"]`,
      `[data-ky-field="${this.config.sourceField}"]`,
      `[data-field="${this.config.sourceField}"] input`,
      `[data-field="${this.config.sourceField}"] textarea`,
      `[data-field="${this.config.sourceField}"] .v-input__input`,
      `[data-field="${this.config.sourceField}"] .v-textarea__input`,
      `[data-field="${this.config.sourceField}"] .v-field__input`
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  /**
   * Finds the target field element
   */
  private findTargetElement(): Element | null {
    const selectors = [
      `[data-field="${this.config.targetField}"]`,
      `input[name="${this.config.targetField}"]`,
      `textarea[name="${this.config.targetField}"]`,
      `[data-ky-field="${this.config.targetField}"]`,
      `[data-field="${this.config.targetField}"] input`,
      `[data-field="${this.config.targetField}"] textarea`,
      `[data-field="${this.config.targetField}"] .v-input__input`,
      `[data-field="${this.config.targetField}"] .v-textarea__input`,
      `[data-field="${this.config.targetField}"] .v-field__input`
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  /**
   * Gets the value from a field element
   */
  private getFieldValue(element: Element): string | null {
    if (element.getAttribute('contenteditable') === 'true') {
      return element.textContent;
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return element.value;
    } else if (element.classList.contains('v-input__input') || element.classList.contains('v-textarea__input')) {
      return (element as HTMLInputElement).value;
    }
    return null;
  }

  /**
   * Sets the value of a field element
   */
  private setFieldValue(element: Element, value: string): void {
    if (element.getAttribute('contenteditable') === 'true') {
      element.textContent = value;
    } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
    } else if (element.classList.contains('v-input__input') || element.classList.contains('v-textarea__input')) {
      (element as HTMLInputElement).value = value;
    }

    // Trigger input event to notify Directus of the change
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
  }

  /**
   * Adds change event listener to source element
   */
  private addChangeListener(element: Element): void {
    const handleChange = () => {
      setTimeout(() => this.performUpdate(), 100);
    };

    element.addEventListener('input', handleChange);
    element.addEventListener('change', handleChange);
  }

  /**
   * Adds blur event listener to source element
   */
  private addBlurListener(element: Element): void {
    element.addEventListener('blur', () => {
      setTimeout(() => this.performUpdate(), 100);
    });
  }

  /**
   * Adds focus event listener to source element
   */
  private addFocusListener(element: Element): void {
    element.addEventListener('focus', () => {
      setTimeout(() => this.performUpdate(), 100);
    });
  }

  /**
   * Destroys the auto-updater and removes event listeners
   */
  public destroy(): void {
    // Note: In a real implementation, you'd want to store references to event listeners
    // and remove them here. For simplicity, we're not implementing that in this version.
    this.isUpdating = false;
    this.lastSourceValue = null;
  }
}

/**
 * Factory function to create an auto-updater instance
 */
export function createAutoUpdater(config: AutoUpdateConfig): AutoUpdater {
  return new AutoUpdater(config);
}

/**
 * Utility function to auto-update a single field
 */
export async function autoUpdateField(
  sourceField: FieldName,
  targetField: FieldName,
  options: Partial<AutoUpdateConfig> = {}
): Promise<AutoUpdateResult> {
  const updater = createAutoUpdater({
    sourceField,
    targetField,
    ...options
  });
  
  return updater.update();
} 