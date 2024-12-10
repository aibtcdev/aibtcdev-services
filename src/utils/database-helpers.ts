import { D1Orm } from 'd1-orm';
import type { Env } from '../../worker-configuration';
import {
	userAgentsModel,
	userCrewExecutionsModel,
	userConversationsModel,
	userCrewExecutionStepsModel,
	userCrewsModel,
	userProfilesModel,
	userSocialsModel,
	userTasksModel,
	UserCrewExecutionsTable,
} from '../models';
import { userCronsModel } from '../models/UserCrons';

/**
 * Create a new crew run for a profile. _(previously: "job")_
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param crewId The ID of the crew being executed
 * @param conversationId The ID of the conversation this execution belongs to
 * @param input Optional user input for the execution
 */
export async function addCrewExecution(orm: D1Orm, address: string, crewId: number, conversationId: number, input?: string) {
	userCrewExecutionsModel.SetOrm(orm);
	const execution = await userCrewExecutionsModel.InsertOne({
		profile_id: address,
		crew_id: crewId,
		conversation_id: conversationId,
		user_input: input,
		total_tokens: 0,
		successful_requests: 0,
	});
	return execution;
}

/**
 * Get all executed crew runs for a profile. _(previously: "job")_
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 */
export async function getCrewExecutions(orm: D1Orm, address: string) {
	userCrewExecutionsModel.SetOrm(orm);
	const executions = await userCrewExecutionsModel.All({
		where: {
			profile_id: address,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});
	return executions;
}

/**
 * Get all public crew configurations.
 * @param orm The orm instance from durable object class
 */
export async function getPublicCrews(orm: D1Orm) {
	userCrewsModel.SetOrm(orm);
	const crews = await userCrewsModel.All({
		where: {
			crew_is_public: 1,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});
	return crews;
}

/** CRON MANAGEMENT */

// TODO: Add columns to user_crews table for cron functionality:
// - crew_is_cron: INTEGER DEFAULT 0
// - crew_is_enabled: INTEGER DEFAULT 0
// - crew_cron_schedule: TEXT
// - crew_last_run: DATETIME
// - crew_next_run: DATETIME

/**
 * Get all enabled cron jobs.
 * @param orm The orm instance from durable object class
 */
export async function getEnabledCrons(orm: D1Orm) {
	userCronsModel.SetOrm(orm);
	const crons = await userCronsModel.All({
		where: {
			cron_enabled: 1,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});
	return crons;
}

/**
 * Get all enabled cron jobs with expanded crew information.
 * @param orm The orm instance from durable object class
 */
export async function getEnabledCronsDetailed(orm: D1Orm) {
	userCrewsModel.SetOrm(orm);
	userAgentsModel.SetOrm(orm);
	userTasksModel.SetOrm(orm);
	userProfilesModel.SetOrm(orm);

	const crons = await userCronsModel.All({
		where: {
			cron_enabled: 1,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});

	const result = [];

	// iterate through all cron entries returned
	for (const cron of crons.results) {
		// get the related crew info for this cron
		const crew = await userCrewsModel.First({
			where: {
				id: cron.crew_id,
			},
		});
		// get all of the agents for the crew
		const agents = await userAgentsModel.All({
			where: {
				profile_id: cron.profile_id,
				crew_id: cron.crew_id,
			},
		});
		// get all of the tasks for each agent
		let tasks = [];
		for (const agent of agents.results) {
			const agentTasks = await userTasksModel.All({
				where: {
					profile_id: cron.profile_id,
					crew_id: cron.crew_id,
					agent_id: agent.id,
				},
			});
			tasks.push(agentTasks.results);
		}
		const profile = userProfilesModel.First({
			where: {
				stx_address: cron.profile_id,
			},
		});

		result.push({
			crew,
			profile,
			agents,
			tasks,
		});
	}

	return result;
}

/** CONVERSATION MANAGEMENT */

/**
 * Create a new conversation for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile.
 * @param name The name of the conversation (optional).
 */
export async function addConversation(env: Env, address: string, name: string = 'New Conversation') {
	const userConversations = getUserConversationsModel(env);
	const conversation = await userConversations.InsertOne({
		profile_id: address,
		conversation_name: name,
	});
	return conversation;
}

/**
 * Update or create a conversation with new messages.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param conversationId The ID of the conversation to update
 * @param name Optional new name for the conversation
 */
export async function updateConversation(env: Env, address: string, conversationId: number, name?: string) {
	const userConversations = getUserConversationsModel(env);
	const result = await userConversations.Update({
		where: {
			id: conversationId,
			profile_id: address,
		},
		data: {
			conversation_name: name,
		},
	});
	return result;
}

/**
 * Delete a specific conversation.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile.
 * @param conversationId The ID of the conversation to delete.
 */
export async function deleteConversation(env: Env, address: string, conversationId: number) {
	const userConversations = getUserConversationsModel(env);
	const result = await userConversations.Delete({
		where: {
			id: conversationId,
			profile_id: address,
		},
	});
	return result;
}

/**
 * Get a conversation.
 * @param orm The orm instance from durable object class
 * @param conversationId The ID of the conversation
 */
export async function getConversation(env: Env, conversationId: number) {
	const userConversations = getUserConversationsModel(env);
	const conversation = await userConversations.First({
		where: {
			id: conversationId,
		},
	});
	return conversation;
}

/**
 * Get a conversation with associated crew executions.
 * @param orm The orm instance from durable object class
 * @param conversationId The ID of the conversation
 */
export async function getConversationWithJobs(env: Env, conversationId: number) {
	const userConversations = getUserConversationsModel(env);
	const userCrewExecutions = getUserCrewExecutionsModel(env);

	const conversation = await userConversations.findOne({
		where: {
			id: conversationId,
		},
	});

	if (!conversation) {
		return null;
	}

	const executions = await userCrewExecutions.All({
		where: {
			conversation_id: conversationId,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});

	return {
		conversation,
		executions,
	};
}

/**
 * Get all conversations for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile.
 */
export async function getConversations(env: Env, address: string) {
	const userConversations = getUserConversationsModel(env);
	const conversations = await userConversations.All({
		where: {
			profile_id: address,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});
	return conversations;
}

/**
 * Get all conversations with their associated crew executions for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 */
export async function getConversationsWithJobs(env: Env, address: string) {
	const userConversations = getUserConversationsModel(env);
	const userCrewExecutions = getUserCrewExecutionsModel(env);

	const conversations = await userConversations.findMany({
		where: {
			profile_id: address,
		},
		orderBy: {
			created_at: 'desc',
		},
	});

	const result = [];
	for (const conversation of conversations) {
		const executions = await userCrewExecutions.All({
			where: {
				conversation_id: conversation.id,
				profile_id: address,
			},
			orderBy: [
				{
					column: 'created_at',
					descending: true,
				},
			],
		});

		result.push({
			conversation,
			executions,
		});
	}

	return result;
}

/**
 * Get the most recent conversation for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile.
 */
export async function getLatestConversation(env: Env, address: string) {
	const userConversations = getUserConversationsModel(env);
	const conversation = await userConversations.First({
		where: {
			profile_id: address,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});
	return conversation;
}

/**
 * Get the ID of the most recent conversation for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 */
export async function getLatestConversationId(env: Env, address: string) {
	const conversation = await getLatestConversation(db, address);
	return conversation?.id;
}

/**
 * Get conversation history in chronological order.
 * @param orm The orm instance from durable object class
 * @param conversationId The ID of the conversation
 */
export async function getConversationHistory(env: Env, conversationId: number) {
	const userCrewExecutions = getUserCrewExecutionsModel(env);
	const userCrewExecutionSteps = getUserCrewExecutionStepsModel(env);

	// Get all executions for this conversation
	const executions = await userCrewExecutions.All({
		where: {
			conversation_id: conversationId,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: false,
			},
		],
	});

	const history = [];
	for (const execution of executions) {
		// Get all steps for this execution
		const steps = await userCrewExecutionSteps.All({
			where: {
				execution_id: execution.id,
			},
			orderBy: [
				{
					column: 'created_at',
					descending: false,
				},
			],
		});

		history.push({
			execution,
			steps,
		});
	}

	return history;
}

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
