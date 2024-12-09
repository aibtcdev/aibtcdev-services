/** CREW EXECUTIONS */

/**
 * Create a new crew run for a profile. _(previously: "job")_
 * @param db The D1 database instance
 * @param address The Stacks address for the user's profile
 * @param crewId The ID of the crew being executed
 * @param conversationId The ID of the conversation this execution belongs to
 * @param input Optional user input for the execution
 */
export async function addCrewExecution(
  db: D1Database,
  address: string,
  crewId: number,
  conversationId: number,
  input?: string
) {
  const userCrewExecutions = new UserCrewExecutions(db);
  const execution = await userCrewExecutions.create({
    profile_id: address,
    crew_id: crewId,
    conversation_id: conversationId,
    user_input: input,
    total_tokens: 0,
    successful_requests: 0
  });
  return execution;
}

/**
 * Get all executed crew runs for a profile. _(previously: "job")_
 * @param db The D1 database instance
 * @param address The Stacks address for the user's profile
 */
export async function getCrewExecutions(db: D1Database, address: string) {
  const userCrewExecutions = new UserCrewExecutions(db);
  const executions = await userCrewExecutions.findMany({
    where: {
      profile_id: address
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  return executions;
}

/**
 * Get all public crew configurations.
 * @param db The D1 database instance
 */
export async function getPublicCrews(db: D1Database) {
  const userCrews = new UserCrews(db);
  const crews = await userCrews.findMany({
    where: {
      crew_is_public: 1
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  return crews;
}

/** CRON MANAGEMENT */

/**
 * Get all enabled cron jobs.
 */
export function getEnabledCrons() {}

/**
 * Get all enabled cron jobs with expanded crew information.
 */
export function getEnabledCronsWithCrews() {}

/** CONVERSATION MANAGEMENT */

/**
 * Create a new conversation for a profile.
 * @param address The Stacks address for the user's profile.
 * @param name The name of the conversation (optional).
 */
export async function addConversation(db: D1Database, address: string, name: string = 'New Conversation') {
  const userConversations = new UserConversations(db);
  const conversation = await userConversations.create({
    profile_id: address,
    conversation_name: name
  });
  return conversation;
}

/**
 * Update or create a conversation with new messages.
 * @param address The Stacks address for the user's profile.
 * @param messages The messages to add to the conversation.
 */
export function updateConversation(address: string, messages: any[]) {}

/**
 * Delete a specific conversation.
 * @param address The Stacks address for the user's profile.
 * @param conversationId The ID of the conversation to delete.
 */
export async function deleteConversation(db: D1Database, address: string, conversationId: number) {
  const userConversations = new UserConversations(db);
  const result = await userConversations.delete({
    where: {
      id: conversationId,
      profile_id: address
    }
  });
  return result;
}

/**
 * Get a conversation.
 * @param conversationId The ID of the conversation.
 */
export function getConversation(conversationId: string) {}

/**
 * Get a conversation with associated jobs.
 * @param conversationId The ID of the conversation.
 */
export function getConversationWithJobs(conversationId: string) {}

/**
 * Get all conversations for a profile.
 * @param address The Stacks address for the user's profile.
 */
export async function getConversations(db: D1Database, address: string) {
  const userConversations = new UserConversations(db);
  const conversations = await userConversations.findMany({
    where: {
      profile_id: address
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  return conversations;
}

/**
 * Get all conversations with their associated jobs for a profile.
 * @param address The Stacks address for the user's profile.
 */
export function getConversationsWithJobs(address: string) {}

/**
 * Get the most recent conversation for a profile.
 * @param address The Stacks address for the user's profile.
 */
export async function getLatestConversation(db: D1Database, address: string) {
  const userConversations = new UserConversations(db);
  const conversation = await userConversations.findOne({
    where: {
      profile_id: address
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  return conversation;
}

/**
 * Get the ID of the most recent conversation for a profile.
 * @param address The Stacks address for the user's profile.
 */
export function getLatestConversationId(address: string) {}

/**
 * Get conversation history in chronological order.
 * @param conversationId The ID of the conversation.
 */
export function getConversationHistory(conversationId: string) {}

/** DB HELPERS FROM OLD CODE */

/*
def add_conversation(profile, name: str = "New Conversation") -> Optional[Dict[str, Any]]:
    """Add a new conversation for a specific profile."""
    new_conversation = {
        "profile_id": profile.id,
        "name": name,
    }
    result = supabase.table("conversations").insert(new_conversation).execute()
    return result.data[0] if result.data else None

def get_conversations(profile) -> List[Dict[str, Any]]:
    """Get all conversations for a specific profile."""
    conversation_response = (
        supabase.table("conversations")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", desc=True)
        .execute()
    )
    return conversation_response.data if conversation_response.data else []

def get_jobs(profile) -> List[Dict[str, Any]]:
    """Get all jobs for a specific profile."""
    runs_response = (
        supabase.table("jobs")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", desc=True)
        .execute()
    )
    return runs_response.data if runs_response.data else []

def get_detailed_conversation(conversation_id: str) -> Dict[str, Any]:
    """Get detailed conversation data with associated jobs."""
    jobs_response = (
        supabase.table("jobs")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {
        "conversation": conversation_id,
        "jobs": [
            job
            for job in jobs_response.data
            if job["conversation_id"] == conversation_id
        ],
    }

def get_detailed_conversations(profile) -> List[Dict[str, Any]]:
    """Get all conversations with their associated jobs for a profile."""
    conversation_response = (
        supabase.table("conversations")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", desc=True)
        .execute()
    )
    if not conversation_response.data:
        return []
    conversation_ids = [
        conversation["id"] for conversation in conversation_response.data
    ]
    jobs_response = (
        supabase.table("jobs")
        .select("*")
        .in_("conversation_id", conversation_ids)
        .order("created_at", desc=False)
        .execute()
    )

    return [
        {
            "conversation": conversation,
            "jobs": [
                job
                for job in jobs_response.data
                if job["conversation_id"] == conversation["id"]
            ],
        }
        for conversation in conversation_response.data
    ]

def update_message(profile, messages: List[Dict[str, Any]]) -> None:
    """Update or create a conversation with new messages."""
    response = (
        supabase.table("conversations")
        .select("*")
        .eq("profile_id", profile.id)
        .execute()
    )
    if response.data:
        conversation_id = response.data[0]["id"]
        updated_messages = response.data[0]["messages"] + messages
        supabase.table("conversations").update({"messages": updated_messages}).eq(
            "id", conversation_id
        ).execute()
    else:
        supabase.table("conversations").insert({
            "profile_id": profile.id,
            "messages": messages,
        }).execute()

def get_latest_conversation(profile) -> Optional[Dict[str, Any]]:
    """Get the most recent conversation for a profile."""
    response = (
        supabase.table("conversations")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None

def get_enabled_crons_expanded() -> List[Dict[str, Any]]:
    """Get all enabled cron jobs with expanded crew information."""
    return (
        supabase.from_("crons")
        .select("id, input, profiles(id, account_index), crew_id")
        .eq("enabled", True)
        .order("created_at", desc=True)
        .execute()
        .data
    )

def get_enabled_crons() -> List[Dict[str, Any]]:
    """Get all enabled cron jobs."""
    return (
        supabase.table("crons")
        .select("*")
        .eq("enabled", True)
        .order("created_at", desc=True)
        .execute()
        .data
    )

def get_latest_conversation_id(profile) -> Optional[str]:
    """Get the ID of the most recent conversation for a profile."""
    response = (
        supabase.table("conversations")
        .select("id")
        .eq("profile_id", profile.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0]["id"] if response.data else None

def delete_conversation(profile, conversation_id: str) -> Dict[str, Any]:
    """Delete a specific conversation."""
    return supabase.table("conversations").delete().eq("id", conversation_id).eq(
        "profile_id", profile.id
    ).execute()

def mask_email(email: str) -> str:
    """Mask and format an email address."""
    if "@stacks.id" in email:
        username = email.split("@")[0]
        return username.upper()
    return email.upper()

def get_public_crews() -> List[Dict[str, Any]]:
    """Get all public crew configurations."""
    crews_response = (
        supabase.from_("crews")
        .select(
            "id, name, description, created_at, profiles(id, email, account_index), agents(id, name, role, goal, backstory, agent_tools), tasks(id, description, expected_output, agent_id, profile_id)"
        )
        .eq("is_public", True)
        .order("created_at", desc=True)
        .execute()
    )
    if not crews_response.data:
        return []
    result = []
    for crew in crews_response.data:
        crew["description"] = crew.get("description") or "No description provided"
        crew["creator_email"] = mask_email(crew["profiles"]["email"])
        agents = []
        for agent in crew["agents"]:
            tasks = []
            for task in crew["tasks"]:
                if task["agent_id"] == agent["id"]:
                    tasks.append(task)
            agent_with_tasks = {
                **agent,
                "tasks": tasks,
            }  # Add tasks to agent dictionary
            agents.append(agent_with_tasks)
        crew_response = {**crew, "agents": agents}
        result.append(crew_response)
    return result

def get_conversation_history(conversation_id: str) -> List[Dict[str, Any]]:
    """Get conversation history in chronological order."""
    jobs_response = (
        supabase.table("jobs")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )
    history = []
    for job in jobs_response.data:
        if job.get("messages"):
            history.extend(job["messages"])
    return history

def add_job(
    profile_id: str,
    conversation_id: str,
    crew_id: str,
    input_data: Dict[str, Any],
    result: Dict[str, Any],
    tokens: int,
    messages: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Add a new job with associated conversation data."""
    new_job = {
        "profile_id": profile_id,
        "conversation_id": conversation_id,
        "crew_id": crew_id,
        "input": input_data,
        "tokens": tokens,
        "result": result,
        "messages": messages,
    }
    result = supabase.table("jobs").insert(new_job).execute()
    return result
    */
