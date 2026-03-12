import express from "express";
import pool from "./db";

const app = express();
app.use(express.json());

// Helper to check DB connection
const checkDB = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "DATABASE_URL is not configured. Please connect to Neon Database." });
  }
  next();
};

// Library Endpoints
app.get("/api/library/search", checkDB, async (req, res) => {
  const { process_step, function: func, product, process } = req.query;
  let query = "SELECT * FROM fmea_library WHERE 1=1";
  const params: any[] = [];
  let paramIndex = 1;

  if (process_step) {
    query += ` AND process_step ILIKE $${paramIndex++}`;
    params.push(`%${process_step}%`);
  }
  if (func) {
    query += ` AND function ILIKE $${paramIndex++}`;
    params.push(`%${func}%`);
  }
  if (product) {
    query += ` AND product ILIKE $${paramIndex++}`;
    params.push(`%${product}%`);
  }
  if (process) {
    query += ` AND process ILIKE $${paramIndex++}`;
    params.push(`%${process}%`);
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/library", checkDB, async (req, res) => {
  const { process_step, function: func, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, class: cls, potential_causes, occurrence, current_prevention, current_detection, detection, recommended_action } = req.body;
  
  try {
    await pool.query(`
      INSERT INTO fmea_library (
        process_step, function, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, class, 
        potential_causes, occurrence, current_prevention, current_detection, detection, recommended_action
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (process_step, function, product, potential_failure_mode) 
      DO UPDATE SET 
        product_parameter = EXCLUDED.product_parameter,
        product_spec = EXCLUDED.product_spec,
        product_symbol = EXCLUDED.product_symbol,
        product_datum = EXCLUDED.product_datum,
        process = EXCLUDED.process,
        process_parameter = EXCLUDED.process_parameter,
        process_spec = EXCLUDED.process_spec,
        process_symbol = EXCLUDED.process_symbol,
        process_datum = EXCLUDED.process_datum,
        potential_effects = EXCLUDED.potential_effects,
        severity = EXCLUDED.severity,
        class = EXCLUDED.class,
        potential_causes = EXCLUDED.potential_causes,
        occurrence = EXCLUDED.occurrence,
        current_prevention = EXCLUDED.current_prevention,
        current_detection = EXCLUDED.current_detection,
        detection = EXCLUDED.detection,
        recommended_action = EXCLUDED.recommended_action
    `, [process_step, func, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, cls, potential_causes, occurrence, current_prevention, current_detection, detection, recommended_action]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// FMEA Routes
app.get("/api/fmeas", checkDB, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM fmeas ORDER BY updated_at DESC");
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/fmeas/:id", checkDB, async (req, res) => {
  try {
    const fmeaRes = await pool.query("SELECT * FROM fmeas WHERE id = $1", [req.params.id]);
    if (fmeaRes.rows.length === 0) return res.status(404).json({ error: "FMEA not found" });
    
    const itemsRes = await pool.query("SELECT * FROM fmea_items WHERE fmea_id = $1", [req.params.id]);
    res.json({ ...fmeaRes.rows[0], items: itemsRes.rows });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/fmeas", checkDB, async (req, res) => {
  const { draw_no, part_name, customer_name, process_responsibility, key_review_date, fmea_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO fmeas (draw_no, part_name, customer_name, process_responsibility, key_review_date, fmea_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [draw_no, part_name, customer_name, process_responsibility, key_review_date, fmea_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by]);
    
    res.json({ id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/fmeas/:id", checkDB, async (req, res) => {
  const { draw_no, part_name, customer_name, process_responsibility, key_review_date, fmea_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by } = req.body;
  
  try {
    await pool.query(`
      UPDATE fmeas SET 
        draw_no = $1, part_name = $2, customer_name = $3, process_responsibility = $4, 
        key_review_date = $5, fmea_no = $6, date = $7, rev_no = $8, rev_date = $9, 
        prepared_by = $10, reviewed_by = $11, approved_by = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
    `, [draw_no, part_name, customer_name, process_responsibility, key_review_date, fmea_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by, req.params.id]);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/fmeas/:id", checkDB, async (req, res) => {
  try {
    await pool.query("DELETE FROM fmeas WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/fmeas/:id/items", checkDB, async (req, res) => {
  const { process_step, function: func, char_id, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, class: cls, potential_causes, occurrence, current_prevention, current_detection, detection, rpn, recommended_action, responsibility, target_date, action_taken, effective_date, res_severity, res_occurrence, res_detection, res_rpn } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO fmea_items (
        fmea_id, process_step, function, char_id, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, class, 
        potential_causes, occurrence, current_prevention, current_detection, detection, rpn, 
        recommended_action, responsibility, target_date, action_taken, effective_date, 
        res_severity, res_occurrence, res_detection, res_rpn
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
      RETURNING id
    `, [
      req.params.id, process_step, func, char_id, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, cls, 
      potential_causes, occurrence, current_prevention, current_detection, detection, rpn, 
      recommended_action, responsibility, target_date, action_taken, effective_date, 
      res_severity, res_occurrence, res_detection, res_rpn
    ]);
    
    res.json({ id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/fmea-items/:id", checkDB, async (req, res) => {
  const { process_step, function: func, char_id, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, class: cls, potential_causes, occurrence, current_prevention, current_detection, detection, rpn, recommended_action, responsibility, target_date, action_taken, effective_date, res_severity, res_occurrence, res_detection, res_rpn } = req.body;
  
  try {
    await pool.query(`
      UPDATE fmea_items SET 
        process_step = $1, function = $2, char_id = $3, product = $4, product_parameter = $5, product_spec = $6, product_symbol = $7, product_datum = $8, process = $9, process_parameter = $10, process_spec = $11, process_symbol = $12, process_datum = $13, potential_failure_mode = $14, potential_effects = $15, severity = $16, class = $17, 
        potential_causes = $18, occurrence = $19, current_prevention = $20, current_detection = $21, detection = $22, rpn = $23, 
        recommended_action = $24, responsibility = $25, target_date = $26, action_taken = $27, effective_date = $28, 
        res_severity = $29, res_occurrence = $30, res_detection = $31, res_rpn = $32
      WHERE id = $33
    `, [
      process_step, func, char_id, product, product_parameter, product_spec, product_symbol, product_datum, process, process_parameter, process_spec, process_symbol, process_datum, potential_failure_mode, potential_effects, severity, cls, 
      potential_causes, occurrence, current_prevention, current_detection, detection, rpn, 
      recommended_action, responsibility, target_date, action_taken, effective_date, 
      res_severity, res_occurrence, res_detection, res_rpn,
      req.params.id
    ]);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/fmea-items/:id", checkDB, async (req, res) => {
  try {
    await pool.query("DELETE FROM fmea_items WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Control Plan Endpoints
app.get("/api/control-plans", checkDB, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM control_plans ORDER BY updated_at DESC");
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/control-plans/:id", checkDB, async (req, res) => {
  try {
    const planRes = await pool.query("SELECT * FROM control_plans WHERE id = $1", [req.params.id]);
    if (planRes.rows.length === 0) return res.status(404).json({ error: "Control Plan not found" });
    
    const itemsRes = await pool.query("SELECT * FROM control_plan_items WHERE cp_id = $1", [req.params.id]);
    res.json({ ...planRes.rows[0], items: itemsRes.rows });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/control-plans", checkDB, async (req, res) => {
  const { draw_no, part_name, customer_name, process_responsibility, key_review_date, cp_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO control_plans (draw_no, part_name, customer_name, process_responsibility, key_review_date, cp_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [draw_no, part_name, customer_name, process_responsibility, key_review_date, cp_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by]);
    
    res.json({ id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/control-plans/:id", checkDB, async (req, res) => {
  const { draw_no, part_name, customer_name, process_responsibility, key_review_date, cp_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by } = req.body;
  
  try {
    await pool.query(`
      UPDATE control_plans SET 
        draw_no = $1, part_name = $2, customer_name = $3, process_responsibility = $4, 
        key_review_date = $5, cp_no = $6, date = $7, rev_no = $8, rev_date = $9, 
        prepared_by = $10, reviewed_by = $11, approved_by = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
    `, [draw_no, part_name, customer_name, process_responsibility, key_review_date, cp_no, date, rev_no, rev_date, prepared_by, reviewed_by, approved_by, req.params.id]);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/control-plans/:id", checkDB, async (req, res) => {
  try {
    await pool.query("DELETE FROM control_plans WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/control-plans/:id/items", checkDB, async (req, res) => {
  const { process_no, process_name, machine_name, tool_fixture, serial_no, balloon_no, product_char, process_char, spec, tolerance_type, tolerance_value, upper_limit, lower_limit, eval_method, sample_size, sample_freq, control_method, responsibility, reaction_plan } = req.body;
  
  try {
    const result = await pool.query(`
      INSERT INTO control_plan_items (
        cp_id, process_no, process_name, machine_name, tool_fixture, serial_no, balloon_no, product_char, process_char, spec, tolerance_type, tolerance_value, upper_limit, lower_limit, eval_method, sample_size, sample_freq, control_method, responsibility, reaction_plan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id
    `, [
      req.params.id, process_no, process_name, machine_name, tool_fixture, serial_no, balloon_no, product_char, process_char, spec, tolerance_type, tolerance_value, upper_limit, lower_limit, eval_method, sample_size, sample_freq, control_method, responsibility, reaction_plan
    ]);
    
    res.json({ id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/control-plan-items/:id", checkDB, async (req, res) => {
  const { process_no, process_name, machine_name, tool_fixture, serial_no, balloon_no, product_char, process_char, spec, tolerance_type, tolerance_value, upper_limit, lower_limit, eval_method, sample_size, sample_freq, control_method, responsibility, reaction_plan } = req.body;
  
  try {
    await pool.query(`
      UPDATE control_plan_items SET 
        process_no = $1, process_name = $2, machine_name = $3, tool_fixture = $4, serial_no = $5, balloon_no = $6, product_char = $7, process_char = $8, spec = $9, tolerance_type = $10, tolerance_value = $11, upper_limit = $12, lower_limit = $13, eval_method = $14, sample_size = $15, sample_freq = $16, control_method = $17, responsibility = $18, reaction_plan = $19
      WHERE id = $20
    `, [
      process_no, process_name, machine_name, tool_fixture, serial_no, balloon_no, product_char, process_char, spec, tolerance_type, tolerance_value, upper_limit, lower_limit, eval_method, sample_size, sample_freq, control_method, responsibility, reaction_plan,
      req.params.id
    ]);
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/control-plan-items/:id", checkDB, async (req, res) => {
  try {
    await pool.query("DELETE FROM control_plan_items WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default app;
