-- Name-based logins. Existing account table stores only bcrypt password hashes.
insert into public.van_v2_staff_accounts(login,rep_name,department,password_hash,enabled)
select case when count(*) over(partition by name)=1 then name else name||'::'||department end,name,department,extensions.crypt('1234',extensions.gen_salt('bf')),true
from (select distinct trim(name) name,coalesce(department,'') department from public.van_sales_reps where nullif(trim(name),'') is not null) r
on conflict(login) do update set rep_name=excluded.rep_name,department=excluded.department,password_hash=excluded.password_hash,enabled=true;
insert into public.van_v2_staff_accounts(login,rep_name,department,password_hash,enabled)
select distinct c.assigned_rep_name||'::'||coalesce(c.assigned_rep_department,''),c.assigned_rep_name,coalesce(c.assigned_rep_department,''),extensions.crypt('1234',extensions.gen_salt('bf')),true from public.van_dental_clinics c
where nullif(trim(c.assigned_rep_name),'') is not null and not exists(select 1 from public.van_v2_staff_accounts a where a.rep_name=c.assigned_rep_name and a.department=coalesce(c.assigned_rep_department,''))
on conflict(login) do nothing;
insert into public.van_admin_users_v2(id,password_hash,active) values('admin',encode(extensions.digest('1234','sha256'),'hex'),true) on conflict(id) do update set password_hash=excluded.password_hash,active=true;
create or replace function public.van_v2_staff_login_named(p_id text,p_pw text,p_token_hash text,p_department text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare matches integer;account_login text;departments jsonb;begin
select count(distinct department),jsonb_agg(distinct department order by department) into matches,departments from public.van_v2_staff_accounts where rep_name=trim(p_id) and enabled and password_hash=extensions.crypt(p_pw,password_hash);
if matches=0 then return jsonb_build_object('ok',false);end if;
if matches>1 and nullif(p_department,'') is null then return jsonb_build_object('departments',departments);end if;
select login into account_login from public.van_v2_staff_accounts where rep_name=trim(p_id) and enabled and password_hash=extensions.crypt(p_pw,password_hash) and (matches=1 or department=p_department) order by login limit 1;
if account_login is null then return jsonb_build_object('ok',false);end if;
delete from public.van_v2_staff_sessions where expires_at<now();
insert into public.van_v2_staff_sessions(token_hash,login,expires_at) values(p_token_hash,account_login,now()+interval '12 hours');
return jsonb_build_object('ok',true);end;$$;
revoke all on function public.van_v2_staff_login_named(text,text,text,text) from public;
grant execute on function public.van_v2_staff_login_named(text,text,text,text) to anon,authenticated;
CREATE OR REPLACE FUNCTION public.van_v2_staff_account(p_token_hash text, p_login text, p_rep text, p_department text, p_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$begin
if not public.van_v2_admin_valid(p_token_hash) then raise exception 'unauthorized';end if;
if length(p_password)<4 or length(p_login)<2 or not exists(select 1 from public.van_dental_clinics where assigned_rep_name=p_rep and assigned_rep_department=p_department) then raise exception 'invalid account';end if;
insert into public.van_v2_staff_accounts values(p_login,p_rep,p_department,extensions.crypt(p_password,extensions.gen_salt('bf')),true) on conflict(login) do update set rep_name=excluded.rep_name,department=excluded.department,password_hash=excluded.password_hash,enabled=true;
delete from public.van_v2_staff_sessions where login=p_login;return true;end;$function$

