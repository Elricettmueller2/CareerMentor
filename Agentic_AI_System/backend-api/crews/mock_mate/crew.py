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

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True
        )




def respond(message):
    response = litellm.completion(
        model="ollama/llama3.2",
        api_base="http://host.docker.internal:11434",
        messages=[{"role": "user", "content": message}]
    )
    return response.choices[0].message.content
