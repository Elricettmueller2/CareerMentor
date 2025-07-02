from crewai import Agent, Task, Crew
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai.llm import LLM
from typing import List
import litellm
import os

litellm._turn_on_debug()


llm = LLM(
    model="ollama/llama3.2",
    base_url=os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
)

@CrewBase
class MockInterviewCrew():

    agents: List[BaseAgent]
    tasks: List[Task]
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def technical_interviewer(self) -> Agent:
        return Agent(
            config=self.agents_config['technical_interviewer'],
            tasks=[],
            llm=llm,
            memory=True,
            verbose=True
        )
    
    @agent
    def behavioral_interviewer(self) -> Agent:
        return Agent(
            config=self.agents_config['behavioral_interviewer'],
            tasks=[],
            llm=llm,
            memory=True,
            verbose=True
        )
    
    @agent
    def feedback_coach(self) -> Agent:
        return Agent(
            config=self.agents_config['feedback_coach'],
            tasks=[],
            llm=llm,
            memory=True,
            verbose=True
        )

    @task
    def start_interview_task(self) -> Task:
        return Task(config=self.tasks_config['start_interview'])
    
    @task
    def respond_to_answer_task(self) -> Task:
        return Task(config=self.tasks_config['respond_to_answer'])

    @task
    def review_interview_task(self) -> Task:
        return Task(config=self.tasks_config['review_interview'])
    
    @task
    def prepare_custom_interview_task(self) -> Task:
        return Task(config=self.tasks_config['prepare_custom_interview'])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True
        )