# Database Schema Analysis for AIBTCDev

## 1. Table Relationships

### Primary Table

- `user_profiles`: Core table that all other tables reference via `stx_address`

### Direct Relationships (Parent → Child)

1. user_profiles → user_socials

   - One-to-Many: One profile can have multiple social accounts
   - Connected via `stx_address`
   - CASCADE delete

2. user_profiles → user_crews

   - One-to-Many: One profile can have multiple crews
   - Connected via `stx_address`
   - CASCADE delete

3. user_crews → user_agents

   - One-to-Many: One crew can have multiple agents
   - Connected via `crew_id` and `stx_address`
   - CASCADE delete

4. user_crews → user_tasks

   - One-to-Many: One crew can have multiple tasks
   - Connected via `crew_id` and `stx_address`
   - CASCADE delete

5. user_profiles → user_conversations

   - One-to-Many: One profile can have multiple conversations
   - Connected via `stx_address`
   - CASCADE delete

6. user_crews → user_crew_executions

   - One-to-Many: One crew can have multiple executions
   - Connected via `crew_id` and `stx_address`
   - CASCADE delete

7. user_conversations → user_crew_executions

   - One-to-Many: One conversation can have multiple executions
   - Connected via `conversation_id`
   - CASCADE delete

8. user_crew_executions → user_crew_execution_steps

   - One-to-Many: One execution can have multiple steps
   - Connected via `execution_id`, `crew_id`, and `stx_address`
   - CASCADE delete

9. user_crews → user_crons
   - One-to-One: One crew can have one cron configuration
   - Connected via `crew_id` and `stx_address`
   - CASCADE delete

## 2. Indexes and Triggers

### Common Indexes Across All Tables

- Primary Key (`id`)
- `stx_address`
- `created_at` (on select tables)

### Table-Specific Indexes

1. user_profiles

   - `user_role`
   - `account_index`
   - `bns_address`

2. user_socials

   - `platform`
   - `platform_id`

3. user_crews

   - `crew_name`

4. user_crew_execution_steps

   - `step_type`

5. user_crons
   - `cron_enabled`

### Triggers

1. Timestamp Updates

   - All tables have an `update_*_timestamp` trigger
   - Updates `updated_at` to `CURRENT_TIMESTAMP` on record modification

2. Specialized Triggers
   - `increment_execution_count`: Increments `crew_executions` in user_crews
   - `sync_crew_cron_status`: Syncs `crew_is_cron` with cron_enabled
   - `sync_crew_cron_status_insert`: Sets initial cron status
   - `sync_crew_cron_status_delete`: Resets cron status on deletion

## 3. Column Constraints

### NOT NULL Constraints

1. user_profiles

   - `user_role`
   - `stx_address` (also UNIQUE)

2. user_socials

   - `stx_address`
   - `platform`
   - `platform_id`

3. user_crews

   - `stx_address`
   - `crew_name`

4. user_agents

   - `stx_address`
   - `crew_id`
   - `agent_name`
   - `agent_role`
   - `agent_goal`
   - `agent_backstory`

5. user_tasks

   - All columns except `id`, `created_at`, `updated_at`

6. user_conversations

   - `stx_address`
   - `conversation_name`

7. user_crew_executions

   - `stx_address`
   - `crew_id`
   - `conversation_id`

8. user_crew_execution_steps

   - `stx_address`
   - `crew_id`
   - `execution_id`
   - `step_type`
   - `step_data`

9. user_crons
   - `stx_address`
   - `crew_id`
   - `cron_enabled`
   - `cron_interval`
   - `cron_input`

### Default Values

- All tables: `created_at` and `updated_at` default to `CURRENT_TIMESTAMP`
- user_crews: `crew_executions` defaults to 0
- user_crews: `crew_is_public` and `crew_is_cron` default to 0
- user_crons: `cron_enabled` defaults to 0

## 4. Recommendations for Improvement

### Data Integrity

1. Consider adding CHECK constraints for:

   - `user_role` valid values
   - `platform` valid values in user_socials
   - `step_type` valid values in execution_steps
   - `cron_interval` format validation

2. Add constraints for numeric fields:
   - `total_tokens` > 0
   - `successful_requests` >= 0
   - `crew_executions` >= 0

### Performance

1. Consider composite indexes for common query patterns:

   - (stx_address, created_at)
   - (crew_id, created_at)
   - (execution_id, step_type)

2. Add indexes for range queries:
   - user_crons: (cron_enabled, cron_next_run)

### Schema Design

1. Consider splitting large text fields into separate tables:

   - agent_backstory
   - task_description
   - step_data

2. Add versioning support:
   - Version columns for crews, agents, and tasks
   - History tables for tracking changes

### Maintenance

1. Add documentation tables:

   - Table descriptions
   - Column descriptions
   - Constraint explanations

2. Implement cleanup procedures:
   - Archival strategy for old executions
   - Cleanup triggers for orphaned records
