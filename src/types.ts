export interface FMEA {
  id: number;
  draw_no: string;
  part_name: string;
  customer_name: string;
  process_responsibility: string;
  key_review_date: string;
  fmea_no: string;
  date: string;
  rev_no: string;
  rev_date: string;
  prepared_by: string;
  reviewed_by: string;
  approved_by: string;
  items?: FMEAItem[];
  created_at: string;
  updated_at: string;
}

export interface FMEAItem {
  id?: number;
  fmea_id?: number;
  process_step: string;
  function: string;
  char_id: string;
  product: string;
  product_parameter?: string;
  product_spec?: string;
  product_symbol?: string;
  product_datum?: string;
  product_tolerance?: string;
  product_upper?: string;
  product_lower?: string;
  product_auto_calc?: boolean;
  process: string;
  process_parameter?: string;
  process_spec?: string;
  process_symbol?: string;
  process_datum?: string;
  potential_failure_mode: string;
  potential_effects: string;
  severity: number;
  class: string;
  potential_causes: string;
  occurrence: number;
  current_prevention: string;
  current_detection: string;
  detection: number;
  rpn: number;
  recommended_action: string;
  responsibility: string;
  target_date: string;
  action_taken: string;
  effective_date: string;
  res_severity: number;
  res_occurrence: number;
  res_detection: number;
  res_rpn: number;
}

export interface ControlPlan {
  id: number;
  draw_no: string;
  part_name: string;
  customer_name: string;
  process_responsibility: string;
  key_review_date: string;
  cp_no: string;
  date: string;
  rev_no: string;
  rev_date: string;
  prepared_by: string;
  reviewed_by: string;
  approved_by: string;
  items?: ControlPlanItem[];
  created_at: string;
  updated_at: string;
}

export interface ControlPlanItem {
  id?: number;
  cp_id?: number;
  process_no: string;
  process_name: string;
  machine_name: string;
  tool_fixture: string;
  serial_no: number;
  balloon_no: string;
  product_char: string;
  process_char: string;
  spec: string;
  tolerance_type: '+' | '-' | '±' | 'GD&T';
  tolerance_value: string;
  upper_limit: string;
  lower_limit: string;
  eval_method: string;
  sample_size: string;
  sample_freq: string;
  control_method: string;
  responsibility: string;
  reaction_plan: string;
}
