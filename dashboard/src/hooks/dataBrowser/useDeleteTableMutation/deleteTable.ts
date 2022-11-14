import type {
  AffectedRowsResult,
  MutationOrQueryBaseOptions,
  QueryError,
  QueryResult,
} from '@/types/data-browser';
import { getPreparedHasuraQuery } from '@/utils/dataBrowser/hasuraQueryHelpers';
import normalizeQueryError from '@/utils/dataBrowser/normalizeQueryError';

export interface DeleteTableVariables {
  /**
   * Schema where the table is located.
   */
  schema: string;
  /**
   * Table to delete.
   */
  table: string;
}

export interface DeleteTableOptions
  extends Omit<MutationOrQueryBaseOptions, 'schema' | 'table'> {}

export default async function deleteTable({
  dataSource,
  appUrl,
  adminSecret,
  schema,
  table,
}: DeleteTableOptions & DeleteTableVariables) {
  const response = await fetch(`${appUrl}/v2/query`, {
    method: 'POST',
    headers: {
      'x-hasura-admin-secret': adminSecret,
    },
    body: JSON.stringify({
      args: [
        getPreparedHasuraQuery(dataSource, 'DROP TABLE %I.%I', schema, table),
      ],
      type: 'bulk',
      version: 1,
    }),
  });

  const responseData: [AffectedRowsResult, QueryResult<string[]>] | QueryError =
    await response.json();

  if (response.ok) {
    return;
  }

  const normalizedError = normalizeQueryError(responseData);

  throw new Error(normalizedError);
}
