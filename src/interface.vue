<template>
  <div class="slug-generator">
    <v-input
      v-if="isEditing"
      v-model="internalValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="{ 'has-error': !isValid }"
      @input="processInput"
      @blur="disableEdit"
      @keydown="onKeyPress"
      small
      autofocus>
      <template #append>
        <v-icon
          v-if="internalValue"
          :name="isValid ? 'check' : 'warning'"
          :class="isValid ? 'valid-icon' : 'invalid-icon'"/>
      </template>
    </v-input>

    <div v-else class="slug-preview-mode">
      <span class="slug-display" @click="enableEdit">{{ internalValue || placeholder }}</span>

      <div class="action-buttons">
        <v-button
          v-if="!disabled"
          v-tooltip="'Edit slug'"
          x-small
          secondary
          icon
          class="action-button"
          @click="enableEdit">
          <v-icon name="edit" />
        </v-button>

        <v-button
          v-if="selectedSourceField && auto"
          v-tooltip="'Regenerate from source'"
          x-small
          secondary
          icon
          class="action-button"
          @click="regenerateSlug">
          <v-icon name="autorenew" />
        </v-button>
      </div>
    </div>

    <div v-if="!isValid" class="validation-message">
      {{ validationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, toRef, type Ref } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { createSlug } from './utils/transliteration';
import {
  type FieldName,
  type StatusValue,
  type FieldElement,
  type DateParseResult,
  DateFormat,
  isString,
  isElement,
  isHTMLInputElement,
  isHTMLTextAreaElement,
  isHTMLSelectElement,
  getStatusValue,
  isDateField,
  parseDateValue,
  extractFieldValue,
  findFieldElement,
  getProcessedFieldValue
} from './utils/fieldDetection';
import { createAutoUpdater, type AutoUpdateConfig, type AutoUpdateResult } from './utils/autoUpdate';

// Type definitions
type SlugValue = string | null;
type ValidationState = boolean;
type CollectionName = string;
type PrimaryKey = string | number | null;

// Enums for better type safety
enum ValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  PENDING = 'pending'
}

enum EditMode {
  PREVIEW = 'preview',
  EDITING = 'editing'
}

// Interfaces for better type definitions
interface SlugGeneratorProps {
  value?: SlugValue;
  disabled?: boolean;
  select_collection?: CollectionName | null;
  select_field?: FieldName | null;
  auto?: boolean;
  required?: boolean;
  separator?: string;
  lowercase?: boolean;
  placeholder?: string;
  collection: CollectionName;
  field: FieldName;
  primaryKey?: PrimaryKey;
  custom_empty_message?: string | null;
  custom_format_message?: string | null;
  custom_unique_message?: string | null;
  allow_duplicates?: boolean;
  status?: StatusValue;
  auto_update_mode?: string;
  preserve_existing?: boolean;
  update_delay?: number;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  status: ValidationStatus;
}

interface SlugOptions {
  separator: string;
  lowercase: boolean;
}

// Props with proper typing
const props = withDefaults(defineProps<SlugGeneratorProps>(), {
  value: null,
  disabled: false,
  select_collection: null,
  select_field: null,
  auto: true,
  required: true,
  separator: '-',
  lowercase: true,
  placeholder: 'Enter a slug or url...',
  primaryKey: null,
  custom_empty_message: null,
  custom_format_message: null,
  custom_unique_message: null,
  allow_duplicates: false,
  status: null,
  auto_update_mode: 'change',
  preserve_existing: false,
  update_delay: 100
});

// Emits with proper typing
const emit = defineEmits<{
  input: [value: string];
  validation: [isValid: boolean];
}>();

// API and stores
const api = useApi();
const { items: itemsStore } = useStores();

// Reactive state with proper typing
const internalValue: Ref<SlugValue> = ref(toRef(props, 'value').value || '');
const isValid: Ref<ValidationState> = ref(true);
const validationMessage: Ref<string> = ref('');
const sourceValue: Ref<string> = ref('');
const isEditing: Ref<boolean> = ref(false);
const cachedValueBeforeEdit: Ref<string> = ref('');

// DOM element references
let statusInputEl: HTMLInputElement | HTMLSelectElement | null = null;
const statusFieldName = 'status' as const;

// Auto-updater instance
let autoUpdater: ReturnType<typeof createAutoUpdater> | null = null;

// Constants
const VALIDATION_INTERVAL = 1000;
const DEFAULT_SEPARATOR = '-';
const DEFAULT_LOWERCASE = true;

// Utility functions are now imported from fieldDetection.ts

// Core functionality with proper typing
const checkSlugUniqueness = async (slug: string): Promise<boolean> => {
  if (!props.collection || !slug) return true;

  try {
    const response = await api.get(`/items/${props.collection}`, {
      params: {
        filter: {
          [props.field]: { _eq: slug },
          ...(props.primaryKey && { id: { _neq: props.primaryKey } })
        },
        limit: 1
      }
    });

    return response.data.data.length === 0;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    return true;
  }
};

const validateSlug = async (): Promise<ValidationResult> => {
  if (!internalValue.value) {
    return {
      isValid: true,
      message: '',
      status: ValidationStatus.VALID
    };
  }

  const statusValue = props.status || getStatusValue();
  const isDraft = statusValue === 'draft';

  if (isDraft) {
    return {
      isValid: true,
      message: '',
      status: ValidationStatus.VALID
    };
  }

  const isUrl = /^https?:\/\//i.test(internalValue.value);
  const slugPattern = isUrl
    ? /^https?:\/\/[^\s<>"{}|\\^~[\]`]+$/i
    : /^[^\s<>"{}|\\^~[\]`]+$/i;

  if (!slugPattern.test(internalValue.value)) {
    return {
      isValid: false,
      message: props.custom_format_message || 'Please enter a valid URL or slug.',
      status: ValidationStatus.INVALID
    };
  }

  if (!props.allow_duplicates) {
    const isUnique = await checkSlugUniqueness(internalValue.value);
    if (!isUnique) {
      return {
        isValid: false,
        message: props.custom_unique_message || 'This slug is already in use.',
        status: ValidationStatus.INVALID
      };
    }
  }

  return {
    isValid: true,
    message: '',
    status: ValidationStatus.VALID
  };
};

const updateValidationState = async (): Promise<void> => {
  const result = await validateSlug();
  isValid.value = result.isValid;
  validationMessage.value = result.message;
  emit('validation', result.isValid);
};

const processInput = async (value: string | Event): Promise<void> => {
  const inputValue = isString(value) ? value :
                    value && typeof value === 'object' && 'target' in value && isHTMLInputElement(value.target) ? value.target.value : '';

  if (inputValue === '' && props.auto && selectedSourceField.value) {
    await fetchSourceValue();
    if (sourceValue.value) {
      const slugOptions: SlugOptions = {
        separator: props.separator,
        lowercase: props.lowercase
      };
      internalValue.value = createSlug(sourceValue.value, slugOptions);
    } else {
      internalValue.value = '';
    }
  } else if (inputValue && props.auto && !cachedValueBeforeEdit.value) {
    const slugOptions: SlugOptions = {
      separator: props.separator,
      lowercase: props.lowercase
    };
    internalValue.value = createSlug(inputValue, slugOptions);
  } else {
    internalValue.value = inputValue;
  }

  await updateValidationState();
  emit('input', internalValue.value);
};

const onKeyPress = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') {
    internalValue.value = cachedValueBeforeEdit.value;
    disableEdit();
  } else if (event.key === 'Enter') {
    disableEdit();
  }
};

const enableEdit = (): void => {
  if (props.disabled) return;
  cachedValueBeforeEdit.value = internalValue.value || '';
  isEditing.value = true;
  if (!internalValue.value) {
    internalValue.value = props.value || '';
  }
};

const disableEdit = (): void => {
  isEditing.value = false;
  updateValidationState();
};

const selectedSourceField = computed((): FieldName | null => {
  return props.select_field || props.select_collection;
});

const fetchSourceValue = async (): Promise<void> => {
  // Implementation for fetching source value
};

const regenerateSlug = async (): Promise<void> => {
  const fieldName = props.select_field || 'title';
  console.log('fieldName', fieldName);

  const processedValue = getProcessedFieldValue(fieldName);
  
  if (processedValue) {
    console.log('Found processed field value:', processedValue);
    sourceValue.value = processedValue;
    const slugOptions: SlugOptions = {
      separator: props.separator,
      lowercase: props.lowercase
    };
    internalValue.value = createSlug(processedValue, slugOptions);
    await updateValidationState();
    emit('input', internalValue.value);
    return;
  }

  console.warn('Could not regenerate slug: No field value found in form.');
};

// Auto-updater management functions
const initializeAutoUpdater = (): void => {
  if (autoUpdater) {
    autoUpdater.destroy();
    autoUpdater = null;
  }

  if (props.auto_update_mode === 'disabled' || !props.select_field) {
    return;
  }

  const config: AutoUpdateConfig = {
    sourceField: props.select_field,
    targetField: props.field,
    separator: props.separator,
    lowercase: props.lowercase,
    autoUpdate: true,
    preserveExisting: props.preserve_existing,
    updateOnChange: props.auto_update_mode === 'change' || props.auto_update_mode === 'realtime',
    updateOnBlur: props.auto_update_mode === 'blur',
    updateOnFocus: props.auto_update_mode === 'focus'
  };

  autoUpdater = createAutoUpdater(config);
  autoUpdater.initialize();
};

const destroyAutoUpdater = (): void => {
  if (autoUpdater) {
    autoUpdater.destroy();
    autoUpdater = null;
  }
};

// Lifecycle and watchers
let validationIntervalRef: ReturnType<typeof setInterval> | null = null;

const updateValidationUI = (): void => {
  const headerBar = document.querySelector('.header-bar');
  
  if (!isValid.value) {
    if (headerBar) {
      headerBar.classList.add('slug-validation-error');
      const headerBarButtons = headerBar.querySelectorAll('button:not(.slug-generator button)');
      headerBarButtons.forEach(button => {
        if (isHTMLInputElement(button)) {
          button.disabled = true;
          button.setAttribute('data-disabled-by-slug', 'true');
        }
      });
    }
  } else {
    const disabledButtons = document.querySelectorAll('[data-disabled-by-slug="true"]');
    disabledButtons.forEach(button => {
      if (isHTMLInputElement(button)) {
        button.disabled = false;
        button.removeAttribute('data-disabled-by-slug');
      }
    });

    if (headerBar) {
      headerBar.classList.remove('slug-validation-error');
    }
  }
};

const statusChangeHandler = (): void => {
  updateValidationState();
};

onMounted(async (): Promise<void> => {
  if ((!internalValue.value || internalValue.value === '') && props.auto) {
    const fieldName = props.select_field || 'title';
    const processedValue = getProcessedFieldValue(fieldName);
    
    if (processedValue) {
      sourceValue.value = processedValue;
      const slugOptions: SlugOptions = {
        separator: props.separator,
        lowercase: props.lowercase
      };
      internalValue.value = createSlug(processedValue, slugOptions);
      await updateValidationState();
      emit('input', internalValue.value);
    }
  }

  await updateValidationState();

  validationIntervalRef = setInterval(() => {
    updateValidationUI();
  }, VALIDATION_INTERVAL);

  statusInputEl = document.querySelector(`[name='${statusFieldName}']`) as HTMLInputElement | HTMLSelectElement;
  if (!statusInputEl) {
    statusInputEl = document.querySelector(`select[name='${statusFieldName}']`) as HTMLSelectElement;
  }
  if (statusInputEl) {
    statusInputEl.addEventListener('change', statusChangeHandler);
  }

  // Initialize auto-updater
  initializeAutoUpdater();
});

onUnmounted((): void => {
  if (validationIntervalRef) {
    clearInterval(validationIntervalRef);
  }
  if (statusInputEl) {
    statusInputEl.removeEventListener('change', statusChangeHandler);
  }
  
  // Destroy auto-updater
  destroyAutoUpdater();
});

watch(internalValue, (): void => {
  updateValidationState();
  updateValidationUI();
});

watch(() => props.value, (newVal): void => {
  if (newVal !== internalValue.value) {
    internalValue.value = newVal || '';
    updateValidationState();
  }
});

watch(
  (): string | null => {
    if (props.auto) {
      const fieldName = props.select_field || 'title';
      return getProcessedFieldValue(fieldName);
    }
    return null;
  },
  async (newValue): Promise<void> => {
    if (newValue && props.auto && (!internalValue.value || internalValue.value === '')) {
      sourceValue.value = newValue;
      const slugOptions: SlugOptions = {
        separator: props.separator,
        lowercase: props.lowercase
      };
      internalValue.value = createSlug(newValue, slugOptions);
      await updateValidationState();
      emit('input', internalValue.value);
    }
  }
);

// Watch for auto-update configuration changes
watch(
  (): [string, boolean, number] => [
    props.auto_update_mode || 'disabled',
    props.preserve_existing || false,
    props.update_delay || 100
  ],
  (): void => {
    initializeAutoUpdater();
  }
);

// Watch for source field changes
watch(
  (): string | null => props.select_field,
  (): void => {
    initializeAutoUpdater();
  }
);
</script>

<style scoped>
.slug-generator {
  width: 100%;
}

.validation-message {
  margin-top: 4px;
  font-size: 12px;
  color: var(--theme--danger);
}

.slug-preview-mode {
  display: flex;
  align-items: center;
  width: 100%;
  padding: calc(var(--theme--form--field--input--padding) / 3);
  background-color: var(--theme--form--field--input--background);
  border: var(--theme--border-width) solid var(--theme--border-color);
  border-radius: var(--theme--border-radius);
  justify-content: space-between;
}

.slug-display-wrapper {
  flex-grow: 1;
  cursor: text;
  min-width: 0;
}

.slug-display {
  font-family: var(--theme--fonts--sans--font-family);
  color: var(--theme--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-left: 8px;
  flex-shrink: 0;
}

.action-button {
  color: var(--theme--foreground-subdued);
}

.action-button:hover {
  color: var(--theme--foreground);
}

.has-error {
  border-color: var(--theme--danger);
}

.valid-icon {
  color: var(--theme--success);
}

.invalid-icon {
  color: var(--theme--danger);
}
</style>
