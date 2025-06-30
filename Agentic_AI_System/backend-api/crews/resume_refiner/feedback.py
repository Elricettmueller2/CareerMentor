from litellm import completion

def llm_call(prompt: str) -> str:
    """
    Send a prompt to the Ollama LLM via litellm.
    """
    resp = completion(
        model="ollama/llama3.2",
        api_base="http://ollama:11434",
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.choices[0].message.content.strip()

class FeedbackGenerator:
    def generate(self, section_text: str, category: str) -> list[str]:
        """
        Given a block of section text and its category, return 2–5 actionable tips.
        """
        prompt = f"""
You are a resume expert. Review the following "{category}" section and provide 3 concise, actionable improvement tips.
Section text:
\"\"\"
{section_text}
\"\"\"
Tips:
1."""
        raw = llm_call(prompt)
        # split lines on digits
        tips = [line.strip(" .") for line in re.split(r"\n\d+\.\s*", raw) if line.strip()]
        return tips[:5]