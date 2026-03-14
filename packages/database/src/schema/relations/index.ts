import { relationBase } from './relations'
import { relationEvalPart } from './eval'
import { relationAnnotationPart } from './annotation'
import { relationUserOrgPart } from './user-org'

export default {
  ...relationBase,
  ...relationEvalPart,
  ...relationAnnotationPart,
  ...relationUserOrgPart
}
