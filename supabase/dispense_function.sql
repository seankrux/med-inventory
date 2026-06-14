-- Run this in Supabase SQL Editor AFTER schema.sql
-- Creates the dispense_item function used by the app

CREATE OR REPLACE FUNCTION dispense_item(
  p_item_id BIGINT,
  p_quantity INTEGER,
  p_day INTEGER DEFAULT EXTRACT(DAY FROM NOW())::INT,
  p_patient_ref TEXT DEFAULT '',
  p_dispensed_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_item RECORD;
  v_dispense_id BIGINT;
BEGIN
  -- Lock the item row
  SELECT * INTO v_item FROM items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  IF v_item.remaining_inventory < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
  END IF;

  -- Insert dispense record
  INSERT INTO dispenses (item_id, quantity, day, month, year, patient_ref, dispensed_by)
  VALUES (p_item_id, p_quantity, p_day, EXTRACT(MONTH FROM NOW())::INT, EXTRACT(YEAR FROM NOW())::INT, p_patient_ref, p_dispensed_by)
  RETURNING id INTO v_dispense_id;

  -- Update item total_dispensed
  UPDATE items SET total_dispensed = total_dispensed + p_quantity WHERE id = p_item_id;

  RETURN jsonb_build_object(
    'success', true,
    'receipt', jsonb_build_object(
      'id', v_dispense_id,
      'medicine', v_item.name,
      'quantityDispensed', p_quantity,
      'patientRef', p_patient_ref,
      'remainingInventory', v_item.remaining_inventory - p_quantity,
      'date', NOW()
    )
  );
END;
$$;
