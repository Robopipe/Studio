import { createFormHook } from '@tanstack/react-form';

import { NumberInputField } from '../components/NumberInputField';
import { SubmitButton } from '../components/SubmitButton';
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
    },
});
