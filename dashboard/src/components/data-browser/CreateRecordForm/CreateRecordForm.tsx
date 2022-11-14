import type { BaseRecordFormProps } from '@/components/data-browser/BaseRecordForm';
import BaseRecordForm from '@/components/data-browser/BaseRecordForm';
import useCreateRecordMutation from '@/hooks/dataBrowser/useCreateRecordMutation';
import type { ColumnInsertOptions } from '@/types/data-browser';
import { Alert } from '@/ui/Alert';
import Button from '@/ui/v2/Button';
import { createDynamicValidationSchema } from '@/utils/dataBrowser/validationSchemaHelpers';
import { triggerToast } from '@/utils/toast';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';

export interface CreateRecordFormProps
  extends Pick<BaseRecordFormProps, 'columns' | 'onCancel'> {
  /**
   * Function to be called when the form is submitted.
   */
  onSubmit?: () => Promise<void>;
}

export default function CreateRecordForm({
  onSubmit,
  ...props
}: CreateRecordFormProps) {
  const { mutateAsync: insertRow, error, reset } = useCreateRecordMutation();
  const validationSchema = createDynamicValidationSchema(props.columns);

  const form = useForm({
    defaultValues: props.columns.reduce((defaultValues, column) => {
      if (column.defaultValue && column.type === 'boolean') {
        return { ...defaultValues, [column.id]: column.defaultValue };
      }

      return { ...defaultValues, [column.id]: null };
    }, {}),
    reValidateMode: 'onBlur',
    resolver: yupResolver(validationSchema),
  });

  async function handleSubmit(values: Record<string, ColumnInsertOptions>) {
    try {
      await insertRow({ columnValues: values });

      if (onSubmit) {
        await onSubmit();
      }

      triggerToast('The row has been inserted successfully.');
    } catch {
      // This error is handled by the useCreateRecordMutation hook.
    }
  }

  return (
    <FormProvider {...form}>
      {error && error instanceof Error && (
        <div className="-mt-3 mb-4 px-6">
          <Alert
            severity="error"
            className="grid grid-flow-col items-center justify-between px-4 py-3"
          >
            <span className="text-left">
              <strong>Error:</strong> {error.message}
            </span>

            <Button
              variant="borderless"
              color="error"
              className="p-1 text-greyscaleDark hover:text-greyscaleDark"
              onClick={reset}
            >
              Clear
            </Button>
          </Alert>
        </div>
      )}

      <BaseRecordForm
        submitButtonText="Insert"
        onSubmit={handleSubmit}
        {...props}
      />
    </FormProvider>
  );
}
