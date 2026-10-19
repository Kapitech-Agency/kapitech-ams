-- 045: clean the MVP validation Insight editorial source after the UI audit.
-- Removes the redundant second commercial promo, removes duplicated Indonesian copy,
-- and aligns Indonesian reading time with the English source.
BEGIN;

UPDATE cms_insights
SET
  content = (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN language = 'id'
            AND item->>'type' = 'paragraph'
            AND item->>'text' IS NOT NULL
          THEN jsonb_set(
            item,
            '{text}',
            to_jsonb(
              replace(
                item->>'text',
                'Nielsen Norman Group menjelaskan pengujian prototype sebagai pengujian kemudahan penggunaan pada representasi produk sebelum produk nyata tersedia. Nielsen Norman Group menjelaskan pengujian prototype sebagai pengujian kemudahan penggunaan pada representasi produk sebelum produk nyata tersedia.',
                'Nielsen Norman Group menjelaskan pengujian prototype sebagai pengujian kemudahan penggunaan pada representasi produk sebelum produk nyata tersedia.'
              )
            ),
            false
          )
          ELSE item
        END
        ORDER BY ordinality
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(cms_insights.content) WITH ORDINALITY AS blocks(item, ordinality)
    WHERE NOT (
      item->>'type' = 'promo'
      AND (
        (language = 'en' AND item->>'title' = 'Choose the right validation path before you commit the budget')
        OR
        (language = 'id' AND item->>'title' = 'Tentukan jalur validasi sebelum berkomitmen pada anggaran')
      )
    )
  ),
  reading_time = CASE WHEN language = 'id' THEN 15 ELSE reading_time END,
  updated_at = NOW()
WHERE slug = 'mvp-vs-prototype-vs-proof-of-concept'
  AND language IN ('en', 'id');

COMMIT;
