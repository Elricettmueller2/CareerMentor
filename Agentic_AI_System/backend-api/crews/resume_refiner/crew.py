# crews/resume_refiner/crew.py
from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
import litellm
import os
import pathlib

# Import the agent implementations
from .layout_agent import LayoutAgent
from .parser_agent import ParserAgent
from .quality_agent import QualityAgent
from .match_agent import MatchAgent

litellm._turn_on_debug()

llm = LLM(
    model="ollama/llama3.2",
    base_url=os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434"),
)

@CrewBase
class ResumeRefinerCrew():

    agents: list[BaseAgent]
    tasks: list[Task]
    base_dir = pathlib.Path(__file__).parent.absolute()
    agents_config = os.path.join(base_dir, "config/agents.yaml")
    tasks_config = os.path.join(base_dir, "config/tasks.yaml")
    
    # Agent instances
    _layout_agent = None
    _parser_agent = None
    _quality_agent = None
    _match_agent = None
    
    def __init__(self):
        """Initialize agent instances"""
        self._layout_agent = LayoutAgent()
        self._parser_agent = ParserAgent()
        self._quality_agent = QualityAgent()
        self._match_agent = MatchAgent()

    @agent
    def layout_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['layout_agent'],
            llm=llm,
            verbose=True
        )
    
    @agent
    def parser_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['parser_agent'],
            llm=llm,
            verbose=True
        )
    
    @agent
    def quality_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['quality_agent'],
            llm=llm,
            verbose=True
        )
    
    @agent
    def match_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['match_agent'],
            llm=llm,
            verbose=True
        )

    @task
    def analyze_layout(self) -> Task:
        return Task(config=self.tasks_config['analyze_layout'])

    @task
    def parse_resume(self) -> Task:
        return Task(config=self.tasks_config['parse_resume'])

    @task
    def evaluate_resume(self) -> Task:
        return Task(config=self.tasks_config['evaluate_resume'])

    @task
    def match_resume(self) -> Task:
        return Task(config=self.tasks_config['match_resume'])

    @crew
    def crew(self) -> Crew:
        return Crew(agents=self.agents, tasks=self.tasks, verbose=True)
    
    # Helper methods to expose agent functionality directly
    
    def save_upload(self, upload_file):
        """Save uploaded file and return upload_id"""
        return self._parser_agent.save_upload(upload_file)
    
    def analyze_pdf_layout(self, upload_id):
        """Analyze PDF layout using LayoutAgent"""
        return self._layout_agent.analyze_layout(upload_id)
    
    def parse_pdf(self, upload_id):
        """Parse PDF and extract sections using ParserAgent"""
        return self._parser_agent.parse_with_sections(upload_id)
    
    def evaluate_quality(self, resume_data, layout_data=None):
        """Evaluate resume quality using QualityAgent"""
        return self._quality_agent.evaluate_resume(resume_data, layout_data)
    
    def match_jobs(self, resume_data, job_descriptions):
        """Match resume against job descriptions using MatchAgent"""
        return self._match_agent.match_jobs(resume_data, job_descriptions)