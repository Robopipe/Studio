import { api } from "@/core/api";
import { apiCacheTags } from "@/core/api/tags";
import {
  EvalLimit,
  EvalLimitCreateOrUpdate,
  EvalLimitDetail,
  EvalTestCase,
  EvalTestCaseCreateOrUpdate,
  EvalTestCaseDetail,
  EvalTestCaseFull,
  EvalTestCaseFullCreateOrUpdate,
  EvalThreshold,
  EvalThresholdCreateOrUpdate,
  EvalThresholdsResponse,
  evalLimitDetailSchema,
  evalLimitSchema,
  evalTestCaseDetailSchema,
  evalTestCaseFullSchema,
  evalTestCaseSchema,
  evalThresholdsResponseSchema,
} from "@repo/schema";
import { z } from "zod";

export const evaluationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Eval Limits
    getEvalLimits: builder.query<
      EvalLimit[],
      { projectId: number; configId: number; testCaseId: string }
    >({
      query: ({ projectId, configId, testCaseId }) =>
        `/eval/${projectId}/config/${configId}/limit/${testCaseId}`,
      transformResponse: (response) =>
        z.array(evalLimitSchema).parse(response),
      providesTags: (_result, _error, { testCaseId }) => [
        { type: apiCacheTags.eval.limits, id: testCaseId },
      ],
    }),

    getEvalLimit: builder.query<
      EvalLimitDetail,
      { projectId: number; configId: number; testCaseId: string; limitId: string }
    >({
      query: ({ projectId, configId, testCaseId, limitId }) =>
        `/eval/${projectId}/config/${configId}/limit/${testCaseId}/${limitId}`,
      transformResponse: (response) => evalLimitDetailSchema.parse(response),
      providesTags: (_result, _error, { limitId }) => [
        { type: apiCacheTags.eval.limits, id: limitId },
      ],
    }),

    // Eval Test Cases
    getEvalTestCases: builder.query<
      EvalTestCase[],
      { projectId: number; configId: number }
    >({
      query: ({ projectId, configId }) =>
        `/eval/${projectId}/config/${configId}/test-case`,
      transformResponse: (response) =>
        z.array(evalTestCaseSchema).parse(response),
      providesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.testCases, id: configId },
      ],
    }),

    getEvalTestCase: builder.query<
      EvalTestCaseDetail,
      { projectId: number; configId: number; testCaseId: string }
    >({
      query: ({ projectId, configId, testCaseId }) =>
        `/eval/${projectId}/config/${configId}/test-case/${testCaseId}`,
      transformResponse: (response) => evalTestCaseDetailSchema.parse(response),
      providesTags: (_result, _error, { testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    // Single source of truth for a test case: the whole thing (meta + logic tree +
    // limits WITH their items). Both the graph (subscribes) and the table (peeks,
    // non-subscribing) read this one cache entry.
    //
    // The test-case detail endpoint omits per-limit `limitItems`, so as a stopgap this
    // composes the test-case detail with each limit's detail (which carries its items)
    // into one flat `EvalTestCaseFull` via N+1 client-side requests.
    //
    // FIXME(backend): replace this whole composite query with a single direct call to
    // GET /eval/{projectId}/config/{configId}/test-case/{testCaseId}/full once that
    // endpoint returns limits WITH their limitItems. Then this becomes a plain `query:`
    // + `transformResponse: evalTestCaseFullSchema.parse` — the flat shape is unchanged.
    getEvalTestCaseFull: builder.query<
      EvalTestCaseFull,
      { projectId: number; configId: number; testCaseId: string }
    >({
      async queryFn(
        { projectId, configId, testCaseId },
        _api,
        _extraOptions,
        baseQuery,
      ) {
        const base = `/eval/${projectId}/config/${configId}`;

        const detailResult = await baseQuery(`${base}/test-case/${testCaseId}`);
        if (detailResult.error) return { error: detailResult.error };
        const detail = evalTestCaseDetailSchema.parse(detailResult.data);

        const limitResults = await Promise.all(
          detail.limits.map((limit) =>
            baseQuery(`${base}/limit/${testCaseId}/${limit.id}`),
          ),
        );

        const failed = limitResults.find((result) => result.error);
        if (failed?.error) return { error: failed.error };

        // limitResults follows detail.limits order, so the assembled limits stay ordered.
        const limits = limitResults.map((result) => result.data);
        const full = evalTestCaseFullSchema.parse({ ...detail, limits });

        return { data: full };
      },
      providesTags: (_result, _error, { testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: testCaseId },
        { type: apiCacheTags.eval.limits, id: testCaseId },
      ],
    }),

    // Eval Test Case Mutations
    createEvalTestCase: builder.mutation<
      EvalTestCaseDetail,
      { projectId: number; configId: number; body: EvalTestCaseCreateOrUpdate }
    >({
      query: ({ projectId, configId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/test-case`,
        method: "POST",
        body,
      }),
      transformResponse: (response) => evalTestCaseDetailSchema.parse(response),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    updateEvalTestCase: builder.mutation<
      EvalTestCaseDetail,
      {
        projectId: number;
        configId: number;
        testCaseId: string;
        body: EvalTestCaseCreateOrUpdate;
      }
    >({
      query: ({ projectId, configId, testCaseId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/test-case/${testCaseId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response) => evalTestCaseDetailSchema.parse(response),
      invalidatesTags: (_result, _error, { configId, testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    // Saves an entire test case in one request — name/type/severity/enabled plus the
    // full limits (with their items) and logic tree. This is what the graph editor uses
    // to persist the serialized flow; the BE diffs limits/items by id.
    updateEvalTestCaseFull: builder.mutation<
      EvalTestCaseDetail,
      {
        projectId: number;
        configId: number;
        testCaseId: string;
        body: EvalTestCaseFullCreateOrUpdate;
      }
    >({
      query: ({ projectId, configId, testCaseId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/test-case/${testCaseId}/full`,
        method: "PUT",
        body,
      }),
      transformResponse: (response) => evalTestCaseDetailSchema.parse(response),
      // The table view reads limits/test-cases through different cached queries than the
      // graph. The /full response already carries the updated limits (with severity), so
      // patch those caches straight from it — the table reflects instantly instead of
      // waiting on the invalidation refetch round-trip. The invalidation below still runs
      // as a background reconcile (and covers thresholds + the graph's own query).
      async onQueryStarted(
        { projectId, configId, testCaseId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data } = await queryFulfilled; // EvalTestCaseDetail (limits w/o items)

          // Overview list — reflect meta + limit changes in the table instantly.
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCases",
              { projectId, configId },
              (draft) => {
                const index = draft.findIndex((tc) => tc.id === testCaseId);
                if (index !== -1) {
                  const { logicNodes: _logicNodes, ...testCase } = data;
                  draft[index] = testCase;
                }
              },
            ),
          );

          // SSOT — patch meta + the limit list. The detail response carries no
          // limitItems, so preserve the existing items for surviving limits; the
          // invalidation below refetches the full entry to reconcile items.
          // (Simplifiable once BE PUT /full returns limits with items.)
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCaseFull",
              { projectId, configId, testCaseId },
              (draft) => {
                const existingItems = new Map(
                  draft.limits.map((limit) => [limit.id, limit.limitItems]),
                );
                draft.name = data.name;
                draft.type = data.type;
                draft.severity = data.severity;
                draft.enabled = data.enabled;
                draft.logicNodes = data.logicNodes;
                draft.limits = data.limits.map((limit) => ({
                  ...limit,
                  limitItems: existingItems.get(limit.id) ?? [],
                }));
              },
            ),
          );
        } catch {
          // Mutation failed — leave caches untouched; nothing was persisted.
        }
      },
      invalidatesTags: (_result, _error, { configId, testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
        { type: apiCacheTags.eval.limits, id: testCaseId },
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    // Eval Limit Mutations
    createEvalLimit: builder.mutation<
      EvalLimitDetail,
      { projectId: number; configId: number; testCaseId: string; body: EvalLimitCreateOrUpdate }
    >({
      query: ({ projectId, configId, testCaseId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/limit/${testCaseId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response) => evalLimitDetailSchema.parse(response),
      // Add the new limit to both the SSOT (with items) and the overview list (item-free).
      // No-op on the full entry when it isn't cached (table-only session).
      async onQueryStarted(
        { projectId, configId, testCaseId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data } = await queryFulfilled;
          const { limitItems: _items, ...listLimit } = data;
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCaseFull",
              { projectId, configId, testCaseId },
              (draft) => {
                draft.limits.push(data);
              },
            ),
          );
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCases",
              { projectId, configId },
              (draft) => {
                draft
                  .find((tc) => tc.id === testCaseId)
                  ?.limits.push(listLimit);
              },
            ),
          );
        } catch {
          // Persist failed — invalidation will reconcile.
        }
      },
      invalidatesTags: (_result, _error, { configId, testCaseId }) => [
        { type: apiCacheTags.eval.limits, id: testCaseId },
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    updateEvalLimit: builder.mutation<
      EvalLimitDetail,
      {
        projectId: number;
        configId: number;
        testCaseId: string;
        limitId: string;
        body: EvalLimitCreateOrUpdate;
      }
    >({
      query: ({ projectId, configId, testCaseId, limitId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/limit/${testCaseId}/${limitId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response) => evalLimitDetailSchema.parse(response),
      // Replace the limit in both the SSOT (with items) and the overview list (item-free).
      async onQueryStarted(
        { projectId, configId, testCaseId, limitId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data } = await queryFulfilled;
          const { limitItems: _items, ...listLimit } = data;
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCaseFull",
              { projectId, configId, testCaseId },
              (draft) => {
                const index = draft.limits.findIndex((l) => l.id === limitId);
                if (index !== -1) draft.limits[index] = data;
              },
            ),
          );
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCases",
              { projectId, configId },
              (draft) => {
                const limits = draft.find((tc) => tc.id === testCaseId)?.limits;
                const index = limits?.findIndex((l) => l.id === limitId) ?? -1;
                if (limits && index !== -1) limits[index] = listLimit;
              },
            ),
          );
        } catch {
          // Persist failed — invalidation will reconcile.
        }
      },
      invalidatesTags: (_result, _error, { configId, testCaseId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: testCaseId },
        { type: apiCacheTags.eval.limits, id: limitId },
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    deleteEvalLimit: builder.mutation<
      { deleted: boolean },
      { projectId: number; configId: number; testCaseId: string; limitId: string }
    >({
      query: ({ projectId, configId, testCaseId, limitId }) => ({
        url: `/eval/${projectId}/config/${configId}/limit/${testCaseId}/${limitId}`,
        method: "DELETE",
      }),
      // Remove the limit from both the SSOT and the overview list once the BE confirms.
      async onQueryStarted(
        { projectId, configId, testCaseId, limitId },
        { dispatch, queryFulfilled },
      ) {
        try {
          const { data } = await queryFulfilled;
          if (!data.deleted) return;
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCaseFull",
              { projectId, configId, testCaseId },
              (draft) => {
                draft.limits = draft.limits.filter((l) => l.id !== limitId);
              },
            ),
          );
          dispatch(
            evaluationApi.util.updateQueryData(
              "getEvalTestCases",
              { projectId, configId },
              (draft) => {
                const tc = draft.find((t) => t.id === testCaseId);
                if (tc) tc.limits = tc.limits.filter((l) => l.id !== limitId);
              },
            ),
          );
        } catch {
          // Persist failed — invalidation will reconcile.
        }
      },
      invalidatesTags: (_result, _error, { configId, testCaseId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: testCaseId },
        { type: apiCacheTags.eval.limits, id: limitId },
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    deleteEvalTestCase: builder.mutation<
      void,
      { projectId: number; configId: number; testCaseId: string }
    >({
      query: ({ projectId, configId, testCaseId }) => ({
        url: `/eval/${projectId}/config/${configId}/test-case/${testCaseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    // Thresholds (combined: test case + master)
    getEvalThresholds: builder.query<
      EvalThresholdsResponse,
      { projectId: number; configId: number }
    >({
      query: ({ projectId, configId }) =>
        `/eval/${projectId}/config/${configId}/threshold`,
      transformResponse: (response) =>
        evalThresholdsResponseSchema.parse(response),
      providesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    createEvalThreshold: builder.mutation<
      EvalThreshold,
      { projectId: number; configId: number; testCaseId?: string; body: EvalThresholdCreateOrUpdate }
    >({
      query: ({ projectId, configId, testCaseId, body }) => ({
        url: testCaseId
          ? `/eval/${projectId}/config/${configId}/threshold/${testCaseId}`
          : `/eval/${projectId}/config/${configId}/threshold`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    updateEvalThreshold: builder.mutation<
      EvalThreshold,
      {
        projectId: number;
        configId: number;
        thresholdId: string;
        body: EvalThresholdCreateOrUpdate;
      }
    >({
      query: ({ projectId, configId, thresholdId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/threshold/${thresholdId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    deleteEvalThreshold: builder.mutation<
      void,
      { projectId: number; configId: number; thresholdId: string }
    >({
      query: ({ projectId, configId, thresholdId }) => ({
        url: `/eval/${projectId}/config/${configId}/threshold/${thresholdId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),
  }),
});

export const {
  useGetEvalLimitQuery,
  useGetEvalLimitsQuery,
  useGetEvalTestCaseQuery,
  useGetEvalTestCaseFullQuery,
  useGetEvalTestCasesQuery,
  useLazyGetEvalLimitQuery,
  useLazyGetEvalLimitsQuery,
  useLazyGetEvalTestCaseQuery,
  useLazyGetEvalTestCasesQuery,
  useCreateEvalTestCaseMutation,
  useUpdateEvalTestCaseMutation,
  useUpdateEvalTestCaseFullMutation,
  useCreateEvalLimitMutation,
  useUpdateEvalLimitMutation,
  useDeleteEvalLimitMutation,
  useDeleteEvalTestCaseMutation,
  useGetEvalThresholdsQuery,
  useLazyGetEvalThresholdsQuery,
  useCreateEvalThresholdMutation,
  useUpdateEvalThresholdMutation,
  useDeleteEvalThresholdMutation,
} = evaluationApi;
