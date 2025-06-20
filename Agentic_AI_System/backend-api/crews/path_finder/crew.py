from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
import litellm

litellm._turn_on_debug()

llm = LLM(
    model="ollama/llama3.2",
    base_url="http://host.docker.internal:11434",
)

@CrewBase
class PathFinderCrew():

    agents: List[BaseAgent]
    tasks: List[Task]
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def job_search_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['job_search_agent'],
            llm=llm,
            verbose=True
        )
    
    @agent
    def job_filter_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['job_filter_agent'],
            llm=llm,
            verbose=True
        )

    @task
    def search_jobs_task(self) -> Task:
        return Task(config=self.tasks_config['search_jobs'])
    
    @task
    def filter_jobs_task(self) -> Task:
        return Task(config=self.tasks_config['filter_jobs'])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True
        )
