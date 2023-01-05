import { DocumentNode } from 'graphql'
import {
  BaseGeneratedSchema,
  NhostGraphqlRequestConfig,
  NhostGraphqlRequestResponse
} from '../../client/client.types'
import generateGraphQlQuery from '../generateGraphQlQuery'
import prepareQueryFields from '../prepareQueryFields'

export type FetchFunction = <T = any, V = any>(
  document: string | DocumentNode,
  variables?: V,
  config?: NhostGraphqlRequestConfig & { useAxios: false }
) => Promise<NhostGraphqlRequestResponse<T>>

export default function createQueryClient<Q extends object = any>(
  generatedSchema?: BaseGeneratedSchema,
  fetch?: FetchFunction
) {
  if (!generatedSchema) {
    return {} as Q
  }

  const { query: generatedQueries } = generatedSchema

  return Object.keys(generatedQueries).reduce(
    (queryClient, queryName) => ({
      ...queryClient,
      [queryName]: (args?: typeof generatedQueries[typeof queryName]['__args']) => {
        const { scalar: scalarFields } = prepareQueryFields(generatedSchema, queryName)
        const graphQlQuery = generateGraphQlQuery({
          name: queryName,
          returnFields: scalarFields,
          args: Object.keys(args || {}).reduce(
            (currentArguments, key) => ({
              ...currentArguments,
              [key]: generatedQueries[queryName].__args?.[key]
            }),
            {}
          )
        })

        return new Promise(async (resolve, reject) => {
          if (!fetch) {
            resolve(null)
            return
          }

          const { data, error } = await fetch?.(graphQlQuery, args, { useAxios: false })

          if (error) {
            reject(error)
          }

          resolve(data?.data?.[queryName])
        })
      }
    }),
    {} as Q
  )
}
