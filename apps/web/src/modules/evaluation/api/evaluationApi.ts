import { api } from "@/core/api";
import { apiCacheTags } from "@/core/api/tags";
import {
  EvalLimit,
  EvalLimitCreateOrUpdate,
  EvalLimitDetail,
  EvalTestCase,
  EvalTestCaseCreateOrUpdate,
  EvalTestCaseDetail,
  EvalTestCaseThreshold,
  EvalThresholdCreateOrUpdate,
  evalLimitDetailSchema,
  evalLimitSchema,
  evalTestCaseDetailSchema,
  evalTestCaseSchema,
  evalTestCaseThresholdSchema,
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
      invalidatesTags: (_result, _error, { configId, testCaseId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: testCaseId },
        { type: apiCacheTags.eval.limits, id: limitId },
        { type: apiCacheTags.eval.testCases, id: configId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    deleteEvalLimit: builder.mutation<
      void,
      { projectId: number; configId: number; testCaseId: string; limitId: string }
    >({
      query: ({ projectId, configId, testCaseId, limitId }) => ({
        url: `/eval/${projectId}/config/${configId}/limit/${testCaseId}/${limitId}`,
        method: "DELETE",
      }),
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

    // Eval Thresholds
    getEvalThresholds: builder.query<
      EvalTestCaseThreshold[],
      { projectId: number; configId: number }
    >({
      query: ({ projectId, configId }) =>
        `/eval/${projectId}/config/${configId}/threshold`,
      transformResponse: (response) =>
        z.array(evalTestCaseThresholdSchema).parse(response),
      providesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    createEvalThreshold: builder.mutation<
      void,
      { projectId: number; configId: number; testCaseId: string; body: EvalThresholdCreateOrUpdate }
    >({
      query: ({ projectId, configId, testCaseId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/threshold/${testCaseId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    updateEvalThreshold: builder.mutation<
      void,
      {
        projectId: number;
        configId: number;
        testCaseId: string;
        thresholdId: string;
        body: EvalThresholdCreateOrUpdate;
      }
    >({
      query: ({ projectId, configId, testCaseId, thresholdId, body }) => ({
        url: `/eval/${projectId}/config/${configId}/threshold/${testCaseId}/${thresholdId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { configId }) => [
        { type: apiCacheTags.eval.thresholds, id: configId },
      ],
    }),

    deleteEvalThreshold: builder.mutation<
      void,
      { projectId: number; configId: number; testCaseId: string; thresholdId: string }
    >({
      query: ({ projectId, configId, testCaseId, thresholdId }) => ({
        url: `/eval/${projectId}/config/${configId}/threshold/${testCaseId}/${thresholdId}`,
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
  useGetEvalTestCasesQuery,
  useLazyGetEvalLimitQuery,
  useLazyGetEvalLimitsQuery,
  useLazyGetEvalTestCaseQuery,
  useLazyGetEvalTestCasesQuery,
  useCreateEvalTestCaseMutation,
  useUpdateEvalTestCaseMutation,
  useCreateEvalLimitMutation,
  useUpdateEvalLimitMutation,
  useDeleteEvalLimitMutation,
  useDeleteEvalTestCaseMutation,
  useGetEvalThresholdsQuery,
  useCreateEvalThresholdMutation,
  useUpdateEvalThresholdMutation,
  useDeleteEvalThresholdMutation,
} = evaluationApi;
