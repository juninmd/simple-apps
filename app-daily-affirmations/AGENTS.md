```markdown
# AGENTS.md - Guidelines for AI Coding Agents

These guidelines are designed to ensure the creation of high-quality, maintainable, and robust AI coding agents within this repository. Compliance with these principles is mandatory for all development.

## 1. DRY (Don't Repeat Yourself)

*   **Single Responsibility Principle:** Each agent should have a single, well-defined purpose. Avoid creating redundant functionality.
*   **Module Reuse:** Modules should be designed to be reusable across multiple agents or within the project.
*   **Abstraction:** Use abstraction to hide implementation details.  Focus on defining interfaces rather than concrete implementations.
*   **Code Patterns:** Favor established code patterns to improve readability and maintainability.  Document these patterns clearly.

## 2. KISS (Keep It Simple, Stupid)

*   **Minimize Complexity:**  Strive for the simplest possible solution that meets the requirements.
*   **Clear Intent:** Each function and class should have a single, unambiguous purpose.
*   **Readability:**  Prioritize code clarity. Use descriptive variable and function names.
*   **Avoid Over-Engineering:** Resist adding unnecessary complexity.

## 3. SOLID Principles

*   **Single Responsibility Principle (SRP):**  As stated above.
*   **Open/Closed Principle:**  The agent’s design should be open for extension but closed for modification.  Future requirements can be added without altering existing code.
*   **Liskov Substitution Principle:**  Subclasses should be substitutable for their base classes without altering the correctness of the program.
*   **Interface Segregation Principle:** Client code shouldn’t be forced to depend on implementation details that it doesn’t use.
*   **Dependency Inversion Principle:**  High-level modules (agents) should not depend on low-level modules.  Instead, they should depend on abstractions.

## 4. YAGNI (You Aren't Gonna Need It)

*   **Avoid Unnecessary Features:**  Do not implement functionalities that are not currently required or are unlikely to be needed in the future.
*   **Future-Proofing:** Design agents with flexibility to accommodate future changes and requirements.
*   **Focus on Core Functionality:**  Maintain a clear understanding of the agent's primary goals and avoid introducing distracting or unnecessary elements.

## 5. Development Guidelines

*   **Code Reviews:** All code must undergo thorough peer review before merging. Code should be reviewed by at least one other developer.
*   **Unit Testing:** Write comprehensive unit tests for each agent and all functions.  Aim for 80% test coverage.
*   **Test-Driven Development (TDD):**  Consider using TDD principles – write tests *before* writing the implementation.
*   **Code Documentation:**  Provide clear and concise documentation for each agent, including input, output, and any relevant logic. Use docstrings appropriately.
*   **Error Handling:** Implement robust error handling and provide informative error messages.  Avoid crashing the agent.
*   **Logging:** Implement logging to trace agent execution and diagnostic purposes.
*   **Version Control:** Use a version control system (e.g., Git) and adhere to established branching and merging practices.
*   **Continuous Integration (CI):** Implement a CI pipeline to automatically build and test agents.
*   **Code Formatting:** Use a consistent code formatting style (e.g., Black).
*   **Naming Conventions:** Follow consistent naming conventions throughout the codebase.
*   **Parameterization:**  Use parameterization to improve the agent’s flexibility and reusability.

## 6. File Length Constraints

*   **Maximum File Length:** 180 lines of code.
*   **Code Quality:**  Maintain a high standard of code quality and readability.

## 7. Testing

*   **All tests must be within the same file.**
*   **Each test must have a clear, concise description.**
*   **Tests should cover all critical functionality.**
*   **Test edge cases and boundary conditions.**
*   **Implement mocks & stubs for dependencies.**
*   **Test all paths through the agent's logic.**

## 8.  Deliverables

*   Each file must contain code that is demonstrable.
*   Each file must be independently testable.

## 9.  Future Considerations

*   Add support for data structures and algorithms.
*   Implement more advanced error handling and logging.
*   Introduce design patterns to improve code structure.

```