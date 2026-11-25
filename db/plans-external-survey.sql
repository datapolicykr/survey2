create table public.van_v2_plan_history(id bigint generated always as identity primary key,facility_key text not null,changed_at timestamptz not null default now(),actor text not null,reason text not null,before_data jsonb not null,after_data jsonb not null);
alter table public.van_v2_plan_history enable row level security;
create table public.van_v2_staff_accounts(login text primary key,rep_name text not null,department text not null,password_hash text not null,enabled boolean not null default true);
alter table public.van_v2_staff_accounts enable row level security;
create table public.van_v2_staff_sessions(token_hash text primary key,login text references public.van_v2_staff_accounts(login),expires_at timestamptz not null);
alter table public.van_v2_staff_sessions enable row level security;
create table public.van_v2_invitations(token text primary key,facility_key text not null references public.van_dental_clinics(facility_key),expires_at timestamptz not null default now()+interval '30 days',submitted_at timestamptz);
alter table public.van_v2_invitations enable row level security;
create function public.van_v2_can_manage(p_hash text,p_key text) returns boolean language sql security definer set search_path='' as $$
select public.van_v2_admin_valid(p_hash) or exists(select 1 from public.van_v2_staff_sessions s join public.van_v2_staff_accounts a using(login) join public.van_dental_clinics c on c.assigned_rep_name=a.rep_name and c.assigned_rep_department=a.department where s.token_hash=p_hash and s.expires_at>now() and a.enabled and c.facility_key=p_key);$$;
create function public.van_v2_staff_account(p_token_hash text,p_login text,p_rep text,p_department text,p_password text) returns boolean language plpgsql security definer set search_path='' as $$begin
if not public.van_v2_admin_valid(p_token_hash) then raise exception 'unauthorized';end if;
if length(p_password)<10 or length(p_login)<3 or not exists(select 1 from public.van_dental_clinics where assigned_rep_name=p_rep and assigned_rep_department=p_department) then raise exception 'invalid account';end if;
insert into public.van_v2_staff_accounts values(p_login,p_rep,p_department,extensions.crypt(p_password,extensions.gen_salt('bf')),true) on conflict(login) do update set rep_name=excluded.rep_name,department=excluded.department,password_hash=excluded.password_hash,enabled=true;
delete from public.van_v2_staff_sessions where login=p_login;return true;end;$$;
create function public.van_v2_staff_login(p_id text,p_pw text,p_token_hash text) returns boolean language plpgsql security definer set search_path='' as $$begin
if not exists(select 1 from public.van_v2_staff_accounts where login=p_id and enabled and password_hash=extensions.crypt(p_pw,password_hash)) then return false;end if;
insert into public.van_v2_staff_sessions values(p_token_hash,p_id,now()+interval '12 hours');return true;end;$$;
create function public.van_v2_save_plan(p_token_hash text,p_facility_key text,p_patch jsonb,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$declare before_row jsonb;after_row jsonb;admin_hash text;begin
if not public.van_v2_can_manage(p_token_hash,p_facility_key) then raise exception 'unauthorized';end if;
if length(trim(p_reason))<1 or length(p_reason)>300 or jsonb_typeof(p_patch)<>'object' then raise exception 'reason required';end if;
if exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('survey_plan_1','survey_plan_2','survey_plan_3','survey_completed','survey_date','promotion_plan_1','promotion_plan_2','promotion_plan_3','promotion_completed','promotion_completed_date','membership_completed','membership_completed_date','van_contract_end_date')) then raise exception 'invalid fields';end if;
select to_jsonb(c) into before_row from public.van_dental_clinics c where facility_key=p_facility_key for update;
update public.van_dental_clinics set
    assigned_rep_name=coalesce(p_patch->>'sales_rep',assigned_rep_name),
    assigned_rep_department=coalesce(p_patch->>'department',assigned_rep_department),
    survey_planned_date=case when p_patch ? 'survey_plan_1' then nullif(p_patch->>'survey_plan_1','')::date else survey_planned_date end,
    survey_plan_2=case when p_patch ? 'survey_plan_2' then nullif(p_patch->>'survey_plan_2','')::date else survey_plan_2 end,
    survey_plan_3=case when p_patch ? 'survey_plan_3' then nullif(p_patch->>'survey_plan_3','')::date else survey_plan_3 end,
    survey_completed=case when p_patch ? 'survey_completed' then coalesce((p_patch->>'survey_completed')::boolean,false) else survey_completed end,
    survey_date=case when p_patch ? 'survey_date' then nullif(p_patch->>'survey_date','')::date else survey_date end,
    promotion_plan_1=case when p_patch ? 'promotion_plan_1' then nullif(p_patch->>'promotion_plan_1','')::date else promotion_plan_1 end,
    promotion_plan_2=case when p_patch ? 'promotion_plan_2' then nullif(p_patch->>'promotion_plan_2','')::date else promotion_plan_2 end,
    promotion_plan_3=case when p_patch ? 'promotion_plan_3' then nullif(p_patch->>'promotion_plan_3','')::date else promotion_plan_3 end,
    promotion_completed=case when p_patch ? 'promotion_completed' then coalesce((p_patch->>'promotion_completed')::boolean,false) else promotion_completed end,
    promotion_completed_date=case when p_patch ? 'promotion_completed_date' then nullif(p_patch->>'promotion_completed_date','')::date else promotion_completed_date end,
    membership_completed=case when p_patch ? 'membership_completed' then coalesce((p_patch->>'membership_completed')::boolean,false) else membership_completed end,
    membership_completed_date=case when p_patch ? 'membership_completed_date' then nullif(p_patch->>'membership_completed_date','')::date else membership_completed_date end,
    van_contract_end_date=case when p_patch ? 'van_contract_end_date' then nullif(p_patch->>'van_contract_end_date','')::date else van_contract_end_date end
  where facility_key=p_facility_key
  returning to_jsonb(van_dental_clinics.*) into after_row;
insert into public.van_v2_plan_history(facility_key,actor,reason,before_data,after_data) values(p_facility_key,coalesce((select login from public.van_v2_staff_sessions where token_hash=p_token_hash),'admin'),p_reason,before_row,after_row);
return jsonb_build_object('ok',true);end;$$;
create function public.van_v2_create_invitation(p_token_hash text,p_facility_key text,p_invitation text) returns boolean language plpgsql security definer set search_path='' as $$begin
if not public.van_v2_can_manage(p_token_hash,p_facility_key) then raise exception 'unauthorized';end if;
if p_invitation !~ '^[a-f0-9]{64}$' then raise exception 'invalid token';end if;
insert into public.van_v2_invitations(token,facility_key) values(p_invitation,p_facility_key);return true;end;$$;
create function public.van_v2_read_invitation(p_token text) returns jsonb language sql security definer set search_path='' as $$
select jsonb_build_object('clinic',c.facility_name,'region',replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(c.province,'특별자치도',''),'특별자치시',''),'특별시',''),'광역시',''),'도',''),'충청북','충북'),'충청남','충남'),'전라북','전북'),'전라남','전남'),'경상북','경북'),'경상남','경남'),'district',c.district,'sales',c.assigned_rep_name) from public.van_v2_invitations i join public.van_dental_clinics c using(facility_key) where token=p_token and expires_at>now() and submitted_at is null;$$;
create function public.van_v2_external_submit(p_token text,p_row jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare inv public.van_v2_invitations;clinic public.van_dental_clinics;new_id uuid;begin
select * into inv from public.van_v2_invitations where token=p_token and expires_at>now() and submitted_at is null for update;
if not found then raise exception 'invalid invitation';end if;
if octet_length(p_row::text)>32768 then raise exception 'too large';end if;
select * into clinic from public.van_dental_clinics where facility_key=inv.facility_key for update;
insert into public.van_survey_responses(dentist_name,region,district,sales_rep,van_company,devices,current_pms,current_van_dealer,contract_type,terminal_use_period,contract_end_date,monthly_cost,management_fee,link_fee,inconveniences,improvement_items,field_memo,survey_details)
values(clinic.facility_name,clinic.province,clinic.district,clinic.assigned_rep_name,left(coalesce(p_row->>'van_company',''),80),p_row->'devices',left(coalesce(p_row->>'current_pms',''),80),left(coalesce(p_row->>'current_van_dealer',''),80),left(coalesce(p_row->>'contract_type',''),40),left(coalesce(p_row->>'terminal_use_period',''),40),left(coalesce(p_row->>'contract_end_date',''),7),left(coalesce(p_row->>'monthly_cost',''),30),left(coalesce(p_row->>'management_fee',''),30),left(coalesce(p_row->>'link_fee',''),30),coalesce(p_row->'inconveniences','[]'::jsonb),coalesce(p_row->'improvement_items','[]'::jsonb),left(coalesce(p_row->>'field_memo',''),200),(p_row->'survey_details')||jsonb_build_object('facility_key',clinic.facility_key,'source','external','review_required',coalesce(clinic.survey_completed,false))) returning id into new_id;
update public.van_dental_clinics set survey_completed=true,survey_date=coalesce(survey_date,(now() at time zone 'Asia/Seoul')::date) where facility_key=clinic.facility_key;
update public.van_v2_invitations set submitted_at=now() where token=p_token;
return jsonb_build_object('ok',true);end;$$;

revoke all on function public.van_v2_can_manage(text,text) from public;
grant execute on function public.van_v2_can_manage(text,text) to anon,authenticated;
revoke all on function public.van_v2_staff_account(text,text,text,text,text) from public;
grant execute on function public.van_v2_staff_account(text,text,text,text,text) to anon,authenticated;
revoke all on function public.van_v2_staff_login(text,text,text) from public;
grant execute on function public.van_v2_staff_login(text,text,text) to anon,authenticated;
revoke all on function public.van_v2_save_plan(text,text,jsonb,text) from public;
grant execute on function public.van_v2_save_plan(text,text,jsonb,text) to anon,authenticated;
revoke all on function public.van_v2_create_invitation(text,text,text) from public;
grant execute on function public.van_v2_create_invitation(text,text,text) to anon,authenticated;
revoke all on function public.van_v2_read_invitation(text) from public;
grant execute on function public.van_v2_read_invitation(text) to anon,authenticated;
revoke all on function public.van_v2_external_submit(text,jsonb) from public;
grant execute on function public.van_v2_external_submit(text,jsonb) to anon,authenticated;
