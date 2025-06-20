from crewai import Agent, Task, Crew
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai.llm import LLM
from typing import List
import litellm


litellm._turn_on_debug()


llm = LLM(
    model="ollama/llama3.2",
    base_url="http://host.docker.internal:11434",
)

@CrewBase
class MockInterviewCrew():

    agents: List[BaseAgent]
    tasks: List[Task]
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def interview_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['interview_agent'],
            llm=llm,
            verbose=True
        )

    @task
    def start_interview_task(self) -> Task:
        return Task(config=self.tasks_config['start_interview'])
    
    @task
    def refine_answer_task(self) -> Task:
        return Task(config=self.tasks_config['refine_answer'])

    @task
    def respond_to_answer_task(self) -> Task:
        return Task(config=self.tasks_config['respond_to_answer'])

    @task
    def review_interview_task(self) -> Task:
        return Task(config=self.tasks_config['review_interview'])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True
        )