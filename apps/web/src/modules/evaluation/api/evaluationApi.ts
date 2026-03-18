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
      { projectId: number; testCaseId: string }
    >({
      query: ({ projectId, testCaseId }) =>
        `/eval/${projectId}/limit/${testCaseId}`,
      transformResponse: (response) =>
        z.array(evalLimitSchema).parse(response),
      providesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
      ],
    }),

    getEvalLimit: builder.query<
      EvalLimitDetail,
      { projectId: number; testCaseId: string; limitId: string }
    >({
      query: ({ projectId, testCaseId, limitId }) =>
        `/eval/${projectId}/limit/${testCaseId}/${limitId}`,
      transformResponse: (response) => evalLimitDetailSchema.parse(response),
      providesTags: (_result, _error, { limitId }) => [
        { type: apiCacheTags.eval.limits, id: limitId },
      ],
    }),

    // Eval Test Cases
    getEvalTestCases: builder.query<
      EvalTestCase[],
      { projectId: number }
    >({
      query: ({ projectId }) => `/eval/${projectId}/test-case`,
      transformResponse: (response) =>
        z.array(evalTestCaseSchema).parse(response),
      providesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.testCases, id: projectId },
      ],
    }),

    getEvalTestCase: builder.query<
      EvalTestCaseDetail,
      { projectId: number; testCaseId: string }
    >({
      query: ({ projectId, testCaseId }) =>
        `/eval/${projectId}/test-case/${testCaseId}`,
      transformResponse: (response) => evalTestCaseDetailSchema.parse(response),
      providesTags: (_result, _error, { testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    // Eval Test Case Mutations
    createEvalTestCase: builder.mutation<
      EvalTestCaseDetail,
      { projectId: number; body: EvalTestCaseCreateOrUpdate }
    >({
      query: ({ projectId, body }) => ({
        url: `/eval/${projectId}/test-case`,
        method: "POST",
        body,
      }),
      transformResponse: (response) => evalTestCaseDetailSchema.parse(response),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.testCases, id: projectId },
      ],
    }),

    updateEvalTestCase: builder.mutation<
      EvalTestCaseDetail,
      {
        projectId: number;
        testCaseId: string;
        body: EvalTestCaseCreateOrUpdate;
      }
    >({
      query: ({ projectId, testCaseId, body }) => ({
        url: `/eval/${projectId}/test-case/${testCaseId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response) => evalTestCaseDetailSchema.parse(response),
      invalidatesTags: (_result, _error, { projectId, testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: projectId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    // Eval Limit Mutations
    createEvalLimit: builder.mutation<
      EvalLimitDetail,
      { projectId: number; testCaseId: string; body: EvalLimitCreateOrUpdate }
    >({
      query: ({ projectId, testCaseId, body }) => ({
        url: `/eval/${projectId}/limit/${testCaseId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response) => evalLimitDetailSchema.parse(response),
      invalidatesTags: (_result, _error, { projectId, testCaseId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
        { type: apiCacheTags.eval.testCases, id: projectId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    updateEvalLimit: builder.mutation<
      EvalLimitDetail,
      {
        projectId: number;
        testCaseId: string;
        limitId: string;
        body: EvalLimitCreateOrUpdate;
      }
    >({
      query: ({ projectId, testCaseId, limitId, body }) => ({
        url: `/eval/${projectId}/limit/${testCaseId}/${limitId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response) => evalLimitDetailSchema.parse(response),
      invalidatesTags: (_result, _error, { projectId, testCaseId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
        { type: apiCacheTags.eval.limits, id: limitId },
        { type: apiCacheTags.eval.testCases, id: projectId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    deleteEvalLimit: builder.mutation<
      void,
      { projectId: number; testCaseId: string; limitId: string }
    >({
      query: ({ projectId, testCaseId, limitId }) => ({
        url: `/eval/${projectId}/limit/${testCaseId}/${limitId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId, testCaseId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
        { type: apiCacheTags.eval.limits, id: limitId },
        { type: apiCacheTags.eval.testCases, id: projectId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    deleteEvalTestCase: builder.mutation<
      void,
      { projectId: number; testCaseId: string }
    >({
      query: ({ projectId, testCaseId }) => ({
        url: `/eval/${projectId}/test-case/${testCaseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId, testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: projectId },
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    // Eval Thresholds
    getEvalThresholds: builder.query<
      EvalTestCaseThreshold[],
      { projectId: number }
    >({
      query: ({ projectId }) => `/eval/${projectId}/threshold`,
      transformResponse: (response) =>
        z.array(evalTestCaseThresholdSchema).parse(response),
      providesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.thresholds, id: projectId },
      ],
    }),

    createEvalThreshold: builder.mutation<
      void,
      { projectId: number; testCaseId: string; body: EvalThresholdCreateOrUpdate }
    >({
      query: ({ projectId, testCaseId, body }) => ({
        url: `/eval/${projectId}/threshold/${testCaseId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.thresholds, id: projectId },
      ],
    }),

    updateEvalThreshold: builder.mutation<
      void,
      {
        projectId: number;
        testCaseId: string;
        thresholdId: string;
        body: EvalThresholdCreateOrUpdate;
      }
    >({
      query: ({ projectId, testCaseId, thresholdId, body }) => ({
        url: `/eval/${projectId}/threshold/${testCaseId}/${thresholdId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.thresholds, id: projectId },
      ],
    }),

    deleteEvalThreshold: builder.mutation<
      void,
      { projectId: number; testCaseId: string; thresholdId: string }
    >({
      query: ({ projectId, testCaseId, thresholdId }) => ({
        url: `/eval/${projectId}/threshold/${testCaseId}/${thresholdId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.thresholds, id: projectId },
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
