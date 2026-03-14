import React, { ComponentProps } from 'react';

import { Textarea } from '@/src/components/ui';
import { useFieldContext } from '../hooks/useFormContext';
import { FieldWrapper } from './FieldWrapper';

export type TextareaFieldProps = ComponentProps<typeof Textarea> & {
    label?: string;
    error?: string;
};

export const TextareaField = ({ label, error, ...props }: TextareaFieldProps) => {
    const field = useFieldContext<string | null | undefined>();

    return (
        <FieldWrapper label={label} error={error ?? field.state.meta.errors?.[0]?.message}>
            <Textarea
                value={field.state.value ?? ''}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                {...props}
            />
        </FieldWrapper>
    );
};
