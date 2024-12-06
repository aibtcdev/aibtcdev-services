-- Create user profile table
-- This serves as the base for everything else.
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- updated by trigger
    user_role TEXT NOT NULL, -- Admin, Viewer, Sprint-1, Sprint-2, etc
    account_index INTEGER, -- can auto-assign from id after migration
    stx_address TEXT NOT NULL UNIQUE, -- can populate from loading wallet at index
    bns_address TEXT, -- can populate by querying aibtcdev-cache
);
-- Define indexes for faster lookups on data we expect to query
CREATE INDEX idx_profiles_user_role ON user_profiles(user_role);
CREATE INDEX idx_profiles_account_index ON user_profiles(account_index);
CREATE INDEX idx_profiles_stx_address ON user_profiles(stx_address);
CREATE INDEX idx_profiles_bns_address ON user_profiles(bns_address);


-- Create user social accounts table
-- compare to current Telegram table, what else is needed?
CREATE TABLE user_socials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- updated by trigger
    profile_id TEXT NOT NULL, -- link to user_profiles
    platform TEXT, -- Twitter, Telegram, Discord, etc
    platform_id TEXT, -- ID on the platform, can build links
    user_email TEXT, -- optional, but why not
    FOREIGN KEY (profile_id) REFERENCES user_profiles(user_stx_address) ON DELETE CASCADE
);
-- Define indexes
CREATE INDEX idx_socials_profile_id ON user_socials(profile_id);
CREATE INDEX idx_socials_platform ON user_socials(platform);
CREATE INDEX idx_socials_platform_id ON user_socials(platform_id);
CREATE INDEX idx_socials_user_email ON user_socials(user_email);


-- Create user crews table
CREATE TABLE user_crews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- updated by trigger
    profile_id TEXT NOT NULL, -- link to user_profiles
    crew_name TEXT NOT NULL,
    crew_description TEXT,
    crew_executions INTEGER DEFAULT 0, -- handled by trigger
    crew_is_public BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(user_stx_address) ON DELETE CASCADE
);
-- Define indexes
CREATE INDEX idx_crews_profile_id ON user_crews(profile_id);
CREATE INDEX idx_crews_crew_name ON user_crews(crew_name);


-- Create user agents table
CREATE TABLE user_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- updated by trigger
    profile_id TEXT NOT NULL, -- link to user_profiles
    crew_id INTEGER NOT NULL, -- link to user_crews
    agent_name TEXT NOT NULL,
    agent_role TEXT NOT NULL,
    agent_goal TEXT NOT NULL,
    agent_backstory TEXT NOT NULL,
    agent_tools TEXT[],
    FOREIGN KEY (profile_id) REFERENCES user_profiles(user_stx_address) ON DELETE CASCADE,
    FOREIGN KEY (crew_id) REFERENCES user_crews(id) ON DELETE CASCADE
);
-- Define indexes
CREATE INDEX idx_agents_profile_id ON user_agents(profile_id);
CREATE INDEX idx_agents_crew_id ON user_agents(crew_id);


-- Create user tasks table
CREATE TABLE user_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- updated by trigger
    profile_id TEXT NOT NULL, -- link to user_profiles
    crew_id INTEGER NOT NULL, -- link to user_crews
    agent_id INTEGER NOT NULL, -- link to user_agents
    task_name TEXT NOT NULL,
    task_description TEXT NOT NULL,
    task_expected_output TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(user_stx_address) ON DELETE CASCADE,
    FOREIGN KEY (crew_id) REFERENCES user_crews(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES user_agents(id) ON DELETE CASCADE
);
-- Define indexes
CREATE INDEX idx_tasks_profile_id ON user_tasks(profile_id);
CREATE INDEX idx_tasks_crew_id ON user_tasks(crew_id);
CREATE INDEX idx_tasks_agent_id ON user_tasks(agent_id);


-- Create user conversations table
CREATE TABLE user_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- updated by trigger
    profile_id TEXT NOT NULL, -- link to user_profiles
    conversation_name TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(user_stx_address) ON DELETE CASCADE
);
-- Define indexes
CREATE INDEX idx_conversations_profile_id ON user_conversations(profile_id);


-- Create crew executions table (formerly jobs)
CREATE TABLE user_crew_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    profile_id TEXT NOT NULL, -- link to user_profiles
    crew_id INTEGER NOT NULL, -- link to user_crews
    conversation_id INTEGER NOT NULL, -- link to user_conversations
    user_input TEXT,
    final_result TEXT,
    total_tokens INTEGER,
    successful_requests INTEGER,
    FOREIGN KEY (profile_id) REFERENCES user_profiles(user_stx_address) ON DELETE CASCADE,
    FOREIGN KEY (crew_id) REFERENCES user_crews(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES user_conversations(id) ON DELETE CASCADE
);
-- Define indexes
CREATE INDEX idx_executions_profile_id ON user_executions(profile_id);
CREATE INDEX idx_executions_crew_id ON user_executions(crew_id);
CREATE INDEX idx_executions_conversation_id ON user_executions(conversation_id);


-- Create crew steps table
CREATE TABLE user_crew_execution_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    crew_id INTEGER NOT NULL, -- link to user_crews
    execution_id INTEGER NOT NULL, -- link to user_crew_executions
    step_type TEXT NOT NULL, -- Thought, Action, Tool Output, Final Answer, etc
    step_data TEXT NOT NULL, -- Actual output to parse
    FOREIGN KEY (crew_id) REFERENCES user_crews(id) ON DELETE CASCADE
    FOREIGN KEY (execution_id) REFERENCES user_crew_executions(id) ON DELETE CASCADE
)

-- Trigger to increment execution count on user_crews
CREATE TRIGGER increment_execution_count
AFTER INSERT ON user_executions
BEGIN
    UPDATE user_crews 
    SET execution_count = execution_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.crew_id;
END;

-- Triggers for updating timestamps

CREATE TRIGGER update_profiles_timestamp 
AFTER UPDATE ON user_profiles
BEGIN
    UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_socials_timestamp
AFTER UPDATE ON user_socials
BEGIN
    UPDATE user_socials SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_crews_timestamp 
AFTER UPDATE ON user_crews
BEGIN
    UPDATE user_crews SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_agents_timestamp
AFTER UPDATE ON user_agents
BEGIN
    UPDATE user_agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_tasks_timestamp
AFTER UPDATE ON user_tasks
BEGIN
    UPDATE user_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_conversations_timestamp
AFTER UPDATE ON user_conversations
BEGIN
    UPDATE user_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_executions_timestamp
AFTER UPDATE ON user_executions
BEGIN
    UPDATE user_executions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_execution_steps_timestamp
AFTER UPDATE ON user_crew_execution_steps
BEGIN
    UPDATE user_crew_execution_steps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
