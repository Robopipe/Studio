import { createFormHook } from '@tanstack/react-form';

import { CheckboxField } from '../components/CheckboxField';
import { ComboboxField } from '../components/ComboboxField';
import { NumberInputField } from '../components/NumberInputField';
import { SelectInputField } from '../components/SelectInputField';
import { SubmitButton } from '../components/SubmitButton';
import { SwitchField } from '../components/SwitchField';
import { TextareaField } from '../components/TextareaField';
import { TextInputField } from '../components/TextInputField';
import { fieldContext, formContext } from './useFormContext';

export const { useAppForm, useTypedAppFormContext, withForm } = createFormHook({
    fieldContext,
    formContext,
    formComponents: {
        SubmitButton: SubmitButton,
    },
    fieldComponents: {
        TextInput: TextInputField,
        NumberInput: NumberInputField,
        Textarea: TextareaField,
        SelectInput: SelectInputField,
        Combobox: ComboboxField,
        Checkbox: CheckboxField,
        Switch: SwitchField,
    },
});
