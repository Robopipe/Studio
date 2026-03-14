import { i18n } from 'i18next';

export const FormError = {
    required: (i18n) => i18n.t('errors:form.required'),
    invalidNumber: (i18n) => i18n.t('errors:form.invalidNumber'),
    invalidEmail: (i18n) => i18n.t('errors:form.invalidEmail'),
    invalidDate: (i18n) => i18n.t('errors:form.invalidDate'),
    min: (i18n, value) => i18n.t('errors:form.min', { value }),
    max: (i18n, value) => i18n.t('errors:form.max', { value }),
    lessThan: (i18n, value) => i18n.t('errors:form.lessThan', { value }),
    greaterThan: (i18n, value) => i18n.t('errors:form.greaterThan', { value }),
    passwordsDoNotMatch: (i18n) => i18n.t('errors:form.passwordsDoNotMatch'),
} satisfies Record<string, (i18n: i18n, value?: number) => string>;
