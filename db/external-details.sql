CREATE OR REPLACE FUNCTION public.van_v2_latest_survey_details(p_facility_keys jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with wanted as (
    select value::text as facility_key
    from jsonb_array_elements_text(coalesce(p_facility_keys,'[]'::jsonb))
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'facility_key',c.facility_key,
    'survey_created_at',s.created_at,
    'van_company',s.van_company,
    'current_van_dealer',s.current_van_dealer,
    'current_pms',s.current_pms,
    'terminal_use_period',s.terminal_use_period,
    'contract_type',s.contract_type,
    'contract_end_date',s.contract_end_date,
    'monthly_cost',s.monthly_cost,
    'management_fee',s.management_fee,
    'link_fee',s.link_fee,
    'devices',s.devices,
    'inconveniences',s.inconveniences,
    'improvement_items',s.improvement_items,
    'contract_terms',s.contract_terms,
    'field_memo',s.field_memo
  )),'[]'::jsonb)
  from public.van_dental_clinics c
  join wanted w on w.facility_key=c.facility_key
  left join lateral (
    select r.*
    from public.van_survey_responses r
    where ((r.survey_details->>'facility_key'=c.facility_key) or (r.survey_details->>'facility_key' is null and r.dentist_name=c.facility_name and (r.district=c.district or nullif(r.district,'') is null))) and coalesce(r.survey_details->>'review_required','false')<>'true'
    order by r.created_at desc
    limit 1
  ) s on true;
$function$

