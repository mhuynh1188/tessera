

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."archive_hexie_card"("card_id" "uuid", "user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE hexie_cards 
  SET 
    is_archived = TRUE,
    archived_at = NOW(),
    archived_by = user_id,
    is_active = FALSE  -- Also deactivate when archived
  WHERE id = card_id;
END;
$$;


ALTER FUNCTION "public"."archive_hexie_card"("card_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."archive_hexie_card"("card_id" "uuid", "user_id" "uuid") IS 'Soft delete a hexie card by marking it as archived';



CREATE OR REPLACE FUNCTION "public"."archive_user_simple"("target_user_id" "uuid", "archived_by_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update user
  UPDATE users 
  SET 
    is_archived = true,
    archived_at = NOW(),
    archived_by = archived_by_id
  WHERE id = target_user_id;
  
  -- Log it
  INSERT INTO audit_logs (table_name, record_id, action, performed_by, created_at) 
  VALUES ('users', target_user_id, 'ARCHIVE', archived_by_id, NOW());
END;
$$;


ALTER FUNCTION "public"."archive_user_simple"("target_user_id" "uuid", "archived_by_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_dynamic_severity"("base_severity" integer, "frequency_score" integer, "impact_score" integer, "context_factors" "jsonb") RETURNS double precision
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dynamic_severity FLOAT;
  frequency_multiplier FLOAT;
  impact_multiplier FLOAT;
BEGIN
  -- Base calculation
  frequency_multiplier := CASE frequency_score
    WHEN 1 THEN 0.5  -- Rarely
    WHEN 2 THEN 0.8  -- Sometimes  
    WHEN 3 THEN 1.0  -- Often
    WHEN 4 THEN 1.5  -- Frequently
    WHEN 5 THEN 2.0  -- Always
    ELSE 1.0
  END;
  
  impact_multiplier := CASE impact_score
    WHEN 1 THEN 0.6  -- Low impact
    WHEN 2 THEN 0.8  -- Moderate impact
    WHEN 3 THEN 1.0  -- Significant impact
    WHEN 4 THEN 1.3  -- High impact  
    WHEN 5 THEN 1.6  -- Severe impact
    ELSE 1.0
  END;
  
  dynamic_severity := base_severity * frequency_multiplier * impact_multiplier;
  
  -- Cap at 5.0 for UI consistency
  RETURN LEAST(dynamic_severity, 5.0);
END;
$$;


ALTER FUNCTION "public"."calculate_dynamic_severity"("base_severity" integer, "frequency_score" integer, "impact_score" integer, "context_factors" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_old_audit_logs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM audit_logs 
  WHERE created_at < now() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  INSERT INTO audit_logs (
    table_name, operation, new_data, user_email
  ) VALUES (
    'audit_logs', 'CLEANUP', 
    jsonb_build_object('deleted_count', deleted_count),
    'system'
  );
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."clean_old_audit_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_archived_cards"("days_old" integer DEFAULT 90) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete cards that have been archived for more than specified days
  DELETE FROM hexie_cards 
  WHERE is_archived = TRUE 
    AND archived_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_archived_cards"("days_old" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_archived_cards"("days_old" integer) IS 'Permanently delete archived cards older than specified days';



CREATE OR REPLACE FUNCTION "public"."create_intervention"("p_organization_id" "uuid", "p_title" "text", "p_description" "text", "p_target_pattern" "text", "p_category" "text", "p_stakeholder_role" "text", "p_start_date" "date", "p_target_severity_reduction" integer, "p_target_frequency_reduction" integer, "p_participants_count" integer, "p_budget_allocated" numeric, "p_created_by" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  intervention_id UUID;
BEGIN
  INSERT INTO interventions (
    organization_id,
    title,
    description,
    target_pattern,
    category,
    stakeholder_role,
    start_date,
    target_metrics,
    participants_count,
    budget_allocated,
    created_by
  ) VALUES (
    p_organization_id,
    p_title,
    p_description,
    p_target_pattern,
    p_category,
    p_stakeholder_role,
    p_start_date,
    json_build_object(
      'severity_reduction', p_target_severity_reduction,
      'frequency_reduction', p_target_frequency_reduction
    ),
    p_participants_count,
    p_budget_allocated,
    p_created_by
  ) RETURNING id INTO intervention_id;
  
  RETURN intervention_id;
END;
$$;


ALTER FUNCTION "public"."create_intervention"("p_organization_id" "uuid", "p_title" "text", "p_description" "text", "p_target_pattern" "text", "p_category" "text", "p_stakeholder_role" "text", "p_start_date" "date", "p_target_severity_reduction" integer, "p_target_frequency_reduction" integer, "p_participants_count" integer, "p_budget_allocated" numeric, "p_created_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."extend_auth_user_to_profile"("auth_user_id" "uuid", "user_email" "text", "user_subscription_tier" "text" DEFAULT 'free'::"text", "user_subscription_status" "text" DEFAULT 'active'::"text", "user_is_admin" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert into your users table using the existing auth user ID
  INSERT INTO users (
    id, 
    email, 
    subscription_tier, 
    subscription_status, 
    is_admin,
    created_at
  ) VALUES (
    auth_user_id,
    user_email,
    user_subscription_tier,
    user_subscription_status,
    user_is_admin,
    now()
  );
  
  RETURN auth_user_id;
END;
$$;


ALTER FUNCTION "public"."extend_auth_user_to_profile"("auth_user_id" "uuid", "user_email" "text", "user_subscription_tier" "text", "user_subscription_status" "text", "user_is_admin" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_behavior_patterns"("start_date" timestamp with time zone, "min_sample_size" integer DEFAULT 5, "stakeholder_role" "text" DEFAULT 'hr'::"text") RETURNS TABLE("pattern_id" "text", "pattern_name" "text", "avg_severity" numeric, "pattern_frequency" integer, "category_name" "text", "subcategory" "text", "framework" "text", "environmental_factors" "jsonb", "impact_score" integer, "trend_data" "jsonb", "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.pattern_id,
    COALESCE(bp.category_name, 'Unknown') as pattern_name,
    bp.avg_severity,
    bp.pattern_frequency,
    bp.category_name,
    bp.subcategory,
    bp.framework,
    bp.environmental_factors,
    bp.impact_score,
    json_build_object('data', bp.trend_data)::JSONB as trend_data,
    bp.last_updated
  FROM behavior_patterns_anonymous bp
  WHERE bp.pattern_frequency >= min_sample_size
    AND bp.last_updated >= start_date
  ORDER BY bp.pattern_frequency DESC, bp.avg_severity DESC;
END;
$$;


ALTER FUNCTION "public"."get_behavior_patterns"("start_date" timestamp with time zone, "min_sample_size" integer, "stakeholder_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_hexie_tags"("hexie_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN ARRAY(
    SELECT t.name
    FROM tags t
    JOIN hexie_card_tags hct ON t.id = hct.tag_id
    WHERE hct.hexie_card_id = hexie_id
    AND t.is_enabled = true
    ORDER BY t.name
  );
END;
$$;


ALTER FUNCTION "public"."get_hexie_tags"("hexie_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_interventions_by_role"("p_organization_id" "uuid", "p_stakeholder_role" "text", "p_status_filter" "text" DEFAULT 'all'::"text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "target_pattern" "text", "status" "text", "effectiveness_score" numeric, "start_date" "date", "end_date" "date", "target_metrics" "jsonb", "actual_metrics" "jsonb", "participants_count" integer, "budget_allocated" numeric, "roi_estimate" numeric, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.description,
    i.target_pattern,
    i.status,
    i.effectiveness_score,
    i.start_date,
    i.end_date,
    i.target_metrics,
    i.actual_metrics,
    i.participants_count,
    i.budget_allocated,
    i.roi_estimate,
    i.created_at
  FROM interventions i
  WHERE i.organization_id = p_organization_id
    AND (p_stakeholder_role = 'admin' OR i.stakeholder_role = p_stakeholder_role)
    AND (p_status_filter = 'all' OR i.status = p_status_filter)
  ORDER BY i.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_interventions_by_role"("p_organization_id" "uuid", "p_stakeholder_role" "text", "p_status_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organizational_heatmap"("org_id" "text" DEFAULT NULL::"text", "aggregation_level" "text" DEFAULT 'department'::"text", "min_group_size" integer DEFAULT 8) RETURNS TABLE("unit_hash" "text", "avg_severity" numeric, "group_size" integer, "category_breakdown" "jsonb", "trend_history" "jsonb", "intervention_score" numeric, "region" "text", "primary_category" "text", "division_name" "text", "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    substr(md5(w.name || u.email), 1, 8) as unit_hash,
    AVG(COALESCE(ui.severity_rating, hc.severity_rating))::NUMERIC as avg_severity,
    COUNT(DISTINCT u.id)::INTEGER as group_size,
    json_build_object('Communication', 0.3, 'Leadership', 0.2, 'Process', 0.3, 'Culture', 0.2)::JSONB as category_breakdown,
    json_build_array(
      json_build_object('week', 1, 'severity', 2.5),
      json_build_object('week', 2, 'severity', 2.3),
      json_build_object('week', 3, 'severity', 2.1),
      json_build_object('week', 4, 'severity', 2.0)
    )::JSONB as trend_history,
    (5 - AVG(COALESCE(ui.severity_rating, hc.severity_rating)))::NUMERIC as intervention_score,
    'North America'::TEXT as region,
    hc.category as primary_category,
    COALESCE(w.name, 'Unknown Division') as division_name,
    MAX(ui.created_at) as last_updated
  FROM workspaces w
  JOIN user_interactions ui ON w.id = ui.workspace_id
  JOIN users u ON ui.user_id = u.id
  JOIN hexie_cards hc ON ui.hexie_card_id = hc.id
  WHERE ui.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY w.name, hc.category, u.email
  HAVING COUNT(DISTINCT u.id) >= min_group_size
  ORDER BY avg_severity DESC;
END;
$$;


ALTER FUNCTION "public"."get_organizational_heatmap"("org_id" "text", "aggregation_level" "text", "min_group_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_stakeholder_metrics"("role" "text", "org_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
  total_patterns INTEGER;
  avg_severity NUMERIC;
  improvement_trend NUMERIC;
BEGIN
  -- Get basic metrics (with fallback to 0 if no data)
  SELECT 
    COALESCE(COUNT(*), 0), 
    COALESCE(AVG(avg_severity), 2.5), 
    COALESCE((
      SELECT AVG(avg_severity) FROM behavior_patterns_anonymous 
      WHERE last_updated >= NOW() - INTERVAL '30 days'
    ), 2.5) -
    COALESCE((
      SELECT AVG(avg_severity) FROM behavior_patterns_anonymous 
      WHERE last_updated >= NOW() - INTERVAL '60 days' 
      AND last_updated < NOW() - INTERVAL '30 days'
    ), 2.5)
  INTO total_patterns, avg_severity, improvement_trend
  FROM behavior_patterns_anonymous;

  -- Calculate role-specific metrics with sensible defaults
  result := json_build_object(
    'insight_count', GREATEST(COALESCE(total_patterns / 5, 1), 1),
    'hr_engagement', LEAST(0.9, 0.6 + (COALESCE(total_patterns, 0) * 0.01)),
    'culture_improvement', COALESCE(improvement_trend * -0.1, 0.12),
    'compliance_score', 0.95,
    'trend_accuracy', 0.88,
    'org_health', LEAST(0.9, 0.5 + ((5 - COALESCE(avg_severity, 3)) * 0.1)),
    'strategic_insights', GREATEST(COALESCE(total_patterns / 8, 1), 1),
    'exec_engagement', LEAST(0.8, 0.5 + (COALESCE(total_patterns, 0) * 0.008)),
    'retention_impact', GREATEST(0.1, COALESCE(improvement_trend * -0.05, 0.15)),
    'reputation_risk', LEAST(0.5, COALESCE(avg_severity * 0.1, 0.23)),
    'guidance_effectiveness', LEAST(0.9, 0.6 + (COALESCE(total_patterns, 0) * 0.008)),
    'early_warnings', GREATEST(COALESCE((SELECT COUNT(*) FROM behavior_patterns_anonymous WHERE avg_severity >= 4), 0) / 5, 1),
    'mgmt_engagement', LEAST(0.9, 0.65 + (COALESCE(total_patterns, 0) * 0.007)),
    'team_trust', LEAST(0.95, 0.75 + ((5 - COALESCE(avg_severity, 3)) * 0.05)),
    'empowerment', LEAST(0.9, 0.65 + (COALESCE(total_patterns, 0) * 0.01))
  );

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_stakeholder_metrics"("role" "text", "org_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_tier, subscription_status, is_admin)
  VALUES (
    new.id, 
    new.email, 
    'free', 
    'active', 
    false
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_by_email"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_emails 
        WHERE email = auth.email()
    );
$$;


ALTER FUNCTION "public"."is_admin_by_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND is_admin = true 
        AND COALESCE(is_archived, false) = false
    );
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."queue_email"("p_template_name" character varying, "p_recipient_email" character varying, "p_recipient_name" character varying, "p_subject" character varying, "p_template_variables" "jsonb" DEFAULT '{}'::"jsonb", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_scheduled_for" timestamp with time zone DEFAULT "now"()) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO email_notifications (
        template_name,
        recipient_email,
        recipient_name,
        subject,
        template_variables,
        user_id,
        scheduled_for
    ) VALUES (
        p_template_name,
        p_recipient_email,
        p_recipient_name,
        p_subject,
        p_template_variables,
        p_user_id,
        p_scheduled_for
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."queue_email"("p_template_name" character varying, "p_recipient_email" character varying, "p_recipient_name" character varying, "p_subject" character varying, "p_template_variables" "jsonb", "p_user_id" "uuid", "p_scheduled_for" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_hexie_card"("card_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE hexie_cards 
  SET 
    is_archived = FALSE,
    archived_at = NULL,
    archived_by = NULL,
    is_active = TRUE  -- Reactivate when restored
  WHERE id = card_id;
END;
$$;


ALTER FUNCTION "public"."restore_hexie_card"("card_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."restore_hexie_card"("card_id" "uuid") IS 'Restore an archived hexie card back to active status';



CREATE OR REPLACE FUNCTION "public"."restore_user_simple"("target_user_id" "uuid", "restored_by_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update user
  UPDATE users 
  SET 
    is_archived = false,
    archived_at = NULL,
    archived_by = NULL
  WHERE id = target_user_id;
  
  -- Log it
  INSERT INTO audit_logs (table_name, record_id, action, performed_by, created_at) 
  VALUES ('users', target_user_id, 'RESTORE', restored_by_id, NOW());
END;
$$;


ALTER FUNCTION "public"."restore_user_simple"("target_user_id" "uuid", "restored_by_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sanitize_text"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Remove potential XSS and injection attempts
  RETURN regexp_replace(
    regexp_replace(input_text, '<[^>]*>', '', 'g'),
    '[<>"\'']+', '', 'g'
  );
END;
$$;


ALTER FUNCTION "public"."sanitize_text"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_hexies_by_tags"("tag_names" "text"[]) RETURNS TABLE("hexie_id" "uuid", "title" "text", "front_text" "text", "back_text" "text", "category" "text", "matching_tags" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.id,
    hc.title,
    hc.front_text,
    hc.back_text,
    hc.category,
    ARRAY_AGG(t.name) FILTER (WHERE t.name = ANY(tag_names))
  FROM hexie_cards hc
  JOIN hexie_card_tags hct ON hc.id = hct.hexie_card_id
  JOIN tags t ON hct.tag_id = t.id
  WHERE t.name = ANY(tag_names) AND t.is_enabled = true
  GROUP BY hc.id, hc.title, hc.front_text, hc.back_text, hc.category
  HAVING COUNT(DISTINCT t.name) > 0;
END;
$$;


ALTER FUNCTION "public"."search_hexies_by_tags"("tag_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_tag_usage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_tag_usage_count(NEW.tag_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_tag_usage_count(OLD.tag_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_tag_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_competency_score"("p_user_id" "uuid", "p_competency" "text", "p_points" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO user_competencies (user_id, competency_scores)
  VALUES (p_user_id, jsonb_build_object(p_competency, p_points))
  ON CONFLICT (user_id) DO UPDATE SET
    competency_scores = user_competencies.competency_scores || 
      jsonb_build_object(p_competency, 
        COALESCE((user_competencies.competency_scores->>p_competency)::INTEGER, 0) + p_points
      ),
    total_experience = total_experience + p_points,
    current_level = GREATEST(1, (total_experience + p_points) / 100),
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_competency_score"("p_user_id" "uuid", "p_competency" "text", "p_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_tag_usage_count"("tag_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE tags 
  SET usage_count = (
    SELECT COUNT(*) 
    FROM hexie_card_tags 
    WHERE tag_id = tag_uuid
  ),
  updated_at = NOW()
  WHERE id = tag_uuid;
END;
$$;


ALTER FUNCTION "public"."update_tag_usage_count"("tag_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "organization_id" "uuid",
    "action" character varying(100) NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "resource_id" "uuid",
    "details" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "success" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_emails" (
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."antipattern_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "base_severity" integer NOT NULL,
    "severity_factors" "jsonb" DEFAULT '{"context_factors": [], "impact_multiplier": 1.0, "frequency_multiplier": 1.0}'::"jsonb",
    "psychological_framework" "text",
    "intervention_methods" "jsonb" DEFAULT '[]'::"jsonb",
    "competency_hierarchy" "jsonb" DEFAULT '{"mastery": [], "advanced": [], "foundational": [], "intermediate": []}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "antipattern_types_base_severity_check" CHECK ((("base_severity" >= 1) AND ("base_severity" <= 5))),
    CONSTRAINT "antipattern_types_category_check" CHECK (("category" = ANY (ARRAY['communication'::"text", 'management'::"text", 'collaboration'::"text", 'culture'::"text", 'workload'::"text", 'environment'::"text", 'cognitive'::"text", 'emotional'::"text", 'behavioral'::"text"]))),
    CONSTRAINT "antipattern_types_psychological_framework_check" CHECK (("psychological_framework" = ANY (ARRAY['cognitive_behavioral'::"text", 'positive_psychology'::"text", 'mindfulness'::"text", 'acceptance_commitment'::"text", 'dialectical_behavioral'::"text", 'solution_focused'::"text"])))
);


ALTER TABLE "public"."antipattern_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" character varying(100) NOT NULL,
    "record_id" "uuid",
    "action" character varying(50) NOT NULL,
    "performed_by" "uuid",
    "performed_by_email" character varying(255),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."combination_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "combination_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "rating" integer,
    "feedback_type" "text" DEFAULT 'effectiveness'::"text",
    "comment" "text",
    "is_anonymous" boolean DEFAULT true,
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "combination_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['effectiveness'::"text", 'safety'::"text", 'clarity'::"text", 'applicability'::"text", 'innovation'::"text"]))),
    CONSTRAINT "combination_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."combination_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compliance_framework" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid",
    "framework_name" character varying(100) NOT NULL,
    "framework_type" character varying(50) NOT NULL,
    "requirements" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "compliance_status" character varying(20) DEFAULT 'in_progress'::character varying,
    "last_audit_date" "date",
    "next_audit_date" "date",
    "responsible_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "compliance_framework_compliance_status_check" CHECK ((("compliance_status")::"text" = ANY ((ARRAY['not_started'::character varying, 'in_progress'::character varying, 'compliant'::character varying, 'non_compliant'::character varying, 'under_review'::character varying])::"text"[]))),
    CONSTRAINT "compliance_framework_framework_type_check" CHECK ((("framework_type")::"text" = ANY ((ARRAY['SOC2'::character varying, 'GDPR'::character varying, 'HIPAA'::character varying, 'PCI_DSS'::character varying, 'ISO27001'::character varying, 'CUSTOM'::character varying])::"text"[])))
);


ALTER TABLE "public"."compliance_framework" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" character varying(100),
    "created_by" "uuid",
    "title" character varying(200) NOT NULL,
    "description" "text" NOT NULL,
    "context" "text",
    "characters" "jsonb",
    "challenge" "text" NOT NULL,
    "is_private" boolean DEFAULT true,
    "is_template" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."custom_scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_analytics_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "report_type" character varying(100) NOT NULL,
    "recipient_emails" "text"[] NOT NULL,
    "recipient_groups" "jsonb" DEFAULT '[]'::"jsonb",
    "date_range_type" character varying(50) DEFAULT 'relative'::character varying,
    "date_range_value" character varying(100) DEFAULT 'last_30_days'::character varying,
    "date_range_start" "date",
    "date_range_end" "date",
    "department_filter" "text"[],
    "role_filter" "text"[],
    "custom_filters" "jsonb" DEFAULT '{}'::"jsonb",
    "is_enabled" boolean DEFAULT true,
    "frequency" character varying(50) NOT NULL,
    "day_of_week" integer,
    "day_of_month" integer,
    "hour_of_day" integer DEFAULT 9,
    "timezone" character varying(100) DEFAULT 'UTC'::character varying,
    "format" character varying(50) DEFAULT 'html'::character varying,
    "include_charts" boolean DEFAULT true,
    "include_raw_data" boolean DEFAULT false,
    "last_run_at" timestamp with time zone,
    "next_run_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "last_error" "text",
    "run_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_analytics_reports_date_range_type_check" CHECK ((("date_range_type")::"text" = ANY ((ARRAY['relative'::character varying, 'fixed'::character varying])::"text"[]))),
    CONSTRAINT "email_analytics_reports_day_of_month_check" CHECK ((("day_of_month" >= 1) AND ("day_of_month" <= 31))),
    CONSTRAINT "email_analytics_reports_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "email_analytics_reports_format_check" CHECK ((("format")::"text" = ANY ((ARRAY['html'::character varying, 'pdf'::character varying, 'both'::character varying])::"text"[]))),
    CONSTRAINT "email_analytics_reports_frequency_check" CHECK ((("frequency")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying])::"text"[]))),
    CONSTRAINT "email_analytics_reports_hour_of_day_check" CHECK ((("hour_of_day" >= 0) AND ("hour_of_day" <= 23))),
    CONSTRAINT "email_analytics_reports_report_type_check" CHECK ((("report_type")::"text" = ANY ((ARRAY['organizational_health'::character varying, 'department_metrics'::character varying, 'user_engagement'::character varying, 'pattern_analysis'::character varying, 'intervention_effectiveness'::character varying, 'custom'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_analytics_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_campaigns" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "campaign_type" character varying(100) DEFAULT 'manual'::character varying,
    "template_id" "uuid",
    "subject" character varying(500) NOT NULL,
    "target_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "recipient_count" integer DEFAULT 0,
    "schedule_type" character varying(50) DEFAULT 'immediate'::character varying,
    "scheduled_at" timestamp with time zone,
    "timezone" character varying(100) DEFAULT 'UTC'::character varying,
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "sent_count" integer DEFAULT 0,
    "delivered_count" integer DEFAULT 0,
    "opened_count" integer DEFAULT 0,
    "clicked_count" integer DEFAULT 0,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_campaigns_campaign_type_check" CHECK ((("campaign_type")::"text" = ANY ((ARRAY['manual'::character varying, 'automated'::character varying, 'analytics_report'::character varying, 'system_notification'::character varying])::"text"[]))),
    CONSTRAINT "email_campaigns_schedule_type_check" CHECK ((("schedule_type")::"text" = ANY ((ARRAY['immediate'::character varying, 'scheduled'::character varying, 'recurring'::character varying])::"text"[]))),
    CONSTRAINT "email_campaigns_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'scheduled'::character varying, 'sending'::character varying, 'sent'::character varying, 'paused'::character varying, 'cancelled'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_deliverability" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "report_date" "date" NOT NULL,
    "emails_sent" integer DEFAULT 0,
    "emails_delivered" integer DEFAULT 0,
    "emails_bounced" integer DEFAULT 0,
    "emails_blocked" integer DEFAULT 0,
    "emails_opened" integer DEFAULT 0,
    "emails_clicked" integer DEFAULT 0,
    "unsubscribes" integer DEFAULT 0,
    "spam_reports" integer DEFAULT 0,
    "delivery_rate" numeric(5,2) DEFAULT 0.00,
    "bounce_rate" numeric(5,2) DEFAULT 0.00,
    "open_rate" numeric(5,2) DEFAULT 0.00,
    "click_rate" numeric(5,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_deliverability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "template_name" character varying(100) NOT NULL,
    "recipient_email" character varying(255) NOT NULL,
    "subject" character varying(500) NOT NULL,
    "body_html" "text",
    "body_text" "text",
    "variables" "jsonb" DEFAULT '{}'::"jsonb",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_enabled" boolean DEFAULT true,
    "frequency_preference" character varying(50) DEFAULT 'immediate'::character varying,
    "auth_notifications" boolean DEFAULT true,
    "account_notifications" boolean DEFAULT true,
    "analytics_reports" boolean DEFAULT true,
    "system_notifications" boolean DEFAULT true,
    "marketing_emails" boolean DEFAULT false,
    "analytics_frequency" character varying(50) DEFAULT 'weekly'::character varying,
    "analytics_day_of_week" integer DEFAULT 1,
    "analytics_hour" integer DEFAULT 9,
    "analytics_timezone" character varying(100) DEFAULT 'UTC'::character varying,
    "custom_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "unsubscribe_token" character varying(255) DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_preferences_analytics_day_of_week_check" CHECK ((("analytics_day_of_week" >= 0) AND ("analytics_day_of_week" <= 6))),
    CONSTRAINT "email_preferences_analytics_frequency_check" CHECK ((("analytics_frequency")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'never'::character varying])::"text"[]))),
    CONSTRAINT "email_preferences_analytics_hour_check" CHECK ((("analytics_hour" >= 0) AND ("analytics_hour" <= 23))),
    CONSTRAINT "email_preferences_frequency_preference_check" CHECK ((("frequency_preference")::"text" = ANY ((ARRAY['immediate'::character varying, 'hourly'::character varying, 'daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'never'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_queue" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid",
    "recipient_email" character varying(255) NOT NULL,
    "recipient_name" character varying(255),
    "subject" character varying(500) NOT NULL,
    "html_content" "text" NOT NULL,
    "text_content" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "attempts" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 3,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_queue_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'sent'::character varying, 'failed'::character varying, 'bounced'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_recipients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "first_name" character varying(255),
    "last_name" character varying(255),
    "display_name" character varying(255),
    "job_title" character varying(255),
    "department" character varying(255),
    "ad_object_id" character varying(255),
    "ad_user_principal_name" character varying(255),
    "ad_sync_enabled" boolean DEFAULT false,
    "ad_last_sync" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "email_verified" boolean DEFAULT false,
    "opted_out" boolean DEFAULT false,
    "source" character varying(100) DEFAULT 'manual'::character varying,
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100) DEFAULT 'general'::character varying,
    "subject_template" character varying(500) NOT NULL,
    "html_template" "text" NOT NULL,
    "text_template" "text",
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "default_variables" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_system_template" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid",
    "created_by" "uuid",
    "updated_by" "uuid",
    "template_type" character varying(50) DEFAULT 'transactional'::character varying,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "version" integer DEFAULT 1,
    CONSTRAINT "email_templates_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'archived'::character varying])::"text"[]))),
    CONSTRAINT "email_templates_template_type_check" CHECK ((("template_type")::"text" = ANY ((ARRAY['marketing'::character varying, 'transactional'::character varying, 'notification'::character varying, 'system'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "board_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_type" "text" DEFAULT 'individual'::"text",
    "current_phase" "text" DEFAULT 'exploration'::"text",
    "progress_data" "jsonb" DEFAULT '{"hexies_placed": 0, "insights_shared": 0, "patterns_identified": 0, "interventions_created": 0}'::"jsonb",
    "psychological_state" "jsonb" DEFAULT '{"safety_score": 5, "comfort_level": 5, "engagement_level": 5, "stress_indicators": []}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "session_duration_minutes" integer DEFAULT 0,
    CONSTRAINT "game_sessions_current_phase_check" CHECK (("current_phase" = ANY (ARRAY['exploration'::"text", 'identification'::"text", 'analysis'::"text", 'intervention'::"text", 'reflection'::"text"]))),
    CONSTRAINT "game_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['individual'::"text", 'collaborative'::"text", 'guided'::"text", 'therapeutic'::"text"])))
);


ALTER TABLE "public"."game_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hexie_annotations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "hexie_instance_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "annotation_type" "text" DEFAULT 'note'::"text",
    "position" "jsonb" DEFAULT '{"x": 0.5, "y": 0.5}'::"jsonb",
    "style" "jsonb" DEFAULT '{"color": "#fbbf24", "opacity": 0.9, "fontSize": 14, "background": "rgba(0,0,0,0.8)"}'::"jsonb",
    "visibility" "text" DEFAULT 'private'::"text",
    "is_anonymous" boolean DEFAULT false,
    "safety_level" "text" DEFAULT 'safe'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "hexie_annotations_annotation_type_check" CHECK (("annotation_type" = ANY (ARRAY['note'::"text", 'question'::"text", 'insight'::"text", 'concern'::"text", 'solution'::"text", 'reflection'::"text"]))),
    CONSTRAINT "hexie_annotations_safety_level_check" CHECK (("safety_level" = ANY (ARRAY['safe'::"text", 'sensitive'::"text", 'private'::"text"]))),
    CONSTRAINT "hexie_annotations_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'team'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."hexie_annotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hexie_card_tags" (
    "hexie_card_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hexie_card_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hexie_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "front_text" "text" NOT NULL,
    "back_text" "text" NOT NULL,
    "category" "text" NOT NULL,
    "color_scheme" "jsonb" NOT NULL,
    "icon_svg" "text",
    "subscription_tier_required" "text" DEFAULT 'free'::"text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "references" "jsonb",
    "category_id" "uuid",
    "card_references" "jsonb" DEFAULT '[]'::"jsonb",
    "is_archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "antipattern_type_id" "uuid",
    "severity_indicators" "jsonb" DEFAULT '{"team": 1, "individual": 1, "organizational": 1}'::"jsonb",
    "intervention_strategies" "jsonb" DEFAULT '[]'::"jsonb",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "severity_rating" integer DEFAULT 1,
    "environmental_factors" "jsonb" DEFAULT '[]'::"jsonb",
    "psychological_framework" "text" DEFAULT 'Cognitive-Behavioral'::"text",
    "subcategory" "text",
    "organization_id" "uuid",
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "average_severity" numeric(3,2),
    "total_interactions" integer DEFAULT 0,
    CONSTRAINT "back_text_length_check" CHECK (("length"("back_text") <= 1000)),
    CONSTRAINT "category_length_check" CHECK (("length"("category") <= 50)),
    CONSTRAINT "front_text_length_check" CHECK (("length"("front_text") <= 500)),
    CONSTRAINT "hexie_cards_severity_rating_check" CHECK ((("severity_rating" >= 1) AND ("severity_rating" <= 5))),
    CONSTRAINT "hexie_cards_subscription_tier_required_check" CHECK (("subscription_tier_required" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text"]))),
    CONSTRAINT "no_script_in_back_text" CHECK (("back_text" !~* '<script|javascript:|data:'::"text")),
    CONSTRAINT "no_script_in_front_text" CHECK (("front_text" !~* '<script|javascript:|data:'::"text")),
    CONSTRAINT "no_script_in_title" CHECK (("title" !~* '<script|javascript:|data:'::"text")),
    CONSTRAINT "title_length_check" CHECK (("length"("title") <= 100))
);


ALTER TABLE "public"."hexie_cards" OWNER TO "postgres";


COMMENT ON COLUMN "public"."hexie_cards"."references" IS 'Array of reference objects with title, url, type, authors, publication, year, description';



COMMENT ON COLUMN "public"."hexie_cards"."is_archived" IS 'Soft delete flag - when true, card is archived but not permanently deleted';



COMMENT ON COLUMN "public"."hexie_cards"."archived_at" IS 'Timestamp when the card was archived';



COMMENT ON COLUMN "public"."hexie_cards"."archived_by" IS 'User ID who archived the card';



COMMENT ON COLUMN "public"."hexie_cards"."tags" IS 'Array of tag names associated with this hexie card';



CREATE OR REPLACE VIEW "public"."hexie_cards_with_tags" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "title",
    NULL::"text" AS "front_text",
    NULL::"text" AS "back_text",
    NULL::"text" AS "category",
    NULL::"jsonb" AS "color_scheme",
    NULL::"text" AS "icon_svg",
    NULL::"text" AS "subscription_tier_required",
    NULL::boolean AS "is_active",
    NULL::"uuid" AS "created_by",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"jsonb" AS "references",
    NULL::"uuid" AS "category_id",
    NULL::"jsonb" AS "card_references",
    NULL::boolean AS "is_archived",
    NULL::timestamp with time zone AS "archived_at",
    NULL::"uuid" AS "archived_by",
    NULL::"uuid" AS "antipattern_type_id",
    NULL::"jsonb" AS "severity_indicators",
    NULL::"jsonb" AS "intervention_strategies",
    NULL::"text"[] AS "tags",
    NULL::integer AS "severity_rating",
    NULL::"jsonb" AS "environmental_factors",
    NULL::"text" AS "psychological_framework",
    NULL::"text" AS "subcategory",
    NULL::"uuid" AS "organization_id",
    NULL::integer AS "usage_count",
    NULL::timestamp with time zone AS "last_used_at",
    NULL::numeric(3,2) AS "average_severity",
    NULL::integer AS "total_interactions",
    NULL::"text"[] AS "tag_names";


ALTER TABLE "public"."hexie_cards_with_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hexie_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6366f1'::"text",
    "icon_svg" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid"
);


ALTER TABLE "public"."hexie_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hexie_combinations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "board_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "combination_type" "text" DEFAULT 'intervention'::"text",
    "hexie_instances" "uuid"[] NOT NULL,
    "connection_strength" double precision DEFAULT 1.0,
    "effectiveness_score" double precision DEFAULT 0.0,
    "validation_count" integer DEFAULT 0,
    "usage_count" integer DEFAULT 0,
    "therapeutic_approach" "text"[],
    "safety_considerations" "jsonb" DEFAULT '[]'::"jsonb",
    "contraindications" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "hexie_combinations_combination_type_check" CHECK (("combination_type" = ANY (ARRAY['intervention'::"text", 'framework'::"text", 'process'::"text", 'insight'::"text", 'solution'::"text"]))),
    CONSTRAINT "hexie_combinations_connection_strength_check" CHECK ((("connection_strength" >= (0.1)::double precision) AND ("connection_strength" <= (3.0)::double precision))),
    CONSTRAINT "hexie_combinations_effectiveness_score_check" CHECK ((("effectiveness_score" >= (0.0)::double precision) AND ("effectiveness_score" <= (5.0)::double precision)))
);


ALTER TABLE "public"."hexie_combinations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hexie_instances" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "hexie_card_id" "uuid" NOT NULL,
    "position" "jsonb" DEFAULT '{"x": 0, "y": 0}'::"jsonb" NOT NULL,
    "rotation" double precision DEFAULT 0,
    "scale" double precision DEFAULT 1,
    "z_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."hexie_instances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intervention_participants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "intervention_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "participant_role" "text" DEFAULT 'participant'::"text",
    "attendance_score" numeric(3,2) DEFAULT 0.0,
    "feedback_score" numeric(3,2) DEFAULT 0.0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "intervention_participants_participant_role_check" CHECK (("participant_role" = ANY (ARRAY['facilitator'::"text", 'participant'::"text", 'observer'::"text"])))
);


ALTER TABLE "public"."intervention_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intervention_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "intervention_id" "uuid" NOT NULL,
    "milestone_name" "text" NOT NULL,
    "milestone_description" "text",
    "target_date" "date",
    "completion_date" "date",
    "completion_percentage" numeric(5,2) DEFAULT 0.0,
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "intervention_progress_completion_percentage_check" CHECK ((("completion_percentage" >= 0.0) AND ("completion_percentage" <= 100.0)))
);


ALTER TABLE "public"."intervention_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interventions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "target_pattern" "text" NOT NULL,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "effectiveness_score" numeric(3,2) DEFAULT 0.0,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "target_metrics" "jsonb" DEFAULT '{"severity_reduction": 0, "frequency_reduction": 0}'::"jsonb" NOT NULL,
    "actual_metrics" "jsonb" DEFAULT '{"severity_reduction": 0, "frequency_reduction": 0}'::"jsonb",
    "stakeholder_role" "text" NOT NULL,
    "category" "text" NOT NULL,
    "participants_count" integer DEFAULT 0,
    "budget_allocated" numeric(10,2) DEFAULT 0.0,
    "budget_spent" numeric(10,2) DEFAULT 0.0,
    "roi_estimate" numeric(4,2),
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interventions_effectiveness_score_check" CHECK ((("effectiveness_score" >= 0.0) AND ("effectiveness_score" <= 5.0))),
    CONSTRAINT "interventions_stakeholder_role_check" CHECK (("stakeholder_role" = ANY (ARRAY['hr'::"text", 'executive'::"text", 'middle_management'::"text"]))),
    CONSTRAINT "interventions_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text", 'completed'::"text", 'paused'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."interventions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ip_allowlist" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid",
    "ip_address" "inet",
    "ip_range" "cidr",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "ip_or_range_required" CHECK ((("ip_address" IS NOT NULL) OR ("ip_range" IS NOT NULL)))
);


ALTER TABLE "public"."ip_allowlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mfa_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid",
    "require_all_users_mfa" boolean DEFAULT false,
    "allowed_methods" "text"[] DEFAULT ARRAY['totp'::"text", 'sms'::"text", 'email'::"text"],
    "backup_codes_enabled" boolean DEFAULT true,
    "session_timeout_minutes" integer DEFAULT 480,
    "remember_device_days" integer DEFAULT 30,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mfa_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."miro_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "miro_board_id" "text" NOT NULL,
    "session_data" "jsonb",
    "last_accessed" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."miro_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organization_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'manager'::"text", 'member'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "subscription_tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organizations_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."safety_monitoring" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "trigger_type" "text" NOT NULL,
    "severity_level" integer,
    "automated_detection" boolean DEFAULT true,
    "intervention_triggered" boolean DEFAULT false,
    "support_provided" "jsonb" DEFAULT '{}'::"jsonb",
    "follow_up_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    CONSTRAINT "safety_monitoring_severity_level_check" CHECK ((("severity_level" >= 1) AND ("severity_level" <= 3))),
    CONSTRAINT "safety_monitoring_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['stress_pattern'::"text", 'negative_spiral'::"text", 'isolation_behavior'::"text", 'overwhelming_content'::"text", 'rapid_exit'::"text", 'help_request'::"text"])))
);


ALTER TABLE "public"."safety_monitoring" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scenario_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50),
    "color" character varying(7),
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."scenario_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scenario_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scenario_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "feedback" "text",
    "difficulty_experienced" integer,
    "time_spent_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scenario_ratings_difficulty_experienced_check" CHECK ((("difficulty_experienced" >= 1) AND ("difficulty_experienced" <= 5))),
    CONSTRAINT "scenario_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."scenario_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "title" character varying(200) NOT NULL,
    "subtitle" character varying(300),
    "difficulty_level" integer DEFAULT 1,
    "estimated_time_minutes" integer DEFAULT 30,
    "setting" "text" NOT NULL,
    "characters" "jsonb" NOT NULL,
    "situation" "text" NOT NULL,
    "background_context" "text",
    "underlying_tensions" "text",
    "learning_objectives" "text"[],
    "key_antipatterns" "text"[],
    "suggested_hexies" "text"[],
    "discussion_prompts" "text"[],
    "intervention_hints" "text"[],
    "success_indicators" "text"[],
    "complexity_tags" "text"[],
    "industry_specific_elements" "text"[],
    "usage_count" integer DEFAULT 0,
    "average_rating" numeric(3,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "scenarios_difficulty_level_check" CHECK ((("difficulty_level" >= 1) AND ("difficulty_level" <= 5)))
);


ALTER TABLE "public"."scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schema_migrations" (
    "version" "text" NOT NULL,
    "description" "text" NOT NULL,
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "rollback_sql" "text"
);


ALTER TABLE "public"."schema_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_policies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid",
    "policy_name" character varying(200) NOT NULL,
    "policy_type" character varying(50) NOT NULL,
    "policy_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "enforcement_level" character varying(20) DEFAULT 'required'::character varying,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "security_policies_enforcement_level_check" CHECK ((("enforcement_level")::"text" = ANY ((ARRAY['optional'::character varying, 'recommended'::character varying, 'required'::character varying, 'strict'::character varying])::"text"[]))),
    CONSTRAINT "security_policies_policy_type_check" CHECK ((("policy_type")::"text" = ANY ((ARRAY['password'::character varying, 'mfa'::character varying, 'session'::character varying, 'ip_allowlist'::character varying, 'login_attempts'::character varying, 'data_retention'::character varying])::"text"[])))
);


ALTER TABLE "public"."security_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_features" (
    "tier" "text" NOT NULL,
    "max_boards" integer NOT NULL,
    "max_hexies_per_board" integer NOT NULL,
    "max_annotations_per_hexie" integer NOT NULL,
    "max_combinations" integer NOT NULL,
    "can_use_therapeutic_mode" boolean DEFAULT false,
    "can_access_all_frameworks" boolean DEFAULT false,
    "can_create_custom_antipatterns" boolean DEFAULT false,
    "can_export_interventions" boolean DEFAULT false,
    "priority_support" boolean DEFAULT false,
    "safety_monitoring_level" "text" DEFAULT 'basic'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_features_safety_monitoring_level_check" CHECK (("safety_monitoring_level" = ANY (ARRAY['basic'::"text", 'enhanced'::"text", 'clinical'::"text"]))),
    CONSTRAINT "subscription_features_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."subscription_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "price_monthly" numeric(10,2),
    "price_yearly" numeric(10,2),
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_resources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "resource_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "trigger_conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "personality_match" "jsonb" DEFAULT '{}'::"jsonb",
    "effectiveness_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    CONSTRAINT "support_resources_resource_type_check" CHECK (("resource_type" = ANY (ARRAY['breathing_exercise'::"text", 'grounding_technique'::"text", 'reframe_prompt'::"text", 'break_suggestion'::"text", 'peer_support'::"text", 'professional_referral'::"text"])))
);


ALTER TABLE "public"."support_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid",
    "category" character varying(50) NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6b7280'::"text",
    "is_enabled" boolean DEFAULT true,
    "created_by" "uuid",
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_card_access" (
    "user_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "access_granted_at" timestamp with time zone DEFAULT "now"(),
    "subscription_tier_required" "text" NOT NULL
);


ALTER TABLE "public"."user_card_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_competencies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "primary_role" "text" DEFAULT 'explorer'::"text",
    "competency_scores" "jsonb" DEFAULT '{"systems_thinking": 0, "group_facilitation": 0, "intervention_design": 0, "pattern_recognition": 0, "psychological_safety": 0, "emotional_intelligence": 0}'::"jsonb",
    "total_experience" integer DEFAULT 0,
    "current_level" integer DEFAULT 1,
    "badges_earned" "jsonb" DEFAULT '[]'::"jsonb",
    "interaction_preferences" "jsonb" DEFAULT '{"support_level": "standard", "anonymous_mode": false, "feedback_style": "collaborative", "challenge_level": "moderate"}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_competencies_primary_role_check" CHECK (("primary_role" = ANY (ARRAY['explorer'::"text", 'analyst'::"text", 'facilitator'::"text", 'architect'::"text", 'mentor'::"text"])))
);


ALTER TABLE "public"."user_competencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "hexie_card_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "severity_rating" integer,
    "environmental_context" "jsonb" DEFAULT '{}'::"jsonb",
    "session_id" "uuid",
    "duration_seconds" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "intervention_id" "uuid",
    "pre_intervention" boolean DEFAULT false,
    "post_intervention" boolean DEFAULT false,
    CONSTRAINT "user_interactions_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['view'::"text", 'select'::"text", 'annotate'::"text", 'vote'::"text", 'comment'::"text"]))),
    CONSTRAINT "user_interactions_severity_rating_check" CHECK ((("severity_rating" >= 1) AND ("severity_rating" <= 5)))
);


ALTER TABLE "public"."user_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "role_id" "uuid",
    "subscription_plan_id" "uuid",
    "invited_by" "uuid",
    "invitation_token" character varying(255) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "expires_at" timestamp with time zone NOT NULL,
    "accepted_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "first_name" character varying(100),
    "last_name" character varying(100),
    "display_name" character varying(200),
    "job_title" character varying(200),
    "department" character varying(100),
    "phone_number" character varying(20),
    "profile_image_url" "text",
    "timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "locale" character varying(10) DEFAULT 'en-US'::character varying,
    "organization_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_system_role" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "session_token" character varying(255) NOT NULL,
    "user_agent" "text",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_two_factor_auth" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "method_type" character varying(20) NOT NULL,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_two_factor_auth_method_type_check" CHECK ((("method_type")::"text" = ANY ((ARRAY['totp'::character varying, 'sms'::character varying, 'email'::character varying, 'backup_codes'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_two_factor_auth" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "subscription_status" "text" DEFAULT 'inactive'::"text",
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "is_admin" boolean DEFAULT false,
    "miro_user_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role_id" "uuid",
    "subscription_plan_id" "uuid",
    "first_name" character varying(100),
    "last_name" character varying(100),
    "company" character varying(255),
    "is_archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    "archived_by" "uuid",
    "last_login_at" timestamp with time zone,
    "login_count" integer DEFAULT 0,
    "notes" "text",
    "organization_id" "uuid",
    "role" "text" DEFAULT 'member'::"text",
    "department" "text",
    "job_title" "text",
    "manager_id" "uuid",
    "hire_date" "date",
    "account_status" "text" DEFAULT 'active'::"text",
    "failed_login_attempts" integer DEFAULT 0,
    "locked_until" timestamp with time zone,
    "two_factor_enabled" boolean DEFAULT false,
    CONSTRAINT "users_account_status_check" CHECK (("account_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'locked'::"text", 'pending_verification'::"text"]))),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'hr'::"text", 'executive'::"text", 'middle_management'::"text", 'member'::"text"]))),
    CONSTRAINT "users_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'trial'::"text"]))),
    CONSTRAINT "users_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_boards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "board_type" "text" DEFAULT 'general'::"text",
    "session_id" "text",
    "session_expires_at" timestamp with time zone,
    "game_settings" "jsonb" DEFAULT '{"safety_level": "high", "anonymous_mode": false, "difficulty_level": "beginner", "intervention_mode": "collaborative", "progress_tracking": true}'::"jsonb",
    "access_level" "text" DEFAULT 'free'::"text",
    "max_hexies" integer DEFAULT 10,
    "max_annotations" integer DEFAULT 5,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "workspace_boards_access_level_check" CHECK (("access_level" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text"]))),
    CONSTRAINT "workspace_boards_board_type_check" CHECK (("board_type" = ANY (ARRAY['general'::"text", 'antipattern_analysis'::"text", 'intervention_planning'::"text", 'competency_development'::"text", 'psychological_safety'::"text"])))
);


ALTER TABLE "public"."workspace_boards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_collaborators" (
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{"can_edit": false, "can_delete": false, "can_export": true, "can_invite": false}'::"jsonb",
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    CONSTRAINT "workspace_collaborators_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."workspace_collaborators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_scenarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" character varying(100),
    "scenario_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "facilitator_notes" "text",
    "outcome_summary" "text",
    "hexies_used" "jsonb",
    "insights_captured" "text"[],
    "created_by" "uuid"
);


ALTER TABLE "public"."workspace_scenarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "owner_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false,
    "settings" "jsonb" DEFAULT '{"theme": "light", "auto_save": true, "grid_size": 50, "snap_to_grid": true}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_emails"
    ADD CONSTRAINT "admin_emails_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."antipattern_types"
    ADD CONSTRAINT "antipattern_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."antipattern_types"
    ADD CONSTRAINT "antipattern_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."combination_feedback"
    ADD CONSTRAINT "combination_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_framework"
    ADD CONSTRAINT "compliance_framework_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_scenarios"
    ADD CONSTRAINT "custom_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_analytics_reports"
    ADD CONSTRAINT "email_analytics_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_campaigns"
    ADD CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_deliverability"
    ADD CONSTRAINT "email_deliverability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_deliverability"
    ADD CONSTRAINT "email_deliverability_report_date_key" UNIQUE ("report_date");



ALTER TABLE ONLY "public"."email_notifications"
    ADD CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_unsubscribe_token_key" UNIQUE ("unsubscribe_token");



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_recipients"
    ADD CONSTRAINT "email_recipients_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."email_recipients"
    ADD CONSTRAINT "email_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hexie_annotations"
    ADD CONSTRAINT "hexie_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hexie_card_tags"
    ADD CONSTRAINT "hexie_card_tags_pkey" PRIMARY KEY ("hexie_card_id", "tag_id");



ALTER TABLE ONLY "public"."hexie_cards"
    ADD CONSTRAINT "hexie_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hexie_categories"
    ADD CONSTRAINT "hexie_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."hexie_categories"
    ADD CONSTRAINT "hexie_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hexie_combinations"
    ADD CONSTRAINT "hexie_combinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hexie_instances"
    ADD CONSTRAINT "hexie_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intervention_participants"
    ADD CONSTRAINT "intervention_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intervention_progress"
    ADD CONSTRAINT "intervention_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ip_allowlist"
    ADD CONSTRAINT "ip_allowlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mfa_settings"
    ADD CONSTRAINT "mfa_settings_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."mfa_settings"
    ADD CONSTRAINT "mfa_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."miro_sessions"
    ADD CONSTRAINT "miro_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_organization_id_key" UNIQUE ("user_id", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."safety_monitoring"
    ADD CONSTRAINT "safety_monitoring_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scenario_categories"
    ADD CONSTRAINT "scenario_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."scenario_categories"
    ADD CONSTRAINT "scenario_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scenario_ratings"
    ADD CONSTRAINT "scenario_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scenario_ratings"
    ADD CONSTRAINT "scenario_ratings_scenario_id_user_id_key" UNIQUE ("scenario_id", "user_id");



ALTER TABLE ONLY "public"."scenarios"
    ADD CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."security_policies"
    ADD CONSTRAINT "security_policies_organization_id_policy_name_key" UNIQUE ("organization_id", "policy_name");



ALTER TABLE ONLY "public"."security_policies"
    ADD CONSTRAINT "security_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_features"
    ADD CONSTRAINT "subscription_features_pkey" PRIMARY KEY ("tier");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_resources"
    ADD CONSTRAINT "support_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_organization_id_category_setting_key_key" UNIQUE ("organization_id", "category", "setting_key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_card_access"
    ADD CONSTRAINT "user_card_access_pkey" PRIMARY KEY ("user_id", "card_id");



ALTER TABLE ONLY "public"."user_competencies"
    ADD CONSTRAINT "user_competencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_competencies"
    ADD CONSTRAINT "user_competencies_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_invitation_token_key" UNIQUE ("invitation_token");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."user_two_factor_auth"
    ADD CONSTRAINT "user_two_factor_auth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_two_factor_auth"
    ADD CONSTRAINT "user_two_factor_auth_user_id_method_type_key" UNIQUE ("user_id", "method_type");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_boards"
    ADD CONSTRAINT "workspace_boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_boards"
    ADD CONSTRAINT "workspace_boards_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."workspace_collaborators"
    ADD CONSTRAINT "workspace_collaborators_pkey" PRIMARY KEY ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspace_scenarios"
    ADD CONSTRAINT "workspace_scenarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_activity_logs_created" ON "public"."admin_activity_logs" USING "btree" ("created_at");



CREATE INDEX "idx_admin_activity_logs_org" ON "public"."admin_activity_logs" USING "btree" ("organization_id");



CREATE INDEX "idx_admin_activity_logs_user" ON "public"."admin_activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_combination_feedback_combination" ON "public"."combination_feedback" USING "btree" ("combination_id");



CREATE INDEX "idx_compliance_framework_org" ON "public"."compliance_framework" USING "btree" ("organization_id");



CREATE INDEX "idx_email_analytics_reports_next_run" ON "public"."email_analytics_reports" USING "btree" ("next_run_at") WHERE ("is_enabled" = true);



CREATE INDEX "idx_email_campaigns_status" ON "public"."email_campaigns" USING "btree" ("status");



CREATE INDEX "idx_email_deliverability_date" ON "public"."email_deliverability" USING "btree" ("report_date");



CREATE INDEX "idx_email_notifications_status" ON "public"."email_notifications" USING "btree" ("status");



CREATE INDEX "idx_email_notifications_status_scheduled" ON "public"."email_notifications" USING "btree" ("status", "scheduled_for");



CREATE INDEX "idx_email_notifications_template" ON "public"."email_notifications" USING "btree" ("template_name");



CREATE INDEX "idx_email_notifications_user" ON "public"."email_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_email_preferences_analytics" ON "public"."email_preferences" USING "btree" ("analytics_frequency", "analytics_day_of_week");



CREATE INDEX "idx_email_preferences_user" ON "public"."email_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_email_queue_created" ON "public"."email_queue" USING "btree" ("created_at");



CREATE INDEX "idx_email_queue_status" ON "public"."email_queue" USING "btree" ("status");



CREATE INDEX "idx_email_recipients_active" ON "public"."email_recipients" USING "btree" ("is_active");



CREATE INDEX "idx_email_recipients_email" ON "public"."email_recipients" USING "btree" ("email");



CREATE INDEX "idx_email_templates_active" ON "public"."email_templates" USING "btree" ("is_active");



CREATE INDEX "idx_email_templates_name" ON "public"."email_templates" USING "btree" ("name");



CREATE INDEX "idx_game_sessions_board" ON "public"."game_sessions" USING "btree" ("board_id");



CREATE INDEX "idx_game_sessions_user" ON "public"."game_sessions" USING "btree" ("user_id", "started_at");



CREATE INDEX "idx_hexie_annotations_content" ON "public"."hexie_annotations" USING "gin" ("to_tsvector"('"english"'::"regconfig", "content"));



CREATE INDEX "idx_hexie_annotations_instance" ON "public"."hexie_annotations" USING "btree" ("hexie_instance_id");



CREATE INDEX "idx_hexie_annotations_visibility" ON "public"."hexie_annotations" USING "btree" ("visibility", "safety_level");



CREATE INDEX "idx_hexie_card_tags_hexie" ON "public"."hexie_card_tags" USING "btree" ("hexie_card_id");



CREATE INDEX "idx_hexie_card_tags_tag" ON "public"."hexie_card_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_hexie_cards_active" ON "public"."hexie_cards" USING "btree" ("is_active");



CREATE INDEX "idx_hexie_cards_active_tier" ON "public"."hexie_cards" USING "btree" ("is_active", "subscription_tier_required");



CREATE INDEX "idx_hexie_cards_analytics" ON "public"."hexie_cards" USING "btree" ("organization_id", "created_at", "average_severity");



CREATE INDEX "idx_hexie_cards_archived" ON "public"."hexie_cards" USING "btree" ("is_archived", "archived_at");



CREATE INDEX "idx_hexie_cards_category" ON "public"."hexie_cards" USING "btree" ("category");



CREATE INDEX "idx_hexie_cards_category_active" ON "public"."hexie_cards" USING "btree" ("category", "is_active");



CREATE INDEX "idx_hexie_cards_category_id" ON "public"."hexie_cards" USING "btree" ("category_id");



CREATE INDEX "idx_hexie_cards_created_at" ON "public"."hexie_cards" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_hexie_cards_created_by" ON "public"."hexie_cards" USING "btree" ("created_by");



CREATE INDEX "idx_hexie_cards_is_active" ON "public"."hexie_cards" USING "btree" ("is_active");



CREATE INDEX "idx_hexie_cards_references" ON "public"."hexie_cards" USING "gin" ("references");



CREATE INDEX "idx_hexie_cards_severity" ON "public"."hexie_cards" USING "btree" ("severity_rating", "category");



CREATE INDEX "idx_hexie_cards_subscription_tier" ON "public"."hexie_cards" USING "btree" ("subscription_tier_required");



CREATE INDEX "idx_hexie_cards_tags" ON "public"."hexie_cards" USING "gin" ("tags");



CREATE INDEX "idx_hexie_categories_active" ON "public"."hexie_categories" USING "btree" ("is_active");



CREATE INDEX "idx_hexie_categories_archived" ON "public"."hexie_categories" USING "btree" ("is_archived", "archived_at");



CREATE INDEX "idx_hexie_categories_sort" ON "public"."hexie_categories" USING "btree" ("sort_order");



CREATE INDEX "idx_hexie_combinations_board" ON "public"."hexie_combinations" USING "btree" ("board_id");



CREATE INDEX "idx_interventions_org_status" ON "public"."interventions" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_interventions_stakeholder" ON "public"."interventions" USING "btree" ("stakeholder_role", "status");



CREATE INDEX "idx_ip_allowlist_active" ON "public"."ip_allowlist" USING "btree" ("is_active");



CREATE INDEX "idx_ip_allowlist_org" ON "public"."ip_allowlist" USING "btree" ("organization_id");



CREATE INDEX "idx_mfa_settings_org" ON "public"."mfa_settings" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_org" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_members_user" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_safety_monitoring_severity" ON "public"."safety_monitoring" USING "btree" ("severity_level", "resolved_at");



CREATE INDEX "idx_safety_monitoring_user" ON "public"."safety_monitoring" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_scenario_ratings_scenario" ON "public"."scenario_ratings" USING "btree" ("scenario_id");



CREATE INDEX "idx_scenarios_active" ON "public"."scenarios" USING "btree" ("is_active");



CREATE INDEX "idx_scenarios_category" ON "public"."scenarios" USING "btree" ("category_id");



CREATE INDEX "idx_scenarios_difficulty" ON "public"."scenarios" USING "btree" ("difficulty_level");



CREATE INDEX "idx_scenarios_featured" ON "public"."scenarios" USING "btree" ("is_featured");



CREATE INDEX "idx_security_policies_org" ON "public"."security_policies" USING "btree" ("organization_id");



CREATE INDEX "idx_tags_enabled" ON "public"."tags" USING "btree" ("is_enabled");



CREATE INDEX "idx_tags_name" ON "public"."tags" USING "btree" ("name");



CREATE INDEX "idx_tags_usage_count" ON "public"."tags" USING "btree" ("usage_count" DESC);



CREATE INDEX "idx_user_competencies_role" ON "public"."user_competencies" USING "btree" ("primary_role");



CREATE INDEX "idx_user_competencies_user" ON "public"."user_competencies" USING "btree" ("user_id");



CREATE INDEX "idx_user_interactions_hexie_card" ON "public"."user_interactions" USING "btree" ("hexie_card_id");



CREATE INDEX "idx_user_interactions_severity" ON "public"."user_interactions" USING "btree" ("severity_rating");



CREATE INDEX "idx_user_interactions_timestamps" ON "public"."user_interactions" USING "btree" ("created_at", "intervention_id");



CREATE INDEX "idx_user_interactions_user_time" ON "public"."user_interactions" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_user_interactions_workspace_time" ON "public"."user_interactions" USING "btree" ("workspace_id", "created_at");



CREATE INDEX "idx_user_invitations_email" ON "public"."user_invitations" USING "btree" ("email");



CREATE INDEX "idx_user_invitations_token" ON "public"."user_invitations" USING "btree" ("invitation_token");



CREATE INDEX "idx_user_profiles_org" ON "public"."user_profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_user_sessions_active" ON "public"."user_sessions" USING "btree" ("is_active");



CREATE INDEX "idx_user_sessions_user" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_users_admin" ON "public"."users" USING "btree" ("is_admin");



CREATE INDEX "idx_users_archived" ON "public"."users" USING "btree" ("is_archived");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_id" ON "public"."users" USING "btree" ("id");



CREATE INDEX "idx_users_is_admin" ON "public"."users" USING "btree" ("is_admin");



CREATE INDEX "idx_users_role_id" ON "public"."users" USING "btree" ("role_id");



CREATE INDEX "idx_users_subscription" ON "public"."users" USING "btree" ("subscription_status", "subscription_tier");



CREATE INDEX "idx_users_subscription_plan_id" ON "public"."users" USING "btree" ("subscription_plan_id");



CREATE INDEX "idx_workspace_boards_session" ON "public"."workspace_boards" USING "btree" ("session_id");



CREATE INDEX "idx_workspace_boards_workspace" ON "public"."workspace_boards" USING "btree" ("workspace_id");



CREATE INDEX "idx_workspace_scenarios_workspace" ON "public"."workspace_scenarios" USING "btree" ("workspace_id");



CREATE OR REPLACE VIEW "public"."hexie_cards_with_tags" AS
 SELECT "hc"."id",
    "hc"."title",
    "hc"."front_text",
    "hc"."back_text",
    "hc"."category",
    "hc"."color_scheme",
    "hc"."icon_svg",
    "hc"."subscription_tier_required",
    "hc"."is_active",
    "hc"."created_by",
    "hc"."created_at",
    "hc"."updated_at",
    "hc"."references",
    "hc"."category_id",
    "hc"."card_references",
    "hc"."is_archived",
    "hc"."archived_at",
    "hc"."archived_by",
    "hc"."antipattern_type_id",
    "hc"."severity_indicators",
    "hc"."intervention_strategies",
    "hc"."tags",
    "hc"."severity_rating",
    "hc"."environmental_factors",
    "hc"."psychological_framework",
    "hc"."subcategory",
    "hc"."organization_id",
    "hc"."usage_count",
    "hc"."last_used_at",
    "hc"."average_severity",
    "hc"."total_interactions",
    COALESCE("array_agg"("t"."name") FILTER (WHERE ("t"."name" IS NOT NULL)), ARRAY[]::"text"[]) AS "tag_names"
   FROM (("public"."hexie_cards" "hc"
     LEFT JOIN "public"."hexie_card_tags" "hct" ON (("hc"."id" = "hct"."hexie_card_id")))
     LEFT JOIN "public"."tags" "t" ON (("hct"."tag_id" = "t"."id")))
  GROUP BY "hc"."id";



CREATE OR REPLACE TRIGGER "update_hexie_annotations_updated_at" BEFORE UPDATE ON "public"."hexie_annotations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_hexie_categories_updated_at" BEFORE UPDATE ON "public"."hexie_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tag_usage_trigger" AFTER INSERT OR DELETE ON "public"."hexie_card_tags" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_tag_usage"();



CREATE OR REPLACE TRIGGER "update_user_competencies_updated_at" BEFORE UPDATE ON "public"."user_competencies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workspace_boards_updated_at" BEFORE UPDATE ON "public"."workspace_boards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."combination_feedback"
    ADD CONSTRAINT "combination_feedback_combination_id_fkey" FOREIGN KEY ("combination_id") REFERENCES "public"."hexie_combinations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."combination_feedback"
    ADD CONSTRAINT "combination_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_framework"
    ADD CONSTRAINT "compliance_framework_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_framework"
    ADD CONSTRAINT "compliance_framework_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."custom_scenarios"
    ADD CONSTRAINT "custom_scenarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."workspace_boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hexie_annotations"
    ADD CONSTRAINT "hexie_annotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hexie_annotations"
    ADD CONSTRAINT "hexie_annotations_hexie_instance_id_fkey" FOREIGN KEY ("hexie_instance_id") REFERENCES "public"."hexie_instances"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hexie_card_tags"
    ADD CONSTRAINT "hexie_card_tags_hexie_card_id_fkey" FOREIGN KEY ("hexie_card_id") REFERENCES "public"."hexie_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hexie_card_tags"
    ADD CONSTRAINT "hexie_card_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hexie_cards"
    ADD CONSTRAINT "hexie_cards_antipattern_type_id_fkey" FOREIGN KEY ("antipattern_type_id") REFERENCES "public"."antipattern_types"("id");



ALTER TABLE ONLY "public"."hexie_cards"
    ADD CONSTRAINT "hexie_cards_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hexie_cards"
    ADD CONSTRAINT "hexie_cards_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."hexie_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hexie_cards"
    ADD CONSTRAINT "hexie_cards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hexie_categories"
    ADD CONSTRAINT "hexie_categories_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."hexie_categories"
    ADD CONSTRAINT "hexie_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hexie_combinations"
    ADD CONSTRAINT "hexie_combinations_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."workspace_boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hexie_combinations"
    ADD CONSTRAINT "hexie_combinations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intervention_participants"
    ADD CONSTRAINT "intervention_participants_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intervention_participants"
    ADD CONSTRAINT "intervention_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."intervention_progress"
    ADD CONSTRAINT "intervention_progress_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."intervention_progress"
    ADD CONSTRAINT "intervention_progress_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "public"."interventions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ip_allowlist"
    ADD CONSTRAINT "ip_allowlist_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ip_allowlist"
    ADD CONSTRAINT "ip_allowlist_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mfa_settings"
    ADD CONSTRAINT "mfa_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mfa_settings"
    ADD CONSTRAINT "mfa_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."miro_sessions"
    ADD CONSTRAINT "miro_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."safety_monitoring"
    ADD CONSTRAINT "safety_monitoring_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."safety_monitoring"
    ADD CONSTRAINT "safety_monitoring_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenario_categories"
    ADD CONSTRAINT "scenario_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."scenario_ratings"
    ADD CONSTRAINT "scenario_ratings_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenario_ratings"
    ADD CONSTRAINT "scenario_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenarios"
    ADD CONSTRAINT "scenarios_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."scenario_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scenarios"
    ADD CONSTRAINT "scenarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."security_policies"
    ADD CONSTRAINT "security_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."security_policies"
    ADD CONSTRAINT "security_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_policies"
    ADD CONSTRAINT "security_policies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_card_access"
    ADD CONSTRAINT "user_card_access_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."hexie_cards"("id");



ALTER TABLE ONLY "public"."user_card_access"
    ADD CONSTRAINT "user_card_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_competencies"
    ADD CONSTRAINT "user_competencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_hexie_card_id_fkey" FOREIGN KEY ("hexie_card_id") REFERENCES "public"."hexie_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interactions"
    ADD CONSTRAINT "user_interactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_two_factor_auth"
    ADD CONSTRAINT "user_two_factor_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."workspace_boards"
    ADD CONSTRAINT "workspace_boards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_boards"
    ADD CONSTRAINT "workspace_boards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_collaborators"
    ADD CONSTRAINT "workspace_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_collaborators"
    ADD CONSTRAINT "workspace_collaborators_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_scenarios"
    ADD CONSTRAINT "workspace_scenarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_scenarios"
    ADD CONSTRAINT "workspace_scenarios_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE SET NULL;



ALTER TABLE "public"."admin_activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_activity_logs_policy" ON "public"."admin_activity_logs" FOR SELECT USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE (("organization_members"."user_id" = "auth"."uid"()) AND ("organization_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "admin_activity_logs_simple" ON "public"."admin_activity_logs" FOR SELECT USING (true);



ALTER TABLE "public"."admin_emails" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_emails_policy" ON "public"."admin_emails" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true) AND (COALESCE("users"."is_archived", false) = false)))));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_policy" ON "public"."audit_logs" USING ("public"."is_admin_user"());



ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_framework" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "compliance_framework_simple" ON "public"."compliance_framework" USING (true);



ALTER TABLE "public"."custom_scenarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "custom_scenarios_policy" ON "public"."custom_scenarios" USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."is_admin_user"() OR ("created_by" = "auth"."uid"()))));



ALTER TABLE "public"."email_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_notifications_policy" ON "public"."email_notifications" USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."is_admin_user"() OR ("user_id" = "auth"."uid"()))));



ALTER TABLE "public"."game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hexie_annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hexie_card_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hexie_card_tags_delete_policy" ON "public"."hexie_card_tags" FOR DELETE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."is_admin_user"() OR (EXISTS ( SELECT 1
   FROM "public"."hexie_cards"
  WHERE (("hexie_cards"."id" = "hexie_card_tags"."hexie_card_id") AND ("hexie_cards"."created_by" = "auth"."uid"())))))));



CREATE POLICY "hexie_card_tags_demo_access" ON "public"."hexie_card_tags" FOR SELECT USING (("hexie_card_id" IN ( SELECT "hexie_cards"."id"
   FROM "public"."hexie_cards"
  WHERE (("hexie_cards"."subscription_tier_required" = 'free'::"text") AND ("hexie_cards"."is_active" = true) AND ("hexie_cards"."is_archived" = false)))));



CREATE POLICY "hexie_card_tags_insert_policy" ON "public"."hexie_card_tags" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("public"."is_admin_user"() OR (EXISTS ( SELECT 1
   FROM "public"."hexie_cards"
  WHERE (("hexie_cards"."id" = "hexie_card_tags"."hexie_card_id") AND ("hexie_cards"."created_by" = "auth"."uid"())))))));



CREATE POLICY "hexie_card_tags_read_policy" ON "public"."hexie_card_tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."hexie_cards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hexie_cards_delete_policy" ON "public"."hexie_cards" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "hexie_cards_demo_access" ON "public"."hexie_cards" FOR SELECT USING (((("subscription_tier_required" = 'free'::"text") AND ("is_active" = true) AND ("is_archived" = false)) OR (("auth"."uid"() IS NOT NULL) AND ("created_by" = "auth"."uid"())) OR (("is_active" = true) AND ("is_archived" = false))));



CREATE POLICY "hexie_cards_insert_policy" ON "public"."hexie_cards" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("public"."is_admin_user"() OR ("created_by" = "auth"."uid"()))));



CREATE POLICY "hexie_cards_read_policy" ON "public"."hexie_cards" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("is_active" = true) OR "public"."is_admin_user"() OR ("created_by" = "auth"."uid"()))));



CREATE POLICY "hexie_cards_update_policy" ON "public"."hexie_cards" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."is_admin_user"() OR ("created_by" = "auth"."uid"()))));



ALTER TABLE "public"."hexie_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hexie_categories_demo_access" ON "public"."hexie_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "hexie_categories_modify_policy" ON "public"."hexie_categories" USING ("public"."is_admin_user"());



CREATE POLICY "hexie_categories_read_policy" ON "public"."hexie_categories" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."hexie_combinations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intervention_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intervention_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interventions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ip_allowlist" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ip_allowlist_simple" ON "public"."ip_allowlist" USING (true);



ALTER TABLE "public"."mfa_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mfa_settings_simple" ON "public"."mfa_settings" USING (true);



ALTER TABLE "public"."miro_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organization_members_policy" ON "public"."organization_members" USING ((("user_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "organization_members_1"."organization_id"
   FROM "public"."organization_members" "organization_members_1"
  WHERE (("organization_members_1"."user_id" = "auth"."uid"()) AND ("organization_members_1"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "organization_members_simple" ON "public"."organization_members" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."safety_monitoring" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scenario_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scenario_categories_delete_policy" ON "public"."scenario_categories" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "scenario_categories_insert_policy" ON "public"."scenario_categories" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "scenario_categories_read_policy" ON "public"."scenario_categories" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "scenario_categories_update_policy" ON "public"."scenario_categories" FOR UPDATE USING ("public"."is_admin_user"());



ALTER TABLE "public"."scenario_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scenarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scenarios_delete_policy" ON "public"."scenarios" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "scenarios_insert_policy" ON "public"."scenarios" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "scenarios_read_policy" ON "public"."scenarios" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "scenarios_update_policy" ON "public"."scenarios" FOR UPDATE USING ("public"."is_admin_user"());



ALTER TABLE "public"."security_policies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_policies_simple" ON "public"."security_policies" USING (true);



ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscription_plans_delete_policy" ON "public"."subscription_plans" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "subscription_plans_insert_policy" ON "public"."subscription_plans" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "subscription_plans_read_policy" ON "public"."subscription_plans" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "subscription_plans_update_policy" ON "public"."subscription_plans" FOR UPDATE USING ("public"."is_admin_user"());



ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "system_settings_policy" ON "public"."system_settings" USING (("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE (("organization_members"."user_id" = "auth"."uid"()) AND ("organization_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"]))))));



CREATE POLICY "system_settings_simple" ON "public"."system_settings" USING (true);



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_delete_policy" ON "public"."tags" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "tags_demo_access" ON "public"."tags" FOR SELECT USING (("is_enabled" = true));



CREATE POLICY "tags_insert_policy" ON "public"."tags" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "tags_read_policy" ON "public"."tags" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "tags_update_policy" ON "public"."tags" FOR UPDATE USING ("public"."is_admin_user"());



ALTER TABLE "public"."user_card_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_competencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_invitations_delete_policy" ON "public"."user_invitations" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "user_invitations_insert_policy" ON "public"."user_invitations" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "user_invitations_read_policy" ON "public"."user_invitations" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("public"."is_admin_user"() OR (("email")::"text" = "auth"."email"()))));



CREATE POLICY "user_invitations_update_policy" ON "public"."user_invitations" FOR UPDATE USING ("public"."is_admin_user"());



ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_policy" ON "public"."user_profiles" USING ((("user_id" = "auth"."uid"()) OR ("organization_id" IN ( SELECT "organization_members"."organization_id"
   FROM "public"."organization_members"
  WHERE (("organization_members"."user_id" = "auth"."uid"()) AND ("organization_members"."role" = ANY (ARRAY['admin'::"text", 'owner'::"text"])))))));



CREATE POLICY "user_profiles_simple" ON "public"."user_profiles" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_policy" ON "public"."user_roles" USING ("public"."is_admin_user"());



ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_sessions_policy" ON "public"."user_sessions" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_sessions_simple" ON "public"."user_sessions" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."user_two_factor_auth" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_two_factor_auth_policy" ON "public"."user_two_factor_auth" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_two_factor_auth_simple" ON "public"."user_two_factor_auth" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete_policy" ON "public"."users" FOR DELETE USING ("public"."is_admin_user"());



CREATE POLICY "users_insert_policy" ON "public"."users" FOR INSERT WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "users_read_policy" ON "public"."users" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("id" = "auth"."uid"()) OR "public"."is_admin_user"())));



CREATE POLICY "users_update_policy" ON "public"."users" FOR UPDATE USING ((("auth"."role"() = 'authenticated'::"text") AND (("id" = "auth"."uid"()) OR "public"."is_admin_user"())));



ALTER TABLE "public"."workspace_boards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_scenarios" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































































































































REVOKE ALL ON FUNCTION "public"."archive_hexie_card"("card_id" "uuid", "user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_hexie_card"("card_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_hexie_card"("card_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_hexie_card"("card_id" "uuid", "user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."archive_user_simple"("target_user_id" "uuid", "archived_by_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_user_simple"("target_user_id" "uuid", "archived_by_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_user_simple"("target_user_id" "uuid", "archived_by_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_user_simple"("target_user_id" "uuid", "archived_by_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."calculate_dynamic_severity"("base_severity" integer, "frequency_score" integer, "impact_score" integer, "context_factors" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_dynamic_severity"("base_severity" integer, "frequency_score" integer, "impact_score" integer, "context_factors" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_dynamic_severity"("base_severity" integer, "frequency_score" integer, "impact_score" integer, "context_factors" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_dynamic_severity"("base_severity" integer, "frequency_score" integer, "impact_score" integer, "context_factors" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."clean_old_audit_logs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clean_old_audit_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_old_audit_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_old_audit_logs"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cleanup_archived_cards"("days_old" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_archived_cards"("days_old" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_archived_cards"("days_old" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_archived_cards"("days_old" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_intervention"("p_organization_id" "uuid", "p_title" "text", "p_description" "text", "p_target_pattern" "text", "p_category" "text", "p_stakeholder_role" "text", "p_start_date" "date", "p_target_severity_reduction" integer, "p_target_frequency_reduction" integer, "p_participants_count" integer, "p_budget_allocated" numeric, "p_created_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_intervention"("p_organization_id" "uuid", "p_title" "text", "p_description" "text", "p_target_pattern" "text", "p_category" "text", "p_stakeholder_role" "text", "p_start_date" "date", "p_target_severity_reduction" integer, "p_target_frequency_reduction" integer, "p_participants_count" integer, "p_budget_allocated" numeric, "p_created_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_intervention"("p_organization_id" "uuid", "p_title" "text", "p_description" "text", "p_target_pattern" "text", "p_category" "text", "p_stakeholder_role" "text", "p_start_date" "date", "p_target_severity_reduction" integer, "p_target_frequency_reduction" integer, "p_participants_count" integer, "p_budget_allocated" numeric, "p_created_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_intervention"("p_organization_id" "uuid", "p_title" "text", "p_description" "text", "p_target_pattern" "text", "p_category" "text", "p_stakeholder_role" "text", "p_start_date" "date", "p_target_severity_reduction" integer, "p_target_frequency_reduction" integer, "p_participants_count" integer, "p_budget_allocated" numeric, "p_created_by" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."extend_auth_user_to_profile"("auth_user_id" "uuid", "user_email" "text", "user_subscription_tier" "text", "user_subscription_status" "text", "user_is_admin" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."extend_auth_user_to_profile"("auth_user_id" "uuid", "user_email" "text", "user_subscription_tier" "text", "user_subscription_status" "text", "user_is_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."extend_auth_user_to_profile"("auth_user_id" "uuid", "user_email" "text", "user_subscription_tier" "text", "user_subscription_status" "text", "user_is_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."extend_auth_user_to_profile"("auth_user_id" "uuid", "user_email" "text", "user_subscription_tier" "text", "user_subscription_status" "text", "user_is_admin" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_behavior_patterns"("start_date" timestamp with time zone, "min_sample_size" integer, "stakeholder_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_behavior_patterns"("start_date" timestamp with time zone, "min_sample_size" integer, "stakeholder_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_behavior_patterns"("start_date" timestamp with time zone, "min_sample_size" integer, "stakeholder_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_behavior_patterns"("start_date" timestamp with time zone, "min_sample_size" integer, "stakeholder_role" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_hexie_tags"("hexie_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_hexie_tags"("hexie_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_hexie_tags"("hexie_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hexie_tags"("hexie_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_interventions_by_role"("p_organization_id" "uuid", "p_stakeholder_role" "text", "p_status_filter" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_interventions_by_role"("p_organization_id" "uuid", "p_stakeholder_role" "text", "p_status_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_interventions_by_role"("p_organization_id" "uuid", "p_stakeholder_role" "text", "p_status_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_interventions_by_role"("p_organization_id" "uuid", "p_stakeholder_role" "text", "p_status_filter" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_organizational_heatmap"("org_id" "text", "aggregation_level" "text", "min_group_size" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_organizational_heatmap"("org_id" "text", "aggregation_level" "text", "min_group_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_organizational_heatmap"("org_id" "text", "aggregation_level" "text", "min_group_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organizational_heatmap"("org_id" "text", "aggregation_level" "text", "min_group_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_stakeholder_metrics"("role" "text", "org_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_stakeholder_metrics"("role" "text", "org_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_stakeholder_metrics"("role" "text", "org_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stakeholder_metrics"("role" "text", "org_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin_by_email"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin_by_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_by_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_by_email"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."queue_email"("p_template_name" character varying, "p_recipient_email" character varying, "p_recipient_name" character varying, "p_subject" character varying, "p_template_variables" "jsonb", "p_user_id" "uuid", "p_scheduled_for" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."queue_email"("p_template_name" character varying, "p_recipient_email" character varying, "p_recipient_name" character varying, "p_subject" character varying, "p_template_variables" "jsonb", "p_user_id" "uuid", "p_scheduled_for" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."queue_email"("p_template_name" character varying, "p_recipient_email" character varying, "p_recipient_name" character varying, "p_subject" character varying, "p_template_variables" "jsonb", "p_user_id" "uuid", "p_scheduled_for" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."queue_email"("p_template_name" character varying, "p_recipient_email" character varying, "p_recipient_name" character varying, "p_subject" character varying, "p_template_variables" "jsonb", "p_user_id" "uuid", "p_scheduled_for" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."restore_hexie_card"("card_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_hexie_card"("card_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_hexie_card"("card_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_hexie_card"("card_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."restore_user_simple"("target_user_id" "uuid", "restored_by_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."restore_user_simple"("target_user_id" "uuid", "restored_by_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_user_simple"("target_user_id" "uuid", "restored_by_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_user_simple"("target_user_id" "uuid", "restored_by_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."sanitize_text"("input_text" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sanitize_text"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sanitize_text"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sanitize_text"("input_text" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."search_hexies_by_tags"("tag_names" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."search_hexies_by_tags"("tag_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."search_hexies_by_tags"("tag_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_hexies_by_tags"("tag_names" "text"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."trigger_update_tag_usage"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_update_tag_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_tag_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_tag_usage"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_competency_score"("p_user_id" "uuid", "p_competency" "text", "p_points" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_competency_score"("p_user_id" "uuid", "p_competency" "text", "p_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_competency_score"("p_user_id" "uuid", "p_competency" "text", "p_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_competency_score"("p_user_id" "uuid", "p_competency" "text", "p_points" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_tag_usage_count"("tag_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_tag_usage_count"("tag_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_tag_usage_count"("tag_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_tag_usage_count"("tag_uuid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_updated_at_column"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_emails" TO "anon";
GRANT ALL ON TABLE "public"."admin_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_emails" TO "service_role";



GRANT ALL ON TABLE "public"."antipattern_types" TO "anon";
GRANT ALL ON TABLE "public"."antipattern_types" TO "authenticated";
GRANT ALL ON TABLE "public"."antipattern_types" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."collections" TO "anon";
GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";



GRANT ALL ON TABLE "public"."combination_feedback" TO "anon";
GRANT ALL ON TABLE "public"."combination_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."combination_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_framework" TO "anon";
GRANT ALL ON TABLE "public"."compliance_framework" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_framework" TO "service_role";



GRANT ALL ON TABLE "public"."custom_scenarios" TO "anon";
GRANT ALL ON TABLE "public"."custom_scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."email_analytics_reports" TO "anon";
GRANT ALL ON TABLE "public"."email_analytics_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."email_analytics_reports" TO "service_role";



GRANT ALL ON TABLE "public"."email_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."email_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."email_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."email_deliverability" TO "anon";
GRANT ALL ON TABLE "public"."email_deliverability" TO "authenticated";
GRANT ALL ON TABLE "public"."email_deliverability" TO "service_role";



GRANT ALL ON TABLE "public"."email_notifications" TO "anon";
GRANT ALL ON TABLE "public"."email_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."email_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."email_preferences" TO "anon";
GRANT ALL ON TABLE "public"."email_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."email_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."email_queue" TO "anon";
GRANT ALL ON TABLE "public"."email_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."email_queue" TO "service_role";



GRANT ALL ON TABLE "public"."email_recipients" TO "anon";
GRANT ALL ON TABLE "public"."email_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."email_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."game_sessions" TO "anon";
GRANT ALL ON TABLE "public"."game_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."hexie_annotations" TO "anon";
GRANT ALL ON TABLE "public"."hexie_annotations" TO "authenticated";
GRANT ALL ON TABLE "public"."hexie_annotations" TO "service_role";



GRANT ALL ON TABLE "public"."hexie_card_tags" TO "anon";
GRANT ALL ON TABLE "public"."hexie_card_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."hexie_card_tags" TO "service_role";



GRANT ALL ON TABLE "public"."hexie_cards" TO "anon";
GRANT ALL ON TABLE "public"."hexie_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."hexie_cards" TO "service_role";



GRANT ALL ON TABLE "public"."hexie_cards_with_tags" TO "anon";
GRANT ALL ON TABLE "public"."hexie_cards_with_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."hexie_cards_with_tags" TO "service_role";



GRANT ALL ON TABLE "public"."hexie_categories" TO "anon";
GRANT ALL ON TABLE "public"."hexie_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."hexie_categories" TO "service_role";



GRANT ALL ON TABLE "public"."hexie_combinations" TO "anon";
GRANT ALL ON TABLE "public"."hexie_combinations" TO "authenticated";
GRANT ALL ON TABLE "public"."hexie_combinations" TO "service_role";



GRANT ALL ON TABLE "public"."hexie_instances" TO "anon";
GRANT ALL ON TABLE "public"."hexie_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."hexie_instances" TO "service_role";



GRANT ALL ON TABLE "public"."intervention_participants" TO "anon";
GRANT ALL ON TABLE "public"."intervention_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."intervention_participants" TO "service_role";



GRANT ALL ON TABLE "public"."intervention_progress" TO "anon";
GRANT ALL ON TABLE "public"."intervention_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."intervention_progress" TO "service_role";



GRANT ALL ON TABLE "public"."interventions" TO "anon";
GRANT ALL ON TABLE "public"."interventions" TO "authenticated";
GRANT ALL ON TABLE "public"."interventions" TO "service_role";



GRANT ALL ON TABLE "public"."ip_allowlist" TO "anon";
GRANT ALL ON TABLE "public"."ip_allowlist" TO "authenticated";
GRANT ALL ON TABLE "public"."ip_allowlist" TO "service_role";



GRANT ALL ON TABLE "public"."mfa_settings" TO "anon";
GRANT ALL ON TABLE "public"."mfa_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."mfa_settings" TO "service_role";



GRANT ALL ON TABLE "public"."miro_sessions" TO "anon";
GRANT ALL ON TABLE "public"."miro_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."miro_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."safety_monitoring" TO "anon";
GRANT ALL ON TABLE "public"."safety_monitoring" TO "authenticated";
GRANT ALL ON TABLE "public"."safety_monitoring" TO "service_role";



GRANT ALL ON TABLE "public"."scenario_categories" TO "anon";
GRANT ALL ON TABLE "public"."scenario_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."scenario_categories" TO "service_role";



GRANT ALL ON TABLE "public"."scenario_ratings" TO "anon";
GRANT ALL ON TABLE "public"."scenario_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."scenario_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."scenarios" TO "anon";
GRANT ALL ON TABLE "public"."scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."schema_migrations" TO "anon";
GRANT ALL ON TABLE "public"."schema_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."security_policies" TO "anon";
GRANT ALL ON TABLE "public"."security_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."security_policies" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_features" TO "anon";
GRANT ALL ON TABLE "public"."subscription_features" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_features" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."support_resources" TO "anon";
GRANT ALL ON TABLE "public"."support_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."support_resources" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_card_access" TO "anon";
GRANT ALL ON TABLE "public"."user_card_access" TO "authenticated";
GRANT ALL ON TABLE "public"."user_card_access" TO "service_role";



GRANT ALL ON TABLE "public"."user_competencies" TO "anon";
GRANT ALL ON TABLE "public"."user_competencies" TO "authenticated";
GRANT ALL ON TABLE "public"."user_competencies" TO "service_role";



GRANT ALL ON TABLE "public"."user_interactions" TO "anon";
GRANT ALL ON TABLE "public"."user_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_invitations" TO "anon";
GRANT ALL ON TABLE "public"."user_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_two_factor_auth" TO "anon";
GRANT ALL ON TABLE "public"."user_two_factor_auth" TO "authenticated";
GRANT ALL ON TABLE "public"."user_two_factor_auth" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_boards" TO "anon";
GRANT ALL ON TABLE "public"."workspace_boards" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_boards" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_collaborators" TO "anon";
GRANT ALL ON TABLE "public"."workspace_collaborators" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_collaborators" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_scenarios" TO "anon";
GRANT ALL ON TABLE "public"."workspace_scenarios" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_scenarios" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" REVOKE ALL ON FUNCTIONS  FROM PUBLIC;



























RESET ALL;
