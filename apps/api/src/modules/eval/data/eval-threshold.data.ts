import { EvalThresholdInsert } from "src/repository/types/eval";

export const defaultThresholds: EvalThresholdInsert[] = [
  {
    value: 0.9,
    name: 'Bad',
    color: '#E93A57'
  },
  {
    value: 0.95,
    name: 'Good',
    color: '#BCB212'
  },
  {
    value: 1,
    name: 'Excelent',
    color: '#43C47D'
  }
]
