from crews.test.crew import TestCrew


def run_test_crew(text: str):
    crew = TestCrew().crew()
    result = crew.kickoff(inputs={"input": text})
    print(result.raw)
    return result.raw