import { Button, ButtonProps } from '@/src/components/ui';
import { useFormContext } from '../hooks/useFormContext';

export type SubmitButtonProps = ButtonProps;

export const SubmitButton = ({ ...props }: SubmitButtonProps) => {
    const form = useFormContext();

    return (
        <form.Subscribe selector={(state) => ({ isSubmitting: state.isSubmitting })}>
            {({ isSubmitting }) => (
                <Button {...props} loading={isSubmitting} onPress={form.handleSubmit} />
            )}
        </form.Subscribe>
    );
};
