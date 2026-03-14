import { api } from "@/core/api";
import { apiCacheTags } from "@/core/api/tags";
import {
  EvalLimit,
  EvalLimitCreateOrUpdate,
  EvalLimitDetail,
  EvalTestCase,
  EvalTestCaseCreateOrUpdate,
  EvalTestCaseDetail,
  evalLimitDetailSchema,
  evalLimitSchema,
  evalTestCaseDetailSchema,
  evalTestCaseSchema,
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
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
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
      invalidatesTags: (_result, _error, { projectId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
        { type: apiCacheTags.eval.limits, id: limitId },
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
      invalidatesTags: (_result, _error, { projectId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
        { type: apiCacheTags.eval.limits, id: limitId },
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
} = evaluationApi;
