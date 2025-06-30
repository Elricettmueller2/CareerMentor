from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
import litellm

litellm._turn_on_debug()

llm = LLM(
    model="ollama/llama3.2",
    base_url="http://ollama:11434",
)

@CrewBase
class TestCrew():

    agents: List[BaseAgent]
    tasks: List[Task]
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"


    @agent
    def test_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['test_agent'],
            llm=llm,
            verbose=True
        )

    @task
    def task1(self) -> Task:
        return Task(config=self.tasks_config['task1'])

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True
        )
