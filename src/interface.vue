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
      autofocus
    >
      <template #append>
        <v-icon
          v-if="internalValue"
          :name="isValid ? 'check' : 'warning'"
          :class="isValid ? 'valid-icon' : 'invalid-icon'"
        />
      </template>
    </v-input>

    <div v-else class="slug-preview-mode">
      <span class="slug-display" @click="!disabled && enableEdit">{{ internalValue || placeholder }}</span>

      <div class="action-buttons">
        <v-button
          v-if="!disabled"
          v-tooltip="'Edit slug'"
          x-small
          secondary
          icon
          class="action-button"
          @click="enableEdit"
        >
          <v-icon name="edit" />
        </v-button>

        <v-button
          v-if="selectedSourceField && auto"
          v-tooltip="'Regenerate from source'"
          x-small
          secondary
          icon
          class="action-button"
          @click="regenerateSlug"
        >
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
import { ref, computed, watch, onMounted, watchEffect, onUnmounted } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';

const props = defineProps({
  value: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  select_collection: {
    type: String,
    default: null
  },
  select_field: {
    type: String,
    default: null
  },
  auto: {
    type: Boolean,
    default: true
  },
  required: {
    type: Boolean,
    default: true
  },
  separator: {
    type: String,
    default: '-'
  },
  lowercase: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: 'Enter a slug or url...'
  },
  collection: {
    type: String,
    required: true
  },
  field: {
    type: String,
    required: true
  },
  primaryKey: {
    type: [String, Number],
    default: null
  },
  custom_empty_message: {
    type: String,
    default: null
  },
  custom_format_message: {
    type: String,
    default: null
  },
  custom_unique_message: {
    type: String,
    default: null
  },
  allow_duplicates: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['input', 'validation']);

const api = useApi();
const { items: itemsStore } = useStores();

const internalValue = ref(props.value || '');
const isValid = ref(true);
const validationMessage = ref('');
const sourceValue = ref('');
const isEditing = ref(false);
const cachedValueBeforeEdit = ref('');

// Add a function to check if slug is unique in the collection
const checkSlugUniqueness = async (slug: string): Promise<boolean> => {
  if (!props.collection || !slug) return true;

  try {
    // Regular uniqueness check for all collections
    const response = await api.get(`/items/${props.collection}`, {
      params: {
        filter: {
          [props.field]: { _eq: slug },
          // Don't check against the current item
          ...(props.primaryKey && { id: { _neq: props.primaryKey } })
        },
        limit: 1
      }
    });

    return response.data.data.length === 0;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    return true; // In case of error, allow the slug to prevent blocking the user
  }
};

// Update validateSlug to use the required option
const validateSlug = async () => {
  if (!internalValue.value) {
    // Only mark as invalid if the slug is required
    if (props.required) {
      isValid.value = false;
      validationMessage.value = props.custom_empty_message || 'Slug cannot be empty. Please enter a valid slug.';
      emit('validation', false); // Emit validation failure
      return;
    } else {
      // If slug is not required, an empty value is valid
      isValid.value = true;
      validationMessage.value = '';
      emit('validation', true); // Emit validation success
      return;
    }
  }

  // Modified regex pattern to allow full URLs with dots and hierarchical paths, including specific domains
  const updatedSlugPattern = /^(https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9](:[0-9]+)?(\.[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9])*(?:\/[a-zA-Z0-9]+(?:[-\/][a-zA-Z0-9]+)*\/?)?|[\/]?[a-zA-Z0-9]+(?:[-\/][a-zA-Z0-9]+)*\/?)$/i;

  if (!updatedSlugPattern.test(internalValue.value)) {
    isValid.value = false;
    validationMessage.value = props.custom_format_message || 'Please enter a valid URL (e.g., https://cms.staging.piletilevi.ee/) or a valid slug with lowercase letters, numbers, hyphens, dots, and forward slashes.';
    emit('validation', false); // Emit validation failure
    return;
  }
  // Skip uniqueness check if allow_duplicates is true
  if (!props.allow_duplicates) {
    const isUnique = await checkSlugUniqueness(internalValue.value);
    if (!isUnique) {
      isValid.value = false;
      validationMessage.value = props.custom_unique_message || 'This slug is already in use. Please enter a unique slug.';
      emit('validation', false); // Emit validation failure
      return;
    }
  }

  isValid.value = true;
  validationMessage.value = '';
  emit('validation', true); // Emit validation success
};

const previewSlug = computed(() => {
  if (!internalValue.value) return '';
  return internalValue.value;
});

const createSlug = (text: string) => {
  // Ensure text is a string
  if (!text || typeof text !== 'string') return '';

  // Convert to lowercase if option is enabled
  let slug = props.lowercase ? text.toLowerCase() : text;

  // Replace special characters and spaces with the separator
  slug = slug
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9\-\/ ]/g, '') // Remove special chars, but allow slashes and hyphens
    .trim()
    .replace(/\s+/g, props.separator); // Replace spaces with separator

  // Remove consecutive separators and slashes
  slug = slug.replace(new RegExp(`${props.separator}+`, 'g'), props.separator);
  slug = slug.replace(/\/+/g, '/'); // Replace multiple slashes with a single one

  // Check for trailing slash and preserve it
  const hasTrailingSlash = slug.endsWith('/');

  // Remove separator from beginning and end, but preserve a single leading/trailing slash if present
  const hasLeadingSlash = slug.startsWith('/');
  slug = slug.replace(new RegExp(`^${props.separator}|${props.separator}$`, 'g'), '');

  // Re-add leading slash if it was present originally
  if (hasLeadingSlash && !slug.startsWith('/')) {
    slug = '/' + slug;
  }

  // Re-add trailing slash if it was present originally
  if (hasTrailingSlash && !slug.endsWith('/')) {
    slug = slug + '/';
  }

  return slug;
};

const processInput = async (value: string | any) => {
  // Make sure we're working with a string value
  // The v-input component might pass an event object instead of just the string
  const inputValue = typeof value === 'string' ? value :
                     value && typeof value === 'object' && value.target ?
                     value.target.value : '';

  // If value is empty and auto is enabled, try to regenerate from source
  if (inputValue === '' && props.auto && selectedSourceField.value) {
    await fetchSourceValue();
    if (sourceValue.value) {
      const sourceText = String(sourceValue.value);
      internalValue.value = createSlug(sourceText);
    } else {
      internalValue.value = '';
    }
  }
  // Only apply automatic formatting if auto is on AND we're not editing an existing value
  else if (inputValue && props.auto && !cachedValueBeforeEdit.value) {
    internalValue.value = createSlug(inputValue);
  } else {
    // When editing an existing slug, just use the raw input value
    internalValue.value = inputValue;
  }

  // Call validateSlug but don't wait for the promise to complete
  validateSlug();
  emit('input', internalValue.value);
};

// Add key press handler for the editing mode
const onKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    // Restore the cached value and exit edit mode
    internalValue.value = cachedValueBeforeEdit.value;
    disableEdit();
  } else if (event.key === 'Enter') {
    disableEdit();
  }
};

// Functions to enable/disable editing mode
const enableEdit = () => {
  if (props.disabled) return;
  cachedValueBeforeEdit.value = internalValue.value;
  isEditing.value = true;
  // Make sure internalValue is set to the current value before entering edit mode
  if (!internalValue.value) {
    internalValue.value = props.value || '';
  }
};

const disableEdit = () => {
  isEditing.value = false;
  validateSlug();
};

// Computed property to determine the actual source field to use
const selectedSourceField = computed(() => {
  return props.select_field || props.select_collection;
});

const fetchSourceValue = async () => {
  if (!props.primaryKey || !selectedSourceField.value) return;

  try {
    // If the source field is in the same collection, fetch it directly
    const fieldParts = selectedSourceField.value.split('.');

    if (fieldParts.length === 1) {
      // Simple field in the same collection
      // First check if we can access the item through the store to avoid API calls
      if (props.collection && props.primaryKey && itemsStore?.getItem) {
        try {
          const item = itemsStore.getItem(props.collection, props.primaryKey);
          if (item && item[fieldParts[0]] !== undefined) {
            sourceValue.value = item[fieldParts[0]];
            return; // Exit early if we got the value from the store
          }
        } catch (storeError) {
          console.debug('Could not get item from store, trying API:', storeError);
        }
      }

      // If store access failed, try the API
      try {
        // Check if we're dealing with a translations table
        const isTranslation = props.select_collection && props.select_collection.includes('_translations');
        let collection = props.select_collection || props.collection;
        let primaryKey = props.primaryKey;

        // For translation collections, we need to find the translation entry first
        if (isTranslation) {
          // Get the base collection name (remove _translations suffix)
          const baseCollection = collection.replace('_translations', '');

          // Find the translation entry that references the main item
          const translationResponse = await api.get(`/items/${collection}`, {
            params: {
              filter: {
                [`${baseCollection}_id`]: { _eq: props.primaryKey }
              },
              limit: 1
            }
          });

          if (translationResponse.data.data && translationResponse.data.data.length > 0) {
            // Use the translation entry's ID
            primaryKey = translationResponse.data.data[0].id;
          } else {
            console.warn(`No translation found for ${baseCollection} with ID ${props.primaryKey}`);
            return;
          }
        }

        // Now fetch the field from the appropriate collection using the correct primary key
        const response = await api.get(`/items/${collection}/${primaryKey}`, {
          params: {
            fields: [fieldParts[0]]
          }
        });

        if (response.data.data && response.data.data[fieldParts[0]] !== undefined) {
          sourceValue.value = response.data.data[fieldParts[0]];
        }
      } catch (apiError) {
        // Handle specific permission errors
        if (apiError.response && apiError.response.status === 403) {
          console.warn(`Permission denied: Cannot access field "${fieldParts[0]}" in collection "${props.select_collection || props.collection}"`, apiError);
          // Do not set a fallback value here
        } else {
          console.error('API error:', apiError);
        }
      }
    } else if (fieldParts.length > 1) {
      // Relational field
      // Example: if source is 'translations.name', we need to fetch from the translations collection
      const relationCollection = fieldParts[0];
      const relationField = fieldParts[1];

      try {
        const response = await api.get(`/items/${relationCollection}`, {
          params: {
            filter: {
              [`${props.collection}_id`]: { _eq: props.primaryKey }
            },
            fields: [relationField],
            limit: 1
          }
        });

        if (response.data.data && response.data.data.length > 0 &&
            response.data.data[0][relationField] !== undefined) {
          sourceValue.value = response.data.data[0][relationField];
        }
      } catch (apiError) {
        // Handle specific permission errors for relational fields
        if (apiError.response && apiError.response.status === 403) {
          console.warn(`Permission denied: Cannot access field "${relationField}" in collection "${relationCollection}"`, apiError);
        } else {
          console.error('API error fetching relational field:', apiError);
        }
      }
    }
  } catch (error) {
    console.error('Error in fetchSourceValue:', error);
  }

  // Remove the fallback logic that generated random timestamps
};

const regenerateSlug = async () => {
  if (selectedSourceField.value) {
    await fetchSourceValue();
    // Only process if we actually got a value back
    if (sourceValue.value) {
      // Convert sourceValue to string if it's not already
      const sourceText = String(sourceValue.value);
      internalValue.value = createSlug(sourceText);
      await validateSlug();
      emit('input', internalValue.value);
    } else {
      console.warn('Could not regenerate slug: No source value available');
    }
  }
};

// Store interval reference for cleanup
const validationIntervalRef = ref<ReturnType<typeof setInterval> | null>(null);

// Function to check validation state and update UI
const updateValidationUI = () => {
  const headerBar = document.querySelector('.header-bar');

  if (!isValid.value) {
    if (headerBar) {
      headerBar.classList.add('slug-validation-error');

      // Find and disable only buttons INSIDE the header-bar
      const headerBarButtons = headerBar.querySelectorAll('button:not(.slug-generator button)');
      headerBarButtons.forEach(button => {
        (button as HTMLButtonElement).disabled = true;
        button.setAttribute('data-disabled-by-slug', 'true');
      });
    }
  } else {
    // Re-enable buttons when validation passes
    const disabledButtons = document.querySelectorAll('[data-disabled-by-slug="true"]');
    disabledButtons.forEach(button => {
      (button as HTMLButtonElement).disabled = false;
      button.removeAttribute('data-disabled-by-slug');
    });

    // Remove the error class
    if (headerBar) {
      headerBar.classList.remove('slug-validation-error');
    }
  }
};

onMounted(async () => {
  // If no value exists yet, and we should auto-generate, fetch source and create slug
  if ((!internalValue.value || internalValue.value === '') && props.auto && selectedSourceField.value && props.primaryKey) {
    await fetchSourceValue();
    if (sourceValue.value) {
      // Convert to string if needed
      const sourceText = String(sourceValue.value);
      internalValue.value = createSlug(sourceText);
      await validateSlug();
      emit('input', internalValue.value);
    }
    // No fallback to random slug if source value wasn't found
  }

  // Always run validation on mount to catch empty values
  await validateSlug();

  // Start interval to check validation status every second
  validationIntervalRef.value = setInterval(() => {
    updateValidationUI();
  }, 1000);
});

// Clean up interval when component is unmounted
onUnmounted(() => {
  if (validationIntervalRef.value) {
    clearInterval(validationIntervalRef.value);
  }
});

// Ensure validation runs whenever the value changes
watch(internalValue, () => {
  validateSlug();
  // Also update UI immediately when value changes
  updateValidationUI();
});

// Watch for external value changes
watch(() => props.value, (newVal) => {
  if (newVal !== internalValue.value) {
    internalValue.value = newVal || '';
    validateSlug();
  }
});

// Watch for item changes to update the slug if source field changes
watch(
  () => {
    if (props.primaryKey && props.collection && itemsStore?.getItem) {
      try {
        const item = itemsStore.getItem(props.collection, props.primaryKey);
        if (item && selectedSourceField.value && !selectedSourceField.value.includes('.')) {
          return item[selectedSourceField.value];
        }
      } catch (error) {
        console.error('Error accessing itemsStore:', error);
      }
    }
    return null;
  },
  async (newSourceValue) => {
    if (newSourceValue && props.auto && (!internalValue.value || internalValue.value === '')) {
      sourceValue.value = newSourceValue;
      // Convert to string if needed
      const sourceText = String(newSourceValue);
      internalValue.value = createSlug(sourceText);
      await validateSlug();
      emit('input', internalValue.value);
    }
  }
);

// Watch for props.select_field changes to update the slug if the source field changes
watch(
  () => props.select_field,
  async (newSelectField, oldSelectField) => {
    if (newSelectField !== oldSelectField && props.auto && props.primaryKey) {
      // Source field has changed, fetch the new source value and update the slug
      await fetchSourceValue();
      if (sourceValue.value) {
        // Convert to string if needed
        const sourceText = String(sourceValue.value);
        internalValue.value = createSlug(sourceText);
        await validateSlug();
        emit('input', internalValue.value);
      }
    }
  }
);

// Watch for select_collection changes
watch(
  () => props.select_collection,
  async (newCollection, oldCollection) => {
    if (newCollection !== oldCollection && props.auto && props.primaryKey) {
      // Collection source has changed, fetch the new source value and update the slug
      await fetchSourceValue();
      if (sourceValue.value) {
        // Convert to string if needed
        const sourceText = String(sourceValue.value);
        internalValue.value = createSlug(sourceText);
        await validateSlug();
        emit('input', internalValue.value);
      }
    }
  }
);

// Enhance the existing watch function for the selected field value
watch(
  () => {
    if (props.primaryKey && props.collection && itemsStore?.getItem) {
      try {
        const item = itemsStore.getItem(props.collection, props.primaryKey);
        if (item && selectedSourceField.value) {
          // Return the selected field's value and the field name to detect both value and field changes
          return {
            value: !selectedSourceField.value.includes('.') ? item[selectedSourceField.value] : null,
            field: selectedSourceField.value
          };
        }
      } catch (error) {
        console.error('Error accessing itemsStore:', error);
      }
    }
    return { value: null, field: null };
  },
  async (newSource, oldSource) => {
    // Update the slug if either:
    // 1. The source field value changed
    // 2. The source field itself changed (different field selected)
    if (
      (newSource.value && newSource.value !== oldSource.value) ||
      (newSource.field !== oldSource.field && newSource.field)
    ) {
      // Only update if automatic slug generation is enabled
      if (props.auto) {
        sourceValue.value = newSource.value;
        // Convert to string if needed
        const sourceText = String(newSource.value);
        internalValue.value = createSlug(sourceText);
        await validateSlug();
        emit('input', internalValue.value);
      }
    }
  },
  { deep: true }
);
</script>

<style scoped>
.slug-generator {
  width: 100%;
}

.validation-message {
  margin-top: 4px;
  font-size: 12px;
  color: var(--danger);
}

.slug-preview-mode {
  display: flex;
  align-items: center;
  min-height: var(--input-height);
  width: 100%;
  padding: 8px 10px;
  background-color: var(--background-input);
  border: var(--border-width) solid var(--border-normal);
  border-radius: var(--border-radius);
  justify-content: space-between;
}

.slug-display {
  font-family: var(--family-monospace);
  color: var(--foreground-normal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  cursor: text;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-left: 8px;
}

.action-button {
  color: var(--foreground-subdued);
}

.action-button:hover {
  color: var(--foreground-normal);
}

.has-error {
  border-color: var(--danger);
}

.valid-icon {
  color: var(--success);
}

.invalid-icon {
  color: var(--danger);
}
</style>
