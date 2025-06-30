from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
import litellm
import os

litellm._turn_on_debug()

# Verwende eine Umgebungsvariable oder Fallback für die Ollama-URL
# In Docker wäre es "http://ollama:11434"
# Lokal könnte es "http://localhost:11434" sein
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

try:
    llm = LLM(
        model="ollama/llama3.2",
        base_url=OLLAMA_BASE_URL,
    )
except Exception as e:
    print(f"Fehler beim Initialisieren des LLM: {e}")
    print("Verwende Fallback-Modus ohne LLM")

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
