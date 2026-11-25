create function public.van_v2_review_external(p_token_hash text,p_facility_key text,p_response_id uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$begin
if not public.van_v2_can_manage(p_token_hash,p_facility_key) then raise exception 'unauthorized';end if;
if p_response_id is not null then
update public.van_survey_responses set survey_details=jsonb_set(survey_details,'{review_required}','false')||jsonb_build_object('reviewed_at',now()) where id=p_response_id and survey_details->>'facility_key'=p_facility_key and survey_details->>'source'='external';
end if;
return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'created_at',created_at,'review_required',survey_details->'review_required','draft',survey_details->'draft') order by created_at desc),'[]'::jsonb) from (select * from public.van_survey_responses where survey_details->>'facility_key'=p_facility_key and survey_details->>'source'='external' order by created_at desc limit 10) r);end;$$;
revoke all on function public.van_v2_review_external(text,text,uuid) from public;
grant execute on function public.van_v2_review_external(text,text,uuid) to anon,authenticated;
