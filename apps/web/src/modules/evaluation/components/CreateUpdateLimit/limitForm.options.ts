import {
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
} from "@repo/schema";
import { formOptions, revalidateLogic } from "@tanstack/react-form";
import {
  createLimitFormSchema,
  CreateLimitFormSchema,
  LimitItemFormSchema,
} from "../../types/createLimitForm.schema";

export const emptyLimitItem: LimitItemFormSchema = {
  id: null,
  limitFrom: null,
  limitTo: null,
  parameter: EvalLimitItemParameterEnum.AREA,
  operator: EvalLimitItemOperatorEnum.AND,
};

export const limitFormOptions = formOptions({
  defaultValues: {
    name: "",
    targetLabelId: 0,
    targetParentLabelId: null,
    limitItems: [{ ...emptyLimitItem }],
  } satisfies CreateLimitFormSchema as CreateLimitFormSchema,
  validationLogic: revalidateLogic(),
  validators: {
    onDynamic: createLimitFormSchema,
  },
});
