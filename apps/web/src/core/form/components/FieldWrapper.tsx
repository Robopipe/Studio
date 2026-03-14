import { ReactNode } from 'react';
import { CircleAlertIcon } from 'lucide-react-native';

import { Column, Icon, Row, Text } from '@/src/components/ui';

export type FieldWrapperProps = {
    children: ReactNode;
    label?: string;
    error?: string;
};

export const FieldWrapper = ({ children, label, error }: FieldWrapperProps) => {
    return (
        <Column className="shrink gap-1">
            {label && (
                <Text
                    variant="regular14"
                    className="shrink text-ellipsis text-primary"
                    numberOfLines={1}
                >
                    {label}
                </Text>
            )}
            <Row>{children}</Row>
            {error && (
                <Row className="items-center gap-1">
                    <Icon as={CircleAlertIcon} size={16} className="text-destructive" />
                    <Text variant="regular14" className="flex-1 text-destructive">
                        {error}
                    </Text>
                </Row>
            )}
        </Column>
    );
};
