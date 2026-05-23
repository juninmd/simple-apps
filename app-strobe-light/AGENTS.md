```markdown
# AGENTS.md - AI Coding Agent Guidelines

These guidelines outline the core principles and rules for development of AI coding agents within this repository. Compliance with these principles is mandatory for all development activities.

## 1. DRY (Don't Repeat Yourself)

*   All code should be reusable across multiple agents and functionalities.
*   Avoid duplication of logic and data structures.
*   When a functionality needs to be expanded, consider creating a new agent or module.

## 2. KISS (Keep It Simple, Stupid)

*   Prioritize clarity and readability over complex solutions.
*   Keep functions and classes short and focused.
*   Avoid unnecessary abstractions.
*   Design for easy maintenance and modification.

## 3. SOLID Principles

*   **Single Responsibility Principle:** Each class or module should have one primary responsibility.
*   **Open/Closed Principle:**  The agent's logic should be open for extension but closed for modification.
*   **Liskov Substitution Principle:** Subclasses should be substitutable for their base classes without altering the correctness of the program.
*   **Interface Segregation Principle:** Clients should not be forced to implement interfaces they do not use.
*   **Dependency Inversion Principle:**  High-level modules should be dependent on low-level modules, not vice-versa.

## 4. YAGNI (You Aren't Gonna Need It)

*   Implement only what is absolutely necessary for the current task.
*   Avoid adding features or functionality without a clear, immediate need.
*   Refactor incrementally to minimize unnecessary complexity.

## 5. Development Focus & Productivity

*   All development must be productive and focused on achieving the core goals of the agent.
*   Prioritize completing essential tasks over minor optimizations.
*   Document code clearly and concisely.
*   Utilize code comments to explain complex logic.

## 6. Code Length Constraints (180 lines max)

*   Each file must not exceed 180 lines of code.
*   Ensure logical flow and minimal redundancy within each file.
*   Code must be easily understandable and maintainable.

## 7. Test Coverage Requirements (80%+)

*   Achieve 80% test coverage for all agent functions and classes.
*   Utilize a comprehensive suite of unit tests to verify functionality.
*   Focus test cases on critical scenarios and edge cases.

## 8. Data Structures & Algorithms

*   Utilize appropriate data structures for efficient operations.
*   Employ efficient algorithms for common tasks.
*   Avoid unnecessary data copies and manipulations.

## 9. API Design

*   Define clear and consistent API contracts for all agent functionalities.
*   Use standardized naming conventions.
*   Provide thorough documentation for all API endpoints.

## 10. Error Handling

*   Implement robust error handling to gracefully handle unexpected situations.
*   Provide informative error messages to aid in debugging.
*   Log errors appropriately for analysis.

## 11. Configuration Management

*   Employ a configuration management system (e.g., YAML, JSON) for agent settings.
*   Clearly define configuration parameters and validation rules.
*   Maintain a history of configuration changes.

## 12.  Modularity & Composition

*   Design agents as modular components with well-defined responsibilities.
*   Utilize composition over inheritance to promote flexibility.

## 13.  Version Control

*   Use a version control system (e.g., Git) for all code changes.
*   Follow established branching and merging practices.

## 14.  Testing Practices

*   Employ automated testing frameworks (e.g., pytest, unittest).
*   Write unit tests that cover all essential code paths.
*   Use test-driven development (TDD) to improve code quality.

## 15.  Documentation Requirements

*   Every agent/module/function/class should have a brief README explaining its purpose, inputs, outputs, and usage.
*   Consider adding API documentation using tools like Swagger/OpenAPI.

These guidelines are intended to serve as a framework for development.  Adherence to these principles is crucial for the success and maintainability of the AGENTS.md repository.  Any deviations from these guidelines will be subject to review and potential modification.
```