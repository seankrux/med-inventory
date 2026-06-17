-- Med Inventory — atomic stock operations
-- Run AFTER schema.sql in Supabase SQL Editor
--
-- Why this exists:
--   The previous client-side read-then-update pattern (SELECT stock_received,
--   then UPDATE stock_received = stock_received + qty) has a race condition:
--   two concurrent receives can both read the same value and both write the
--   same incremented value, silently dropping stock.
--
--   These SECURITY DEFINER functions take a row-level lock with FOR UPDATE
--   and apply the increment atomically.

-- Atomic stock receipt ------------------------------------------------------

CREATE OR REPLACE FUNCTION receive_stock(
  p_item_id BIGINT,
  p_quantity INTEGER,
  p_source TEXT DEFAULT 'Unknown',
  p_received_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item RECORD;
  v_receipt_id BIGINT;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be positive');
  END IF;

  -- Lock the item row so concurrent receives serialize
  SELECT * INTO v_item FROM items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  INSERT INTO stock_receipts (item_id, quantity, source, received_by)
  VALUES (p_item_id, p_quantity, p_source, p_received_by)
  RETURNING id INTO v_receipt_id;

  UPDATE items
     SET stock_received = stock_received + p_quantity
   WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'receipt', jsonb_build_object(
      'id', v_receipt_id,
      'item_id', p_item_id,
      'item_name', v_item.name,
      'quantity', p_quantity,
      'source', p_source,
      'new_stock_received', v_item.stock_received + p_quantity,
      'new_remaining', v_item.remaining_inventory + p_quantity,
      'date', NOW()
    )
  );
END;
$$;

-- Strengthen dispense_item: also lock the row before reading
-- (it already does — kept for explicitness, no behavior change)

-- A single aggregate for dashboard month stats ------------------------------
-- The old Dashboard page computed monthly stats in JS over a 200-row window,
-- which silently dropped stats beyond the limit. Move the math into SQL.
CREATE OR REPLACE FUNCTION dashboard_monthly_stats(
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INT
) RETURNS JSONB
LANGUAGE sql SECURITY INVOKER STABLE AS $$
  SELECT jsonb_build_object(
    'total_items',         (SELECT COUNT(*) FROM items),
    'total_categories',    (SELECT COUNT(*) FROM categories),
    'low_stock',           (SELECT COUNT(*) FROM items
                              WHERE reorder_level > 0
                                AND remaining_inventory > 0
                                AND remaining_inventory <= reorder_level
                                AND remaining_inventory >  reorder_level / 2.0),
    'critical_stock',      (SELECT COUNT(*) FROM items
                              WHERE remaining_inventory <= 0
                                 OR (reorder_level > 0
                                     AND remaining_inventory <= reorder_level / 2.0)),
    'total_dispensed_month',(SELECT COALESCE(SUM(quantity), 0)
                               FROM dispenses
                               WHERE year = p_year
                                 AND month = EXTRACT(MONTH FROM NOW())::INT),
    'year',                p_year
  );
$$;

GRANT EXECUTE ON FUNCTION receive_stock(BIGINT, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dashboard_monthly_stats(INTEGER) TO authenticated;
