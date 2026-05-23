```markdown
# AGENTS.md - AI Coding Agent Guidelines

These guidelines are designed to ensure the efficient, maintainable, and robust development of our AI coding agents. Adherence to these principles is crucial for creating a scalable and reliable system.

## 1. DRY (Don't Repeat Yourself)

*   **Core Logic:** Avoid duplicating code within a single file. Refactor any repeated logic into a reusable function or module.
*   **Component Definitions:** Clearly define component interfaces and their responsibilities.  Use abstraction to represent common elements.
*   **Parameter Handling:**  Establish a consistent approach to parameter handling across different modules. Use named parameters where possible for improved readability and maintainability.
*   **Data Structures:**  Favor single-use data structures over repeated instantiation.  Consider using immutable data structures wherever appropriate.

## 2. KISS (Keep It Simple, Stupid)

*   **Minimize Complexity:** Each agent should have a focused purpose. Avoid unnecessary complexity.
*   **Readability:** Prioritize code clarity and structure. Use meaningful variable and function names.
*   **Short Functions:** Keep functions short and focused on a single task. Aim for a maximum of 30-50 lines of code per function.
*   **Avoid Over-Engineering:**  Don’t introduce logic that isn’t strictly necessary for the current task.

## 3. SOLID Principles

*   **Single Responsibility Principle:** Each class/module should have one primary responsibility.
*   **Open/Closed Principle:**  The system should be extensible without modifying existing code.  (This is mostly implemented through modular design).
*   **Liskov Substitution Principle:**  Subclasses should be substitutable for their base classes without altering the correctness of the system.
*   **Interface Segregation Principle:**  Clients shouldn't be forced to implement interfaces they don’t use.

## 4. YAGNI (You Aren't Gonna Need It)

*   **Avoid premature assumptions:** Do not implement functionality based on future needs that aren’t currently required.
*   **Focus on Requirements:** Implement only what is explicitly stated in the requirements specification.
*   **Progressive Development:**  Build incrementally.  Implement the core functionality first, then add features as they become necessary.

## 5. Development Practices

*   **Code Reviews:** All changes must undergo thorough code reviews by at least two developers.
*   **Unit Testing:** Implement comprehensive unit tests for every function and module.  Each file should have at least 80% test coverage.
*   **Integration Testing:**  Design integration tests to verify the interaction between different agent components.
*   **Documentation:**  Provide clear and concise documentation for each component and its purpose.
*   **Error Handling:**  Implement robust error handling to gracefully manage unexpected situations.  Log errors appropriately.
*   **Data Validation:**  Include data validation checks within agents to ensure data integrity.
*   **Traceability:** Ensure all functions and modules can be traced back to their source.
*   **Version Control:** Use a standard version control system (e.g., Git) with clear branching strategies.

## 6. File Size Limits

*   **Maximum Line Count:** Each file must not exceed 180 lines of code.
*   **Code Structure:**  Maintain a well-defined folder structure to improve code organization.

## 7. Test Coverage Requirements

*   **Target Coverage:**  Achieve at least 80% test coverage for the entire codebase.
*   **Test Case Design:**  Create comprehensive test cases that cover all critical scenarios and edge cases.
*   **Test Data Management:** Use consistent and manageable test data.

## 8. Code Style

*   **Standardized Formatting:**  Follow a consistent code style (e.g., using a linter) to improve readability.
*   **Naming Conventions:**  Use meaningful and consistent naming conventions for variables, functions, and classes.
*   **Comments:**  Add clear and concise comments to explain complex logic or non-obvious code.

## 9. API Design (High Level - Not Detailed)

*   Each agent should have a well-defined API.  Consider using a data format like JSON for data exchange.
*   API documentation should be available separately.

## 10.  Maintainability & Future Expansion

*   Design for extensibility.  Use modular architecture.
*   Consider using dependency injection for configuration and setup.

These guidelines are intended to guide the development of the AGENTS.md repository and ensure a high-quality, maintainable codebase.  Any deviation from these guidelines requires careful justification and discussion with the team.
```