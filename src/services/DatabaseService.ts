import type { Env } from '../../worker-configuration';
import type { Model } from 'd1-orm';
import {
  getUserConversationsModel,
  getUserCrewExecutionsModel,
  getUserCrewExecutionStepsModel,
  getUserCrewsModel,
  getUserAgentsModel,
  getUserTasksModel,
  getUserProfileModel,
  type IUserConversations,
  type IUserCrewExecutions,
  type IUserCrewExecutionSteps,
  type IUserCrews,
  type IUserAgents,
  type IUserTasks,
  type IUserProfile
} from '../models';

export class DatabaseService {
  private env: Env;
  private conversations: Model;
  private crewExecutions: Model;
  private executionSteps: Model;
  private crews: Model;
  private agents: Model;
  private tasks: Model;
  private profiles: Model;

  constructor(env: Env) {
    this.env = env;
    this.conversations = getUserConversationsModel(env);
    this.crewExecutions = getUserCrewExecutionsModel(env);
    this.executionSteps = getUserCrewExecutionStepsModel(env);
    this.crews = getUserCrewsModel(env);
    this.agents = getUserAgentsModel(env);
    this.tasks = getUserTasksModel(env);
    this.profiles = getUserProfileModel(env);
  }

  // Conversation Methods
  async createConversation(profileId: string, name: string = 'New Conversation'): Promise<IUserConversations> {
    return await this.conversations.create({
      profile_id: profileId,
      conversation_name: name
    });
  }

  async getConversation(id: number): Promise<IUserConversations | null> {
    return await this.conversations.findOne({
      where: { id }
    });
  }

  async getConversationsForProfile(profileId: string): Promise<IUserConversations[]> {
    return await this.conversations.findMany({
      where: { profile_id: profileId },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateConversation(id: number, profileId: string, data: Partial<IUserConversations>): Promise<any> {
    return await this.conversations.update(data, {
      where: { id, profile_id: profileId }
    });
  }

  async deleteConversation(id: number, profileId: string): Promise<any> {
    return await this.conversations.delete({
      where: { id, profile_id: profileId }
    });
  }

  // Crew Execution Methods
  async createCrewExecution(data: Partial<IUserCrewExecutions>): Promise<IUserCrewExecutions> {
    return await this.crewExecutions.create({
      ...data,
      total_tokens: 0,
      successful_requests: 0
    });
  }

  async getCrewExecutionsForProfile(profileId: string): Promise<IUserCrewExecutions[]> {
    return await this.crewExecutions.findMany({
      where: { profile_id: profileId },
      orderBy: { created_at: 'desc' }
    });
  }

  async getConversationHistory(conversationId: number): Promise<any[]> {
    const executions = await this.crewExecutions.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' }
    });

    const history = [];
    for (const execution of executions) {
      const steps = await this.executionSteps.findMany({
        where: { execution_id: execution.id },
        orderBy: { created_at: 'asc' }
      });

      history.push({
        execution,
        steps
      });
    }

    return history;
  }

  // Crew Methods
  async getPublicCrews(): Promise<any[]> {
    const crews = await this.crews.findMany({
      where: { crew_is_public: 1 },
      orderBy: { created_at: 'desc' }
    });

    const result = [];
    for (const crew of crews) {
      const agents = await this.agents.findMany({
        where: { crew_id: crew.id }
      });

      for (const agent of agents) {
        const tasks = await this.tasks.findMany({
          where: { 
            crew_id: crew.id,
            agent_id: agent.id
          }
        });
        Object.assign(agent, { tasks });
      }

      const profile = await this.profiles.findOne({
        where: { stx_address: crew.profile_id }
      });

      result.push({
        ...crew,
        profile,
        agents
      });
    }

    return result;
  }

  // Cron Methods
  async getEnabledCrons(): Promise<IUserCrews[]> {
    return await this.crews.findMany({
      where: {
        crew_is_cron: 1,
        crew_is_enabled: 1
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getEnabledCronsWithDetails(): Promise<any[]> {
    const crews = await this.getEnabledCrons();
    const result = [];

    for (const crew of crews) {
      const profile = await this.profiles.findOne({
        where: { stx_address: crew.profile_id }
      });

      const agents = await this.agents.findMany({
        where: { crew_id: crew.id }
      });

      for (const agent of agents) {
        const tasks = await this.tasks.findMany({
          where: {
            crew_id: crew.id,
            agent_id: agent.id
          }
        });
        Object.assign(agent, { tasks });
      }

      result.push({
        ...crew,
        profile,
        agents
      });
    }

    return result;
  }
}
