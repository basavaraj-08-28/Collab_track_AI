/**
 * Code Execution Service for Collab Track AI IDE
 * Supports:
 * 1. Web Apps (HTML/CSS/JS in sandboxed iframe)
 * 2. Multi-language Polyglot Execution (Python, Java, C++, C, JavaScript, Go, Rust) via Piston API
 */

export const SUPPORTED_LANGUAGES = [
  {
    id: 'web',
    name: 'Web App (HTML/CSS/JS)',
    category: 'web',
    monacoLang: 'html',
    fileExt: 'html',
    defaultFiles: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Collab Track AI Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <div class="badge">🚀 Collab Track AI</div>
    <h1>Welcome to your Web Workspace</h1>
    <p>Build your student team project live in your browser.</p>
    <button id="counter-btn" class="btn">Clicks: 0</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      'style.css': `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: #1e293b;
}

.card {
  background: white;
  padding: 2.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 420px;
  text-align: center;
}

.badge {
  display: inline-block;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: #0f172a;
}

p {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1.75rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #4338ca;
  transform: translateY(-1px);
}`,
      'script.js': `// Interactive Client Script
let count = 0;
const btn = document.getElementById('counter-btn');

btn.addEventListener('click', () => {
  count++;
  btn.textContent = \`Clicks: \${count}\`;
  console.log(\`[Collab Track AI] Button clicked: \${count} time(s)\`);
});

console.log('Collab Track Web Project initialized successfully!');`
    }
  },
  {
    id: 'python',
    name: 'Python 3',
    category: 'backend',
    monacoLang: 'python',
    fileExt: 'py',
    pistonLang: 'python',
    pistonVersion: '3.10.0',
    defaultFiles: {
      'main.py': `# Collab Track AI - Python Workspace
# Build algorithms, data science scripts, and backend tasks

def compute_collaboration_metrics(student_name, tasks_completed, total_tasks):
    rate = (tasks_completed / total_tasks) * 100 if total_tasks > 0 else 0
    return {
        "student": student_name,
        "completed": tasks_completed,
        "total": total_tasks,
        "rate": f"{rate:.1f}%",
        "status": "On Track" if rate >= 70 else "Needs Progress"
    }

if __name__ == "__main__":
    team = [
        ("BYN", 8, 10),
        ("Alex", 9, 10),
        ("Jordan", 5, 10)
    ]
    
    print("=== COLLAB TRACK AI TEAM METRICS ===")
    for name, done, total in team:
        res = compute_collaboration_metrics(name, done, total)
        print(f"• {res['student']}: {res['completed']}/{res['total']} ({res['rate']}) - {res['status']}")
`
    }
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    category: 'backend',
    monacoLang: 'javascript',
    fileExt: 'js',
    pistonLang: 'javascript',
    pistonVersion: '18.15.0',
    defaultFiles: {
      'index.js': `// Collab Track AI - Node.js Script
console.log("=== Collab Track AI Node.js Workspace ===");

const sprintGoals = [
  { id: 1, title: "Design System Architecture", points: 8, done: true },
  { id: 2, title: "Database Schema Migrations", points: 5, done: true },
  { id: 3, title: "Collaborative AI IDE Integration", points: 13, done: false }
];

const completedPoints = sprintGoals
  .filter(g => g.done)
  .reduce((acc, g) => acc + g.points, 0);

const totalPoints = sprintGoals.reduce((acc, g) => acc + g.points, 0);
const progress = ((completedPoints / totalPoints) * 100).toFixed(1);

console.log(\`Sprint Progress: \${completedPoints}/\${totalPoints} pts (\${progress}%)\`);
`
    }
  },
  {
    id: 'cpp',
    name: 'C++ (GCC)',
    category: 'backend',
    monacoLang: 'cpp',
    fileExt: 'cpp',
    pistonLang: 'c++',
    pistonVersion: '10.2.0',
    defaultFiles: {
      'main.cpp': `// Collab Track AI - C++ High-Performance Workspace
#include <iostream>
#include <vector>
#include <string>
#include <numeric>

struct TeamMember {
    std::string name;
    int tasksCompleted;
    int score;
};

int main() {
    std::cout << "=== Collab Track AI C++ Workspace ===" << std::endl;
    
    std::vector<TeamMember> team = {
        {"BYN", 8, 92},
        {"Alex", 9, 95},
        {"Jordan", 6, 80}
    };

    double totalScore = 0;
    for (const auto& member : team) {
        std::cout << "Member: " << member.name 
                  << " | Tasks: " << member.tasksCompleted 
                  << " | Score: " << member.score << "/100" << std::endl;
        totalScore += member.score;
    }

    std::cout << "-----------------------------------" << std::endl;
    std::cout << "Team Average Score: " << (totalScore / team.size()) << "/100" << std::endl;
    return 0;
}
`
    }
  },
  {
    id: 'c',
    name: 'C (GCC)',
    category: 'backend',
    monacoLang: 'c',
    fileExt: 'c',
    pistonLang: 'c',
    pistonVersion: '10.2.0',
    defaultFiles: {
      'main.c': `// Collab Track AI - C Workspace
#include <stdio.h>

int main() {
    printf("=== Collab Track AI C Workspace ===\\n");
    printf("All systems operational.\\n");
    
    int milestone = 4;
    int totalMilestones = 5;
    float progress = ((float)milestone / totalMilestones) * 100.0;
    
    printf("Project Progress: %.1f%% completed\\n", progress);
    return 0;
}
`
    }
  },
  {
    id: 'java',
    name: 'Java (OpenJDK)',
    category: 'backend',
    monacoLang: 'java',
    fileExt: 'java',
    pistonLang: 'java',
    pistonVersion: '15.0.2',
    defaultFiles: {
      'Main.java': `// Collab Track AI - Java Workspace
import java.util.ArrayList;
import java.util.List;

public class Main {
    static class ProjectTask {
        String title;
        boolean completed;

        ProjectTask(String title, boolean completed) {
            this.title = title;
            this.completed = completed;
        }
    }

    public static void main(String[] args) {
        System.out.println("=== Collab Track AI Java Workspace ===");

        List<ProjectTask> tasks = new ArrayList<>();
        tasks.add(new ProjectTask("Setup Environment", true));
        tasks.add(new ProjectTask("Build Frontend UI", true));
        tasks.add(new ProjectTask("Implement Cloud Backend", true));
        tasks.add(new ProjectTask("AI Code Intelligence", false));

        long completed = tasks.stream().filter(t -> t.completed).count();
        double pct = ((double) completed / tasks.size()) * 100;

        System.out.printf("Team Velocity: %d/%d tasks (%.1f%%)%n", completed, tasks.size(), pct);
    }
}
`
    }
  }
];

/**
 * Execute code using Piston open-source runner API
 */
export async function executeBackendCode(languageId, files, stdin = '') {
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === languageId);
  if (!langConfig || !langConfig.pistonLang) {
    throw new Error(`Execution not supported for language: ${languageId}`);
  }

  const payloadFiles = Object.entries(files).map(([name, content]) => ({
    name,
    content
  }));

  const payload = {
    language: langConfig.pistonLang,
    version: langConfig.pistonVersion || '*',
    files: payloadFiles,
    stdin: stdin || '',
    args: [],
    compile_timeout: 10000,
    run_timeout: 5000
  };

  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Execution service responded with status ${response.status}`);
  }

  const data = await response.json();
  const compile = data.compile || {};
  const run = data.run || {};

  let output = '';
  let isError = false;

  if (compile.stderr) {
    output += `[Compilation Error]:\n${compile.stderr}\n`;
    isError = true;
  } else if (compile.output) {
    output += `${compile.output}\n`;
  }

  if (run.stdout) {
    output += run.stdout;
  }
  if (run.stderr) {
    output += (output ? '\n' : '') + `[Runtime Error]:\n${run.stderr}`;
    isError = true;
  }
  if (!output && run.output) {
    output = run.output;
  }

  return {
    output: output || 'Program finished with no output.',
    exitCode: run.code ?? compile.code ?? 0,
    isError
  };
}

/**
 * Bundle HTML, CSS, JS into a sandboxed live preview document
 */
export function buildWebPreviewDoc(files) {
  const html = files['index.html'] || '<p>No index.html found</p>';
  const css = files['style.css'] || '';
  const js = files['script.js'] || '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${css}
  </style>
  <script>
    // Intercept console.log and errors for parent message passing
    window.onerror = function(msg, url, line) {
      window.parent.postMessage({ type: 'IDE_CONSOLE', level: 'error', message: msg + ' (Line ' + line + ')' }, '*');
      return false;
    };
    const _origLog = console.log;
    console.log = function(...args) {
      _origLog.apply(console, args);
      window.parent.postMessage({ type: 'IDE_CONSOLE', level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
    };
    const _origErr = console.error;
    console.error = function(...args) {
      _origErr.apply(console, args);
      window.parent.postMessage({ type: 'IDE_CONSOLE', level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
    };
  </script>
</head>
<body>
  ${html}
  <script>
    try {
      ${js}
    } catch(err) {
      console.error(err.message);
    }
  </script>
</body>
</html>`;
}

