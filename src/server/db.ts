import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use Neon database URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? {
    rejectUnauthorized: false
  } : undefined
});

export const initDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is not set. Skipping database initialization.");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS fmeas (
        id SERIAL PRIMARY KEY,
        draw_no TEXT,
        part_name TEXT,
        customer_name TEXT,
        process_responsibility TEXT,
        key_review_date TEXT,
        fmea_no TEXT,
        date TEXT,
        rev_no TEXT,
        rev_date TEXT,
        prepared_by TEXT,
        reviewed_by TEXT,
        approved_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fmea_items (
        id SERIAL PRIMARY KEY,
        fmea_id INTEGER REFERENCES fmeas(id) ON DELETE CASCADE,
        process_step TEXT,
        function TEXT,
        char_id TEXT,
        product TEXT,
        product_parameter TEXT,
        product_spec TEXT,
        product_symbol TEXT,
        product_datum TEXT,
        process TEXT,
        process_parameter TEXT,
        process_spec TEXT,
        process_symbol TEXT,
        process_datum TEXT,
        potential_failure_mode TEXT,
        potential_effects TEXT,
        severity INTEGER,
        class TEXT,
        potential_causes TEXT,
        occurrence INTEGER,
        current_prevention TEXT,
        current_detection TEXT,
        detection INTEGER,
        rpn INTEGER,
        recommended_action TEXT,
        responsibility TEXT,
        target_date TEXT,
        action_taken TEXT,
        effective_date TEXT,
        res_severity INTEGER,
        res_occurrence INTEGER,
        res_detection INTEGER,
        res_rpn INTEGER
      );

      CREATE TABLE IF NOT EXISTS fmea_library (
        id SERIAL PRIMARY KEY,
        process_step TEXT,
        function TEXT,
        product TEXT,
        product_parameter TEXT,
        product_spec TEXT,
        product_symbol TEXT,
        product_datum TEXT,
        process TEXT,
        process_parameter TEXT,
        process_spec TEXT,
        process_symbol TEXT,
        process_datum TEXT,
        potential_failure_mode TEXT,
        potential_effects TEXT,
        severity INTEGER,
        class TEXT,
        potential_causes TEXT,
        occurrence INTEGER,
        current_prevention TEXT,
        current_detection TEXT,
        detection INTEGER,
        recommended_action TEXT,
        UNIQUE(process_step, function, product, potential_failure_mode)
      );

      -- Add columns if they don't exist (for existing databases)
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS process_parameter TEXT;
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS process_spec TEXT;
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS process_symbol TEXT;
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS process_datum TEXT;
      
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS product_parameter TEXT;
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS product_spec TEXT;
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS product_symbol TEXT;
      ALTER TABLE fmea_items ADD COLUMN IF NOT EXISTS product_datum TEXT;
      
      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS process_parameter TEXT;
      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS process_spec TEXT;
      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS process_symbol TEXT;
      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS process_datum TEXT;

      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS product_parameter TEXT;
      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS product_spec TEXT;
      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS product_symbol TEXT;
      ALTER TABLE fmea_library ADD COLUMN IF NOT EXISTS product_datum TEXT;

      CREATE TABLE IF NOT EXISTS control_plans (
        id SERIAL PRIMARY KEY,
        draw_no TEXT,
        part_name TEXT,
        customer_name TEXT,
        process_responsibility TEXT,
        key_review_date TEXT,
        cp_no TEXT,
        date TEXT,
        rev_no TEXT,
        rev_date TEXT,
        prepared_by TEXT,
        reviewed_by TEXT,
        approved_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS control_plan_items (
        id SERIAL PRIMARY KEY,
        cp_id INTEGER REFERENCES control_plans(id) ON DELETE CASCADE,
        process_no TEXT,
        process_name TEXT,
        machine_name TEXT,
        tool_fixture TEXT,
        serial_no INTEGER,
        balloon_no TEXT,
        product_char TEXT,
        process_char TEXT,
        spec TEXT,
        tolerance_type TEXT,
        tolerance_value TEXT,
        upper_limit TEXT,
        lower_limit TEXT,
        eval_method TEXT,
        sample_size TEXT,
        sample_freq TEXT,
        control_method TEXT,
        responsibility TEXT,
        reaction_plan TEXT
      );

      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        fmea_id INTEGER REFERENCES fmeas(id) ON DELETE CASCADE,
        user_id TEXT,
        user_name TEXT,
        text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        fmea_item_id INTEGER REFERENCES fmea_items(id) ON DELETE CASCADE,
        user_id TEXT,
        user_name TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Data
    const seedData = [
      {
        process_step: "10-Raw Material Receipt",
        function: "Verification of Quanity & Part as per PO",
        product: "Free from Damages",
        process: "Raw Material damages during transit",
        potential_failure_mode: "Unwash during machining operation at damaged areas",
        potential_effects: "Improper Loading during transit",
        severity: 2,
        class: "",
        potential_causes: "No Control",
        occurrence: 6,
        current_prevention: "Inward Inspection",
        current_detection: "Inward Inspection",
        detection: 6,
        recommended_action: ""
      },
      {
        process_step: "20-VMC operation",
        function: "Removal of Unwanted material to meet customer specific requirements as per drawing",
        product: "Total Distance 55±0.30",
        process: "Total Distance 54.70 Under Size",
        potential_failure_mode: "Mating part will enter Freely",
        potential_effects: "Inspection Skipped/ Instrument Error",
        severity: 5,
        class: "",
        potential_causes: "No Control",
        occurrence: 3,
        current_prevention: "Inprocess Inspection Report",
        current_detection: "Inprocess Inspection Report",
        detection: 4,
        recommended_action: ""
      },
      {
        process_step: "40-Powder Coating",
        function: "Masking",
        product: "Per standard 104 601",
        process: "Masking lift during curing",
        potential_failure_mode: "Powder ingress on restricted zones",
        potential_effects: "Poor surface cleaning before masking",
        severity: 7,
        class: "",
        potential_causes: "Pre-masking solvent wipe",
        occurrence: 3,
        current_prevention: "Post-cure audit vs. 104 601 Standard",
        current_detection: "Post-cure audit vs. 104 601 Standard",
        detection: 4,
        recommended_action: ""
      },
      {
        process_step: "20-VMC operation",
        function: "Removal of Unwanted material to meet customer specific requirements as per drawing",
        product: "Flatness 0.15",
        process: "Flatness 0.15 Measured out of specification",
        potential_failure_mode: "Rejection of the component",
        potential_effects: "Improper Clamping, Run out in Chuck",
        severity: 6,
        class: "",
        potential_causes: "No Control",
        occurrence: 2,
        current_prevention: "Inprocess inspection & Setting Approval",
        current_detection: "Inprocess inspection & Setting Approval",
        detection: 3,
        recommended_action: ""
      },
      {
        process_step: "50-Deburring",
        function: "To Remove Sharp Corners",
        product: "Free from Sharp Corners and Unwanted Materials",
        process: "Presence of Burr",
        potential_failure_mode: "Assembly fitment problem",
        potential_effects: "Operation Skipping",
        severity: 6,
        class: "",
        potential_causes: "Skilled Operator",
        occurrence: 2,
        current_prevention: "Final Inspection",
        current_detection: "Final Inspection",
        detection: 2,
        recommended_action: ""
      }
    ];

    for (const item of seedData) {
      await client.query(`
        INSERT INTO fmea_library (
          process_step, function, product, process, potential_failure_mode, potential_effects, severity, class, 
          potential_causes, occurrence, current_prevention, current_detection, detection, recommended_action
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (process_step, function, product, potential_failure_mode) DO NOTHING
      `, [
        item.process_step, item.function, item.product, item.process, item.potential_failure_mode, item.potential_effects,
        item.severity, item.class, item.potential_causes, item.occurrence, item.current_prevention, item.current_detection,
        item.detection, item.recommended_action
      ]);
    }
    console.log("Neon Database initialized successfully");
  } catch (err) {
    console.error("Error initializing Neon database", err);
  } finally {
    client.release();
  }
};

export default pool;
