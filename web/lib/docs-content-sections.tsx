import React from 'react';
import { counselModes, cliCommands, slashCommands } from './docs-content';

// Overview Section Content
export const OverviewSection: React.FC = () => (
  <div className="space-y-6">
    <div id="what-is-woolly" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">What is Woolly?</h2>
      <p className="text-gray-700 mb-4">
        Woolly is a comprehensive framework designed to enhance AI-assisted development workflows. 
        It provides structured approaches to feature development, debugging, code review, and experimentation, 
        making it easier to collaborate with AI assistants like Claude and Cursor IDE.
      </p>
      <p className="text-gray-700 mb-4">
        The framework organizes development work into five distinct modes, each optimized for different 
        types of tasks. Whether you&apos;re building new features, debugging issues, or exploring new ideas, 
        Woolly provides the structure and tools to make your AI-assisted development more effective.
      </p>
    </div>

    <div id="key-features" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Key Features</h2>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li><strong>Structured Workflows:</strong> Five specialized modes for different development scenarios</li>
        <li><strong>AI Integration:</strong> Optimized for Claude, Cursor IDE, and other AI assistants</li>
        <li><strong>Progress Tracking:</strong> Built-in status tracking and project management</li>
        <li><strong>Semantic Search:</strong> ChromaDB integration for intelligent code scope</li>
        <li><strong>Issue Management:</strong> Linear integration for seamless project tracking</li>
        <li><strong>Version Control:</strong> Git integration for backup and synchronization</li>
        <li><strong>Cross-Platform:</strong> Works on macOS, Linux, and Windows</li>
      </ul>
    </div>

    <div id="supported-modes" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Supported Modes</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {counselModes.map((mode) => (
          <div key={mode.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-2">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 bg-${mode.id === 'feature' ? 'blue' : mode.id === 'script' ? 'green' : mode.id === 'prompt' ? 'purple' : 'yellow'}-500`}></span>
              <h3 className="font-semibold">{mode.name}</h3>
            </div>
            <p className="text-sm text-gray-600">{mode.description}</p>
          </div>
        ))}
      </div>
    </div>

    <div id="integrations-overview" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Integrations</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">ChromaDB</h3>
          <p className="text-sm text-gray-600">Vector database for semantic code search and AI-powered scope</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Linear</h3>
          <p className="text-sm text-gray-600">Issue tracking integration for seamless project management</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Git</h3>
          <p className="text-sm text-gray-600">Version control integration for backup and synchronization</p>
        </div>
      </div>
    </div>
  </div>
);

// Getting Started Section Content
export const GettingStartedSection: React.FC = () => (
  <div className="space-y-6">
    <div id="prerequisites" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
      <p className="text-gray-700 mb-4">Before installing Woolly, ensure you have the following prerequisites:</p>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li><strong>Node.js:</strong> Version 18.0 or higher</li>
        <li><strong>npm or yarn:</strong> For package management</li>
        <li><strong>Git:</strong> For version control integration</li>
        <li><strong>Python 3.8+:</strong> Required for ChromaDB integration (optional)</li>
        <li><strong>AI Assistant:</strong> Claude API access or Cursor IDE</li>
      </ul>
    </div>

    <div id="installation" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Installation</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Install via npm</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>npm install -g woolly-framework</code>
          </pre>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Install via yarn</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>yarn global add woolly-framework</code>
          </pre>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Verify Installation</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>woolly --version</code>
          </pre>
        </div>
      </div>
    </div>

    <div id="initial-setup" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Initial Setup</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Initialize Woolly in your project</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>cd your-project-directory{'\n'}woolly init</code>
          </pre>
          <p className="text-sm text-gray-600 mt-2">
            This creates a <code>.woolly</code> directory with configuration files and sets up the basic structure.
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Configure integrations (optional)</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code># Set up ChromaDB integration{'\n'}woolly init --chromadb-url http://localhost:8000{'\n'}{'\n'}# Set up Linear integration{'\n'}woolly init --linear-api-key your_api_key{'\n'}{'\n'}# Enable Git backup{'\n'}woolly init --git-backup</code>
          </pre>
        </div>
      </div>
    </div>

    <div id="first-steps" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">First Steps</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Create your first feature</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>woolly add feature user-authentication</code>
          </pre>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Check status</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>woolly status</code>
          </pre>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Start working with AI assistant</h3>
          <p className="text-gray-700 mb-2">Use slash commands in your AI assistant:</p>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
            <code>/woolly-feature-specs</code>
          </pre>
        </div>
      </div>
    </div>
  </div>
);

// Woolly Modes Section Content
export const CounselModesSection: React.FC = () => (
  <div className="space-y-8">
    {counselModes.map((mode) => (
      <div key={mode.id} id={`${mode.id}-mode`} className="scroll-mt-20">
        <div className="flex items-center mb-4">
          <span className={`inline-block w-4 h-4 rounded-full mr-3 bg-${mode.id === 'feature' ? 'blue' : mode.id === 'script' ? 'green' : mode.id === 'prompt' ? 'purple' : 'yellow'}-500`}></span>
          <h2 className="text-2xl font-bold">{mode.name}</h2>
        </div>
        
        <p className="text-gray-700 mb-4">{mode.description}</p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold mb-3">Purpose</h3>
            <p className="text-gray-700 mb-4">{mode.purpose}</p>
            
            <h3 className="text-lg font-semibold mb-3">Directory Structure</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{mode.directoryStructure.join('\n')}</code>
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Workflow</h3>
            <ol className="list-decimal list-inside space-y-2">
              {mode.workflow.map((step) => (
                <li key={step.step} className="text-gray-700">
                  <strong>{step.title}:</strong> {step.description}
                  {step.commands && (
                    <div className="mt-1 ml-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {step.commands.join(', ')}
                      </code>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            
            <h3 className="text-lg font-semibold mb-3 mt-6">Use Cases</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {mode.useCases.map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// CLI Reference Section Content
export const CLIReferenceSection: React.FC = () => (
  <div className="space-y-6">
    <div id="cli-overview" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">CLI Overview</h2>
      <p className="text-gray-700 mb-4">
        The Woolly CLI provides programmatic access to all framework functionality. 
        Use these commands to manage your projects, track progress, and integrate with external tools.
      </p>
      <p className="text-gray-700 mb-4">
        All CLI commands follow the pattern: <code className="bg-gray-100 px-2 py-1 rounded">woolly &lt;command&gt; [options]</code>
      </p>
    </div>

    <div id="core-commands" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Core Commands</h2>
      <div className="space-y-6">
        {cliCommands.map((command) => (
          <div key={command.name} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{command.name}</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">CLI</span>
            </div>
            
            <p className="text-gray-700 mb-4">{command.description}</p>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Syntax</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{command.syntax}</code>
              </pre>
            </div>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Examples</h4>
              <div className="space-y-2">
                {command.examples.map((example, index) => (
                  <div key={index}>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      <code>{example.command}</code>
                    </pre>
                    <p className="text-sm text-gray-600 mt-1">{example.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {command.options && command.options.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Options</h4>
                <div className="space-y-2">
                  {command.options.map((option, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{option.name}</code>
                      <div>
                        <p className="text-sm text-gray-700">{option.description}</p>
                        {option.default && (
                          <p className="text-xs text-gray-500">Default: {option.default}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div id="cli-troubleshooting" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">CLI Troubleshooting</h2>
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Command not found</h3>
          <p className="text-gray-700 mb-2">If you get &quot;woolly: command not found&quot;:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Ensure Woolly is installed globally: <code>npm install -g woolly-framework</code></li>
            <li>Check your PATH includes npm global binaries</li>
            <li>Try restarting your terminal</li>
          </ul>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Permission errors</h3>
          <p className="text-gray-700 mb-2">If you encounter permission errors:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Ensure you have write permissions in the project directory</li>
            <li>Check that .woolly directory is not read-only</li>
            <li>On Unix systems, verify file ownership and permissions</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// Slash Commands Section Content
export const SlashCommandsSection: React.FC = () => (
  <div className="space-y-6">
    <div id="slash-overview" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Slash Commands Overview</h2>
      <p className="text-gray-700 mb-4">
        Slash commands are interactive workflows designed for use with AI assistants like Claude and Cursor IDE. 
        They provide structured prompts and guidance for common development tasks.
      </p>
      <p className="text-gray-700 mb-4">
        Simply type the slash command in your AI assistant chat to start the interactive workflow. 
        The AI will guide you through the process step by step.
      </p>
    </div>

    <div id="workflow-commands" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Workflow Commands</h2>
      <div className="space-y-6">
        {slashCommands.filter(cmd => ['specs', 'plan', 'code', 'scope', 'ramp-up'].some(type => cmd.name.includes(type))).map((command) => (
          <div key={command.name} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{command.name}</h3>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Slash</span>
            </div>
            
            <p className="text-gray-700 mb-4">{command.description}</p>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Usage</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{command.syntax}</code>
              </pre>
            </div>
            
            <div className="space-y-2">
              {command.examples.map((example, index) => (
                <div key={index}>
                  <p className="text-sm text-gray-700">{example.description}</p>
                  {example.output && (
                    <p className="text-xs text-gray-500 italic mt-1">{example.output}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div id="status-commands" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">Status Commands</h2>
      <div className="space-y-6">
        {slashCommands.filter(cmd => ['status', 'update', 'create'].some(type => cmd.name.includes(type))).map((command) => (
          <div key={command.name} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{command.name}</h3>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Slash</span>
            </div>
            
            <p className="text-gray-700 mb-4">{command.description}</p>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Usage</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                <code>{command.syntax}</code>
              </pre>
            </div>
            
            <div className="space-y-2">
              {command.examples.map((example, index) => (
                <div key={index}>
                  <p className="text-sm text-gray-700">{example.description}</p>
                  {example.output && (
                    <p className="text-xs text-gray-500 italic mt-1">{example.output}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div id="ai-assistant-compatibility" className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4">AI Assistant Compatibility</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Claude (Anthropic)</h3>
          <p className="text-sm text-gray-700 mb-2">Full support for all slash commands</p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            <li>Interactive workflow guidance</li>
            <li>Context-aware responses</li>
            <li>Code generation and review</li>
            <li>Multi-turn conversations</li>
          </ul>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Cursor IDE</h3>
          <p className="text-sm text-gray-700 mb-2">Optimized for code editing workflows</p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            <li>Direct code modification</li>
            <li>File-based operations</li>
            <li>Integrated terminal commands</li>
            <li>Project-aware assistance</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);