from crews.path_finder.crew import PathFinderCrew

# === 1. FUNCTIONS ===

def run_suggest_roles(user_profile):
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "user_profile": user_profile
    })
    return result.raw


def run_match_jobs(user_profile, selected_path):
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "user_profile": user_profile,
        "selected_path": selected_path
    })
    return result.raw


def run_set_goal_and_gap(user_profile, goal_role):
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "user_profile": user_profile,
        "goal_role": goal_role
    })
    return result.raw


def run_search_jobs_online(query):
    # query: z.B. "Software Developer"
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "query": query
    })
    return result.raw


# === 2. TESTING ===
if __name__ == "__main__":
    user_profile = {
        "study_program": "Computer Science",
        "skills": ["Python", "Data Analysis", "SQL"],
        "interests": ["tech", "problem-solving", "AI"]
    }

    selected_path = "Data Analyst"
    goal_role = "Machine Learning Engineer"
    search_query = "Software Developer"

    print("\n=== Suggested Career Paths ===")
    print(run_suggest_roles(user_profile))

    print("\n=== Job Matches ===")
    print(run_match_jobs(user_profile, selected_path))

    print("\n=== Goal & Skill Gap ===")
    print(run_set_goal_and_gap(user_profile, goal_role))

    print("\n=== Online Job Search ===")
    print(run_search_jobs_online(search_query))
