create function public.van_v2_management_clinics_page(p_offset integer default 0, p_limit integer default 1000)
returns jsonb language sql stable security definer set search_path = ''
as $function$
select coalesce(jsonb_agg(jsonb_build_object(
'facility_key',c.facility_key,'facility_name',c.facility_name,
'region',c.province,'district',c.district,'address',c.address,'phone',c.phone,
'sales_rep',c.assigned_rep_name,'department',c.assigned_rep_department,
'survey_plan_1',c.survey_planned_date,'survey_plan_2',c.survey_plan_2,'survey_plan_3',c.survey_plan_3,
'survey_completed',c.survey_completed,'survey_date',c.survey_date,
'promotion_plan_1',c.promotion_plan_1,'promotion_plan_2',c.promotion_plan_2,'promotion_plan_3',c.promotion_plan_3,
'promotion_completed',c.promotion_completed,'promotion_completed_date',c.promotion_completed_date,
'membership_completed',c.membership_completed,'membership_completed_date',c.membership_completed_date,
'van_contract_end_date',c.van_contract_end_date,'trade_status',c.trade_status,'promotion_count',c.promotion_count
) order by c.assigned_rep_department,c.assigned_rep_name,c.facility_name,c.facility_key),'[]'::jsonb)
from (
 select * from public.van_dental_clinics
 order by assigned_rep_department,assigned_rep_name,facility_name,facility_key
 offset greatest(0,least(coalesce(p_offset,0),1000000))
 limit greatest(1,least(coalesce(p_limit,1000),1000))
) c;
$function$;
revoke all on function public.van_v2_management_clinics_page(integer,integer) from public;
grant execute on function public.van_v2_management_clinics_page(integer,integer) to anon,authenticated,service_role;
comment on function public.van_v2_management_clinics_page(integer,integer) is 'V2 bounded read-only pages of the same fields already exposed by van_v2_management_clinics. No table or data changes.';
