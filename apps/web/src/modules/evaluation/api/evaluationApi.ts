import { api } from "@/core/api";
import { apiCacheTags } from "@/core/api/tags";
import {
  EvalLimitCreateOrUpdate,
  EvalLimitDetail,
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
  EvalTestCaseCreateOrUpdate,
  EvalTestCaseDetail,
  EvalTestCaseSeverityEnum,
  EvalTestCaseTypeEnum,
} from "@repo/schema";

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 800));

const now = new Date().toISOString();

function uuidv7(): string {
  const ms = Date.now();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  // 48-bit timestamp
  b[0] = (ms / 2 ** 40) & 0xff;
  b[1] = (ms / 2 ** 32) & 0xff;
  b[2] = (ms / 2 ** 24) & 0xff;
  b[3] = (ms / 2 ** 16) & 0xff;
  b[4] = (ms / 2 ** 8) & 0xff;
  b[5] = ms & 0xff;
  b[6] = (b[6]! & 0x0f) | 0x70; // version 7
  b[8] = (b[8]! & 0x3f) | 0x80; // variant
  const h = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Pre-generate stable IDs for the mock session
const ids = {
  limit1: uuidv7(),
  limit2: uuidv7(),
  limitItem1: uuidv7(),
  limitItem2: uuidv7(),
  limitItem3: uuidv7(),
  testCase1: uuidv7(),
  testCase2: uuidv7(),
  logicNode1: uuidv7(),
};

// --- Mock data ---

const mockLimits: EvalLimitDetail[] = [
  {
    id: ids.limit1,
    name: "Scratch area limit",
    targetLabel: {
      id: 1,
      name: "Scratch",
      color: "#FF0000",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    targetParentLabel: null,
    createdAt: now,
    updatedAt: now,
    limitItems: [
      {
        id: ids.limitItem1,
        limitFrom: 0,
        limitTo: 5,
        parameter: EvalLimitItemParameterEnum.AREA,
        operator: EvalLimitItemOperatorEnum.AND,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
  {
    id: ids.limit2,
    name: "Dent count limit",
    targetLabel: {
      id: 2,
      name: "Dent",
      color: "#00FF00",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    targetParentLabel: null,
    createdAt: now,
    updatedAt: now,
    limitItems: [
      {
        id: ids.limitItem2,
        limitFrom: null,
        limitTo: 3,
        parameter: EvalLimitItemParameterEnum.COUNT,
        operator: EvalLimitItemOperatorEnum.AND,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.limitItem3,
        limitFrom: 0,
        limitTo: 10,
        parameter: EvalLimitItemParameterEnum.AREA,
        operator: EvalLimitItemOperatorEnum.AND,
        createdAt: now,
        updatedAt: now,
      },
    ],
  },
];

const mockTestCases: EvalTestCaseDetail[] = [
  {
    id: ids.testCase1,
    name: "Surface defect check",
    type: EvalTestCaseTypeEnum.DEFECT,
    severity: EvalTestCaseSeverityEnum.ALERT,
    limits: mockLimits.map(({ limitItems: _, ...limit }) => limit),
    logicNodes: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: ids.testCase2,
    name: "Assembly presence check",
    type: EvalTestCaseTypeEnum.CHECK,
    severity: EvalTestCaseSeverityEnum.WARNING,
    limits: [mockLimits[0]!].map(({ limitItems: _, ...limit }) => limit),
    logicNodes: [],
    createdAt: now,
    updatedAt: now,
  },
];

export const evaluationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Eval Limits
    getEvalLimits: builder.query<EvalLimitDetail[], { projectId: number }>({
      queryFn: async () => {
        await mockDelay();
        return { data: mockLimits };
      },
      providesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
      ],
    }),

    getEvalLimit: builder.query<
      EvalLimitDetail,
      { projectId: number; limitId: string }
    >({
      queryFn: async ({ limitId }) => {
        await mockDelay();
        const limit = mockLimits.find((l) => l.id === limitId);
        if (!limit) {
          return { error: { status: 404, data: "Limit not found" } };
        }
        return { data: limit };
      },
      providesTags: (_result, _error, { limitId }) => [
        { type: apiCacheTags.eval.limits, id: limitId },
      ],
    }),

    // Eval Test Cases
    getEvalTestCases: builder.query<
      EvalTestCaseDetail[],
      { projectId: number }
    >({
      queryFn: async () => {
        await mockDelay();
        return { data: mockTestCases };
      },
      providesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.testCases, id: projectId },
      ],
    }),

    getEvalTestCase: builder.query<
      EvalTestCaseDetail,
      { projectId: number; testCaseId: string }
    >({
      queryFn: async ({ testCaseId }) => {
        await mockDelay();
        const testCase = mockTestCases.find((tc) => tc.id === testCaseId);
        if (!testCase) {
          return { error: { status: 404, data: "Test case not found" } };
        }
        return { data: testCase };
      },
      providesTags: (_result, _error, { testCaseId }) => [
        { type: apiCacheTags.eval.testCases, id: testCaseId },
      ],
    }),

    // Eval Test Case Mutations
    createEvalTestCase: builder.mutation<
      EvalTestCaseDetail,
      { projectId: number; body: EvalTestCaseCreateOrUpdate }
    >({
      queryFn: async ({ body }) => {
        await mockDelay();
        const newTestCase: EvalTestCaseDetail = {
          id: crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
          name: body.name,
          type: body.type,
          severity: body.severity,
          limits: [],
          logicNodes: body.logicNodes ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { data: newTestCase };
      },
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
      queryFn: async ({ testCaseId, body }) => {
        await mockDelay();
        const existing = mockTestCases.find((tc) => tc.id === testCaseId);
        if (!existing) {
          return { error: { status: 404, data: "Test case not found" } };
        }
        const updated: EvalTestCaseDetail = {
          ...existing,
          name: body.name,
          type: body.type,
          severity: body.severity,
          logicNodes: body.logicNodes ?? existing.logicNodes,
          updatedAt: new Date().toISOString(),
        };
        return { data: updated };
      },
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
      queryFn: async ({ body }) => {
        await mockDelay();
        const newLimit: EvalLimitDetail = {
          id: crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
          name: body.name,
          targetLabel: {
            id: body.targetLabelId,
            name: "Label",
            color: "#000000",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          },
          targetParentLabel: body.targetParentLabelId
            ? {
                id: body.targetParentLabelId,
                name: "Parent Label",
                color: "#000000",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
              }
            : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          limitItems: body.limitItems.map((item) => ({
            id: (item.id ??
              crypto.randomUUID()) as `${string}-${string}-${string}-${string}-${string}`,
            limitFrom: item.limitFrom,
            limitTo: item.limitTo,
            parameter: item.parameter,
            operator: item.operator,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        };
        return { data: newLimit };
      },
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
      ],
    }),

    updateEvalLimit: builder.mutation<
      EvalLimitDetail,
      { projectId: number; limitId: string; body: EvalLimitCreateOrUpdate }
    >({
      queryFn: async ({ limitId, body }) => {
        await mockDelay();
        const existing = mockLimits.find((l) => l.id === limitId);
        if (!existing) {
          return { error: { status: 404, data: "Limit not found" } };
        }
        const updated: EvalLimitDetail = {
          ...existing,
          name: body.name,
          targetLabel: {
            id: body.targetLabelId,
            name: existing.targetLabel.name,
            color: existing.targetLabel.color,
            createdAt: existing.targetLabel.createdAt,
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          },
          targetParentLabel: body.targetParentLabelId
            ? (existing.targetParentLabel ?? {
                id: body.targetParentLabelId,
                name: "Parent Label",
                color: "#000000",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deletedAt: null,
              })
            : null,
          updatedAt: new Date().toISOString(),
          limitItems: body.limitItems.map((item) => ({
            id: (item.id ??
              crypto.randomUUID()) as `${string}-${string}-${string}-${string}-${string}`,
            limitFrom: item.limitFrom,
            limitTo: item.limitTo,
            parameter: item.parameter,
            operator: item.operator,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        };
        return { data: updated };
      },
      invalidatesTags: (_result, _error, { projectId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
        { type: apiCacheTags.eval.limits, id: limitId },
      ],
    }),

    deleteEvalLimit: builder.mutation<
      void,
      { projectId: number; limitId: string }
    >({
      queryFn: async () => {
        await mockDelay();
        return { data: undefined };
      },
      invalidatesTags: (_result, _error, { projectId, limitId }) => [
        { type: apiCacheTags.eval.limits, id: projectId },
        { type: apiCacheTags.eval.limits, id: limitId },
      ],
    }),

    deleteEvalTestCase: builder.mutation<
      void,
      { projectId: number; testCaseId: string }
    >({
      queryFn: async () => {
        await mockDelay();
        return { data: undefined };
      },
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
