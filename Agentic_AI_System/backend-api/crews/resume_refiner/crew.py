# crews/resume_refiner/crew.py
from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
import litellm

litellm._turn_on_debug()

llm = LLM(
    model="ollama/llama3.2",
    base_url="http://host.docker.internal:11434",
)

@CrewBase
class ResumeRefinerCrew():

    agents: list[BaseAgent]
    tasks: list[Task]
    agents_config = "crews/resume_refiner/config/agents.yaml"
    tasks_config = "crews/resume_refiner/config/tasks.yaml"

    @agent
    def resume_refiner_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['resume_refiner_agent'],
            llm=llm,
            verbose=True
        )

    @task
    def parse_resume(self) -> Task:
        return Task(config=self.tasks_config['parse_resume'])

    @task
    def refine_resume(self) -> Task:
        return Task(config=self.tasks_config['refine_resume'])

    @task
    def match_resume(self) -> Task:
        return Task(config=self.tasks_config['match_resume'])

    @crew
    def crew(self) -> Crew:
        return Crew(agents=self.agents, tasks=self.tasks, verbose=True)