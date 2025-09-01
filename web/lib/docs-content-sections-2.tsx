import React from "react";
import { integrations } from "./docs-content";

// Integrations Section Content
export const IntegrationsSection: React.FC = () => (
  <div className="space-y-8">
    {integrations.map((integration) => (
      <div
        key={integration.id}
        id={`${integration.id}-integration`}
        className="scroll-mt-20"
      >
        <h2 className="text-2xl font-bold mb-4">
          {integration.name} Integration
        </h2>

        <p className="text-gray-700 mb-6">{integration.description}</p>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold mb-4">Setup Steps</h3>
            <div className="space-y-4">
              {integration.setupSteps.map((step) => (
                <div key={step.step} className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                      {step.step}
                    </span>
                    <h4 className="font-semibold">{step.title}</h4>
                  </div>
                  <p className="text-gray-700 mb-3">{step.description}</p>
                  {step.code && (
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      <code>{step.code}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            <div className="space-y-3 mb-6">
              {integration.configuration.map((config, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <code className="font-semibold">{config.name}</code>
                    {config.required && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    {config.description}
                  </p>
                  <p className="text-xs text-gray-500">Type: {config.type}</p>
                  {config.example && (
                    <p className="text-xs text-gray-500">
                      Example: <code>{config.example}</code>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mb-6">
              {integration.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>

            <h3 className="text-lg font-semibold mb-4">Troubleshooting</h3>
            <div className="space-y-3">
              {integration.troubleshooting.map((item, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-1">{item.issue}</h4>
                  <p className="text-sm text-gray-700">{item.solution}</p>
                  {item.code && (
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto">
                      <code>{item.code}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Architecture Section Content
export const ArchitectureSection: React.FC = () => (
  <div className="space-y-6">
    <div id="system-overview" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">System Overview</h2>
      <p className="text-gray-700 mb-4">
        Counsel is designed as a modular framework that integrates seamlessly
        with existing development workflows. The architecture emphasizes
        simplicity, extensibility, and AI-first design principles.
      </p>

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Core Components</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-semibold mb-2">CLI Interface</h4>
            <p className="text-sm text-gray-700">
              Command-line tools for project management and automation
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Slash Commands</h4>
            <p className="text-sm text-gray-700">
              Interactive workflows for AI assistant integration
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Storage Layer</h4>
            <p className="text-sm text-gray-700">
              File-based storage with JSON metadata and Markdown content
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Integration Layer</h4>
            <p className="text-sm text-gray-700">
              Pluggable integrations for external tools and services
            </p>
          </div>
        </div>
      </div>
    </div>

    <div id="storage-structure" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Storage Structure</h2>
      <p className="text-gray-700 mb-4">
        Counsel stores all data in a <code>.counsel</code> directory within your
        project. This approach keeps everything version-controlled and easily
        portable.
      </p>

      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto mb-4">
        <code>{`~/.counsel/                    # Global configuration
├── config.json               # Global settings
├── integrations/             # Integration configurations
│   ├── chromadb.json
│   ├── linear.json
│   └── git.json
└── cache/                    # Temporary data

project-root/
├── .counsel/                 # Project-specific data
│   ├── config.json          # Project configuration
│   ├── .features/           # Feature mode items
│   │   └── user-auth/
│   │       ├── specs.md
│   │       ├── design.md
│   │       ├── implementation.md
│   │       └── status.json
│   ├── .scripts/            # Script mode items
│   ├── .vibe/               # Vibe mode items
│   └── .prompts/            # Prompt mode items
└── your-project-files/`}</code>
      </pre>
    </div>

    <div id="component-interaction" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Component Interaction</h2>
      <p className="text-gray-700 mb-4">
        The framework components work together to provide a seamless development
        experience:
      </p>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">CLI ↔ Storage</h3>
          <p className="text-sm text-gray-700">
            CLI commands read and write to the file-based storage system
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Slash Commands ↔ AI Assistant</h3>
          <p className="text-sm text-gray-700">
            Slash commands provide structured prompts for AI-assisted workflows
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">
            Integrations ↔ External Services
          </h3>
          <p className="text-sm text-gray-700">
            Pluggable integrations sync data with ChromaDB, Linear, and Git
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Storage ↔ Version Control</h3>
          <p className="text-sm text-gray-700">
            All Counsel data is version-controlled alongside your code
          </p>
        </div>
      </div>
    </div>

    <div id="design-philosophy" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Design Philosophy</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">AI-First Design</h3>
          <p className="text-gray-700">
            Every component is designed to work seamlessly with AI assistants,
            providing structured contexts and clear interaction patterns.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">File-Based Storage</h3>
          <p className="text-gray-700">
            Human-readable files (Markdown, JSON) ensure transparency, version
            control compatibility, and easy debugging.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Modular Architecture</h3>
          <p className="text-gray-700">
            Loosely coupled components allow for easy extension and
            customization without breaking existing workflows.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Developer Experience</h3>
          <p className="text-gray-700">
            Intuitive commands, clear documentation, and helpful error messages
            prioritize developer productivity.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Examples Section Content
export const ExamplesSection: React.FC = () => (
  <div className="space-y-8">
    <div id="feature-workflow-example" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Feature Development Workflow</h2>
      <p className="text-gray-700 mb-4">
        Complete example of developing a user authentication feature using
        Counsel.
      </p>

      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Step 1: Create Feature</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>counsel add feature user-authentication --priority high</code>
          </pre>
          <p className="text-sm text-gray-600">
            Creates .counsel/.features/user-authentication/ directory with
            initial files
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Step 2: Gather Requirements</h3>
          <p className="text-sm text-gray-700 mb-2">
            In your AI assistant (Claude/Cursor):
          </p>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-feature-specs</code>
          </pre>
          <p className="text-sm text-gray-600">
            AI guides you through defining user stories and acceptance criteria
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Step 3: Create Design</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-feature-plan</code>
          </pre>
          <p className="text-sm text-gray-600">
            AI helps create technical design and architecture decisions
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Step 4: Implement</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-feature-code</code>
          </pre>
          <p className="text-sm text-gray-600">
            AI assists with code implementation following the design
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Step 5: Track Progress</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>counsel status feature user-authentication</code>
          </pre>
          <p className="text-sm text-gray-600">
            Check current status and next steps
          </p>
        </div>
      </div>
    </div>

    <div id="script-creation-example" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Script Creation Example</h2>
      <p className="text-gray-700 mb-4">
        Example of creating a database backup script using Script mode.
      </p>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Create Script</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>
              counsel add script db-backup --description &quot;Automated
              database backup utility&quot;
            </code>
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Define Requirements</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-feature-specs</code>
          </pre>
          <p className="text-sm text-gray-600">
            Specify backup frequency, storage location, error handling
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Implement Script</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-feature-code</code>
          </pre>
          <p className="text-sm text-gray-600">
            AI helps write the backup script with proper error handling
          </p>
        </div>
      </div>
    </div>

    <div id="debug-workflow-example" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Debug Workflow Example</h2>
      <p className="text-gray-700 mb-4">
        Example of investigating a memory leak using Debug mode.
      </p>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Create Debug Item</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>counsel add debug memory-leak --priority high</code>
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Investigate Issue</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-feature-scope</code>
          </pre>
          <p className="text-sm text-gray-600">
            AI helps analyze code and identify potential memory leak sources
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Deep Dive Analysis</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-reload</code>
          </pre>
          <p className="text-sm text-gray-600">
            Get detailed understanding of memory management in the codebase
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Implement Fix</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>/counsel-feature-code</code>
          </pre>
          <p className="text-sm text-gray-600">
            AI assists with implementing the memory leak fix
          </p>
        </div>
      </div>
    </div>

    <div id="integration-examples" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Integration Examples</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Linear Integration</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>
              # Sync feature to Linear issue{"\n"}counsel add feature user-auth
              --linear-sync{"\n"}
              {"\n"}# Update Linear issue status{"\n"}counsel status feature
              user-auth --update-linear
            </code>
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">ChromaDB Search</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mb-2">
            <code>
              # Semantic code search{"\n"}counsel search &quot;authentication
              middleware&quot;{"\n"}
              {"\n"}# Find similar implementations{"\n"}counsel search --similar
              auth.js
            </code>
          </pre>
        </div>
      </div>
    </div>

    <div id="best-practices" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Best Practices</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Naming Conventions</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>
              Use kebab-case for item names: <code>user-authentication</code>
            </li>
            <li>
              Be descriptive but concise: <code>api-rate-limiting</code>
            </li>
            <li>
              Include context when needed: <code>frontend-login-form</code>
            </li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Documentation</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Always start with clear specs before implementation</li>
            <li>Update status regularly to track progress</li>
            <li>Document decisions and trade-offs in design files</li>
            <li>Include examples and usage instructions</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">AI Collaboration</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Use slash commands to maintain context across sessions</li>
            <li>Provide clear, specific prompts to the AI assistant</li>
            <li>Review and validate AI-generated code before implementation</li>
            <li>Iterate on specs and design with AI feedback</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Project Organization</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Use appropriate modes for different types of work</li>
            <li>Keep related items grouped and cross-referenced</li>
            <li>Regular cleanup of completed items</li>
            <li>Backup .counsel directory with your code</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// Development Section Content
export const DevelopmentSection: React.FC = () => (
  <div className="space-y-6">
    <div id="development-setup" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Development Setup</h2>
      <p className="text-gray-700 mb-4">
        Set up your development environment to contribute to the Counsel
        Framework.
      </p>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Clone Repository</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            <code>
              git clone https://github.com/ammon-nakosi/counsel-framework.git
              {"\n"}cd counsel-framework
            </code>
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Install Dependencies</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            <code>
              npm install{"\n"}
              {"\n"}# Install CLI globally for testing{"\n"}npm link
            </code>
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Run Tests</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            <code>
              npm test{"\n"}
              {"\n"}# Run tests in watch mode{"\n"}npm run test:watch
            </code>
          </pre>
        </div>
      </div>
    </div>

    <div id="codebase-structure" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Codebase Structure</h2>

      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto mb-4">
        <code>{`counsel/
├── cli/                      # CLI implementation
│   ├── src/
│   │   ├── commands/        # CLI command implementations
│   │   ├── services/        # Integration services
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── package.json
├── commands/                 # Slash command definitions
├── docs/                    # Framework documentation
├── web/                     # Web interface
└── scripts/                 # Build and deployment scripts`}</code>
      </pre>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Key Principles</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>TypeScript for type safety and better developer experience</li>
            <li>Modular architecture with clear separation of concerns</li>
            <li>Comprehensive testing with Jest and integration tests</li>
            <li>File-based storage for transparency and version control</li>
          </ul>
        </div>
      </div>
    </div>

    <div id="contribution-guidelines" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Contribution Guidelines</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Code Style</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Follow existing TypeScript and ESLint configurations</li>
            <li>Use meaningful variable and function names</li>
            <li>Add JSDoc comments for public APIs</li>
            <li>Keep functions small and focused</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Pull Request Process</h3>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Fork the repository and create a feature branch</li>
            <li>Make your changes with appropriate tests</li>
            <li>Ensure all tests pass and code follows style guidelines</li>
            <li>Update documentation if needed</li>
            <li>Submit pull request with clear description</li>
          </ol>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Commit Messages</h3>
          <p className="text-sm text-gray-700 mb-2">
            Use conventional commit format:
          </p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            <code>
              type(scope): description{"\n"}
              {"\n"}feat(cli): add new search command{"\n"}fix(integration):
              resolve Linear API timeout{"\n"}docs(readme): update installation
              instructions
            </code>
          </pre>
        </div>
      </div>
    </div>

    <div id="testing-guidelines" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Testing Guidelines</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Unit Tests</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Test all public functions and methods</li>
            <li>Mock external dependencies and integrations</li>
            <li>Use descriptive test names that explain the scenario</li>
            <li>Aim for 90%+ code coverage</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Integration Tests</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Test CLI commands end-to-end</li>
            <li>Verify file system operations</li>
            <li>Test integration with external services (with mocks)</li>
            <li>Validate error handling and edge cases</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Test Structure</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
            <code>
              describe(&apos;Command Name&apos;, () =&gt; {"{"}
              beforeEach(() =&gt; {"{"}
              {"//"} Setup test environment
              {"}"}); it(&apos;should handle valid input correctly&apos;, ()
              =&gt; {"{"}
              {"//"} Test implementation
              {"}"}); it(&apos;should throw error for invalid input&apos;, ()
              =&gt; {"{"}
              {"//"} Error case testing
              {"}"});
              {"}"});
            </code>
          </pre>
        </div>
      </div>
    </div>

    <div id="release-process" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Release Process</h2>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Version Management</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Follow semantic versioning (semver)</li>
            <li>Update CHANGELOG.md with release notes</li>
            <li>Tag releases with version numbers</li>
            <li>Maintain backward compatibility for minor versions</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Release Steps</h3>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Run full test suite and ensure all tests pass</li>
            <li>Update version numbers in package.json files</li>
            <li>Update documentation and changelog</li>
            <li>Create release tag and push to repository</li>
            <li>Publish to npm registry</li>
            <li>Deploy documentation updates</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
);
