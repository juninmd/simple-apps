```markdown
# AGENTS.md - AI Coding Agent Guidelines

These guidelines are designed to ensure high-quality, maintainable, and efficient development for our AI coding agents. Adherence to these principles will promote code reuse, clarity, and overall project success.

## 1. DRY (Don't Repeat Yourself)

*   All code should have a single, well-defined purpose.
*   Avoid duplicating logic or data structures.
*   When a functionality is implemented multiple times, create a reusable component.

## 2. KISS (Keep It Simple, Stupid)

*   Prioritize simplicity over complexity.
*   Write code that is easy to understand and maintain.
*   Avoid unnecessary abstractions or over-engineering.
*   Focus on the essential requirements.

## 3. SOLID Principles

*   **Single Responsibility Principle:** Each class/module/component should have a single, well-defined responsibility.
*   **Open/Closed Principle:** The system should be extensible without modifying the core code.  We will use dependency injection extensively.
*   **Liskov Substitution Principle:**  Subclasses should be able to replace their base classes without affecting the correctness of the program.
*   **Interface Segregation Principle:**  Clients should not be forced to depend on methods they do not use.
*   **Dependency Inversion Principle:**  High-level modules should not depend on low-level modules.  We will leverage dependency injection heavily.

## 4. YAGNI (You Aren't Gonna Need It)

*   Implement only the functionality explicitly required.
*   Avoid adding features or code that isn’t currently needed.
*   Refactor only when the existing code is demonstrably flawed or needs significant improvement.

## 5. Code Length & Structure

*   Each file should be no more than 180 lines of code.  Exceptions to this rule apply only when absolutely necessary for clarity or specific requirements.
*   Code should be well-formatted, consistently indented, and use clear variable and function names.
*   Comments should explain *why* the code is doing something, not *what* it's doing (that's the function's purpose).

## 6. Test Coverage & Production

*   All development MUST be productive.  Testing is *not* a separate activity, it's integral to the coding process.
*   **Mocking ONLY:**  Use mocks and stubs for unit tests.  No reliance on real system implementations.
*   Test coverage should be at least 80%.  Automated test suites are essential.
*   Tests should be designed to cover all critical functionality and edge cases.
*   Test cases should be documented clearly and concisely.

## 7. File Structure & Organization

*   **Modules:**  Organize code into logical modules based on functionality.
*   **Packages:** Use packages to group related modules.
*   **Naming Conventions:** Follow consistent naming conventions (e.g., camelCase for functions, PascalCase for classes).
*   **File Structure:** Maintain a clear and logical file structure. Separate code into distinct directories based on functionality.
*   **Documentation:** Provide brief documentation for each file's purpose and key components.

## 8.  Specific Considerations for AGENTS.md

*   **Agent Initialization:**  Clearly define the initialization process for each agent type.
*   **Data Storage:**  Describe the data storage mechanisms for each agent (e.g., databases, files, memory).
*   **Communication Protocols:**  Detail any communication protocols employed by agents.
*   **Error Handling:**  Establish a consistent error handling strategy.
*   **Logging:** Implement robust logging for debugging and monitoring.

## 9.  Automation

*   Utilize a build system (e.g., Jenkins, GitLab CI) for automated testing and deployment.
*   Implement automated code linting and formatting.
*   Establish a process for reviewing code changes before merging.

## 10.  Future Considerations

*   Explore the use of a domain-specific language (DSL) for agent definition.
*   Design for scalability and extensibility.

These guidelines will be regularly reviewed and updated as the project evolves.  Any deviation from these principles will be subject to review and potential adjustment.
```