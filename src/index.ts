import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
  id: 'slug-generator',
  name: 'Slug Generator',
  icon: 'link',
  description: 'Generate and validate a slug from another field',
  component: InterfaceComponent,
  types: ['string'],
  group: 'standard',
  options: [
    {
      field: 'select_collection',
      name: 'Source Collection',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'system-collection',
        options: {
          allowPrimaryKey: false,
          allowNone: false,
          includeCollections: ['translations']
        }
      }
    },
    {
      field: "select_field",
      name: "Source Field",
      type: "string",
      meta: {
        width: "half",
        interface: "system-field",
        options: {
          collectionField: "select_collection",
          allowPrimaryKey: false,
          allowNone: false
        }
      }
    },
    {
      field: 'auto',
      name: 'Auto Generate',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
        options: {
          label: 'Generate slug automatically'
        }
      },
      schema: {
        default_value: true
      }
    },
    {
      field: 'required',
      name: 'Required',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
        options: {
          label: 'Slug is required'
        }
      },
      schema: {
        default_value: true
      }
    },
    {
      field: 'separator',
      name: 'Separator',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Hyphen (-)', value: '-' },
            { text: 'Underscore (_)', value: '_' }
          ]
        }
      },
      schema: {
        default_value: '-'
      }
    },
    {
      field: 'lowercase',
      name: 'Lowercase',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
        options: {
          label: 'Convert to lowercase'
        }
      },
      schema: {
        default_value: true
      }
    },
    {
      field: 'placeholder',
      name: 'Placeholder',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'input',
        options: {
          placeholder: 'Enter placeholder text...'
        }
      }
    },
    {
      field: 'custom_empty_message',
      name: 'Custom Empty Error Message',
      type: 'string',
      meta: {
        width: 'full',
        interface: 'input',
        options: {
          placeholder: 'Slug cannot be empty. Please enter a valid slug.'
        }
      }
    },
    {
      field: 'custom_format_message',
      name: 'Custom Format Error Message',
      type: 'string',
      meta: {
        width: 'full',
        interface: 'input',
        options: {
          placeholder: 'Slug must contain only lowercase letters, numbers, hyphens, and forward slashes.'
        }
      }
    },
    {
      field: 'unique_collection',
      name: 'Unique Collection',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'system-collection',
        options: {
          allowNone: true
        }
      }
    },
    {
      field: 'unique_field',
      name: 'Unique Field',
      type: 'string',
      meta: {
        width: 'half',
        interface: 'system-field',
        options: {
          collectionField: 'unique_collection',
          allowNone: true
        }
      }
    },
    {
      field: 'custom_unique_message',
      name: 'Custom Uniqueness Error Message',
      type: 'string',
      meta: {
        width: 'full',
        interface: 'input',
        options: {
          placeholder: 'This slug is already in use. Please enter a unique slug.'
        }
      }
    },
    {
      field: 'allow_duplicates',
      name: 'Allow Duplicate Slugs',
      type: 'boolean',
      meta: {
        width: 'half',
        interface: 'boolean',
        options: {
          label: 'Allow duplicate slugs across collections'
        }
      },
      schema: {
        default_value: false
      }
    }
  ]
});
