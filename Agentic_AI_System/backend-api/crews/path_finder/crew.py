from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
import litellm

litellm._turn_on_debug()

# Setup LLM connection (adjust model and base_url as needed)
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
    def career_strategy_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['career_strategy_agent'],
            llm=llm,
            verbose=True
        )

    @agent
    def job_scraper_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['job_scraper_agent'],
            llm=None,  # Kein LLM nötig für Scraping
            verbose=True
        )

    @task
    def suggest_roles(self) -> Task:
        return Task(config=self.tasks_config['suggest_roles'])

    @task
    def match_jobs(self) -> Task:
        return Task(config=self.tasks_config['match_jobs'])

    @task
    def set_goal_and_gap(self) -> Task:
        return Task(config=self.tasks_config['set_goal_and_gap'])

    @task
    def search_jobs_online(self) -> Task:
        return Task(config=self.tasks_config['search_jobs_online'])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True
        )
