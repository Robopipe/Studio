import { relationBase } from './relations'
import { relationAnnotationPart } from './annotation'
import { relationUserOrgPart } from './user-org'

export default {
  ...relationBase,
  ...relationAnnotationPart,
  ...relationUserOrgPart
}
